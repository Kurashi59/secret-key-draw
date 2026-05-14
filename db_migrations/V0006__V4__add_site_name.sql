INSERT INTO t_p87395805_secret_key_draw.site_content (key, value, label)
VALUES ('site_name', 'Golden Door', 'Название сайта (в меню)')
ON CONFLICT (key) DO NOTHING;
