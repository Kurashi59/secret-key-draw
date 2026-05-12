"""
Авторизация: регистрация, вход, выход, профиль.
Поддерживает реферальные коды при регистрации.
"""
import json
import os
import hashlib
import hmac
import secrets
import string
import re
import psycopg2
from datetime import datetime, timedelta, timezone

SCHEMA = os.environ.get('MAIN_DB_SCHEMA', 't_p87395805_secret_key_draw')
CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Authorization',
}

def get_conn():
    return psycopg2.connect(os.environ['DATABASE_URL'])

def hash_password(password: str) -> str:
    salt = secrets.token_hex(16)
    h = hashlib.pbkdf2_hmac('sha256', password.encode(), salt.encode(), 100000)
    return f"{salt}:{h.hex()}"

def verify_password(password: str, stored: str) -> bool:
    try:
        salt, h = stored.split(':')
        check = hashlib.pbkdf2_hmac('sha256', password.encode(), salt.encode(), 100000)
        return hmac.compare_digest(h, check.hex())
    except Exception:
        return False

def gen_referral_code(name: str) -> str:
    base = re.sub(r'[^A-Za-zА-Яа-яЁё]', '', name).upper()[:4] or 'USER'
    suffix = ''.join(secrets.choice(string.ascii_uppercase + string.digits) for _ in range(4))
    return f"{base}{suffix}"

def create_session(conn, user_id: int) -> str:
    token = secrets.token_urlsafe(48)
    expires = datetime.now(timezone.utc) + timedelta(days=30)
    with conn.cursor() as cur:
        cur.execute(
            f"INSERT INTO {SCHEMA}.sessions (user_id, token, expires_at) VALUES (%s, %s, %s)",
            (user_id, token, expires)
        )
    conn.commit()
    return token

def get_user_by_token(conn, token: str):
    with conn.cursor() as cur:
        cur.execute(
            f"""SELECT u.id, u.name, u.email, u.phone, u.role, u.referral_code,
                       u.referred_by, u.balance, u.keys_count, u.level, u.level_progress, u.is_blocked
                FROM {SCHEMA}.sessions s
                JOIN {SCHEMA}.users u ON u.id = s.user_id
                WHERE s.token = %s AND s.expires_at > NOW()""",
            (token,)
        )
        row = cur.fetchone()
    if not row:
        return None
    keys = ['id','name','email','phone','role','referral_code','referred_by',
            'balance','keys_count','level','level_progress','is_blocked']
    return dict(zip(keys, row))

def ok(data):
    return {'statusCode': 200, 'headers': {**CORS, 'Content-Type': 'application/json'}, 'body': json.dumps(data, ensure_ascii=False, default=str)}

