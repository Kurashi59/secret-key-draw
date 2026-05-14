ALTER TABLE t_p87395805_secret_key_draw.doors
  ADD COLUMN IF NOT EXISTS color VARCHAR(20) DEFAULT '#6b7280',
  ADD COLUMN IF NOT EXISTS is_trigger BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS key_name VARCHAR(255) DEFAULT 'Стандартный ключ';

ALTER TABLE t_p87395805_secret_key_draw.door_prizes
  ADD COLUMN IF NOT EXISTS quantity INTEGER DEFAULT 1;

CREATE TABLE IF NOT EXISTS t_p87395805_secret_key_draw.prize_frequency (
  id SERIAL PRIMARY KEY,
  door_id INTEGER REFERENCES t_p87395805_secret_key_draw.doors(id),
  every_n INTEGER NOT NULL DEFAULT 1,
  prize_amount INTEGER NOT NULL DEFAULT 1000,
  description VARCHAR(255),
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS t_p87395805_secret_key_draw.payment_settings (
  id SERIAL PRIMARY KEY,
  key VARCHAR(100) UNIQUE NOT NULL,
  value TEXT,
  label VARCHAR(255),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO t_p87395805_secret_key_draw.payment_settings (key, value, label)
VALUES ('qr_image_url', '', 'URL изображения QR-кода для оплаты')
ON CONFLICT (key) DO NOTHING;

ALTER TABLE t_p87395805_secret_key_draw.deposit_requests
  ADD COLUMN IF NOT EXISTS comment TEXT;

UPDATE t_p87395805_secret_key_draw.doors SET is_trigger = TRUE WHERE id = (SELECT MIN(id) FROM t_p87395805_secret_key_draw.doors LIMIT 1);
