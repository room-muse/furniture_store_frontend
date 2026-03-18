/**
 * RoomMuse AR Overlay for furniture_store_frontend
 *
 * WHAT THIS DOES:
 *   1. Overrides openArView() from main.js with a QR code modal
 *   2. Overrides attachViewButtons() to fix the parseInt(UUID) bug
 *   3. Adds floating AR icon badges on every product card image
 *   4. Adds a floating AR icon on the product detail modal image
 *   5. Self-loads QRCode.js from CDN
 */

// ── Config ──────────────────────────────────────────────────
var ROOMMUSE_API = "https://ar-backend-563656133641.us-central1.run.app";
var ROOMMUSE_QR_SIZE = 260;
var _roommuse_cache = {};

// ── AR cube SVG icon (reused everywhere) ────────────────────
var AR_CUBE_SVG =
  '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
  '<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>' +
  '<polyline points="3.27 6.96 12 12.01 20.73 6.96"/>' +
  '<line x1="12" y1="22.08" x2="12" y2="12"/>' +
  "</svg>";

var AR_CUBE_SVG_LG =
  '<svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">' +
  '<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>' +
  '<polyline points="3.27 6.96 12 12.01 20.73 6.96"/>' +
  '<line x1="12" y1="22.08" x2="12" y2="12"/>' +
  "</svg>";

// ── Inject CSS ──────────────────────────────────────────────
(function injectCSS() {
  var style = document.createElement("style");
  style.id = "rmar-styles";
  style.textContent = [
    /* ── Overlay ── */
    ".rmar-overlay {",
    "  position:fixed; inset:0; z-index:99999;",
    "  display:flex; align-items:center; justify-content:center;",
    "  background:rgba(10,10,20,.65); backdrop-filter:blur(6px);",
    "  opacity:0; transition:opacity .3s; padding:20px;",
    "}",
    ".rmar-overlay.show { opacity:1; }",
    ".rmar-box {",
    "  background:#fff; border-radius:20px; padding:40px;",
    "  max-width:420px; width:100%; text-align:center;",
    "  box-shadow:0 24px 64px rgba(0,0,0,.25);",
    "  transform:translateY(10px) scale(.97);",
    "  transition:transform .3s;",
    '  font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;',
    "  position:relative;",
    "}",
    ".rmar-overlay.show .rmar-box { transform:translateY(0) scale(1); }",
    ".rmar-x {",
    "  position:absolute; top:12px; right:12px;",
    "  width:32px; height:32px; border:none; border-radius:50%;",
    "  background:#f0f0f4; color:#666; cursor:pointer;",
    "  font-size:18px; display:flex; align-items:center; justify-content:center;",
    "}",
    ".rmar-x:hover { background:#e0e0e4; color:#333; }",
    ".rmar-modal-icon {",
    "  width:64px; height:64px; border-radius:16px;",
    "  background:linear-gradient(135deg,#e8f5e9,#c8e6c9);",
    "  color:#2e7d32; display:inline-flex; align-items:center;",
    "  justify-content:center; margin-bottom:16px;",
    "}",
    ".rmar-h { font-size:20px; font-weight:700; color:#1a1a2e; margin:0 0 6px; }",
    ".rmar-sub { font-size:14px; color:#6b6b80; margin:0 0 6px; }",
    ".rmar-sub b { color:#1a1a2e; }",
    ".rmar-dims { font-size:12px; color:#999; margin:0 0 16px; }",
    ".rmar-qr {",
    "  display:flex; justify-content:center; align-items:center;",
    "  padding:20px; background:#fafafc; border-radius:14px;",
    "  margin-bottom:20px; min-height:300px;",
    "}",
    ".rmar-qr img { border-radius:6px; }",
    ".rmar-spin {",
    "  width:24px; height:24px; border:3px solid #e8e8ec;",
    "  border-top-color:#233B3D; border-radius:50%;",
    "  animation:rmar-sp .6s linear infinite; margin:0 auto 10px;",
    "}",
    "@keyframes rmar-sp { to { transform:rotate(360deg); } }",
    ".rmar-steps {",
    "  display:flex; align-items:center; justify-content:center;",
    "  gap:8px; margin-bottom:16px;",
    "}",
    ".rmar-sn {",
    "  width:26px; height:26px; border-radius:50%;",
    "  background:#233B3D; color:#fff; font-size:12px;",
    "  font-weight:700; line-height:26px; text-align:center;",
    "}",
    ".rmar-sl { font-size:11px; color:#6b6b80; }",
    ".rmar-sa { color:#ccc; }",
    ".rmar-note { font-size:12px; color:#999; margin-top:8px; line-height:1.5; }",

    /* ── Floating AR icon on product cards ── */
    ".rmar-img-wrap {",
    "  position:relative; width:100%;",
    "}",
    ".rmar-float-icon {",
    "  position:absolute; top:8px; right:8px; z-index:10;",
    "  width:40px; height:40px; border:none; border-radius:12px;",
    "  background:#233B3D; color:#fff; cursor:pointer;",
    "  display:flex; align-items:center; justify-content:center;",
    "  box-shadow:0 2px 8px rgba(0,0,0,.25);",
    "  transition:all .2s ease;",
    "  padding:0;",
    "}",
    ".rmar-float-icon:hover {",
    "  background:#2e7d32; transform:scale(1.1);",
    "  box-shadow:0 4px 16px rgba(0,0,0,.35);",
    "}",
    ".rmar-float-icon svg { pointer-events:none; }",

    /* ── Floating AR icon on product modal image ── */
    ".rmar-modal-img-wrap {",
    "  position:relative; display:inline-block; width:100%;",
    "}",
    ".rmar-modal-float-icon {",
    "  position:absolute; top:10px; right:10px; z-index:10;",
    "  width:44px; height:44px; border:none; border-radius:12px;",
    "  background:#233B3D; color:#fff; cursor:pointer;",
    "  display:flex; align-items:center; justify-content:center;",
    "  box-shadow:0 2px 8px rgba(0,0,0,.25);",
    "  transition:all .2s ease;",
    "  padding:0;",
    "}",
    ".rmar-modal-float-icon:hover {",
    "  background:#2e7d32; transform:scale(1.1);",
    "}",
    ".rmar-modal-float-icon svg { pointer-events:none; }",

    /* ── Override .btn-ar style ── */
    ".btn-ar {",
    "  background:#233B3D!important; color:#fff!important;",
    "  border:none; padding:8px 16px; border-radius:5px;",
    "  cursor:pointer; font-weight:600;",
    "}",
    ".btn-ar:hover { background:#2e7d32!important; }",
  ].join("\n");
  document.head.appendChild(style);
})();

