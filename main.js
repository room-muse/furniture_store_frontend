var API_KEYS = {
  "mock-site-1": "fsk_live_a990fdc1c4a4fc3cca1c2f2211ce67aa35c35981cd3c8776",
  "ystore": "fsk_live_3a811f4e724762f63f1d6783229f8c2b8951d17c3bc08386",
  "weisshouse": "fsk_live_12b7cd339b123b8177fd9c0be06a959906d8874bff5fb72e",
  "amish-yard": "fsk_live_035dd435cd91db2b7d14cab9604fd1f82716d562d1822e1f",
  "woodville-furniture": "fsk_live_bfec0c09b9c11281e326d4dfbf891176ae65e72433da0ca3",
  "contemporary-concepts": "fsk_live_4a53eb434f174b8c7a989c9edfe1bd79760403cd350c18bd",
  "perlora-furniture": "fsk_live_2e68df8d13408fa5c46e790e79dde88b2b0587d19840f597",
  "todays-home": "fsk_live_3271a84fded0bdb154cd6baecfea6cb707386e8378ffea1e",
  "shepards-furniture": "fsk_live_0cd83f72f76a7b7feaf9ee35ca74a4a1441b0fb55d0693ab",
  "wolfs-furniture": "fsk_live_08a6b64bf08ad4095b967378ebf364baae8d788d547aeeea",
  "arhaus": "fsk_live_24f2ea89a5ae96454e3d6c0e7ed39e76e589128265f604ec",
  "levin": "fsk_live_5cec91372060607ae6cbb8b5a0ff24d16db35aece5bf2c36",
  "sixpenny": "fsk_live_ee630b17406625d356128882906cdc569a4c1a45aa764c72",
  "bd-home": "fsk_live_f66bae9b0102876cbea1a1240d5d42277c7567f0c18916d8",
};

(function loadSDK() {
  var company = new URLSearchParams(window.location.search).get("company") || "mock-site-1";
  var apiKey = API_KEYS[company] || API_KEYS["mock-site-1"];
  var s = document.createElement("script");
  s.src = "https://room-muse.github.io/ar-sdk/sdk.js";
  s.setAttribute("data-api-key", apiKey);
  document.head.appendChild(s);
})();

// ========== Menu Toggle ========== //
(function initMenuToggle() {
  const menuToggle = document.getElementById("menu-toggle");
  const navMenu = document.getElementById("nav-links");
  const navLinks = document.querySelectorAll(".nav-link");

  menuToggle.addEventListener("click", () => {
    navMenu.classList.toggle("active");
    menuToggle.innerHTML = navMenu.classList.contains("active")
      ? '<i class="fa-solid fa-xmark"></i>'
      : '<i class="fa-solid fa-bars"></i>';
  });

  navLinks.forEach((link) => {
    link.addEventListener("click", () => {
      navMenu.classList.remove("active");
      menuToggle.innerHTML = '<i class="fa-solid fa-bars"></i>';
    });
  });
})();

// ========== Hero Image Slider ========== //

(function initHeroSlider() {
  const heroSection = document.querySelector(".hero");
  // Array of image URLs for the background slider
  const images = [
    "images/b6.jpg",
    "images/b2.jpg",
    "images/b4.jpg",
    "images/b1.jpg",
    "images/b5.jpg",
    "images/b3.jpg",
    "images/b7.jpg",
    // Add more image URLs as needed
  ];
  let currentSlide = 0;
  const totalSlides = images.length;
  const intervalMs = 5000;

  function showSlide(index) {
    heroSection.style.background = `url('${images[index]}') no-repeat bottom center/cover`;
  }
  function nextSlide() {
    currentSlide = (currentSlide + 1) % totalSlides;
    showSlide(currentSlide);
  }
  function prevSlide() {
    currentSlide = (currentSlide - 1 + totalSlides) % totalSlides;
    showSlide(currentSlide);
  }

  // Optional: If you have next/prev buttons, wire them up
  const nextBtn = document.getElementById("next-slide");
  const prevBtn = document.getElementById("prev-slide");
  if (nextBtn)
    nextBtn.addEventListener("click", () => {
      nextSlide();
      resetInterval();
    });
  if (prevBtn)
    prevBtn.addEventListener("click", () => {
      prevSlide();
      resetInterval();
    });

  showSlide(currentSlide);

  // Auto-slide every 5 minutes
  let sliderInterval = setInterval(nextSlide, intervalMs);

  // Reset interval on manual navigation
  function resetInterval() {
    clearInterval(sliderInterval);
    sliderInterval = setInterval(nextSlide, intervalMs);
  }
})();

