/**
 * main.js — Home page JavaScript
 *
 * Handles:
 * 1. Navbar scroll effect (transparent → solid)
 * 2. Mobile hamburger menu
 * 3. User avatar — shows logged-in user's initial in navbar
 *    (reads from localStorage, same place auth.js saves it)
 */

// ─── 1. Navbar scroll effect ──────────────────────────────
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 60);
});

// ─── 2. Mobile nav toggle ─────────────────────────────────
const navToggle = document.getElementById('navToggle');
const navLinks  = document.getElementById('navLinks');
navToggle.addEventListener('click', () => {
  navLinks.classList.toggle('open');
});
navLinks.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => navLinks.classList.remove('open'));
});

// ─── 3. User avatar (login state) ─────────────────────────
/**
 * When the user logs in via login.html, auth.js saves:
 *   localStorage.setItem('bgUser', JSON.stringify({ id, name, email }))
 *
 * Here we read that data and:
 *   - Hide the "Login" button
 *   - Show a yellow circle with the user's first initial
 *   - Show a dropdown with their name + logout button
 */
const navLoginBtn   = document.getElementById('navLoginBtn');
const navAvatar     = document.getElementById('navAvatar');
const avatarInitial = document.getElementById('avatarInitial');
const avatarName    = document.getElementById('avatarName');
const logoutBtn     = document.getElementById('logoutBtn');

function updateNavForLoginState() {
  const stored = localStorage.getItem('bgUser');
  if (!stored) {
    // Not logged in — show the Login button, hide the avatar
    navLoginBtn.style.display = '';
    navAvatar.style.display   = 'none';
    return;
  }

  try {
    const user = JSON.parse(stored);

    // Get the first letter of their name, uppercase
    // e.g. "john doe" → "J"
    const initial = (user.name || '?').trim().charAt(0).toUpperCase();

    // Fill in the avatar
    avatarInitial.textContent = initial;
    avatarName.textContent    = user.name;    // shown in dropdown

    // Show avatar, hide login button
    navLoginBtn.style.display = 'none';
    navAvatar.style.display   = '';

  } catch (e) {
    // Bad data in localStorage — treat as logged out
    localStorage.removeItem('bgUser');
    navLoginBtn.style.display = '';
    navAvatar.style.display   = 'none';
  }
}

// Run on page load
updateNavForLoginState();

// Logout: remove the stored user, refresh the nav state
logoutBtn.addEventListener('click', () => {
  localStorage.removeItem('bgUser');
  updateNavForLoginState();
  // Redirect to home so nothing looks broken
  window.location.href = 'index.html';
});
