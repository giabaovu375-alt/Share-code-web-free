/* =========================================
   CodeHub Premium – Product Detail JS
   Bản hoàn thiện: fix bug, tối ưu UX
   ========================================= */

import {
  auth, db, doc, getDoc, setDoc, updateDoc, increment,
  collection, addDoc, query, where, getDocs, deleteDoc,
  onAuthStateChanged
} from './firebase-config.js';

// -------------------- CONFIG --------------------
const DEBUG = true;
const log = (...args) => DEBUG && console.log('[CodeHub]', ...args);
const warn = (...args) => DEBUG && console.warn('[CodeHub]', ...args);
const erro = (...args) => DEBUG && console.error('[CodeHub]', ...args);

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
};

let allProducts = null;
let isDownloading = false;
let isFavLoading = false;
let toastTimer = null;

// -------------------- UTILS --------------------
function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

function formatNotes(notes) {
  return escapeHtml(notes || 'Không có ghi chú.').replace(/\n/g, '<br>');
}

function showToast(msg, isErr = false) {
  if (!toast) return;
  if (toastTimer) clearTimeout(toastTimer);
  toast.textContent = msg;
  toast.style.borderColor = isErr ? 'var(--danger, #f87171)' : 'var(--accent, #a78bfa)';
  toast.classList.add('show');
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2700);
}

// -------------------- DATA --------------------
async function fetchProduct() {
  if (!allProducts) {
    const res = await fetch('data/products.json');
    if (!res.ok) throw new Error('Không tải được dữ liệu');
    allProducts = await res.json();
  }
  state.product = allProducts.find(p => p.id === productId);
  if (!state.product) throw new Error('Sản phẩm không tồn tại');
}

// -------------------- STATS --------------------
async function loadStats() {
  const ref = doc(db, 'stats', productId);
  try {
    const snap = await getDoc(ref);
    state.stats = snap.exists() ? snap.data() : { views: 0, downloads: 0 };
  } catch {
    state.stats = { views: 0, downloads: 0 };
  }
}