// ========== Product Data ========== //
const products = [];

// ========== Generate Category Filters ========== //
function generateCategoryFilters() {
  const container = document.getElementById("category-filters");
  if (!container) return;
  container.innerHTML = "";
  const categories = [
    ...new Set(
      products.map((p) => p.category).filter((c) => c != null && c !== ""),
    ),
  ];
  categories.forEach((category) => {
    const label = document.createElement("label");
    label.innerHTML = `
            <input type="checkbox" class="category-filter" value="${category}">
            ${category}
        `;
    container.appendChild(label);
  });
}

generateCategoryFilters();

// ========== Filter Sidebar Toggle ========== //
const toggleBtn = document.getElementById("filter-toggle");
const filterSidebar = document.getElementById("filter-sidebar");
const closeBtn = document.getElementById("close-filter");

if (toggleBtn && filterSidebar) {
  toggleBtn.addEventListener("click", () => {
    filterSidebar.classList.add("open");
  });
}

if (closeBtn && filterSidebar) {
  closeBtn.addEventListener("click", () => {
    filterSidebar.classList.remove("open");
  });
}

// ========== Product Rendering ========== //
function renderProducts(list) {
  const container = document.getElementById("product-list");
  container.innerHTML = "";
  list.forEach((product) => {
    const item = document.createElement("div");
    item.className = "product-card";
    item.innerHTML = `
            <img src="${product.image}" alt="${product.name}" class="product-image" title="${product.name}">
            <h3 class="product-name">${product.name}</h3>
            <button onclick="addToCart('${product.id}')" class="add-to-cart btn-primary">Add to Cart</button>
            <div class="product-actions">
                <button class="view-product btn-primary" data-id="${product.id}">View</button>
                <button class="view-ar btn-ar" data-rm-id="${product.id}">3D/AR</button>
            </div>
        `;
    container.appendChild(item);
  });
}

function attachViewButtons() {
  document.querySelectorAll(".view-product").forEach((button) => {
    button.addEventListener("click", (e) => {
      openProductModal(e.target.getAttribute("data-id"));
    });
  });
  document.querySelectorAll(".view-ar").forEach((button) => {
    button.addEventListener("click", (e) => {
      openArView(e.target.getAttribute("data-id"));
    });
  });
}

// ========== Pagination ========== //
let currentProductList = [...products];
let currentPage = 1;
const itemsPerPage = 8;

function renderPagination(totalItems, itemsPerPage) {
  const paginationContainer = document.getElementById("pagination");
  paginationContainer.innerHTML = "";

  const totalPages = Math.ceil(totalItems / itemsPerPage);
  for (let i = 1; i <= totalPages; i++) {
    const pageButton = document.createElement("button");
    pageButton.textContent = i;
    pageButton.className = "page-button";
    if (i === currentPage) {
      pageButton.classList.add("active-page");
    }
    pageButton.addEventListener("click", () => {
      loadPage(i, itemsPerPage, currentProductList);
    });
    paginationContainer.appendChild(pageButton);
  }
}

