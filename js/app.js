import {
    auth, db, onAuthStateChanged,
    createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut,
    doc, setDoc, getDoc,
    collection, getDocs
} from './firebase-config.js';

// -------------------- STATE --------------------
let products = [];
let cat = 'all';
let user = null;

// -------------------- DOM REFS --------------------
const grid = document.getElementById('productsGrid');
const statsSpan = document.getElementById('totalStats');
const menuToggle = document.getElementById('menuToggle');
const catMenu = document.getElementById('categoryMenu');

// -------------------- UTILS --------------------
function esc(s) {
    return String(s).replace(/[&<>"']/g, m => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;',
        '"': '&quot;', "'": '&#039;'
    })[m]);
}

// -------------------- DATA LOADING --------------------
async function loadProducts() {
    try {
        const res = await fetch('data/products.json');
        if (!res.ok) throw new Error('Không tải được products.json');
        products = await res.json();
        renderGrid();
    } catch (e) {
        grid.innerHTML = `<div class="empty-state">Lỗi tải sản phẩm: ${e.message}</div>`;
    }
}

async function getStats(id) {
    if (!db) return { views: 0, downloads: 0 };
    try {
        const snap = await getDoc(doc(db, 'stats', id));
        return snap.exists() ? snap.data() : { views: 0, downloads: 0 };
    } catch {
        return { views: 0, downloads: 0 };
    }
}

async function renderGrid() {
    let filtered = cat === 'all' ? products : products.filter(p => p.category === cat);

    if (filtered.length === 0) {
        grid.innerHTML = '<div class="empty-state">Chưa có sản phẩm</div>';
        return;
    }

    let html = '';
    for (const p of filtered) {
        const s = await getStats(p.id);
        const cover = p.cover || (p.demoImages && p.demoImages[0]) || 'https://via.placeholder.com/300x180/16213e/ffffff?text=No+Image';

        html += `
        <div class="product-card" onclick="location.href='product.html?id=${p.id}'">
            <div class="card-img-wrapper">
                <img src="${esc(cover)}" alt="${esc(p.name)}" onerror="this.src='https://via.placeholder.com/300x180/16213e/ffffff?text=Error'">
                <div class="card-stats">
                    <span><i class="fas fa-eye"></i> ${s.views || 0}</span>
                    <span><i class="fas fa-download"></i> ${s.downloads || 0}</span>
                </div>
            </div>
            <div class="card-info">
                <h3>${esc(p.name)}</h3>
                <p>${esc((p.description || '').substring(0, 60))}...</p>
                <span class="badge">${esc(p.category || 'khác')}</span>
            </div>
        </div>`;
    }
    grid.innerHTML = html;
}

// -------------------- CATEGORY FILTER --------------------
menuToggle.onclick = () => catMenu.classList.toggle('hidden');

catMenu.querySelectorAll('button').forEach(btn => {
    btn.onclick = () => {
        catMenu.querySelectorAll('button').forEach(b => b.classList.remove('cat-active'));
        btn.classList.add('cat-active');
        cat = btn.dataset.cat;
        renderGrid();
        catMenu.classList.add('hidden');
    };
});

// -------------------- AUTH UI --------------------
const showAuthBtn = document.getElementById('showAuthBtn');
const logoutBtn = document.getElementById('logoutBtn');
const userInfoDiv = document.getElementById('userInfo');
const userNameSpan = document.getElementById('userName');
const modal = document.getElementById('authModal');

showAuthBtn.onclick = () => modal.classList.remove('hidden');
document.querySelector('.close-modal').onclick = () => modal.classList.add('hidden');

document.getElementById('switchToRegister').onclick = (e) => {
    e.preventDefault();
    document.getElementById('loginForm').classList.add('hidden');
    document.getElementById('registerForm').classList.remove('hidden');
};

document.getElementById('switchToLogin').onclick = (e) => {
    e.preventDefault();
    document.getElementById('registerForm').classList.add('hidden');
    document.getElementById('loginForm').classList.remove('hidden');
};

document.getElementById('doRegisterBtn').onclick = async () => {
    const email = document.getElementById('regEmail').value.trim();
    const pwd = document.getElementById('regPass').value.trim();
    if (!email || !pwd) return alert('Vui lòng nhập email và mật khẩu');
    try {
        const userCred = await createUserWithEmailAndPassword(auth, email, pwd);
        await setDoc(doc(db, 'users', userCred.user.uid), {
            email: email,
            createdAt: new Date()
        });
        alert('Đăng ký thành công!');
        modal.classList.add('hidden');
        document.getElementById('loginForm').classList.remove('hidden');
        document.getElementById('registerForm').classList.add('hidden');
    } catch (err) {
        alert('Lỗi: ' + err.message);
    }
};

document.getElementById('doLoginBtn').onclick = async () => {
    const email = document.getElementById('loginEmail').value.trim();
    const pwd = document.getElementById('loginPass').value.trim();
    if (!email || !pwd) return alert('Vui lòng nhập email và mật khẩu');
    try {
        await signInWithEmailAndPassword(auth, email, pwd);
        modal.classList.add('hidden');
    } catch (err) {
        alert('Sai email hoặc mật khẩu');
    }
};

logoutBtn.onclick = async () => {
    await signOut(auth);
};

// -------------------- AUTH STATE LISTENER --------------------
onAuthStateChanged(auth, (u) => {
    user = u;
    if (u) {
        showAuthBtn.classList.add('hidden');
        userInfoDiv.classList.remove('hidden');
        userNameSpan.textContent = u.email?.split('@')[0] || 'User';
    } else {
        showAuthBtn.classList.remove('hidden');
        userInfoDiv.classList.add('hidden');
    }
});

// -------------------- TOTAL STATS --------------------
async function loadTotalStats() {
    if (!db) {
        statsSpan.textContent = '0 lượt xem / 0 tải';
        return;
    }

    try {
        const snap = await getDocs(collection(db, 'stats'));
        let totalViews = 0;
        let totalDownloads = 0;
        snap.forEach(docSnap => {
            const data = docSnap.data();
            totalViews += data.views || 0;
            totalDownloads += data.downloads || 0;
        });
        statsSpan.textContent = `${totalViews} lượt xem / ${totalDownloads} tải`;
    } catch {
        statsSpan.textContent = '0 lượt xem / 0 tải';
    }
}

// -------------------- INIT --------------------
loadProducts();
loadTotalStats();
