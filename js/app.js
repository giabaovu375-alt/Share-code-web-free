// ========== CODEHUB PREMIUM – APP.JS ==========
import { 
    auth, db,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    doc, setDoc, getDoc, updateDoc, increment,
    collection, query, getDocs, addDoc, where, deleteDoc
} from './firebase-config.js';

// ========== CONFIG ==========
const DEBUG = true;
const log = (...args) => DEBUG && console.log('[CodeHub]', ...args);
const warn = (...args) => DEBUG && console.warn('[CodeHub]', ...args);
const error = (...args) => DEBUG && console.error('[CodeHub]', ...args);

// ========== XÁC ĐỊNH TRANG ==========
const path = window.location.pathname;
const isIndexPage = path === '/' || path.endsWith('index.html') || path === '';

// ========== DOM ELEMENTS ==========
let productsGrid = null;
let totalStatsSpan = null;
let menuToggle = null;
let categoryMenu = null;
let currentCategory = 'all';

if (isIndexPage) {
    productsGrid = document.getElementById('productsGrid');
    totalStatsSpan = document.getElementById('totalStats');
    menuToggle = document.getElementById('menuToggle');
    categoryMenu = document.getElementById('categoryMenu');
}

// ========== STATE ==========
let allProducts = [];
let currentUser = null;

// ========== UTILS ==========
function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[m]);
}

function showToast(msg, isError = false) {
    let toast = document.getElementById('toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'toast';
        toast.style.cssText = `
            position: fixed; bottom: 30px; left: 50%; transform: translateX(-50%);
            background: #1a1a28; color: white; padding: 14px 28px;
            border-radius: 60px; z-index: 9999; transition: opacity 0.3s;
            opacity: 0; border: 1px solid #a78bfa; font-weight: 600;
            pointer-events: none;
        `;
        document.body.appendChild(toast);
    }
    toast.style.borderColor = isError ? '#f87171' : '#a78bfa';
    toast.textContent = msg;
    toast.style.opacity = '1';
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => { toast.style.opacity = '0'; }, 2500);
}

// ========== DATA LOADING ==========
async function loadProducts() {
    try {
        const res = await fetch('data/products.json');
        if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        const data = await res.json();
        if (!Array.isArray(data)) throw new Error('JSON không phải mảng');
        allProducts = data;
        log(`✅ Đã tải ${allProducts.length} sản phẩm`);
        if (isIndexPage) renderProductGrid(allProducts);
    } catch (err) {
        error('❌ Lỗi tải products.json:', err);
        if (isIndexPage && productsGrid) {
            productsGrid.innerHTML = `<div class="error-state">
                <i class="fas fa-exclamation-circle"></i>
                <p>Không tải được dữ liệu sản phẩm</p>
                <small>${escapeHtml(err.message)}</small>
            </div>`;
        }
    }
}

// ========== STATS ==========
async function getProductStats(productId) {
    if (!db) return { views: 0, downloads: 0 };
    try {
        const ref = doc(db, 'stats', productId);
        const snap = await getDoc(ref);
        return snap.exists() ? snap.data() : { views: 0, downloads: 0 };
    } catch (err) {
        warn('⚠️ Không lấy được stats cho', productId);
        return { views: 0, downloads: 0 };
    }
}

async function loadTotalStats() {
    if (!totalStatsSpan || !db) return;
    try {
        const q = query(collection(db, 'stats'));
        const snap = await getDocs(q);
        let totalViews = 0, totalDownloads = 0;
        snap.forEach(d => {
            const data = d.data();
            totalViews += data.views || 0;
            totalDownloads += data.downloads || 0;
        });
        totalStatsSpan.textContent = `${totalViews} lượt xem / ${totalDownloads} tải`;
    } catch (err) {
        warn('⚠️ Không tải được tổng stats');
        totalStatsSpan.textContent = '0 lượt xem / 0 tải';
    }
}

// ========== RENDER PRODUCT GRID (PREMIUM) ==========
async function renderProductGrid(products) {
    if (!productsGrid) return;

    let filtered = currentCategory === 'all'
        ? products
        : products.filter(p => p.category === currentCategory);

    if (filtered.length === 0) {
        productsGrid.innerHTML = `<div class="empty-state">
            <i class="fas fa-box-open fa-2x"></i>
            <p>Chưa có sản phẩm nào trong danh mục này</p>
        </div>`;
        return;
    }

    // Xây dựng HTML string để render nhanh
    let html = '';
    for (const product of filtered) {
        const stats = await getProductStats(product.id);
        const cover = product.cover || (product.demoImages && product.demoImages[0]) || 'https://via.placeholder.com/300x180/16213e/ffffff?text=No+Image';
        const desc = (product.description || '').substring(0, 60);
        const cat = escapeHtml(product.category || 'khác');

        html += `
            <div class="product-card" onclick="window.location.href='product.html?id=${encodeURIComponent(product.id)}'">
                <div class="card-img-wrapper">
                    <img src="${escapeHtml(cover)}" alt="${escapeHtml(product.name)}" loading="lazy" onerror="this.src='https://via.placeholder.com/300x180/16213e/ffffff?text=Error'">
                    <div class="card-stats">
                        <span><i class="fas fa-eye"></i> ${stats.views || 0}</span>
                        <span><i class="fas fa-download"></i> ${stats.downloads || 0}</span>
                    </div>
                </div>
                <div class="card-info">
                    <h3>${escapeHtml(product.name)}</h3>
                    <p>${escapeHtml(desc)}...</p>
                    <span class="badge">${cat}</span>
                </div>
            </div>
        `;
    }

    productsGrid.innerHTML = html;
}

