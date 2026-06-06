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
