/**
 * js/auth.js — Login & Signup page JavaScript
 *
 * Used on BOTH login.html and signup.html.
 * Detects which page it's on by checking which form exists.
 *
 * Flow:
 *   1. User fills the form and clicks submit
 *   2. We validate the fields (check they're not empty etc.)
 *   3. We send JSON to the backend via fetch()
 *   4. We show a success or error message
 *   5. On success we redirect to the right page
 */

// ─── DOM shortcuts ────────────────────────────────────────
const loginForm  = document.getElementById('loginForm');
const signupForm = document.getElementById('signupForm');
const authMsg    = document.getElementById('authMsg');

// Mobile nav toggle
document.getElementById('navToggle').addEventListener('click', () => {
  document.getElementById('navLinks').classList.toggle('open');
});

// ════════════════════════════════════════════════════════
// HELPERS
// ════════════════════════════════════════════════════════

/** Show red error text under a specific field */
function showErr(fieldId, msg) {
  const input = document.getElementById(fieldId);
  const span  = document.getElementById(fieldId + '-err');
  if (input) input.classList.add('err');
  if (span)  span.textContent = msg;
}

/** Remove all field errors */
function clearErrors() {
  ['name', 'email', 'password'].forEach(id => {
    const input = document.getElementById(id);
    const span  = document.getElementById(id + '-err');
    if (input) input.classList.remove('err');
    if (span)  span.textContent = '';
  });
}

/** Show the big banner message at top */
function showMsg(msg, type) {   // type = 'success' or 'error'
  authMsg.textContent  = msg;
  authMsg.className    = 'auth-msg ' + type;
  authMsg.style.display = '';
  // Scroll to top of card so user sees the message
  authMsg.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

/** Hide the banner */
function hideMsg() { authMsg.style.display = 'none'; }

// ════════════════════════════════════════════════════════
// LOGIN FORM (only runs on login.html)
// ════════════════════════════════════════════════════════
if (loginForm) {
  loginForm.addEventListener('submit', async function(e) {
    e.preventDefault();   // stop page refresh
    clearErrors();
    hideMsg();

    const email    = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    // Client-side check — don't even call server if fields are empty
    let ok = true;
    if (!email)    { showErr('email',    'Please enter your email.');    ok = false; }
    if (!password) { showErr('password', 'Please enter your password.'); ok = false; }
    if (!ok) return;

    // Disable button while waiting for server
    const btn = document.getElementById('submitBtn');
    btn.textContent = 'Logging in…';
    btn.disabled    = true;

    try {
      // POST /api/login  →  send { email, password } as JSON
      const res  = await fetch('/api/login', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email, password }),
      });

      // Parse the JSON response from the server
      const data = await res.json();

      if (!res.ok) {
        // Server said something went wrong (wrong password etc.)
        showMsg('❌ ' + (data.error || 'Login failed.'), 'error');
      } else {
        // Success!
        showMsg('✔ Login successful! Redirecting…', 'success');
        // Save user info so other pages can show their name
        localStorage.setItem('bgUser', JSON.stringify(data.user));
        // Go to home page after a short delay
        setTimeout(() => { window.location.href = 'index.html'; }, 1200);
      }

    } catch (err) {
      // This runs if the server is not running at all
      showMsg('❌ Cannot reach server. Is "node server.js" running?', 'error');
    } finally {
      btn.textContent = 'Log In →';
      btn.disabled    = false;
    }
  });
}

// ════════════════════════════════════════════════════════
// SIGNUP FORM (only runs on signup.html)
// ════════════════════════════════════════════════════════
if (signupForm) {
  signupForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    clearErrors();
    hideMsg();

    const name     = document.getElementById('name').value.trim();
    const email    = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    // Client-side validation
    let ok = true;
    if (!name)               { showErr('name',     'Please enter your name.');          ok = false; }
    if (!email)              { showErr('email',    'Please enter your email.');          ok = false; }
    if (!/\S+@\S+\.\S+/.test(email)) { showErr('email', 'Enter a valid email address.'); ok = false; }
    if (password.length < 6) { showErr('password', 'Password must be at least 6 characters.'); ok = false; }
    if (!ok) return;

    const btn = document.getElementById('submitBtn');
    btn.textContent = 'Creating account…';
    btn.disabled    = true;

    try {
      // POST /api/signup  →  send { name, email, password } as JSON
      const res  = await fetch('/api/signup', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ name, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        showMsg('❌ ' + (data.error || 'Signup failed.'), 'error');
      } else {
        showMsg('✔ Account created! Redirecting to login…', 'success');
        signupForm.reset();
        setTimeout(() => { window.location.href = 'login.html'; }, 1500);
      }

    } catch (err) {
      showMsg('❌ Cannot reach server. Is "node server.js" running?', 'error');
    } finally {
      btn.textContent = 'Create Account →';
      btn.disabled    = false;
    }
  });
}
