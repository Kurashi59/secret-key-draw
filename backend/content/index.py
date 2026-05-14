"""
API контента: двери, призы, ключи, покупка ключей, открытие дверей, транзакции, тексты, контакты, QR.
Роутинг: ?action=...
"""
import json
import os
import random
import base64
import boto3
import psycopg2
from datetime import datetime, timezone

S = os.environ.get('MAIN_DB_SCHEMA', 't_p87395805_secret_key_draw')
CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Authorization',
}

def get_conn():
    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    conn.autocommit = False
    return conn

def ok(data):
    return {'statusCode': 200, 'headers': {**CORS, 'Content-Type': 'application/json'}, 'body': json.dumps(data, ensure_ascii=False, default=str)}

def err(msg, code=400):
    return {'statusCode': code, 'headers': {**CORS, 'Content-Type': 'application/json'}, 'body': json.dumps({'error': msg}, ensure_ascii=False)}

def get_user_by_token(conn, token: str):
    if not token:
        return None
    with conn.cursor() as cur:
        cur.execute(f"""
            SELECT u.id, u.role, u.external_balance, u.referral_balance, u.is_main_admin
            FROM {S}.sessions s JOIN {S}.users u ON u.id = s.user_id
            WHERE s.token = %s AND s.expires_at > NOW()""", (token,))
        row = cur.fetchone()
    if not row:
        return None
    return {'id': row[0], 'role': row[1], 'external_balance': row[2], 'referral_balance': row[3], 'is_main_admin': row[4]}

