import { escapeHtml, truncate, formatNumber } from '../core/utils.js';

export function ProductCard(product, stats = { views: 0, downloads: 0 }) {
    const cover = product.cover || (product.demoImages && product.demoImages[0]) || 'https://via.placeholder.com/300x180/16213e/ffffff?text=No+Image';
    return `
        <div class="product-card" data-id="${product.id}">
            <div class="card-img-wrapper">
                <img src="${escapeHtml(cover)}" alt="${escapeHtml(product.name)}" loading="lazy" onerror="this.src='https://via.placeholder.com/300x180/16213e/ffffff?text=Error'">
                <div class="card-stats">
                    <span><i class="fas fa-eye"></i> ${formatNumber(stats.views)}</span>
                    <span><i class="fas fa-download"></i> ${formatNumber(stats.downloads)}</span>
                </div>
            </div>
            <div class="card-info">
                <h3>${escapeHtml(product.name)}</h3>
                <p>${truncate(escapeHtml(product.description || ''), 60)}</p>
                <span class="card-badge">${escapeHtml(product.category || 'khác')}</span>
            </div>
        </div>
    `;
}
