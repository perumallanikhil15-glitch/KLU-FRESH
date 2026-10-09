
const PRODUCTS = [
  { id: 1,  name: "Fresh Tomatoes",   category: "Fruits & Vegetables", qty: "1 kg",   price: 45,  original: 60,  rating: 4.5, emoji: "🍅", stock: 20 },
  { id: 2,  name: "Potatoes",         category: "Fruits & Vegetables", qty: "1 kg",   price: 30,  original: 35,  rating: 4.2, emoji: "🥔", stock: 3  },
  { id: 3,  name: "Bananas",          category: "Fruits & Vegetables", qty: "1 dozen",price: 50,  original: 60,  rating: 4.6, emoji: "🍌", stock: 15 },
  { id: 4,  name: "Apples",           category: "Fruits & Vegetables", qty: "1 kg",   price: 160, original: 200, rating: 4.7, emoji: "🍎", stock: 10 },
  { id: 5,  name: "Broccoli",         category: "Fruits & Vegetables", qty: "500 g",  price: 55,  original: 70,  rating: 4.1, emoji: "🥦", stock: 0  },
  { id: 6,  name: "Toned Milk",       category: "Dairy",               qty: "1 L",    price: 58,  original: 62,  rating: 4.6, emoji: "🥛", stock: 25 },
  { id: 7,  name: "Farm Eggs",        category: "Dairy",               qty: "6 pcs",  price: 48,  original: 55,  rating: 4.5, emoji: "🥚", stock: 12 },
  { id: 8,  name: "Paneer",           category: "Dairy",               qty: "200 g",  price: 85,  original: 100, rating: 4.4, emoji: "🧀", stock: 2  },
  { id: 9,  name: "Brown Bread",      category: "Staples",             qty: "400 g",  price: 42,  original: 50,  rating: 4.3, emoji: "🍞", stock: 18 },
  { id: 10, name: "Basmati Rice",     category: "Staples",             qty: "5 kg",   price: 425, original: 500, rating: 4.7, emoji: "🍚", stock: 8  },
  { id: 11, name: "Cooking Oil",      category: "Staples",             qty: "1 L",    price: 145, original: 165, rating: 4.3, emoji: "🫙", stock: 14 },
  { id: 12, name: "Digestive Biscuits", category: "Snacks",            qty: "250 g",  price: 35,  original: 40,  rating: 4.4, emoji: "🍪", stock: 30 },
  { id: 13, name: "Potato Chips",     category: "Snacks",              qty: "150 g",  price: 30,  original: 35,  rating: 4.2, emoji: "🍟", stock: 22 },
  { id: 14, name: "Orange Juice",     category: "Beverages",           qty: "1 L",    price: 110, original: 130, rating: 4.5, emoji: "🧃", stock: 9  },
  { id: 15, name: "Herbal Shampoo",   category: "Personal Care",       qty: "340 ml", price: 210, original: 250, rating: 4.6, emoji: "🧴", stock: 6  },
  { id: 16, name: "Laundry Detergent", category: "Household",          qty: "1 kg",   price: 135, original: 160, rating: 4.3, emoji: "🧺", stock: 11 },
  { id: 17, name: "Chicken Breast",   category: "Protein",             qty: "500 g",  price: 250, original: 300, rating: 4.5, emoji: "🍗", stock: 7  },
  { id: 18, name: "Protein Powder",   category: "Protein",             qty: "1 kg",   price: 1035, original: 160, rating: 4.3, emoji: "🧺", stock: 11 },
  { id: 19, name: "Whey Protein",     category: "Protein",             qty: "1 kg",   price: 1135, original: 160, rating: 4.3, image: "Images/Whey Protein.jpg", stock: 11 },  
];

const CATEGORY_ICONS = {
  "Fruits & Vegetables": "🥦",
  "Dairy": "🥛",
  "Snacks": "🍪",
  "Beverages": "🥤",
  "Staples": "🍚",
  "Personal Care": "🧴",
  "Household": "🧹",
  "Protein": "🥩",
};

const COUPONS = { "KLU10": 0.10 }; // coupon code -> discount percentage

/* ---------------------------------------------------------
   2. APP STATE
--------------------------------------------------------- */
let cart = [];              // [{ id, qty }]
let wishlist = [];          // [id, id, ...]
let activeCategory = "all";
let activeSort = "default";
let searchTerm = "";
let appliedCoupon = 0;      // 0, or 0.10 for 10% etc
let selectedSlot = null;

