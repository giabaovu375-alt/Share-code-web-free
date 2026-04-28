import { initAuth } from './components/AuthModal.js';
import { initIndexPage } from './pages/index.js';
import { initProductPage } from './pages/product.js';

const path = window.location.pathname;

async function bootApp() {
    initAuth();

    if (path.endsWith('index.html') || path === '/' || path === '') {
        await initIndexPage();
    } else if (path.endsWith('product.html')) {
        await initProductPage();
    }

    document.getElementById('app-loading').style.display = 'none';
    document.getElementById('app').style.display = 'block';
}

bootApp().catch(console.error);