// ========== Load Page Function ========== //
function loadPage(pageNumber, itemsPerPage, productList = currentProductList) {
  currentPage = pageNumber;
  const start = (pageNumber - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  const paginatedProducts = productList.slice(start, end);
  renderProducts(paginatedProducts);
  attachViewButtons();
  renderPagination(productList.length, itemsPerPage);
}

// ========== Product Modal ========== //
function openProductModal(productId) {
  const product = products.find((p) => p.id === productId);
  if (!product) return;

  document.getElementById("modal-product-title").textContent = product.name;
  document.getElementById("modal-product-image").src = product.image;
  document.getElementById("modal-product-description").textContent =
    product.description;
  document
    .getElementById("modal-add-to-cart")
    .setAttribute("data-id", product.id);
  const modalArBtn = document.getElementById("modal-view-ar");
  if (modalArBtn) modalArBtn.setAttribute("data-rm-id", product.id);
  document.getElementById("product-modal").style.display = "flex";
}

document.getElementById("modal-add-to-cart").addEventListener("click", (e) => {
  addToCart(e.target.getAttribute("data-id"));
  document.getElementById("product-modal").style.display = "none";
});

const modalViewAr = document.getElementById("modal-view-ar");
if (modalViewAr) {
  modalViewAr.addEventListener("click", (e) => {
    openArView(e.target.getAttribute("data-id"));
  });
}

document.querySelectorAll(".close-product-modal").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.getElementById("product-modal").style.display = "none";
  });
});

// ========== 3D/AR View ========== //
function openArView(productId) {
  const product = products.find((p) => p.id === productId);
  if (!product) return;
  // Placeholder: show message. Replace with your 3D/AR viewer (e.g. model-viewer, AR link).
  showAlert(
    `3D/AR view for ${product.name} — try it on a device with AR support!`,
  );
}

// ========== Search Functionality ========== //
(function initSearch() {
  const input = document.getElementById("search-input");
  const container = input.parentElement;
  let timeout;

  const clearBtn = document.createElement("button");
  clearBtn.textContent = "Clear";
  clearBtn.className = "clear-search-btn";
  clearBtn.style.display = "none";
  container.appendChild(clearBtn);

  input.addEventListener("input", () => {
    clearTimeout(timeout);
    clearBtn.style.display = input.value ? "inline-block" : "none";
    timeout = setTimeout(() => {
      const term = input.value.toLowerCase();
      currentProductList = products.filter(
        (p) =>
          p.name.toLowerCase().includes(term) ||
          p.description.toLowerCase().includes(term),
      );

      currentPage = 1; // reset to first page
      if (currentProductList.length === 0) {
        document.getElementById("product-list").innerHTML =
          `<p class="no-results">No products found for <strong>${input.value}</strong>.</p>`;
        document.getElementById("pagination").innerHTML = "";
      } else {
        loadPage(currentPage, itemsPerPage, currentProductList);
      }
    }, 500);
  });

  clearBtn.addEventListener("click", () => {
    input.value = "";
    clearBtn.style.display = "none";
    currentProductList = [...products];
    currentPage = 1;
    loadPage(currentPage, itemsPerPage, currentProductList);
  });
})();

// ========== Filter Functionality ========== //
document.getElementById("apply-filters").addEventListener("click", () => {
  const selectedCategories = Array.from(
    document.querySelectorAll(".category-filter:checked"),
  ).map((cb) => cb.value);
  const minPrice = parseFloat(document.getElementById("min-price").value) || 0;
  const maxPrice =
    parseFloat(document.getElementById("max-price").value) || Infinity;

  filterSidebar.classList.remove("open");
  currentProductList = products.filter((product) => {
    const inCategory =
      selectedCategories.length === 0 ||
      selectedCategories.includes(product.category);
    const inPriceRange = product.price >= minPrice && product.price <= maxPrice;
    return inCategory && inPriceRange;
  });

  currentPage = 1;
  if (currentProductList.length === 0) {
    document.getElementById("product-list").innerHTML =
      '<p class="no-results">No products match your filters.</p>';
    document.getElementById("pagination").innerHTML = "";
  } else {
    loadPage(currentPage, itemsPerPage, currentProductList);
  }
});

// ========== Cart Management ========== //
let cart = [];

// Load cart from localStorage
function loadCart() {
  const stored = localStorage.getItem("cart");
  cart = stored ? JSON.parse(stored) : [];
}

// Save cart to localStorage
function saveCart() {
  localStorage.setItem("cart", JSON.stringify(cart));
}

const alertEl = document.getElementById("alert");
const cartContainer = document.getElementById("cart");
const cartCount = document.getElementById("cart-count");

function addToCart(productId) {
  const product = products.find((p) => p.id === productId);
  if (!product) return;

  cart.push(product);
  saveCart();
  showAlert(`${product.name} added to cart!`);
  updateCartDisplay();
}

