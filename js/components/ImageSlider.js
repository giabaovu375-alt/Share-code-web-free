export function ImageSlider(images = []) {
    if (!images.length) return '<div class="empty-state">Không có ảnh demo</div>';
    const imagesHtml = images.map(src => `<img src="${src}" alt="demo" loading="lazy" onclick="document.querySelector('#lightbox-root').innerHTML = '<div class=\"lightbox active\" onclick=\"this.remove()\"><img src=\"${src}\"></div>'">`).join('');
    return `
        <div class="slider-wrapper">
            <div class="slider-viewport">${imagesHtml}</div>
            ${images.length > 1 ? `
            <button class="slider-btn slider-left" onclick="this.parentElement.querySelector('.slider-viewport').scrollBy({left:-320,behavior:'smooth'})"><i class="fas fa-chevron-left"></i></button>
            <button class="slider-btn slider-right" onclick="this.parentElement.querySelector('.slider-viewport').scrollBy({left:320,behavior:'smooth'})"><i class="fas fa-chevron-right"></i></button>
            ` : ''}
        </div>
    `;
}