// ── Load QRCode.js ──────────────────────────────────────────
(function loadQR() {
  if (typeof QRCode !== "undefined") return;
  var s = document.createElement("script");
  s.src = "https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js";
  document.head.appendChild(s);
})();

// ── Fetch model from backend ────────────────────────────────
function _rmar_fetchModel(itemId) {
  if (_roommuse_cache[itemId]) return Promise.resolve(_roommuse_cache[itemId]);
  return fetch(ROOMMUSE_API + "/items/" + encodeURIComponent(itemId))
    .then(function (r) {
      if (!r.ok) throw new Error(r.status);
      return r.json();
    })
    .then(function (d) {
      var item = {
        id: d.id || itemId,
        name: d.name || d.item_name || "Furniture",
        category: d.category || d.type || "furniture",
        modelUrl: d.usdzUrl,
        dimensions: {
          length: d.length || (d.dimensions && d.dimensions.length) || null,
          width: d.width || (d.dimensions && d.dimensions.width) || null,
          height: d.height || (d.dimensions && d.dimensions.height) || null,
        },
      };
      console.log(item);
      _roommuse_cache[itemId] = item;
      return item;
    })
    .catch(function (e) {
      console.warn("[RoomMuse] fetch failed:", itemId, e);
      return null;
    });
}

