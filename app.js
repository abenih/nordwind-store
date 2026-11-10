/**
 * Nordwind E-Commerce — Main Application
 */

const PRODUCTS = [
    { id: 1, name: "Half Running Sets", price: 99, badge: "sales", badgeLabel: "Sales", image: "images/1.jpg", rating: 5 },
    { id: 2, name: "Formal Men Lowers", price: 119, badge: "new", badgeLabel: "New", image: "images/2.jpg", rating: 5 },
    { id: 3, name: "Half Running Suits", price: 109, badge: null, badgeLabel: null, image: "images/3.jpg", rating: 4 },
    { id: 4, name: "Half Fancy Lady Dress", price: 129, badge: "hot", badgeLabel: "Hot", image: "images/4.jpg", rating: 5 },
    { id: 5, name: "Flix Flox Jeans", price: 89, badge: null, badgeLabel: null, image: "images/5.jpg", rating: 4 },
    { id: 6, name: "Fancy Salwar Suits", price: 139, badge: "trends", badgeLabel: "Trends", image: "images/6.jpg", rating: 5 },
    { id: 7, name: "Printed Straight Kurta", price: 79, badge: "sales", badgeLabel: "Sales", image: "images/7.jpg", rating: 4 },
    { id: 8, name: "Collot Full Dress", price: 149, badge: "sales", badgeLabel: "Sales", image: "images/8.jpg", rating: 5 },
    { id: 9, name: "Casual Summer Tee", price: 49, badge: "new", badgeLabel: "New", image: "images/1.jpg", rating: 4 },
];

const STORAGE_KEYS = {
    cart: "minishop_cart",
    wishlist: "minishop_wishlist",
    theme: "minishop_theme",
};

let cart = loadStorage(STORAGE_KEYS.cart, []);
let wishlist = loadStorage(STORAGE_KEYS.wishlist, []);
let activeFilter = "all";

const header = document.getElementById("header");
const productsGrid = document.getElementById("products-grid");
const cartCountEl = document.getElementById("cart-count");
const wishlistCountEl = document.getElementById("wishlist-count");
const cartItemsEl = document.getElementById("cart-items");
const wishlistItemsEl = document.getElementById("wishlist-items");
const cartTotalEl = document.getElementById("cart-total");
const toastContainer = document.getElementById("toast-container");

document.addEventListener("DOMContentLoaded", () => {
    initTheme();
    renderProducts();
    updateBadges();
    renderCart();
    renderWishlist();
    bindEvents();
});

function loadStorage(key, fallback) {
    try {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : fallback;
    } catch {
        return fallback;
    }
}

function saveStorage(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
}

function initTheme() {
    const saved = localStorage.getItem(STORAGE_KEYS.theme);
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    setTheme(saved || (prefersDark ? "dark" : "light"));
}

function setTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem(STORAGE_KEYS.theme, theme);
    const icon = document.getElementById("theme-icon");
    if (icon) icon.className = theme === "dark" ? "bx bx-sun" : "bx bx-moon";
}

function toggleTheme() {
    const current = document.documentElement.getAttribute("data-theme") || "light";
    setTheme(current === "dark" ? "light" : "dark");
}

function renderProducts(filter = activeFilter, searchQuery = "") {
    activeFilter = filter;
    const query = searchQuery.toLowerCase().trim();

    const filtered = PRODUCTS.filter((p) => {
        const matchFilter = filter === "all" || p.badge === filter;
        const matchSearch = !query || p.name.toLowerCase().includes(query);
        return matchFilter && matchSearch;
    });

    if (filtered.length === 0) {
        productsGrid.innerHTML = '<p class="no-results">No products found. Try a different filter or search term.</p>';
        return;
    }

    productsGrid.innerHTML = filtered.map(createProductCard).join("");
    bindProductEvents();
}

function createProductCard(product) {
    const stars = Array.from({ length: 5 }, (_, i) =>
        '<i class="bx ' + (i < product.rating ? "bxs-star" : "bx-star") + '"></i>'
    ).join("");

    const badge = product.badge
        ? '<span class="product-badge ' + product.badge + '">' + product.badgeLabel + "</span>"
        : "";

    const inWishlist = wishlist.some((w) => w.id === product.id);

    return (
        '<article class="product-card" data-id="' + product.id + '">' +
        '<img src="' + product.image + '" alt="' + product.name + '" loading="lazy" width="400" height="280">' +
        badge +
        '<div class="product-actions">' +
        '<button type="button" class="action-btn wishlist-toggle ' + (inWishlist ? "active" : "") + '" data-id="' + product.id + '" aria-label="Toggle wishlist">' +
        '<i class="bx ' + (inWishlist ? "bxs-heart" : "bx-heart") + '"></i></button></div>' +
        '<div class="product-body">' +
        '<div class="rating">' + stars + "</div>" +
        "<h4>" + product.name + "</h4>" +
        '<p class="price">$' + product.price.toFixed(2) + "</p>" +
        '<button type="button" class="add-cart-btn" data-id="' + product.id + '">Add to Cart</button>' +
        "</div></article>"
    );
}

