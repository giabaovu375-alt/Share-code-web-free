/* =========================================
   CodeHub Premium – Product Detail JS
   Kết hợp Premium UI + PRO techniques
   ========================================= */

// -------------------- IMPORTS --------------------
import {
  auth, db, doc, getDoc, setDoc, updateDoc, increment,
  collection, addDoc, query, where, getDocs, deleteDoc,
  onAuthStateChanged
} from './firebase-config.js';

// -------------------- CONFIG --------------------
const DEBUG = true;
const log   = (...args) => DEBUG && console.log('[CodeHub]', ...args);
const warn  = (...args) => DEBUG && console.warn('[CodeHub]', ...args);
const erro  = (...args) => DEBUG && console.error('[CodeHub]', ...args);

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

// Cache sản phẩm
let cachedProduct = null;

// Chống spam download
let isDownloading = false;

// Timer cho toast
let toastTimer = null;

// -------------------- UTILS --------------------
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
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
  if (cachedProduct) {
    state.product = cachedProduct;
    log('Product loaded from cache');
    return;
  }

  try {
    const res = await fetch('data/products.json');
    if (!res.ok) throw new Error('Không tải được dữ liệu');
    const data = await res.json();
    if (!Array.isArray(data)) throw new Error('Sai định dạng dữ liệu');
    const found = data.find(p => p.id === productId);
    if (!found) throw new Error('Sản phẩm không tồn tại');
    
    cachedProduct = found;
    state.product = found;
    log('Product fetched successfully');
  } catch (e) {
    erro('fetchProduct error:', e.message);
    el.innerHTML = `<div style="text-align:center;padding:60px;color:#f87171;">
      <i class="fas fa-exclamation-circle"></i> ${escapeHtml(e.message)}
    </div>`;
    throw e;
  }
}

// -------------------- STATS --------------------
async function loadStats() {
  if (!productId) return;
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
  try {
    await updateDoc(ref, { views: increment(1) });
  } catch {
    await setDoc(ref, { views: 1, downloads: 0 }).catch(() => {});
  }
}

// -------------------- FAVORITE (Optimistic) --------------------
async function loadFavorite() {
  if (!state.user || !productId) {
    state.isFavorite = false;
    return;
  }
  const q = query(
    collection(db, 'favorites'),
    where('userId', '==', state.user.uid),
    where('productId', '==', productId)
  );
  const snap = await getDocs(q);
  state.isFavorite = !snap.empty;
}

async function toggleFavorite() {
  if (!state.user) {
    showToast('🔐 Đăng nhập để yêu thích', true);
    return;
  }
  
  // Optimistic update
  state.isFavorite = !state.isFavorite;
  updateFavoriteButton();
  
  const q = query(
    collection(db, 'favorites'),
    where('userId', '==', state.user.uid),
    where('productId', '==', productId)
  );
  const snap = await getDocs(q);

  try {
    if (state.isFavorite) {
      await addDoc(collection(db, 'favorites'), {
        userId: state.user.uid,
        productId,
        favoritedAt: new Date()
      });
      showToast('❤️ Đã thêm vào yêu thích');
    } else {
      snap.forEach(d => deleteDoc(d.ref));
      showToast('💔 Đã xóa yêu thích');
    }
  } catch (e) {
    // Rollback nếu lỗi
    state.isFavorite = !state.isFavorite;
    updateFavoriteButton();
    showToast('⚠️ Lỗi, thử lại!', true);
    erro('toggleFavorite error:', e);
  }
}

function updateFavoriteButton() {
  const btn = document.querySelector('[data-action="favorite"]');
  if (!btn) return;
  btn.classList.toggle('active', state.isFavorite);
  btn.innerHTML = state.isFavorite
    ? '<i class="fas fa-heart"></i> Đã thích'
    : '<i class="far fa-heart"></i> Yêu thích';
}

