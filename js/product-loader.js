import { SupabaseService } from './services/supabase.js';

/**
 * Product Loader
 * Dynamically fetches and renders product details from Supabase.
 */
document.addEventListener('DOMContentLoaded', async () => {
    const params = new URLSearchParams(window.location.search);
    const productId = params.get('id');

    if (!productId) {
        window.location.href = 'product-center.html';
        return;
    }

    try {
        const product = await fetchProductDetails(productId);
        if (!product) {
            showError('Product not found');
            return;
        }
        renderProduct(product);
    } catch (err) {
        console.error('Error loading product:', err);
        showError('Failed to load product details');
    }
});

async function fetchProductDetails(id) {
    const { data, error } = await SupabaseService.getClient()
        .from('products')
        .select('*')
        .eq('id', id)
        .single();
    
    if (error) throw error;
    return data;
}

function renderProduct(product) {
    // Update basic info
    document.title = `${product.name} | IKON BPS`;
    document.getElementById('productNameBreadcrumb').textContent = product.name;
    document.getElementById('productTitle').innerHTML = product.name;
    document.getElementById('productSubtitle').textContent = product.subtitle || '';
    document.getElementById('productDescription').textContent = product.description;
    
    const img = document.getElementById('productImage');
    img.src = product.image_url || 'img/products/default.png';
    img.alt = product.name;

    // Render Features
    const featuresList = document.getElementById('productFeatures');
    if (product.features && Array.isArray(product.features)) {
        featuresList.innerHTML = product.features.map(f => `<li>${f}</li>`).join('');
    }

    // Render Specs
    const specTableBody = document.querySelector('#specTable tbody');
    if (product.specifications && typeof product.specifications === 'object') {
        specTableBody.innerHTML = Object.entries(product.specifications).map(([key, val]) => `
            <tr>
                <td><strong>${key}</strong></td>
                <td>${val}</td>
            </tr>
        `).join('');
    }
}

function showError(msg) {
    const container = document.querySelector('.product-detail-section .section-inner');
    container.innerHTML = `<div class="error-msg text-center">
        <h2>Oops!</h2>
        <p>${msg}</p>
        <a href="product-center.html" class="btn btn-outline mt-20">Back to Products</a>
    </div>`;
}
