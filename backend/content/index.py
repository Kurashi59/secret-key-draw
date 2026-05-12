"""
API контента: тексты сайта, контакты, двери, пользователи.
Роутинг через query param: ?action=...
"""
import json
import os
import psycopg2

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

    method = event.get('httpMethod', 'GET')
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
        # site — get
        if action == 'get_site':
            with conn.cursor() as cur:
                cur.execute(f"SELECT key, value, label FROM {SCHEMA}.site_content ORDER BY key")
                rows = cur.fetchall()
            return ok({r[0]: {'value': r[1], 'label': r[2]} for r in rows})

        # site — update (admin)
        if action == 'update_site':
            user = get_user_by_token(conn, token)
            if not user or user['role'] != 'admin':
                return err('Только для администратора', 403)
            updates = body.get('updates', {})
            with conn.cursor() as cur:
                for key, value in updates.items():
                    cur.execute(f"UPDATE {SCHEMA}.site_content SET value=%s, updated_at=NOW() WHERE key=%s", (str(value), key))
            conn.commit()
            return ok({'message': 'Контент обновлён'})

        # contacts — get
        if action == 'get_contacts':
            with conn.cursor() as cur:
                cur.execute(f"SELECT key, value, label FROM {SCHEMA}.contacts_info ORDER BY key")
                rows = cur.fetchall()
            return ok({r[0]: {'value': r[1], 'label': r[2]} for r in rows})

        # contacts — update (admin)
        if action == 'update_contacts':
            user = get_user_by_token(conn, token)
            if not user or user['role'] != 'admin':
                return err('Только для администратора', 403)
            updates = body.get('updates', {})
            with conn.cursor() as cur:
                for key, value in updates.items():
                    cur.execute(f"UPDATE {SCHEMA}.contacts_info SET value=%s, updated_at=NOW() WHERE key=%s", (str(value), key))
            conn.commit()
            return ok({'message': 'Контакты обновлены'})

        # doors — public list
        if action == 'get_doors':
            with conn.cursor() as cur:
                cur.execute(
                    f"SELECT id,name,prize,prize_icon,key_price,rarity,keys_sold,is_active,sort_order FROM {SCHEMA}.doors WHERE is_active=TRUE ORDER BY sort_order"
                )
                rows = cur.fetchall()
            keys = ['id','name','prize','prize_icon','key_price','rarity','keys_sold','is_active','sort_order']
            return ok([dict(zip(keys, r)) for r in rows])

        # doors — all (admin)
        if action == 'get_all_doors':
            user = get_user_by_token(conn, token)
            if not user or user['role'] != 'admin':
                return err('Только для администратора', 403)
            with conn.cursor() as cur:
                cur.execute(
                    f"SELECT id,name,prize,prize_icon,key_price,rarity,keys_sold,is_active,sort_order FROM {SCHEMA}.doors ORDER BY sort_order"
                )
                rows = cur.fetchall()
            keys = ['id','name','prize','prize_icon','key_price','rarity','keys_sold','is_active','sort_order']
            return ok([dict(zip(keys, r)) for r in rows])

        # update door (admin)
        if action == 'update_door':
            user = get_user_by_token(conn, token)
            if not user or user['role'] != 'admin':
                return err('Только для администратора', 403)
            door_id = body.get('id')
            if not door_id:
                return err('Нет id двери')
            fields = ['name','prize','prize_icon','key_price','rarity','is_active']
            with conn.cursor() as cur:
                for f in fields:
                    if f in body:
                        val = int(body[f]) if f == 'key_price' else body[f]
                        cur.execute(f"UPDATE {SCHEMA}.doors SET {f}=%s WHERE id=%s", (val, door_id))
            conn.commit()
            return ok({'message': 'Дверь обновлена'})

        # create door (admin)
        if action == 'create_door':
            user = get_user_by_token(conn, token)
            if not user or user['role'] != 'admin':
                return err('Только для администратора', 403)
            with conn.cursor() as cur:
                cur.execute(f"SELECT COALESCE(MAX(sort_order),0)+1 FROM {SCHEMA}.doors")
                sort_order = cur.fetchone()[0]
                cur.execute(
                    f"INSERT INTO {SCHEMA}.doors (name,prize,prize_icon,key_price,rarity,sort_order) VALUES (%s,%s,%s,%s,%s,%s) RETURNING id",
                    (body.get('name','Новая дверь'), body.get('prize','Приз'), body.get('prize_icon','🎁'), int(body.get('key_price',99)), body.get('rarity','common'), sort_order)
                )
                new_id = cur.fetchone()[0]
            conn.commit()
            return ok({'id': new_id, 'message': 'Дверь создана'})

        # admin stats
        if action == 'admin_stats':
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
            return ok({'users': users_count, 'opens': opens_count, 'revenue': int(revenue), 'referrals': ref_count})

        # admin users list
        if action == 'admin_users':
            user = get_user_by_token(conn, token)
            if not user or user['role'] != 'admin':
                return err('Только для администратора', 403)
            with conn.cursor() as cur:
                cur.execute(
                    f"SELECT id,name,email,phone,role,referral_code,referred_by,balance,keys_count,level,is_blocked,created_at FROM {SCHEMA}.users ORDER BY created_at DESC"
                )
                rows = cur.fetchall()
            keys = ['id','name','email','phone','role','referral_code','referred_by','balance','keys_count','level','is_blocked','created_at']
            return ok([dict(zip(keys, r)) for r in rows])

        # block/unblock user (admin)
        if action == 'block_user':
            user = get_user_by_token(conn, token)
            if not user or user['role'] != 'admin':
                return err('Только для администратора', 403)
            uid = body.get('user_id')
            is_blocked = body.get('is_blocked', True)
            with conn.cursor() as cur:
                cur.execute(f"UPDATE {SCHEMA}.users SET is_blocked=%s WHERE id=%s", (bool(is_blocked), uid))
            conn.commit()
            return ok({'message': 'Обновлено'})

        # admin referrals
        if action == 'admin_referrals':
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

        # user history
        if action == 'history':
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

        return err('Неизвестное действие', 400)

    finally:
        conn.close()
