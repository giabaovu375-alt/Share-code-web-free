// Bản rút gọn dành cho GitHub Pages - Không Firebase
var el = document.getElementById('productContent');
var productId = new URLSearchParams(location.search).get('id');

(async function() {
  if (!productId) {
    el.innerHTML = '<p style="text-align:center;padding:40px;">Thiếu ID sản phẩm. Ví dụ: ?id=code1</p>';
    return;
  }

  try {
    var res = await fetch('data/products.json');
    if (!res.ok) throw new Error('Không tải được products.json (HTTP ' + res.status + ')');
    var data = await res.json();
    var product = data.find(function(p) { return p.id === productId; });

    if (!product) {
      el.innerHTML = '<p style="text-align:center;padding:40px;">Không tìm thấy sản phẩm với id: ' + productId + '</p>';
      return;
    }

    var imagesHtml = '';
    if (product.demoImages && product.demoImages.length > 0) {
      imagesHtml = product.demoImages.map(function(src) {
        return '<img src="' + src + '" alt="demo" style="width:100%;max-width:300px;display:block;margin:10px auto;border-radius:10px;">';
      }).join('');
    } else {
      imagesHtml = '<p>Không có ảnh demo</p>';
    }

    el.innerHTML = '<div style="background:#111118;color:#e4e4ed;padding:20px;border-radius:20px;">'
      + '<h1 style="color:#c4b5fd;">' + product.name + '</h1>'
      + '<p>' + (product.description || '') + '</p>'
      + imagesHtml
      + (product.downloadLink ? '<a href="' + product.downloadLink + '" target="_blank" style="display:inline-block;margin-top:20px;padding:12px 24px;background:#a78bfa;color:#000;border-radius:30px;text-decoration:none;font-weight:bold;">📥 Tải code</a>' : '<p>Chưa có link tải</p>')
      + '</div>';
  } catch (e) {
    el.innerHTML = '<p style="color:red;padding:20px;">Lỗi: ' + e.message + '</p>';
  }
})();
