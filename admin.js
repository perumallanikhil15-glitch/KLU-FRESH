/* ===========================================================
   KLU FRESH — ADMIN MODULE (admin.js)
   -----------------------------------------------------------
   Handles Admin features & route protection:
   - Route guard: verifies admin authentication before rendering
   - Dashboard metrics (Revenue, Orders, Low Stock, Users)
   - Product Catalog CRUD (Add, Edit, Delete, Stock update)
   - Order fulfillment & status updates
   - Registered customer accounts view
   - Admin logout and navigation
=========================================================== */

/* ---------------------------------------------------------
   1. ROUTE GUARD (IMMEDIATE PROTECTION)
--------------------------------------------------------- */
(function enforceAdminProtection() {
  if (!isAdminAuthenticated()) {
    window.location.replace("index.html");
  }
})();

/* ---------------------------------------------------------
   2. STORAGE KEYS & DEFAULT DATA
--------------------------------------------------------- */
const ADMIN_STORAGE_KEYS = {
  PRODUCTS: "grocery_products",
  ORDERS: "grocery_orders",
  USERS: "grocery_users"
};

const DEFAULT_ADMIN_PRODUCTS = [
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

let adminProducts = [];
let adminOrders = [];

/* ---------------------------------------------------------
   3. PERSISTENCE HELPERS
--------------------------------------------------------- */
function loadAdminData() {
  try {
    const rawProd = localStorage.getItem(ADMIN_STORAGE_KEYS.PRODUCTS);
    if (!rawProd) {
      adminProducts = [...DEFAULT_ADMIN_PRODUCTS];
      localStorage.setItem(ADMIN_STORAGE_KEYS.PRODUCTS, JSON.stringify(adminProducts));
    } else {
      const parsed = JSON.parse(rawProd);
      adminProducts = Array.isArray(parsed) && parsed.length > 0 ? parsed : [...DEFAULT_ADMIN_PRODUCTS];
    }
  } catch (e) {
    adminProducts = [...DEFAULT_ADMIN_PRODUCTS];
  }

  try {
    const rawOrders = localStorage.getItem(ADMIN_STORAGE_KEYS.ORDERS);
    if (!rawOrders) {
      adminOrders = [
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
      localStorage.setItem(ADMIN_STORAGE_KEYS.ORDERS, JSON.stringify(adminOrders));
    } else {
      const parsed = JSON.parse(rawOrders);
      adminOrders = Array.isArray(parsed) ? parsed : [];
    }
  } catch (e) {
    adminOrders = [];
  }
}

function saveAdminProducts() {
  try {
    localStorage.setItem(ADMIN_STORAGE_KEYS.PRODUCTS, JSON.stringify(adminProducts));
  } catch (e) {
    console.warn("Could not save products", e);
  }
}

function saveAdminOrders() {
  try {
    localStorage.setItem(ADMIN_STORAGE_KEYS.ORDERS, JSON.stringify(adminOrders));
  } catch (e) {
    console.warn("Could not save orders", e);
  }
}

function findAdminProduct(id) {
  return adminProducts.find(p => p.id === Number(id));
}

function formatPrice(n) { return "₹" + Math.round(n); }

function stockInfo(stock) {
  if (stock === 0) return { label: "Out of Stock", cls: "stock-out" };
  if (stock <= 3) return { label: `Only ${stock} left`, cls: "stock-low" };
  return { label: "In Stock", cls: "stock-in" };
}

function showAdminToast(message) {
  const toast = document.getElementById("toast");
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(showAdminToast._timer);
  showAdminToast._timer = setTimeout(() => toast.classList.remove("show"), 2500);
}

/* ---------------------------------------------------------
   4. TAB SWITCHING
--------------------------------------------------------- */
function switchAdminTab(tabName) {
  document.querySelectorAll(".admin-nav-item").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.tab === tabName);
  });
  document.querySelectorAll(".admin-tab-pane").forEach(pane => {
    pane.classList.toggle("active", pane.id === `tab-${tabName}`);
  });

  if (tabName === "admin-dashboard") renderAdminDashboard();
  else if (tabName === "admin-products") renderAdminProductsTable();
  else if (tabName === "admin-orders") renderAdminOrdersTable();
  else if (tabName === "admin-users") renderAdminUsersTable();
}

