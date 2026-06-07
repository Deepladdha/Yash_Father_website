import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
import { CONFIG } from '../config.js';

/**
 * Supabase Service
 * Handles all database interactions for the IKON platform.
 */
export const SupabaseService = (function() {
    let client = null;

    function getClient() {
        if (!client) {
            client = createClient(CONFIG.SUPABASE.URL, CONFIG.SUPABASE.ANON_KEY);
        }
        return client;
    }

    return {
        getClient,
        // Products
        getProducts: async () => {
            const { data, error } = await getClient()
                .from('products')
                .select('*')
                .order('created_at', { ascending: false });
            if (error) throw error;
            return data;
        },
        addProduct: async (product) => {
            const { data, error } = await getClient()
                .from('products')
                .insert([product]);
            if (error) throw error;
            return data;
        },
        updateProduct: async (id, updates) => {
            const { data, error } = await getClient()
                .from('products')
                .update(updates)
                .eq('id', id);
            if (error) throw error;
            return data;
        },
        deleteProduct: async (id) => {
            const { error } = await getClient()
                .from('products')
                .delete()
                .eq('id', id);
            if (error) throw error;
        },

        // Industries
        getIndustries: async () => {
            const { data, error } = await getClient()
                .from('industries')
                .select('*');
            if (error) throw error;
            return data;
        },
        updateIndustry: async (id, updates) => {
            const { data, error } = await getClient()
                .from('industries')
                .update(updates)
                .eq('id', id);
            if (error) throw error;
            return data;
        },

        // Leads
        getLeads: async () => {
            const { data, error } = await getClient()
                .from('leads')
                .select('*')
                .order('created_at', { ascending: false });
            if (error) throw error;
            return data;
        },

        // Stats
        getDashboardStats: async () => {
            const [products, industries, leads] = await Promise.all([
                getClient().from('products').select('*', { count: 'exact', head: true }),
                getClient().from('industries').select('*', { count: 'exact', head: true }),
                getClient().from('leads').select('*', { count: 'exact', head: true })
            ]);
            return {
                products: products.count || 0,
                industries: industries.count || 0,
                leads: leads.count || 0
            };
        },

        // Settings
        getSettings: async () => {
            const { data, error } = await getClient()
                .from('site_settings')
                .select('*')
                .eq('id', 'global_config')
                .single();
            if (error && error.code !== 'PGRST116') throw error; // PGRST116 is 'no rows'
            return data?.value || null;
        },
        isMaintenanceMode: async () => {
            const { data, error } = await getClient()
                .from('site_settings')
                .select('value')
                .eq('id', 'maintenance_mode')
                .single();
            if (error) return false;
            return data.value === true || data.value === 'true';
        },
        updateSettings: async (settings) => {
            const { error } = await getClient()
                .from('site_settings')
                .upsert({ id: 'global_config', value: settings });
            if (error) throw error;
        }
    };
})();
