"""
API для получения и редактирования контента сайта: тексты, контакты, двери.
Изменения сразу отображаются на сайте.
"""
import json
import os
import psycopg2
from datetime import datetime, timezone

SCHEMA = os.environ.get('MAIN_DB_SCHEMA', 't_p87395805_secret_key_draw')
CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Authorization',
}

def get_conn():
    return psycopg2.connect(os.environ['DATABASE_URL'])

def ok(data):
    return {'statusCode': 200, 'headers': {**CORS, 'Content-Type': 'application/json'}, 'body': json.dumps(data, ensure_ascii=False, default=str)}

def err(msg, code=400):
    return {'statusCode': code, 'headers': {**CORS, 'Content-Type': 'application/json'}, 'body': json.dumps({'error': msg}, ensure_ascii=False)}

def get_user_by_token(conn, token: str):
    if not token:
        return None
    with conn.cursor() as cur:
        cur.execute(
            f"""SELECT u.id, u.role FROM {SCHEMA}.sessions s
                JOIN {SCHEMA}.users u ON u.id = s.user_id
                WHERE s.token = %s AND s.expires_at > NOW()""",
            (token,)
        )
        row = cur.fetchone()
    if not row:
        return None
    return {'id': row[0], 'role': row[1]}

def handler(event: dict, context) -> dict:
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS, 'body': ''}

    path = event.get('path', '').rstrip('/')
    method = event.get('httpMethod', 'GET')
    body = {}
    if event.get('body'):
        try:
            body = json.loads(event['body'])
        except Exception:
            pass

    token = (event.get('headers') or {}).get('X-Authorization', '').replace('Bearer ', '').strip()

    if method == 'GET' and (path == '' or path.endswith('/')):
        return ok({'status': 'ok'})

    conn = get_conn()

    try:
        # GET /site — get all site content
        if method == 'GET' and path.endswith('/site'):
            with conn.cursor() as cur:
                cur.execute(f"SELECT key, value, label FROM {SCHEMA}.site_content ORDER BY key")
                rows = cur.fetchall()
            data = {r[0]: {'value': r[1], 'label': r[2]} for r in rows}
            return ok(data)

        # PUT /site — update site content (admin only)
        if method == 'PUT' and path.endswith('/site'):
            user = get_user_by_token(conn, token)
            if not user or user['role'] != 'admin':
                return err('Только для администратора', 403)
            updates = body.get('updates', {})
            with conn.cursor() as cur:
                for key, value in updates.items():
                    cur.execute(
                        f"UPDATE {SCHEMA}.site_content SET value=%s, updated_at=NOW() WHERE key=%s",
                        (str(value), key)
                    )
            conn.commit()
            return ok({'message': 'Контент обновлён'})

        # GET /contacts — get contacts
        if method == 'GET' and path.endswith('/contacts'):
            with conn.cursor() as cur:
                cur.execute(f"SELECT key, value, label FROM {SCHEMA}.contacts_info ORDER BY key")
                rows = cur.fetchall()
            data = {r[0]: {'value': r[1], 'label': r[2]} for r in rows}
            return ok(data)

        # PUT /contacts — update contacts (admin)
        if method == 'PUT' and path.endswith('/contacts'):
            user = get_user_by_token(conn, token)
            if not user or user['role'] != 'admin':
                return err('Только для администратора', 403)
            updates = body.get('updates', {})
            with conn.cursor() as cur:
                for key, value in updates.items():
                    cur.execute(
                        f"UPDATE {SCHEMA}.contacts_info SET value=%s, updated_at=NOW() WHERE key=%s",
                        (str(value), key)
                    )
            conn.commit()
            return ok({'message': 'Контакты обновлены'})

        # GET /doors — get all doors
        if method == 'GET' and path.endswith('/doors'):
            with conn.cursor() as cur:
                cur.execute(
                    f"""SELECT id, name, prize, prize_icon, key_price, rarity, keys_sold, is_active, sort_order
                        FROM {SCHEMA}.doors WHERE is_active = TRUE ORDER BY sort_order""")
                rows = cur.fetchall()
            keys = ['id','name','prize','prize_icon','key_price','rarity','keys_sold','is_active','sort_order']
            return ok([dict(zip(keys, r)) for r in rows])

        # GET /doors/all — admin: all doors including inactive
        if method == 'GET' and path.endswith('/doors/all'):
            user = get_user_by_token(conn, token)
            if not user or user['role'] != 'admin':
                return err('Только для администратора', 403)
            with conn.cursor() as cur:
                cur.execute(
                    f"""SELECT id, name, prize, prize_icon, key_price, rarity, keys_sold, is_active, sort_order
                        FROM {SCHEMA}.doors ORDER BY sort_order""")
                rows = cur.fetchall()
            keys = ['id','name','prize','prize_icon','key_price','rarity','keys_sold','is_active','sort_order']
            return ok([dict(zip(keys, r)) for r in rows])

        # PUT /doors/{id} — update door (admin)
        if method == 'PUT' and '/doors/' in path:
            user = get_user_by_token(conn, token)
            if not user or user['role'] != 'admin':
                return err('Только для администратора', 403)
            door_id = path.split('/doors/')[-1].split('/')[0]
            name = body.get('name')
            prize = body.get('prize')
            prize_icon = body.get('prize_icon')
            key_price = body.get('key_price')
            rarity = body.get('rarity')
            is_active = body.get('is_active')
            with conn.cursor() as cur:
                if name is not None:
                    cur.execute(f"UPDATE {SCHEMA}.doors SET name=%s WHERE id=%s", (name, door_id))
                if prize is not None:
                    cur.execute(f"UPDATE {SCHEMA}.doors SET prize=%s WHERE id=%s", (prize, door_id))
                if prize_icon is not None:
                    cur.execute(f"UPDATE {SCHEMA}.doors SET prize_icon=%s WHERE id=%s", (prize_icon, door_id))
                if key_price is not None:
                    cur.execute(f"UPDATE {SCHEMA}.doors SET key_price=%s WHERE id=%s", (int(key_price), door_id))
                if rarity is not None:
                    cur.execute(f"UPDATE {SCHEMA}.doors SET rarity=%s WHERE id=%s", (rarity, door_id))
                if is_active is not None:
                    cur.execute(f"UPDATE {SCHEMA}.doors SET is_active=%s WHERE id=%s", (bool(is_active), door_id))
            conn.commit()
            return ok({'message': 'Дверь обновлена'})

        # POST /doors — create door (admin)
        if method == 'POST' and path.endswith('/doors'):
            user = get_user_by_token(conn, token)
            if not user or user['role'] != 'admin':
                return err('Только для администратора', 403)
            name = body.get('name', 'Новая дверь')
            prize = body.get('prize', 'Приз')
            prize_icon = body.get('prize_icon', '🎁')
            key_price = int(body.get('key_price', 99))
            rarity = body.get('rarity', 'common')
            with conn.cursor() as cur:
                cur.execute(
                    f"SELECT COALESCE(MAX(sort_order),0)+1 FROM {SCHEMA}.doors"
                )
                sort_order = cur.fetchone()[0]
                cur.execute(
                    f"""INSERT INTO {SCHEMA}.doors (name, prize, prize_icon, key_price, rarity, sort_order)
                        VALUES (%s,%s,%s,%s,%s,%s) RETURNING id""",
                    (name, prize, prize_icon, key_price, rarity, sort_order)
                )
                new_id = cur.fetchone()[0]
            conn.commit()
            return ok({'id': new_id, 'message': 'Дверь создана'})

        # GET /admin/stats — admin dashboard stats
        if method == 'GET' and path.endswith('/admin/stats'):
            user = get_user_by_token(conn, token)
            if not user or user['role'] != 'admin':
                return err('Только для администратора', 403)
            with conn.cursor() as cur:
                cur.execute(f"SELECT COUNT(*) FROM {SCHEMA}.users WHERE role='user'")
                users_count = cur.fetchone()[0]
                cur.execute(f"SELECT COUNT(*) FROM {SCHEMA}.door_opens")
                opens_count = cur.fetchone()[0]
                cur.execute(f"SELECT COALESCE(SUM(key_price * keys_sold), 0) FROM {SCHEMA}.doors")
                revenue = cur.fetchone()[0]
                cur.execute(f"SELECT COUNT(*) FROM {SCHEMA}.referral_earnings")
                ref_count = cur.fetchone()[0]
            return ok({
                'users': users_count,
                'opens': opens_count,
                'revenue': revenue,
                'referrals': ref_count,
            })

        # GET /admin/users — all users (admin)
        if method == 'GET' and path.endswith('/admin/users'):
            user = get_user_by_token(conn, token)
            if not user or user['role'] != 'admin':
                return err('Только для администратора', 403)
            with conn.cursor() as cur:
                cur.execute(
                    f"""SELECT id, name, email, phone, role, referral_code, referred_by,
                               balance, keys_count, level, is_blocked, created_at
                        FROM {SCHEMA}.users ORDER BY created_at DESC"""
                )
                rows = cur.fetchall()
            keys = ['id','name','email','phone','role','referral_code','referred_by',
                    'balance','keys_count','level','is_blocked','created_at']
            return ok([dict(zip(keys, r)) for r in rows])

        # PUT /admin/users/{id}/block — block/unblock (admin)
        if method == 'PUT' and '/admin/users/' in path:
            user = get_user_by_token(conn, token)
            if not user or user['role'] != 'admin':
                return err('Только для администратора', 403)
            uid = path.split('/admin/users/')[-1].split('/')[0]
            block = body.get('is_blocked', True)
            with conn.cursor() as cur:
                cur.execute(f"UPDATE {SCHEMA}.users SET is_blocked=%s WHERE id=%s", (bool(block), uid))
            conn.commit()
            return ok({'message': 'Обновлено'})

        # GET /admin/referrals — referral network (admin)
        if method == 'GET' and path.endswith('/admin/referrals'):
            user = get_user_by_token(conn, token)
            if not user or user['role'] != 'admin':
                return err('Только для администратора', 403)
            with conn.cursor() as cur:
                cur.execute(
                    f"""SELECT u.id, u.name, u.referral_code,
                               COUNT(DISTINCT inv.id) as invited,
                               COALESCE(SUM(re.amount),0) as earned
                        FROM {SCHEMA}.users u
                        LEFT JOIN {SCHEMA}.users inv ON inv.referred_by = u.id
                        LEFT JOIN {SCHEMA}.referral_earnings re ON re.referrer_id = u.id
                        WHERE u.role='user'
                        GROUP BY u.id, u.name, u.referral_code
                        ORDER BY earned DESC"""
                )
                rows = cur.fetchall()
            keys = ['id','name','referral_code','invited','earned']
            return ok([dict(zip(keys, r)) for r in rows])

        # GET /history — user's door opens
        if method == 'GET' and path.endswith('/history'):
            user = get_user_by_token(conn, token)
            if not user:
                return err('Требуется авторизация', 401)
            with conn.cursor() as cur:
                cur.execute(
                    f"""SELECT do.id, do.prize_won, do.amount_won, do.created_at, d.name, d.prize_icon
                        FROM {SCHEMA}.door_opens do
                        JOIN {SCHEMA}.doors d ON d.id = do.door_id
                        WHERE do.user_id = %s ORDER BY do.created_at DESC LIMIT 50""",
                    (user['id'],)
                )
                rows = cur.fetchall()
            keys = ['id','prize_won','amount_won','created_at','door_name','prize_icon']
            return ok([dict(zip(keys, r)) for r in rows])

        return err('Not found', 404)

    finally:
        conn.close()