/* ---------------------------------------------------------
   5. DASHBOARD OVERVIEW
--------------------------------------------------------- */
function renderAdminDashboard() {
  loadAdminData();

  const totalRevenue = adminOrders
    .filter(o => o.status !== "Cancelled")
    .reduce((sum, o) => sum + (o.total || 0), 0);

  const pendingOrders = adminOrders.filter(o => o.status === "Placed" || o.status === "Processing").length;
  const lowStockCount = adminProducts.filter(p => p.stock <= 3).length;
  const storedUsers = getStoredUsers();

  const revEl = document.getElementById("adminStatRevenue");
  const ordEl = document.getElementById("adminStatOrders");
  const pendEl = document.getElementById("adminStatPendingOrders");
  const prodEl = document.getElementById("adminStatProducts");
  const lowEl = document.getElementById("adminStatLowStock");
  const usrEl = document.getElementById("adminStatUsers");
  const badgeEl = document.getElementById("adminOrdersBadge");

  if (revEl) revEl.textContent = formatPrice(totalRevenue);
  if (ordEl) ordEl.textContent = adminOrders.length;
  if (pendEl) pendEl.textContent = `${pendingOrders} active / pending`;
  if (prodEl) prodEl.textContent = adminProducts.length;
  if (lowEl) lowEl.textContent = `${lowStockCount} low in stock`;
  if (usrEl) usrEl.textContent = storedUsers.length;
  if (badgeEl) badgeEl.textContent = adminOrders.length;

  // Render recent 5 orders
  const tbody = document.getElementById("adminRecentOrdersBody");
  if (!tbody) return;
  const recent = adminOrders.slice(0, 5);

  if (recent.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; color:var(--gray-text);">No customer orders yet</td></tr>`;
    return;
  }

  tbody.innerHTML = recent.map(o => {
    let statusCls = `status-${o.status.toLowerCase().replace(/\s+/g, '-')}`;
    return `
      <tr>
        <td><strong>#${o.id}</strong></td>
        <td>${o.customerName}<br><span style="font-size:11px; color:var(--gray-text);">${o.customerEmail || ""}</span></td>
        <td>${o.items.length} item(s)</td>
        <td><strong>${formatPrice(o.total)}</strong></td>
        <td>${o.slot}</td>
        <td><span class="status-badge ${statusCls}">${o.status}</span></td>
        <td>
          <select class="status-select-sm" data-order-id="${o.id}">
            ${["Placed", "Processing", "Out for Delivery", "Delivered", "Cancelled"].map(s => `
              <option value="${s}" ${o.status === s ? "selected" : ""}>${s}</option>
            `).join("")}
          </select>
        </td>
      </tr>
    `;
  }).join("");

  tbody.querySelectorAll(".status-select-sm").forEach(sel => {
    sel.addEventListener("change", (e) => changeOrderStatus(sel.dataset.orderId, e.target.value));
  });
}

