/**
 * js/feedback.js — Feedback Page JavaScript
 *
 * What this file does:
 * 1. Checks if the user is logged in (reads from localStorage)
 *    → If NOT logged in: redirects to login.html
 *    → If logged in: shows their name in the welcome banner
 *
 * 2. Star rating system
 *    → Hover: stars light up as you move the mouse
 *    → Click: locks the rating in
 *    → Shows a text label (e.g. "Amazing! 🔥")
 *
 * 3. Visit type pills (Dine In / Takeout / Delivery)
 *    → Click one to select it (highlighted in yellow)
 *
 * 4. Character counter for the textarea
 *    → Counts live as user types (max 500)
 *
 * 5. Form submission
 *    → Validates: needs a rating AND feedback text
 *    → Saves to localStorage (key: "feedback_<userId>_<timestamp>")
 *    → Shows success message
 *    → Resets the form
 *
 * 6. Shows all past feedback the user has submitted
 *    → Reads all matching keys from localStorage
 *    → Displays as review cards at the bottom
 */

// ─── Step 1: Check login ──────────────────────────────────────────────────
// We stored the user in localStorage when they logged in
// (see js/auth.js — localStorage.setItem('bgUser', ...))
const storedUser = localStorage.getItem('bgUser');
const user = storedUser ? JSON.parse(storedUser) : null;

// If not logged in, send them to the login page
if (!user) {
  window.location.href = '/login.html';
}

// ─── DOM shortcuts ────────────────────────────────────────────────────────
const welcomeBanner  = document.getElementById('welcomeBanner');
const starRow        = document.getElementById('starRow');
const stars          = document.querySelectorAll('.star');
const ratingLabel    = document.getElementById('ratingLabel');
const visitPills     = document.querySelectorAll('.visit-pill');
const feedbackText   = document.getElementById('feedbackText');
const charCount      = document.getElementById('charCount');
const feedbackForm   = document.getElementById('feedbackForm');
const feedbackMsg    = document.getElementById('feedbackMsg');
const submitBtn      = document.getElementById('submitBtn');
const pastSection    = document.getElementById('pastFeedbackSection');
const pastList       = document.getElementById('pastFeedbackList');

// ─── State ────────────────────────────────────────────────────────────────
let currentRating  = 0;      // 0 = nothing selected yet
let selectedVisit  = '';     // 'Dine In', 'Takeout', or 'Delivery'

// Labels and emojis that match each star rating
const RATING_LABELS = {
  1: 'Terrible 😤',
  2: 'Not great 😕',
  3: 'It was okay 😐',
  4: 'Pretty good 😊',
  5: 'Amazing! 🔥',
};

// ─── Step 2: Show welcome banner ──────────────────────────────────────────
if (user) {
  welcomeBanner.innerHTML = `
    <div class="welcome-bar">
      👋 Welcome back, <strong>${escHtml(user.name)}</strong>!
      You're leaving a review as ${escHtml(user.email)}.
      &nbsp;·&nbsp; <a href="login.html">Not you?</a>
    </div>`;
}

// ─── Step 3: Mobile nav toggle ────────────────────────────────────────────
document.getElementById('navToggle').addEventListener('click', () => {
  document.getElementById('navLinks').classList.toggle('open');
});

// ════════════════════════════════════════════════════════
// STAR RATING
// ════════════════════════════════════════════════════════

/**
 * paintStars(n)
 * Highlights the first n stars in yellow.
 * Used for both hover preview and locked rating.
 */
function paintStars(n) {
  stars.forEach((star, i) => {
    star.classList.remove('selected', 'hovered');
    if (i < n) {
      // If we have a locked rating use 'selected' (stays yellow),
      // otherwise use 'hovered' (orange preview)
      star.classList.add(currentRating > 0 ? 'selected' : 'hovered');
    }
  });
}

/**
 * lockStars()
 * Re-paints stars to show only the locked (currentRating) selection.
 */
function lockStars() {
  stars.forEach((star, i) => {
    star.classList.remove('selected', 'hovered');
    if (i < currentRating) star.classList.add('selected');
  });
}

// Hover over a star → light up stars up to that one
starRow.addEventListener('mouseover', e => {
  const star = e.target.closest('.star');
  if (!star) return;
  const val = parseInt(star.dataset.val);
  paintStars(val);
  ratingLabel.textContent = RATING_LABELS[val] || '';
  ratingLabel.classList.add('rated');
});

// Mouse leaves the row → go back to the locked selection
starRow.addEventListener('mouseleave', () => {
  lockStars();
  if (currentRating > 0) {
    ratingLabel.textContent = RATING_LABELS[currentRating];
    ratingLabel.classList.add('rated');
  } else {
    ratingLabel.textContent = 'Click a star to rate';
    ratingLabel.classList.remove('rated');
  }
});

// Click a star → lock in the rating
starRow.addEventListener('click', e => {
  const star = e.target.closest('.star');
  if (!star) return;
  currentRating = parseInt(star.dataset.val);
  lockStars();
  ratingLabel.textContent = RATING_LABELS[currentRating];
  ratingLabel.classList.add('rated');

  // Clear the error if user had tried to submit without a rating
  document.getElementById('rating-err').textContent = '';
});