/* ---------------------------------------------------------
   3. HELPERS
--------------------------------------------------------- */
const CART_STORAGE_KEY = "grocery_cart";

// Persist the cart so a page refresh doesn't empty it.
// This integrates into the existing cart array instead of
// creating a separate/duplicate cart system.
function saveCart() {
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  } catch (err) {
    console.warn("Could not save cart to localStorage", err);
  }
}

function loadCart() {
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      // keep only entries that still reference a real product
      cart = parsed.filter(item => item && findProduct(item.id));
    }
  } catch (err) {
    console.warn("Could not load cart from localStorage, starting fresh", err);
    cart = [];
  }
}

function formatPrice(n) { return "₹" + Math.round(n); }

function findProduct(id) { return PRODUCTS.find(p => p.id === id); }

function stockInfo(stock) {
  if (stock === 0) return { label: "Out of Stock", cls: "stock-out" };
  if (stock <= 3) return { label: `Only ${stock} left`, cls: "stock-low" };
  return { label: "In Stock", cls: "stock-in" };
}

function starString(rating) {
  const full = Math.round(rating);
  return "★".repeat(full) + "☆".repeat(5 - full) + ` (${rating})`;
}

// Shows a small toast message at the top of the screen for 2 seconds
function showToast(message) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(showToast._timer);
  showToast._timer = setTimeout(() => toast.classList.remove("show"), 2000);
}

/* ---------------------------------------------------------
   4. RENDER: CATEGORY CARDS
--------------------------------------------------------- */
function renderCategories() {
  const grid = document.getElementById("categoryGrid");
  grid.innerHTML = Object.entries(CATEGORY_ICONS).map(([name, icon]) => `
    <div class="category-card" data-category="${name}">
      <span class="cat-emoji">${icon}</span>
      <span class="cat-name">${name}</span>
    </div>
  `).join("");

  // Clicking a category card filters the product list below
  grid.querySelectorAll(".category-card").forEach(card => {
    card.addEventListener("click", () => {
      setActiveCategory(card.dataset.category);
      document.getElementById("productsSection").scrollIntoView({ behavior: "smooth" });
    });
  });
}

/* ---------------------------------------------------------
   5. RENDER: PRODUCT GRID (applies search + filter + sort)
--------------------------------------------------------- */
function getVisibleProducts() {
  let list = [...PRODUCTS];

  // filter by category
  if (activeCategory !== "all") {
    list = list.filter(p => p.category === activeCategory);
  }

  // filter by search term (matches product name)
  if (searchTerm.trim() !== "") {
    const term = searchTerm.trim().toLowerCase();
    list = list.filter(p => p.name.toLowerCase().includes(term));
  }

  // sort
  if (activeSort === "price-low") list.sort((a, b) => a.price - b.price);
  else if (activeSort === "price-high") list.sort((a, b) => b.price - a.price);
  else if (activeSort === "rating") list.sort((a, b) => b.rating - a.rating);
  else if (activeSort === "discount") {
    list.sort((a, b) => discountPercent(b) - discountPercent(a));
  }

  return list;
}

function discountPercent(p) {
  return Math.round(((p.original - p.price) / p.original) * 100);
}

function renderProducts() {
  const grid = document.getElementById("productGrid");
  const noResults = document.getElementById("noResults");
  const resultsCount = document.getElementById("resultsCount");
  const list = getVisibleProducts();

  resultsCount.textContent = `${list.length} product${list.length !== 1 ? "s" : ""}`;

  if (list.length === 0) {
    grid.innerHTML = "";
    noResults.style.display = "block";
    return;
  }
  noResults.style.display = "none";

  grid.innerHTML = list.map(p => {
    const stock = stockInfo(p.stock);
    const isWished = wishlist.includes(p.id);
    const discount = discountPercent(p);
    return `
      <div class="product-card">
       <div class="product-image">
          ${p.image 
           ? `<img src="${p.image}" alt="${p.name}" class="product-img">`
          : `<span class="product-emoji">${p.emoji}</span>`
                 }
             <span class="discount-sticker">-${discount}%</span>
        </div> 
        <button class="wishlist-toggle" data-id="${p.id}" title="Add to wishlist">
          ${isWished ? "❤️" : "🤍"}
        </button>
        <div class="product-category">${p.category}</div>
        <div class="product-name">${p.name}</div>
        <div class="product-qty">${p.qty}</div>
        <div class="product-rating">${starString(p.rating)}</div>
        <div class="product-stock ${stock.cls}">${stock.label}</div>
        <div class="price-row">
          <span class="price-current">${formatPrice(p.price)}</span>
          <span class="price-original">${formatPrice(p.original)}</span>
        </div>
        <button class="add-cart-btn" data-id="${p.id}" ${p.stock === 0 ? "disabled" : ""}>
          ${p.stock === 0 ? "Out of Stock" : "Add to Cart"}
        </button>
      </div>
    `;
  }).join("");

  // wire up "Add to Cart" buttons
  grid.querySelectorAll(".add-cart-btn").forEach(btn => {
    if (!btn.disabled) {
      btn.addEventListener("click", () => addToCart(Number(btn.dataset.id)));
    }
  });

  // wire up wishlist hearts
  grid.querySelectorAll(".wishlist-toggle").forEach(btn => {
    btn.addEventListener("click", () => toggleWishlist(Number(btn.dataset.id)));
  });
}

