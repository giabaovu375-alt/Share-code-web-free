import { appState } from '../core/state.js';
import { fetchProducts, getProductStats, getGlobalStats } from '../core/api.js';
import { ProductCard } from '../components/ProductCard.js';
import { formatNumber } from '../core/utils.js';

let currentCategory = 'all';

export async function initIndexPage() {
    const mainContent = document.getElementById('mainContent');
    const globalStatsEl = document.getElementById('globalStats');
    
    try {
        const [products, globalStats] = await Promise.all([
            fetchProducts(),
            getGlobalStats()
        ]);
        
        if (globalStatsEl) {
            globalStatsEl.innerHTML = `<i class="fas fa-chart-line"></i> ${formatNumber(globalStats.views)} lượt xem / ${formatNumber(globalStats.downloads)} tải`;
        }

        renderProducts(products);
    } catch (e) {
        mainContent.innerHTML = `<div class="empty-state">Không tải được sản phẩm: ${e.message}</div>`;
    }

    // Filter buttons
    document.querySelector('.filter-left').addEventListener('click', async (e) => {
        if (e.target.classList.contains('filter-btn')) {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            currentCategory = e.target.dataset.cat;
            const products = appState.get('products') || await fetchProducts();
            renderProducts(products);
        }
    });

    // Product card click
    mainContent.addEventListener('click', (e) => {
        const card = e.target.closest('.product-card');
        if (card) {
            const id = card.dataset.id;
            if (id) window.location.href = `product.html?id=${id}`;
        }
    });
}

async function renderProducts(products) {
    const mainContent = document.getElementById('mainContent');
    let filtered = currentCategory === 'all' ? products : products.filter(p => p.category === currentCategory);
    
    if (!filtered.length) {
        mainContent.innerHTML = '<div class="empty-state">Không có sản phẩm nào</div>';
        return;
    }

    let html = '<div class="products-grid">';
    for (const product of filtered) {
        const stats = await getProductStats(product.id);
        html += ProductCard(product, stats);
    }
    html += '</div>';
    mainContent.innerHTML = html;
}