// ════════════════════════════════════════════════════════
// VISIT TYPE PILLS
// ════════════════════════════════════════════════════════
visitPills.forEach(pill => {
  pill.addEventListener('click', () => {
    // Remove active from all, add to clicked
    visitPills.forEach(p => p.classList.remove('active'));
    pill.classList.add('active');
    selectedVisit = pill.dataset.type;
  });
});

// ════════════════════════════════════════════════════════
// CHARACTER COUNTER
// ════════════════════════════════════════════════════════
feedbackText.addEventListener('input', () => {
  const len = feedbackText.value.length;
  charCount.textContent = len;
  // Turn red when approaching the limit
  charCount.style.color = len > 450 ? '#e87065' : '';
});

// ════════════════════════════════════════════════════════
// FORM SUBMISSION
// ════════════════════════════════════════════════════════
feedbackForm.addEventListener('submit', e => {
  e.preventDefault();   // stop browser from refreshing

  // Clear old errors
  hideMsg();
  document.getElementById('rating-err').textContent   = '';
  document.getElementById('feedback-err').textContent = '';

  const text = feedbackText.value.trim();

  // ── Validate ───────────────────────────────────────────
  let valid = true;

  if (currentRating === 0) {
    document.getElementById('rating-err').textContent = 'Please select a star rating.';
    valid = false;
  }
  if (!text) {
    feedbackText.classList.add('err');
    document.getElementById('feedback-err').textContent = 'Please write some feedback.';
    valid = false;
  } else {
    feedbackText.classList.remove('err');
  }

  if (!valid) return;

  // ── Build the feedback object ──────────────────────────
  const feedbackData = {
    user_id:   user.id,
    name:      user.name,
    email:     user.email,
    rating:    currentRating,
    visit:     selectedVisit || 'Not specified',
    feedback:  text,
    date:      new Date().toLocaleDateString('en-US', {
                 year: 'numeric', month: 'short', day: 'numeric'
               }),
  };

  // ── Save to localStorage ───────────────────────────────
  // Key format: "feedback_<userId>_<timestamp>"
  // Using a timestamp means the same user can leave MULTIPLE reviews
  const key = `feedback_${user.id}_${Date.now()}`;
  localStorage.setItem(key, JSON.stringify(feedbackData));

  // ── Show success ───────────────────────────────────────
  showMsg(`✔ Thank you, ${user.name}! Your feedback has been submitted.`, 'success');

  // ── Reset the form ─────────────────────────────────────
  currentRating = 0;
  selectedVisit = '';
  lockStars();
  ratingLabel.textContent = 'Click a star to rate';
  ratingLabel.classList.remove('rated');
  visitPills.forEach(p => p.classList.remove('active'));
  feedbackText.value = '';
  charCount.textContent = '0';

  // ── Refresh the past feedback list ────────────────────
  renderPastFeedback();

  // Scroll up to see the success message
  feedbackMsg.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
});

// ════════════════════════════════════════════════════════
// PAST FEEDBACK
// Read all feedback saved by this user from localStorage
// and display them as cards below the form.
// ════════════════════════════════════════════════════════
function renderPastFeedback() {
  if (!user) return;

  // Find all localStorage keys that belong to this user
  const userFeedback = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    // Our keys look like: feedback_<userId>_<timestamp>
    if (key && key.startsWith(`feedback_${user.id}_`)) {
      try {
        const data = JSON.parse(localStorage.getItem(key));
        if (data) userFeedback.push({ key, ...data });
      } catch (e) { /* skip bad data */ }
    }
  }

  // Sort newest first (key contains timestamp at the end)
  userFeedback.sort((a, b) => {
    const tsA = parseInt(a.key.split('_').pop()) || 0;
    const tsB = parseInt(b.key.split('_').pop()) || 0;
    return tsB - tsA;
  });

  if (userFeedback.length === 0) {
    pastSection.style.display = 'none';
    return;
  }

  // Show the section and fill the list
  pastSection.style.display = 'block';
  pastList.innerHTML = '';

  userFeedback.forEach(item => {
    // Build a row of filled/empty stars
    const starsHTML = Array.from({ length: 5 }, (_, i) =>
      `<span style="color:${i < item.rating ? '#f5c300' : '#2a2a2a'}">★</span>`
    ).join('');

    const card = document.createElement('div');
    card.className = 'past-feedback-card';
    card.innerHTML = `
      <div class="pf-stars">${starsHTML}</div>
      <div class="pf-body">
        <div class="pf-meta">
          ${item.visit && item.visit !== 'Not specified'
            ? `<span class="pf-visit">${escHtml(item.visit)}</span>`
            : ''}
          <span class="pf-date">${escHtml(item.date || '')}</span>
        </div>
        <div class="pf-text">"${escHtml(item.feedback)}"</div>
      </div>`;
    pastList.appendChild(card);
  });
}

// ════════════════════════════════════════════════════════
// HELPERS
// ════════════════════════════════════════════════════════
function showMsg(msg, type) {
  feedbackMsg.textContent  = msg;
  feedbackMsg.className    = 'feedback-msg ' + type;
  feedbackMsg.style.display = '';
}
function hideMsg() {
  feedbackMsg.style.display = 'none';
}

// Prevent XSS — always escape user data before inserting into HTML
function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ════════════════════════════════════════════════════════
// BOOT — Load past feedback on page load
// ════════════════════════════════════════════════════════
renderPastFeedback();
