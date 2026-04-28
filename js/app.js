// Bản debug tạm thời - Chỉ tắt loading và hiển thị nội dung tĩnh
import { initAuth } from './components/AuthModal.js';

const appEl = document.getElementById('app');
const loaderEl = document.getElementById('app-loading');
const mainContent = document.getElementById('mainContent');
const productContent = document.getElementById('productContent');
const path = window.location.pathname;

// Tắt loading ngay lập tức
if (loaderEl) loaderEl.style.display = 'none';
if (appEl) appEl.style.display = 'block';

// Khởi tạo auth (vẫn giữ để test xem có lỗi không)
initAuth();

// Hiển thị nội dung tạm thời
if (path.endsWith('product.html') && productContent) {
    const pid = new URLSearchParams(location.search).get('id');
    if (!pid) {
        productContent.innerHTML = '<div style="padding:40px;text-align:center;color:#f87171;">Thiếu ID sản phẩm. Ví dụ: ?id=code1</div>';
    } else {
        // Thử fetch sản phẩm và hiển thị
        fetch('data/products.json')
            .then(r => r.json())
            .then(data => {
                const product = data.find(p => p.id === pid);
                if (!product) {
                    productContent.innerHTML = `<div style="padding:40px;text-align:center;color:#f87171;">Không tìm thấy sản phẩm với id: ${pid}</div>`;
                } else {
                    productContent.innerHTML = `<h1>${product.name}</h1><p>${product.description}</p>`;
                    document.title = product.name + ' | CodeHub';
                }
            })
            .catch(err => {
                productContent.innerHTML = `<div style="padding:40px;text-align:center;color:#f87171;">Lỗi: ${err.message}</div>`;
            });
    }
} else if (mainContent) {
    mainContent.innerHTML = '<div style="padding:40px;text-align:center;">Trang chủ CodeHub Premium.</div>';
}
