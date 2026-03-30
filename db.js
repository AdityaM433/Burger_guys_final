/**
 * db.js — PostgreSQL Database Connection
 *
 * This file creates a "pool" of database connections.
 * A pool is like a team of workers — when the server needs
 * to talk to the database, it borrows one worker, uses it,
 * then returns it to the pool.
 *
 * We use the 'pg' package (PostgreSQL for Node.js).
 */

const { Pool } = require('pg');

/**
 * Why process.env?
 * process.env lets us read "environment variables" —
 * settings stored outside the code (e.g. in a .env file).
 * This is important because:
 *   1. We don't want to hardcode passwords in the code
 *   2. Different environments (local vs deployed) have different credentials
 *
 * The "|| 'fallback'" part means: use the env variable if it exists,
 * otherwise use the fallback value (good for local development).
 */
const pool = new Pool({
  user:     process.env.PG_USER     || 'postgres',
  host:     process.env.PG_HOST     || 'localhost',
  database: process.env.PG_DB       || 'restaurantdb',
  password: process.env.PG_PASS     || 'Jign@ditya77',  // ← change this!
  port:     process.env.PG_PORT     || 5432,
});

// Test the connection when the server starts
// This logs an error early if credentials are wrong
pool.query('SELECT NOW()', (err) => {
  if (err) {
    console.error('❌  Database connection failed:', err.message);
    console.error('    Check your credentials in db.js');
  } else {
    console.log('✅  Database connected successfully');
  }
});

// Export the pool so other files can use it
module.exports = pool;
