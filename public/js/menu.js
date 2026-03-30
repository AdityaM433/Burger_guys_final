/**
 * js/menu.js — Menu Page: fetch, filter, cart, order
 *
 * CATEGORIES in the database (must match exactly!):
 *   Burger | Side | Drink | Combo | Dessert
 *
 * The filter pills in menu.html use data-cat="Burger" etc.
 * The backend returns items with category = "Burger" etc.
 * These MUST match — that was the bug before!
 */

// ─── State ────────────────────────────────────────────────
let allItems     = [];
let activeFilter = 'All';
let searchQuery  = '';
let cart         = [];    // array of { id, name, price, category, qty }

// ─── Emoji map (category → emoji) ────────────────────────
// Keys must EXACTLY match what the database stores
const CATEGORY_EMOJI = {
  'Burger':  '🍔',
  'Side':    '🍟',
  'Drink':   '🥤',
  'Combo':   '🎁',
  'Dessert': '🍦',
};

// These item names get a 🔥 Popular badge
const POPULAR = ['Double Smash Stack', 'The Classic Guy', 'Spicy Diablo', 'Classic Milkshake', 'BBQ Smokehouse'];

// ─── DOM shortcuts ────────────────────────────────────────
const menuGrid    = document.getElementById('menuGrid');
const emptyState  = document.getElementById('emptyState');
const itemCount   = document.getElementById('itemCount');
const searchInput = document.getElementById('menuSearch');
const cartDrawer  = document.getElementById('cartDrawer');
const cartOverlay = document.getElementById('cartOverlay');
const cartNavBtn  = document.getElementById('cartNavBtn');
const cartNavCount= document.getElementById('cartNavCount');
const cartItems   = document.getElementById('cartItems');
const cartEmpty   = document.getElementById('cartEmpty');
const cartFooter  = document.getElementById('cartFooter');
const modalOverlay= document.getElementById('modalOverlay');

// ════════════════════════════════════════════════════════
// FETCH MENU FROM BACKEND
// ════════════════════════════════════════════════════════
async function loadMenu() {
  try {
    const response = await fetch('/api/menu');
    if (!response.ok) throw new Error(`Server error: ${response.status}`);
    allItems = await response.json();
    renderCards();
  } catch (err) {
    menuGrid.innerHTML = `
      <div class="empty-state" style="display:block;grid-column:1/-1">
        <div class="empty-icon">⚠️</div>
        <h3>Could not load menu</h3>
        <p>${err.message}</p>
        <p style="margin-top:10px;font-size:.8rem;color:var(--text-dim)">
          Make sure <code>node server.js</code> is running
        </p>
      </div>`;
    itemCount.textContent = '';
  }
}

// ════════════════════════════════════════════════════════
// RENDER MENU CARDS
// ════════════════════════════════════════════════════════
function renderCards() {
  // Filter by category AND search text
  const filtered = allItems.filter(item => {
    const matchCat    = activeFilter === 'All' || item.category === activeFilter;
    const matchSearch = item.name.toLowerCase().includes(searchQuery) ||
                        item.category.toLowerCase().includes(searchQuery);
    return matchCat && matchSearch;
  });

  itemCount.textContent = `Showing ${filtered.length} item${filtered.length !== 1 ? 's' : ''}`;
  emptyState.style.display = filtered.length === 0 ? 'block' : 'none';
  menuGrid.innerHTML = '';

  filtered.forEach(item => {
    const emoji     = CATEGORY_EMOJI[item.category] || '🍽';
    const isPopular = POPULAR.includes(item.name);
    const price     = `$${parseFloat(item.price).toFixed(2)}`;
    // Sanitize category name for CSS class (remove spaces)
    const catClass  = item.category.replace(/\s+/g, '');

    menuGrid.insertAdjacentHTML('beforeend', `
      <div class="menu-full-card">
        ${isPopular ? '<span class="badge-popular">🔥 Popular</span>' : ''}
        <div class="card-emoji">${emoji}</div>
        <div class="card-name">${escHtml(item.name)}</div>
        <div class="card-price">${price}</div>
        <span class="card-badge badge-${catClass}">${escHtml(item.category)}</span>
        <button
          class="card-add-btn"
          data-id="${item.id}"
          data-name="${escHtml(item.name)}"
          data-price="${item.price}"
          data-cat="${escHtml(item.category)}"
        >+ Add to Cart</button>
      </div>`);
  });
}

// ════════════════════════════════════════════════════════
// FILTER PILLS
// ════════════════════════════════════════════════════════
document.getElementById('filterPills').addEventListener('click', e => {
  const pill = e.target.closest('.pill');
  if (!pill) return;
  activeFilter = pill.dataset.cat;
  document.querySelectorAll('.pill').forEach(p => p.classList.toggle('active', p === pill));
  renderCards();
});

// ════════════════════════════════════════════════════════
// SEARCH
// ════════════════════════════════════════════════════════
searchInput.addEventListener('input', () => {
  searchQuery = searchInput.value.toLowerCase().trim();
  renderCards();
});

// ════════════════════════════════════════════════════════
// CART — Add item (event delegation on grid)
// ════════════════════════════════════════════════════════
menuGrid.addEventListener('click', e => {
  const btn = e.target.closest('.card-add-btn');
  if (!btn) return;

  const id    = parseInt(btn.dataset.id);
  const name  = btn.dataset.name;
  const price = parseFloat(btn.dataset.price);
  const cat   = btn.dataset.cat;

  // Check if item is already in cart
  const existing = cart.find(c => c.id === id);
  if (existing) {
    existing.qty++;             // just increase quantity
  } else {
    cart.push({ id, name, price, cat, qty: 1 });
  }

  // Visual feedback on the button
  btn.textContent = '✔ Added!';
  btn.style.background = '#4caf50';
  setTimeout(() => {
    btn.textContent = '+ Add to Cart';
    btn.style.background = '';
  }, 1000);

  updateCartUI();
  openCart();
});

