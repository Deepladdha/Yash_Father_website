// Privacy controls and GDPR/CCPA compliance tools
// Provides user control over data collection and privacy settings

class PrivacyControls {
    constructor() {
        this.settings = this.loadSettings();
        this.init();
    }

    loadSettings() {
        const saved = localStorage.getItem('privacy_settings');
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch (e) {
                console.warn('Failed to parse privacy settings:', e);
            }
        }
        
        // Default settings (opt-in for all)
        return {
            analytics: true,
            personalization: true,
            cookies: true,
            marketing: false,
            essential: true
        };
    }

    saveSettings() {
        localStorage.setItem('privacy_settings', JSON.stringify(this.settings));
        
        // Apply settings
        this.applySettings();
        
        // Track consent update
        if (typeof gtag !== 'undefined') {
            gtag('event', 'consent_update', {
                analytics_storage: this.settings.analytics ? 'granted' : 'denied',
                personalization_storage: this.settings.personalization ? 'granted' : 'denied'
            });
        }
    }

    applySettings() {
        // Apply to Google Analytics
        if (typeof gtag !== 'undefined') {
            gtag('consent', 'update', {
                analytics_storage: this.settings.analytics ? 'granted' : 'denied',
                personalization_storage: this.settings.personalization ? 'granted' : 'denied'
            });
        }
        
        // Apply to user tracking
        if (typeof userTracker !== 'undefined') {
            // User tracker respects privacy settings
            // In a real implementation, this would disable tracking features
        }
    }

    init() {
        // Check if we need to show consent banner
        if (!localStorage.getItem('privacy_consent_shown')) {
            this.showConsentBanner();
        }
        
        // Apply initial settings
        this.applySettings();
        
        // Add privacy controls to footer
        this.addPrivacyControls();
    }

    showConsentBanner() {
        const banner = document.createElement('div');
        banner.id = 'privacy-consent-banner';
        banner.style.cssText = `
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            background: var(--blue);
            color: var(--white);
            padding: 20px;
            z-index: 9999;
            box-shadow: 0 -2px 10px rgba(0,0,0,0.1);
            font-family: var(--font-body);
        `;
        
        banner.innerHTML = `
            <div style="max-width: var(--max-width); margin: 0 auto; display: flex; flex-wrap: wrap; gap: 15px; align-items: center;">
                <div style="flex: 1; min-width: 300px;">
                    <h3 style="margin: 0 0 8px 0; font-size: 1.1rem;">Your Privacy Matters</h3>
                    <p style="margin: 0; font-size: 0.9rem; opacity: 0.9;">
                        We use cookies and similar technologies to provide the best experience on our website. 
                        By clicking "Accept All", you consent to our use of cookies for analytics and personalization.
                    </p>
                </div>
                <div style="display: flex; gap: 10px;">
                    <button id="privacy-accept-essential" style="
                        padding: 10px 20px;
                        background: transparent;
                        border: 1px solid var(--white);
                        color: var(--white);
                        border-radius: var(--radius);
                        cursor: pointer;
                        font-weight: 600;
                    ">Essential Only</button>
                    <button id="privacy-accept-all" style="
                        padding: 10px 20px;
                        background: var(--green);
                        border: none;
                        color: var(--blue);
                        border-radius: var(--radius);
                        cursor: pointer;
                        font-weight: 600;
                    ">Accept All</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(banner);
        
        // Set up event listeners
        document.getElementById('privacy-accept-essential').addEventListener('click', () => {
            this.settings = {
                analytics: false,
                personalization: false,
                cookies: true,
                marketing: false,
                essential: true
            };
            this.saveSettings();
            banner.remove();
            localStorage.setItem('privacy_consent_shown', 'true');
        });
        
        document.getElementById('privacy-accept-all').addEventListener('click', () => {
            this.settings = {
                analytics: true,
                personalization: true,
                cookies: true,
                marketing: true,
                essential: true
            };
            this.saveSettings();
            banner.remove();
            localStorage.setItem('privacy_consent_shown', 'true');
        });
    }

    addPrivacyControls() {
        // Add privacy link to footer
        const footer = document.querySelector('footer');
        if (footer) {
            const privacyLink = document.createElement('a');
            privacyLink.href = '#';
            privacyLink.textContent = 'Privacy Settings';
            privacyLink.style.cssText = `
                color: inherit;
                text-decoration: underline;
                margin-left: 20px;
                cursor: pointer;
            `;
            
            privacyLink.addEventListener('click', (e) => {
                e.preventDefault();
                this.showPrivacyModal();
            });
            
            footer.appendChild(privacyLink);
        }
    }

    showPrivacyModal() {
        const modal = document.createElement('div');
        modal.id = 'privacy-settings-modal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            padding: 20px;
        `;
        
        modal.innerHTML = `
            <div style="
                background: var(--white);
                border-radius: var(--radius);
                padding: 30px;
                max-width: 600px;
                width: 100%;
                max-height: 80vh;
                overflow-y: auto;
                box-shadow: var(--shadow-hover);
            ">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                    <h2 style="margin: 0; color: var(--blue);">Privacy Settings</h2>
                    <button id="privacy-modal-close" style="
                        background: none;
                        border: none;
                        font-size: 1.5rem;
                        cursor: pointer;
                        color: var(--text-light);
                    ">&times;</button>
                </div>
                
                <p style="margin-bottom: 25px; color: var(--text-mid);">
                    Control how we collect and use your data to improve your experience on our website.
                </p>
                
                <div style="display: flex; flex-direction: column; gap: 20px;">
                    <div class="privacy-setting">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <div>
                                <h3 style="margin: 0 0 5px 0; font-size: 1rem;">Essential Cookies</h3>
                                <p style="margin: 0; font-size: 0.9rem; color: var(--text-light);">
                                    Required for the website to function properly. Cannot be disabled.
                                </p>
                            </div>
                            <input type="checkbox" id="privacy-essential" checked disabled style="transform: scale(1.2);">
                        </div>
                    </div>
                    
                    <div class="privacy-setting">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <div>
                                <h3 style="margin: 0 0 5px 0; font-size: 1rem;">Analytics Cookies</h3>
                                <p style="margin: 0; font-size: 0.9rem; color: var(--text-light);">
                                    Help us understand how visitors interact with our website.
                                </p>
                            </div>
                            <input type="checkbox" id="privacy-analytics" ${this.settings.analytics ? 'checked' : ''} style="transform: scale(1.2);">
                        </div>
                    </div>
                    
                    <div class="privacy-setting">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <div>
                                <h3 style="margin: 0 0 5px 0; font-size: 1rem;">Personalization Cookies</h3>
                                <p style="margin: 0; font-size: 0.9rem; color: var(--text-light);">
                                    Remember your preferences and provide personalized content.
                                </p>
                            </div>
                            <input type="checkbox" id="privacy-personalization" ${this.settings.personalization ? 'checked' : ''} style="transform: scale(1.2);">
                        </div>
                    </div>
                    
                    <div class="privacy-setting">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <div>
                                <h3 style="margin: 0 0 5px 0; font-size: 1rem;">Marketing Cookies</h3>
                                <p style="margin: 0; font-size: 0.9rem; color: var(--text-light);">
                                    Used to deliver relevant advertisements and track campaign performance.
                                </p>
                            </div>
                            <input type="checkbox" id="privacy-marketing" ${this.settings.marketing ? 'checked' : ''} style="transform: scale(1.2);">
                        </div>
                    </div>
                </div>
                
                <div style="display: flex; gap: 15px; margin-top: 30px;">
                    <button id="privacy-save" style="
                        padding: 12px 25px;
                        background: var(--blue);
                        color: var(--white);
                        border: none;
                        border-radius: var(--radius);
                        cursor: pointer;
                        font-weight: 600;
                        flex: 1;
                    ">Save Preferences</button>
                    <button id="privacy-reject-all" style="
                        padding: 12px 25px;
                        background: var(--off-white);
                        color: var(--text-dark);
                        border: 1px solid var(--border);
                        border-radius: var(--radius);
                        cursor: pointer;
                        font-weight: 600;
                    ">Reject All</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Set up event listeners
        document.getElementById('privacy-modal-close').addEventListener('click', () => {
            modal.remove();
        });
        
        document.getElementById('privacy-save').addEventListener('click', () => {
            this.settings = {
                analytics: document.getElementById('privacy-analytics').checked,
                personalization: document.getElementById('privacy-personalization').checked,
                cookies: true,
                marketing: document.getElementById('privacy-marketing').checked,
                essential: true
            };
            this.saveSettings();
            modal.remove();
            
            // Show confirmation
            this.showConfirmation('Privacy preferences saved successfully!');
        });
        
        document.getElementById('privacy-reject-all').addEventListener('click', () => {
            this.settings = {
                analytics: false,
                personalization: false,
                cookies: true,
                marketing: false,
                essential: true
            };
            this.saveSettings();
            modal.remove();
            
            // Show confirmation
            this.showConfirmation('All non-essential cookies have been disabled.');
        });
        
        // Close modal when clicking outside
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }

    showConfirmation(message) {
        const confirmation = document.createElement('div');
        confirmation.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: var(--green);
            color: var(--blue);
            padding: 15px 20px;
            border-radius: var(--radius);
            box-shadow: var(--shadow);
            z-index: 10001;
            font-weight: 600;
            animation: slideIn 0.3s ease;
        `;
        
        // Add CSS animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
        `;
        document.head.appendChild(style);
        
        confirmation.textContent = message;
        document.body.appendChild(confirmation);
        
        // Remove after 3 seconds
        setTimeout(() => {
            confirmation.remove();
            style.remove();
        }, 3000);
    }

    // Public API
    static getInstance() {
        if (!PrivacyControls.instance) {
            PrivacyControls.instance = new PrivacyControls();
        }
        return PrivacyControls.instance;
    }
}

// Initialize privacy controls
const privacyControls = PrivacyControls.getInstance();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PrivacyControls;
}