-- Healthy Product Suggestions Table
-- This migration adds support for suggesting healthier alternatives to common products in India

-- Create healthy_products table
CREATE TABLE IF NOT EXISTS healthy_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  common_product TEXT NOT NULL,
  healthy_alternative TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('spices', 'grains', 'oils', 'sweeteners', 'dairy', 'beverages', 'snacks', 'flour', 'other')),
  health_benefits TEXT NOT NULL,
  nutritional_info TEXT,
  availability TEXT DEFAULT 'Available in most Indian stores',
  price_range TEXT,
  brand_suggestions TEXT[],
  region_specific TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_healthy_products_common_product ON healthy_products(common_product);
CREATE INDEX IF NOT EXISTS idx_healthy_products_category ON healthy_products(category);
CREATE INDEX IF NOT EXISTS idx_healthy_products_healthy_alternative ON healthy_products(healthy_alternative);

-- Enable RLS
ALTER TABLE healthy_products ENABLE ROW LEVEL SECURITY;

-- RLS Policies for healthy_products
DROP POLICY IF EXISTS "Anyone can view healthy products" ON healthy_products;
CREATE POLICY "Anyone can view healthy products"
  ON healthy_products FOR SELECT
  USING (true);

-- Insert sample healthy product suggestions for India
INSERT INTO healthy_products (common_product, healthy_alternative, category, health_benefits, nutritional_info, availability, price_range, brand_suggestions, region_specific) VALUES
-- Spices & Seasonings
('White Salt', 'Pink Himalayan Salt / Rock Salt (Sendha Namak)', 'spices', 'Rich in minerals like iron, calcium, magnesium, and potassium. Lower sodium content. Helps maintain electrolyte balance.', 'Contains 84 trace minerals. Lower sodium than table salt.', 'Available in most Indian grocery stores and online', '₹50-200 per 500g', ARRAY['Tata', 'Everest', '24 Mantra Organic'], 'Available nationwide'),
('Refined Sugar', 'Jaggery (Gur) / Coconut Sugar / Stevia', 'sweeteners', 'Rich in iron, calcium, and antioxidants. Slower glucose release. Natural and unprocessed.', 'Jaggery: High in iron. Coconut sugar: Low glycemic index. Stevia: Zero calories.', 'Jaggery available everywhere. Coconut sugar and Stevia in health stores', 'Jaggery: ₹40-80/kg, Coconut sugar: ₹200-400/kg, Stevia: ₹300-600/100g', ARRAY['Organic India', '24 Mantra', 'Nutriorg'], 'Jaggery is traditional in most regions'),
('Refined Oil', 'Cold-Pressed Mustard Oil / Coconut Oil / Sesame Oil / Groundnut Oil', 'oils', 'Rich in omega-3, antioxidants, and natural vitamins. Unprocessed and retains nutrients. Better for heart health.', 'Cold-pressed oils retain natural antioxidants and vitamins', 'Available in local markets and online', '₹200-500 per liter', ARRAY['Dabur', 'Fortune', 'Emami', 'Parachute'], 'Mustard oil popular in East/North, Coconut in South/West'),
('Refined Wheat Flour (Maida)', 'Whole Wheat Flour (Atta) / Multigrain Flour / Ragi Flour / Jowar Flour', 'flour', 'High in fiber, vitamins, and minerals. Better blood sugar control. Aids digestion.', 'Whole wheat: High fiber. Ragi: High calcium. Jowar: Gluten-free.', 'Available in all Indian stores', '₹40-150 per kg depending on type', ARRAY['Aashirvaad', 'Pillsbury', 'Organic Tattva'], 'Ragi popular in South, Jowar in West'),
('White Rice', 'Brown Rice / Red Rice / Quinoa / Millets (Bajra, Jowar, Ragi)', 'grains', 'Higher fiber, vitamins, and minerals. Better blood sugar control. More satiating.', 'Brown rice: High fiber. Millets: High protein and minerals', 'Available in most stores and online', '₹60-200 per kg', ARRAY['India Gate', 'Kohinoor', 'Organic Tattva'], 'Millets traditional in various regions'),
('Refined Pasta/Noodles', 'Whole Wheat Pasta / Oats / Quinoa Pasta / Millets', 'grains', 'Higher fiber and protein. Better satiety. More nutrients.', 'Whole wheat pasta: High fiber. Oats: Beta-glucan for heart health', 'Available in supermarkets and online', '₹80-300 per pack', ARRAY['Aashirvaad', 'Saffola', 'True Elements'], 'Available nationwide'),
('Packaged Bread', 'Whole Wheat Bread / Multigrain Bread / Homemade Roti', 'grains', 'Higher fiber. No preservatives (if homemade). Better nutrition.', 'Whole wheat bread: High fiber. Homemade: Fresh and preservative-free', 'Available in stores or make at home', '₹40-100 per loaf', ARRAY['Britannia', 'Harvest Gold', 'Modern'], 'Homemade roti is traditional'),
('Tea with Sugar', 'Green Tea / Herbal Tea (Tulsi, Ginger) / Black Tea without Sugar', 'beverages', 'Antioxidants, metabolism boost, better hydration. No added sugar.', 'Green tea: High antioxidants. Herbal teas: Various health benefits', 'Available everywhere', '₹100-500 per 100g', ARRAY['Tata Tea', 'Organic India', 'Himalaya'], 'Herbal teas are traditional'),
('Soft Drinks', 'Buttermilk (Chaas) / Coconut Water / Fresh Juices / Lassi', 'beverages', 'Natural electrolytes, probiotics, vitamins. No artificial additives.', 'Buttermilk: Probiotics. Coconut water: Electrolytes. Fresh juice: Vitamins', 'Available fresh or packaged', '₹20-100 per serving', ARRAY['Amul', 'Coca-Cola (Minute Maid)', 'Real'], 'Buttermilk and lassi are traditional'),
('Packaged Snacks (Chips, Namkeen)', 'Roasted Nuts / Homemade Namkeen / Makhana (Fox Nuts) / Roasted Chana', 'snacks', 'High protein, healthy fats, fiber. No trans fats. Natural ingredients.', 'Nuts: Healthy fats. Makhana: High protein. Roasted chana: High fiber', 'Available in stores or make at home', '₹100-500 per kg', ARRAY['Haldiram (homemade style)', 'Organic Tattva', 'Make at home'], 'Makhana popular in North, Roasted chana everywhere'),
('Refined Butter', 'Desi Ghee / A2 Ghee / Coconut Oil', 'dairy', 'Rich in healthy fats, vitamins A, D, E, K. Better for digestion. Natural.', 'Ghee: High in butyric acid. A2 ghee: Easier to digest', 'Available in stores', '₹400-800 per 500g', ARRAY['Amul', 'Ananda', 'Patanjali'], 'Desi ghee is traditional'),
('Packaged Pickles', 'Homemade Pickles / Fermented Foods', 'other', 'No preservatives. Probiotics (if fermented). Natural ingredients.', 'Homemade: Fresh and preservative-free. Fermented: Probiotics', 'Make at home or buy from local vendors', '₹100-300 per jar', ARRAY['Make at home', 'Local vendors'], 'Traditional in all regions'),
('White Poha', 'Brown Poha / Quinoa Poha / Millets Poha', 'grains', 'Higher fiber and nutrients. Better blood sugar control.', 'Brown poha: High fiber. Quinoa: Complete protein', 'Available in stores', '₹60-150 per kg', ARRAY['Kohinoor', 'Organic Tattva'], 'Available nationwide'),
('Refined Semolina (Suji)', 'Whole Wheat Semolina / Rava / Millets Rava', 'grains', 'Higher fiber and nutrients. Better satiety.', 'Whole wheat semolina: High fiber', 'Available in stores', '₹50-120 per kg', ARRAY['Aashirvaad', 'Pillsbury'], 'Available nationwide'),
('Packaged Cookies', 'Homemade Cookies with Whole Wheat / Oats Cookies / Nuts', 'snacks', 'No preservatives. Higher fiber. Natural ingredients. Customizable.', 'Whole wheat cookies: High fiber. Oats: Beta-glucan', 'Make at home or buy from bakeries', '₹100-300 per pack', ARRAY['Make at home', 'Local bakeries'], 'Homemade is best');

-- Create a function to get healthy alternatives
CREATE OR REPLACE FUNCTION get_healthy_alternatives(search_product TEXT)
RETURNS TABLE (
  common_product TEXT,
  healthy_alternative TEXT,
  category TEXT,
  health_benefits TEXT,
  nutritional_info TEXT,
  availability TEXT,
  price_range TEXT,
  brand_suggestions TEXT[]
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    hp.common_product,
    hp.healthy_alternative,
    hp.category,
    hp.health_benefits,
    hp.nutritional_info,
    hp.availability,
    hp.price_range,
    hp.brand_suggestions
  FROM healthy_products hp
  WHERE 
    LOWER(hp.common_product) LIKE '%' || LOWER(search_product) || '%'
    OR LOWER(hp.healthy_alternative) LIKE '%' || LOWER(search_product) || '%'
    OR LOWER(hp.category) = LOWER(search_product)
  ORDER BY 
    CASE 
      WHEN LOWER(hp.common_product) = LOWER(search_product) THEN 1
      WHEN LOWER(hp.common_product) LIKE '%' || LOWER(search_product) || '%' THEN 2
      ELSE 3
    END;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_healthy_alternatives(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_healthy_alternatives(TEXT) TO anon;



