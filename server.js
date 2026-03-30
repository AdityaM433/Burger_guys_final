/**
 * server.js — Main Express Server
 *
 * HOW TO START:
 *   1. Open terminal in the burger-guys folder
 *   2. Run: npm install       (first time only)
 *   3. Run: node server.js
 *   4. Open: http://localhost:3000
 */

const express = require('express');
const path    = require('path');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Middleware ────────────────────────────────────────────
// Parse incoming JSON bodies (needed for POST/PUT requests)
app.use(express.json());

// Serve everything inside public/ as static files
// e.g. GET /menu.html  →  sends public/menu.html
// e.g. GET /style.css  →  sends public/style.css
app.use(express.static(path.join(__dirname, 'public')));

// ── API Routes ────────────────────────────────────────────
const menuRoutes = require('./routes/menu');
const authRoutes = require('./routes/auth');

// All routes in routes/menu.js are mounted at /api/menu
// So router.get('/')      becomes GET  /api/menu
//    router.get('/:id')   becomes GET  /api/menu/5
//    router.post('/')     becomes POST /api/menu   ... etc.
app.use('/api/menu',  menuRoutes);

// Stats is a special sub-route inside menu — mount separately
app.get('/api/stats', (req, res, next) => {
  req.url = '/stats';
  menuRoutes(req, res, next);
});

// Auth routes: POST /api/signup  and  POST /api/login
app.use('/api', authRoutes);

// ── Catch-all: serve index.html for any unknown path ─────
// This means typing /menu or /login still loads the site
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ── Start listening ───────────────────────────────────────
app.listen(PORT, () => {
  console.log('\n🍔  Burger Guys server is running!');
  console.log(`    Visit → http://localhost:${PORT}`);
  console.log('    Press Ctrl+C to stop\n');
});