function setActiveCategory(category) {
  activeCategory = category;
  document.getElementById("filterCategory").value = category;
  document.querySelectorAll(".nav-pill").forEach(pill => {
    pill.classList.toggle("active", pill.dataset.category === category);
  });
  renderProducts();
}

/* ---------------------------------------------------------
   6. WISHLIST
--------------------------------------------------------- */
function toggleWishlist(id) {
  const index = wishlist.indexOf(id);
  if (index === -1) {
    wishlist.push(id);
    showToast("❤️ Added to wishlist");
  } else {
    wishlist.splice(index, 1);
    showToast("Removed from wishlist");
  }
  updateWishlistCount();
  renderProducts();
  renderWishlistPanel();
}

function updateWishlistCount() {
  document.getElementById("wishlistCount").textContent = wishlist.length;
  document.getElementById("wishlistIcon").textContent = wishlist.length > 0 ? "❤️" : "🤍";
}

function renderWishlistPanel() {
  const container = document.getElementById("wishlistItems");
  if (wishlist.length === 0) {
    container.innerHTML = `<p class="empty-cart">Your wishlist is empty 🤍</p>`;
    return;
  }
  container.innerHTML = wishlist.map(id => {
    const p = findProduct(id);
    return `
      <div class="cart-item">
        <div class="cart-item-emoji">${p.emoji}</div>
        <div class="cart-item-info">
          <div class="cart-item-name">${p.name}</div>
          <div class="cart-item-price">${formatPrice(p.price)}</div>
        </div>
        <button class="cart-item-remove" data-id="${p.id}">Remove</button>
      </div>
    `;
  }).join("");

  container.querySelectorAll(".cart-item-remove").forEach(btn => {
    btn.addEventListener("click", () => toggleWishlist(Number(btn.dataset.id)));
  });
}

/* ---------------------------------------------------------
   7. CART
--------------------------------------------------------- */
function addToCart(id) {
  const existing = cart.find(item => item.id === id);
  const product = findProduct(id);

  const currentQtyInCart = existing ? existing.qty : 0;
  if (currentQtyInCart >= product.stock) {
    showToast("No more stock available");
    return;
  }

  if (existing) existing.qty += 1;
  else cart.push({ id, qty: 1 });

  showToast("✓ Added to cart");
  updateCartCount();
  renderCart();
  saveCart();
}

function changeQty(id, delta) {
  const item = cart.find(i => i.id === id);
  if (!item) return;
  const product = findProduct(id);

  item.qty += delta;

  if (item.qty <= 0) {
    cart = cart.filter(i => i.id !== id);
  } else if (item.qty > product.stock) {
    item.qty = product.stock; // cannot exceed stock
    showToast("Reached maximum stock");
  }

  updateCartCount();
  renderCart();
  saveCart();
}

function removeFromCart(id) {
  cart = cart.filter(i => i.id !== id);
  updateCartCount();
  renderCart();
  saveCart();
}

function updateCartCount() {
  const totalItems = cart.reduce((sum, item) => sum + item.qty, 0);
  document.getElementById("cartCount").textContent = totalItems;
}

function cartSubtotal() {
  return cart.reduce((sum, item) => sum + findProduct(item.id).price * item.qty, 0);
}

