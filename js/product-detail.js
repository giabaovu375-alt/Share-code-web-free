/* =========================================
   CodeHub ULTIMATE – Product Detail JS
   ĐÃ TỐI ƯU TOÀN DIỆN (10/10)
   - Component Render nhỏ (cập nhật ko phá DOM)
   - Firestore docID tối ưu (không scan query)
   - Cache localStorage cho product & favorite
   - Debounce chống spam
   ========================================= */

import {
  auth, db,
  onAuthStateChanged,
  doc, setDoc, getDoc, updateDoc, increment,
  addDoc, deleteDoc, getDocs, collection, query, where
} from './firebase-config.js';

// -------------------- DEBUG --------------------
const DEBUG = true;
const log = (...args) => DEBUG && console.log('[CodeHub]', ...args);

// -------------------- DOM REFS --------------------
const el = document.getElementById('productContent');
const toast = document.getElementById('toast');
const preloader = document.getElementById('preloader');
const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightboxImg');
const productId = new URLSearchParams(location.search).get('id');

// -------------------- STATE --------------------
const state = {
  product: null,
  user: null,
  stats: { views: 0, downloads: 0 },
  isFavorite: false,
  favoriteDocId: null, // userId_productId
};

let isDownloading = false;
let isFavLoading = false;
let toastTimer = null;

// -------------------- UTILS --------------------
function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/[&<>"']/g, m => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;',
    '"': '&quot;', "'": '&#039;'
  })[m]);
}

function showToast(msg, isErr = false) {
  if (!toast) return;
  if (toastTimer) clearTimeout(toastTimer);
  toast.textContent = msg;
  toast.style.borderColor = isErr ? 'var(--danger, #f87171)' : 'var(--accent, #a78bfa)';
  toast.classList.add('show');
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2700);
}

// Debounce generic
function debounce(fn, delay = 300) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), delay); };
}

// -------------------- CACHE LAYER --------------------
const CACHE_KEY = `codehub_${productId}`;
function loadCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (Date.now() - data.time > 10 * 60 * 1000) return null; // hết hạn 10 phút
    return data;
  } catch { return null; }
}
function saveCache(product, stats, isFav, favDocId) {
  localStorage.setItem(CACHE_KEY, JSON.stringify({
    product, stats, isFav, favDocId,
    time: Date.now()
  }));
}

// -------------------- DATA --------------------
async function fetchProduct() {
  const cached = loadCache();
  if (cached?.product) {
    state.product = cached.product;
    state.stats = cached.stats || state.stats;
    state.isFavorite = cached.isFav || false;
    state.favoriteDocId = cached.favDocId || null;
    return;
  }

  const res = await fetch('data/products.json');
  if (!res.ok) throw new Error('Không tải được products.json');
  const all = await res.json();
  state.product = all.find(p => p.id === productId);
  if (!state.product) throw new Error('Sản phẩm không tồn tại');
}

// -------------------- STATS --------------------
async function loadStats() {
  if (!db) return;
  const ref = doc(db, 'stats', productId);
  try {
    const snap = await getDoc(ref);
    state.stats = snap.exists() ? snap.data() : { views: 0, downloads: 0 };
  } catch { state.stats = { views: 0, downloads: 0 }; }
}

async function incrementView() {
  if (!db) return;
  const ref = doc(db, 'stats', productId);
  try {
    await updateDoc(ref, { views: increment(1) });
    state.stats.views++;
    updateStatsBadge();
  } catch {
    await setDoc(ref, { views: 1, downloads: 0 }).catch(() => {});
    state.stats.views = 1;
    updateStatsBadge();
  }
}

function updateStatsBadge() {
  const badge = document.getElementById('statsBadge');
  if (!badge) return;
  badge.innerHTML = `
    <span><i class="fas fa-eye"></i> ${state.stats.views || 0}</span>
    <span><i class="fas fa-download"></i> ${state.stats.downloads || 0}</span>
    ${state.product?.version ? `<span><i class="fas fa-code-branch"></i> v${escapeHtml(state.product.version)}</span>` : ''}
  `;
}

// -------------------- FAVORITE (Firestore docID tối ưu) --------------------
async function loadFavorite() {
  if (!state.user || !db) {
    state.isFavorite = false;
    state.favoriteDocId = null;
    return;
  }

  // dùng docId = userId_productId để đọc trực tiếp (không query scan)
  const docId = `${state.user.uid}_${productId}`;
  const ref = doc(db, 'favorites', docId);
  const snap = await getDoc(ref);
  state.isFavorite = snap.exists();
  state.favoriteDocId = state.isFavorite ? docId : null;
}

