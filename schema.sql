-- ============================================================
-- schema.sql  — Burger Guys Database (FIXED VERSION)
-- ============================================================
-- HOW TO USE:
--   1. Open pgAdmin → right-click restaurantdb → Query Tool
--   2. Paste this ENTIRE file and press F5 (Run)
--
-- IMPORTANT: This clears old wrong data and inserts clean data!
-- ============================================================

-- ── TABLE: users ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  name          VARCHAR(100)  NOT NULL,
  email         VARCHAR(150)  NOT NULL UNIQUE,
  password_hash VARCHAR(255)  NOT NULL,
  created_at    TIMESTAMPTZ   DEFAULT NOW()
);

-- ── TABLE: menu ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS menu (
  id         SERIAL PRIMARY KEY,
  name       VARCHAR(120)  NOT NULL,
  price      NUMERIC(8,2)  NOT NULL CHECK (price >= 0),
  category   VARCHAR(50)   NOT NULL,
  created_at TIMESTAMPTZ   DEFAULT NOW()
);

-- ── CLEAR OLD DATA (fixes wrong categories from before) ──────
DELETE FROM menu;
ALTER SEQUENCE menu_id_seq RESTART WITH 1;

-- ── SEED: 32 items — categories: Burger|Side|Drink|Combo|Dessert
INSERT INTO menu (name, price, category) VALUES
  ('The Classic Guy',           9.99,  'Burger'),
  ('Double Smash Stack',       13.99,  'Burger'),
  ('Spicy Diablo',             12.49,  'Burger'),
  ('BBQ Smokehouse',           13.49,  'Burger'),
  ('Mushroom Swiss Melt',      12.99,  'Burger'),
  ('The Bacon Bomb',           14.49,  'Burger'),
  ('Avocado Ranch Burger',     13.99,  'Burger'),
  ('Triple Threat Stack',      16.99,  'Burger'),
  ('Crispy Chicken Sandwich',  11.99,  'Burger'),
  ('Veggie Smash Burger',      10.99,  'Burger'),
  ('Loaded Fries',              7.49,  'Side'),
  ('Classic Fries',             3.99,  'Side'),
  ('Sweet Potato Fries',        4.99,  'Side'),
  ('Beer-Battered Rings',       5.99,  'Side'),
  ('Coleslaw Cup',              2.99,  'Side'),
  ('Mac & Cheese Bites',        6.49,  'Side'),
  ('Classic Milkshake',         5.99,  'Drink'),
  ('Strawberry Milkshake',      5.99,  'Drink'),
  ('Chocolate Milkshake',       5.99,  'Drink'),
  ('Fresh Lemonade',            3.49,  'Drink'),
  ('Fountain Soda',             2.49,  'Drink'),
  ('Bottled Water',             1.99,  'Drink'),
  ('Classic Combo',            13.99,  'Combo'),
  ('Double Stack Combo',       17.99,  'Combo'),
  ('Spicy Combo',              16.49,  'Combo'),
  ('Chicken Combo',            15.49,  'Combo'),
  ('Family Pack (4 burgers)',  49.99,  'Combo'),
  ('Warm Brownie Sundae',       6.99,  'Dessert'),
  ('Churro Bites (6pc)',        4.99,  'Dessert'),
  ('NY Cheesecake Slice',       5.49,  'Dessert'),
  ('Ice Cream Sandwich',        4.49,  'Dessert'),
  ('Salted Caramel Shake',      6.49,  'Dessert');