function renderCart() {
  const container = document.getElementById("cartItems");

  if (cart.length === 0) {
    container.innerHTML = `<p class="empty-cart">Your cart is empty 🛒<br>Add some fresh groceries!</p>`;
  } else {
    container.innerHTML = cart.map(item => {
      const p = findProduct(item.id);
      return `
        <div class="cart-item">
          <div class="cart-item-emoji">${p.emoji}</div>
          <div class="cart-item-info">
            <div class="cart-item-name">${p.name}</div>
            <div class="cart-item-price">${formatPrice(p.price * item.qty)}</div>
            <div class="cart-item-qty">
              <button class="qty-btn" data-id="${p.id}" data-delta="-1">−</button>
              <span>${item.qty}</span>
              <button class="qty-btn" data-id="${p.id}" data-delta="1">+</button>
              <button class="cart-item-remove" data-id="${p.id}">Remove</button>
            </div>
          </div>
        </div>
      `;
    }).join("");

    container.querySelectorAll(".qty-btn").forEach(btn => {
      btn.addEventListener("click", () => changeQty(Number(btn.dataset.id), Number(btn.dataset.delta)));
    });
    container.querySelectorAll(".cart-item-remove").forEach(btn => {
      btn.addEventListener("click", () => removeFromCart(Number(btn.dataset.id)));
    });
  }

  updateSummary();
}

function updateSummary() {
  const subtotal = cartSubtotal();
  const discount = subtotal * appliedCoupon;
  const delivery = 0; // FREE delivery for the demo
  const total = subtotal - discount + delivery;

  document.getElementById("sumSubtotal").textContent = formatPrice(subtotal);
  document.getElementById("sumDiscount").textContent = "-" + formatPrice(discount);
  document.getElementById("sumDelivery").textContent = delivery === 0 ? "FREE" : formatPrice(delivery);
  document.getElementById("sumTotal").textContent = formatPrice(total);

  return total;
}

/* ---------------------------------------------------------
   8. COUPON
--------------------------------------------------------- */
function applyCoupon() {
  const code = document.getElementById("couponInput").value.trim().toUpperCase();
  const msg = document.getElementById("couponMsg");

  if (COUPONS[code]) {
    appliedCoupon = COUPONS[code];
    msg.textContent = "Coupon applied successfully! 🎉";
    msg.style.color = "var(--mid-green)";
    showToast("✓ Coupon applied");
  } else {
    appliedCoupon = 0;
    msg.textContent = "Invalid coupon code";
    msg.style.color = "var(--danger)";
  }
  updateSummary();
}

/* ---------------------------------------------------------
   9. CART SIDEBAR / WISHLIST PANEL OPEN-CLOSE
--------------------------------------------------------- */
function openCart() {
  if (cart.length === 0) { showToast("Your cart is empty"); }
  document.getElementById("cartSidebar").classList.add("open");
  document.getElementById("cartOverlay").classList.add("active");
}
function closeCart() {
  document.getElementById("cartSidebar").classList.remove("open");
  document.getElementById("cartOverlay").classList.remove("active");
}
function openWishlist() {
  renderWishlistPanel();
  document.getElementById("wishlistSidebar").classList.add("open");
  document.getElementById("wishlistOverlay").classList.add("active");
}
function closeWishlist() {
  document.getElementById("wishlistSidebar").classList.remove("open");
  document.getElementById("wishlistOverlay").classList.remove("active");
}

/* ---------------------------------------------------------
   10. CHECKOUT MODAL
--------------------------------------------------------- */
function openCheckout() {
  if (cart.length === 0) {
    showToast("Add items to cart first");
    return;
  }
  closeCart();
  document.getElementById("checkoutTotal").innerHTML =
    `<span>Amount Payable</span><span>${formatPrice(updateSummary_return())}</span>`;
  document.getElementById("checkoutModal").classList.add("open");
  document.getElementById("checkoutOverlay").classList.add("active");
}

// small wrapper so checkout total always matches the live cart summary
function updateSummary_return() { return updateSummary(); }

function closeCheckout() {
  document.getElementById("checkoutModal").classList.remove("open");
  document.getElementById("checkoutOverlay").classList.remove("active");
}

function selectSlot(btn) {
  document.querySelectorAll(".slot-btn").forEach(b => b.classList.remove("selected"));
  btn.classList.add("selected");
  selectedSlot = btn.dataset.slot;
}

function placeOrder() {
  const name = document.getElementById("custName").value.trim();
  const address = document.getElementById("custAddress").value.trim();

  if (!name || !address) {
    showToast("Please fill in name and address");
    return;
  }
  if (!selectedSlot) {
    showToast("Please choose a delivery slot");
    return;
  }

  // generate a simple random order id
  const orderId = "KLF2026" + Math.floor(1000 + Math.random() * 9000);
  document.getElementById("orderId").textContent = orderId;
  document.getElementById("orderSlot").textContent = selectedSlot;

  closeCheckout();
  document.getElementById("successModal").classList.add("open");
  document.getElementById("successOverlay").classList.add("active");

  showToast("✓ Order placed successfully");

  // clear the cart after a successful order
  cart = [];
  appliedCoupon = 0;
  selectedSlot = null;
  document.getElementById("couponMsg").textContent = "";
  updateCartCount();
  renderCart();
  saveCart();
}

