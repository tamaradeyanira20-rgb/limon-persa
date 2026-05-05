-- ============================================================
-- LIMÓN PERSA - Schema ACTUALIZADO v2
-- Ejecuta esto en SQL Editor de Supabase (nuevo query)
-- ============================================================

-- 1. Agregar columna de giros a usuarios (si no existe)
ALTER TABLE users ADD COLUMN IF NOT EXISTS spins INT DEFAULT 0;

-- 2. Tabla de premios de ruleta con probabilidades
CREATE TABLE IF NOT EXISTS wheel_prizes (
  id SERIAL PRIMARY KEY,
  label TEXT NOT NULL,
  amount NUMERIC(12,2) DEFAULT 0,
  probability NUMERIC(5,2) NOT NULL DEFAULT 0,
  color TEXT NOT NULL,
  is_cash BOOLEAN DEFAULT true
);

-- Insertar premios (solo si la tabla está vacía)
INSERT INTO wheel_prizes (label, amount, probability, color, is_cash)
SELECT * FROM (VALUES
  ('$4',        4,     40.00, '#a3e635', true),
  ('$10',       10,    25.00, '#facc15', true),
  ('$50',       50,    15.00, '#34d399', true),
  ('$100',      100,   10.00, '#60a5fa', true),
  ('$1,000',    1000,  5.00,  '#f472b6', true),
  ('$10,000',   10000, 4.99,  '#fb923c', true),
  ('iPhone 17', 0,     0.01,  '#c084fc', false)
) AS v(label, amount, probability, color, is_cash)
WHERE NOT EXISTS (SELECT 1 FROM wheel_prizes LIMIT 1);

-- 3. Historial de giros
CREATE TABLE IF NOT EXISTS spin_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) NOT NULL,
  prize_id INT REFERENCES wheel_prizes(id) NOT NULL,
  prize_label TEXT NOT NULL,
  prize_amount NUMERIC(12,2) DEFAULT 0,
  spun_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Política RLS para nuevas tablas
ALTER TABLE wheel_prizes ENABLE ROW LEVEL SECURITY;
ALTER TABLE spin_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "prizes_public" ON wheel_prizes USING (true);
CREATE POLICY IF NOT EXISTS "spins_self" ON spin_history USING (true);

-- ============================================================
-- FIN DEL SCHEMA v2
-- ============================================================
