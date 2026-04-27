import { 
    auth, db, 
    createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged,
    doc, setDoc, getDoc, updateDoc, increment, collection, query, getDocs, orderBy
} from './firebase-config.js';

// -------------------- DỮ LIỆU SẢN PHẨM MẪU --------------------
const productsData = [
    {
        id: "code1",
        name: "Code Game Bắn Súng HTML5",
        category: "web-game",
        cover: "images/game1.jpg",
        demoImages: ["images/game1_1.jpg", "images/game1_2.jpg"],
        description: "Game bắn súng góc nhìn thứ nhất, sử dụng HTML/CSS/JS thuần, responsive.",
        downloadLink: "https://www.mediafire.com/file/xxxxx",
        notes: "- Lỗi thường gặp: không load được ảnh do path sai. - Cần mở bằng live server."
    },
    {
        id: "code2",
        name: "Web Shop Giày Thể Thao",
        category: "web-shop",
        cover: "images/shop1.jpg",
        demoImages: ["images/shop1_1.jpg", "images/shop1_2.jpg", "images/shop1_3.jpg"],
        description: "Giao diện shop giày đẹp mắt, có giỏ hàng bằng localStorage.",
        downloadLink: "https://www.mediafire.com/file/yyyyy",
        notes: "- Chưa tích hợp thanh toán trực tuyến. - Hình ảnh cần tự thay."
    },
    {
        id: "code3",
        name: "Web Xem Phim (embed)",
        category: "web-film",
        cover: "images/film1.jpg",
        demoImages: ["images/film1_1.jpg"],
        description: "Web xem phim với thanh tìm kiếm, embed từ nhiều nguồn.",
        downloadLink: "https://www.mediafire.com/file/zzzzz",
        notes: "- Nguồn phim có thể bị chặn. - Cần cập nhật link embed thường xuyên."
    }
];

let currentUser = null;
let currentCategory = "all";

// DOM elements
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

// -------------------- MODAL HANDLERS --------------------
function openModal() { modal.classList.remove("hidden"); }
function closeModalFunc() { modal.classList.add("hidden"); }
switchToRegister.onclick = (e) => { e.preventDefault(); loginForm.classList.add("hidden"); registerForm.classList.remove("hidden"); };
switchToLogin.onclick = (e) => { e.preventDefault(); registerForm.classList.add("hidden"); loginForm.classList.remove("hidden"); };
closeModal.onclick = closeModalFunc;
if (showAuthBtn) showAuthBtn.onclick = openModal;

// -------------------- ĐĂNG KÝ --------------------
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

// -------------------- ĐĂNG NHẬP --------------------
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

// -------------------- ĐĂNG XUẤT --------------------
if (logoutBtn) logoutBtn.onclick = async () => { await signOut(auth); };

// -------------------- THỐNG KÊ --------------------
async function updateStats(productId, type) { /* đã có trong product.html, không cần ở đây */ }
async function getStats(productId) {
    const statSnap = await getDoc(doc(db, "stats", productId));
    return statSnap.exists() ? statSnap.data() : { views: 0, downloads: 0 };
}
async function loadTotalStats() {
    const q = query(collection(db, "stats"));
    const snapshot = await getDocs(q);
    let totalViews = 0, totalDownloads = 0;
    snapshot.forEach(doc => {
        const data = doc.data();
        totalViews += data.views || 0;
        totalDownloads += data.downloads || 0;
    });
    if (totalStatsSpan) totalStatsSpan.innerText = `${totalViews} lượt xem / ${totalDownloads} tải`;
}

// -------------------- RENDER SẢN PHẨM --------------------
async function renderProducts() {
    if (!productsGrid) return;
    productsGrid.innerHTML = '';
    let filtered = productsData;
    if (currentCategory !== 'all') filtered = productsData.filter(p => p.category === currentCategory);
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
    renderProducts();
}

// -------------------- AUTH STATE --------------------
onAuthStateChanged(auth, (user) => {
    updateUserUI(user);
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

// -------------------- KHỞI TẠO --------------------
(async function init() {
    await loadTotalStats();
    renderProducts();
})();
