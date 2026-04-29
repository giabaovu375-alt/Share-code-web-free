// ========== IMPORTS ==========
import { auth, db } from './firebase-config.js';
import { onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { doc, setDoc, getDoc, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

// ========== STATE & DOM ==========
let allProducts = [];
let currentCategory = 'all';
let currentUser = null;

const grid = document.getElementById('productsGrid');
const statsSpan = document.getElementById('totalStats');
const menuToggle = document.getElementById('menuToggle');
const catMenu = document.getElementById('categoryMenu');
const showAuthBtn = document.getElementById('showAuthBtn');
const userInfoDiv = document.getElementById('userInfo');
const userNameSpan = document.getElementById('userName');
const logoutBtn = document.getElementById('logoutBtn');
const authModal = document.getElementById('authModal');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');

// ========== UTILS ==========
function esc(s) { return s ? String(s).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'})[m]) : ''; }

// ========== DATA LOADING ==========
async function loadProducts() {
    try {
        const res = await fetch('data/products.json');
        if (!res.ok) throw new Error('Không tải được products.json');
        allProducts = await res.json();
        renderGrid();
    } catch (e) {
        grid.innerHTML = `<div class="empty-state">Lỗi tải sản phẩm: ${e.message}</div>`;
    }
}

async function getStats(productId) {
    if (!db) return { views: 0, downloads: 0 };
    try {
        const snap = await getDoc(doc(db, 'stats', productId));
        return snap.exists() ? snap.data() : { views: 0, downloads: 0 };
    } catch { return { views: 0, downloads: 0 }; }
}

async function renderGrid() {
    let filtered = currentCategory === 'all' ? allProducts : allProducts.filter(p => p.category === currentCategory);
    if (filtered.length === 0) {
        grid.innerHTML = '<div class="empty-state">Chưa có sản phẩm trong danh mục này</div>';
        return;
    }
    let html = '';
    for (const p of filtered) {
        const s = await getStats(p.id);
        const cover = p.cover || (p.demoImages && p.demoImages[0]) || 'https://via.placeholder.com/300x180/16213e/ffffff?text=No+Image';
        html += `<div class="product-card" onclick="location.href='product.html?id=${p.id}'">
            <div class="card-img-wrapper"><img src="${esc(cover)}" alt="${esc(p.name)}" onerror="this.src='https://via.placeholder.com/300x180/16213e/ffffff?text=Error'"><div class="card-stats"><span><i class="fas fa-eye"></i> ${s.views || 0}</span><span><i class="fas fa-download"></i> ${s.downloads || 0}</span></div></div>
            <div class="card-info"><h3>${esc(p.name)}</h3><p>${esc((p.description||'').substring(0, 60))}...</p><span class="badge">${esc(p.category||'khác')}</span></div>
        </div>`;
    }
    grid.innerHTML = html;
}

// ========== CATEGORY FILTER ==========
menuToggle.onclick = () => catMenu.classList.toggle('hidden');
catMenu.querySelectorAll('button').forEach(btn => {
    btn.onclick = () => {
        catMenu.querySelectorAll('button').forEach(b => b.classList.remove('cat-active'));
        btn.classList.add('cat-active');
        currentCategory = btn.dataset.cat;
        renderGrid();
        catMenu.classList.add('hidden');
    };
});

// ========== AUTH UI ==========
showAuthBtn.onclick = () => authModal.classList.remove('hidden');
document.querySelector('.close-modal').onclick = () => authModal.classList.add('hidden');
document.getElementById('switchToRegister').onclick = (e) => { e.preventDefault(); loginForm.classList.add('hidden'); registerForm.classList.remove('hidden'); };
document.getElementById('switchToLogin').onclick = (e) => { e.preventDefault(); registerForm.classList.add('hidden'); loginForm.classList.remove('hidden'); };

document.getElementById('doRegisterBtn').onclick = async () => {
    const email = document.getElementById('regEmail').value.trim();
    const pwd = document.getElementById('regPass').value.trim();
    if (!email || !pwd) return alert('Vui lòng nhập đầy đủ thông tin');
    try {
        const cred = await createUserWithEmailAndPassword(auth, email, pwd);
        await setDoc(doc(db, 'users', cred.user.uid), { email, createdAt: new Date() });
        alert('Đăng ký thành công!');
        authModal.classList.add('hidden');
    } catch (err) { alert('Lỗi: ' + err.message); }
};

document.getElementById('doLoginBtn').onclick = async () => {
    const email = document.getElementById('loginEmail').value.trim();
    const pwd = document.getElementById('loginPass').value.trim();
    if (!email || !pwd) return alert('Vui lòng nhập đầy đủ thông tin');
    try {
        await signInWithEmailAndPassword(auth, email, pwd);
        authModal.classList.add('hidden');
    } catch (err) { alert('Sai email hoặc mật khẩu'); }
};

logoutBtn.onclick = async () => await signOut(auth);

// ========== AUTH STATE ==========
onAuthStateChanged(auth, (u) => {
    currentUser = u;
    if (u) {
        showAuthBtn.classList.add('hidden');
        userInfoDiv.classList.remove('hidden');
        if (userNameSpan) userNameSpan.textContent = u.email?.split('@')[0] || 'User';
    } else {
        showAuthBtn.classList.remove('hidden');
        userInfoDiv.classList.add('hidden');
    }
});

// ========== TOTAL STATS ==========
async function loadTotalStats() {
    if (!db) { statsSpan.textContent = '0 lượt xem / 0 tải'; return; }
    try {
        const snap = await getDocs(collection(db, 'stats'));
        let totalViews = 0, totalDownloads = 0;
        snap.forEach(docSnap => {
            const data = docSnap.data();
            totalViews += data.views || 0;
            totalDownloads += data.downloads || 0;
        });
        statsSpan.textContent = `${totalViews} lượt xem / ${totalDownloads} tải`;
    } catch { statsSpan.textContent = '0 lượt xem / 0 tải'; }
}

// ========== INIT ==========
loadProducts();
loadTotalStats();
