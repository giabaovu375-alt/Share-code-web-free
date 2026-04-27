import { 
    auth, db, 
    createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged,
    doc, setDoc, getDoc, updateDoc, increment, collection, query, getDocs
} from './firebase-config.js';

// -------------------- DOM ELEMENTS --------------------
const productsGrid = document.getElementById("productsGrid");
const showAuthBtn = document.getElementById("showAuthBtn");
const logoutBtn = document.getElementById("logoutBtn");
const userInfoDiv = document.getElementById("userInfo");
const userAvatar = document.getElementById("userAvatar");
const userNameSpan = document.getElementById("userName");
const menuToggle = document.getElementById("menuToggle");
const categoryMenu = document.getElementById("categoryMenu");
const totalStatsSpan = document.getElementById("totalStats");

const modal = document.getElementById("authModal");
const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");
const closeModal = document.querySelector(".close-modal");
const switchToRegister = document.getElementById("switchToRegister");
const switchToLogin = document.getElementById("switchToLogin");
const doLoginBtn = document.getElementById("doLoginBtn");
const doRegisterBtn = document.getElementById("doRegisterBtn");

// -------------------- STATE --------------------
let currentUser = null;
let currentCategory = "all";
let productsData = [];   // sẽ được load từ file JSON

// -------------------- FETCH DỮ LIỆU TỪ JSON --------------------
async function loadProducts() {
    try {
        const response = await fetch('data/products.json');
        if (!response.ok) throw new Error('Không tải được products.json');
        productsData = await response.json();
        renderProducts();
    } catch (error) {
        console.error("Lỗi load sản phẩm:", error);
        if (productsGrid) productsGrid.innerHTML = '<p style="color:red; text-align:center;">Không thể tải danh sách code. Vui lòng thử lại sau.</p>';
    }
}

// -------------------- MODAL HANDLERS --------------------
function openModal() { if (modal) modal.classList.remove("hidden"); }
function closeModalFunc() { if (modal) modal.classList.add("hidden"); }
if (switchToRegister) switchToRegister.onclick = (e) => { e.preventDefault(); loginForm.classList.add("hidden"); registerForm.classList.remove("hidden"); };
if (switchToLogin) switchToLogin.onclick = (e) => { e.preventDefault(); registerForm.classList.add("hidden"); loginForm.classList.remove("hidden"); };
if (closeModal) closeModal.onclick = closeModalFunc;
if (showAuthBtn) showAuthBtn.onclick = openModal;

// -------------------- ĐĂNG KÝ --------------------
if (doRegisterBtn) {
    doRegisterBtn.onclick = async () => {
        const email = document.getElementById("regEmail").value;
        const password = document.getElementById("regPass").value;
        if (!email || !password) return alert("Nhập đầy đủ email và mật khẩu");
        try {
            const userCred = await createUserWithEmailAndPassword(auth, email, password);
            await setDoc(doc(db, "users", userCred.user.uid), { email, createdAt: new Date() });
            alert("Đăng ký thành công! Vui lòng đăng nhập.");
            closeModalFunc();
            loginForm.classList.remove("hidden");
            registerForm.classList.add("hidden");
        } catch (err) {
            alert("Lỗi: " + err.message);
        }
    };
}

// -------------------- ĐĂNG NHẬP --------------------
if (doLoginBtn) {
    doLoginBtn.onclick = async () => {
        const email = document.getElementById("loginEmail").value;
        const password = document.getElementById("loginPass").value;
        if (!email || !password) return alert("Nhập email và mật khẩu");
        try {
            await signInWithEmailAndPassword(auth, email, password);
            closeModalFunc();
        } catch (err) {
            alert("Sai email hoặc mật khẩu");
        }
    };
}

// -------------------- ĐĂNG XUẤT --------------------
if (logoutBtn) logoutBtn.onclick = async () => { await signOut(auth); };

// -------------------- THỐNG KÊ --------------------
async function getStats(productId) {
    const statRef = doc(db, "stats", productId);
    const statSnap = await getDoc(statRef);
    return statSnap.exists() ? statSnap.data() : { views: 0, downloads: 0 };
}

async function loadTotalStats() {
    if (!totalStatsSpan) return;
    const q = query(collection(db, "stats"));
    const snapshot = await getDocs(q);
    let totalViews = 0, totalDownloads = 0;
    snapshot.forEach(doc => {
        const data = doc.data();
        totalViews += data.views || 0;
        totalDownloads += data.downloads || 0;
    });
    totalStatsSpan.innerText = `${totalViews} lượt xem / ${totalDownloads} tải`;
}

// -------------------- RENDER SẢN PHẨM --------------------
async function renderProducts() {
    if (!productsGrid) return;
    productsGrid.innerHTML = '';
    let filtered = productsData;
    if (currentCategory !== 'all') {
        filtered = productsData.filter(p => p.category === currentCategory);
    }
    
    for (let product of filtered) {
        const stats = await getStats(product.id);
        const card = document.createElement('div');
        card.className = 'product-card';
        card.innerHTML = `
            <div class="card-img" style="background-image: url('${product.cover}');">
                <div class="card-stats">
                    <span><i class="fas fa-eye"></i> ${stats.views}</span>
                    <span><i class="fas fa-download"></i> ${stats.downloads}</span>
                </div>
            </div>
            <div class="card-info">
                <h3>${product.name}</h3>
                <p>${product.description.substring(0, 60)}...</p>
                <div class="badge">${product.category}</div>
            </div>
        `;
        card.addEventListener('click', () => {
            window.location.href = `product.html?id=${product.id}`;
        });
        productsGrid.appendChild(card);
    }
}

// -------------------- CẬP NHẬT UI USER --------------------
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
    loadTotalStats();
    // Không gọi renderProducts() ở đây vì loadProducts() đã gọi sau auth
}

// -------------------- AUTH STATE --------------------
onAuthStateChanged(auth, (user) => {
    updateUserUI(user);
    // Sau khi auth xong, load lại sản phẩm (đảm bảo data đã được fetch)
    if (!productsData.length) loadProducts();
    else renderProducts();
});

// -------------------- CATEGORY MENU --------------------
if (menuToggle) {
    menuToggle.onclick = () => categoryMenu.classList.toggle('hidden');
    document.querySelectorAll('.category-menu button').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.category-menu button').forEach(b => b.classList.remove('cat-active'));
            btn.classList.add('cat-active');
            currentCategory = btn.dataset.cat;
            renderProducts();
            categoryMenu.classList.add('hidden');
        });
    });
}

// -------------------- INIT --------------------
(async function init() {
    await loadProducts();      // lấy dữ liệu sản phẩm
    await loadTotalStats();    // lấy thống kê (nếu có firebase)
})();
