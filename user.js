/* ===========================================================
   KLU FRESH — CUSTOMER / USER MODULE (user.js)
   -----------------------------------------------------------
   Handles customer shopping flow:
   - Product browsing, category filter, keyword search, sorting
   - Cart drawer, quantity adjustments, coupon discounts
   - Wishlist drawer and item toggling
   - Checkout modal, slot selection, order placement
   - Customer order history & real-time delivery status tracking
   - User authentication modals (User login & Admin login dispatch)
=========================================================== */

/* ---------------------------------------------------------
   1. DEFAULT DATA & STORAGE KEYS
--------------------------------------------------------- */
const DEFAULT_PRODUCTS = [
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
  { id: 18, name: "Protein Powder",   category: "Protein",             qty: "1 kg",   price: 1035, original: 1200, rating: 4.3, emoji: "🥣", stock: 11 },
  { id: 19, name: "Whey Protein",     category: "Protein",             qty: "1 kg",   price: 1135, original: 1400, rating: 4.8, image: "Images/Whey Protein.jpg", stock: 11 },  
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

const COUPONS = { "KLU10": 0.10 };

const STORAGE_KEYS = {
  PRODUCTS: "grocery_products",
  CART: "grocery_cart",
  WISHLIST: "grocery_wishlist",
  ORDERS: "grocery_orders",
};

/* ---------------------------------------------------------
   2. STATE
--------------------------------------------------------- */
let products = [];
let cart = [];              // [{ id, qty }]
let wishlist = [];          // [id, id, ...]
let orders = [];            // [{ id, userId, userName, ... }]
let activeCategory = "all";
let activeSort = "default";
let searchTerm = "";
let appliedCoupon = 0;
let selectedSlot = null;
let loginSelectedRole = "user"; // "user" | "admin"

/* ---------------------------------------------------------
   3. PERSISTENCE HELPERS
--------------------------------------------------------- */
function loadProducts() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
    if (!raw) {
      products = [...DEFAULT_PRODUCTS];
      saveProducts();
      return;
    }
    const parsed = JSON.parse(raw);
    products = Array.isArray(parsed) && parsed.length > 0 ? parsed : [...DEFAULT_PRODUCTS];
  } catch (err) {
    console.warn("Could not load products from localStorage", err);
    products = [...DEFAULT_PRODUCTS];
  }
}

function saveProducts() {
  try {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
  } catch (err) {
    console.warn("Could not save products to localStorage", err);
  }
}

function loadCart() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CART);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      cart = parsed.filter(item => item && findProduct(item.id));
    }
  } catch (err) {
    cart = [];
  }
}

function saveCart() {
  try {
    localStorage.setItem(STORAGE_KEYS.CART, JSON.stringify(cart));
  } catch (err) {
    console.warn("Could not save cart", err);
  }
}

function loadWishlist() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.WISHLIST);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      wishlist = parsed.filter(id => findProduct(id));
    }
  } catch (err) {
    wishlist = [];
  }
}

function saveWishlist() {
  try {
    localStorage.setItem(STORAGE_KEYS.WISHLIST, JSON.stringify(wishlist));
  } catch (err) {
    console.warn("Could not save wishlist", err);
  }
}

function loadOrders() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ORDERS);
    if (!raw) {
      orders = [
        {
          id: "KLF20268831",
          userId: "sample_user",
          customerName: "Rahul Sharma",
          customerEmail: "rahul@example.com",
          phone: "9876543210",
          address: "Flat 402, Green Meadows, Vaddeswaram",
          city: "Vijayawada",
          pincode: "522502",
          slot: "10 AM – 12 PM",
          paymentMethod: "UPI",
          items: [
            { id: 1, name: "Fresh Tomatoes", qty: 2, price: 45, emoji: "🍅" },
            { id: 6, name: "Toned Milk", qty: 1, price: 58, emoji: "🥛" }
          ],
          subtotal: 148,
          discount: 15,
          total: 133,
          status: "Out for Delivery",
          createdAt: new Date(Date.now() - 3600000 * 2).toISOString()
        }
      ];
      saveOrders();
      return;
    }
    const parsed = JSON.parse(raw);
    orders = Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    orders = [];
  }
}

function saveOrders() {
  try {
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
  } catch (err) {
    console.warn("Could not save orders", err);
  }
}

