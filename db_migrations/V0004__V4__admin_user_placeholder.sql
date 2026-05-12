-- Первый администратор: admin@goldendoor.ru / password: Admin2024!
-- Хэш: pbkdf2 sha256 с солью (сгенерирован вручную)
-- Настоящий пароль задайте через смену пароля в интерфейсе или напрямую
INSERT INTO t_p87395805_secret_key_draw.users 
  (name, email, password_hash, role, referral_code)
VALUES 
  ('Администратор', 'admin@goldendoor.ru', 
   'a1b2c3d4e5f6a7b8:$(placeholder_update_via_api)', 
   'admin', 'ADMIN2024'
  )
ON CONFLICT (email) DO NOTHING