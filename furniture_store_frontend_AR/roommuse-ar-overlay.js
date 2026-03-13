/**
 * RoomMuse AR Overlay for furniture_store_frontend
 *
 * Flow:
 *   1. Fetch .glb model from: GET /items/{item_id}
 *      (fallback: GET /items → match by name)
 *   2. QR encodes: ec-design.vercel.app?model=GLB_URL&name=...
 *   3. Phone scans QR → ec-design app loads → tap "View in AR" → native AR
 *
 * This uses the SAME link format as the SDK v2 (ec-design.vercel.app),
 * NOT Google Scene Viewer.
 *
 * Backend: https://ar-backend-563656133641.us-central1.run.app
 * AR App: https://ec-design.vercel.app
 */

// ── Config ──────────────────────────────────────────────────
var ROOMMUSE_API = 'https://ar-backend-563656133641.us-central1.run.app';
var ROOMMUSE_AR_APP = 'https://ec-design.vercel.app';
var ROOMMUSE_QR_SIZE = 260;

var _rmar_allItems = null;
var _rmar_allItemsPromise = null;
var _rmar_itemCache = {};

// ── SVG icons ───────────────────────────────────────────────
var AR_CUBE_SVG =
  '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
  '<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>' +
  '<polyline points="3.27 6.96 12 12.01 20.73 6.96"/>' +
  '<line x1="12" y1="22.08" x2="12" y2="12"/></svg>';

var AR_CUBE_SVG_LG =
  '<svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">' +
  '<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>' +
  '<polyline points="3.27 6.96 12 12.01 20.73 6.96"/>' +
  '<line x1="12" y1="22.08" x2="12" y2="12"/></svg>';

// ── CSS ─────────────────────────────────────────────────────
(function () {
  var s = document.createElement('style');
  s.id = 'rmar-styles';
  s.textContent = [
    '.rmar-overlay { position:fixed;inset:0;z-index:99999;display:flex;align-items:center;justify-content:center;background:rgba(10,10,20,.65);backdrop-filter:blur(6px);opacity:0;transition:opacity .3s;padding:20px; }',
    '.rmar-overlay.show { opacity:1; }',
    '.rmar-box { background:#fff;border-radius:20px;padding:40px;max-width:440px;width:100%;text-align:center;box-shadow:0 24px 64px rgba(0,0,0,.25);transform:translateY(10px) scale(.97);transition:transform .3s;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;position:relative; }',
    '.rmar-overlay.show .rmar-box { transform:translateY(0) scale(1); }',
    '.rmar-x { position:absolute;top:12px;right:12px;width:32px;height:32px;border:none;border-radius:50%;background:#f0f0f4;color:#666;cursor:pointer;font-size:18px;display:flex;align-items:center;justify-content:center; }',
    '.rmar-x:hover { background:#e0e0e4;color:#333; }',
    '.rmar-modal-icon { width:64px;height:64px;border-radius:16px;background:linear-gradient(135deg,#e8f5e9,#c8e6c9);color:#2e7d32;display:inline-flex;align-items:center;justify-content:center;margin-bottom:16px; }',
    '.rmar-h { font-size:20px;font-weight:700;color:#1a1a2e;margin:0 0 6px; }',
    '.rmar-sub { font-size:14px;color:#6b6b80;margin:0 0 6px; }',
    '.rmar-sub b { color:#1a1a2e; }',
    '.rmar-dims { font-size:12px;color:#999;margin:0 0 16px; }',
    '.rmar-qr { display:flex;justify-content:center;align-items:center;padding:20px;background:#fafafc;border-radius:14px;margin-bottom:16px;min-height:300px; }',
    '.rmar-qr img { border-radius:6px; }',
    '.rmar-spin { width:24px;height:24px;border:3px solid #e8e8ec;border-top-color:#233B3D;border-radius:50%;animation:rmar-sp .6s linear infinite;margin:0 auto 10px; }',
    '@keyframes rmar-sp { to { transform:rotate(360deg); } }',
    '.rmar-model-info { font-size:11px;color:#2e7d32;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:8px 12px;margin:0 0 12px;word-break:break-all;line-height:1.4; }',
    '.rmar-model-info b { color:#166534; }',
    '.rmar-steps { display:flex;align-items:center;justify-content:center;gap:8px;margin-bottom:16px; }',
    '.rmar-sn { width:26px;height:26px;border-radius:50%;background:#233B3D;color:#fff;font-size:12px;font-weight:700;line-height:26px;text-align:center; }',
    '.rmar-sl { font-size:11px;color:#6b6b80; }',
    '.rmar-sa { color:#ccc; }',
    '.rmar-link { display:inline-block;font-size:13px;color:#2e7d32;text-decoration:none;padding:8px 16px;border-radius:8px; }',
    '.rmar-link:hover { background:#e8f5e9; }',
    '.rmar-note { font-size:12px;color:#b45309;margin-top:8px;line-height:1.5;background:#fffbeb;padding:10px 14px;border-radius:8px;border:1px solid #fde68a; }',
    '.rmar-img-wrap { position:relative;width:100%; }',
    '.rmar-float-icon { position:absolute;top:8px;right:8px;z-index:10;width:40px;height:40px;border:none;border-radius:12px;background:#233B3D;color:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(0,0,0,.25);transition:all .2s;padding:0; }',
    '.rmar-float-icon:hover { background:#2e7d32;transform:scale(1.1);box-shadow:0 4px 16px rgba(0,0,0,.35); }',
    '.rmar-float-icon svg { pointer-events:none; }',
    '.rmar-modal-img-wrap { position:relative;display:inline-block;width:100%; }',
    '.rmar-modal-float-icon { position:absolute;top:10px;right:10px;z-index:10;width:44px;height:44px;border:none;border-radius:12px;background:#233B3D;color:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(0,0,0,.25);transition:all .2s;padding:0; }',
    '.rmar-modal-float-icon:hover { background:#2e7d32;transform:scale(1.1); }',
    '.rmar-modal-float-icon svg { pointer-events:none; }',
    '.btn-ar { background:#233B3D!important;color:#fff!important;border:none;padding:8px 16px;border-radius:5px;cursor:pointer;font-weight:600; }',
    '.btn-ar:hover { background:#2e7d32!important; }',
  ].join('\n');
  document.head.appendChild(s);
})();