/* ---------------------------------------------------------
   6. PRODUCT CATALOG MANAGEMENT
--------------------------------------------------------- */
function renderAdminProductsTable() {
  loadAdminData();
  const tbody = document.getElementById("adminProductsTableBody");
  if (!tbody) return;

  const search = (document.getElementById("adminProductSearch")?.value || "").toLowerCase().trim();
  const catFilter = document.getElementById("adminProductCatFilter")?.value || "all";

  let list = adminProducts.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search) || p.category.toLowerCase().includes(search);
    const matchesCat = catFilter === "all" || p.category === catFilter;
    return matchesSearch && matchesCat;
  });

  if (list.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; color:var(--gray-text); padding:30px;">No products match criteria</td></tr>`;
    return;
  }

  tbody.innerHTML = list.map(p => {
    const stock = stockInfo(p.stock);
    return `
      <tr>
        <td>
          ${p.image ? `<img src="${p.image}" class="table-img" alt="${p.name}">` : `<span class="table-thumb">${p.emoji || "🛒"}</span>`}
        </td>
        <td><strong>${p.name}</strong></td>
        <td>${p.category}</td>
        <td>${p.qty || "1 unit"}</td>
        <td><strong>${formatPrice(p.price)}</strong></td>
        <td>${p.original ? formatPrice(p.original) : "—"}</td>
        <td>
          <span class="product-stock ${stock.cls}">${p.stock} units</span>
        </td>
        <td>
          <button class="action-icon-btn btn-stock-inc" data-id="${p.id}" title="Add 5 Stock">+5</button>
          <button class="action-icon-btn btn-edit-product" data-id="${p.id}" title="Edit Product">✏️</button>
          <button class="action-icon-btn btn-delete btn-delete-product" data-id="${p.id}" title="Delete Product">🗑️</button>
        </td>
      </tr>
    `;
  }).join("");

  tbody.querySelectorAll(".btn-stock-inc").forEach(btn => {
    btn.addEventListener("click", () => {
      const p = findAdminProduct(btn.dataset.id);
      if (p) {
        p.stock += 5;
        saveAdminProducts();
        renderAdminProductsTable();
        renderAdminDashboard();
        showAdminToast(`Stock updated for ${p.name}`);
      }
    });
  });

  tbody.querySelectorAll(".btn-edit-product").forEach(btn => {
    btn.addEventListener("click", () => openAdminEditProductModal(Number(btn.dataset.id)));
  });

  tbody.querySelectorAll(".btn-delete-product").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = Number(btn.dataset.id);
      const p = findAdminProduct(id);
      if (p && confirm(`Are you sure you want to delete "${p.name}" from catalog?`)) {
        adminProducts = adminProducts.filter(x => x.id !== id);
        saveAdminProducts();
        renderAdminProductsTable();
        renderAdminDashboard();
        showAdminToast("Product deleted from catalog");
      }
    });
  });
}

function openAdminAddProductModal() {
  document.getElementById("adminProductModalTitle").textContent = "Add New Product";
  document.getElementById("adminEditProductId").value = "";
  document.getElementById("adminProductForm").reset();
  document.getElementById("adminProductModal").classList.add("open");
  document.getElementById("adminProductOverlay").classList.add("active");
}

function openAdminEditProductModal(id) {
  const p = findAdminProduct(id);
  if (!p) return;
  document.getElementById("adminProductModalTitle").textContent = "Edit Product";
  document.getElementById("adminEditProductId").value = p.id;
  document.getElementById("adminProdName").value = p.name;
  document.getElementById("adminProdCategory").value = p.category;
  document.getElementById("adminProdQty").value = p.qty || "";
  document.getElementById("adminProdPrice").value = p.price;
  document.getElementById("adminProdOriginal").value = p.original || p.price;
  document.getElementById("adminProdStock").value = p.stock;
  document.getElementById("adminProdEmoji").value = p.emoji || "";
  document.getElementById("adminProdImage").value = p.image || "";

  document.getElementById("adminProductModal").classList.add("open");
  document.getElementById("adminProductOverlay").classList.add("active");
}

function closeAdminProductModal() {
  document.getElementById("adminProductModal")?.classList.remove("open");
  document.getElementById("adminProductOverlay")?.classList.remove("active");
}

