UPDATE t_p87395805_secret_key_draw.users
SET is_blocked = TRUE, email = CONCAT('test_verification_', id, '_', email)
WHERE id IN (8,9);

UPDATE t_p87395805_secret_key_draw.sessions SET expires_at = NOW() WHERE user_id IN (8,9);