function bindProductEvents() {
    productsGrid.querySelectorAll(".add-cart-btn").forEach((btn) => {
        btn.addEventListener("click", () => addToCart(Number(btn.dataset.id)));
    });
    productsGrid.querySelectorAll(".wishlist-toggle").forEach((btn) => {
        btn.addEventListener("click", () => toggleWishlist(Number(btn.dataset.id)));
    });
}

function addToCart(productId) {
    const product = PRODUCTS.find((p) => p.id === productId);
    if (!product) return;

    const existing = cart.find((item) => item.id === productId);
    if (existing) existing.qty += 1;
    else cart.push({ ...product, qty: 1 });

    saveStorage(STORAGE_KEYS.cart, cart);
    updateBadges();
    renderCart();
    showToast(product.name + " added to cart!", "success");
}

function removeFromCart(productId) {
    cart = cart.filter((item) => item.id !== productId);
    saveStorage(STORAGE_KEYS.cart, cart);
    updateBadges();
    renderCart();
    renderProducts();
}

function updateQty(productId, delta) {
    const item = cart.find((i) => i.id === productId);
    if (!item) return;
    item.qty += delta;
    if (item.qty <= 0) {
        removeFromCart(productId);
        return;
    }
    saveStorage(STORAGE_KEYS.cart, cart);
    updateBadges();
    renderCart();
}

function renderCart() {
    if (cart.length === 0) {
        cartItemsEl.innerHTML = '<div class="empty-state"><i class="bx bx-cart"></i><p>Your cart is empty</p></div>';
        cartTotalEl.textContent = "$0.00";
        return;
    }

    cartItemsEl.innerHTML = cart.map((item) =>
        '<div class="cart-item" data-id="' + item.id + '">' +
        '<img src="' + item.image + '" alt="' + item.name + '">' +
        '<div class="cart-item-info"><h4>' + item.name + '</h4>' +
        '<span class="item-price">$' + (item.price * item.qty).toFixed(2) + "</span>" +
        '<div class="cart-item-controls">' +
        '<button type="button" class="qty-btn" data-action="decrease" data-id="' + item.id + '">-</button>' +
        "<span>" + item.qty + "</span>" +
        '<button type="button" class="qty-btn" data-action="increase" data-id="' + item.id + '">+</button>' +
        '<button type="button" class="remove-btn" data-id="' + item.id + '"><i class="bx bx-trash"></i></button>' +
        "</div></div></div>"
    ).join("");

    cartTotalEl.textContent = "$" + cart.reduce((sum, item) => sum + item.price * item.qty, 0).toFixed(2);

    cartItemsEl.querySelectorAll(".qty-btn").forEach((btn) => {
        btn.addEventListener("click", () => {
            updateQty(Number(btn.dataset.id), btn.dataset.action === "increase" ? 1 : -1);
        });
    });
    cartItemsEl.querySelectorAll(".remove-btn").forEach((btn) => {
        btn.addEventListener("click", () => removeFromCart(Number(btn.dataset.id)));
    });
}

function clearCart() {
    cart = [];
    saveStorage(STORAGE_KEYS.cart, cart);
    updateBadges();
    renderCart();
    renderProducts();
    showToast("Cart cleared");
}

function toggleWishlist(productId) {
    const product = PRODUCTS.find((p) => p.id === productId);
    if (!product) return;

    const index = wishlist.findIndex((w) => w.id === productId);
    if (index >= 0) {
        wishlist.splice(index, 1);
        showToast(product.name + " removed from wishlist");
    } else {
        wishlist.push(product);
        showToast(product.name + " added to wishlist!", "success");
    }

    saveStorage(STORAGE_KEYS.wishlist, wishlist);
    updateBadges();
    renderWishlist();
    renderProducts(activeFilter, document.getElementById("search-input")?.value || "");
}

function renderWishlist() {
    if (wishlist.length === 0) {
        wishlistItemsEl.innerHTML = '<div class="empty-state"><i class="bx bx-heart"></i><p>Your wishlist is empty</p></div>';
        return;
    }

    wishlistItemsEl.innerHTML = wishlist.map((item) =>
        '<div class="wishlist-item" data-id="' + item.id + '">' +
        '<img src="' + item.image + '" alt="' + item.name + '">' +
        '<div class="wishlist-item-info"><h4>' + item.name + '</h4>' +
        '<span class="item-price">$' + item.price.toFixed(2) + '</span>' +
        '<button type="button" class="add-cart-btn" style="margin-top:8px;width:auto;padding:6px 14px" data-id="' + item.id + '">Add to Cart</button>' +
        '</div><button type="button" class="remove-btn" data-id="' + item.id + '"><i class="bx bx-x"></i></button></div>'
    ).join("");

    wishlistItemsEl.querySelectorAll(".add-cart-btn").forEach((btn) => {
        btn.addEventListener("click", () => addToCart(Number(btn.dataset.id)));
    });
    wishlistItemsEl.querySelectorAll(".remove-btn").forEach((btn) => {
        btn.addEventListener("click", () => toggleWishlist(Number(btn.dataset.id)));
    });
}

