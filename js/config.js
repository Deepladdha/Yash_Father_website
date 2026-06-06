// Configuration file for IKON website
// Replace placeholder values with your actual configuration

const CONFIG = {
    // Google Analytics 4 Measurement ID
    // Replace with your actual GA4 measurement ID from Google Analytics
    GA_MEASUREMENT_ID: 'G-XXXXXXXXXX',
    
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
    }
};

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}