import { SupabaseService } from '../services/supabase.js';
import { AuthService } from '../services/auth.js';

/**
 * CMS Logic
 * Orchestrates the Admin Portal UI and data flow.
 */
export const CMS = (function() {
    const state = {
        currentTab: 'dashboard',
        editingId: null // Track if we are editing a product
    };

    function initUI() {
        // Tab Switching
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const tab = item.getAttribute('data-tab');
                switchTab(tab);
            });
        });

        // Modal Logic
        const modal = document.getElementById('product-modal');
        if (modal) {
            document.querySelectorAll('.open-product-modal').forEach(btn => {
                btn.addEventListener('click', () => {
                    state.editingId = null;
                    document.getElementById('product-form').reset();
                    document.querySelector('#product-modal h2').innerText = 'Add New Product';
                    modal.style.display = 'flex';
                });
            });
            document.querySelector('.close-modal')?.addEventListener('click', () => modal.style.display = 'none');
            window.addEventListener('click', (e) => {
                if (e.target === modal) modal.style.display = 'none';
            });
        }

        // Form Submission
        const productForm = document.getElementById('product-form');
        if (productForm) {
            productForm.addEventListener('submit', handleProductSubmit);
        }

        // Settings Form
        const settingsForm = document.getElementById('settings-form');
        if (settingsForm) {
            settingsForm.addEventListener('submit', handleSettingsSubmit);
        }
    }

    async function switchTab(tabId) {
        // Update Sidebar
        document.querySelectorAll('.nav-item').forEach(n => {
            n.classList.toggle('active', n.getAttribute('data-tab') === tabId);
        });
        
        // Update Content
        document.querySelectorAll('.tab-content').forEach(c => {
            c.classList.toggle('active', c.id === tabId);
        });
        
        // Update Header
        const titles = {
            dashboard: 'Dashboard Overview',
            products: 'Product Management',
            industries: 'Industry Configuration',
            leads: 'Leads & Inquiries',
            analytics: 'Performance Analytics',
            settings: 'CMS Settings'
        };
        const titleEl = document.getElementById('tab-title');
        if (titleEl) titleEl.innerText = titles[tabId];

        // Refresh Data
        if (tabId === 'products') loadProducts();
        if (tabId === 'dashboard') updateStats();
        if (tabId === 'leads') loadLeads();
        if (tabId === 'industries') loadIndustries();
        if (tabId === 'settings') loadSettings();
        if (tabId === 'analytics') loadAnalytics();
    }

    async function loadAnalytics() {
        const iframe = document.getElementById('analytics-iframe');
        if (iframe && !iframe.src) {
            iframe.src = CONFIG.ANALYTICS.LOOKER_STUDIO_URL;
        }
    }

    async function updateStats() {
        try {
            const stats = await SupabaseService.getDashboardStats();
            document.getElementById('count-products').innerText = stats.products;
            document.getElementById('count-industries').innerText = stats.industries;
            document.getElementById('count-leads').innerText = stats.leads;
        } catch (err) {
            console.error('Failed to update stats:', err);
        }
    }

    async function loadSettings() {
        try {
            const settings = await SupabaseService.getSettings();
            if (settings) {
                document.getElementById('set-phone').value = settings.contact_phone || '';
                document.getElementById('set-email').value = settings.contact_email || '';
                document.getElementById('set-whatsapp').value = settings.social_whatsapp || '';
                document.getElementById('set-linkedin').value = settings.social_linkedin || '';
                document.getElementById('set-maintenance').checked = settings.maintenance_mode || false;
            }
        } catch (err) {
            console.error('Failed to load settings:', err);
        }
    }

    async function handleSettingsSubmit(e) {
        e.preventDefault();
        const settings = {
            contact_phone: document.getElementById('set-phone').value,
            contact_email: document.getElementById('set-email').value,
            social_whatsapp: document.getElementById('set-whatsapp').value,
            social_linkedin: document.getElementById('set-linkedin').value,
            maintenance_mode: document.getElementById('set-maintenance').checked
        };

        try {
            await SupabaseService.updateSettings(settings);
            alert('Global settings updated successfully!');
        } catch (err) {
            console.error('Failed to save settings:', err);
            alert('Error saving settings.');
        }
    }

    async function loadProducts() {
        const container = document.getElementById('product-list-container');
        if (!container) return;
        container.innerHTML = '<div class="loader">Loading inventory...</div>';

        try {
            const products = await SupabaseService.getProducts();
            if (products.length === 0) {
                container.innerHTML = '<div class="empty-state">No products found.</div>';
                return;
            }

            container.innerHTML = products.map(prod => `
                <div class="product-item">
                    <img src="${prod.image_url || 'img/IKON-Logo-2.png'}" alt="${prod.name}">
                    <div class="product-info">
                        <h4>${prod.name}</h4>
                        <p>${prod.category}</p>
                    </div>
                    <div class="product-actions">
                        <button class="btn-icon edit-btn" style="color: var(--blue-mid);" data-id="${prod.id}"><i class="fas fa-edit"></i></button>
                        <button class="btn-icon delete-btn" data-id="${prod.id}"><i class="fas fa-trash"></i></button>
                    </div>
                </div>
            `).join('');

            // Attach listeners
            container.querySelectorAll('.delete-btn').forEach(btn => {
                btn.addEventListener('click', async () => {
                    if (confirm('Delete this product?')) {
                        await SupabaseService.deleteProduct(btn.dataset.id);
                        loadProducts();
                        updateStats();
                    }
                });
            });

            container.querySelectorAll('.edit-btn').forEach(btn => {
                btn.addEventListener('click', async () => {
                    const products = await SupabaseService.getProducts();
                    const prod = products.find(p => p.id === btn.dataset.id);
                    if (prod) {
                        state.editingId = prod.id;
                        document.getElementById('prod-name').value = prod.name;
                        document.getElementById('prod-category').value = prod.category;
                        document.getElementById('prod-desc').value = prod.description;
                        document.getElementById('prod-image').value = prod.image_url;
                        document.querySelector('#product-modal h2').innerText = 'Edit Product';
                        document.getElementById('product-modal').style.display = 'flex';
                    }
                });
            });
        } catch (err) {
            container.innerHTML = '<div class="error-state">Failed to load products.</div>';
        }
    }

    async function loadIndustries() {
        const container = document.getElementById('industries'); // Assuming we use the existing div
        if (!container) return;
        
        // Let's create a dedicated card inside the industries tab
        container.innerHTML = `
            <div class="admin-card">
                <h3>Technical Specifications (Industries)</h3>
                <div id="industry-list-container"></div>
            </div>
        `;
        
        const listContainer = document.getElementById('industry-list-container');
        listContainer.innerHTML = '<div class="loader">Loading industry data...</div>';

        try {
            const industries = await SupabaseService.getIndustries();
            listContainer.innerHTML = industries.map(ind => `
                <div class="product-item">
                    <div class="product-info">
                        <h4>${ind.name}</h4>
                        <p>${ind.overview.substring(0, 100)}...</p>
                    </div>
                    <div class="product-actions">
                        <button class="hero-btn hero-btn-secondary btn-small edit-ind-btn" data-id="${ind.id}">Edit Specs</button>
                    </div>
                </div>
            `).join('');
            
            // Edit industry listener (Placeholder - you can extend this to a new modal)
            listContainer.querySelectorAll('.edit-ind-btn').forEach(btn => {
                btn.addEventListener('click', () => alert('Industry technical specs editor coming soon!'));
            });
        } catch (err) {
            listContainer.innerHTML = '<div class="error-state">Failed to load industries.</div>';
        }
    }

    async function loadLeads() {
        const container = document.getElementById('leads-list-container');
        if (!container) return;
        container.innerHTML = '<div class="loader">Loading leads...</div>';

        try {
            const leads = await SupabaseService.getLeads();
            if (leads.length === 0) {
                container.innerHTML = '<div class="empty-state">No leads found.</div>';
                return;
            }

            container.innerHTML = `
                <table class="admin-table">
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Customer</th>
                            <th>Email</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${leads.map(lead => `
                            <tr>
                                <td>${new Date(lead.created_at).toLocaleDateString()}</td>
                                <td>${lead.customer_name}</td>
                                <td>${lead.email}</td>
                                <td><span class="badge ${lead.status}">${lead.status}</span></td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
        } catch (err) {
            container.innerHTML = '<div class="error-state">Failed to load leads.</div>';
        }
    }

    async function handleProductSubmit(e) {
        e.preventDefault();
        const product = {
            name: document.getElementById('prod-name').value,
            category: document.getElementById('prod-category').value,
            description: document.getElementById('prod-desc').value,
            image_url: document.getElementById('prod-image').value
        };

        try {
            if (state.editingId) {
                await SupabaseService.updateProduct(state.editingId, product);
                alert('Product updated!');
            } else {
                await SupabaseService.addProduct(product);
                alert('Product added!');
            }
            e.target.reset();
            document.getElementById('product-modal').style.display = 'none';
            loadProducts();
            updateStats();
        } catch (err) {
            alert('Error saving product.');
        }
    }

    return {
        init: () => {
            initUI();
            updateStats();
        }
    };
})();