const toggleFavoriteDebounced = debounce(async () => {
  if (!state.user) { showToast('🔐 Đăng nhập để yêu thích', true); return; }
  if (!db) { showToast('⚠️ Firebase chưa được cấu hình', true); return; }
  if (isFavLoading) return;

  isFavLoading = true;
  const btn = document.querySelector('[data-action="favorite"]');
  if (btn) btn.disabled = true;

  const oldFavorite = state.isFavorite;
  const oldDocId = state.favoriteDocId;

  // Optimistic update
  state.isFavorite = !state.isFavorite;
  updateFavoriteButton();

  try {
    const docId = `${state.user.uid}_${productId}`;
    if (state.isFavorite) {
      await setDoc(doc(db, 'favorites', docId), {
        userId: state.user.uid, productId, favoritedAt: new Date()
      });
      state.favoriteDocId = docId;
      showToast('❤️ Đã thêm vào yêu thích');
    } else {
      await deleteDoc(doc(db, 'favorites', docId));
      state.favoriteDocId = null;
      showToast('💔 Đã xóa yêu thích');
    }
  } catch (e) {
    // Rollback
    state.isFavorite = oldFavorite;
    state.favoriteDocId = oldDocId;
    updateFavoriteButton();
    showToast('⚠️ Lỗi, thử lại!', true);
  } finally {
    isFavLoading = false;
    if (btn) btn.disabled = false;
  }
}, 300);

function updateFavoriteButton() {
  const btn = document.querySelector('[data-action="favorite"]');
  if (!btn) return;
  btn.classList.toggle('active', state.isFavorite);
  btn.innerHTML = state.isFavorite
    ? '<i class="fas fa-heart"></i> Đã thích'
    : '<i class="far fa-heart"></i> Yêu thích';
}

// -------------------- DOWNLOAD --------------------
const downloadDebounced = debounce(async () => {
  const link = state.product?.downloadLink;
  if (!link || !link.startsWith('http')) {
    showToast('⚠️ Link chưa hợp lệ', true);
    return;
  }

  if (isDownloading) return;
  isDownloading = true;
  const btn = document.querySelector('[data-action="download"]');
  if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-pulse"></i> Đang tải...'; }

  try {
    if (db) {
      const ref = doc(db, 'stats', productId);
      try { await updateDoc(ref, { downloads: increment(1) }); }
      catch { await setDoc(ref, { views: state.stats.views, downloads: 1 }).catch(() => {}); }

      if (state.user) {
        addDoc(collection(db, 'download_history'), {
          userId: state.user.uid, productId, productName: state.product?.name || '', downloadedAt: new Date()
        }).catch(() => {});
      }
    }

    state.stats.downloads++;
    updateStatsBadge();
    showToast('🚀 Đang chuyển đến link tải...');
    setTimeout(() => window.open(link, '_blank'), 400);
  } catch {
    showToast('⚠️ Lỗi khi tải, thử lại!', true);
  } finally {
    isDownloading = false;
    if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fas fa-download"></i> Tải code'; }
  }
}, 300);

