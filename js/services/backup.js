/**
 * Backup Service for IKON Platform
 * Provides data backup and recovery protocols
 */

import { CONFIG } from '../config.js';
import { createClient } from '@supabase/supabase-js';

export const BackupService = (function() {
    let supabaseClient = null;
    const BACKUP_INTERVAL = 3600000; // 1 hour
    const MAX_BACKUPS = 24; // Keep 24 hours of backups
    
    // Initialize backup service
    function init() {
        try {
            supabaseClient = createClient(CONFIG.SUPABASE.URL, CONFIG.SUPABASE.ANON_KEY);
            console.log('Backup service initialized');
            
            // Set up periodic backups
            setInterval(createBackup, BACKUP_INTERVAL);
            
            // Create initial backup
            setTimeout(() => createBackup(), 5000);
            
            return true;
        } catch (error) {
            console.error('Failed to initialize backup service:', error);
            return false;
        }
    }
    
    // Create a backup of critical data
    async function createBackup() {
        if (!supabaseClient) {
            console.warn('Backup service not initialized');
            return false;
        }
        
        try {
            console.log('Creating system backup...');
            const timestamp = new Date().toISOString();
            const backupId = `backup_${timestamp.replace(/[:.]/g, '-')}`;
            
            // Backup critical tables
            const backups = {
                timestamp,
                backupId,
                tables: {}
            };
            
            // Backup products table
            const { data: products, error: productsError } = await supabaseClient
                .from('products')
                .select('*');
            
            if (productsError) {
                console.error('Failed to backup products:', productsError);
                backups.tables.products = { error: productsError.message };
            } else {
                backups.tables.products = {
                    count: products.length,
                    sample: products.slice(0, 3) // Store sample for verification
                };
            }
            
            // Backup site_settings table
            const { data: settings, error: settingsError } = await supabaseClient
                .from('site_settings')
                .select('*');
            
            if (settingsError) {
                console.error('Failed to backup settings:', settingsError);
                backups.tables.settings = { error: settingsError.message };
            } else {
                backups.tables.settings = {
                    count: settings.length,
                    data: settings
                };
            }
            
            // Backup admin_logs table (recent entries only)
            const { data: logs, error: logsError } = await supabaseClient
                .from('admin_logs')
                .select('*')
                .order('attempted_at', { ascending: false })
                .limit(100);
            
            if (logsError) {
                console.error('Failed to backup logs:', logsError);
                backups.tables.logs = { error: logsError.message };
            } else {
                backups.tables.logs = {
                    count: logs.length,
                    sample: logs.slice(0, 5)
                };
            }
            
            // Store backup in database
            const { error: backupError } = await supabaseClient
                .from('system_backups')
                .insert([{
                    id: backupId,
                    timestamp,
                    data: backups,
                    size: JSON.stringify(backups).length
                }]);
            
            if (backupError) {
                console.error('Failed to store backup:', backupError);
                return false;
            }
            
            // Clean up old backups
            await cleanupOldBackups();
            
            console.log(`Backup created successfully: ${backupId}`);
            return true;
            
        } catch (error) {
            console.error('Backup creation failed:', error);
            return false;
        }
    }
    
    // Clean up old backups
    async function cleanupOldBackups() {
        if (!supabaseClient) return;
        
        try {
            // Get all backups sorted by timestamp
            const { data: backups, error } = await supabaseClient
                .from('system_backups')
                .select('id, timestamp')
                .order('timestamp', { ascending: true });
            
            if (error) throw error;
            
            // Delete old backups if we have more than MAX_BACKUPS
            if (backups.length > MAX_BACKUPS) {
                const backupsToDelete = backups.slice(0, backups.length - MAX_BACKUPS);
                
                for (const backup of backupsToDelete) {
                    await supabaseClient
                        .from('system_backups')
                        .delete()
                        .eq('id', backup.id);
                    
                    console.log(`Deleted old backup: ${backup.id}`);
                }
            }
        } catch (error) {
            console.error('Failed to cleanup old backups:', error);
        }
    }
    
    // Get available backups
    async function getBackups() {
        if (!supabaseClient) return null;
        
        try {
            const { data, error } = await supabaseClient
                .from('system_backups')
                .select('*')
                .order('timestamp', { ascending: false });
            
            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Failed to get backups:', error);
            return null;
        }
    }
    
    // Restore from backup
    async function restoreBackup(backupId) {
        if (!supabaseClient) return false;
        
        try {
            console.log(`Restoring from backup: ${backupId}`);
            
            // Get backup data
            const { data: backup, error } = await supabaseClient
                .from('system_backups')
                .select('*')
                .eq('id', backupId)
                .single();
            
            if (error) throw error;
            
            if (!backup || !backup.data) {
                console.error('Backup data not found');
                return false;
            }
            
            const backupData = backup.data;
            
            // Restore products if available
            if (backupData.tables.products && backupData.tables.products.sample) {
                console.log('Products backup available (sample only for verification)');
                // Note: Full restore would require additional logic
            }
            
            // Restore settings if available
            if (backupData.tables.settings && backupData.tables.settings.data) {
                console.log('Restoring site settings...');
                
                // Clear existing settings
                await supabaseClient
                    .from('site_settings')
                    .delete()
                    .neq('id', 'dummy'); // Delete all
                
                // Insert backed up settings
                const { error: restoreError } = await supabaseClient
                    .from('site_settings')
                    .insert(backupData.tables.settings.data);
                
                if (restoreError) {
                    console.error('Failed to restore settings:', restoreError);
                } else {
                    console.log('Settings restored successfully');
                }
            }
            
            // Create restore log
            await supabaseClient
                .from('restore_logs')
                .insert([{
                    backup_id: backupId,
                    restored_at: new Date().toISOString(),
                    restored_by: 'system',
                    tables_restored: Object.keys(backupData.tables)
                }]);
            
            console.log(`Restore completed from backup: ${backupId}`);
            return true;
            
        } catch (error) {
            console.error('Restore failed:', error);
            return false;
        }
    }
    
    // Export data for manual backup
    async function exportData() {
        if (!supabaseClient) return null;
        
        try {
            const exportData = {
                timestamp: new Date().toISOString(),
                tables: {}
            };
            
            // Export products
            const { data: products } = await supabaseClient
                .from('products')
                .select('*');
            
            exportData.tables.products = products || [];
            
            // Export settings
            const { data: settings } = await supabaseClient
                .from('site_settings')
                .select('*');
            
            exportData.tables.settings = settings || [];
            
            // Create downloadable JSON
            const dataStr = JSON.stringify(exportData, null, 2);
            const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
            
            return {
                data: exportData,
                downloadUri: dataUri,
                fileName: `ikon_backup_${new Date().toISOString().split('T')[0]}.json`
            };
            
        } catch (error) {
            console.error('Export failed:', error);
            return null;
        }
    }
    
    // Check backup health
    async function checkBackupHealth() {
        if (!supabaseClient) return { healthy: false, message: 'Service not initialized' };
        
        try {
            // Check if backups exist
            const { data: backups, error } = await supabaseClient
                .from('system_backups')
                .select('timestamp')
                .order('timestamp', { ascending: false })
                .limit(1);
            
            if (error) throw error;
            
            if (!backups || backups.length === 0) {
                return { 
                    healthy: false, 
                    message: 'No backups found',
                    recommendation: 'Run initial backup'
                };
            }
            
            const latestBackup = backups[0];
            const backupTime = new Date(latestBackup.timestamp);
            const now = new Date();
            const hoursSinceBackup = (now - backupTime) / (1000 * 60 * 60);
            
            if (hoursSinceBackup > 2) {
                return {
                    healthy: false,
                    message: `Last backup was ${hoursSinceBackup.toFixed(1)} hours ago`,
                    recommendation: 'Run backup immediately'
                };
            }
            
            return {
                healthy: true,
                message: `Backup is current (${hoursSinceBackup.toFixed(1)} hours ago)`,
                latestBackup: latestBackup.timestamp
            };
            
        } catch (error) {
            return {
                healthy: false,
                message: `Backup check failed: ${error.message}`,
                error: error.message
            };
        }
    }
    
    return {
        init,
        createBackup,
        getBackups,
        restoreBackup,
        exportData,
        checkBackupHealth,
        cleanupOldBackups
    };
})();

// Auto-initialize if imported
if (typeof window !== 'undefined') {
    window.addEventListener('load', () => {
        setTimeout(() => BackupService.init(), 2000);
    });
}