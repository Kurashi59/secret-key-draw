CREATE TABLE t_p87395805_secret_key_draw.users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(50),
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) DEFAULT 'user',
  referral_code VARCHAR(32) UNIQUE NOT NULL,
  referred_by INTEGER,
  balance INTEGER DEFAULT 0,
  keys_count INTEGER DEFAULT 0,
  level VARCHAR(50) DEFAULT 'Новичок',
  level_progress INTEGER DEFAULT 0,
  is_blocked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
)