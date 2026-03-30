/**
 * routes/menu.js — Menu API Routes
 *
 * This file handles all API requests that start with /api/menu.
 * Express "Router" lets us split routes into separate files
 * instead of putting everything in server.js.
 *
 * Routes defined here:
 *   GET  /api/menu         — get all menu items
 *   GET  /api/menu/:id     — get one menu item by ID
 *   GET  /api/stats        — get dashboard statistics
 */

const express = require('express');
const router  = express.Router();    // create a mini-app for these routes
const pool    = require('../db');    // our database connection

// ════════════════════════════════════════════════════════
// GET /api/menu — Return ALL menu items as JSON
// ════════════════════════════════════════════════════════
/**
 * This is the main route that menu.html calls.
 * It runs: SELECT * FROM menu ORDER BY category, name
 * and returns the rows as a JSON array.
 */
router.get('/', async (req, res) => {
  try {
    // Run a SQL query to get all items
    // $1, $2 etc. are "parameterized query" placeholders (prevents SQL injection)
    // Here we don't need parameters — just SELECT everything
    const result = await pool.query(
      'SELECT * FROM menu ORDER BY category, name'
    );

    // result.rows is an array of objects like:
    // [ { id:1, name:"...", price:"9.99", category:"Burger", created_at: ... }, … ]
    res.json(result.rows);

  } catch (err) {
    // If anything goes wrong, send a 500 (Internal Server Error) response
    console.error('GET /api/menu error:', err.message);
    res.status(500).json({ error: 'Failed to fetch menu items.' });
  }
});

// ════════════════════════════════════════════════════════
// GET /api/stats — Dashboard statistics
// ════════════════════════════════════════════════════════
/**
 * Used by the admin dashboard (Fresco e Gusto manager).
 * Returns counts, averages, etc.
 */
router.get('/stats', async (req, res) => {
  try {
    // Run 5 queries at the same time using Promise.all (faster than one by one)
    const [totalQ, avgQ, catsQ, expensiveQ, cheapQ] = await Promise.all([
      pool.query('SELECT COUNT(*) FROM menu'),
      pool.query('SELECT ROUND(AVG(price)::numeric, 2) AS avg FROM menu'),
      pool.query('SELECT category, COUNT(*) AS count FROM menu GROUP BY category ORDER BY category'),
      pool.query('SELECT name, price FROM menu ORDER BY price DESC LIMIT 1'),
      pool.query('SELECT name, price FROM menu ORDER BY price ASC  LIMIT 1'),
    ]);

    res.json({
      total:        parseInt(totalQ.rows[0].count),
      avgPrice:     parseFloat(avgQ.rows[0].avg || 0),
      categories:   catsQ.rows,
      mostExpensive: expensiveQ.rows[0] || null,
      cheapest:      cheapQ.rows[0]     || null,
    });

  } catch (err) {
    console.error('GET /api/stats error:', err.message);
    res.status(500).json({ error: 'Failed to fetch stats.' });
  }
});

// ════════════════════════════════════════════════════════
// GET /api/menu/:id — Get ONE item by ID
// ════════════════════════════════════════════════════════
/**
 * :id is a URL parameter — e.g. /api/menu/5 would have req.params.id = "5"
 */
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM menu WHERE id = $1',
      [req.params.id]    // ← $1 is replaced by this value safely
    );

    if (result.rows.length === 0) {
      // No item found with this ID
      return res.status(404).json({ error: 'Item not found.' });
    }

    res.json(result.rows[0]);

  } catch (err) {
    console.error('GET /api/menu/:id error:', err.message);
    res.status(500).json({ error: 'Failed to fetch item.' });
  }
});

// ════════════════════════════════════════════════════════
// POST /api/menu — Create a new menu item
// ════════════════════════════════════════════════════════
/**
 * Request body must be JSON: { name, price, category }
 * Returns the newly created item.
 */
router.post('/', async (req, res) => {
  try {
    const { name, price, category } = req.body;

    // ── Server-side validation ──────────────────────────
    if (!name || String(name).trim() === '') {
      return res.status(400).json({ error: 'Name is required.' });
    }
    if (!price || isNaN(price) || Number(price) < 0) {
      return res.status(400).json({ error: 'Price must be a non-negative number.' });
    }
    const validCats = ['Burger', 'Side', 'Drink', 'Combo', 'Dessert',
                       'Starter', 'Main Course', 'Drinks'];
    if (!validCats.includes(category)) {
      return res.status(400).json({ error: `Invalid category.` });
    }

    // ── Insert into database ────────────────────────────
    const result = await pool.query(
      'INSERT INTO menu (name, price, category) VALUES ($1, $2, $3) RETURNING *',
      [name.trim(), parseFloat(price), category]
    );

    // 201 = "Created" (standard HTTP status for new resources)
    res.status(201).json(result.rows[0]);

  } catch (err) {
    console.error('POST /api/menu error:', err.message);
    res.status(500).json({ error: 'Failed to create item.' });
  }
});

// ════════════════════════════════════════════════════════
// PUT /api/menu/:id — Update an existing menu item
// ════════════════════════════════════════════════════════
router.put('/:id', async (req, res) => {
  try {
    const { name, price, category } = req.body;

    const result = await pool.query(
      'UPDATE menu SET name=$1, price=$2, category=$3 WHERE id=$4 RETURNING *',
      [name.trim(), parseFloat(price), category, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Item not found.' });
    }

    res.json(result.rows[0]);

  } catch (err) {
    console.error('PUT /api/menu/:id error:', err.message);
    res.status(500).json({ error: 'Failed to update item.' });
  }
});

// ════════════════════════════════════════════════════════
// DELETE /api/menu/:id — Delete a menu item
// ════════════════════════════════════════════════════════
router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM menu WHERE id=$1 RETURNING id',
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Item not found.' });
    }

    res.json({ message: 'Deleted', id: parseInt(req.params.id) });

  } catch (err) {
    console.error('DELETE /api/menu/:id error:', err.message);
    res.status(500).json({ error: 'Failed to delete item.' });
  }
});

module.exports = router;
