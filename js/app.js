// js/app.js - Đã fix lỗi loading treo vĩnh viễn
import { initAuth } from './components/AuthModal.js';
import { initIndexPage } from './pages/index.js';
import { initProductPage } from './pages/product.js';

const path = window.location.pathname;

async function bootApp() {
    // Luôn ẩn loading khi xong, dù thành công hay thất bại
    const loader = document.getElementById('app-loading');
    const app = document.getElementById('app');

    try {
        // Khởi tạo Auth (modal đăng nhập) trước
        initAuth();

        // Xác định trang và gọi init tương ứng
        if (path.endsWith('index.html') || path === '/' || path === '') {
            await initIndexPage();
        } else if (path.endsWith('product.html')) {
            await initProductPage();
        }
    } catch (err) {
        // Nếu có lỗi, hiển thị ra giao diện
        console.error('Lỗi khởi tạo ứng dụng:', err);
        const mainContent = document.getElementById('mainContent') || document.getElementById('productContent');
        if (mainContent) {
            mainContent.innerHTML = `<div class="empty-state" style="color:#f87171;">⚠️ Lỗi: ${err.message}<br><small>Vui lòng kiểm tra Console (F12) để biết chi tiết.</small></div>`;
        }
    } finally {
        // Dù sao cũng phải ẩn loading, hiển thị app
        loader.style.display = 'none';
        app.style.display = 'block';
    }
}

bootApp();