/* ---------------------------------------------------------
   4. GENERAL HELPERS
--------------------------------------------------------- */
function formatPrice(n) { return "₹" + Math.round(n); }
function findProduct(id) { return products.find(p => p.id === Number(id)); }

function stockInfo(stock) {
  if (stock === 0) return { label: "Out of Stock", cls: "stock-out" };
  if (stock <= 3) return { label: `Only ${stock} left`, cls: "stock-low" };
  return { label: "In Stock", cls: "stock-in" };
}

function starString(rating) {
  const full = Math.round(rating || 4.5);
  return "★".repeat(full) + "☆".repeat(5 - full) + ` (${rating || 4.5})`;
}

function discountPercent(p) {
  if (!p.original || p.original <= p.price) return 0;
  return Math.round(((p.original - p.price) / p.original) * 100);
}

function showToast(message) {
  const toast = document.getElementById("toast");
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(showToast._timer);
  showToast._timer = setTimeout(() => toast.classList.remove("show"), 2500);
}

/* ---------------------------------------------------------
   5. PRODUCT LISTING & FILTERING
--------------------------------------------------------- */
function getVisibleProducts() {
  let list = [...products];

  if (activeCategory !== "all") {
    list = list.filter(p => p.category === activeCategory);
  }

  if (searchTerm.trim() !== "") {
    const term = searchTerm.trim().toLowerCase();
    list = list.filter(p => p.name.toLowerCase().includes(term) || p.category.toLowerCase().includes(term));
  }

  if (activeSort === "price-low") list.sort((a, b) => a.price - b.price);
  else if (activeSort === "price-high") list.sort((a, b) => b.price - a.price);
  else if (activeSort === "rating") list.sort((a, b) => (b.rating || 0) - (a.rating || 0));
  else if (activeSort === "discount") list.sort((a, b) => discountPercent(b) - discountPercent(a));

  return list;
}

function renderProducts() {
  const grid = document.getElementById("productGrid");
  const noResults = document.getElementById("noResults");
  const resultsCount = document.getElementById("resultsCount");
  if (!grid) return;

  const list = getVisibleProducts();

  if (resultsCount) resultsCount.textContent = `${list.length} product${list.length !== 1 ? "s" : ""}`;

  if (list.length === 0) {
    grid.innerHTML = "";
    if (noResults) noResults.style.display = "block";
    return;
  }
  if (noResults) noResults.style.display = "none";

  grid.innerHTML = list.map(p => {
    const stock = stockInfo(p.stock);
    const isWished = wishlist.includes(p.id);
    const discount = discountPercent(p);
    return `
      <div class="product-card">
        <div class="product-image">
          ${p.image 
            ? `<img src="${p.image}" alt="${p.name}" class="product-img">`
            : `<span class="product-emoji">${p.emoji || "🛒"}</span>`
          }
          ${discount > 0 ? `<span class="discount-sticker">-${discount}%</span>` : ""}
        </div>
        <button class="wishlist-toggle" data-id="${p.id}" title="Toggle Wishlist">
          ${isWished ? "❤️" : "🤍"}
        </button>
        <div class="product-category">${p.category}</div>
        <div class="product-name">${p.name}</div>
        <div class="product-qty">${p.qty || "1 unit"}</div>
        <div class="product-rating">${starString(p.rating)}</div>
        <div class="product-stock ${stock.cls}">${stock.label}</div>
        <div class="price-row">
          <span class="price-current">${formatPrice(p.price)}</span>
          ${p.original && p.original > p.price ? `<span class="price-original">${formatPrice(p.original)}</span>` : ""}
        </div>
        <button class="add-cart-btn" data-id="${p.id}" ${p.stock === 0 ? "disabled" : ""}>
          ${p.stock === 0 ? "Out of Stock" : "Add to Cart"}
        </button>
      </div>
    `;
  }).join("");

  grid.querySelectorAll(".add-cart-btn").forEach(btn => {
    if (!btn.disabled) {
      btn.addEventListener("click", () => addToCart(Number(btn.dataset.id)));
    }
  });

  grid.querySelectorAll(".wishlist-toggle").forEach(btn => {
    btn.addEventListener("click", () => toggleWishlist(Number(btn.dataset.id)));
  });
}