// ══════════════════════════════════════════════════════════════
// THE QR CODE MODAL
// ══════════════════════════════════════════════════════════════
function _rmar_openModal(productId) {
  console.log("[RoomMuse] Opening AR modal for:", productId);

  var name = "this item";
  if (typeof products !== "undefined") {
    for (var i = 0; i < products.length; i++) {
      if (String(products[i].id) === String(productId)) {
        name = products[i].name;
        break;
      }
    }
  }

  // Close product detail modal if open
  var pm = document.getElementById("product-modal");
  if (pm) pm.style.display = "none";

  var ov = document.createElement("div");
  ov.className = "rmar-overlay";
  ov.innerHTML =
    '<div class="rmar-box">' +
    '<button class="rmar-x">&times;</button>' +
    '<div class="rmar-modal-icon">' +
    AR_CUBE_SVG_LG +
    "</div>" +
    '<h2 class="rmar-h">View in Your Space</h2>' +
    '<p class="rmar-sub">Scan with your phone to place <b>' +
    name +
    "</b> in AR</p>" +
    '<div class="rmar-dims" id="rmar-dims"></div>' +
    '<div class="rmar-qr" id="rmar-qr"><div class="rmar-spin"></div><div style="color:#999;font-size:13px">Fetching 3D model...</div></div>' +
    '<div class="rmar-steps">' +
    '<div><div class="rmar-sn">1</div><div class="rmar-sl">Scan QR</div></div>' +
    '<div class="rmar-sa">&#9654;</div>' +
    '<div><div class="rmar-sn">2</div><div class="rmar-sl">Opens AR</div></div>' +
    '<div class="rmar-sa">&#9654;</div>' +
    '<div><div class="rmar-sn">3</div><div class="rmar-sl">Place it</div></div>' +
    "</div>" +
    "</div>";

  document.body.appendChild(ov);
  setTimeout(function () {
    ov.classList.add("show");
  }, 10);

  // Close
  function close() {
    ov.classList.remove("show");
    setTimeout(function () {
      if (ov.parentNode) ov.parentNode.removeChild(ov);
    }, 300);
  }
  ov.querySelector(".rmar-x").onclick = close;
  ov.onclick = function (e) {
    if (e.target === ov) close();
  };
  var escFn = function (e) {
    if (e.key === "Escape") {
      close();
      document.removeEventListener("keydown", escFn);
    }
  };
  document.addEventListener("keydown", escFn);

  // Fetch + QR
  var qr = ov.querySelector("#rmar-qr");
  var dims = ov.querySelector("#rmar-dims");

  function _rmar_buildQrLink(id) {
    try {
      var href = window.location.href;
      var u = new URL(href);
      u.hash = "";
      u.searchParams.set("arId", String(id));
      return u.toString();
    } catch (e) {
      // Fallback if URL() fails for any reason
      var base =
        (window.location.origin || "") + (window.location.pathname || "/");
      return (
        String(base).replace(/\/?$/, "/") +
        "?arId=" +
        encodeURIComponent(String(id))
      );
    }
  }

  _rmar_fetchModel(productId).then(function (item) {
    if (!ov.parentNode) return;
    var qrUrl = _rmar_buildQrLink(productId);
    if (item && item.dimensions && item.dimensions.length) {
      dims.textContent =
        item.dimensions.length +
        "m \u00D7 " +
        item.dimensions.width +
        "m \u00D7 " +
        item.dimensions.height +
        "m";
    }
    qr.innerHTML = "";
    if (typeof QRCode !== "undefined") {
      new QRCode(qr, {
        text: qrUrl,
        width: ROOMMUSE_QR_SIZE,
        height: ROOMMUSE_QR_SIZE,
        colorDark: "#233B3D",
        colorLight: "#ffffff",
        correctLevel: QRCode.CorrectLevel.H,
      });
    } else {
      qr.innerHTML =
        '<a href="' +
        qrUrl +
        '" target="_blank" style="word-break:break-all;color:#2e7d32">' +
        qrUrl +
        "</a>";
    }
    if (!item || !item.modelUrl) {
      qr.insertAdjacentHTML(
        "afterend",
        '<p class="rmar-note">3D model not generated yet. Make sure the CSV was uploaded to the backend.</p>',
      );
    }
  });
}

// ══════════════════════════════════════════════════════════════
// FLOATING AR ICONS ON PRODUCT CARD IMAGES
// ══════════════════════════════════════════════════════════════
function _rmar_addFloatingIcons() {
  var cards = document.querySelectorAll(".product-card");
  cards.forEach(function (card) {
    // Skip if we already added an icon to this card
    if (card.querySelector(".rmar-float-icon")) return;

    var img = card.querySelector("img.product-image");
    if (!img) return;

    // Get the product ID from the AR button in this card
    var arBtn = card.querySelector(".view-ar");
    if (!arBtn) return;
    var id = arBtn.getAttribute("data-id");
    if (!id) return;

    // Wrap the image in a relative container
    var wrap = document.createElement("div");
    wrap.className = "rmar-img-wrap";
    img.parentNode.insertBefore(wrap, img);
    wrap.appendChild(img);

    // Create floating icon button
    var icon = document.createElement("button");
    icon.className = "rmar-float-icon";
    icon.title = "View in AR";
    icon.innerHTML = AR_CUBE_SVG;
    icon.addEventListener("click", function (e) {
      e.stopPropagation();
      console.log("[RoomMuse] Float icon clicked, id:", id);
      _rmar_openModal(id);
    });

    wrap.appendChild(icon);
  });
}

// ══════════════════════════════════════════════════════════════
// FLOATING AR ICON ON PRODUCT DETAIL MODAL IMAGE
// ══════════════════════════════════════════════════════════════
function _rmar_patchModalImage() {
  var modalImg = document.getElementById("modal-product-image");
  if (!modalImg) return;
  // Only wrap once
  if (modalImg.parentNode.classList.contains("rmar-modal-img-wrap")) return;

  var wrap = document.createElement("div");
  wrap.className = "rmar-modal-img-wrap";
  modalImg.parentNode.insertBefore(wrap, modalImg);
  wrap.appendChild(modalImg);

  // Create the floating icon (we'll update its ID when modal opens)
  var icon = document.createElement("button");
  icon.className = "rmar-modal-float-icon";
  icon.id = "rmar-modal-float-btn";
  icon.title = "View in AR";
  icon.innerHTML = AR_CUBE_SVG;
  icon.addEventListener("click", function () {
    var arBtn = document.getElementById("modal-view-ar");
    var id = arBtn ? arBtn.getAttribute("data-id") : null;
    console.log("[RoomMuse] Modal float icon clicked, id:", id);
    if (id) _rmar_openModal(id);
  });
  wrap.appendChild(icon);
}