// -------------------- SHARE & COPY --------------------
function shareProduct() {
  if (navigator.share) {
    navigator.share({ title: state.product?.name || 'CodeHub', url: location.href }).catch(() => {});
  } else {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(location.href)}`, '_blank');
  }
}
function copyLink() {
  navigator.clipboard.writeText(location.href).then(() => showToast('📋 Đã sao chép')).catch(() => showToast('⚠️ Lỗi', true));
}

// -------------------- REPORT --------------------
async function reportIssue() {
  if (!state.user) { showToast('🔐 Đăng nhập để báo lỗi', true); return; }
  const issue = prompt('📝 Mô tả lỗi bạn gặp phải:');
  if (issue?.trim() && db) {
    await addDoc(collection(db, 'reports'), {
      userId: state.user.uid, productId, productName: state.product?.name || '',
      issue: issue.trim(), reportedAt: new Date()
    });
    showToast('✅ Đã gửi báo cáo');
  }
}

// -------------------- LIGHTBOX --------------------
function openLightbox(src) {
  if (!src || !lightbox || !lightboxImg) return;
  lightboxImg.src = src;
  lightbox.classList.add('active');
}
lightbox?.addEventListener('click', (e) => {
  if (e.target === lightbox || e.target.classList.contains('lightbox-close')) {
    lightbox.classList.remove('active');
  }
});

// -------------------- COMPONENT RENDER (cập nhật ko phá DOM) --------------------
function renderProductHeader() {
  const header = document.querySelector('.product-header');
  if (!header) return;
  header.innerHTML = `
    <h1 class="product-title">${escapeHtml(state.product.name)}</h1>
    <div class="stats-badge" id="statsBadge">
      <span><i class="fas fa-eye"></i> ${state.stats.views || 0}</span>
      <span><i class="fas fa-download"></i> ${state.stats.downloads || 0}</span>
      ${state.product.version ? `<span><i class="fas fa-code-branch"></i> v${escapeHtml(state.product.version)}</span>` : ''}
    </div>`;
}

function renderActions() {
  const actions = document.querySelector('.action-grid');
  if (!actions) return;
  actions.innerHTML = `
    <button class="btn btn-primary" data-action="download"><i class="fas fa-download"></i> Tải code</button>
    <button class="btn btn-fav ${state.isFavorite ? 'active' : ''}" data-action="favorite">
      <i class="${state.isFavorite ? 'fas' : 'far'} fa-heart"></i> ${state.isFavorite ? 'Đã thích' : 'Yêu thích'}
    </button>
    <button class="btn btn-outline" data-action="share"><i class="fas fa-share-alt"></i> Chia sẻ</button>
    <button class="btn btn-outline" data-action="copy"><i class="fas fa-link"></i> Copy</button>
    <button class="btn btn-outline" data-action="report"><i class="fas fa-flag"></i> Báo lỗi</button>`;
}

function renderFull() {
  if (!state.product) return;
  const p = state.product;
  const images = p.demoImages || [];
  const notes = p.notes;

  el.innerHTML = `
    <div class="product-card">
      <div class="product-header"></div>
      <div class="slider-wrapper">
        <div class="demo-slider" id="demoSlider">
          ${images.length ? images.map(src => `<img src="${escapeHtml(src)}" alt="demo" loading="lazy" data-action="lightbox" data-src="${escapeHtml(src)}">`).join('') : '<div class="no-image">Không có ảnh demo</div>'}
        </div>
        ${images.length > 1 ? `
        <button class="slider-btn slider-left" data-action="slideLeft"><i class="fas fa-chevron-left"></i></button>
        <button class="slider-btn slider-right" data-action="slideRight"><i class="fas fa-chevron-right"></i></button>` : ''}
      </div>
      <div class="desc-block">
        <strong>📖 Mô tả:</strong><br>${escapeHtml(p.description)}
        ${p.author ? `<br><small>👤 Tác giả: ${escapeHtml(p.author)}</small>` : ''}
      </div>
      <div class="accordion" id="issueAccordion">
        <div class="accordion-header" data-action="toggleAccordion">
          <i class="fas fa-bug"></i> Lỗi thường gặp & Cách khắc phục
          <i class="fas fa-chevron-down" style="margin-left:auto;"></i>
        </div>
        <div class="accordion-content">${notes?.trim() && notes !== 'Không có ghi chú.' ? escapeHtml(notes).replace(/\n/g, '<br>') : ''}</div>
      </div>
      <div class="rating-box">
        <span>Đánh giá:</span>
        ${[1,2,3,4,5].map(i => `<i class="fas fa-star" data-action="rate" data-star="${i}" style="color:${i <= (parseInt(localStorage.getItem(`rating_${productId}`)) || 0) ? 'var(--star, #fbbf24)' : '#4b5563'}"></i>`).join('')}
        <span>${localStorage.getItem(`rating_${productId}`) || '4.8'}</span>
      </div>
      <div class="action-grid"></div>
    </div>`;

  renderProductHeader();
  renderActions();
  if (notes?.trim() && notes !== 'Không có ghi chú.') {
    document.getElementById('issueAccordion')?.classList.add('open');
  }
  document.title = `${p.name} | CodeHub`;
}

// -------------------- EVENT DELEGATION --------------------
el?.addEventListener('click', async (e) => {
  const trigger = e.target.closest('[data-action]');
  if (!trigger) return;
  const action = trigger.dataset.action;

  switch (action) {
    case 'lightbox': openLightbox(trigger.dataset.src); break;
    case 'slideLeft': document.getElementById('demoSlider')?.scrollBy({ left: -320, behavior: 'smooth' }); break;
    case 'slideRight': document.getElementById('demoSlider')?.scrollBy({ left: 320, behavior: 'smooth' }); break;
    case 'toggleAccordion': trigger.closest('.accordion')?.classList.toggle('open'); break;
    case 'rate':
      const star = parseInt(trigger.dataset.star);
      if (!star) return;
      localStorage.setItem(`rating_${productId}`, star);
      document.querySelectorAll('.rating-box i').forEach((s, idx) => s.style.color = idx < star ? 'var(--star, #fbbf24)' : '#4b5563');
      showToast(`⭐ Cảm ơn bạn đã đánh giá ${star} sao!`);
      break;
    case 'download': await downloadDebounced(); break;
    case 'favorite': await toggleFavoriteDebounced(); break;
    case 'share': shareProduct(); break;
    case 'copy': copyLink(); break;
    case 'report': await reportIssue(); break;
  }
});

// -------------------- INIT --------------------
(async () => {
  if (!productId) {
    el.innerHTML = '<div style="text-align:center;padding:60px;">Thiếu ID sản phẩm</div>';
    preloader?.classList.add('hidden');
    return;
  }

  try {
    await fetchProduct();
    await loadStats();
    renderFull();
    await incrementView();

    onAuthStateChanged(auth, async (user) => {
      state.user = user;
      await loadFavorite();
      renderActions(); // chỉ cập nhật nút, ko render lại toàn bộ
      saveCache(state.product, state.stats, state.isFavorite, state.favoriteDocId);
      preloader?.classList.add('hidden');
    });
  } catch (e) {
    el.innerHTML = `<div style="text-align:center;padding:60px;color:#f87171;">${escapeHtml(e.message)}</div>`;
    preloader?.classList.add('hidden');
  }
})();
