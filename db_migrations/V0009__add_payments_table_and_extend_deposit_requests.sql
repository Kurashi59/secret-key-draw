ALTER TABLE t_p87395805_secret_key_draw.deposit_requests
  ADD COLUMN IF NOT EXISTS provider VARCHAR(20) DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS provider_payment_id VARCHAR(255),
  ADD COLUMN IF NOT EXISTS confirmation_url TEXT,
  ADD COLUMN IF NOT EXISTS return_url TEXT;

CREATE TABLE IF NOT EXISTS t_p87395805_secret_key_draw.payments (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES t_p87395805_secret_key_draw.users(id),
  amount INTEGER NOT NULL,
  provider VARCHAR(20) NOT NULL,
  provider_payment_id VARCHAR(255),
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  confirmation_url TEXT,
  return_url TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_payments_user_id ON t_p87395805_secret_key_draw.payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_provider_payment_id ON t_p87395805_secret_key_draw.payments(provider_payment_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON t_p87395805_secret_key_draw.payments(status);
