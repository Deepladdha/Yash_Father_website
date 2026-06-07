// Configuration file for IKON website
// Replace placeholder values with your actual configuration

export const CONFIG = {
    // Google Analytics 4 Measurement ID
    // Replace with your actual GA4 measurement ID from Google Analytics
    GA_MEASUREMENT_ID: 'G-1TBGXB2829',
    
    // Feature flags
    FEATURES: {
        ANALYTICS_ENABLED: true,
        PERSONALIZATION_ENABLED: true,
        CHATBOT_ENABLED: false,
        OFFLINE_MODE: false
    },
    
    // User preferences defaults
    USER_PREFERENCES: {
        theme: 'light',
        language: 'en',
        notifications: true
    },
    
    // API endpoints (placeholder - replace with actual endpoints)
    API_ENDPOINTS: {
        CONTACT_FORM: '/api/contact',
        ANALYTICS: '/api/analytics',
        PRODUCTS: '/api/products'
    },

    // Supabase Configuration
    // Replace with your actual Supabase URL and Anon Key
    SUPABASE: {
        URL: 'https://vcorhgbsklvweneqvhht.supabase.co',
        ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZjb3JoZ2Jza2x2d2VuZXF2aGh0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA3OTAzMTMsImV4cCI6MjA5NjM2NjMxM30.KNzKNw8ZX2HJGj6nL8wvLOjOVL663GVYxne-lI3QACA'
    },

    // Clerk Configuration
    CLERK: {
        PUBLISHABLE_KEY: 'pk_test_Zmx5aW5nLW1hcmxpbi00NS5jbGVyay5hY2NvdW50cy5kZXYk'
    },

    // Admin Access Control
    ADMIN_EMAILS: [
        'deepladdha55@gmail.com'
    ],

    // Analytics Configuration
    ANALYTICS: {
        LOOKER_STUDIO_URL: 'https://datastudio.google.com/embed/reporting/6f7f3a55-2e41-4d65-a365-09c0327ed3d5/page/6tW0F'
    }
};

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}