// -------------------- DOWNLOAD (Anti-spam) --------------------
async function download() {
  if (isDownloading) {
    showToast('⏳ Đang xử lý, đợi tí...', true);
    return;
  }
  isDownloading = true;
  
  const btn = document.querySelector('[data-action="download"]');
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-pulse"></i> Đang tải...';
  }

  const ref = doc(db, 'stats', productId);
  try {
    await updateDoc(ref, { downloads: increment(1) });
  } catch {
    await setDoc(ref, { views: 0, downloads: 1 }).catch(() => {});
  }

  if (state.user) {
    addDoc(collection(db, 'download_history'), {
      userId: state.user.uid,
      productId,
      productName: state.product?.name || '',
      downloadedAt: new Date()
    }).catch(() => {});
  }

  if (state.product?.downloadLink) {
    showToast('🚀 Đang chuyển đến link tải...');
    setTimeout(() => {
      window.open(state.product.downloadLink, '_blank');
    }, 400);
  } else {
    showToast('⚠️ Chưa có link tải', true);
  }

  // Reset sau 2s
  setTimeout(() => {
    isDownloading = false;
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = '<i class="fas fa-download"></i> Tải code';
    }
  }, 2000);
}

// -------------------- SHARE & COPY --------------------
function shareFacebook() {
  window.open(
    `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(location.href)}`,
    '_blank'
  );
}

function copyLink() {
  navigator.clipboard.writeText(location.href)
    .then(() => showToast('📋 Đã sao chép liên kết'))
    .catch(() => showToast('⚠️ Không thể sao chép', true));
}