function showAlert(message) {
  alertEl.textContent = message;
  alertEl.classList.remove("show-alert");
  alertEl.classList.add("show-alert");
  setTimeout(() => alertEl.classList.remove("show-alert"), 3000);
}

function updateCartDisplay() {
  const cartItems = document.getElementById("cart-items");
  cartItems.innerHTML = "";

  if (cart.length === 0) {
    cartItems.innerHTML = '<p class="cart-empty">Your cart is empty.</p>';
    document.getElementById("cart-total").style.display = "none";
    document.getElementById("checkout-button").style.display = "none";
  } else {
    cart.forEach((item) => {
      const el = document.createElement("div");
      el.className = "cart-item";
      el.innerHTML = `
                <img src="${item.image}" alt="${item.name}" class="cart-item-image">
                <div class="cart-item-details">
                    <h4>${item.name}</h4>
                    <p>Price: $${item.price}</p>
                </div>
                <button onclick="confirmRemove('${item.id}', '${item.name}')"><i class="fa-solid fa-xmark"></i></button>
            `;
      cartItems.appendChild(el);
    });

    const total = cart.reduce((sum, item) => sum + item.price, 0);
    document.getElementById("cart-total").textContent =
      `Total: $${total.toFixed(2)}`;
    document.getElementById("cart-total").style.display = "block";
    document.getElementById("checkout-button").style.display = "block";
  }

  cartCount.textContent = `Cart (${cart.length})`;
}

function confirmRemove(id, name) {
  const modal = document.getElementById("confirm-remove-modal");
  document.getElementById("remove-item-name").textContent = name;
  modal.classList.add("show-modal");

  document.getElementById("confirm-remove-button").onclick = () => {
    const index = cart.findIndex((p) => p.id === id);
    if (index !== -1) cart.splice(index, 1);
    saveCart();
    updateCartDisplay();
    showAlert(`${name} removed from cart!`);
    modal.classList.remove("show-modal");
  };

  ["cancel-remove-button", "close-modal"].forEach((id) => {
    document.getElementById(id).onclick = () =>
      modal.classList.remove("show-modal");
  });
}

// ========== Cart Toggle ========== //
document.getElementById("cart-icon").addEventListener("click", () => {
  cartContainer.classList.toggle("show-cart");
});
document.getElementById("close-cart").addEventListener("click", () => {
  cartContainer.classList.remove("show-cart");
});

// ========== Init App ========== //
document.addEventListener("DOMContentLoaded", () => {
  loadCart();
  currentProductList = [...products];
  currentPage = 1;
  loadPage(currentPage, itemsPerPage, currentProductList);
  updateCartDisplay();
  cartCount.textContent = `Cart (${cart.length})`;
});

document.addEventListener("DOMContentLoaded", () => {
  loadCart();

  var companyId = new URLSearchParams(window.location.search).get("company");

  if (companyId) {
    var fetchCompanyId = "demo-" + companyId;
    fetch("https://ar-backend-563656133641.us-central1.run.app/items?company_id=" + encodeURIComponent(fetchCompanyId))
      .then(function(r) { return r.json(); })
      .then(function(items) {
        currentProductList = items.map(function(item) {
          return {
            id: item.productId,
            name: item.name,
            price: 0,
            category: item.category,
            image: item.imageUrl,
            description: "",
          };
        });
        products.length = 0;
        currentProductList.forEach(function(p) { products.push(p); });
        generateCategoryFilters();
        loadPage(1, itemsPerPage, currentProductList);
      });
  } else {
    currentProductList = [...products];
    loadPage(1, itemsPerPage, currentProductList);
  }

  updateCartDisplay();
  cartCount.textContent = `Cart (${cart.length})`;
});

// ========== Scroll to Top Button ========== //
document.body.insertAdjacentHTML(
  "beforeend",
  '<div class="scroll-to-top"><i class="fa-solid fa-arrow-up"></i></div>',
);
const scrollToTopBtn = document.querySelector(".scroll-to-top");
window.addEventListener("scroll", () => {
  if (window.scrollY > 300) {
    scrollToTopBtn.classList.add("show");
  } else {
    scrollToTopBtn.classList.remove("show");
  }

  scrollToTopBtn.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
});
