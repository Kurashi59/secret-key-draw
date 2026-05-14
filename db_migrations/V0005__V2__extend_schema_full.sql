-- Расширение таблицы users: ФИО, дата рождения, два счёта
ALTER TABLE t_p87395805_secret_key_draw.users
  ADD COLUMN IF NOT EXISTS full_name VARCHAR(500),
  ADD COLUMN IF NOT EXISTS birth_date DATE,
  ADD COLUMN IF NOT EXISTS referral_balance INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_main_admin BOOLEAN NOT NULL DEFAULT FALSE;

-- Добавляем внешний баланс (отдельно от реферального)
ALTER TABLE t_p87395805_secret_key_draw.users
  ADD COLUMN IF NOT EXISTS external_balance INTEGER NOT NULL DEFAULT 0;

-- Переносим существующий balance в external_balance
UPDATE t_p87395805_secret_key_draw.users SET external_balance = COALESCE(balance, 0) WHERE external_balance = 0;

-- Расширение таблицы doors: время розыгрыша, мгновенное открытие, тип ключа
ALTER TABLE t_p87395805_secret_key_draw.doors
  ADD COLUMN IF NOT EXISTS draw_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS instant_open BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS key_type VARCHAR(50) NOT NULL DEFAULT 'common';

-- Таблица призов для каждой двери (отдельный список)
CREATE TABLE IF NOT EXISTS t_p87395805_secret_key_draw.door_prizes (
  id SERIAL PRIMARY KEY,
  door_id INTEGER NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  is_won BOOLEAN NOT NULL DEFAULT FALSE,
  won_by_user_id INTEGER,
  won_at TIMESTAMPTZ,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Таблица user_keys: конкретные ключи у пользователей
CREATE TABLE IF NOT EXISTS t_p87395805_secret_key_draw.user_keys (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  door_id INTEGER NOT NULL,
  key_type VARCHAR(50) NOT NULL DEFAULT 'common',
  key_name VARCHAR(255) NOT NULL DEFAULT 'Ключ',
  is_used BOOLEAN NOT NULL DEFAULT FALSE,
  used_at TIMESTAMPTZ,
  purchased_at TIMESTAMPTZ DEFAULT NOW()
);

-- Таблица транзакций: история пополнений и списаний
CREATE TABLE IF NOT EXISTS t_p87395805_secret_key_draw.transactions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  type VARCHAR(50) NOT NULL,
  amount INTEGER NOT NULL,
  balance_type VARCHAR(20) NOT NULL DEFAULT 'external',
  description VARCHAR(500),
  status VARCHAR(20) NOT NULL DEFAULT 'completed',
  ref_id INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Таблица запросов на пополнение
CREATE TABLE IF NOT EXISTS t_p87395805_secret_key_draw.deposit_requests (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  amount INTEGER NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  payment_method VARCHAR(50) DEFAULT 'card',
  payment_id VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Расширяем door_opens
ALTER TABLE t_p87395805_secret_key_draw.door_opens
  ADD COLUMN IF NOT EXISTS prize_id INTEGER,
  ADD COLUMN IF NOT EXISTS user_key_id INTEGER;

-- Индексы для производительности
CREATE INDEX IF NOT EXISTS idx_user_keys_user ON t_p87395805_secret_key_draw.user_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_user_keys_door ON t_p87395805_secret_key_draw.user_keys(door_id);
CREATE INDEX IF NOT EXISTS idx_door_prizes_door ON t_p87395805_secret_key_draw.door_prizes(door_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user ON t_p87395805_secret_key_draw.transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_door_opens_user ON t_p87395805_secret_key_draw.door_opens(user_id);

-- Назначить первого пользователя с ролью admin как главного администратора
UPDATE t_p87395805_secret_key_draw.users SET is_main_admin = TRUE WHERE role = 'admin';