// ── Load QRCode.js ──────────────────────────────────────────
(function () {
  if (typeof QRCode !== 'undefined') return;
  var s = document.createElement('script');
  s.src = 'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js';
  document.head.appendChild(s);
})();

// ══════════════════════════════════════════════════════════════
// NORMALIZE: parse a raw API response into a clean item object
// Same field mapping as SDK v2 (roommuse-ar-sdk.js)
// ══════════════════════════════════════════════════════════════
function _rmar_normalize(raw, fallbackId) {
  return {
    id: raw.id || raw.item_id || fallbackId,
    name: raw.name || raw.item_name || 'Furniture',
    category: raw.category || raw.type || 'furniture',
    modelUrl: raw.modelUrl || raw.model_url || raw.glb_url || raw.model || null,
    imageUrl: raw.imageUrl || raw.image_url || raw.thumbnail || null,
    dimensions: {
      length: raw.length || (raw.dimensions && raw.dimensions.length) || null,
      width: raw.width || (raw.dimensions && raw.dimensions.width) || null,
      height: raw.height || (raw.dimensions && raw.dimensions.height) || null,
    },
    _raw: raw,
  };
}

// ══════════════════════════════════════════════════════════════
// STRATEGY 1: GET /items/{item_id} — direct endpoint
// ══════════════════════════════════════════════════════════════
function _rmar_fetchById(itemId) {
  if (_rmar_itemCache[itemId]) return Promise.resolve(_rmar_itemCache[itemId]);

  var url = ROOMMUSE_API + '/items/' + encodeURIComponent(itemId);
  console.log('[RoomMuse] Strategy 1: GET', url);

  return fetch(url)
    .then(function (r) {
      if (!r.ok) throw new Error(r.status);
      return r.json();
    })
    .then(function (raw) {
      var item = _rmar_normalize(raw, itemId);
      console.log('[RoomMuse] /items/{id} response:', JSON.stringify(raw).substring(0, 300));
      if (item.modelUrl) {
        console.log('[RoomMuse] Got model from /items/{id}:', item.modelUrl);
        _rmar_itemCache[itemId] = item;
      }
      return item;
    })
    .catch(function (e) {
      console.log('[RoomMuse] /items/{id} failed:', e.message, '— will try /items fallback');
      return null;
    });
}

