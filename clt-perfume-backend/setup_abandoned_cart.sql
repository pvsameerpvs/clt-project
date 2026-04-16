CREATE TABLE user_carts (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  total_price NUMERIC DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE abandoned_cart_tracking (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  last_email_sent_at TIMESTAMP WITH TIME ZONE,
  email_sequence_stage INT DEFAULT 0, 
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS so users can only access their own cart
ALTER TABLE user_carts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own cart" ON user_carts
  FOR ALL USING (auth.uid() = user_id);

-- Give service role full access
CREATE POLICY "Service Role Full Access" ON user_carts
  FOR ALL USING (current_role = 'service_role');
  
ALTER TABLE abandoned_cart_tracking ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service Role Only Tracking" ON abandoned_cart_tracking
  FOR ALL USING (current_role = 'service_role');
