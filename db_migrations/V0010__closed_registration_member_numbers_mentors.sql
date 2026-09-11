-- Переход на закрытую регистрацию: номер пайщика, 3 наставника, заявки на регистрацию

ALTER TABLE t_p87395805_secret_key_draw.users
  ADD COLUMN IF NOT EXISTS member_number VARCHAR(20),
  ADD COLUMN IF NOT EXISTS mentor1_id INTEGER REFERENCES t_p87395805_secret_key_draw.users(id),
  ADD COLUMN IF NOT EXISTS mentor2_id INTEGER REFERENCES t_p87395805_secret_key_draw.users(id),
  ADD COLUMN IF NOT EXISTS mentor3_id INTEGER REFERENCES t_p87395805_secret_key_draw.users(id);

UPDATE t_p87395805_secret_key_draw.users u
SET member_number = sub.n::text
FROM (SELECT id, 1000 + ROW_NUMBER() OVER (ORDER BY id) AS n FROM t_p87395805_secret_key_draw.users) sub
WHERE u.id = sub.id AND u.member_number IS NULL;

UPDATE t_p87395805_secret_key_draw.users SET mentor1_id = referred_by WHERE referred_by IS NOT NULL AND mentor1_id IS NULL;

ALTER TABLE t_p87395805_secret_key_draw.users
  ALTER COLUMN member_number SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_member_number ON t_p87395805_secret_key_draw.users(member_number);

CREATE TABLE IF NOT EXISTS t_p87395805_secret_key_draw.registration_requests (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(50) NOT NULL,
  comment TEXT,
  mentor_id INTEGER NOT NULL REFERENCES t_p87395805_secret_key_draw.users(id),
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  created_user_id INTEGER REFERENCES t_p87395805_secret_key_draw.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_reg_requests_mentor ON t_p87395805_secret_key_draw.registration_requests(mentor_id);
CREATE INDEX IF NOT EXISTS idx_reg_requests_status ON t_p87395805_secret_key_draw.registration_requests(status);