// ══════════════════════════════════════════════════════════════
// STRATEGY 2: GET /items — fetch all, match by name
// (This is how demo.html successfully loads 44 items)
// ══════════════════════════════════════════════════════════════
function _rmar_fetchAll() {
  if (_rmar_allItemsPromise) return _rmar_allItemsPromise;

  console.log('[RoomMuse] Strategy 2: GET', ROOMMUSE_API + '/items');
  _rmar_allItemsPromise = fetch(ROOMMUSE_API + '/items')
    .then(function (r) {
      if (!r.ok) throw new Error(r.status);
      return r.json();
    })
    .then(function (data) {
      var raw = Array.isArray(data) ? data : (data.items || data.results || []);
      _rmar_allItems = raw.map(function (r) { return _rmar_normalize(r); });
      var withModel = _rmar_allItems.filter(function (i) { return !!i.modelUrl; });
      console.log('[RoomMuse] /items returned', _rmar_allItems.length, 'items,', withModel.length, 'with models');
      return _rmar_allItems;
    })
    .catch(function (e) {
      console.error('[RoomMuse] /items failed:', e);
      _rmar_allItems = [];
      return [];
    });

  return _rmar_allItemsPromise;
}

function _rmar_findByName(productName) {
  if (!_rmar_allItems || !productName) return null;
  var lower = productName.toLowerCase().trim();

  // Exact match
  var exact = _rmar_allItems.find(function (i) {
    return (i.name || '').toLowerCase().trim() === lower;
  });
  if (exact && exact.modelUrl) return exact;

  // Contains match
  var partial = _rmar_allItems.find(function (i) {
    var n = (i.name || '').toLowerCase().trim();
    return n.indexOf(lower) !== -1 || lower.indexOf(n) !== -1;
  });
  if (partial && partial.modelUrl) return partial;

  return exact || partial || null;
}

// ══════════════════════════════════════════════════════════════
// RESOLVE MODEL: try /items/{id} first, then /items + name match
// ══════════════════════════════════════════════════════════════
function _rmar_resolveModel(productId, productName) {
  return _rmar_fetchById(productId).then(function (item) {
    if (item && item.modelUrl) return item;

    // Fallback: fetch all and match by name
    return _rmar_fetchAll().then(function () {
      var match = _rmar_findByName(productName);
      if (match) {
        console.log('[RoomMuse] Name match: "' + productName + '" → "' + match.name + '" → ' + match.modelUrl);
      }
      return match;
    });
  });
}

// ══════════════════════════════════════════════════════════════
// AR LINK: ec-design.vercel.app (the team's AR app)
//
// Same format as SDK v2 generateARLink():
//   ec-design.vercel.app?model=GLB_URL&name=NAME&type=CATEGORY
//
// On phone: ec-design loads → shows "View in AR" → launches native AR
// ══════════════════════════════════════════════════════════════
function _rmar_makeARLink(item) {
  if (!item || !item.modelUrl) return ROOMMUSE_AR_APP;

  var params = new URLSearchParams({
    model: item.modelUrl,
    name: item.name || 'Furniture',
    type: item.category || 'furniture',
  });

  // Add dimensions for accurate placement
  var dim = item.dimensions;
  if (dim && dim.length) {
    params.set('length', dim.length);
    params.set('width', dim.width);
    params.set('height', dim.height);
  }

  return ROOMMUSE_AR_APP + '?' + params.toString();
}

