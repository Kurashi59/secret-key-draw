INSERT INTO t_p87395805_secret_key_draw.site_content (key, label, value) VALUES
  ('hero_title', 'Заголовок главной', 'GOLDEN DOOR'),
  ('hero_subtitle', 'Подзаголовок', 'За каждой дверью — реальный приз. Купи ключ, открой дверь, забери выигрыш.'),
  ('hero_cta', 'Кнопка CTA', 'Купить ключ'),
  ('about_intro', 'Текст «О проекте»', 'Golden Door — это не казино и не лотерея. Это прозрачная система, где каждая дверь скрывает реальный приз, а каждый ключ даёт гарантированный выигрыш.'),
  ('referral_percent', 'Процент реф. бонуса', '10'),
  ('stats_participants', 'Статистика: участников', '12 847'),
  ('stats_prizes', 'Статистика: призов выдано', '4 320'),
  ('stats_keys', 'Статистика: ключей продано', '38 091'),
  ('stats_payouts', 'Статистика: выплачено', '7.2 млн');

INSERT INTO t_p87395805_secret_key_draw.contacts_info (key, label, value) VALUES
  ('email', 'Email', 'support@goldendoor.ru'),
  ('phone', 'Телефон', '+7 (800) 555-00-00'),
  ('telegram', 'Telegram', '@goldendoor_support'),
  ('address', 'Адрес', 'Москва, ул. Примерная, 1'),
  ('work_hours', 'Режим работы', 'Пн–Пт, 9:00–21:00'),
  ('map_url', 'Ссылка на карту', 'https://yandex.ru/maps/');

INSERT INTO t_p87395805_secret_key_draw.doors (name, prize, prize_icon, key_price, rarity, sort_order) VALUES
  ('Дверь удачи', '1 000 ₽', '💰', 99, 'common', 1),
  ('Синяя дверь', 'iPhone 15', '📱', 499, 'rare', 2),
  ('Фиолетовый зал', 'MacBook Air', '💻', 999, 'epic', 3),
  ('Золотые врата', '100 000 ₽', '👑', 1999, 'legendary', 4),
  ('Ночная дверь', '5 000 ₽', '🌙', 199, 'common', 5),
  ('Рубиновый чертог', 'PlayStation 5', '🎮', 799, 'epic', 6)