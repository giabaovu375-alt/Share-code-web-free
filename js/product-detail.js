// ========== IMPORTS ==========
import { auth, db } from './firebase-config.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { doc, setDoc, getDoc, updateDoc, increment, collection, addDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

// ========== DOM REFS ==========
const el = document.getElementById('productContent');
const toast = document.getElementById('toast');
const preloader = document.getElementById('preloader');
const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightboxImg');
const productId = new URLSearchParams(location.search).get('id');

// ========== STATE ==========
let product = null;
let stats = { views: 0, downloads: 0 };
let user = null;
let isFav = false;
let favDocId = null;
let lockDownload = false;
let lockFav = false;
let toastTimer = null;

// ========== UTILS & UI FUNCTIONS ==========
function esc(s) { return s ? String(s).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'})[m]) : ''; }

function showToast(msg, err = false) {
    if (!toast) return;
    if (toastTimer) clearTimeout(toastTimer);
    toast.textContent = msg;
    toast.style.borderColor = err ? '#f87171' : '#a78bfa';
    toast.classList.add('show');
    toastTimer = setTimeout(() => toast.classList.remove('show'), 2500);
}

function updateStatsBadge() {
    const badge = document.getElementById('statsBadge');
    if (badge) badge.innerHTML = `<span><i class="fas fa-eye"></i> ${stats.views || 0}</span><span><i class="fas fa-download"></i> ${stats.downloads || 0}</span>`;
}

function updateFavUI() {
    const btn = document.querySelector('[data-action="favorite"]');
    if (!btn) return;
    btn.classList.toggle('active', isFav);
    btn.innerHTML = isFav ? '<i class="fas fa-heart"></i> Đã thích' : '<i class="far fa-heart"></i> Yêu thích';
}

// ========== DATA LOGIC ==========
async function loadProduct() {
    const res = await fetch('data/products.json');
    const all = await res.json();
    product = all.find(p => p.id === productId);
    if (!product) throw new Error('Không tìm thấy sản phẩm');
}

async function loadStats() {
    if (!db) return;
    const ref = doc(db, 'stats', productId);
    try {
        const snap = await getDoc(ref);
        stats = snap.exists() ? snap.data() : stats;
    } catch { /* giữ nguyên stats cũ */ }
}

async function incView() {
    if (!db) return;
    const sessionKey = `viewed_${productId}`;
    if (sessionStorage.getItem(sessionKey)) return;
    const ref = doc(db, 'stats', productId);
    try {
        await updateDoc(ref, { views: increment(1) });
        stats.views++;
        sessionStorage.setItem(sessionKey, '1');
        updateStatsBadge();
    } catch {
        try {
            await setDoc(ref, { views: 1, downloads: 0 });
            stats.views = 1;
            sessionStorage.setItem(sessionKey, '1');
            updateStatsBadge();
        } catch { /* ignore */ }
    }
}

// ========== ACTIONS ==========
async function toggleFav() {
    if (lockFav) return;
    if (!user) return showToast('Cần đăng nhập', true);
    lockFav = true;
    const oldFav = isFav;
    isFav = !isFav;
    updateFavUI();
    const id = `${user.uid}_${productId}`;
    const ref = doc(db, 'favorites', id);
    try {
        if (isFav) {
            await setDoc(ref, { userId: user.uid, productId: productId, favoritedAt: new Date() });
            showToast('❤️ Đã thích');
        } else {
            await deleteDoc(ref);
            showToast('💔 Đã bỏ thích');
        }
    } catch {
        isFav = oldFav;
        updateFavUI();
        showToast('Lỗi, thử lại', true);
    } finally { lockFav = false; }
}

async function download() {
    if (lockDownload) return;
    if (!product?.downloadLink?.startsWith('http')) return showToast('Link lỗi', true);
    lockDownload = true;
    const btn = document.querySelector('[data-action="download"]');
    if (btn) btn.disabled = true;
    try {
        if (db) {
            const ref = doc(db, 'stats', productId);
            try { await updateDoc(ref, { downloads: increment(1) }); }
            catch { await setDoc(ref, { views: stats.views, downloads: 1 }).catch(() => {}); }
        }
        stats.downloads++;
        updateStatsBadge();
        showToast('🚀 Đang mở link tải...');
        setTimeout(() => window.open(product.downloadLink, '_blank'), 400);
    } finally {
        lockDownload = false;
        if (btn) btn.disabled = false;
    }
}

// ========== RENDER & EVENTS ==========
function render() {
    if (!product) return;
    const p = product, imgs = p.demoImages || [], notes = p.notes;
    el.innerHTML = `
    <div class="product-card">
        <div class="product-header">
            <h1 class="product-title">${esc(p.name)}</h1>
            <div class="stats-badge" id="statsBadge">
                <span><i class="fas fa-eye"></i> ${stats.views || 0}</span>
                <span><i class="fas fa-download"></i> ${stats.downloads || 0}</span>
            </div>
        </div>
        <div class="slider-wrapper">
            <div class="demo-slider">${imgs.length ? imgs.map(s => `<img src="${esc(s)}" alt="demo" data-action="lightbox" data-src="${esc(s)}">`).join('') : '<div class="no-image">Không ảnh</div>'}</div>
        </div>
        <div class="desc-block"><strong>📖 Mô tả:</strong><br>${esc(p.description)}</div>
        ${notes?.trim() && notes !== 'Không có ghi chú.' ? `<div class="accordion open"><div class="accordion-header" data-action="toggleAccordion"><i class="fas fa-bug"></i> Lỗi thường gặp</div><div class="accordion-content">${esc(notes).replace(/\n/g, '<br>')}</div></div>` : ''}
        <div class="rating-box"><span>Đánh giá:</span>${[1,2,3,4,5].map(i => `<i class="fas fa-star" data-action="rate" data-star="${i}" style="color:${i <= (parseInt(localStorage.getItem(`rating_${productId}`)) || 0) ? '#fbbf24' : '#4b5563'}"></i>`).join('')}</div>
        <div class="action-grid">
            <button class="btn btn-primary" data-action="download"><i class="fas fa-download"></i> Tải code</button>
            <button class="btn btn-fav ${isFav ? 'active' : ''}" data-action="favorite"><i class="${isFav ? 'fas' : 'far'} fa-heart"></i> ${isFav ? 'Đã thích' : 'Yêu thích'}</button>
            <button class="btn btn-outline" data-action="share"><i class="fas fa-share-alt"></i> Chia sẻ</button>
            <button class="btn btn-outline" data-action="copy"><i class="fas fa-link"></i> Copy</button>
        </div>
    </div>`;
}

el?.addEventListener('click', e => {
    const target = e.target.closest('[data-action]');
    if (!target) return;
    const action = target.dataset.action;
    if (action === 'download') download();
    if (action === 'favorite') toggleFav();
    if (action === 'copy') { navigator.clipboard.writeText(location.href); showToast('📋 Đã copy link'); }
    if (action === 'share') { if (navigator.share) navigator.share({title: product.name, url: location.href}); else window.open(`https://facebook.com/sharer/sharer.php?u=${encodeURIComponent(location.href)}`); }
    if (action === 'toggleAccordion') target.closest('.accordion')?.classList.toggle('open');
    if (action === 'lightbox') { lightboxImg.src = target.dataset.src; lightbox.classList.add('active'); }
});

// ========== INIT ==========
(async () => {
    try {
        await loadProduct();
        await loadStats();
        render();
        await incView();
        onAuthStateChanged(auth, async (u) => {
            user = u;
            if (user) {
                const id = `${user.uid}_${productId}`;
                const snap = await getDoc(doc(db, 'favorites', id));
                isFav = snap.exists();
                updateFavUI();
            }
            preloader?.classList.add('hidden');
        });
    } catch (e) {
        el.innerHTML = `<div style="color:#f87171;text-align:center;padding:60px;">${esc(e.message)}</div>`;
        preloader?.classList.add('hidden');
    }
})();
                            