function handleSaveAdminProduct(e) {
  e.preventDefault();
  const idVal = document.getElementById("adminEditProductId").value;
  const name = document.getElementById("adminProdName").value.trim();
  const category = document.getElementById("adminProdCategory").value;
  const qty = document.getElementById("adminProdQty").value.trim();
  const price = Number(document.getElementById("adminProdPrice").value);
  const original = Number(document.getElementById("adminProdOriginal").value) || price;
  const stock = Number(document.getElementById("adminProdStock").value);
  const emoji = document.getElementById("adminProdEmoji").value.trim() || "🛒";
  const image = document.getElementById("adminProdImage").value.trim();

  if (!name || price <= 0) {
    showAdminToast("Please enter valid product name and price");
    return;
  }

  if (idVal) {
    const p = findAdminProduct(idVal);
    if (p) {
      p.name = name;
      p.category = category;
      p.qty = qty;
      p.price = price;
      p.original = original;
      p.stock = stock;
      p.emoji = emoji;
      p.image = image || undefined;
      showAdminToast(`✓ Updated ${p.name}`);
    }
  } else {
    const newId = adminProducts.length > 0 ? Math.max(...adminProducts.map(p => p.id)) + 1 : 1;
    const newProduct = {
      id: newId,
      name,
      category,
      qty,
      price,
      original,
      stock,
      rating: 4.8,
      emoji,
      image: image || undefined
    };
    adminProducts.push(newProduct);
    showAdminToast(`✓ Added ${newProduct.name} to catalog`);
  }

  saveAdminProducts();
  closeAdminProductModal();
  renderAdminProductsTable();
  renderAdminDashboard();
}

/* ---------------------------------------------------------
   7. CUSTOMER ORDERS & FULFILLMENT
--------------------------------------------------------- */
function renderAdminOrdersTable() {
  loadAdminData();
  const tbody = document.getElementById("adminAllOrdersTableBody");
  if (!tbody) return;

  const statusFilter = document.getElementById("adminOrderStatusFilter")?.value || "all";
  let list = adminOrders;
  if (statusFilter !== "all") {
    list = list.filter(o => o.status === statusFilter);
  }

  if (list.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; color:var(--gray-text); padding:30px;">No customer orders found</td></tr>`;
    return;
  }

  tbody.innerHTML = list.map(o => {
    const dateFormatted = new Date(o.createdAt).toLocaleDateString("en-IN", {
      month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"
    });
    return `
      <tr>
        <td>
          <strong>#${o.id}</strong><br>
          <span style="font-size:11px; color:var(--gray-text);">${dateFormatted}</span><br>
          <span style="font-size:11px; font-weight:600; color:var(--dark-green);">Slot: ${o.slot}</span>
        </td>
        <td>
          <strong>${o.customerName}</strong><br>
          <span style="font-size:11.5px; color:var(--gray-text);">${o.customerEmail || ""}</span><br>
          <span style="font-size:11.5px; color:var(--gray-text);">📞 ${o.phone || "N/A"}</span>
        </td>
        <td style="max-width:200px;">${o.address}, ${o.city} - ${o.pincode}</td>
        <td>
          <div style="font-size:12px; line-height:1.4;">
            ${o.items.map(it => `<div>${it.emoji || "🛒"} ${it.name} &times; ${it.qty}</div>`).join("")}
          </div>
        </td>
        <td><span class="role-badge">${o.paymentMethod || "COD"}</span></td>
        <td><strong>${formatPrice(o.total)}</strong></td>
        <td>
          <select class="status-select-sm" data-order-id="${o.id}">
            ${["Placed", "Processing", "Out for Delivery", "Delivered", "Cancelled"].map(s => `
              <option value="${s}" ${o.status === s ? "selected" : ""}>${s}</option>
            `).join("")}
          </select>
        </td>
      </tr>
    `;
  }).join("");

  tbody.querySelectorAll(".status-select-sm").forEach(sel => {
    sel.addEventListener("change", (e) => changeOrderStatus(sel.dataset.orderId, e.target.value));
  });
}

function changeOrderStatus(orderId, newStatus) {
  const order = adminOrders.find(o => o.id === orderId);
  if (order) {
    order.status = newStatus;
    saveAdminOrders();
    renderAdminDashboard();
    renderAdminOrdersTable();
    showAdminToast(`Order #${orderId} status updated to "${newStatus}"`);
  }
}