// -------------------- BÁO LỖI --------------------
function reportIssue() {
  if (!state.user) {
    showToast('🔐 Đăng nhập để báo lỗi', true);
    return;
  }
  const issue = prompt('📝 Mô tả lỗi bạn gặp phải:');
  if (issue && issue.trim()) {
    addDoc(collection(db, 'reports'), {
      userId: state.user.uid,
      productId,
      productName: state.product?.name || '',
      issue: issue.trim(),
      reportedAt: new Date()
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

// Bind lightbox events (once)
document.querySelector('.lightbox-close')?.addEventListener('click', () => {
  lightbox?.classList.remove('active');
});
lightbox?.addEventListener('click', (e) => {
  if (e.target === lightbox) lightbox.classList.remove('active');
});

// -------------------- RENDER UI --------------------
function renderProductHeader() {
  const p = state.product;
  return `
    <div class="product-header">
      <h1 class="product-title">${escapeHtml(p.name)}</h1>
      <div class="stats-badge" id="statsBadge">
        <span><i class="fas fa-eye"></i> ${state.stats.views || 0}</span>
        <span><i class="fas fa-download"></i> ${state.stats.downloads || 0}</span>
        ${p.version ? `<span><i class="fas fa-code-branch"></i> v${escapeHtml(p.version)}</span>` : ''}
      </div>
    </div>`;
}

function renderImageSlider(images = []) {
  const imagesHtml = images.length
    ? images.map(src => `<img src="${escapeHtml(src)}" alt="demo" loading="lazy" data-action="lightbox" data-src="${escapeHtml(src)}">`).join('')
    : '<div class="no-image"><i class="far fa-image fa-2x"></i><br>Không có ảnh demo</div>';
  
  const buttons = images.length > 1 ? `
    <button class="slider-btn slider-left" data-action="slideLeft"><i class="fas fa-chevron-left"></i></button>
    <button class="slider-btn slider-right" data-action="slideRight"><i class="fas fa-chevron-right"></i></button>` : '';
  
  return `
    <div class="slider-wrapper">
      <div class="demo-slider" id="demoSlider">${imagesHtml}</div>
      ${buttons}
    </div>`;
}

function renderDescription() {
  const p = state.product;
  return `
    <div class="desc-block">
      <strong style="color:#c4b5fd;">📖 Mô tả:</strong><br>${escapeHtml(p.description)}
      ${p.author ? `<br><small style="color:#8b8b9e;">👤 Tác giả: ${escapeHtml(p.author)}</small>` : ''}
    </div>`;
}

function renderAccordion() {
  return `
    <div class="accordion" id="issueAccordion">
      <div class="accordion-header" data-action="toggleAccordion">
        <i class="fas fa-bug" style="color:#f472b6;"></i> Lỗi thường gặp & Cách khắc phục
        <i class="fas fa-chevron-down" style="margin-left:auto;transition:0.3s;"></i>
      </div>
      <div class="accordion-content">${formatNotes(state.product.notes)}</div>
    </div>`;
}

function renderRating() {
  return `
    <div class="rating-box">
      <span style="color:#e4e4ed; margin-right:6px;">Đánh giá:</span>
      ${[1,2,3,4,5].map(i => `<i class="fas fa-star" data-action="rate" data-star="${i}"></i>`).join('')}
      <span style="color:#a78bfa; margin-left:6px; font-weight:600;">4.8</span>
    </div>`;
}

function renderActionButtons() {
  const fav = state.isFavorite;
  return `
    <div class="action-grid">
      <button class="btn btn-primary" data-action="download" id="downloadBtn">
        <i class="fas fa-download"></i> Tải code
      </button>
      <button class="btn btn-fav ${fav ? 'active' : ''}" data-action="favorite">
        <i class="${fav ? 'fas' : 'far'} fa-heart"></i> ${fav ? 'Đã thích' : 'Yêu thích'}
      </button>
      <button class="btn btn-outline" data-action="share"><i class="fab fa-facebook"></i> Chia sẻ</button>
      <button class="btn btn-outline" data-action="copy"><i class="fas fa-link"></i> Copy</button>
      <button class="btn btn-outline" data-action="report"><i class="fas fa-flag"></i> Báo lỗi</button>
    </div>`;
}

async function render() {
  if (!state.product) return;
  
  el.innerHTML = `
    <div class="product-card">
      ${renderProductHeader()}
      ${renderImageSlider(state.product.demoImages || [])}
      ${renderDescription()}
      ${renderAccordion()}
      ${renderRating()}
      ${renderActionButtons()}
    </div>`;

  // Mở accordion nếu có notes
  const notes = state.product.notes;
  if (notes && notes.trim() && notes !== 'Không có ghi chú.') {
    document.getElementById('issueAccordion')?.classList.add('open');
  }
  
  log('Rendered product:', state.product.name);
}

// -------------------- EVENT DELEGATION --------------------
function handleClick(e) {
  const trigger = e.target.closest('[data-action]');
  if (!trigger) return;
  const action = trigger.dataset.action;
  log('Action:', action);

  switch (action) {
    case 'lightbox':
      const src = trigger.dataset.src;
      if (src) openLightbox(src);
      break;
    case 'slideLeft':
      document.getElementById('demoSlider')?.scrollBy({ left: -320, behavior: 'smooth' });
      break;
    case 'slideRight':
      document.getElementById('demoSlider')?.scrollBy({ left: 320, behavior: 'smooth' });
      break;
    case 'toggleAccordion':
      const acc = trigger.closest('.accordion');
      if (acc) {
        acc.classList.toggle('open');
        const icon = acc.querySelector('.fa-chevron-down');
        if (icon) icon.style.transform = acc.classList.contains('open') ? 'rotate(180deg)' : 'rotate(0)';
      }
      break;
    case 'rate':
      const star = parseInt(trigger.dataset.star);
      if (!star) return;
      document.querySelectorAll('.rating-box i').forEach((s, idx) => {
        s.style.color = idx < star ? 'var(--star, #fbbf24)' : '#4b5563';
      });
      showToast(`⭐ Cảm ơn bạn đã đánh giá ${star} sao!`);
      break;
    case 'download':
      download();
      break;
    case 'favorite':
      toggleFavorite();
      break;
    case 'share':
      shareFacebook();
      break;
    case 'copy':
      copyLink();
      break;
    case 'report':
      reportIssue();
      break;
  }
}

el?.addEventListener('click', handleClick);

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
      log('Auth state:', user ? user.uid : 'guest');
      await loadFavorite();
      await render();
      preloader?.classList.add('hidden');
    });
  } catch (e) {
    preloader?.classList.add('hidden');
    // Lỗi đã hiển thị trong fetchProduct
  }
})();