// ════════════════════════════════════════════════════════
// CART — Open / Close
// ════════════════════════════════════════════════════════
function openCart() {
  cartDrawer.classList.add('open');
  cartOverlay.classList.add('open');
  document.body.style.overflow = 'hidden'; // prevent background scroll
}
function closeCart() {
  cartDrawer.classList.remove('open');
  cartOverlay.classList.remove('open');
  document.body.style.overflow = '';
}

cartNavBtn.addEventListener('click', openCart);
cartOverlay.addEventListener('click', closeCart);
document.getElementById('cartClose').addEventListener('click', closeCart);

// ════════════════════════════════════════════════════════
// CART — Update UI (re-render cart items + totals)
// ════════════════════════════════════════════════════════
function updateCartUI() {
  // Update the count bubble on the navbar button
  const totalQty = cart.reduce((sum, c) => sum + c.qty, 0);
  cartNavCount.textContent = totalQty;

  // Show/hide empty message and footer
  cartEmpty.style.display  = cart.length === 0 ? 'block' : 'none';
  cartFooter.style.display = cart.length === 0 ? 'none'  : 'flex';

  // Re-render cart item rows
  // First remove old rows (keep the cartEmpty div)
  document.querySelectorAll('.cart-item').forEach(el => el.remove());

  cart.forEach(item => {
    const emoji = CATEGORY_EMOJI[item.cat] || '🍽';
    const rowEl = document.createElement('div');
    rowEl.className = 'cart-item';
    rowEl.innerHTML = `
      <div class="cart-item-emoji">${emoji}</div>
      <div class="cart-item-info">
        <div class="cart-item-name">${escHtml(item.name)}</div>
        <div class="cart-item-price">$${(item.price * item.qty).toFixed(2)}</div>
      </div>
      <div class="cart-item-qty">
        <button class="qty-btn" data-id="${item.id}" data-action="dec">−</button>
        <span class="qty-val">${item.qty}</span>
        <button class="qty-btn" data-id="${item.id}" data-action="inc">+</button>
      </div>`;
    cartItems.appendChild(rowEl);
  });

  // Calculate totals
  const subtotal = cart.reduce((sum, c) => sum + c.price * c.qty, 0);
  const tax      = subtotal * 0.08;
  const total    = subtotal + tax;
  document.getElementById('cartSubtotal').textContent = `$${subtotal.toFixed(2)}`;
  document.getElementById('cartTax').textContent      = `$${tax.toFixed(2)}`;
  document.getElementById('cartTotal').textContent    = `$${total.toFixed(2)}`;
}

// ════════════════════════════════════════════════════════
// CART — Quantity buttons (+ / −)
// ════════════════════════════════════════════════════════
cartItems.addEventListener('click', e => {
  const btn = e.target.closest('.qty-btn');
  if (!btn) return;

  const id     = parseInt(btn.dataset.id);
  const action = btn.dataset.action;
  const item   = cart.find(c => c.id === id);
  if (!item) return;

  if (action === 'inc') {
    item.qty++;
  } else if (action === 'dec') {
    item.qty--;
    if (item.qty <= 0) {
      // Remove from cart if qty reaches 0
      cart = cart.filter(c => c.id !== id);
    }
  }
  updateCartUI();
});

// ════════════════════════════════════════════════════════
// ORDER — Place Order (fake — no real payment)
// ════════════════════════════════════════════════════════
document.getElementById('checkoutBtn').addEventListener('click', () => {
  if (cart.length === 0) return;

  // Generate a random order number like #BG-4821
  const orderNum = `#BG-${Math.floor(1000 + Math.random() * 9000)}`;

  // Build the order summary rows
  const subtotal = cart.reduce((sum, c) => sum + c.price * c.qty, 0);
  const tax      = subtotal * 0.08;
  const total    = subtotal + tax;

  let rowsHTML = cart.map(item => `
    <div class="order-detail-row">
      <span>${CATEGORY_EMOJI[item.cat] || '🍽'} ${escHtml(item.name)} × ${item.qty}</span>
      <span>$${(item.price * item.qty).toFixed(2)}</span>
    </div>`).join('');

  rowsHTML += `
    <div class="order-detail-row total-row">
      <span>Total (incl. tax)</span>
      <span>$${total.toFixed(2)}</span>
    </div>`;

  document.getElementById('orderDetails').innerHTML = rowsHTML;

  // Close cart, show modal
  closeCart();
  modalOverlay.style.display = 'flex';

  // Clear the cart
  cart = [];
  updateCartUI();
});

// Close modal when "Back to Menu" clicked
document.getElementById('modalCloseBtn').addEventListener('click', () => {
  modalOverlay.style.display = 'none';
});
// Also close if user clicks outside the modal box
modalOverlay.addEventListener('click', e => {
  if (e.target === modalOverlay) modalOverlay.style.display = 'none';
});

// ════════════════════════════════════════════════════════
// MOBILE NAV TOGGLE
// ════════════════════════════════════════════════════════
document.getElementById('navToggle').addEventListener('click', () => {
  document.getElementById('navLinks').classList.toggle('open');
});

// ════════════════════════════════════════════════════════
// UTILITY — Escape HTML (security: prevent XSS)
// ════════════════════════════════════════════════════════
function escHtml(str) {
  return String(str)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ════════════════════════════════════════════════════════
// BOOT
// ════════════════════════════════════════════════════════
loadMenu();
