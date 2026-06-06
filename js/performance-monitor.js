// Performance monitoring and optimization
// Tracks Core Web Vitals and provides optimization suggestions

class PerformanceMonitor {
    constructor() {
        this.metrics = {
            LCP: null, // Largest Contentful Paint
            FID: null, // First Input Delay
            CLS: null, // Cumulative Layout Shift
            FCP: null, // First Contentful Paint
            TTFB: null // Time to First Byte
        };
        
        this.thresholds = {
            LCP: { good: 2500, poor: 4000 },
            FID: { good: 100, poor: 300 },
            CLS: { good: 0.1, poor: 0.25 },
            FCP: { good: 1800, poor: 3000 },
            TTFB: { good: 800, poor: 1800 }
        };
        
        this.init();
    }

    init() {
        // Track Core Web Vitals if supported
        if ('PerformanceObserver' in window) {
            this.setupPerformanceObservers();
        }
        
        // Track page load time
        this.trackPageLoad();
        
        // Track resource loading
        this.trackResources();
        
        // Provide optimization suggestions
        this.provideSuggestions();
    }

    setupPerformanceObservers() {
        // LCP Observer
        const lcpObserver = new PerformanceObserver((entryList) => {
            const entries = entryList.getEntries();
            const lastEntry = entries[entries.length - 1];
            this.metrics.LCP = lastEntry.startTime;
            this.logMetric('LCP', this.metrics.LCP);
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

        // FID Observer
        const fidObserver = new PerformanceObserver((entryList) => {
            const entries = entryList.getEntries();
            entries.forEach(entry => {
                this.metrics.FID = entry.processingStart - entry.startTime;
                this.logMetric('FID', this.metrics.FID);
            });
        });
        fidObserver.observe({ entryTypes: ['first-input'] });

        // CLS Observer
        let clsValue = 0;
        const clsObserver = new PerformanceObserver((entryList) => {
            for (const entry of entryList.getEntries()) {
                if (!entry.hadRecentInput) {
                    clsValue += entry.value;
                }
            }
            this.metrics.CLS = clsValue;
            this.logMetric('CLS', this.metrics.CLS);
        });
        clsObserver.observe({ entryTypes: ['layout-shift'] });

        // FCP Observer
        const fcpObserver = new PerformanceObserver((entryList) => {
            const entries = entryList.getEntries();
            this.metrics.FCP = entries[0].startTime;
            this.logMetric('FCP', this.metrics.FCP);
        });
        fcpObserver.observe({ entryTypes: ['paint'] });
    }

    trackPageLoad() {
        window.addEventListener('load', () => {
            const timing = performance.timing;
            this.metrics.TTFB = timing.responseStart - timing.requestStart;
            this.logMetric('TTFB', this.metrics.TTFB);
            
            // Log overall page load time
            const loadTime = Math.max(0, timing.loadEventEnd - timing.navigationStart);
            if (loadTime > 0) {
                console.log(`Page loaded in ${loadTime}ms`);
            }
            
            // Send to analytics if available
            if (typeof gtag !== 'undefined') {
                gtag('event', 'timing_complete', {
                    name: 'page_load',
                    value: loadTime,
                    event_category: 'Performance'
                });
            }
        });
    }

    trackResources() {
        const resources = performance.getEntriesByType('resource');
        const largeResources = resources.filter(r => r.transferSize > 100000); // > 100KB
        
        if (largeResources.length > 0) {
            console.warn('Large resources detected:', largeResources.map(r => ({
                name: r.name,
                size: Math.round(r.transferSize / 1024) + 'KB',
                duration: Math.round(r.duration) + 'ms'
            })));
            
            // Provide optimization suggestions
            this.suggestResourceOptimizations(largeResources);
        }
    }

    suggestResourceOptimizations(resources) {
        const suggestions = [];
        
        resources.forEach(resource => {
            const url = resource.name;
            
            if (url.includes('.jpg') || url.includes('.png')) {
                suggestions.push({
                    resource: url,
                    suggestion: 'Consider converting to WebP format for better compression',
                    potentialSavings: '50-80% file size reduction'
                });
            }
            
            if (url.includes('.mp4')) {
                suggestions.push({
                    resource: url,
                    suggestion: 'Add poster attribute and preload="none" to video tags',
                    potentialSavings: 'Reduced initial load time'
                });
            }
            
            if (url.includes('.js') && !url.includes('min.')) {
                suggestions.push({
                    resource: url,
                    suggestion: 'Minify JavaScript files',
                    potentialSavings: '30-50% file size reduction'
                });
            }
            
            if (url.includes('.css') && !url.includes('min.')) {
                suggestions.push({
                    resource: url,
                    suggestion: 'Minify CSS files',
                    potentialSavings: '20-40% file size reduction'
                });
            }
        });
        
        if (suggestions.length > 0) {
            console.log('Performance optimization suggestions:', suggestions);
            
            // Store for potential dashboard display
            this.optimizationSuggestions = suggestions;
        }
    }

    logMetric(name, value) {
        const threshold = this.thresholds[name];
        let status = 'good';
        
        if (value > threshold.poor) {
            status = 'poor';
        } else if (value > threshold.good) {
            status = 'needs improvement';
        }
        
        console.log(`${name}: ${Math.round(value)}ms (${status})`);
        
        // Send to analytics
        if (typeof gtag !== 'undefined') {
            gtag('event', 'core_web_vital', {
                metric_name: name.toLowerCase(),
                metric_value: Math.round(value),
                metric_status: status,
                event_category: 'Performance'
            });
        }
    }

    provideSuggestions() {
        const suggestions = [];
        
        // Check for common performance issues
        const images = document.querySelectorAll('img');
        images.forEach(img => {
            if (!img.loading && !img.src.includes('data:')) {
                suggestions.push({
                    type: 'image',
                    element: img,
                    suggestion: 'Add loading="lazy" attribute for below-the-fold images'
                });
            }
            
            if (!img.decoding) {
                suggestions.push({
                    type: 'image',
                    element: img,
                    suggestion: 'Add decoding="async" attribute for better parallel loading'
                });
            }
        });
        
        // Check for unoptimized videos
        const videos = document.querySelectorAll('video');
        videos.forEach(video => {
            if (!video.preload || video.preload === 'auto') {
                suggestions.push({
                    type: 'video',
                    element: video,
                    suggestion: 'Add preload="none" or preload="metadata" to reduce initial load'
                });
            }
            
            if (!video.poster && video.src.includes('.mp4')) {
                suggestions.push({
                    type: 'video',
                    element: video,
                    suggestion: 'Add poster attribute with thumbnail image'
                });
            }
        });
        
        // Check for render-blocking resources
        const stylesheets = document.querySelectorAll('link[rel="stylesheet"]');
        stylesheets.forEach(link => {
            if (!link.media || link.media === 'all') {
                suggestions.push({
                    type: 'stylesheet',
                    element: link,
                    suggestion: 'Consider adding media attributes or loading non-critical CSS asynchronously'
                });
            }
        });
        
        if (suggestions.length > 0) {
            console.log('Performance improvement suggestions:', suggestions);
            return suggestions;
        }
        
        return [];
    }

    getPerformanceScore() {
        let score = 100;
        let deductions = [];
        
        Object.keys(this.metrics).forEach(metric => {
            if (this.metrics[metric] !== null) {
                const threshold = this.thresholds[metric];
                const value = this.metrics[metric];
                
                if (value > threshold.poor) {
                    score -= 20;
                    deductions.push(`${metric}: Poor (${Math.round(value)}ms)`);
                } else if (value > threshold.good) {
                    score -= 10;
                    deductions.push(`${metric}: Needs improvement (${Math.round(value)}ms)`);
                }
            }
        });
        
        return {
            score: Math.max(0, score),
            deductions: deductions,
            metrics: this.metrics
        };
    }

    // Public API
    static getInstance() {
        if (!PerformanceMonitor.instance) {
            PerformanceMonitor.instance = new PerformanceMonitor();
        }
        return PerformanceMonitor.instance;
    }
}

// Initialize performance monitor
const performanceMonitor = PerformanceMonitor.getInstance();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PerformanceMonitor;
}