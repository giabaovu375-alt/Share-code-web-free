import { auth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, db, doc, setDoc } from '../firebase-config.js';
import { appState } from '../core/state.js';
import { toast } from '../core/utils.js';

export function initAuth() {
    const container = document.getElementById('authContainer');
    if (!container) return;

    function renderAuthUI(user) {
        if (user) {
            container.innerHTML = `
                <div class="user-info">
                    <img src="https://via.placeholder.com/32" alt="avatar">
                    <span>${user.email?.split('@')[0] || 'User'}</span>
                    <a href="profile.html" class="nav-icon" title="Hồ sơ"><i class="fas fa-user-circle"></i></a>
                    <a href="favorites.html" class="nav-icon" title="Yêu thích"><i class="fas fa-heart"></i></a>
                    <button class="btn btn-outline btn-logout">Đăng xuất</button>
                </div>
            `;
            container.querySelector('.btn-logout').onclick = () => signOut(auth);
        } else {
            container.innerHTML = `<button class="btn btn-primary" id="showAuthBtn">Đăng nhập</button>`;
            container.querySelector('#showAuthBtn').onclick = showAuthModal;
        }
        appState.set('currentUser', user);
    }

    function showAuthModal() {
        const modalRoot = document.getElementById('modal-root');
        modalRoot.innerHTML = `
            <div class="modal-overlay" id="authModalOverlay">
                <div class="modal-content">
                    <button class="modal-close">&times;</button>
                    <h3>Đăng nhập</h3>
                    <input class="input-field" type="email" id="loginEmail" placeholder="Email">
                    <input class="input-field" type="password" id="loginPass" placeholder="Mật khẩu">
                    <button class="btn btn-primary" id="doLoginBtn">Đăng nhập</button>
                    <p style="margin-top:12px;">Chưa có tài khoản? <a href="#" id="switchToRegister">Đăng ký</a></p>
                </div>
            </div>
        `;
        document.querySelector('.modal-close').onclick = () => modalRoot.innerHTML = '';
        document.getElementById('doLoginBtn').onclick = async () => {
            const email = document.getElementById('loginEmail').value;
            const pwd = document.getElementById('loginPass').value;
            if (!email || !pwd) return toast.show('Nhập đầy đủ thông tin', 'error');
            try {
                await signInWithEmailAndPassword(auth, email, pwd);
                modalRoot.innerHTML = '';
            } catch (e) { toast.show(e.message, 'error'); }
        };
        document.getElementById('switchToRegister').onclick = (e) => {
            e.preventDefault();
            modalRoot.innerHTML = `
                <div class="modal-overlay">
                    <div class="modal-content">
                        <button class="modal-close">&times;</button>
                        <h3>Đăng ký</h3>
                        <input class="input-field" type="email" id="regEmail" placeholder="Email">
                        <input class="input-field" type="password" id="regPass" placeholder="Mật khẩu">
                        <button class="btn btn-primary" id="doRegisterBtn">Đăng ký</button>
                    </div>
                </div>
            `;
            document.querySelector('.modal-close').onclick = () => modalRoot.innerHTML = '';
            document.getElementById('doRegisterBtn').onclick = async () => {
                const email = document.getElementById('regEmail').value;
                const pwd = document.getElementById('regPass').value;
                try {
                    const cred = await createUserWithEmailAndPassword(auth, email, pwd);
                    await setDoc(doc(db, 'users', cred.user.uid), { email, createdAt: new Date() });
                    toast.show('Đăng ký thành công!', 'success');
                    modalRoot.innerHTML = '';
                } catch (e) { toast.show(e.message, 'error'); }
            };
        };
    }

    onAuthStateChanged(auth, (user) => {
        renderAuthUI(user);
    });
}