function closeSuccess() {
  document.getElementById("successModal").classList.remove("open");
  document.getElementById("successOverlay").classList.remove("active");
  renderProducts(); // stock indicators / cart state may have changed
}

/* ---------------------------------------------------------
   10.5 AUTH UI
   Talks only to the functions exposed by auth.js
   (registerUser, loginUser, logoutUser, getCurrentUser,
   isAuthenticated) — never touches localStorage directly.
--------------------------------------------------------- */
function openLoginModal() {
  closeSignupModal();
  document.getElementById("loginError").classList.remove("show");
  document.getElementById("loginModal").classList.add("open");
  document.getElementById("loginOverlay").classList.add("active");
}
function closeLoginModal() {
  document.getElementById("loginModal").classList.remove("open");
  document.getElementById("loginOverlay").classList.remove("active");
  document.getElementById("loginEmail").value = "";
  document.getElementById("loginPassword").value = "";
}

function openSignupModal() {
  closeLoginModal();
  document.getElementById("signupError").classList.remove("show");
  document.getElementById("signupModal").classList.add("open");
  document.getElementById("signupOverlay").classList.add("active");
}
function closeSignupModal() {
  document.getElementById("signupModal").classList.remove("open");
  document.getElementById("signupOverlay").classList.remove("active");
  document.getElementById("signupName").value = "";
  document.getElementById("signupEmail").value = "";
  document.getElementById("signupPassword").value = "";
  document.getElementById("signupConfirmPassword").value = "";
}

function showAuthError(elId, message) {
  const el = document.getElementById(elId);
  el.textContent = message;
  el.classList.add("show");
}

function closeUserDropdown() {
  document.getElementById("userDropdown").classList.remove("open");
}

// Reflects the current auth state (from auth.js) into the header UI.
function updateAuthUI() {
  const user = getCurrentUser();
  const guestEl = document.getElementById("authGuest");
  const userEl = document.getElementById("authUser");

  if (user) {
    guestEl.style.display = "none";
    userEl.style.display = "block";
    document.getElementById("userNameLabel").textContent = user.name.split(" ")[0];
    document.getElementById("dropdownName").textContent = user.name;
    document.getElementById("dropdownEmail").textContent = user.email;
  } else {
    guestEl.style.display = "flex";
    userEl.style.display = "none";
    closeUserDropdown();
  }
}

function handleSignupSubmit() {
  const result = registerUser({
    name: document.getElementById("signupName").value,
    email: document.getElementById("signupEmail").value,
    password: document.getElementById("signupPassword").value,
    confirmPassword: document.getElementById("signupConfirmPassword").value,
  });

  if (!result.success) {
    showAuthError("signupError", result.message);
    return;
  }

  showToast("🎉 Account created — please log in");
  const email = document.getElementById("signupEmail").value.trim();
  closeSignupModal();
  openLoginModal();
  // convenience: prefill the email the person just registered with
  document.getElementById("loginEmail").value = email;
}

function handleLoginSubmit() {
  const result = loginUser({
    email: document.getElementById("loginEmail").value,
    password: document.getElementById("loginPassword").value,
  });

  if (!result.success) {
    showAuthError("loginError", result.message);
    return;
  }

  closeLoginModal();
  updateAuthUI();
  showToast(result.message); // cart is untouched — it's stored/loaded independently
}

function handleLogout() {
  logoutUser();
  closeUserDropdown();
  updateAuthUI();
  showToast("Logged out. See you soon! 👋");
}

