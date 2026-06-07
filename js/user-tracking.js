// User tracking and preference management system
// Provides basic personalization and user behavior tracking

class UserTracker {
    constructor() {
        this.userId = this.getOrCreateUserId();
        this.preferences = this.loadPreferences();
        this.sessionStart = Date.now();
        this.init();
    }

    // Generate or retrieve user ID
    getOrCreateUserId() {
        let userId = this.getCookie('user_id');
        if (!userId) {
            userId = 'user_' + Math.random().toString(36).substr(2, 9);
            this.setCookie('user_id', userId, 365); // Store for 1 year
        }
        return userId;
    }

    // Load user preferences from cookies
    loadPreferences() {
        const prefsCookie = this.getCookie('user_preferences');
        if (prefsCookie) {
            try {
                return JSON.parse(prefsCookie);
            } catch (e) {
                console.warn('Failed to parse user preferences:', e);
            }
        }
        
        // Default preferences
        return {
            theme: 'light',
            visitedPages: [],
            favoriteProducts: [],
            lastVisit: new Date().toISOString(),
            visitCount: 0
        };
    }

    // Save preferences to cookies
    savePreferences() {
        this.preferences.lastVisit = new Date().toISOString();
        this.preferences.visitCount = (this.preferences.visitCount || 0) + 1;
        this.setCookie('user_preferences', JSON.stringify(this.preferences), 30); // Store for 30 days
    }

    // Track page visit
    trackPageVisit(pageTitle, pagePath) {
        // Add to visited pages (keep last 10)
        if (!this.preferences.visitedPages) {
            this.preferences.visitedPages = [];
        }
        
        const visit = {
            title: pageTitle,
            path: pagePath,
            timestamp: new Date().toISOString(),
            duration: 0 // Will be updated when user leaves
        };
        
        this.preferences.visitedPages.unshift(visit);
        if (this.preferences.visitedPages.length > 10) {
            this.preferences.visitedPages = this.preferences.visitedPages.slice(0, 10);
        }
        
        // Track with GA4 if available
        if (typeof gtag !== 'undefined') {
            gtag('event', 'page_view', {
                page_title: pageTitle,
                page_location: window.location.href,
                page_path: pagePath,
                user_id: this.userId
            });
        }
        
        this.savePreferences();
    }

    // Track product view
    trackProductView(productId, productName, category) {
        if (!this.preferences.viewedProducts) {
            this.preferences.viewedProducts = [];
        }
        
        const view = {
            id: productId,
            name: productName,
            category: category,
            timestamp: new Date().toISOString()
        };
        
        this.preferences.viewedProducts.unshift(view);
        if (this.preferences.viewedProducts.length > 20) {
            this.preferences.viewedProducts = this.preferences.viewedProducts.slice(0, 20);
        }
        
        // Track with GA4
        if (typeof gtag !== 'undefined') {
            gtag('event', 'view_item', {
                items: [{
                    item_id: productId,
                    item_name: productName,
                    item_category: category
                }],
                user_id: this.userId
            });
        }
        
        this.savePreferences();
    }

    // Track contact form submission
    trackFormSubmission(formId, formData) {
        if (typeof gtag !== 'undefined') {
            gtag('event', 'generate_lead', {
                form_id: formId,
                user_id: this.userId
            });
        }
    }

    // Get user recommendations based on viewing history
    getRecommendations() {
        if (!this.preferences.viewedProducts || this.preferences.viewedProducts.length === 0) {
            return []; // No recommendations without history
        }
        
        // Simple collaborative filtering simulation
        // In a real implementation, this would call an API
        const categories = this.preferences.viewedProducts
            .map(p => p.category)
            .filter((cat, index, arr) => arr.indexOf(cat) === index);
        
        return categories.slice(0, 3); // Return top 3 categories
    }

    // Update theme preference
    setTheme(theme) {
        this.preferences.theme = theme;
        this.savePreferences();
        this.applyTheme(theme);
    }

    // Apply theme to page
    applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        
        // Store in localStorage for persistence
        try {
            localStorage.setItem('theme', theme);
        } catch (e) {
            console.warn('Failed to save theme to localStorage:', e);
        }
    }

    // Initialize tracking
    init() {
        // Track current page
        this.trackPageVisit(document.title, window.location.pathname);
        
        // Apply saved theme
        if (this.preferences.theme) {
            this.applyTheme(this.preferences.theme);
        }
        
        // Set up beforeunload to track session duration
        window.addEventListener('beforeunload', () => {
            const sessionDuration = Date.now() - this.sessionStart;
            if (typeof gtag !== 'undefined') {
                gtag('event', 'session_end', {
                    session_duration: Math.round(sessionDuration / 1000), // Convert to seconds
                    user_id: this.userId
                });
            }
        });
        
        // Set up form tracking
        this.setupFormTracking();
        
        // Set up product view tracking
        this.setupProductTracking();
    }

    // Set up form submission tracking
    setupFormTracking() {
        document.querySelectorAll('form').forEach(form => {
            form.addEventListener('submit', (e) => {
                const formId = form.id || 'unknown_form';
                this.trackFormSubmission(formId, new FormData(form));
            });
        });
    }

    // Set up product view tracking
    setupProductTracking() {
        // This would be enhanced with actual product page detection
        // For now, we'll track product page visits
        const productPages = [
            'cnc-router.html',
            'cnc-oscillating-knife.html',
            'cnc-multi-layer.html',
            'co2-laser.html',
            'fiber-laser.html',
            'spare-parts.html'
        ];
        
        const currentPage = window.location.pathname.split('/').pop();
        if (productPages.includes(currentPage)) {
            const productName = document.querySelector('h1')?.textContent || 'Unknown Product';
            this.trackProductView(currentPage, productName, 'machinery');
        }
    }

    // Cookie helper methods
    setCookie(name, value, days) {
        const d = new Date();
        d.setTime(d.getTime() + (days * 24 * 60 * 60 * 1000));
        const expires = "expires=" + d.toUTCString();
        document.cookie = name + "=" + value + ";" + expires + ";path=/;SameSite=Lax";
    }

    getCookie(name) {
        const nameEQ = name + "=";
        const ca = document.cookie.split(';');
        for (let i = 0; i < ca.length; i++) {
            let c = ca[i];
            while (c.charAt(0) === ' ') c = c.substring(1, c.length);
            if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
        }
        return null;
    }

    // Public API
    static getInstance() {
        if (!UserTracker.instance) {
            UserTracker.instance = new UserTracker();
        }
        return UserTracker.instance;
    }
}

// Initialize user tracker
const userTracker = UserTracker.getInstance();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UserTracker;
}