def err(msg, code=400):
    return {'statusCode': code, 'headers': {**CORS, 'Content-Type': 'application/json'}, 'body': json.dumps({'error': msg}, ensure_ascii=False)}

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

    # GET / — health
    if method == 'GET' and (path == '' or path.endswith('/')):
        return ok({'status': 'ok'})

    # POST /register
    if method == 'POST' and path.endswith('/register'):
        name = (body.get('name') or '').strip()
        email = (body.get('email') or '').strip().lower()
        password = body.get('password', '')
        ref_code = (body.get('referral_code') or '').strip().upper()

        if not name or not email or not password:
            return err('Заполните все обязательные поля')
        if len(password) < 6:
            return err('Пароль минимум 6 символов')
        if not re.match(r'^[^@]+@[^@]+\.[^@]+$', email):
            return err('Некорректный email')

        conn = get_conn()
        try:
            with conn.cursor() as cur:
                cur.execute(f"SELECT id FROM {SCHEMA}.users WHERE email = %s", (email,))
                if cur.fetchone():
                    return err('Пользователь с таким email уже существует')

                referrer_id = None
                if ref_code:
                    cur.execute(f"SELECT id FROM {SCHEMA}.users WHERE referral_code = %s", (ref_code,))
                    ref_row = cur.fetchone()
                    if not ref_row:
                        return err('Реферальный код не найден')
                    referrer_id = ref_row[0]

                my_code = gen_referral_code(name)
                # ensure unique
                attempts = 0
                while attempts < 5:
                    cur.execute(f"SELECT id FROM {SCHEMA}.users WHERE referral_code = %s", (my_code,))
                    if not cur.fetchone():
                        break
                    my_code = gen_referral_code(name)
                    attempts += 1

                ph = hash_password(password)
                cur.execute(
                    f"""INSERT INTO {SCHEMA}.users (name, email, password_hash, referral_code, referred_by)
                        VALUES (%s, %s, %s, %s, %s) RETURNING id""",
                    (name, email, ph, my_code, referrer_id)
                )
                user_id = cur.fetchone()[0]
            conn.commit()

            sess_token = create_session(conn, user_id)
            return ok({'token': sess_token, 'message': 'Регистрация успешна'})
        finally:
            conn.close()

    # POST /login
    if method == 'POST' and path.endswith('/login'):
        email = (body.get('email') or '').strip().lower()
        password = body.get('password', '')
        if not email or not password:
            return err('Введите email и пароль')

        conn = get_conn()
        try:
            with conn.cursor() as cur:
                cur.execute(
                    f"SELECT id, password_hash, is_blocked FROM {SCHEMA}.users WHERE email = %s",
                    (email,)
                )
                row = cur.fetchone()
            if not row:
                return err('Неверный email или пароль')
            user_id, ph, is_blocked = row
            if is_blocked:
                return err('Аккаунт заблокирован')
            if not verify_password(password, ph):
                return err('Неверный email или пароль')

            sess_token = create_session(conn, user_id)
            return ok({'token': sess_token, 'message': 'Вход выполнен'})
        finally:
            conn.close()

    # GET /me
    if method == 'GET' and path.endswith('/me'):
        if not token:
            return err('Требуется авторизация', 401)
        conn = get_conn()
        try:
            user = get_user_by_token(conn, token)
            if not user:
                return err('Токен недействителен', 401)
            # get referral stats
            with conn.cursor() as cur:
                cur.execute(
                    f"SELECT COUNT(*), COALESCE(SUM(amount),0) FROM {SCHEMA}.referral_earnings WHERE referrer_id = %s",
                    (user['id'],)
                )
                ref_row = cur.fetchone()
                cur.execute(
                    f"SELECT COUNT(*) FROM {SCHEMA}.users WHERE referred_by = %s",
                    (user['id'],)
                )
                invited_count = cur.fetchone()[0]
            user['referral_earned'] = int(ref_row[1])
            user['referral_invited'] = invited_count
            return ok(user)
        finally:
            conn.close()

    # POST /logout
    if method == 'POST' and path.endswith('/logout'):
        if token:
            conn = get_conn()
            try:
                with conn.cursor() as cur:
                    cur.execute(f"UPDATE {SCHEMA}.sessions SET expires_at = NOW() WHERE token = %s", (token,))
                conn.commit()
            finally:
                conn.close()
        return ok({'message': 'Выход выполнен'})

    # PUT /me — update profile
    if method == 'PUT' and path.endswith('/me'):
        if not token:
            return err('Требуется авторизация', 401)
        conn = get_conn()
        try:
            user = get_user_by_token(conn, token)
            if not user:
                return err('Токен недействителен', 401)

            name = (body.get('name') or user['name']).strip()
            phone = (body.get('phone') or user.get('phone') or '').strip()

            with conn.cursor() as cur:
                cur.execute(
                    f"UPDATE {SCHEMA}.users SET name=%s, phone=%s WHERE id=%s",
                    (name, phone, user['id'])
                )
            conn.commit()
            return ok({'message': 'Профиль обновлён'})
        finally:
            conn.close()

    return err('Not found', 404)