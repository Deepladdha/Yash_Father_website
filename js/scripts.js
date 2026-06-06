// Mobile menu
const menuToggle = document.querySelector('.menu-toggle');
if (menuToggle) {
    menuToggle.addEventListener('click', () => {
        document.getElementById('navLinks').classList.toggle('active');
    });
}

// Mobile dropdowns
document.querySelectorAll('.dropdown > a').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
        if (window.innerWidth <= 900) {
            e.preventDefault();
            anchor.parentElement.classList.toggle('active');
        }
    });
});

// Testimonials Slideshow
const slides = document.querySelectorAll('.testimonial-card');
const testPrev = document.getElementById('testPrev');
const testNext = document.getElementById('testNext');
let currentSlide = 0;

function showSlide(index) {
    if (slides.length === 0) return;
    slides[currentSlide].style.opacity = '0';
    slides[currentSlide].style.zIndex = '0';
    
    currentSlide = (index + slides.length) % slides.length;
    
    slides[currentSlide].style.opacity = '1';
    slides[currentSlide].style.zIndex = '1';
}

// Ensure initial state
slides.forEach((s, i) => {
    s.style.position = 'absolute';
    s.style.top = '0';
    s.style.left = '0';
    s.style.width = '100%';
    s.style.height = '100%';
    s.style.opacity = (i === 0) ? '1' : '0';
    s.style.zIndex = (i === 0) ? '1' : '0';
});

if (testNext) testNext.addEventListener('click', () => showSlide(currentSlide + 1));
if (testPrev) testPrev.addEventListener('click', () => showSlide(currentSlide - 1));

// Auto-cycle
if (slides.length > 0) setInterval(() => showSlide(currentSlide + 1), 6000);

// Hero video carousel
const heroSlides = document.querySelectorAll('.video-slide');
const dotsContainer = document.getElementById('carouselDots');
let current = 0;

if (dotsContainer) {
    heroSlides.forEach((_, i) => {
        const dot = document.createElement('button');
        dot.className = 'carousel-dot' + (i === 0 ? ' active' : '');
        dot.addEventListener('click', () => goTo(i));
        dotsContainer.appendChild(dot);
    });
}

function goTo(n) {
    if (heroSlides.length === 0) return;
    heroSlides[current].classList.remove('active');
    if (dotsContainer) dotsContainer.children[current].classList.remove('active');
    heroSlides[current].querySelector('video')?.pause();
    current = n;
    heroSlides[current].classList.add('active');
    if (dotsContainer) dotsContainer.children[current].classList.add('active');
    const vid = heroSlides[current].querySelector('video');
    if (vid) { vid.currentTime = 0; vid.play(); }
}

if (heroSlides.length > 0) setInterval(() => goTo((current + 1) % heroSlides.length), 5000);

// Application Industries cards
const appsGrid = document.getElementById('appsGrid');
if (appsGrid && typeof INDUSTRIES_DATA !== 'undefined') {
    INDUSTRIES_DATA.forEach((ind, i) => {
        const card = document.createElement('a');
        card.href = 'applications.html?industry=' + ind.id;
        card.className = 'product-card' + (i >= 8 ? ' hidden-app' : '');
        card.innerHTML = '<div class="product-card-body"><h3>' + ind.name + '</h3><p>' + ind.shortDesc + '</p><span class="product-card-explore">View Details →</span></div>';
        appsGrid.appendChild(card);
    });
}

const viewMoreBtn = document.getElementById('viewMoreBtn');
if (viewMoreBtn) {
    const hiddenApps = document.querySelectorAll('.hidden-app');
    let expanded = false;
    viewMoreBtn.addEventListener('click', () => {
        expanded = !expanded;
        hiddenApps.forEach(el => el.style.setProperty('display', expanded ? 'flex' : 'none', 'important'));
        viewMoreBtn.textContent = expanded ? 'View Less' : 'View More Applications';
    });
}

// Accordion (FAQ)
document.querySelectorAll('.accordion-header').forEach(btn => {
    btn.addEventListener('click', () => {
        console.log('FAQ button clicked');
        const item = btn.parentElement;
        const content = item.querySelector('.accordion-content');
        const isOpen = item.classList.contains('open');
        
        document.querySelectorAll('.accordion-item').forEach(i => {
            i.classList.remove('open');
            const c = i.querySelector('.accordion-content');
            if (c) c.classList.remove('open');
        });
        
        if (!isOpen) {
            item.classList.add('open');
            if (content) content.classList.add('open');
        }
    });
});

// Popular Searches accordion
document.querySelectorAll('.ps-accordion-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const content = btn.nextElementSibling;
        const isOpen = content.classList.contains('open');
        document.querySelectorAll('.ps-accordion-content').forEach(c => c.classList.remove('open'));
        if (!isOpen) content.classList.add('open');
    });
});

// User tracking initialization
if (typeof userTracker !== 'undefined') {
    console.log('User tracking initialized for user:', userTracker.userId);
}

// Theme switcher
function initThemeSwitcher() {
    const themeToggle = document.createElement('button');
    themeToggle.className = 'theme-toggle';
    themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
    themeToggle.setAttribute('aria-label', 'Toggle dark/light theme');
    themeToggle.setAttribute('title', 'Toggle theme');
    
    // Position in header
    const header = document.querySelector('header');
    if (header) {
        header.style.position = 'relative';
        themeToggle.style.position = 'absolute';
        themeToggle.style.right = '20px';
        themeToggle.style.top = '50%';
        themeToggle.style.transform = 'translateY(-50%)';
        themeToggle.style.zIndex = '1001';
        themeToggle.style.background = 'var(--blue)';
        themeToggle.style.color = 'var(--white)';
        themeToggle.style.border = 'none';
        themeToggle.style.borderRadius = '50%';
        themeToggle.style.width = '40px';
        themeToggle.style.height = '40px';
        themeToggle.style.cursor = 'pointer';
        themeToggle.style.display = 'flex';
        themeToggle.style.alignItems = 'center';
        themeToggle.style.justifyContent = 'center';
        themeToggle.style.fontSize = '1.2rem';
        
        header.appendChild(themeToggle);
        
        // Toggle functionality
        themeToggle.addEventListener('click', () => {
            const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
            const newTheme = currentTheme === 'light' ? 'dark' : 'light';
            
            // Update icon
            themeToggle.innerHTML = newTheme === 'light' ? '<i class="fas fa-moon"></i>' : '<i class="fas fa-sun"></i>';
            
            // Apply theme
            if (typeof userTracker !== 'undefined') {
                userTracker.setTheme(newTheme);
            } else {
                document.documentElement.setAttribute('data-theme', newTheme);
                try {
                    localStorage.setItem('theme', newTheme);
                } catch (e) {
                    console.warn('Failed to save theme:', e);
                }
            }
            
            // Track theme change
            if (typeof gtag !== 'undefined') {
                gtag('event', 'theme_change', {
                    theme: newTheme,
                    user_id: typeof userTracker !== 'undefined' ? userTracker.userId : 'unknown'
                });
            }
        });
        
        // Set initial icon based on current theme
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
        themeToggle.innerHTML = currentTheme === 'light' ? '<i class="fas fa-moon"></i>' : '<i class="fas fa-sun"></i>';
    }
}

// Initialize theme switcher when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initThemeSwitcher);
} else {
    initThemeSwitcher();
}
