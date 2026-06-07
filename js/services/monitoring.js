/**
 * Monitoring Service for IKON Platform
 * Provides centralized error tracking, performance monitoring, and system health checks
 */

import { CONFIG } from '../config.js';
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

export const MonitoringService = (function() {
    let supabaseClient = null;
    let errorBuffer = [];
    const MAX_BUFFER_SIZE = 10;
    const FLUSH_INTERVAL = 30000; // 30 seconds
    
    // Initialize monitoring service
    function init() {
        try {
            supabaseClient = createClient(CONFIG.SUPABASE.URL, CONFIG.SUPABASE.ANON_KEY);
            console.log('Monitoring service initialized');
            
            // Set up periodic flush
            setInterval(flushErrorBuffer, FLUSH_INTERVAL);
            
            // Track page performance
            trackPerformance();
            
            // Set up global error handlers
            setupGlobalErrorHandlers();
            
            return true;
        } catch (error) {
            console.error('Failed to initialize monitoring service:', error);
            return false;
        }
    }
    
    // Track performance metrics
    function trackPerformance() {
        if ('PerformanceObserver' in window) {
            // Track Largest Contentful Paint
            const lcpObserver = new PerformanceObserver((entryList) => {
                const entries = entryList.getEntries();
                const lastEntry = entries[entries.length - 1];
                trackMetric('lcp', lastEntry.startTime);
            });
            lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
            
            // Track First Input Delay
            const fidObserver = new PerformanceObserver((entryList) => {
                const entries = entryList.getEntries();
                entries.forEach(entry => {
                    trackMetric('fid', entry.processingStart - entry.startTime);
                });
            });
            fidObserver.observe({ type: 'first-input', buffered: true });
            
            // Track Cumulative Layout Shift
            let clsValue = 0;
            let clsEntries = [];
            
            const clsObserver = new PerformanceObserver((entryList) => {
                for (const entry of entryList.getEntries()) {
                    if (!entry.hadRecentInput) {
                        clsEntries.push(entry);
                        clsValue += entry.value;
                    }
                }
            });
            
            clsObserver.observe({ type: 'layout-shift', buffered: true });
            
            // Report CLS on visibility change
            document.addEventListener('visibilitychange', () => {
                if (document.visibilityState === 'hidden') {
                    trackMetric('cls', clsValue);
                }
            });
        }
    }
    
    // Set up global error handlers
    function setupGlobalErrorHandlers() {
        // Global error handler
        window.addEventListener('error', (event) => {
            trackError({
                type: 'global_error',
                message: event.message,
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno,
                stack: event.error?.stack
            });
        });
        
        // Unhandled promise rejection handler
        window.addEventListener('unhandledrejection', (event) => {
            trackError({
                type: 'unhandled_rejection',
                message: event.reason?.message || 'Unhandled promise rejection',
                stack: event.reason?.stack
            });
        });
        
        // Network error tracking
        if ('PerformanceObserver' in window) {
            const resourceObserver = new PerformanceObserver((list) => {
                list.getEntries().forEach(entry => {
                    if (entry.initiatorType !== 'navigation' && entry.duration > 5000) {
                        trackError({
                            type: 'slow_resource',
                            url: entry.name,
                            duration: entry.duration,
                            initiatorType: entry.initiatorType
                        });
                    }
                });
            });
            resourceObserver.observe({ entryTypes: ['resource'] });
        }
    }
    
    // Track an error
    function trackError(errorData) {
        const errorEntry = {
            ...errorData,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            url: window.location.href,
            referrer: document.referrer
        };
        
        console.error('Tracked error:', errorEntry);
        
        // Add to buffer
        errorBuffer.push(errorEntry);
        
        // Flush if buffer is full
        if (errorBuffer.length >= MAX_BUFFER_SIZE) {
            flushErrorBuffer();
        }
        
        // Also send immediately for critical errors
        if (errorData.type === 'global_error' || errorData.type === 'unhandled_rejection') {
            sendErrorImmediately(errorEntry);
        }
    }
    
    // Track a performance metric
    function trackMetric(name, value) {
        const metricEntry = {
            type: 'performance_metric',
            name,
            value,
            timestamp: new Date().toISOString(),
            url: window.location.href
        };
        
        // Send to Supabase
        if (supabaseClient) {
            supabaseClient
                .from('performance_metrics')
                .insert([metricEntry])
                .then(({ error }) => {
                    if (error) console.error('Failed to track metric:', error);
                });
        }
    }
    
    // Flush error buffer to Supabase
    async function flushErrorBuffer() {
        if (errorBuffer.length === 0 || !supabaseClient) return;
        
        const errorsToSend = [...errorBuffer];
        errorBuffer = [];
        
        try {
            const { error } = await supabaseClient
                .from('error_logs')
                .insert(errorsToSend);
            
            if (error) {
                console.error('Failed to flush error buffer:', error);
                // Re-add errors to buffer if send failed
                errorBuffer.unshift(...errorsToSend);
                // Trim buffer if it gets too large
                if (errorBuffer.length > MAX_BUFFER_SIZE * 2) {
                    errorBuffer = errorBuffer.slice(0, MAX_BUFFER_SIZE);
                }
            } else {
                console.log(`Flushed ${errorsToSend.length} errors to database`);
            }
        } catch (error) {
            console.error('Error flushing buffer:', error);
            errorBuffer.unshift(...errorsToSend);
        }
    }
    
    // Send error immediately (for critical errors)
    async function sendErrorImmediately(errorEntry) {
        if (!supabaseClient) return;
        
        try {
            const { error } = await supabaseClient
                .from('error_logs')
                .insert([errorEntry]);
            
            if (error) {
                console.error('Failed to send immediate error:', error);
            }
        } catch (error) {
            console.error('Error sending immediate error:', error);
        }
    }
    
    // Check system health
    async function checkHealth() {
        const healthChecks = {
            supabase: false,
            clerk: false,
            api: false,
            timestamp: new Date().toISOString()
        };
        
        try {
            // Check Supabase
            if (supabaseClient) {
                const { error } = await supabaseClient
                    .from('site_settings')
                    .select('id')
                    .limit(1);
                
                healthChecks.supabase = !error;
            }
            
            // Check Clerk (if available)
            if (window.Clerk) {
                healthChecks.clerk = true;
            }
            
            // Check API endpoints
            try {
                const response = await fetch('/api/health', { method: 'HEAD' });
                healthChecks.api = response.ok;
            } catch {
                healthChecks.api = false;
            }
            
            // Log health check
            if (supabaseClient) {
                await supabaseClient
                    .from('health_checks')
                    .insert([healthChecks]);
            }
            
            return healthChecks;
        } catch (error) {
            console.error('Health check failed:', error);
            return healthChecks;
        }
    }
    
    // Get error statistics
    async function getErrorStats(days = 7) {
        if (!supabaseClient) return null;
        
        try {
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - days);
            
            const { data, error } = await supabaseClient
                .from('error_logs')
                .select('type, timestamp')
                .gte('timestamp', startDate.toISOString());
            
            if (error) throw error;
            
            const stats = {
                total: data.length,
                byType: {},
                byDay: {}
            };
            
            data.forEach(error => {
                // Count by type
                stats.byType[error.type] = (stats.byType[error.type] || 0) + 1;
                
                // Count by day
                const day = error.timestamp.split('T')[0];
                stats.byDay[day] = (stats.byDay[day] || 0) + 1;
            });
            
            return stats;
        } catch (error) {
            console.error('Failed to get error stats:', error);
            return null;
        }
    }
    
    return {
        init,
        trackError,
        trackMetric,
        checkHealth,
        getErrorStats,
        flushErrorBuffer
    };
})();