async function incrementView() {
  const ref = doc(db, 'stats', productId);
  try { await updateDoc(ref, { views: increment(1) }); }
  catch { await setDoc(ref, { views: 1, downloads: 0 }).catch(() => {}); }
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

// -------------------- FAVORITE (Optimistic + Chống spam) --------------------
async function loadFavorite() {
  if (!state.user) { state.isFavorite = false; return; }
  const q = query(collection(db, 'favorites'), where('userId', '==', state.user.uid), where('productId', '==', productId));
  state.isFavorite = !(await getDocs(q)).empty;
}

async function toggleFavorite() {
  if (isFavLoading) { showToast('⏳ Đang xử lý...', true); return; }
  if (!state.user) { showToast('🔐 Đăng nhập để yêu thích', true); return; }

  isFavLoading = true;
  const btn = document.querySelector('[data-action="favorite"]');
  if (btn) btn.disabled = true;

  state.isFavorite = !state.isFavorite;
  updateFavoriteButton();

  const q = query(collection(db, 'favorites'), where('userId', '==', state.user.uid), where('productId', '==', productId));
  const snap = await getDocs(q);

  try {
    if (state.isFavorite) {
      await addDoc(collection(db, 'favorites'), { userId: state.user.uid, productId, favoritedAt: new Date() });
      showToast('❤️ Đã thêm vào yêu thích');
    } else {
      snap.forEach(d => deleteDoc(d.ref));
      showToast('💔 Đã xóa yêu thích');
    }
  } catch (e) {
    state.isFavorite = !state.isFavorite;
    updateFavoriteButton();
    showToast('⚠️ Lỗi, thử lại!', true);
    erro('toggleFavorite error:', e);
  }

  isFavLoading = false;
  if (btn) btn.disabled = false;
}

function updateFavoriteButton() {
  const btn = document.querySelector('[data-action="favorite"]');
  if (!btn) return;
  btn.classList.toggle('active', state.isFavorite);
  btn.innerHTML = state.isFavorite
    ? '<i class="fas fa-heart"></i> Đã thích'
    : '<i class="far fa-heart"></i> Yêu thích';
}

// -------------------- DOWNLOAD (Anti-spam + Validate link) --------------------
async function download() {
  if (isDownloading) { showToast('⏳ Đang xử lý, đợi tí...', true); return; }

  const link = state.product?.downloadLink;
  if (!link || !link.startsWith('http')) {
    showToast('⚠️ Link không hợp lệ hoặc chưa được cập nhật', true);
    return;
  }

  isDownloading = true;
  const btn = document.querySelector('[data-action="download"]');
  if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-pulse"></i> Đang tải...'; }

  const ref = doc(db, 'stats', productId);
  try { await updateDoc(ref, { downloads: increment(1) }); }
  catch { await setDoc(ref, { views: 0, downloads: 1 }).catch(() => {}); }

  if (state.user) {
    addDoc(collection(db, 'download_history'), {
      userId: state.user.uid, productId, productName: state.product?.name || '', downloadedAt: new Date()
    }).catch(() => {});
  }

  state.stats.downloads++;
  updateStatsBadge();
  showToast('🚀 Đang chuyển đến link tải...');
  setTimeout(() => window.open(link, '_blank'), 400);

  setTimeout(() => {
    isDownloading = false;
    if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fas fa-download"></i> Tải code'; }
  }, 2000);
}

// -------------------- SHARE & COPY --------------------
function shareProduct() {
  if (navigator.share) {
    navigator.share({
      title: state.product?.name || 'CodeHub',
      text: state.product?.description || '',
      url: location.href,
    }).catch(() => {});
  } else {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(location.href)}`, '_blank');
  }
}

function copyLink() {
  navigator.clipboard.writeText(location.href)
    .then(() => showToast('📋 Đã sao chép liên kết'))
    .catch(() => showToast('⚠️ Không thể sao chép', true));
}

// -------------------- REPORT --------------------
async function reportIssue() {
  if (!state.user) { showToast('🔐 Đăng nhập để báo lỗi', true); return; }
  const issue = prompt('📝 Mô tả lỗi bạn gặp phải:');
  if (issue && issue.trim()) {
    await addDoc(collection(db, 'reports'), {
      userId: state.user.uid, productId, productName: state.product?.name || '',
      issue: issue.trim(), reportedAt: new Date()
    });
    showToast('✅ Đã gửi báo cáo, cảm ơn bạn!');
  }
}

// -------------------- LIGHTBOX --------------------
function openLightbox(src) {
  if (!src || !lightbox || !lightboxImg) return;
  lightboxImg.src = src;
  lightbox.classList.add('active');
}

// -------------------- RENDER --------------------
function renderStats() {
  updateStatsBadge();
}

function renderStars() {
  const saved = parseInt(localStorage.getItem(`rating_${productId}`)) || 0;
  document.querySelectorAll('.rating-box i').forEach((s, idx) => {
    s.style.color = idx < saved ? 'var(--star, #fbbf24)' : '#4b5563';
  });
}

function renderProduct() {
  const p = state.product;
  const images = p.demoImages || [];
  const fav = state.isFavorite;
  const savedRating = localStorage.getItem(`rating_${productId}`) || 0;

  el.innerHTML = `
    <div class="product-card">
      <div class="product-header">
        <h1 class="product-title">${escapeHtml(p.name)}</h1>
        <div class="stats-badge" id="statsBadge">
          <span><i class="fas fa-eye"></i> ${state.stats.views || 0}</span>
          <span><i class="fas fa-download"></i> ${state.stats.downloads || 0}</span>
          ${p.version ? `<span><i class="fas fa-code-branch"></i> v${escapeHtml(p.version)}</span>` : ''}
        </div>
      </div>

      <div class="slider-wrapper">
        <div class="demo-slider" id="demoSlider">
          ${images.length ? images.map(src => `<img src="${escapeHtml(src)}" alt="demo" loading="lazy" data-action="lightbox" data-src="${escapeHtml(src)}">`).join('') : '<div class="no-image"><i class="far fa-image fa-2x"></i><br>Không có ảnh demo</div>'}
        </div>
        ${images.length > 1 ? `
        <button class="slider-btn slider-left" data-action="slideLeft"><i class="fas fa-chevron-left"></i></button>
        <button class="slider-btn slider-right" data-action="slideRight"><i class="fas fa-chevron-right"></i></button>` : ''}
      </div>

      <div class="desc-block">
        <strong style="color:#c4b5fd;">📖 Mô tả:</strong><br>${escapeHtml(p.description)}
        ${p.author ? `<br><small style="color:#8b8b9e;">👤 Tác giả: ${escapeHtml(p.author)}</small>` : ''}
      </div>

      <div class="accordion" id="issueAccordion">
        <div class="accordion-header" data-action="toggleAccordion">
          <i class="fas fa-bug" style="color:#f472b6;"></i> Lỗi thường gặp & Cách khắc phục
          <i class="fas fa-chevron-down" style="margin-left:auto;transition:0.3s;"></i>
        </div>
        <div class="accordion-content">${formatNotes(p.notes)}</div>
      </div>

      <div class="rating-box">
        <span style="color:#e4e4ed; margin-right:6px;">Đánh giá:</span>
        ${[1,2,3,4,5].map(i => `<i class="fas fa-star" data-action="rate" data-star="${i}" style="color:${i <= savedRating ? 'var(--star, #fbbf24)' : '#4b5563'}"></i>`).join('')}
        <span style="color:#a78bfa; margin-left:6px; font-weight:600;">${savedRating || '4.8'}</span>
      </div>

      <div class="action-grid">
        <button class="btn btn-primary" data-action="download"><i class="fas fa-download"></i> Tải code</button>
        <button class="btn btn-fav ${fav ? 'active' : ''}" data-action="favorite">
          <i class="${fav ? 'fas' : 'far'} fa-heart"></i> ${fav ? 'Đã thích' : 'Yêu thích'}
        </button>
        <button class="btn btn-outline" data-action="share"><i class="fas fa-share-alt"></i> Chia sẻ</button>
        <button class="btn btn-outline" data-action="copy"><i class="fas fa-link"></i> Copy</button>
        <button class="btn btn-outline" data-action="report"><i class="fas fa-flag"></i> Báo lỗi</button>
      </div>
    </div>
  `;

  // SEO title
  document.title = `${p.name} | CodeHub`;

  // Mở accordion nếu có notes
  if (p.notes && p.notes.trim() && p.notes !== 'Không có ghi chú.') {
    document.getElementById('issueAccordion')?.classList.add('open');
  }
}

// -------------------- EVENT DELEGATION --------------------
el?.addEventListener('click', async (e) => {
  const trigger = e.target.closest('[data-action]');
  if (!trigger) return;
  const action = trigger.dataset.action;

  switch (action) {
    case 'lightbox':
      openLightbox(trigger.dataset.src);
      break;
    case 'slideLeft':
      document.getElementById('demoSlider')?.scrollBy({ left: -320, behavior: 'smooth' });
      break;
    case 'slideRight':
      document.getElementById('demoSlider')?.scrollBy({ left: 320, behavior: 'smooth' });
      break;
    case 'toggleAccordion':
      const acc = trigger.closest('.accordion');
      if (acc) acc.classList.toggle('open');
      break;
    case 'rate':
      const star = parseInt(trigger.dataset.star);
      if (!star) return;
      localStorage.setItem(`rating_${productId}`, star);
      document.querySelectorAll('.rating-box i').forEach((s, idx) => {
        s.style.color = idx < star ? 'var(--star, #fbbf24)' : '#4b5563';
      });
      const ratingText = document.querySelector('.rating-box span:last-child');
      if (ratingText) ratingText.textContent = star;
      showToast(`⭐ Cảm ơn bạn đã đánh giá ${star} sao!`);
      break;
    case 'download':
      await download();
      break;
    case 'favorite':
      await toggleFavorite();
      break;
    case 'share':
      shareProduct();
      break;
    case 'copy':
      copyLink();
      break;
    case 'report':
      await reportIssue();
      break;
  }
});

// Lightbox listeners (chỉ bind khi DOM sẵn sàng)
window.addEventListener('DOMContentLoaded', () => {
  document.querySelector('.lightbox-close')?.addEventListener('click', () => lightbox?.classList.remove('active'));
  lightbox?.addEventListener('click', (e) => {
    if (e.target === lightbox) lightbox.classList.remove('active');
  });
});

// -------------------- INIT --------------------
(async () => {
  if (!productId) {
    el.innerHTML = '<div style="text-align:center;padding:60px;">Thiếu ID sản phẩm.</div>';
    preloader?.classList.add('hidden');
    return;
  }

  try {
    await fetchProduct();
    await loadStats();
    await incrementView();

    onAuthStateChanged(auth, async (user) => {
      state.user = user;
      await loadFavorite();
      renderProduct();
      preloader?.classList.add('hidden');
    });
  } catch (e) {
    el.innerHTML = `<div style="text-align:center;padding:60px;color:#f87171;">Lỗi: ${escapeHtml(e.message)}</div>`;
    preloader?.classList.add('hidden');
  }
})();
