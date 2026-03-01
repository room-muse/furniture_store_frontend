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
const products = [
  {
    id: 1,
    name: "Cozy Swivel Chair",
    price: 299,
    category: "chair",
    image: "images/p1.png",
    description: "A cozy swivel chair for comfortable seating with a smooth 360-degree turn.",
  },
  {
    id: 2,
    name: "Ethan Sofa",
    price: 599,
    category: "sofa",
    image: "images/p2.png",
    description: "The Ethan Sofa combines classic style with modern comfort for your living space.",
  },
  {
    id: 3,
    name: "Calla Solid Wood Coffee Table",
    price: 349,
    category: "table",
    image: "images/p3.png",
    description: "A solid wood coffee table with clean lines and durable construction.",
  },
  {
    id: 4,
    name: "Stowe Solid Wood Side Table",
    price: 199,
    category: "table",
    image: "images/p4.png",
    description: "A versatile solid wood side table ideal next to sofas or beds.",
  },
  {
    id: 5,
    name: "Mid-Century Bookshelf w/ Drawer",
    price: 429,
    category: "bookcase",
    image: "images/p5.png",
    description: "A mid-century bookshelf with an integrated drawer for extra storage.",
  },
  {
    id: 6,
    name: "Willow Round Coffee Table",
    price: 279,
    category: "table",
    image: "images/p6.png",
    description: "A round coffee table with a willow-inspired design for a natural look.",
  },
  {
    id: 7,
    name: "Ellington Oval Pedestal Dining Table",
    price: 799,
    category: "table",
    image: "images/p7.png",
    description: "An oval pedestal dining table, perfect for family meals and entertaining.",
  },
  {
    id: 8,
    name: "Stuart Sling Chair",
    price: 249,
    category: "chair",
    image: "images/p8.png",
    description: "A sleek sling chair with a relaxed profile for indoor or outdoor use.",
  },
];

// ========== Generate Category Filters ========== //
(function generateCategoryFilters() {
  const categories = [...new Set(products.map((p) => p.category))];
  const container = document.getElementById("category-filters");
  categories.forEach((category) => {
    const label = document.createElement("label");
    label.innerHTML = `
            <input type="checkbox" class="category-filter" value="${category}">
            ${category}
        `;
    container.appendChild(label);
  });
})();

// ========== Filter Sidebar Toggle ========== //
const toggleBtn = document.getElementById("filter-toggle");
const filterSidebar = document.getElementById("filter-sidebar");
const closeBtn = document.getElementById("close-filter");

toggleBtn.addEventListener("click", () => {
  filterSidebar.classList.add("open");
});

closeBtn.addEventListener("click", () => {
  filterSidebar.classList.remove("open");
});

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
            <p>Price: $${product.price}</p>
            <button onclick="addToCart(${product.id})" class="add-to-cart btn-primary">Add to Cart</button>
            <div class="product-actions">
                <button class="view-product btn-primary" data-id="${product.id}">View</button>
                <button class="view-ar btn-ar" data-id="${product.id}">3D/AR</button>
            </div>
        `;
    container.appendChild(item);
  });
}

function attachViewButtons() {
  document.querySelectorAll(".view-product").forEach((button) => {
    button.addEventListener("click", (e) => {
      openProductModal(parseInt(e.target.getAttribute("data-id")));
    });
  });
  document.querySelectorAll(".view-ar").forEach((button) => {
    button.addEventListener("click", (e) => {
      openArView(parseInt(e.target.getAttribute("data-id")));
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
  document.getElementById("modal-product-price").textContent =
    `$${product.price}`;
  document.getElementById("modal-product-image").src = product.image;
  document.getElementById("modal-product-description").textContent =
    product.description;
  document
    .getElementById("modal-add-to-cart")
    .setAttribute("data-id", product.id);
  const modalArBtn = document.getElementById("modal-view-ar");
  if (modalArBtn) modalArBtn.setAttribute("data-id", product.id);
  document.getElementById("product-modal").style.display = "flex";
}

document.getElementById("modal-add-to-cart").addEventListener("click", (e) => {
  addToCart(parseInt(e.target.getAttribute("data-id")));
  document.getElementById("product-modal").style.display = "none";
});

const modalViewAr = document.getElementById("modal-view-ar");
if (modalViewAr) {
  modalViewAr.addEventListener("click", (e) => {
    openArView(parseInt(e.target.getAttribute("data-id")));
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
                <button onclick="confirmRemove(${item.id}, '${item.name}')"><i class="fa-solid fa-xmark"></i></button>
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
