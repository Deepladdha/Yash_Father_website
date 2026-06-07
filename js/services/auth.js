import { CONFIG } from '../config.js';
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

/**
 * Auth Service (Clerk)
 * Handles authentication and user state for the IKON platform.
 */
export const AuthService = (function() {
    let user = null;

    function loadScriptOnce(id, src, attributes) {
        return new Promise((resolve, reject) => {
            const existing = document.getElementById(id);
            if (existing) {
                resolve(existing);
                return;
            }
            const script = document.createElement('script');
            script.id = id;
            script.src = src;
            script.async = true;
            script.crossOrigin = 'anonymous';
            Object.entries(attributes || {}).forEach(([key, value]) => {
                script.setAttribute(key, value);
            });
            script.onload = () => resolve(script);
            script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
            document.head.appendChild(script);
        });
    }

    async function checkAdminAccess(clerkUser) {
        const email = clerkUser.primaryEmailAddress?.emailAddress;
        const isAdmin = CONFIG.ADMIN_EMAILS.includes(email);
        
        // Log attempt to Supabase (Optional but recommended)
        try {
            const supabaseClient = createClient(CONFIG.SUPABASE.URL, CONFIG.SUPABASE.ANON_KEY);
            await supabaseClient.from('admin_logs').insert([{
                email: email,
                status: isAdmin ? 'success' : 'denied',
                attempted_at: new Date().toISOString()
            }]);
        } catch (e) {
            console.error('Failed to log admin attempt:', e);
        }

        return isAdmin;
    }

    return {
        init: async (onAuthSuccess, onAuthRequired) => {
            const container = document.getElementById('clerk-sign-in');
            if (container) {
                container.innerHTML = '<div class="loader"><i class="fas fa-spinner fa-spin"></i> Initializing Security...</div>';
            }

            try {
                console.log('AuthService: Initializing Clerk...');
                const publishableKey = CONFIG.CLERK.PUBLISHABLE_KEY;

                // Load Clerk SDK
                await loadScriptOnce(
                    'clerk-sdk',
                    'https://cdn.jsdelivr.net/npm/@clerk/clerk-js@latest/dist/clerk.browser.js',
                    { 'data-clerk-publishable-key': publishableKey }
                );

                if (!window.Clerk) {
                    throw new Error('Clerk SDK failed to load into window object');
                }

                await window.Clerk.load({
                    appearance: {
                        layout: {
                            helpPageUrl: 'https://ikonsolutions.vercel.app/contact-form.html',
                            logoPlacement: 'none',
                            showOptionalFields: false
                        },
                        variables: {
                            colorPrimary: '#064d81',
                            colorBackground: '#ffffff',
                            colorText: '#16324f',
                            colorInputBackground: '#ffffff',
                            colorInputText: '#16324f',
                            borderRadius: '12px'
                        }
                    }
                });

                console.log('AuthService: Clerk loaded successfully. User status:', !!window.Clerk.user);

                if (window.Clerk.user) {
                    const isAdmin = await checkAdminAccess(window.Clerk.user);
                    console.log('AuthService: Admin check result:', isAdmin);
                    
                    if (isAdmin) {
                        user = window.Clerk.user;
                        onAuthSuccess(user);
                    } else {
                        // Deny Access
                        if (container) {
                            container.innerHTML = `
                                <div style="color: #ef4444; padding: 20px; text-align: center;">
                                    <i class="fas fa-exclamation-triangle" style="font-size: 2rem; margin-bottom: 10px; display: block;"></i>
                                    <h3>Access Denied</h3>
                                    <p>Your account (${window.Clerk.user.primaryEmailAddress.emailAddress}) does not have admin permissions.</p>
                                    <button class="hero-btn hero-btn-secondary" onclick="AuthService.logout()" style="margin-top: 20px; color: var(--blue);">Sign Out</button>
                                </div>
                            `;
                        }
                        onAuthRequired();
                    }
                    return;
                }

                // Not signed in - mount sign in
                if (container) {
                    container.innerHTML = '';
                    console.log('AuthService: Mounting Sign-In form...');
                    window.Clerk.mountSignIn(container, {
                        afterSignInUrl: window.location.origin + window.location.pathname,
                        afterSignUpUrl: window.location.origin + window.location.pathname,
                        routing: 'virtual',
                        appearance: {
                            elements: {
                                card: {
                                    boxShadow: '0 16px 44px rgba(6,77,129,0.14)',
                                    border: '1px solid #dde3ec'
                                }
                            }
                        }
                    });
                }
                onAuthRequired();
            } catch (err) {
                console.error('AuthService: Initialization failed:', err);
                if (container) {
                    container.innerHTML = `
                        <div style="color: #ef4444; padding: 20px; text-align: center;">
                            <i class="fas fa-wifi-slash" style="font-size: 2rem; margin-bottom: 10px; display: block;"></i>
                            <h3>Connection Error</h3>
                            <p>Failed to load authentication services. Please check your internet connection or try refreshing.</p>
                            <p style="font-size: 0.7rem; margin-top: 10px; opacity: 0.7;">${err.message}</p>
                            <button class="hero-btn hero-btn-primary" onclick="window.location.reload()" style="margin-top: 15px;">Retry</button>
                        </div>
                    `;
                }
            }
        },
        logout: async () => {
            await window.Clerk.signOut();
            window.location.reload();
        },
        getUser: () => user
    };
})();
