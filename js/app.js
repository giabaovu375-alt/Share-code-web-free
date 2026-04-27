import { 
    auth, db,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    doc, setDoc, getDoc, updateDoc, increment,
    collection, query, getDocs, addDoc, orderBy, where
} from './firebase-config.js';

// -------------------- XÁC ĐỊNH TRANG HIỆN TẠI --------------------
const path = window.location.pathname;
const isProductPage = path.includes('product.html');
const isHistoryPage = path.includes('history.html');

// -------------------- DỮ LIỆU SẢN PHẨM --------------------
let productsData = [];

async function loadProductsJSON() {
    try {
        const res = await fetch('data/products.json');
        if (!res.ok) throw new Error('Không thể tải products.json');
        productsData = await res.json();
        if (!isProductPage && !isHistoryPage && document.getElementById('productsGrid')) {
            renderProducts(productsData);
        }
        return productsData;
    } catch (err) {
        console.error("Lỗi load sản phẩm:", err);
        return [];
    }
}

// -------------------- RENDER TRANG CHỦ --------------------
let currentCategory = 'all';
async function renderProducts(products) {
    const grid = document.getElementById('productsGrid');
    if (!grid) return;
    let filtered = products;
    if (currentCategory !== 'all') {
        filtered = products.filter(p => p.category === currentCategory);
    }
    grid.innerHTML = '';
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
        card.onclick = () => { window.location.href = `product.html?id=${product.id}`; };
        grid.appendChild(card);
    }
}

// -------------------- STATS --------------------
async function getStats(productId) {
    try {
        const statRef = doc(db, 'stats', productId);
        const snap = await getDoc(statRef);
        return snap.exists() ? snap.data() : { views: 0, downloads: 0 };
    } catch (e) { return { views: 0, downloads: 0 }; }
}

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

// -------------------- LƯU LỊCH SỬ TẢI --------------------
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

// -------------------- TRANG CHI TIẾT SẢN PHẨM --------------------
if (isProductPage) {
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');
    (async () => {
        const products = await loadProductsJSON();
        const product = products.find(p => p.id === productId);
        if (!product) {
            document.getElementById('productDetail').innerHTML = '<p class="error">Không tìm thấy sản phẩm</p>';
            return;
        }
        // Tăng lượt xem (nếu đã đăng nhập vẫn tăng, nhưng cần lấy user)
        await incrementView(product.id);

        const demoHtml = product.demoImages.map(src => `<img src="${src}" alt="demo">`).join('');
        document.getElementById('productDetail').innerHTML = `
            <div class="product-header"><h1>${product.name}</h1></div>
            <div class="demo-slider">${demoHtml}</div>
            <p><strong>Mô tả:</strong> ${product.description}</p>
            <div class="error-box"><i class="fas fa-exclamation-triangle"></i> <strong>Lỗi thường gặp:</strong><br>${product.notes.replace(/\n/g, '<br>')}</div>
            <button id="downloadBtn" class="download-btn"><i class="fas fa-download"></i> Tải code ngay (Mediafire)</button>
        `;

        const downloadBtn = document.getElementById('downloadBtn');
        downloadBtn.onclick = async () => {
            await incrementDownload(product.id);
            if (auth.currentUser) {
                await saveDownloadHistory(auth.currentUser.uid, product);
                alert("Đã lưu vào lịch sử tải của bạn.");
            } else {
                alert("Bạn chưa đăng nhập, lịch sử tải sẽ không được lưu. Bạn vẫn có thể tải file.");
            }
            window.open(product.downloadLink, '_blank');
        };
    })();
}

// -------------------- TRANG LỊCH SỬ TẢI --------------------
if (isHistoryPage) {
    const historyContainer = document.getElementById('historyList');
    onAuthStateChanged(auth, async (user) => {
        if (!user) {
            historyContainer.innerHTML = '<p>Vui lòng <a href="index.html">đăng nhập</a> để xem lịch sử tải.</p>';
            return;
        }
        const q = query(collection(db, 'download_history'), where('userId', '==', user.uid), orderBy('downloadedAt', 'desc'));
        const snap = await getDocs(q);
        if (snap.empty) {
            historyContainer.innerHTML = '<p>Bạn chưa tải code nào.</p>';
            return;
        }
        historyContainer.innerHTML = '';
        snap.forEach(doc => {
            const data = doc.data();
            const date = data.downloadedAt?.toDate().toLocaleString() || 'N/A';
            const div = document.createElement('div');
            div.className = 'history-item';
            div.innerHTML = `
                <div class="history-info">
                    <h4>${data.productName}</h4>
                    <p><i class="far fa-clock"></i> ${date}</p>
                </div>
                <button class="redownload-btn" data-link="${data.downloadLink}">Tải lại</button>
            `;
            historyContainer.appendChild(div);
        });
        document.querySelectorAll('.redownload-btn').forEach(btn => {
            btn.onclick = () => window.open(btn.dataset.link, '_blank');
        });
    });
}

// -------------------- AUTH MODAL & APP --------------------
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
            await createUserWithEmailAndPassword(auth, email, pwd);
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
    if (!isProductPage && !isHistoryPage) {
        loadProductsJSON();
    }
});

// -------------------- CATEGORY MENU (chỉ ở index) --------------------
if (!isProductPage && !isHistoryPage) {
    const menuToggle = document.getElementById('menuToggle');
    const categoryMenu = document.getElementById('categoryMenu');
    if (menuToggle) menuToggle.onclick = () => categoryMenu.classList.toggle('hidden');
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