// ══════════════════════════════════════════════════════════════
// OVERRIDE #1: Replace openArView (called by main.js)
// ══════════════════════════════════════════════════════════════
window.openArView = function (productId) {
  console.log("[RoomMuse] openArView called with:", productId);
  _rmar_openModal(String(productId));
};

// ══════════════════════════════════════════════════════════════
// OVERRIDE #2: Replace attachViewButtons (called after render)
// Fixes parseInt(uuid) bug AND adds floating icons on images.
// ══════════════════════════════════════════════════════════════
window.attachViewButtons = function () {
  console.log("[RoomMuse] attachViewButtons patched");

  // View product buttons (keep original behavior)
  document.querySelectorAll(".view-product").forEach(function (btn) {
    btn.addEventListener("click", function (e) {
      var id = e.target.getAttribute("data-id");
      if (typeof openProductModal === "function") openProductModal(id);
    });
  });

  // AR buttons — use string ID, not parseInt
  document.querySelectorAll(".view-ar").forEach(function (btn) {
    btn.addEventListener("click", function (e) {
      var id = e.target.getAttribute("data-id");
      console.log("[RoomMuse] AR button clicked, id:", id);
      if (id) _rmar_openModal(id);
    });
  });

  // Add floating AR icons on product card images
  _rmar_addFloatingIcons();
};

// ══════════════════════════════════════════════════════════════
// PHONE DEEP LINK: if ?arId=... then fetch model + auto-open AR
// ══════════════════════════════════════════════════════════════
(function rmarHandleDeepLink() {
  function run() {
    var params = new URLSearchParams(window.location.search || "");
    var arId = params.get("arId") || params.get("id") || params.get("ar_id");
    if (!arId) return;

    function resolveUsdz(url) {
      if (!url) return null;
      var u = String(url).trim();
      if (u.toLowerCase().endsWith(".usdz")) return u.split("#")[0];
      try {
        var m = new URL(u).searchParams.get("model");
        if (m && m.toLowerCase().endsWith(".usdz")) return m.split("#")[0];
      } catch (e) {}
      var idx = u.toLowerCase().indexOf(".usdz");
      if (idx !== -1) return u.slice(0, idx + 5).split("#")[0];
      return null;
    }

    _rmar_fetchModel(String(arId)).then(function (item) {
      var usdz =
        resolveUsdz(item && item.modelUrl) || resolveUsdz(item && item.usdzUrl);
      if (!usdz) return;

      var href = usdz + "#allowsContentScaling=0";
      var imageUrl =
        (item && (item.imageUrl || item.thumbnailUrl || item.image)) || "";

      // Add <a rel="ar"><img></a> to the DOM
      var a = document.createElement("a");
      a.setAttribute("rel", "ar");
      a.href = href;
      a.style.cssText = "position:fixed;left:-9999px;top:-9999px;";
      var img = document.createElement("img");
      img.src = imageUrl;
      img.alt = (item && item.name) || "AR";
      a.appendChild(img);
      document.body.appendChild(a);

      // Auto-tap
      setTimeout(function () {
        a.click();
      }, 100);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", run);
  } else {
    run();
  }
})();

// ── Patch the modal AR button ───────────────────────────────
(function patchModalArButton() {
  var btn = document.getElementById("modal-view-ar");
  if (!btn) return;
  var newBtn = btn.cloneNode(true);
  btn.parentNode.replaceChild(newBtn, btn);
  newBtn.addEventListener("click", function () {
    var id = newBtn.getAttribute("data-id");
    console.log("[RoomMuse] Modal AR button clicked, id:", id);
    if (id) _rmar_openModal(id);
  });
})();

// ── Patch the modal to add floating icon on image ───────────
_rmar_patchModalImage();

// ── Re-bind for already-rendered products ───────────────────
if (document.querySelectorAll(".view-ar").length > 0) {
  attachViewButtons();
}

// ── Done ────────────────────────────────────────────────────
console.log(
  "%c\u2713 RoomMuse AR overlay active",
  "color:#2e7d32;font-weight:600",
);
console.log("  Backend:", ROOMMUSE_API);
console.log(
  "  Products found:",
  typeof products !== "undefined" ? products.length : "?",
);
