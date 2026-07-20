-- ============================================================
-- Nutrition & Weight Tracking — run in Supabase SQL Editor
-- ============================================================

-- Food library (per user)
CREATE TABLE IF NOT EXISTS foods (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  calories_per_100g DECIMAL(8, 2) NOT NULL,
  carbs_per_100g DECIMAL(8, 2),
  protein_per_100g DECIMAL(8, 2),
  fat_per_100g DECIMAL(8, 2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Daily food logs
CREATE TABLE IF NOT EXISTS food_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  food_id UUID REFERENCES foods(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  grams DECIMAL(8, 2) NOT NULL,
  calories DECIMAL(8, 2) NOT NULL,
  carbs DECIMAL(8, 2),
  protein DECIMAL(8, 2),
  fat DECIMAL(8, 2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Weight logs (one per day per user)
CREATE TABLE IF NOT EXISTS weight_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  weight DECIMAL(6, 2) NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_foods_user ON foods(user_id);
CREATE INDEX IF NOT EXISTS idx_food_logs_user_date ON food_logs(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_weight_logs_user_date ON weight_logs(user_id, date DESC);

-- RLS
ALTER TABLE foods ENABLE ROW LEVEL SECURITY;
ALTER TABLE food_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE weight_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "foods_all" ON foods FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "food_logs_all" ON food_logs FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "weight_logs_all" ON weight_logs FOR ALL USING (auth.uid() = user_id);