/* ---------------------------------------------------------
   8. REGISTERED USERS TABLE
--------------------------------------------------------- */
function renderAdminUsersTable() {
  const tbody = document.getElementById("adminUsersTableBody");
  if (!tbody) return;

  const usersList = [
    {
      id: "admin_001",
      name: "Store Administrator",
      email: "admin@klufresh.com",
      role: "admin",
      createdAt: "System Admin"
    },
    ...getStoredUsers()
  ];

  tbody.innerHTML = usersList.map(u => {
    const userOrdersCount = adminOrders.filter(o => o.userId === u.id || o.customerEmail === u.email).length;
    const isAdm = u.role === "admin";
    const dateFormatted = u.createdAt === "System Admin" ? "System Admin" : (u.createdAt ? new Date(u.createdAt).toLocaleDateString("en-IN", {
      month: "short", day: "numeric", year: "numeric"
    }) : "Recently");

    return `
      <tr>
        <td><strong>${u.name}</strong></td>
        <td>${u.email}</td>
        <td>
          <span class="role-badge ${isAdm ? 'admin-role' : ''}">
            ${isAdm ? '🛡️ Store Admin' : '👤 Customer'}
          </span>
        </td>
        <td>${dateFormatted}</td>
        <td><strong>${isAdm ? '—' : `${userOrdersCount} orders`}</strong></td>
      </tr>
    `;
  }).join("");
}

/* ---------------------------------------------------------
   9. ADMIN LOGOUT & ACTIONS
--------------------------------------------------------- */
function handleAdminLogout() {
  adminLogout();
  showAdminToast("Admin logged out successfully 👋");
  setTimeout(() => {
    window.location.href = "index.html";
  }, 400);
}

/* ---------------------------------------------------------
   10. EVENT LISTENERS
--------------------------------------------------------- */
function setupAdminEvents() {
  document.getElementById("adminLogoHome")?.addEventListener("click", () => switchAdminTab("admin-dashboard"));
  document.getElementById("adminBackToStoreBtn")?.addEventListener("click", () => {
    window.location.href = "index.html";
  });
  document.getElementById("adminLogoutBtn")?.addEventListener("click", handleAdminLogout);

  document.querySelectorAll(".admin-nav-item").forEach(item => {
    item.addEventListener("click", () => switchAdminTab(item.dataset.tab));
  });

  document.getElementById("viewAllOrdersLink")?.addEventListener("click", () => switchAdminTab("admin-orders"));

  // Product CRUD Events (Manual click only)
  document.getElementById("adminAddNewProductBtn")?.addEventListener("click", openAdminAddProductModal);
  document.getElementById("adminAddNewProductBtnDash")?.addEventListener("click", openAdminAddProductModal);
  document.getElementById("closeAdminProductModal")?.addEventListener("click", closeAdminProductModal);
  document.getElementById("cancelAdminProductBtn")?.addEventListener("click", closeAdminProductModal);
  document.getElementById("adminProductOverlay")?.addEventListener("click", closeAdminProductModal);
  document.getElementById("adminProductForm")?.addEventListener("submit", handleSaveAdminProduct);

  document.getElementById("adminProductSearch")?.addEventListener("input", renderAdminProductsTable);
  document.getElementById("adminProductCatFilter")?.addEventListener("change", renderAdminProductsTable);
  document.getElementById("adminOrderStatusFilter")?.addEventListener("change", renderAdminOrdersTable);
}

/* ---------------------------------------------------------
   11. ADMIN MODULE INITIALIZATION
--------------------------------------------------------- */
function initAdminModule() {
  if (!isAdminAuthenticated()) {
    window.location.replace("index.html");
    return;
  }

  loadAdminData();
  renderAdminDashboard();
  renderAdminProductsTable();
  renderAdminOrdersTable();
  renderAdminUsersTable();
  setupAdminEvents();
  // NOTE: openAdminAddProductModal is INTENTIONALLY NOT called automatically!
}

document.addEventListener("DOMContentLoaded", initAdminModule);