function updateBadges() {
    const cartQty = cart.reduce((sum, item) => sum + item.qty, 0);
    cartCountEl.textContent = cartQty;
    cartCountEl.style.display = cartQty > 0 ? "flex" : "none";
    wishlistCountEl.textContent = wishlist.length;
    wishlistCountEl.style.display = wishlist.length > 0 ? "flex" : "none";
}

function handleSearch(query) {
    renderProducts(activeFilter, query);
    const resultsEl = document.getElementById("search-results");
    const q = query.toLowerCase().trim();
    if (!q) {
        resultsEl.innerHTML = "";
        return;
    }

    const matches = PRODUCTS.filter((p) => p.name.toLowerCase().includes(q)).slice(0, 6);
    if (matches.length === 0) {
        resultsEl.innerHTML = '<p class="empty-state" style="padding:1rem">No results for "' + query + '"</p>';
        return;
    }

    resultsEl.innerHTML = matches.map((p) =>
        '<div class="search-result-item" data-id="' + p.id + '" role="button" tabindex="0">' +
        '<img src="' + p.image + '" alt="">' +
        '<div><strong>' + p.name + '</strong><p style="color:var(--primary);font-weight:600">$' + p.price.toFixed(2) + "</p></div></div>"
    ).join("");

    resultsEl.querySelectorAll(".search-result-item").forEach((el) => {
        el.addEventListener("click", () => {
            addToCart(Number(el.dataset.id));
            closeOverlay("search-overlay");
        });
    });
}

function openOverlay(id) {
    const overlay = document.getElementById(id);
    if (!overlay) return;
    overlay.hidden = false;
    requestAnimationFrame(() => overlay.classList.add("active"));
    document.body.style.overflow = "hidden";
}

function closeOverlay(id) {
    const overlay = document.getElementById(id);
    if (!overlay) return;
    overlay.classList.remove("active");
    document.body.style.overflow = "";
    setTimeout(() => { overlay.hidden = true; }, 300);
}

function showToast(message, type) {
    const toast = document.createElement("div");
    toast.className = "toast " + (type || "");
    toast.textContent = message;
    toastContainer.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = "0";
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function bindEvents() {
    window.addEventListener("scroll", () => {
        header.classList.toggle("sticky", window.scrollY > 0);
    });

    const menuIcon = document.getElementById("menu-icon");
    const navmenu = document.getElementById("navmenu");
    menuIcon?.addEventListener("click", () => {
        navmenu.classList.toggle("open");
        menuIcon.classList.toggle("active");
        menuIcon.setAttribute("aria-expanded", navmenu.classList.contains("open"));
    });

    document.querySelectorAll(".nav-link").forEach((link) => {
        link.addEventListener("click", () => {
            navmenu.classList.remove("open");
            menuIcon?.classList.remove("active");
            document.querySelectorAll(".nav-link").forEach((l) => l.classList.remove("active"));
            link.classList.add("active");
        });
    });

    document.getElementById("theme-toggle")?.addEventListener("click", toggleTheme);
    document.getElementById("cart-btn")?.addEventListener("click", () => openOverlay("cart-overlay"));
    document.getElementById("wishlist-btn")?.addEventListener("click", () => openOverlay("wishlist-overlay"));
    document.getElementById("search-btn")?.addEventListener("click", () => {
        openOverlay("search-overlay");
        document.getElementById("search-input")?.focus();
    });

    document.querySelectorAll("[data-close]").forEach((btn) => {
        btn.addEventListener("click", () => closeOverlay(btn.dataset.close));
    });

    document.querySelectorAll(".overlay").forEach((overlay) => {
        overlay.addEventListener("click", (e) => {
            if (e.target === overlay) closeOverlay(overlay.id);
        });
    });

    document.querySelectorAll(".filter-btn").forEach((btn) => {
        btn.addEventListener("click", () => {
            document.querySelectorAll(".filter-btn").forEach((b) => b.classList.remove("active"));
            btn.classList.add("active");
            renderProducts(btn.dataset.filter);
        });
    });

    document.getElementById("search-input")?.addEventListener("input", (e) => handleSearch(e.target.value));
    document.getElementById("clear-cart-btn")?.addEventListener("click", clearCart);
    document.getElementById("checkout-btn")?.addEventListener("click", () => {
        if (cart.length === 0) {
            showToast("Your cart is empty!");
            return;
        }
        showToast("Thank you! Order placed successfully.", "success");
        clearCart();
        closeOverlay("cart-overlay");
    });

    document.getElementById("subscribe-form")?.addEventListener("submit", (e) => {
        e.preventDefault();
        const email = document.getElementById("subscribe-email").value.trim();
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            showToast("Please enter a valid email address.");
            return;
        }
        showToast("Subscribed! Check your inbox for deals.", "success");
        e.target.reset();
    });

    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
            document.querySelectorAll(".overlay.active").forEach((o) => closeOverlay(o.id));
        }
    });
}
