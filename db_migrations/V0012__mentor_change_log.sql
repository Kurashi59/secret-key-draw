-- Журнал изменений наставников пайщиков
CREATE TABLE IF NOT EXISTS t_p87395805_secret_key_draw.mentor_change_log (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES t_p87395805_secret_key_draw.users(id),
  changed_by INTEGER REFERENCES t_p87395805_secret_key_draw.users(id),
  changed_by_name VARCHAR(255),
  old_mentor1_id INTEGER,
  old_mentor2_id INTEGER,
  old_mentor3_id INTEGER,
  new_mentor1_id INTEGER,
  new_mentor2_id INTEGER,
  new_mentor3_id INTEGER,
  reason VARCHAR(50) NOT NULL DEFAULT 'manual_update',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mentor_log_user ON t_p87395805_secret_key_draw.mentor_change_log(user_id);
CREATE INDEX IF NOT EXISTS idx_mentor_log_created ON t_p87395805_secret_key_draw.mentor_change_log(created_at DESC);
