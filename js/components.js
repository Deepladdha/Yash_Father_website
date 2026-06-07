import { SupabaseService } from './services/supabase.js';

/**
 * Shared Components Loader
 * Dynamically injects Header, Footer, and Navigation across all pages.
 */
export const Components = (function() {
    const HEADER_HTML = `
        <div class="pre-header">
            <div class="pre-header-inner">
                <span class="pre-header-text">Welcome to IKON Business Products &amp; Solutions</span>
                <div class="pre-header-socials">
                    <a href="https://www.facebook.com/ikonbps" target="_blank" aria-label="Facebook"><i class="fab fa-facebook-f"></i></a>
                    <a href="https://www.instagram.com/ikon_bps/" target="_blank" aria-label="Instagram"><i class="fab fa-instagram"></i></a>
                    <a href="https://www.linkedin.com/company/ikon-business-products-and-solutions/" target="_blank" aria-label="LinkedIn"><i class="fab fa-linkedin-in"></i></a>
                    <a href="https://api.whatsapp.com/send/?phone=917506998077&text&type=phone_number&app_absent=0" target="_blank" aria-label="WhatsApp"><i class="fab fa-whatsapp"></i></a>
                    <a href="https://www.youtube.com/@IKON_BPS" target="_blank" aria-label="YouTube"><i class="fab fa-youtube"></i></a>
                </div>
            </div>
        </div>
        <header>
            <nav class="navbar">
                <a href="index.html" class="nav-brand">
                    <img src="img/IKON-Logo-2.png" alt="IKON Logo" width="48" height="48">
                    <span class="nav-brand-text">IKON <span>Business Products &amp; Solutions</span></span>
                </a>
                <div class="search-bar">
                    <input type="text" id="globalSearch" placeholder="Search products...">
                    <i class="fas fa-search"></i>
                    <div id="searchResults" class="search-results"></div>
                </div>
                <button class="menu-toggle" aria-label="Toggle menu"><i class="fas fa-bars"></i></button>
                <div class="nav-links" id="navLinks">
                    <a href="index.html">Home</a>
                    <div class="dropdown">
                        <a href="product-center.html">Products ▾</a>
                        <div class="dropdown-content">
                            <a href="product-detail.html?id=oscillating-knife">CNC Oscillating Knife</a>
                            <a href="product-detail.html?id=router">CNC Router</a>
                            <a href="product-detail.html?id=multi-layer">CNC Multi-Layer</a>
                            <a href="product-detail.html?id=co2-laser">CO2 Laser</a>
                            <a href="product-detail.html?id=fiber-laser">Fiber Laser</a>
                        </div>
                    </div>
                    <a href="applications.html">Applications</a>
                    <a href="contact-form.html" class="nav-cta">Get Quote</a>
                </div>
            </nav>
        </header>
    `;

    function initSearch() {
        const searchInput = document.getElementById('globalSearch');
        const resultsDiv = document.getElementById('searchResults');
        
        if (!searchInput) return;

        searchInput.addEventListener('input', async (e) => {
            const query = e.target.value.toLowerCase();
            if (query.length < 2) {
                resultsDiv.style.display = 'none';
                return;
            }

            try {
                const products = await SupabaseService.getProducts();
                const filtered = products.filter(p => 
                    p.name.toLowerCase().includes(query) || 
                    (p.description && p.description.toLowerCase().includes(query))
                );

                if (filtered.length > 0) {
                    resultsDiv.innerHTML = filtered.map(p => `
                        <a href="product-detail.html?id=${p.id}">
                            <span>${p.name}</span>
                        </a>
                    `).join('');
                    resultsDiv.style.display = 'block';
                } else {
                    resultsDiv.style.display = 'none';
                }
            } catch (err) {
                console.error('Search error:', err);
            }
        });

        document.addEventListener('click', (e) => {
            if (!searchInput.contains(e.target) && !resultsDiv.contains(e.target)) {
                resultsDiv.style.display = 'none';
            }
        });
    }

    async function checkMaintenance() {
        try {
            const isMaintenance = await SupabaseService.isMaintenanceMode();
            if (isMaintenance && !window.location.pathname.includes('admin.html')) {
                document.body.innerHTML = `
                    <div class="maintenance-overlay">
                        <div class="maintenance-content">
                            <img src="img/IKON-Logo-2.png" alt="IKON Logo" width="120">
                            <h1>Under Maintenance</h1>
                            <p>We're currently performing some scheduled updates. We'll be back shortly!</p>
                            <div class="maintenance-contact">
                                <p>Need urgent assistance?</p>
                                <a href="mailto:info@ikonbps.com">info@ikonbps.com</a>
                            </div>
                        </div>
                    </div>
                `;
                document.body.classList.add('maintenance-mode');
            }
        } catch (err) {
            console.error('Maintenance check failed:', err);
        }
    }

    return {
        load: async function() {
            await checkMaintenance();
            const headerPlaceholder = document.getElementById('header-placeholder');
            if (headerPlaceholder) {
                headerPlaceholder.innerHTML = HEADER_HTML;
                initSearch();
            }
        }
    };
})();

document.addEventListener('DOMContentLoaded', Components.load);
