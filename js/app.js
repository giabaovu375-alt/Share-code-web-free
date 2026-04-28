import { 
    auth, db,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    doc, setDoc, getDoc, updateDoc, increment,
    collection, query, getDocs, addDoc, where, deleteDoc
} from './firebase-config.js';

// -------------------- XÁC ĐỊNH TRANG --------------------
const path = window.location.pathname;
const isIndexPage = path === '/' || path.endsWith('index.html') || path === '';

// -------------------- DOM ELEMENTS (chỉ khi ở index) --------------------
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

// -------------------- DỮ LIỆU SẢN PHẨM --------------------
let productsData = [];

async function loadProductsJSON() {
    try {
        const res = await fetch('data/products.json');
        if (!res.ok) throw new Error('Không tải được products.json');
        productsData = await res.json();
        if (isIndexPage && productsGrid) {
            renderProducts(productsData);
        }
        return productsData;
    } catch (err) {
        console.error("Lỗi load sản phẩm:", err);
        return [];
    }
}

// -------------------- HIỂN THỊ SẢN PHẨM (ĐÃ NÂNG CẤP) --------------------
async function renderProducts(products) {
    if (!productsGrid) return;
    
    let filtered = products;
    if (currentCategory !== 'all') {
        filtered = products.filter(p => p.category === currentCategory);
    }

    // Xóa sạch grid
    productsGrid.innerHTML = '';

    if (filtered.length === 0) {
        productsGrid.innerHTML = `<div class="empty-state">Chưa có sản phẩm nào.</div>`;
        return;
    }

    // Tạo HTML string cho toàn bộ grid (nhanh hơn tạo DOM rời)
    let html = '';
    for (const product of filtered) {
        // Lấy stats từ Firebase (vẫn giữ nguyên)
        const stats = await getStats(product.id);
        const cover = product.cover || (product.demoImages && product.demoImages[0]) || 'https://via.placeholder.com/300x180/16213e/ffffff?text=No+Image';
        
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
                    <p>${escapeHtml((product.description || '').substring(0, 60))}...</p>
                    <div class="badge">${escapeHtml(product.category || 'khác')}</div>
                </div>
            </div>
        `;
    }
    
    // Gán một lần duy nhất
    productsGrid.innerHTML = html;
}

// -------------------- THỐNG KÊ (GIỮ NGUYÊN) --------------------
async function getStats(productId) {
    try {
        const statRef = doc(db, 'stats', productId);
        const snap = await getDoc(statRef);
        return snap.exists() ? snap.data() : { views: 0, downloads: 0 };
    } catch (e) { return { views: 0, downloads: 0 }; }
}

async function loadTotalStats() {
    if (!totalStatsSpan) return;
    const q = query(collection(db, 'stats'));
    const snapshot = await getDocs(q);
    let totalViews = 0, totalDownloads = 0;
    snapshot.forEach(doc => {
        const data = doc.data();
        totalViews += data.views || 0;
        totalDownloads += data.downloads || 0;
    });
    totalStatsSpan.innerText = `${totalViews} lượt xem / ${totalDownloads} tải`;
}

// -------------------- AUTH MODAL & APP (GIỮ NGUYÊN) --------------------
let currentUser = null;
const showAuthBtn = document.getElementById('showAuthBtn');
const logoutBtn = document.getElementById('logoutBtn');
const userInfoDiv = document.getElementById('userInfo');
const userAvatar = document.getElementById('userAvatar');
const userNameSpan = document.getElementById('userName');
const modal = document.getElementById('authModal');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const closeModal = document.querySelector('.close-modal');
const switchToRegister = document.getElementById('switchToRegister');
const switchToLogin = document.getElementById('switchToLogin');
const doLoginBtn = document.getElementById('doLoginBtn');
const doRegisterBtn = document.getElementById('doRegisterBtn');

function openModal() { if (modal) modal.classList.remove('hidden'); }
function closeModalFunc() { if (modal) modal.classList.add('hidden'); }
if (switchToRegister) switchToRegister.onclick = (e) => { e.preventDefault(); loginForm.classList.add('hidden'); registerForm.classList.remove('hidden'); };
if (switchToLogin) switchToLogin.onclick = (e) => { e.preventDefault(); registerForm.classList.add('hidden'); loginForm.classList.remove('hidden'); };
if (closeModal) closeModal.onclick = closeModalFunc;
if (showAuthBtn) showAuthBtn.onclick = openModal;

if (doRegisterBtn) {
    doRegisterBtn.onclick = async () => {
        const email = document.getElementById('regEmail').value;
        const pwd = document.getElementById('regPass').value;
        if (!email || !pwd) return alert('Nhập email và mật khẩu');
        try {
            const userCred = await createUserWithEmailAndPassword(auth, email, pwd);
            await setDoc(doc(db, 'users', userCred.user.uid), { email, createdAt: new Date() });
            alert('Đăng ký thành công! Vui lòng đăng nhập.');
            closeModalFunc();
            loginForm.classList.remove('hidden');
            registerForm.classList.add('hidden');
        } catch (err) { alert('Lỗi: ' + err.message); }
    };
}

if (doLoginBtn) {
    doLoginBtn.onclick = async () => {
        const email = document.getElementById('loginEmail').value;
        const pwd = document.getElementById('loginPass').value;
        if (!email || !pwd) return alert('Nhập email và mật khẩu');
        try {
            await signInWithEmailAndPassword(auth, email, pwd);
            closeModalFunc();
        } catch (err) { alert('Sai email hoặc mật khẩu'); }
    };
}

if (logoutBtn) logoutBtn.onclick = async () => { await signOut(auth); };

function updateUserUI(user) {
    if (user) {
        if (showAuthBtn) showAuthBtn.classList.add('hidden');
        if (userInfoDiv) userInfoDiv.classList.remove('hidden');
        if (userAvatar) userAvatar.src = 'https://via.placeholder.com/32';
        if (userNameSpan) userNameSpan.innerText = user.email.split('@')[0];
        currentUser = user;
    } else {
        if (showAuthBtn) showAuthBtn.classList.remove('hidden');
        if (userInfoDiv) userInfoDiv.classList.add('hidden');
        currentUser = null;
    }
}

onAuthStateChanged(auth, (user) => {
    updateUserUI(user);
    if (isIndexPage) {
        loadTotalStats();
        if (productsData.length === 0) loadProductsJSON();
        else renderProducts(productsData);
    }
});

// -------------------- CATEGORY MENU (GIỮ NGUYÊN) --------------------
if (isIndexPage && menuToggle) {
    menuToggle.onclick = () => categoryMenu.classList.toggle('hidden');
    document.querySelectorAll('.category-menu button').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.category-menu button').forEach(b => b.classList.remove('cat-active'));
            btn.classList.add('cat-active');
            currentCategory = btn.dataset.cat;
            renderProducts(productsData);
            categoryMenu.classList.add('hidden');
        });
    });
}

// -------------------- KHỞI TẠO --------------------
if (isIndexPage) {
    loadProductsJSON();
    loadTotalStats();
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

// Export các hàm cần thiết cho các trang khác (giữ nguyên)
export { getStats, incrementView, incrementDownload, isFavorite, addFavorite, removeFavorite, saveDownloadHistory };

// Các hàm bổ sung cho product.html, favorites.html (giữ nguyên)
async function incrementView(productId) {
    const statRef = doc(db, 'stats', productId);
    await updateDoc(statRef, { views: increment(1) }).catch(async () => {
        await setDoc(statRef, { views: 1, downloads: 0 });
    });
}
async function incrementDownload(productId) {
    const statRef = doc(db, 'stats', productId);
    await updateDoc(statRef, { downloads: increment(1) }).catch(async () => {
        await setDoc(statRef, { views: 0, downloads: 1 });
    });
}
async function isFavorite(productId, userId) {
    if (!userId) return false;
    const q = query(collection(db, 'favorites'), where('userId', '==', userId), where('productId', '==', productId));
    const snap = await getDocs(q);
    return !snap.empty;
}
async function addFavorite(productId, userId) {
    await addDoc(collection(db, 'favorites'), { userId, productId, favoritedAt: new Date() });
}
async function removeFavorite(productId, userId) {
    const q = query(collection(db, 'favorites'), where('userId', '==', userId), where('productId', '==', productId));
    const snap = await getDocs(q);
    snap.forEach(doc => deleteDoc(doc.ref));
}
async function saveDownloadHistory(userId, product) {
    if (!userId) return;
    await addDoc(collection(db, 'download_history'), {
        userId: userId,
        productId: product.id,
        productName: product.name,
        downloadLink: product.downloadLink,
        downloadedAt: new Date()
    });
        }