function setupAuthEvents() {
  // open modals
  document.getElementById("loginBtn").addEventListener("click", openLoginModal);
  document.getElementById("signupNavBtn").addEventListener("click", openSignupModal);

  // close modals
  document.getElementById("closeLogin").addEventListener("click", closeLoginModal);
  document.getElementById("loginOverlay").addEventListener("click", closeLoginModal);
  document.getElementById("closeSignup").addEventListener("click", closeSignupModal);
  document.getElementById("signupOverlay").addEventListener("click", closeSignupModal);

  // switch between the two modals
  document.getElementById("switchToSignup").addEventListener("click", (e) => { e.preventDefault(); openSignupModal(); });
  document.getElementById("switchToLogin").addEventListener("click", (e) => { e.preventDefault(); openLoginModal(); });

  // submit
  document.getElementById("signupSubmitBtn").addEventListener("click", handleSignupSubmit);
  document.getElementById("loginSubmitBtn").addEventListener("click", handleLoginSubmit);

  // submit on Enter key
  ["signupName", "signupEmail", "signupPassword", "signupConfirmPassword"].forEach(id => {
    document.getElementById(id).addEventListener("keydown", (e) => { if (e.key === "Enter") handleSignupSubmit(); });
  });
  ["loginEmail", "loginPassword"].forEach(id => {
    document.getElementById(id).addEventListener("keydown", (e) => { if (e.key === "Enter") handleLoginSubmit(); });
  });

  // user dropdown menu
  const dropdown = document.getElementById("userDropdown");
  document.getElementById("userMenuTrigger").addEventListener("click", (e) => {
    e.stopPropagation();
    dropdown.classList.toggle("open");
  });
  document.addEventListener("click", (e) => {
    if (!document.getElementById("authUser").contains(e.target)) closeUserDropdown();
  });

  document.getElementById("accountMenuBtn").addEventListener("click", () => {
    const user = getCurrentUser();
    closeUserDropdown();
    showToast(`👤 Signed in as ${user ? user.name : "guest"}`);
  });
  document.getElementById("logoutBtn").addEventListener("click", handleLogout);
}

/* ---------------------------------------------------------
   11. EVENT LISTENERS (wire up all buttons on page load)
--------------------------------------------------------- */
function setupEvents() {
  // search
  document.getElementById("searchInput").addEventListener("input", (e) => {
    searchTerm = e.target.value;
    renderProducts();
  });

  // category nav pills
  document.querySelectorAll(".nav-pill").forEach(pill => {
    pill.addEventListener("click", () => setActiveCategory(pill.dataset.category));
  });

  // filter dropdowns
  document.getElementById("filterCategory").addEventListener("change", (e) => setActiveCategory(e.target.value));
  document.getElementById("sortSelect").addEventListener("change", (e) => {
    activeSort = e.target.value;
    renderProducts();
  });

  // hero buttons
  document.getElementById("shopNowBtn").addEventListener("click", () => {
    document.getElementById("productsSection").scrollIntoView({ behavior: "smooth" });
  });
  document.getElementById("viewDealsBtn").addEventListener("click", () => {
    activeSort = "discount";
    document.getElementById("sortSelect").value = "discount";
    renderProducts();
    document.getElementById("productsSection").scrollIntoView({ behavior: "smooth" });
  });

  // logo -> scroll to top
  document.getElementById("logoHome").addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));

  // header actions
  document.getElementById("cartBtn").addEventListener("click", openCart);
  document.getElementById("closeCart").addEventListener("click", closeCart);
  document.getElementById("cartOverlay").addEventListener("click", closeCart);

  document.getElementById("wishlistBtn").addEventListener("click", openWishlist);
  document.getElementById("closeWishlist").addEventListener("click", closeWishlist);
  document.getElementById("wishlistOverlay").addEventListener("click", closeWishlist);

  document.getElementById("locationBtn").addEventListener("click", () => showToast("📍 Delivering to Vijayawada"));

  // coupon
  document.getElementById("applyCouponBtn").addEventListener("click", applyCoupon);

  // checkout
  document.getElementById("checkoutBtn").addEventListener("click", openCheckout);
  document.getElementById("closeCheckout").addEventListener("click", closeCheckout);
  document.getElementById("checkoutOverlay").addEventListener("click", closeCheckout);

  document.querySelectorAll(".slot-btn").forEach(btn => {
    btn.addEventListener("click", () => selectSlot(btn));
  });

  document.getElementById("placeOrderBtn").addEventListener("click", placeOrder);
  document.getElementById("continueShoppingBtn").addEventListener("click", closeSuccess);
  document.getElementById("successOverlay").addEventListener("click", closeSuccess);

  setupAuthEvents();
}

/* ---------------------------------------------------------
   12. INIT
--------------------------------------------------------- */
function init() {
  loadCart();               // restore cart from localStorage before first render
  renderCategories();
  renderProducts();
  renderCart();
  updateCartCount();
  updateWishlistCount();
  setupEvents();
  updateAuthUI();            // restore login/logout state from localStorage
}

document.addEventListener("DOMContentLoaded", init);