def handler(event: dict, context) -> dict:
    """Основной обработчик контента: двери, призы, ключи, транзакции, депозиты."""
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS, 'body': ''}

    qs = event.get('queryStringParameters') or {}
    action = qs.get('action', '')

    body = {}
    if event.get('body'):
        try:
            body = json.loads(event['body'])
        except Exception:
            pass

    token = (event.get('headers') or {}).get('X-Authorization', '').replace('Bearer ', '').strip()

    if not action:
        return ok({'status': 'ok', 'service': 'content'})

    conn = get_conn()
    try:
        # ── SITE CONTENT ──────────────────────────────────────────────────────
        if action == 'get_site':
            with conn.cursor() as cur:
                cur.execute(f"SELECT key, value, label FROM {S}.site_content ORDER BY key")
                rows = cur.fetchall()
            return ok({r[0]: {'value': r[1], 'label': r[2]} for r in rows})

        if action == 'update_site':
            user = get_user_by_token(conn, token)
            if not user or user['role'] != 'admin':
                return err('Только для администратора', 403)
            updates = body.get('updates', {})
            with conn.cursor() as cur:
                for key, value in updates.items():
                    cur.execute(f"INSERT INTO {S}.site_content (key, value, updated_at) VALUES (%s,%s,NOW()) ON CONFLICT (key) DO UPDATE SET value=EXCLUDED.value, updated_at=NOW()", (key, str(value)))
            conn.commit()
            return ok({'message': 'Контент обновлён'})

        # ── CONTACTS ──────────────────────────────────────────────────────────
        if action == 'get_contacts':
            with conn.cursor() as cur:
                cur.execute(f"SELECT key, value, label FROM {S}.contacts_info ORDER BY key")
                rows = cur.fetchall()
            return ok({r[0]: {'value': r[1], 'label': r[2]} for r in rows})

        if action == 'update_contacts':
            user = get_user_by_token(conn, token)
            if not user or user['role'] != 'admin':
                return err('Только для администратора', 403)
            updates = body.get('updates', {})
            with conn.cursor() as cur:
                for key, value in updates.items():
                    cur.execute(f"UPDATE {S}.contacts_info SET value=%s, updated_at=NOW() WHERE key=%s", (str(value), key))
            conn.commit()
            return ok({'message': 'Контакты обновлены'})

        # ── PAYMENT SETTINGS (QR) ─────────────────────────────────────────────
        if action == 'get_payment_settings':
            with conn.cursor() as cur:
                cur.execute(f"SELECT key, value, label FROM {S}.payment_settings ORDER BY key")
                rows = cur.fetchall()
            return ok({r[0]: {'value': r[1] or '', 'label': r[2] or ''} for r in rows})

        if action == 'update_payment_settings':
            user = get_user_by_token(conn, token)
            if not user or user['role'] != 'admin':
                return err('Только для администратора', 403)
            updates = body.get('updates', {})
            with conn.cursor() as cur:
                for key, value in updates.items():
                    cur.execute(f"""INSERT INTO {S}.payment_settings (key, value, updated_at)
                        VALUES (%s,%s,NOW()) ON CONFLICT (key) DO UPDATE SET value=EXCLUDED.value, updated_at=NOW()""",
                        (key, str(value)))
            conn.commit()
            return ok({'message': 'Настройки оплаты обновлены'})

        if action == 'upload_qr':
            user = get_user_by_token(conn, token)
            if not user or user['role'] != 'admin':
                return err('Только для администратора', 403)
            image_data = body.get('image_data', '')
            if not image_data:
                return err('Нет данных изображения')
            # Поддержка base64 data URL и чистого base64
            if ',' in image_data:
                header, b64 = image_data.split(',', 1)
                ext = 'png'
                if 'jpeg' in header or 'jpg' in header:
                    ext = 'jpg'
                elif 'gif' in header:
                    ext = 'gif'
                elif 'webp' in header:
                    ext = 'webp'
            else:
                b64 = image_data
                ext = 'png'
            try:
                img_bytes = base64.b64decode(b64)
            except Exception:
                return err('Некорректные данные изображения')
            s3 = boto3.client('s3',
                endpoint_url='https://bucket.poehali.dev',
                aws_access_key_id=os.environ['AWS_ACCESS_KEY_ID'],
                aws_secret_access_key=os.environ['AWS_SECRET_ACCESS_KEY'])
            key_path = f'qr/payment_qr.{ext}'
            s3.put_object(Bucket='files', Key=key_path, Body=img_bytes, ContentType=f'image/{ext}')
            cdn_url = f"https://cdn.poehali.dev/projects/{os.environ['AWS_ACCESS_KEY_ID']}/bucket/{key_path}"
            with conn.cursor() as cur:
                cur.execute(f"""INSERT INTO {S}.payment_settings (key, value, updated_at)
                    VALUES ('qr_image_url', %s, NOW()) ON CONFLICT (key) DO UPDATE SET value=EXCLUDED.value, updated_at=NOW()""",
                    (cdn_url,))
            conn.commit()
            return ok({'url': cdn_url, 'message': 'QR-код загружен'})

        # ── DOORS ─────────────────────────────────────────────────────────────
        if action == 'get_doors':
            user = get_user_by_token(conn, token)
            trigger_unlocked = False
            with conn.cursor() as cur:
                if user:
                    cur.execute(f"""
                        SELECT COUNT(*) FROM {S}.door_opens do2
                        JOIN {S}.doors d2 ON d2.id = do2.door_id
                        WHERE do2.user_id=%s AND d2.is_trigger=TRUE""", (user['id'],))
                    trigger_unlocked = (cur.fetchone()[0] > 0)

                cur.execute(f"""
                    SELECT d.id, d.name, d.prize, d.prize_icon, d.key_price, d.rarity,
                           d.keys_sold, d.is_active, d.sort_order, d.draw_at,
                           d.instant_open, d.key_type, d.color, d.is_trigger, d.key_name,
                           COUNT(dp.id) as prizes_total,
                           COUNT(CASE WHEN dp.is_won=FALSE THEN 1 END) as prizes_left
                    FROM {S}.doors d
                    LEFT JOIN {S}.door_prizes dp ON dp.door_id = d.id
                    WHERE d.is_active=TRUE
                    GROUP BY d.id ORDER BY d.sort_order""")
                rows = cur.fetchall()
            keys = ['id','name','prize','prize_icon','key_price','rarity','keys_sold',
                    'is_active','sort_order','draw_at','instant_open','key_type','color','is_trigger','key_name','prizes_total','prizes_left']
            doors = [dict(zip(keys, r)) for r in rows]
            for d in doors:
                if d['is_trigger']:
                    d['is_unlocked'] = True
                else:
                    d['is_unlocked'] = trigger_unlocked
            return ok({'doors': doors, 'trigger_unlocked': trigger_unlocked})

        if action == 'get_all_doors':
            user = get_user_by_token(conn, token)
            if not user or user['role'] != 'admin':
                return err('Только для администратора', 403)
            with conn.cursor() as cur:
                cur.execute(f"""
                    SELECT d.id, d.name, d.prize, d.prize_icon, d.key_price, d.rarity,
                           d.keys_sold, d.is_active, d.sort_order, d.draw_at,
                           d.instant_open, d.key_type, d.color, d.is_trigger, d.key_name,
                           COUNT(dp.id) as prizes_total,
                           COUNT(CASE WHEN dp.is_won=FALSE THEN 1 END) as prizes_left
                    FROM {S}.doors d
                    LEFT JOIN {S}.door_prizes dp ON dp.door_id = d.id
                    GROUP BY d.id ORDER BY d.sort_order""")
                rows = cur.fetchall()
            keys = ['id','name','prize','prize_icon','key_price','rarity','keys_sold',
                    'is_active','sort_order','draw_at','instant_open','key_type','color','is_trigger','key_name','prizes_total','prizes_left']
            return ok([dict(zip(keys, r)) for r in rows])

        if action == 'update_door':
            user = get_user_by_token(conn, token)
            if not user or user['role'] != 'admin':
                return err('Только для администратора', 403)
            door_id = body.get('id')
            if not door_id:
                return err('Нет id двери')
            allowed = ['name','prize','prize_icon','key_price','rarity','is_active','draw_at','instant_open','key_type','color','is_trigger','key_name']
            with conn.cursor() as cur:
                if 'is_trigger' in body and body['is_trigger']:
                    cur.execute(f"UPDATE {S}.doors SET is_trigger=FALSE WHERE id != %s", (door_id,))
                for f in allowed:
                    if f in body:
                        val = body[f]
                        if f == 'key_price':
                            val = int(val)
                        elif f in ('is_active','instant_open','is_trigger'):
                            val = bool(val)
                        elif f == 'draw_at' and val == '':
                            val = None
                        cur.execute(f"UPDATE {S}.doors SET {f}=%s WHERE id=%s", (val, door_id))
            conn.commit()
            return ok({'message': 'Дверь обновлена'})

        if action == 'create_door':
            user = get_user_by_token(conn, token)
            if not user or user['role'] != 'admin':
                return err('Только для администратора', 403)
            with conn.cursor() as cur:
                cur.execute(f"SELECT COALESCE(MAX(sort_order),0)+1 FROM {S}.doors")
                sort_order = cur.fetchone()[0]
                cur.execute(f"""INSERT INTO {S}.doors
                    (name,prize,prize_icon,key_price,rarity,instant_open,key_type,sort_order,color,key_name)
                    VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s) RETURNING id""",
                    (body.get('name','Новая дверь'), body.get('prize','Приз'), body.get('prize_icon','🎁'),
                     int(body.get('key_price',99)), body.get('rarity','common'),
                     bool(body.get('instant_open', True)), body.get('key_type','common'), sort_order,
                     body.get('color','#6b7280'), body.get('key_name','Стандартный ключ')))
                new_id = cur.fetchone()[0]
            conn.commit()
            return ok({'id': new_id, 'message': 'Дверь создана'})

        if action == 'delete_door':
            user = get_user_by_token(conn, token)
            if not user or user['role'] != 'admin':
                return err('Только для администратора', 403)
            door_id = body.get('door_id')
            if not door_id:
                return err('Нет door_id')
            with conn.cursor() as cur:
                # Физически помечаем как неактивную (мягкое удаление)
                cur.execute(f"UPDATE {S}.doors SET is_active=FALSE, name=CONCAT('[УДАЛЕНА] ', name) WHERE id=%s", (door_id,))
            conn.commit()
            return ok({'message': 'Дверь удалена'})

        # ── PRIZES ────────────────────────────────────────────────────────────
        if action == 'get_prizes':
            door_id = qs.get('door_id') or body.get('door_id')
            if not door_id:
                return err('Нет door_id')
            user = get_user_by_token(conn, token)
            with conn.cursor() as cur:
                cur.execute(f"""SELECT id, name, description, is_won, won_by_user_id, won_at, sort_order,
                    COALESCE(quantity, 1) as quantity
                    FROM {S}.door_prizes WHERE door_id=%s ORDER BY sort_order, id""", (door_id,))
                rows = cur.fetchall()
            keys_p = ['id','name','description','is_won','won_by_user_id','won_at','sort_order','quantity']
            result = [dict(zip(keys_p, r)) for r in rows]
            # Если не admin — скрываем детали победителя
            if not (user and user['role'] == 'admin'):
                for item in result:
                    item['won_by_user_id'] = None
                    item['won_at'] = None
            return ok(result)

        if action == 'add_prize':
            user = get_user_by_token(conn, token)
            if not user or user['role'] != 'admin':
                return err('Только для администратора', 403)
            door_id = body.get('door_id')
            name = (body.get('name') or '').strip()
            quantity = max(1, int(body.get('quantity', 1)))
            if not door_id or not name:
                return err('Нужны door_id и name')
            with conn.cursor() as cur:
                cur.execute(f"SELECT COALESCE(MAX(sort_order),0)+1 FROM {S}.door_prizes WHERE door_id=%s", (door_id,))
                so = cur.fetchone()[0]
                cur.execute(f"INSERT INTO {S}.door_prizes (door_id, name, description, sort_order, quantity) VALUES (%s,%s,%s,%s,%s) RETURNING id",
                            (door_id, name, body.get('description',''), so, quantity))
                new_id = cur.fetchone()[0]
            conn.commit()
            return ok({'id': new_id, 'message': 'Приз добавлен'})

        if action == 'delete_prize':
            user = get_user_by_token(conn, token)
            if not user or user['role'] != 'admin':
                return err('Только для администратора', 403)
            prize_id = body.get('prize_id')
            if not prize_id:
                return err('Нет prize_id')
            with conn.cursor() as cur:
                cur.execute(f"UPDATE {S}.door_prizes SET is_won=TRUE WHERE id=%s", (prize_id,))
            conn.commit()
            return ok({'message': 'Приз удалён'})

        if action == 'update_prize':
            user = get_user_by_token(conn, token)
            if not user or user['role'] != 'admin':
                return err('Только для администратора', 403)
            prize_id = body.get('prize_id')
            with conn.cursor() as cur:
                if body.get('name'):
                    cur.execute(f"UPDATE {S}.door_prizes SET name=%s WHERE id=%s", (body['name'], prize_id))
                if body.get('description') is not None:
                    cur.execute(f"UPDATE {S}.door_prizes SET description=%s WHERE id=%s", (body['description'], prize_id))
                if body.get('quantity') is not None:
                    cur.execute(f"UPDATE {S}.door_prizes SET quantity=%s WHERE id=%s", (int(body['quantity']), prize_id))
            conn.commit()
            return ok({'message': 'Приз обновлён'})

        # ── PRIZE FREQUENCY ──────────────────────────────────────────────────
        if action == 'get_prize_frequency':
            door_id = qs.get('door_id') or body.get('door_id')
            user = get_user_by_token(conn, token)
            if not user or user['role'] != 'admin':
                return err('Только для администратора', 403)
            if not door_id:
                return err('Нет door_id')
            with conn.cursor() as cur:
                cur.execute(f"SELECT id, every_n, prize_amount, description, sort_order FROM {S}.prize_frequency WHERE door_id=%s AND sort_order >= 0 ORDER BY sort_order, id", (door_id,))
                rows = cur.fetchall()
            keys_f = ['id','every_n','prize_amount','description','sort_order']
            return ok([dict(zip(keys_f, r)) for r in rows])

        if action == 'add_prize_frequency':
            user = get_user_by_token(conn, token)
            if not user or user['role'] != 'admin':
                return err('Только для администратора', 403)
            door_id = body.get('door_id')
            every_n = int(body.get('every_n', 1))
            prize_amount = int(body.get('prize_amount', 1000))
            description = body.get('description', f'Каждый {every_n}-й выигрывает {prize_amount:,} ₽')
            with conn.cursor() as cur:
                cur.execute(f"SELECT COALESCE(MAX(sort_order),0)+1 FROM {S}.prize_frequency WHERE door_id=%s", (door_id,))
                so = cur.fetchone()[0]
                cur.execute(f"INSERT INTO {S}.prize_frequency (door_id, every_n, prize_amount, description, sort_order) VALUES (%s,%s,%s,%s,%s) RETURNING id",
                            (door_id, every_n, prize_amount, description, so))
                new_id = cur.fetchone()[0]
            conn.commit()
            return ok({'id': new_id, 'message': 'Правило частоты добавлено'})

        if action == 'delete_prize_frequency':
            user = get_user_by_token(conn, token)
            if not user or user['role'] != 'admin':
                return err('Только для администратора', 403)
            freq_id = body.get('freq_id')
            if not freq_id:
                return err('Нет freq_id')
            with conn.cursor() as cur:
                cur.execute(f"UPDATE {S}.prize_frequency SET sort_order=-1 WHERE id=%s", (freq_id,))
            conn.commit()
            return ok({'message': 'Правило удалено'})

        # ── KEYS ──────────────────────────────────────────────────────────────
        if action == 'get_my_keys':
            user = get_user_by_token(conn, token)
            if not user:
                return err('Требуется авторизация', 401)
            with conn.cursor() as cur:
                cur.execute(f"""
                    SELECT uk.id, uk.door_id,
                           COALESCE(uk.key_type, 'common') as key_type,
                           COALESCE(uk.key_name, 'Стандартный ключ') as key_name,
                           COALESCE(uk.is_used, uk.used, FALSE) as is_used,
                           uk.purchased_at,
                           d.name as door_name
                    FROM {S}.user_keys uk
                    JOIN {S}.doors d ON d.id = uk.door_id
                    WHERE uk.user_id=%s
                    ORDER BY uk.purchased_at DESC""", (user['id'],))
                rows = cur.fetchall()
            keys_list = ['id','door_id','key_type','key_name','is_used','purchased_at','door_name']
            return ok([dict(zip(keys_list, r)) for r in rows])

        if action == 'buy_key':
            user = get_user_by_token(conn, token)
            if not user:
                return err('Требуется авторизация', 401)
            door_id = body.get('door_id')
            if not door_id:
                return err('Укажите door_id')

            with conn.cursor() as cur:
                cur.execute(f"SELECT id, name, key_price, key_type, is_active, is_trigger, key_name FROM {S}.doors WHERE id=%s", (door_id,))
                door = cur.fetchone()
            if not door:
                return err('Дверь не найдена')
            door_data = dict(zip(['id','name','key_price','key_type','is_active','is_trigger','key_name'], door))
            if not door_data['is_active']:
                return err('Дверь недоступна')

            # Если дверь не триггер — нужно чтобы пользователь открыл триггер-дверь
            if not door_data['is_trigger']:
                with conn.cursor() as cur:
                    cur.execute(f"""SELECT COUNT(*) FROM {S}.door_opens do2
                        JOIN {S}.doors d2 ON d2.id=do2.door_id
                        WHERE do2.user_id=%s AND d2.is_trigger=TRUE""", (user['id'],))
                    if cur.fetchone()[0] == 0:
                        return err('Сначала необходимо открыть стартовую дверь')

            price = door_data['key_price']
            if user['external_balance'] < price:
                return err(f'Недостаточно средств. Нужно {price} ₽, на счету {user["external_balance"]} ₽')

            key_name = door_data['key_name'] or 'Стандартный ключ'
            key_type = door_data['key_type'] or 'common'

            with conn.cursor() as cur:
                cur.execute(f"UPDATE {S}.users SET external_balance=external_balance-%s WHERE id=%s", (price, user['id']))
                cur.execute(f"""INSERT INTO {S}.user_keys (user_id, door_id, key_type, key_name, used, is_used)
                    VALUES (%s, %s, %s, %s, FALSE, FALSE) RETURNING id""",
                    (user['id'], door_id, key_type, key_name))
                key_id = cur.fetchone()[0]
                cur.execute(f"UPDATE {S}.doors SET keys_sold=COALESCE(keys_sold,0)+1 WHERE id=%s", (door_id,))
                cur.execute(f"""INSERT INTO {S}.transactions (user_id, type, amount, balance_type, description)
                    VALUES (%s, 'key_purchase', %s, 'external', %s)""",
                    (user['id'], -price, f'Покупка: {key_name} для «{door_data["name"]}»'))

                # Реферальный бонус (10%) при первой покупке ключа
                cur.execute(f"SELECT referred_by FROM {S}.users WHERE id=%s", (user['id'],))
                ref_row = cur.fetchone()
                if ref_row and ref_row[0]:
                    referrer_id = ref_row[0]
                    cur.execute(f"SELECT COUNT(*) FROM {S}.referral_earnings WHERE referred_id=%s", (user['id'],))
                    if cur.fetchone()[0] == 0:
                        bonus = price // 10
                        if bonus > 0:
                            cur.execute(f"UPDATE {S}.users SET referral_balance=referral_balance+%s WHERE id=%s", (bonus, referrer_id))
                            cur.execute(f"INSERT INTO {S}.referral_earnings (referrer_id, referred_id, amount, reason) VALUES (%s,%s,%s,'first_key_purchase')",
                                        (referrer_id, user['id'], bonus))
                            cur.execute(f"INSERT INTO {S}.transactions (user_id, type, amount, balance_type, description) VALUES (%s,'referral_bonus',%s,'referral','Реферальный бонус за приглашённого пользователя')",
                                        (referrer_id, bonus))
            conn.commit()
            return ok({'message': f'Ключ «{key_name}» куплен', 'key_id': key_id, 'key_name': key_name})

        # ── OPEN DOOR ─────────────────────────────────────────────────────────
        if action == 'open_door':
            user = get_user_by_token(conn, token)
            if not user:
                return err('Требуется авторизация', 401)
            door_id = body.get('door_id')
            key_id = body.get('key_id')
            if not door_id or not key_id:
                return err('Нужны door_id и key_id')

            with conn.cursor() as cur:
                cur.execute(f"SELECT id, name, key_type, is_active, draw_at, instant_open FROM {S}.doors WHERE id=%s", (door_id,))
                door = cur.fetchone()
            if not door:
                return err('Дверь не найдена')
            door_data = dict(zip(['id','name','key_type','is_active','draw_at','instant_open'], door))
            if not door_data['is_active']:
                return err('Дверь недоступна')

            if not door_data['instant_open'] and door_data['draw_at']:
                now = datetime.now(timezone.utc)
                draw_at = door_data['draw_at']
                if hasattr(draw_at, 'tzinfo') and draw_at.tzinfo is None:
                    draw_at = draw_at.replace(tzinfo=timezone.utc)
                if now < draw_at:
                    return err('Розыгрыш ещё не начался')

            with conn.cursor() as cur:
                cur.execute(f"SELECT id, COALESCE(is_used, used, FALSE), user_id FROM {S}.user_keys WHERE id=%s", (key_id,))
                key_row = cur.fetchone()
            if not key_row:
                return err('Ключ не найден')
            k_id, k_used, k_user_id = key_row
            if k_user_id != user['id']:
                return err('Это не ваш ключ')
            if k_used:
                return err('Ключ уже использован')

            # Считаем номер открытия для правил частоты
            with conn.cursor() as cur:
                cur.execute(f"SELECT COUNT(*) FROM {S}.door_opens WHERE user_id=%s AND door_id=%s", (user['id'], door_id))
                open_count = cur.fetchone()[0]

            open_number = open_count + 1
            prize_name = None
            prize_id_val = None

            # Проверяем правила частоты
            with conn.cursor() as cur:
                cur.execute(f"""SELECT every_n, prize_amount, description FROM {S}.prize_frequency
                    WHERE door_id=%s AND sort_order >= 0 ORDER BY every_n DESC""", (door_id,))
                freq_rules = cur.fetchall()

            for rule in freq_rules:
                every_n, prize_amount, description = rule
                if every_n > 0 and open_number % every_n == 0:
                    prize_name = description or f'{prize_amount:,} ₽'
                    break

            # Если не попал под правило — берём рандомный приз из списка
            if not prize_name:
                with conn.cursor() as cur:
                    cur.execute(f"""SELECT id, name FROM {S}.door_prizes
                        WHERE door_id=%s AND is_won=FALSE ORDER BY RANDOM() LIMIT 1""", (door_id,))
                    prize_row = cur.fetchone()

                if prize_row:
                    prize_id_val, prize_name = prize_row
                    with conn.cursor() as cur:
                        cur.execute(f"UPDATE {S}.door_prizes SET is_won=TRUE, won_by_user_id=%s, won_at=NOW() WHERE id=%s",
                                    (user['id'], prize_id_val))
                else:
                    prize_name = 'Участник розыгрыша'

            with conn.cursor() as cur:
                cur.execute(f"UPDATE {S}.user_keys SET used=TRUE, is_used=TRUE, used_at=NOW() WHERE id=%s", (key_id,))
                cur.execute(f"""INSERT INTO {S}.door_opens (user_id, door_id, prize_won, prize_id, user_key_id)
                    VALUES (%s, %s, %s, %s, %s) RETURNING id""",
                    (user['id'], door_id, prize_name, prize_id_val, key_id))
                open_id = cur.fetchone()[0]
            conn.commit()
            return ok({'message': f'Вы выиграли: {prize_name}', 'prize': prize_name, 'open_id': open_id})

        # ── TRANSACTIONS ─────────────────────────────────────────────────────
        if action == 'get_transactions':
            user = get_user_by_token(conn, token)
            if not user:
                return err('Требуется авторизация', 401)
            with conn.cursor() as cur:
                cur.execute(f"""SELECT id, type, amount,
                    COALESCE(balance_type, 'external') as balance_type,
                    description, status, created_at
                    FROM {S}.transactions WHERE user_id=%s ORDER BY created_at DESC LIMIT 100""", (user['id'],))
                rows = cur.fetchall()
            keys_list = ['id','type','amount','balance_type','description','status','created_at']
            return ok([dict(zip(keys_list, r)) for r in rows])

        if action == 'history':
            user = get_user_by_token(conn, token)
            if not user:
                return err('Требуется авторизация', 401)
            with conn.cursor() as cur:
                cur.execute(f"""SELECT do.id, do.prize_won, do.created_at, d.name, d.prize_icon
                    FROM {S}.door_opens do JOIN {S}.doors d ON d.id=do.door_id
                    WHERE do.user_id=%s ORDER BY do.created_at DESC LIMIT 50""", (user['id'],))
                rows = cur.fetchall()
            keys_list = ['id','prize_won','created_at','door_name','prize_icon']
            return ok([dict(zip(keys_list, r)) for r in rows])

        # ── DEPOSIT ───────────────────────────────────────────────────────────
        if action == 'request_deposit':
            user = get_user_by_token(conn, token)
            if not user:
                return err('Требуется авторизация', 401)
            amount = int(body.get('amount', 0))
            comment = (body.get('comment') or '').strip()
            if amount < 100:
                return err('Минимальная сумма пополнения 100 ₽')
            with conn.cursor() as cur:
                cur.execute(f"INSERT INTO {S}.deposit_requests (user_id, amount, status, comment) VALUES (%s,%s,'pending',%s) RETURNING id",
                            (user['id'], amount, comment))
                req_id = cur.fetchone()[0]
            conn.commit()
            return ok({'request_id': req_id, 'message': f'Заявка на пополнение {amount} ₽ создана. Администратор зачислит средства.'})

        # ── ADMIN ─────────────────────────────────────────────────────────────
        if action == 'admin_stats':
            user = get_user_by_token(conn, token)
            if not user or user['role'] != 'admin':
                return err('Только для администратора', 403)
            with conn.cursor() as cur:
                cur.execute(f"SELECT COUNT(*) FROM {S}.users WHERE role='user'")
                users_count = cur.fetchone()[0]
                cur.execute(f"SELECT COUNT(*) FROM {S}.door_opens")
                opens_count = cur.fetchone()[0]
                cur.execute(f"SELECT COALESCE(SUM(ABS(amount)),0) FROM {S}.transactions WHERE type='key_purchase'")
                revenue = int(cur.fetchone()[0])
                cur.execute(f"SELECT COUNT(*) FROM {S}.referral_earnings")
                ref_count = cur.fetchone()[0]
                cur.execute(f"SELECT COUNT(*) FROM {S}.deposit_requests WHERE status='pending'")
                pending_deposits = cur.fetchone()[0]
            return ok({'users': users_count, 'opens': opens_count, 'revenue': revenue,
                       'referrals': ref_count, 'pending_deposits': pending_deposits})

        if action == 'admin_users':
            user = get_user_by_token(conn, token)
            if not user or user['role'] != 'admin':
                return err('Только для администратора', 403)
            with conn.cursor() as cur:
                cur.execute(f"""SELECT id, name, full_name, email, phone, birth_date, role, referral_code,
                                       referred_by, external_balance, referral_balance, keys_count,
                                       level, is_blocked, is_main_admin, created_at
                    FROM {S}.users ORDER BY created_at DESC""")
                rows = cur.fetchall()
            keys_list = ['id','name','full_name','email','phone','birth_date','role','referral_code',
                         'referred_by','external_balance','referral_balance','keys_count',
                         'level','is_blocked','is_main_admin','created_at']
            return ok([dict(zip(keys_list, r)) for r in rows])

        if action == 'block_user':
            user = get_user_by_token(conn, token)
            if not user or user['role'] != 'admin':
                return err('Только для администратора', 403)
            uid = body.get('user_id')
            is_blocked = body.get('is_blocked', True)
            with conn.cursor() as cur:
                cur.execute(f"UPDATE {S}.users SET is_blocked=%s WHERE id=%s", (bool(is_blocked), uid))
            conn.commit()
            return ok({'message': 'Обновлено'})

        if action == 'admin_referrals':
            user = get_user_by_token(conn, token)
            if not user or user['role'] != 'admin':
                return err('Только для администратора', 403)
            with conn.cursor() as cur:
                cur.execute(f"""SELECT u.id, u.name, u.referral_code,
                               COUNT(DISTINCT inv.id) as invited,
                               COALESCE(SUM(re.amount),0) as earned
                        FROM {S}.users u
                        LEFT JOIN {S}.users inv ON inv.referred_by = u.id
                        LEFT JOIN {S}.referral_earnings re ON re.referrer_id = u.id
                        WHERE u.role='user'
                        GROUP BY u.id, u.name, u.referral_code
                        ORDER BY earned DESC""")
                rows = cur.fetchall()
            keys_list = ['id','name','referral_code','invited','earned']
            return ok([dict(zip(keys_list, r)) for r in rows])

        if action == 'admin_deposits':
            user = get_user_by_token(conn, token)
            if not user or user['role'] != 'admin':
                return err('Только для администратора', 403)
            with conn.cursor() as cur:
                cur.execute(f"""SELECT dr.id, dr.user_id, u.name, u.email, dr.amount, dr.status, dr.created_at,
                    COALESCE(dr.comment, '') as comment
                    FROM {S}.deposit_requests dr JOIN {S}.users u ON u.id=dr.user_id
                    ORDER BY dr.created_at DESC LIMIT 100""")
                rows = cur.fetchall()
            keys_list = ['id','user_id','user_name','user_email','amount','status','created_at','comment']
            return ok([dict(zip(keys_list, r)) for r in rows])

        if action == 'admin_confirm_deposit':
            user = get_user_by_token(conn, token)
            if not user or user['role'] != 'admin':
                return err('Только для администратора', 403)
            req_id = body.get('request_id')
            if not req_id:
                return err('Нет request_id')
            with conn.cursor() as cur:
                cur.execute(f"SELECT user_id, amount, status FROM {S}.deposit_requests WHERE id=%s", (req_id,))
                req = cur.fetchone()
            if not req:
                return err('Заявка не найдена')
            target_user_id, amount, status = req
            if status == 'completed':
                return err('Заявка уже выполнена')
            with conn.cursor() as cur:
                cur.execute(f"UPDATE {S}.deposit_requests SET status='completed', completed_at=NOW() WHERE id=%s", (req_id,))
                cur.execute(f"UPDATE {S}.users SET external_balance=external_balance+%s WHERE id=%s", (amount, target_user_id))
                cur.execute(f"""INSERT INTO {S}.transactions (user_id, type, amount, balance_type, description)
                    VALUES (%s, 'deposit', %s, 'external', 'Пополнение счёта')""",
                            (target_user_id, amount))
            conn.commit()
            return ok({'message': f'Баланс пополнен на {amount} ₽'})

        if action == 'admin_reject_deposit':
            user = get_user_by_token(conn, token)
            if not user or user['role'] != 'admin':
                return err('Только для администратора', 403)
            req_id = body.get('request_id')
            if not req_id:
                return err('Нет request_id')
            with conn.cursor() as cur:
                cur.execute(f"SELECT status FROM {S}.deposit_requests WHERE id=%s", (req_id,))
                req = cur.fetchone()
            if not req:
                return err('Заявка не найдена')
            if req[0] != 'pending':
                return err('Заявка уже обработана')
            with conn.cursor() as cur:
                cur.execute(f"UPDATE {S}.deposit_requests SET status='rejected', completed_at=NOW() WHERE id=%s", (req_id,))
            conn.commit()
            return ok({'message': 'Заявка отклонена'})

        return err('Неизвестное действие', 404)

    except Exception as e:
        conn.rollback()
        return err(f'Ошибка сервера: {str(e)}', 500)
    finally:
        conn.close()