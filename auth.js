/* ===========================================================
   KLU FRESH — AUTHENTICATION SERVICE
   -----------------------------------------------------------
   Handles shared authentication for Customers and Admins.
   Talks to localStorage for user accounts, session state,
   and protected admin access flags.
=========================================================== */

const ADMIN_CREDENTIALS = {
  email: "admin@klufresh.com",
  password: "admin123"
};

const ADMIN_ACCOUNTS = [
  {
    id: "admin_001",
    name: "Store Administrator",
    email: "admin@klufresh.com",
    password: "admin123",
    role: "admin"
  },
  {
    id: "admin_002",
    name: "Store Administrator",
    email: "admin123@klufresh.in",
    password: "admin11",
    role: "admin"
  }
];

const AUTH_STORAGE_KEYS = {
  USERS: "grocery_users",
  CURRENT_USER: "grocery_current_user",
  ADMIN_AUTH: "klu_admin_authenticated"
};

/* ---------------------------------------------------------
   Safe localStorage JSON helpers
--------------------------------------------------------- */
function authReadJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return parsed === null || parsed === undefined ? fallback : parsed;
  } catch (err) {
    console.warn(`[auth] Could not parse localStorage key "${key}", resetting it.`, err);
    return fallback;
  }
}

function authWriteJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (err) {
    console.warn(`[auth] Could not write localStorage key "${key}".`, err);
    return false;
  }
}

/* ---------------------------------------------------------
   Demo password hashing / obfuscation
--------------------------------------------------------- */
function demoObfuscatePassword(password) {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    hash = (hash << 5) - hash + password.charCodeAt(i);
    hash |= 0; // force 32-bit int
  }
  return `demo_${Math.abs(hash).toString(36)}_${password.length}`;
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/* ---------------------------------------------------------
   Internal user-store helpers
--------------------------------------------------------- */
function getStoredUsers() {
  return authReadJSON(AUTH_STORAGE_KEYS.USERS, []);
}

function saveStoredUsers(users) {
  authWriteJSON(AUTH_STORAGE_KEYS.USERS, users);
}

function makeUserId() {
  return "u_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

/* ---------------------------------------------------------
   PUBLIC AUTH API
--------------------------------------------------------- */

/**
 * registerUser({ name, email, password, confirmPassword })
 * Creates a new customer account in localStorage.
 * returns { success, message, user? }
 */
function registerUser({ name, email, password, confirmPassword }) {
  name = (name || "").trim();
  email = (email || "").trim().toLowerCase();
  password = password || "";
  confirmPassword = confirmPassword || "";

  if (!name || !email || !password || !confirmPassword) {
    return { success: false, message: "Please fill in all fields." };
  }
  if (!isValidEmail(email)) {
    return { success: false, message: "Please enter a valid email address." };
  }
  if (ADMIN_ACCOUNTS.some(a => a.email.toLowerCase() === email)) {
    return { success: false, message: "This email is reserved for system administrator." };
  }
  if (password.length < 6) {
    return { success: false, message: "Password must be at least 6 characters." };
  }
  if (password !== confirmPassword) {
    return { success: false, message: "Passwords do not match." };
  }

  const users = getStoredUsers();
  if (users.some(u => u.email === email)) {
    return { success: false, message: "An account with this email already exists." };
  }

  const newUser = {
    id: makeUserId(),
    name,
    email,
    password: demoObfuscatePassword(password),
    role: "user",
    createdAt: new Date().toISOString(),
  };

  users.push(newUser);
  saveStoredUsers(users);

  return {
    success: true,
    message: "Account created successfully! Welcome to KLU Fresh.",
    user: { id: newUser.id, name: newUser.name, email: newUser.email, role: "user" },
  };
}

/**
 * adminLogin({ email, password })
 * Validates admin credentials and stores admin authentication state.
 */
function adminLogin({ email, password }) {
  email = (email || "").trim().toLowerCase();
  password = password || "";

  if (!email || !password) {
    return { success: false, message: "Please enter both Admin email and password." };
  }

  const adminMatch = ADMIN_ACCOUNTS.find(
    a => a.email.toLowerCase() === email && a.password === password
  );

  if (adminMatch) {
    const adminSession = {
      id: adminMatch.id,
      name: adminMatch.name,
      email: adminMatch.email,
      role: "admin"
    };
    localStorage.setItem(AUTH_STORAGE_KEYS.ADMIN_AUTH, "true");
    authWriteJSON(AUTH_STORAGE_KEYS.CURRENT_USER, adminSession);
    return {
      success: true,
      message: "Admin authentication successful!",
      user: adminSession
    };
  }

  return { success: false, message: "Invalid Admin credentials." };
}

/**
 * loginUser({ email, password, roleMode })
 * Verifies credentials against admin or registered customer users based on roleMode.
 * returns { success, message, user? }
 */
function loginUser({ email, password, roleMode = "user" }) {
  if (roleMode === "admin") {
    return adminLogin({ email, password });
  }

  email = (email || "").trim().toLowerCase();
  password = password || "";

  if (!email || !password) {
    return { success: false, message: "Please enter both email and password." };
  }

  const users = getStoredUsers();
  const match = users.find(u => u.email === email);

  if (!match || match.password !== demoObfuscatePassword(password)) {
    return { success: false, message: "Invalid email or password." };
  }

  const sessionUser = { id: match.id, name: match.name, email: match.email, role: match.role || "user" };
  // Customer login should not keep admin auth flag active
  localStorage.removeItem(AUTH_STORAGE_KEYS.ADMIN_AUTH);
  authWriteJSON(AUTH_STORAGE_KEYS.CURRENT_USER, sessionUser);

  return {
    success: true,
    message: `Welcome back, ${match.name.split(" ")[0]}!`,
    user: sessionUser
  };
}

/**
 * logoutUser()
 * Clears the active session only — registered account data is kept.
 */
function logoutUser() {
  localStorage.removeItem(AUTH_STORAGE_KEYS.CURRENT_USER);
  localStorage.removeItem(AUTH_STORAGE_KEYS.ADMIN_AUTH);
}

/**
 * adminLogout()
 * Explicitly clears admin authentication state and admin user session.
 */
function adminLogout() {
  localStorage.removeItem(AUTH_STORAGE_KEYS.ADMIN_AUTH);
  const currentUser = getCurrentUser();
  if (currentUser && currentUser.role === "admin") {
    localStorage.removeItem(AUTH_STORAGE_KEYS.CURRENT_USER);
  }
}

/**
 * getCurrentUser()
 * returns the logged-in user's session object, or null.
 */
function getCurrentUser() {
  return authReadJSON(AUTH_STORAGE_KEYS.CURRENT_USER, null);
}

/**
 * isAuthenticated()
 * returns true/false
 */
function isAuthenticated() {
  return getCurrentUser() !== null;
}

/**
 * isAdmin()
 * returns true if current logged in user has admin role
 */
function isAdmin() {
  const user = getCurrentUser();
  return (user && user.role === "admin") || isAdminAuthenticated();
}

/**
 * isAdminAuthenticated()
 * returns true if admin authentication flag or session exists
 */
function isAdminAuthenticated() {
  const flag = localStorage.getItem(AUTH_STORAGE_KEYS.ADMIN_AUTH) === "true";
  const user = getCurrentUser();
  return flag && user && user.role === "admin";
}