function setActiveCategory(category) {
  activeCategory = category;
  const filterCatEl = document.getElementById("filterCategory");
  if (filterCatEl) filterCatEl.value = category;
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
  saveWishlist();
  updateWishlistCount();
  renderProducts();
  renderWishlistPanel();
}

function updateWishlistCount() {
  const countEl = document.getElementById("wishlistCount");
  const iconEl = document.getElementById("wishlistIcon");
  if (countEl) countEl.textContent = wishlist.length;
  if (iconEl) iconEl.textContent = wishlist.length > 0 ? "❤️" : "🤍";
}

function renderWishlistPanel() {
  const container = document.getElementById("wishlistItems");
  if (!container) return;
  if (wishlist.length === 0) {
    container.innerHTML = `<p class="empty-cart">Your wishlist is empty 🤍</p>`;
    return;
  }
  container.innerHTML = wishlist.map(id => {
    const p = findProduct(id);
    if (!p) return "";
    return `
      <div class="cart-item">
        <div class="cart-item-emoji">${p.emoji || "🛒"}</div>
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

function openWishlist() {
  renderWishlistPanel();
  document.getElementById("wishlistSidebar")?.classList.add("open");
  document.getElementById("wishlistOverlay")?.classList.add("active");
}

function closeWishlist() {
  document.getElementById("wishlistSidebar")?.classList.remove("open");
  document.getElementById("wishlistOverlay")?.classList.remove("active");
}

/* ---------------------------------------------------------
   7. CART & COUPONS
--------------------------------------------------------- */
function addToCart(id) {
  const product = findProduct(id);
  if (!product) return;
  const existing = cart.find(item => item.id === id);

  const currentQtyInCart = existing ? existing.qty : 0;
  if (currentQtyInCart >= product.stock) {
    showToast("⚠️ Maximum available stock reached");
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
  const product = findProduct(id);
  if (!item || !product) return;

  item.qty += delta;

  if (item.qty <= 0) {
    cart = cart.filter(i => i.id !== id);
  } else if (item.qty > product.stock) {
    item.qty = product.stock;
    showToast("⚠️ Reached maximum available stock");
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
  showToast("Item removed from cart");
}

function updateCartCount() {
  const totalItems = cart.reduce((sum, item) => sum + item.qty, 0);
  const cartCountEl = document.getElementById("cartCount");
  if (cartCountEl) cartCountEl.textContent = totalItems;
}

function cartSubtotal() {
  return cart.reduce((sum, item) => {
    const p = findProduct(item.id);
    return sum + (p ? p.price * item.qty : 0);
  }, 0);
}

function renderCart() {
  const container = document.getElementById("cartItems");
  if (!container) return;

  if (cart.length === 0) {
    container.innerHTML = `<p class="empty-cart">Your cart is empty 🛒<br>Add fresh groceries to start shopping!</p>`;
  } else {
    container.innerHTML = cart.map(item => {
      const p = findProduct(item.id);
      if (!p) return "";
      return `
        <div class="cart-item">
          <div class="cart-item-emoji">${p.emoji || "🛒"}</div>
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
  const delivery = 0;
  const total = subtotal - discount + delivery;

  const subEl = document.getElementById("sumSubtotal");
  const discEl = document.getElementById("sumDiscount");
  const delEl = document.getElementById("sumDelivery");
  const totEl = document.getElementById("sumTotal");

  if (subEl) subEl.textContent = formatPrice(subtotal);
  if (discEl) discEl.textContent = "-" + formatPrice(discount);
  if (delEl) delEl.textContent = delivery === 0 ? "FREE" : formatPrice(delivery);
  if (totEl) totEl.textContent = formatPrice(total);

  return total;
}

function applyCoupon() {
  const input = document.getElementById("couponInput");
  const msg = document.getElementById("couponMsg");
  if (!input || !msg) return;

  const code = input.value.trim().toUpperCase();
  if (COUPONS[code]) {
    appliedCoupon = COUPONS[code];
    msg.textContent = "Coupon KLU10 applied: 10% OFF! 🎉";
    msg.style.color = "var(--mid-green)";
    showToast("✓ Coupon applied successfully");
  } else {
    appliedCoupon = 0;
    msg.textContent = "Invalid coupon code. Try KLU10";
    msg.style.color = "var(--danger)";
  }
  updateSummary();
}

function openCart() {
  if (cart.length === 0) showToast("Your cart is empty");
  document.getElementById("cartSidebar")?.classList.add("open");
  document.getElementById("cartOverlay")?.classList.add("active");
}

function closeCart() {
  document.getElementById("cartSidebar")?.classList.remove("open");
  document.getElementById("cartOverlay")?.classList.remove("active");
}

/* ---------------------------------------------------------
   8. CHECKOUT & ORDER PLACEMENT
--------------------------------------------------------- */
function openCheckout() {
  if (cart.length === 0) {
    showToast("Add items to cart first");
    return;
  }
  closeCart();
  const user = getCurrentUser();
  if (user) {
    const custName = document.getElementById("custName");
    if (custName && !custName.value) custName.value = user.name;
  }
  const total = updateSummary();
  const checkoutTotal = document.getElementById("checkoutTotal");
  if (checkoutTotal) {
    checkoutTotal.innerHTML = `<span>Amount Payable</span><span>${formatPrice(total)}</span>`;
  }
  document.getElementById("checkoutModal")?.classList.add("open");
  document.getElementById("checkoutOverlay")?.classList.add("active");
}

function closeCheckout() {
  document.getElementById("checkoutModal")?.classList.remove("open");
  document.getElementById("checkoutOverlay")?.classList.remove("active");
}

function selectSlot(btn) {
  document.querySelectorAll(".slot-btn").forEach(b => b.classList.remove("selected"));
  btn.classList.add("selected");
  selectedSlot = btn.dataset.slot;
}

function placeOrder() {
  const name = document.getElementById("custName")?.value.trim();
  const phone = document.getElementById("custPhone")?.value.trim();
  const address = document.getElementById("custAddress")?.value.trim();
  const city = document.getElementById("custCity")?.value.trim() || "Vijayawada";
  const pincode = document.getElementById("custPincode")?.value.trim() || "522502";
  const payment = document.querySelector('input[name="payment"]:checked')?.value || "Cash on Delivery";

  if (!name || !address) {
    showToast("Please enter your name and delivery address");
    return;
  }
  if (!selectedSlot) {
    showToast("Please choose a delivery time slot");
    return;
  }

  const user = getCurrentUser();
  const subtotal = cartSubtotal();
  const discount = subtotal * appliedCoupon;
  const total = subtotal - discount;

  // Build items snapshot
  const orderedItems = cart.map(item => {
    const p = findProduct(item.id);
    return {
      id: item.id,
      name: p ? p.name : "Grocery Item",
      qty: item.qty,
      price: p ? p.price : 0,
      emoji: p ? (p.emoji || "🛒") : "🛒"
    };
  });

  // Deduct inventory stock
  cart.forEach(item => {
    const p = findProduct(item.id);
    if (p) p.stock = Math.max(0, p.stock - item.qty);
  });
  saveProducts();

  const newOrder = {
    id: "KLF2026" + Math.floor(1000 + Math.random() * 9000),
    userId: user ? user.id : "guest_" + Date.now().toString(36),
    customerName: name,
    customerEmail: user ? user.email : (phone ? `${phone}@phone.user` : "guest@klufresh.in"),
    phone,
    address,
    city,
    pincode,
    slot: selectedSlot,
    paymentMethod: payment,
    items: orderedItems,
    subtotal,
    discount,
    total,
    status: "Placed",
    createdAt: new Date().toISOString()
  };

  orders.unshift(newOrder);
  saveOrders();
  updateOrdersBadge();

  const orderIdEl = document.getElementById("orderId");
  const orderSlotEl = document.getElementById("orderSlot");
  if (orderIdEl) orderIdEl.textContent = newOrder.id;
  if (orderSlotEl) orderSlotEl.textContent = selectedSlot;

  closeCheckout();
  document.getElementById("successModal")?.classList.add("open");
  document.getElementById("successOverlay")?.classList.add("active");

  showToast("🎉 Order placed successfully!");

  // Clear cart
  cart = [];
  appliedCoupon = 0;
  selectedSlot = null;
  const couponMsg = document.getElementById("couponMsg");
  if (couponMsg) couponMsg.textContent = "";
  updateCartCount();
  renderCart();
  saveCart();
  renderProducts();
}

function closeSuccess() {
  document.getElementById("successModal")?.classList.remove("open");
  document.getElementById("successOverlay")?.classList.remove("active");
}

/* ---------------------------------------------------------
   9. ORDER HISTORY & LIVE STATUS TRACKING
--------------------------------------------------------- */
const TRACKING_STEPS = ["Placed", "Processing", "Out for Delivery", "Delivered"];

function getCustomerOrders() {
  const user = getCurrentUser();
  if (!user) return orders;
  if (user.role === "admin") return orders;
  const filtered = orders.filter(o => o.userId === user.id || o.customerEmail === user.email);
  return filtered.length > 0 ? filtered : orders;
}

function renderOrdersList() {
  const container = document.getElementById("ordersListContainer");
  if (!container) return;

  const list = getCustomerOrders();
  if (list.length === 0) {
    container.innerHTML = `
      <div style="text-align:center; padding: 40px 20px;">
        <div style="font-size:48px; margin-bottom:12px;">📦</div>
        <h3>No orders found yet</h3>
        <p style="color:var(--gray-text); margin-top:6px;">Place an order from our fresh catalog to track it here!</p>
      </div>
    `;
    return;
  }

  container.innerHTML = list.map(order => {
    const currentStepIdx = TRACKING_STEPS.indexOf(order.status);
    const isCancelled = order.status === "Cancelled";
    const dateFormatted = new Date(order.createdAt).toLocaleDateString("en-IN", {
      month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"
    });

    let statusCls = `status-${order.status.toLowerCase().replace(/\s+/g, '-')}`;

    return `
      <div class="order-card">
        <div class="order-card-header">
          <div>
            <div class="order-id">Order #${order.id}</div>
            <div class="order-date">Placed on ${dateFormatted} &bull; Slot: ${order.slot || "Express"}</div>
          </div>
          <span class="status-badge ${statusCls}">${order.status}</span>
        </div>

        ${!isCancelled ? `
          <!-- Visual Stepper Progress Bar -->
          <div class="tracking-stepper">
            ${TRACKING_STEPS.map((step, idx) => {
              let cls = "";
              if (idx < currentStepIdx) cls = "completed";
              else if (idx === currentStepIdx) cls = "active";
              return `
                <div class="step-item ${cls}">
                  <div class="step-circle">${idx < currentStepIdx ? "✓" : idx + 1}</div>
                  <div class="step-label">${step}</div>
                </div>
              `;
            }).join("")}
          </div>
        ` : `
          <p style="color:var(--danger); font-size:13px; font-weight:700; margin:10px 0;">This order has been cancelled.</p>
        `}

        <div class="order-items-summary">
          ${order.items.map(it => `
            <div class="order-item-line">
              <span>${it.emoji || "🛒"} ${it.name} &times; ${it.qty}</span>
              <span>${formatPrice(it.price * it.qty)}</span>
            </div>
          `).join("")}
        </div>

        <div class="order-card-footer">
          <div>
            📍 <strong>Deliver to:</strong> ${order.customerName}, ${order.address} (${order.paymentMethod || "COD"})
          </div>
          <div class="order-footer-total">Total: ${formatPrice(order.total)}</div>
        </div>
      </div>
    `;
  }).join("");
}

function openOrdersModal() {
  renderOrdersList();
  document.getElementById("ordersModal")?.classList.add("open");
  document.getElementById("ordersOverlay")?.classList.add("active");
}

function closeOrdersModal() {
  document.getElementById("ordersModal")?.classList.remove("open");
  document.getElementById("ordersOverlay")?.classList.remove("active");
}

function updateOrdersBadge() {
  const count = getCustomerOrders().length;
  const badge = document.getElementById("ordersCount");
  if (badge) badge.textContent = count;
}

/* ---------------------------------------------------------
   10. AUTH CONTROLLER & UI
--------------------------------------------------------- */
function setLoginRole(role) {
  loginSelectedRole = role;
  const userBtn = document.getElementById("roleSwitchUser");
  const adminBtn = document.getElementById("roleSwitchAdmin");
  const submitBtn = document.getElementById("loginSubmitBtn");
  const switchP = document.getElementById("loginSignupSwitch");
  const emailInput = document.getElementById("loginEmail");
  const errorEl = document.getElementById("loginError");

  if (errorEl) errorEl.classList.remove("show");

  if (role === "admin") {
    userBtn?.classList.remove("active");
    adminBtn?.classList.add("active");
    if (submitBtn) submitBtn.textContent = "Sign In as Admin";
    if (switchP) switchP.style.display = "none";
    if (emailInput) emailInput.placeholder = "Admin Email (e.g. admin@klufresh.com)";
  } else {
    adminBtn?.classList.remove("active");
    userBtn?.classList.add("active");
    if (submitBtn) submitBtn.textContent = "Sign In as User";
    if (switchP) switchP.style.display = "block";
    if (emailInput) emailInput.placeholder = "Email";
  }
}

function openLoginModal() {
  closeSignupModal();
  setLoginRole("user"); // default to User tab
  const errorEl = document.getElementById("loginError");
  if (errorEl) errorEl.classList.remove("show");
  document.getElementById("loginModal")?.classList.add("open");
  document.getElementById("loginOverlay")?.classList.add("active");
}

function closeLoginModal() {
  document.getElementById("loginModal")?.classList.remove("open");
  document.getElementById("loginOverlay")?.classList.remove("active");
  const emailInput = document.getElementById("loginEmail");
  const pwdInput = document.getElementById("loginPassword");
  if (emailInput) emailInput.value = "";
  if (pwdInput) pwdInput.value = "";
}

function openSignupModal() {
  closeLoginModal();
  const errorEl = document.getElementById("signupError");
  if (errorEl) errorEl.classList.remove("show");
  document.getElementById("signupModal")?.classList.add("open");
  document.getElementById("signupOverlay")?.classList.add("active");
}

function closeSignupModal() {
  document.getElementById("signupModal")?.classList.remove("open");
  document.getElementById("signupOverlay")?.classList.remove("active");
  const nameInput = document.getElementById("signupName");
  const emailInput = document.getElementById("signupEmail");
  const pwdInput = document.getElementById("signupPassword");
  const confirmPwdInput = document.getElementById("signupConfirmPassword");
  if (nameInput) nameInput.value = "";
  if (emailInput) emailInput.value = "";
  if (pwdInput) pwdInput.value = "";
  if (confirmPwdInput) confirmPwdInput.value = "";
}

function showAuthError(elId, message) {
  const el = document.getElementById(elId);
  if (el) {
    el.textContent = message;
    el.classList.add("show");
  }
}

function closeUserDropdown() {
  const dd = document.getElementById("userDropdown");
  if (dd) dd.classList.remove("open");
}

function updateAuthUI() {
  const user = getCurrentUser();
  const guestEl = document.getElementById("authGuest");
  const userEl = document.getElementById("authUser");
  const userNavLinks = document.getElementById("userNavLinks");
  const adminNavLinks = document.getElementById("adminNavLinks");
  const roleBadge = document.getElementById("dropdownRoleBadge");

  const ordersBtn = document.getElementById("myOrdersNavBtn");
  const wishlistBtn = document.getElementById("wishlistBtn");
  const cartBtn = document.getElementById("cartBtn");

  if (user) {
    if (guestEl) guestEl.style.display = "none";
    if (userEl) userEl.style.display = "block";
    const nameLabel = document.getElementById("userNameLabel");
    const dropName = document.getElementById("dropdownName");
    const dropEmail = document.getElementById("dropdownEmail");
    if (nameLabel) nameLabel.textContent = user.name.split(" ")[0];
    if (dropName) dropName.textContent = user.name;
    if (dropEmail) dropEmail.textContent = user.email;

    const avatar = document.getElementById("dropdownAvatar");
    if (user.role === "admin") {
      if (avatar) avatar.textContent = "🛡️";
      if (roleBadge) {
        roleBadge.textContent = "🛡️ Store Admin";
        roleBadge.className = "role-badge admin-role";
      }
      if (userNavLinks) userNavLinks.style.display = "none";
      if (adminNavLinks) adminNavLinks.style.display = "block";

      if (ordersBtn) ordersBtn.style.display = "flex";
      if (wishlistBtn) wishlistBtn.style.display = "flex";
      if (cartBtn) cartBtn.style.display = "flex";
    } else {
      if (avatar) avatar.textContent = "👤";
      if (roleBadge) {
        roleBadge.textContent = "👤 Customer";
        roleBadge.className = "role-badge";
      }
      if (userNavLinks) userNavLinks.style.display = "block";
      if (adminNavLinks) adminNavLinks.style.display = "none";

      if (ordersBtn) ordersBtn.style.display = "flex";
      if (wishlistBtn) wishlistBtn.style.display = "flex";
      if (cartBtn) cartBtn.style.display = "flex";
    }
  } else {
    if (guestEl) guestEl.style.display = "flex";
    if (userEl) userEl.style.display = "none";
    closeUserDropdown();

    if (ordersBtn) ordersBtn.style.display = "flex";
    if (wishlistBtn) wishlistBtn.style.display = "flex";
    if (cartBtn) cartBtn.style.display = "flex";
  }
  updateOrdersBadge();
}

function handleSignupSubmit() {
  const result = registerUser({
    name: document.getElementById("signupName")?.value,
    email: document.getElementById("signupEmail")?.value,
    password: document.getElementById("signupPassword")?.value,
    confirmPassword: document.getElementById("signupConfirmPassword")?.value,
  });

  if (!result.success) {
    showAuthError("signupError", result.message);
    return;
  }

  showToast("🎉 Customer account created!");
  const email = document.getElementById("signupEmail")?.value.trim() || "";
  closeSignupModal();
  openLoginModal();
  const loginEmail = document.getElementById("loginEmail");
  if (loginEmail) loginEmail.value = email;
}

function handleLoginSubmit() {
  const email = document.getElementById("loginEmail")?.value;
  const password = document.getElementById("loginPassword")?.value;

  const result = loginUser({
    email,
    password,
    roleMode: loginSelectedRole
  });

  if (!result.success) {
    showAuthError("loginError", result.message);
    return;
  }

  closeLoginModal();

  // If Admin Login: redirect to admin.html (DO NOT open Add Product popup)
  if (result.user && result.user.role === "admin") {
    showToast(result.message);
    setTimeout(() => {
      window.location.href = "admin.html";
    }, 300);
    return;
  }

  // Normal Customer Login: update UI & toast
  updateAuthUI();
  showToast(result.message);
}

function handleLogout() {
  logoutUser();
  closeUserDropdown();
  updateAuthUI();
  showToast("Logged out successfully 👋");
}

/* ---------------------------------------------------------
   11. EVENT LISTENERS
--------------------------------------------------------- */
function setupUserEvents() {
  // Search & Filtering
  document.getElementById("searchInput")?.addEventListener("input", (e) => {
    searchTerm = e.target.value;
    renderProducts();
  });

  document.querySelectorAll(".nav-pill").forEach(pill => {
    pill.addEventListener("click", () => setActiveCategory(pill.dataset.category));
  });

  document.getElementById("filterCategory")?.addEventListener("change", (e) => setActiveCategory(e.target.value));
  document.getElementById("sortSelect")?.addEventListener("change", (e) => {
    activeSort = e.target.value;
    renderProducts();
  });

  // Hero Actions
  document.getElementById("shopNowBtn")?.addEventListener("click", () => {
    const productsSec = document.getElementById("products") || document.getElementById("productsSection");
    productsSec?.scrollIntoView({ behavior: "smooth" });
  });
  document.getElementById("viewDealsBtn")?.addEventListener("click", () => {
    activeSort = "discount";
    const sortSel = document.getElementById("sortSelect");
    if (sortSel) sortSel.value = "discount";
    renderProducts();
    const productsSec = document.getElementById("products") || document.getElementById("productsSection");
    productsSec?.scrollIntoView({ behavior: "smooth" });
  });

  // Drawer / Modal triggers
  document.getElementById("cartBtn")?.addEventListener("click", openCart);
  document.getElementById("closeCart")?.addEventListener("click", closeCart);
  document.getElementById("cartOverlay")?.addEventListener("click", closeCart);

  document.getElementById("wishlistBtn")?.addEventListener("click", openWishlist);
  document.getElementById("closeWishlist")?.addEventListener("click", closeWishlist);
  document.getElementById("wishlistOverlay")?.addEventListener("click", closeWishlist);

  document.getElementById("myOrdersNavBtn")?.addEventListener("click", openOrdersModal);
  document.getElementById("myOrdersMenuBtn")?.addEventListener("click", () => {
    closeUserDropdown();
    openOrdersModal();
  });
  document.getElementById("closeOrders")?.addEventListener("click", closeOrdersModal);
  document.getElementById("ordersOverlay")?.addEventListener("click", closeOrdersModal);
  document.getElementById("viewMyOrdersSuccessBtn")?.addEventListener("click", () => {
    closeSuccess();
    openOrdersModal();
  });

  document.getElementById("locationBtn")?.addEventListener("click", () => showToast("📍 Delivering to Vijayawada & KL University campus"));

  // Coupon & Checkout
  document.getElementById("applyCouponBtn")?.addEventListener("click", applyCoupon);
  document.getElementById("checkoutBtn")?.addEventListener("click", openCheckout);
  document.getElementById("closeCheckout")?.addEventListener("click", closeCheckout);
  document.getElementById("checkoutOverlay")?.addEventListener("click", closeCheckout);

  document.querySelectorAll(".slot-btn").forEach(btn => {
    btn.addEventListener("click", () => selectSlot(btn));
  });

  document.getElementById("placeOrderBtn")?.addEventListener("click", placeOrder);
  document.getElementById("continueShoppingBtn")?.addEventListener("click", closeSuccess);
  document.getElementById("successOverlay")?.addEventListener("click", closeSuccess);

  // Auth Modals
  document.getElementById("loginBtn")?.addEventListener("click", openLoginModal);
  document.getElementById("closeLogin")?.addEventListener("click", closeLoginModal);
  document.getElementById("loginOverlay")?.addEventListener("click", closeLoginModal);
  document.getElementById("closeSignup")?.addEventListener("click", closeSignupModal);
  document.getElementById("signupOverlay")?.addEventListener("click", closeSignupModal);

  // Role toggle switch buttons
  document.getElementById("roleSwitchUser")?.addEventListener("click", () => setLoginRole("user"));
  document.getElementById("roleSwitchAdmin")?.addEventListener("click", () => setLoginRole("admin"));

  document.getElementById("switchToSignup")?.addEventListener("click", (e) => { e.preventDefault(); openSignupModal(); });
  document.getElementById("switchToLogin")?.addEventListener("click", (e) => { e.preventDefault(); openLoginModal(); });

  document.getElementById("signupSubmitBtn")?.addEventListener("click", handleSignupSubmit);
  document.getElementById("loginSubmitBtn")?.addEventListener("click", handleLoginSubmit);

  // Enter Key Triggers for Auth
  ["signupName", "signupEmail", "signupPassword", "signupConfirmPassword"].forEach(id => {
    document.getElementById(id)?.addEventListener("keydown", (e) => { if (e.key === "Enter") handleSignupSubmit(); });
  });
  ["loginEmail", "loginPassword"].forEach(id => {
    document.getElementById(id)?.addEventListener("keydown", (e) => { if (e.key === "Enter") handleLoginSubmit(); });
  });

  // User Dropdown Trigger
  const dropdown = document.getElementById("userDropdown");
  document.getElementById("userMenuTrigger")?.addEventListener("click", (e) => {
    e.stopPropagation();
    dropdown?.classList.toggle("open");
  });
  document.addEventListener("click", (e) => {
    if (!document.getElementById("authUser")?.contains(e.target)) closeUserDropdown();
  });

  document.getElementById("accountMenuBtn")?.addEventListener("click", () => {
    const user = getCurrentUser();
    closeUserDropdown();
    showToast(`👤 Signed in as ${user ? user.name : "Guest"}`);
  });
  document.getElementById("logoutBtn")?.addEventListener("click", handleLogout);

  document.getElementById("adminDashboardBtn")?.addEventListener("click", () => {
    closeUserDropdown();
    window.location.href = "admin.html";
  });
}

/* ---------------------------------------------------------
   12. INITIALIZATION FOR USER HOMEPAGE
--------------------------------------------------------- */
function initUserModule() {
  loadProducts();
  loadCart();
  loadWishlist();
  loadOrders();

  renderProducts();
  renderCart();
  updateCartCount();
  updateWishlistCount();
  updateOrdersBadge();

  setupUserEvents();
  updateAuthUI();
}

document.addEventListener("DOMContentLoaded", initUserModule);
