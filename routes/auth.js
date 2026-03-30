/**
 * routes/auth.js — Authentication API Routes
 *
 * Handles:
 *   POST /api/signup — create a new user account
 *   POST /api/login  — check credentials and log in
 *
 * Security:
 *   - Passwords are NEVER stored as plain text
 *   - We use bcrypt to "hash" the password
 *   - A hash is a one-way transformation: you can't reverse it
 *   - When logging in, bcrypt compares the entered password to the stored hash
 */

const express = require('express');
const router  = express.Router();
const bcrypt  = require('bcrypt');
const pool    = require('../db');

// bcrypt "salt rounds" — how many times to scramble the password.
// Higher = more secure but slower. 10 is a good balance.
const SALT_ROUNDS = 10;

// ════════════════════════════════════════════════════════
// POST /api/signup — Create a new user
// ════════════════════════════════════════════════════════
/**
 * Expected request body: { name, email, password }
 * What happens:
 * 1. Validate the input
 * 2. Check if email is already taken
 * 3. Hash the password with bcrypt
 * 4. Insert the new user into the database
 * 5. Return success (but NOT the password hash!)
 */
router.post('/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // ── Validation ──────────────────────────────────────
    if (!name || String(name).trim() === '') {
      return res.status(400).json({ error: 'Name is required.' });
    }
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      return res.status(400).json({ error: 'Valid email is required.' });
    }
    if (!password || password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }

    // ── Check if email already exists ───────────────────
    const existing = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email.toLowerCase()]
    );
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'That email is already registered.' });
    }

    // ── Hash the password ────────────────────────────────
    // bcrypt.hash() takes the plain text password and returns a hash
    // Example: "burger123" → "$2b$10$abc123xyz..." (60 char string)
    const hash = await bcrypt.hash(password, SALT_ROUNDS);

    // ── Insert into database ─────────────────────────────
    const result = await pool.query(
      'INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id, name, email',
      [name.trim(), email.toLowerCase(), hash]
    );

    // Return the new user (without the password hash!)
    res.status(201).json({
      message: 'Account created successfully!',
      user: result.rows[0],
    });

  } catch (err) {
    console.error('POST /api/signup error:', err.message);
    res.status(500).json({ error: 'Signup failed. Please try again.' });
  }
});

// ════════════════════════════════════════════════════════
// POST /api/login — Verify credentials
// ════════════════════════════════════════════════════════
/**
 * Expected request body: { email, password }
 * What happens:
 * 1. Find the user by email
 * 2. Use bcrypt.compare() to check the password
 * 3. If correct, return user info (NOT the password hash)
 * 4. If wrong, return a generic error (don't reveal which field was wrong)
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // ── Validation ──────────────────────────────────────
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    // ── Find user by email ───────────────────────────────
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    const user = result.rows[0];

    // If no user found, return a GENERIC error message
    // (We don't say "email not found" — that would let hackers probe for valid emails)
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // ── Check password ───────────────────────────────────
    // bcrypt.compare() returns true if the password matches the hash
    const passwordMatches = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatches) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // ── Login successful ─────────────────────────────────
    res.json({
      message: 'Login successful!',
      user: {
        id:    user.id,
        name:  user.name,
        email: user.email,
      },
      // Note: In a real app you'd return a JWT token here.
      // For this university project, we just return user info
      // and store it in localStorage on the frontend.
    });

  } catch (err) {
    console.error('POST /api/login error:', err.message);
    res.status(500).json({ error: 'Login failed. Please try again.' });
  }
});

module.exports = router;
