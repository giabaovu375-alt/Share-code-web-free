export function initLightbox() {
    const root = document.getElementById('lightbox-root');
    if (!root) return;
    root.addEventListener('click', (e) => {
        if (e.target.classList.contains('lightbox')) {
            e.target.remove();
        }
    });
}