// ══════════════════════════════════════════════════════════════
// THE QR CODE MODAL
// ══════════════════════════════════════════════════════════════
function _rmar_openModal(productId) {
  console.log('[RoomMuse] Opening AR for:', productId);

  // Get product name from main.js
  var productName = 'this item';
  if (typeof products !== 'undefined') {
    for (var i = 0; i < products.length; i++) {
      if (String(products[i].id) === String(productId)) {
        productName = products[i].name;
        break;
      }
    }
  }

  // Close product detail modal
  var pm = document.getElementById('product-modal');
  if (pm) pm.style.display = 'none';

  // Build overlay
  var ov = document.createElement('div');
  ov.className = 'rmar-overlay';
  ov.innerHTML =
    '<div class="rmar-box">' +
    '<button class="rmar-x">&times;</button>' +
    '<div class="rmar-modal-icon">' + AR_CUBE_SVG_LG + '</div>' +
    '<h2 class="rmar-h">View ' + productName + ' in AR</h2>' +
    '<p class="rmar-sub">Scan the QR code &mdash; <b>AR opens directly on your phone</b></p>' +
    '<div class="rmar-dims" id="rmar-dims"></div>' +
    '<div class="rmar-qr" id="rmar-qr">' +
    '  <div><div class="rmar-spin"></div>' +
    '  <div style="color:#999;font-size:13px">Fetching 3D model from backend...</div></div>' +
    '</div>' +
    '<div id="rmar-model-info"></div>' +
    '<div class="rmar-steps">' +
    '  <div><div class="rmar-sn">1</div><div class="rmar-sl">Scan QR</div></div>' +
    '  <div class="rmar-sa">&#9654;</div>' +
    '  <div><div class="rmar-sn">2</div><div class="rmar-sl">Tap View in AR</div></div>' +
    '  <div class="rmar-sa">&#9654;</div>' +
    '  <div><div class="rmar-sn">3</div><div class="rmar-sl">Place furniture</div></div>' +
    '</div>' +
    '<a class="rmar-link" id="rmar-link-ar" href="#" target="_blank">Open on this device &rarr;</a>' +
    '</div>';

  document.body.appendChild(ov);
  setTimeout(function () { ov.classList.add('show'); }, 10);

  function close() {
    ov.classList.remove('show');
    setTimeout(function () { if (ov.parentNode) ov.parentNode.removeChild(ov); }, 300);
  }
  ov.querySelector('.rmar-x').onclick = close;
  ov.onclick = function (e) { if (e.target === ov) close(); };
  var escFn = function (e) { if (e.key === 'Escape') { close(); document.removeEventListener('keydown', escFn); } };
  document.addEventListener('keydown', escFn);

  var qr = ov.querySelector('#rmar-qr');
  var dims = ov.querySelector('#rmar-dims');
  var info = ov.querySelector('#rmar-model-info');
  var linkAR = ov.querySelector('#rmar-link-ar');

  // ── Resolve model from backend ────────────────────────────
  _rmar_resolveModel(productId, productName).then(function (item) {
    if (!ov.parentNode) return;

    var hasModel = item && item.modelUrl;

    if (item && item.dimensions && item.dimensions.length) {
      dims.textContent = item.dimensions.length + 'm \u00D7 ' +
        item.dimensions.width + 'm \u00D7 ' + item.dimensions.height + 'm';
    }

    if (hasModel) {
      // Build AR link → ec-design.vercel.app?model=GLB_URL
      var arUrl = _rmar_makeARLink(item);
      console.log('[RoomMuse] AR link:', arUrl);

      info.className = 'rmar-model-info';
      info.innerHTML = '<b>3D model:</b> ' + item.modelUrl;
      linkAR.href = arUrl;

      // Mobile: open ec-design directly
      if (/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
        close();
        window.location.href = arUrl;
        return;
      }

      // Desktop: show QR
      qr.innerHTML = '';
      if (typeof QRCode !== 'undefined') {
        new QRCode(qr, {
          text: arUrl,
          width: ROOMMUSE_QR_SIZE,
          height: ROOMMUSE_QR_SIZE,
          colorDark: '#233B3D',
          colorLight: '#ffffff',
          correctLevel: QRCode.CorrectLevel.H,
        });
      } else {
        qr.innerHTML = '<a href="' + arUrl + '" target="_blank" style="word-break:break-all;color:#2e7d32;font-size:12px">' + arUrl + '</a>';
      }

    } else {
      info.innerHTML = '';
      qr.innerHTML = '<div style="text-align:center;color:#999;font-size:14px;padding:20px">' +
        '<div style="font-size:48px;margin-bottom:12px">📦</div>' +
        'No 3D model found for "' + productName + '"</div>';
      qr.insertAdjacentHTML('afterend',
        '<div class="rmar-note">' +
        '<b>Could not find model for this product.</b><br>' +
        'Backend has ' + (_rmar_allItems ? _rmar_allItems.length : '?') + ' items. ' +
        'Check that the product name matches the CSV.' +
        '</div>'
      );
      linkAR.style.display = 'none';
    }
  });
}

