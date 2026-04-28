// Bản chạy ổn định trên GitHub Pages, không cần Firebase
(function() {
  var el = document.getElementById('productContent');
  var preloader = document.getElementById('preloader');
  var lightbox = document.getElementById('lightbox');
  var lightboxImg = document.getElementById('lightboxImg');
  var productId = new URLSearchParams(location.search).get('id');

  function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function(m) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;' }[m];
    });
  }

  function showToast(msg) {
    var toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(function() { toast.classList.remove('show'); }, 2500);
  }

  // Lightbox
  function openLightbox(src) {
    if (!src || !lightbox || !lightboxImg) return;
    lightboxImg.src = src;
    lightbox.classList.add('active');
  }

  document.querySelector('.lightbox-close')?.addEventListener('click', function() {
    lightbox?.classList.remove('active');
  });
  lightbox?.addEventListener('click', function(e) {
    if (e.target === lightbox) lightbox.classList.remove('active');
  });

  if (!productId) {
    el.innerHTML = '<p style="text-align:center;padding:40px;">Thiếu ID sản phẩm. Dùng link: ?id=code1</p>';
    preloader?.classList.add('hidden');
    return;
  }

  // Fetch sản phẩm
  fetch('data/products.json')
    .then(function(res) {
      if (!res.ok) throw new Error('Không tìm thấy file products.json');
      return res.json();
    })
    .then(function(data) {
      var product = data.find(function(p) { return p.id === productId; });
      if (!product) throw new Error('Sản phẩm không tồn tại (id: ' + productId + ')');

      // Render
      renderProduct(product);
      preloader?.classList.add('hidden');
    })
    .catch(function(err) {
      el.innerHTML = '<p style="color:red;padding:40px;text-align:center;">Lỗi: ' + escapeHtml(err.message) + '</p>';
      preloader?.classList.add('hidden');
    });

  function renderProduct(product) {
    var imagesHtml = '';
    if (product.demoImages && product.demoImages.length > 0) {
      imagesHtml = product.demoImages.map(function(src) {
        return '<img src="' + escapeHtml(src) + '" alt="demo" loading="lazy" onclick="document.getElementById(\'lightbox\').classList.add(\'active\'); document.getElementById(\'lightboxImg\').src=\'' + escapeHtml(src) + '\';">';
      }).join('');
    } else {
      imagesHtml = '<div class="no-image"><i class="far fa-image fa-2x"></i><br>Không có ảnh demo</div>';
    }

    var notesHtml = product.notes ? escapeHtml(product.notes).replace(/\n/g, '<br>') : 'Không có ghi chú.';
    var versionHtml = product.version ? '<span><i class="fas fa-code-branch"></i> v' + escapeHtml(product.version) + '</span>' : '';
    var authorHtml = product.author ? '<br><small style="color:#8b8b9e;">👤 Tác giả: ' + escapeHtml(product.author) + '</small>' : '';

    el.innerHTML = '<div class="product-card">' +
      '<div class="product-header">' +
        '<h1 class="product-title">' + escapeHtml(product.name) + '</h1>' +
        '<div class="stats-badge">' +
          '<span><i class="fas fa-eye"></i> 0</span>' +
          '<span><i class="fas fa-download"></i> 0</span>' +
          versionHtml +
        '</div>' +
      '</div>' +
      '<div class="slider-wrapper">' +
        '<div class="demo-slider" id="demoSlider">' + imagesHtml + '</div>' +
        (product.demoImages && product.demoImages.length > 1 ? '<button class="slider-btn slider-left" onclick="document.getElementById(\'demoSlider\').scrollBy({left:-320,behavior:\'smooth\'})"><i class="fas fa-chevron-left"></i></button><button class="slider-btn slider-right" onclick="document.getElementById(\'demoSlider\').scrollBy({left:320,behavior:\'smooth\'})"><i class="fas fa-chevron-right"></i></button>' : '') +
      '</div>' +
      '<div class="desc-block">' +
        '<strong style="color:#c4b5fd;">📖 Mô tả:</strong><br>' + escapeHtml(product.description) +
        authorHtml +
      '</div>' +
      '<div class="accordion" id="issueAccordion">' +
        '<div class="accordion-header" onclick="this.parentElement.classList.toggle(\'open\')">' +
          '<i class="fas fa-bug" style="color:#f472b6;"></i> Lỗi thường gặp & Cách khắc phục' +
          '<i class="fas fa-chevron-down" style="margin-left:auto;"></i>' +
        '</div>' +
        '<div class="accordion-content">' + notesHtml + '</div>' +
      '</div>' +
      '<div class="action-grid">' +
        (product.downloadLink ? '<a href="' + escapeHtml(product.downloadLink) + '" target="_blank" class="btn btn-primary"><i class="fas fa-download"></i> Tải code</a>' : '<button class="btn btn-primary" disabled>Chưa có link</button>') +
        '<button class="btn btn-outline" onclick="navigator.clipboard.writeText(location.href);showToast(\'📋 Đã sao chép link\')"><i class="fas fa-link"></i> Copy</button>' +
        '<button class="btn btn-outline" onclick="window.open(\'https://www.facebook.com/sharer/sharer.php?u=\'+encodeURIComponent(location.href))"><i class="fab fa-facebook"></i> Chia sẻ</button>' +
      '</div>' +
    '</div>';

    // Mở accordion nếu có notes
    if (product.notes && product.notes.trim() && product.notes !== 'Không có ghi chú.') {
      document.getElementById('issueAccordion')?.classList.add('open');
    }
  }
})();
