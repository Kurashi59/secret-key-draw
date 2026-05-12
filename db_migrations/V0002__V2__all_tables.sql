CREATE TABLE t_p87395805_secret_key_draw.sessions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  token VARCHAR(128) UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE t_p87395805_secret_key_draw.site_content (
  key VARCHAR(100) PRIMARY KEY,
  value TEXT NOT NULL,
  label VARCHAR(255),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE t_p87395805_secret_key_draw.contacts_info (
  key VARCHAR(100) PRIMARY KEY,
  value TEXT NOT NULL,
  label VARCHAR(255),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE t_p87395805_secret_key_draw.doors (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  prize VARCHAR(255) NOT NULL,
  prize_icon VARCHAR(10) DEFAULT '🎁',
  key_price INTEGER NOT NULL,
  rarity VARCHAR(20) DEFAULT 'common',
  keys_sold INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE t_p87395805_secret_key_draw.door_opens (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  door_id INTEGER NOT NULL,
  prize_won VARCHAR(255),
  amount_won INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE t_p87395805_secret_key_draw.referral_earnings (
  id SERIAL PRIMARY KEY,
  referrer_id INTEGER NOT NULL,
  referred_id INTEGER NOT NULL,
  amount INTEGER NOT NULL,
  reason VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW()
)