// ══════════════════════════════════════════════════════════════
// FLOATING AR ICONS ON PRODUCT CARD IMAGES
// ══════════════════════════════════════════════════════════════
function _rmar_addFloatingIcons() {
  var cards = document.querySelectorAll('.product-card');
  cards.forEach(function (card) {
    if (card.querySelector('.rmar-float-icon')) return;
    var img = card.querySelector('img.product-image');
    if (!img) return;
    var arBtn = card.querySelector('.view-ar');
    if (!arBtn) return;
    var id = arBtn.getAttribute('data-id');
    if (!id) return;

    var wrap = document.createElement('div');
    wrap.className = 'rmar-img-wrap';
    img.parentNode.insertBefore(wrap, img);
    wrap.appendChild(img);

    var icon = document.createElement('button');
    icon.className = 'rmar-float-icon';
    icon.title = 'View in AR';
    icon.innerHTML = AR_CUBE_SVG;
    icon.addEventListener('click', function (e) {
      e.stopPropagation();
      _rmar_openModal(id);
    });
    wrap.appendChild(icon);
  });
}

// ══════════════════════════════════════════════════════════════
// FLOATING AR ICON ON PRODUCT DETAIL MODAL IMAGE
// ══════════════════════════════════════════════════════════════
function _rmar_patchModalImage() {
  var modalImg = document.getElementById('modal-product-image');
  if (!modalImg) return;
  if (modalImg.parentNode.classList.contains('rmar-modal-img-wrap')) return;

  var wrap = document.createElement('div');
  wrap.className = 'rmar-modal-img-wrap';
  modalImg.parentNode.insertBefore(wrap, modalImg);
  wrap.appendChild(modalImg);

  var icon = document.createElement('button');
  icon.className = 'rmar-modal-float-icon';
  icon.title = 'View in AR';
  icon.innerHTML = AR_CUBE_SVG;
  icon.addEventListener('click', function () {
    var arBtn = document.getElementById('modal-view-ar');
    var id = arBtn ? arBtn.getAttribute('data-id') : null;
    if (id) _rmar_openModal(id);
  });
  wrap.appendChild(icon);
}

// ══════════════════════════════════════════════════════════════
// OVERRIDES
// ══════════════════════════════════════════════════════════════
window.openArView = function (productId) {
  _rmar_openModal(String(productId));
};

window.attachViewButtons = function () {
  document.querySelectorAll('.view-product').forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      var id = e.target.getAttribute('data-id');
      if (typeof openProductModal === 'function') openProductModal(id);
    });
  });
  document.querySelectorAll('.view-ar').forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      var id = e.target.getAttribute('data-id');
      if (id) _rmar_openModal(id);
    });
  });
  _rmar_addFloatingIcons();
};

(function () {
  var btn = document.getElementById('modal-view-ar');
  if (!btn) return;
  var newBtn = btn.cloneNode(true);
  btn.parentNode.replaceChild(newBtn, btn);
  newBtn.addEventListener('click', function () {
    var id = newBtn.getAttribute('data-id');
    if (id) _rmar_openModal(id);
  });
})();

_rmar_patchModalImage();

// Pre-fetch all items on page load (so first click is fast)
_rmar_fetchAll();

if (document.querySelectorAll('.view-ar').length > 0) {
  attachViewButtons();
}

console.log('%c\u2713 RoomMuse AR overlay active', 'color:#2e7d32;font-weight:600');
console.log('  Backend:', ROOMMUSE_API + '/items/{id}');
console.log('  AR App:', ROOMMUSE_AR_APP);
console.log('  QR → ec-design.vercel.app?model=GLB_URL → phone opens → tap View in AR → native AR');