// ========== AUTH MODAL ==========
function openModal() { if (modal) modal.classList.remove('hidden'); }
function closeModal() { if (modal) modal.classList.add('hidden'); }

// ========== USER UI ==========
function updateUserUI(user) {
    if (user) {
        if (showAuthBtn) showAuthBtn.classList.add('hidden');
        if (userInfoDiv) userInfoDiv.classList.remove('hidden');
        if (userAvatar) userAvatar.src = user.photoURL || 'https://via.placeholder.com/32';
        if (userNameSpan) userNameSpan.textContent = user.displayName || (user.email ? user.email.split('@')[0] : 'User');
        currentUser = user;
    } else {
        if (showAuthBtn) showAuthBtn.classList.remove('hidden');
        if (userInfoDiv) userInfoDiv.classList.add('hidden');
        currentUser = null;
    }
}

// ========== EVENT LISTENERS ==========
if (showAuthBtn) showAuthBtn.addEventListener('click', openModal);
if (closeModalBtn) closeModalBtn.addEventListener('click', closeModal);
if (modal) modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });

if (switchToRegisterBtn) switchToRegisterBtn.addEventListener('click', (e) => {
    e.preventDefault();
    loginForm.classList.add('hidden');
    registerForm.classList.remove('hidden');
});
if (switchToLoginBtn) switchToLoginBtn.addEventListener('click', (e) => {
    e.preventDefault();
    registerForm.classList.add('hidden');
    loginForm.classList.remove('hidden');
});

if (doRegisterBtn) doRegisterBtn.addEventListener('click', async () => {
    const email = document.getElementById('regEmail')?.value;
    const pwd = document.getElementById('regPass')?.value;
    if (!email || !pwd) return showToast('Vui lòng nhập email và mật khẩu', true);
    try {
        const userCred = await createUserWithEmailAndPassword(auth, email, pwd);
        await setDoc(doc(db, 'users', userCred.user.uid), {
            email,
            createdAt: new Date()
        });
        showToast('🎉 Đăng ký thành công!');
        closeModal();
        loginForm.classList.remove('hidden');
        registerForm.classList.add('hidden');
    } catch (err) {
        showToast('❌ ' + err.message, true);
    }
});

if (doLoginBtn) doLoginBtn.addEventListener('click', async () => {
    const email = document.getElementById('loginEmail')?.value;
    const pwd = document.getElementById('loginPass')?.value;
    if (!email || !pwd) return showToast('Vui lòng nhập email và mật khẩu', true);
    try {
        await signInWithEmailAndPassword(auth, email, pwd);
        showToast('👋 Chào mừng trở lại!');
        closeModal();
    } catch (err) {
        showToast('❌ Sai email hoặc mật khẩu', true);
    }
});

if (logoutBtn) logoutBtn.addEventListener('click', async () => {
    await signOut(auth);
    showToast('👋 Đã đăng xuất');
});

// ========== CATEGORY FILTER ==========
if (isIndexPage && menuToggle && categoryMenu) {
    menuToggle.addEventListener('click', () => {
        categoryMenu.classList.toggle('hidden');
    });

    categoryMenu.querySelectorAll('button').forEach(btn => {
        btn.addEventListener('click', () => {
            categoryMenu.querySelectorAll('button').forEach(b => b.classList.remove('cat-active'));
            btn.classList.add('cat-active');
            currentCategory = btn.dataset.cat;
            renderProductGrid(allProducts);
            categoryMenu.classList.add('hidden');
        });
    });
}

// ========== AUTH STATE LISTENER ==========
onAuthStateChanged(auth, (user) => {
    updateUserUI(user);
    if (isIndexPage) {
        loadTotalStats();
        // Nếu sản phẩm đã tải rồi thì render luôn với user mới
        if (allProducts.length > 0) {
            renderProductGrid(allProducts);
        }
    }
});

// ========== KHỞI TẠO ==========
if (isIndexPage) {
    loadProducts().then(() => loadTotalStats());
}

// ========== EXPORT HELPERS (dùng cho các trang khác nếu cần) ==========
export async function incrementView(productId) {
    if (!db) return;
    const ref = doc(db, 'stats', productId);
    try { await updateDoc(ref, { views: increment(1) }); }
    catch { await setDoc(ref, { views: 1, downloads: 0 }); }
}

export async function incrementDownload(productId) {
    if (!db) return;
    const ref = doc(db, 'stats', productId);
    try { await updateDoc(ref, { downloads: increment(1) }); }
    catch { await setDoc(ref, { views: 0, downloads: 1 }); }
}

export async function isFavorite(productId, userId) {
    if (!db || !userId) return false;
    const q = query(collection(db, 'favorites'), where('userId', '==', userId), where('productId', '==', productId));
    const snap = await getDocs(q);
    return !snap.empty;
}

export async function addFavorite(productId, userId) {
    if (!db || !userId) return;
    await addDoc(collection(db, 'favorites'), { userId, productId, favoritedAt: new Date() });
}

export async function removeFavorite(productId, userId) {
    if (!db || !userId) return;
    const q = query(collection(db, 'favorites'), where('userId', '==', userId), where('productId', '==', productId));
    const snap = await getDocs(q);
    snap.forEach(doc => deleteDoc(doc.ref));
}

export async function saveDownloadHistory(userId, product) {
    if (!db || !userId) return;
    await addDoc(collection(db, 'download_history'), {
        userId,
        productId: product.id,
        productName: product.name,
        downloadLink: product.downloadLink,
        downloadedAt: new Date()
    });
    }
