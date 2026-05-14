-- Добавляем недостающие колонки в user_keys
ALTER TABLE t_p87395805_secret_key_draw.user_keys
  ADD COLUMN IF NOT EXISTS key_type VARCHAR(50) DEFAULT 'common',
  ADD COLUMN IF NOT EXISTS key_name VARCHAR(255) DEFAULT 'Стандартный ключ',
  ADD COLUMN IF NOT EXISTS is_used BOOLEAN DEFAULT FALSE;

-- Синхронизируем is_used с существующим полем used
UPDATE t_p87395805_secret_key_draw.user_keys SET is_used = used WHERE is_used IS DISTINCT FROM used;

-- Добавляем недостающие колонки в transactions
ALTER TABLE t_p87395805_secret_key_draw.transactions
  ADD COLUMN IF NOT EXISTS balance_type VARCHAR(20) DEFAULT 'external',
  ADD COLUMN IF NOT EXISTS ref_id INTEGER;
