"""
Авторизация: регистрация с ФИО/дата рождения/телефон, вход, выход, профиль.
Роутинг: ?action=register|login|me|logout|update|admin_set_role|admin_deposit|admin_delete_user
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

S = os.environ.get('MAIN_DB_SCHEMA', 't_p87395805_secret_key_draw')
_VERSION = '2'
CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Authorization',
}

def get_conn():
    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    conn.autocommit = False
    return conn

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
    base = re.sub(r'[^A-Za-z]', '', name).upper()[:4] or 'USER'
    suffix = ''.join(secrets.choice(string.ascii_uppercase + string.digits) for _ in range(4))
    return f"{base}{suffix}"

def create_session(conn, user_id: int) -> str:
    token = secrets.token_urlsafe(48)
    expires = datetime.now(timezone.utc) + timedelta(days=30)
    with conn.cursor() as cur:
        cur.execute(f"INSERT INTO {S}.sessions (user_id, token, expires_at) VALUES (%s, %s, %s)", (user_id, token, expires))
    conn.commit()
    return token

def get_user_by_token(conn, token: str):
    if not token:
        return None
    with conn.cursor() as cur:
        cur.execute(f"""
            SELECT u.id, u.name, u.full_name, u.email, u.phone, u.birth_date,
                   u.role, u.referral_code, u.referred_by,
                   u.external_balance, u.referral_balance,
                   u.keys_count, u.level, u.level_progress, u.is_blocked, u.is_main_admin
            FROM {S}.sessions s JOIN {S}.users u ON u.id = s.user_id
            WHERE s.token = %s AND s.expires_at > NOW()""", (token,))
        row = cur.fetchone()
    if not row:
        return None
    keys = ['id','name','full_name','email','phone','birth_date','role','referral_code',
            'referred_by','external_balance','referral_balance','keys_count',
            'level','level_progress','is_blocked','is_main_admin']
    u = dict(zip(keys, row))
    if u['birth_date']:
        u['birth_date'] = u['birth_date'].strftime('%Y-%m-%d')
    return u

def ok(data):
    return {'statusCode': 200, 'headers': {**CORS, 'Content-Type': 'application/json'}, 'body': json.dumps(data, ensure_ascii=False, default=str)}

def err(msg, code=400):
    return {'statusCode': code, 'headers': {**CORS, 'Content-Type': 'application/json'}, 'body': json.dumps({'error': msg}, ensure_ascii=False)}

def handler(event: dict, context) -> dict:
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
        return ok({'status': 'ok', 'service': 'auth'})

    if action == 'register':
        name = (body.get('name') or '').strip()
        full_name = (body.get('full_name') or '').strip()
        email = (body.get('email') or '').strip().lower()
        phone = (body.get('phone') or '').strip()
        birth_date = (body.get('birth_date') or '').strip()
        password = body.get('password', '')
        ref_code = (body.get('referral_code') or '').strip().upper()

        if not name or not email or not password or not phone or not birth_date:
            return err('Заполните все поля: имя, email, телефон, дата рождения, пароль')
        if len(password) < 6:
            return err('Пароль минимум 6 символов')
        if not re.match(r'^[^@]+@[^@]+\.[^@]+$', email):
            return err('Некорректный email')
        if not re.match(r'^\d{4}-\d{2}-\d{2}$', birth_date):
            return err('Дата рождения в формате ГГГГ-ММ-ДД')

        conn = get_conn()
        try:
            with conn.cursor() as cur:
                cur.execute(f"SELECT id FROM {S}.users WHERE email = %s", (email,))
                if cur.fetchone():
                    return err('Пользователь с таким email уже существует')

                referrer_id = None
                if ref_code:
                    cur.execute(f"SELECT id FROM {S}.users WHERE referral_code = %s", (ref_code,))
                    ref_row = cur.fetchone()
                    if not ref_row:
                        return err('Реферальный код не найден')
                    referrer_id = ref_row[0]

                my_code = gen_referral_code(name)
                for _ in range(5):
                    cur.execute(f"SELECT id FROM {S}.users WHERE referral_code = %s", (my_code,))
                    if not cur.fetchone():
                        break
                    my_code = gen_referral_code(name)

                ph = hash_password(password)
                cur.execute(f"""
                    INSERT INTO {S}.users (name, full_name, email, phone, birth_date, password_hash, referral_code, referred_by)
                    VALUES (%s,%s,%s,%s,%s,%s,%s,%s) RETURNING id""",
                    (name, full_name or name, email, phone, birth_date, ph, my_code, referrer_id))
                user_id = cur.fetchone()[0]
            conn.commit()
            sess_token = create_session(conn, user_id)
            return ok({'token': sess_token, 'message': 'Регистрация успешна'})
        finally:
            conn.close()

    if action == 'login':
        email = (body.get('email') or '').strip().lower()
        password = body.get('password', '')
        if not email or not password:
            return err('Введите email и пароль')
        conn = get_conn()
        try:
            with conn.cursor() as cur:
                cur.execute(f"SELECT id, password_hash, is_blocked FROM {S}.users WHERE email = %s", (email,))
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

    if action == 'me':
        if not token:
            return err('Требуется авторизация', 401)
        conn = get_conn()
        try:
            user = get_user_by_token(conn, token)
            if not user:
                return err('Токен недействителен', 401)
            ref_row = (0, 0)
            invited_count = 0
            keys_available = 0
            try:
                with conn.cursor() as cur:
                    cur.execute(f"SELECT COUNT(*), COALESCE(SUM(amount),0) FROM {S}.referral_earnings WHERE referrer_id = %s", (user['id'],))
                    ref_row = cur.fetchone()
                    cur.execute(f"SELECT COUNT(*) FROM {S}.users WHERE referred_by = %s", (user['id'],))
                    invited_count = cur.fetchone()[0]
                    cur.execute(f"SELECT COUNT(*) FROM {S}.user_keys WHERE user_id=%s AND is_used=FALSE", (user['id'],))
                    keys_available = cur.fetchone()[0]
            except Exception:
                conn.rollback()
            user['referral_earned'] = int(ref_row[1])
            user['referral_invited'] = invited_count
            user['keys_available'] = keys_available
            user['balance'] = user['external_balance']
            return ok(user)
        finally:
            conn.close()

    if action == 'logout':
        if token:
            conn = get_conn()
            try:
                with conn.cursor() as cur:
                    cur.execute(f"UPDATE {S}.sessions SET expires_at = NOW() WHERE token = %s", (token,))
                conn.commit()
            finally:
                conn.close()
        return ok({'message': 'Выход выполнен'})

    if action == 'update':
        if not token:
            return err('Требуется авторизация', 401)
        conn = get_conn()
        try:
            user = get_user_by_token(conn, token)
            if not user:
                return err('Токен недействителен', 401)
            name = (body.get('name') or user['name']).strip()
            full_name = (body.get('full_name') or user.get('full_name') or '').strip()
            phone = (body.get('phone') or user.get('phone') or '').strip()
            birth_date = body.get('birth_date') or user.get('birth_date') or None
            with conn.cursor() as cur:
                cur.execute(f"UPDATE {S}.users SET name=%s, full_name=%s, phone=%s, birth_date=%s WHERE id=%s",
                            (name, full_name, phone, birth_date or None, user['id']))
            conn.commit()
            return ok({'message': 'Профиль обновлён'})
        finally:
            conn.close()

    if action == 'admin_set_role':
        if not token:
            return err('Требуется авторизация', 401)
        conn = get_conn()
        try:
            caller = get_user_by_token(conn, token)
            if not caller or caller['role'] != 'admin':
                return err('Только для администратора', 403)
            target_id = body.get('user_id')
            role = body.get('role', 'user')
            if role not in ('user', 'admin'):
                return err('Недопустимая роль')
            if not caller.get('is_main_admin') and role == 'admin':
                return err('Только главный администратор может назначать администраторов', 403)
            with conn.cursor() as cur:
                cur.execute(f"UPDATE {S}.users SET role=%s WHERE id=%s", (role, target_id))
            conn.commit()
            return ok({'message': f'Роль обновлена'})
        finally:
            conn.close()

    if action == 'admin_deposit':
        if not token:
            return err('Требуется авторизация', 401)
        conn = get_conn()
        try:
            caller = get_user_by_token(conn, token)
            if not caller or caller['role'] != 'admin':
                return err('Только для администратора', 403)
            target_id = body.get('user_id')
            amount = int(body.get('amount', 0))
            balance_type = body.get('balance_type', 'external')
            desc = body.get('description', 'Ручное пополнение администратором')
            if amount <= 0:
                return err('Сумма должна быть больше 0')
            with conn.cursor() as cur:
                if balance_type == 'referral':
                    cur.execute(f"UPDATE {S}.users SET referral_balance=referral_balance+%s WHERE id=%s", (amount, target_id))
                else:
                    cur.execute(f"UPDATE {S}.users SET external_balance=external_balance+%s WHERE id=%s", (amount, target_id))
                cur.execute(f"INSERT INTO {S}.transactions (user_id,type,amount,balance_type,description,status) VALUES (%s,'deposit',%s,%s,%s,'completed')",
                            (target_id, amount, balance_type, desc))
            conn.commit()
            return ok({'message': 'Баланс пополнен'})
        finally:
            conn.close()

    if action == 'admin_delete_user':
        if not token:
            return err('Требуется авторизация', 401)
        conn = get_conn()
        try:
            caller = get_user_by_token(conn, token)
            if not caller or not caller.get('is_main_admin'):
                return err('Только для главного администратора', 403)
            target_id = body.get('user_id')
            confirm = body.get('confirm', '')
            if confirm != 'Удалить?':
                return err('Введите "Удалить?" для подтверждения')
            if target_id == caller['id']:
                return err('Нельзя удалить самого себя')
            with conn.cursor() as cur:
                # Блокируем вместо физического удаления (чтобы сохранить историю)
                cur.execute(f"UPDATE {S}.users SET is_blocked=TRUE, email=CONCAT('deleted_', id, '_', email) WHERE id=%s", (target_id,))
                cur.execute(f"UPDATE {S}.sessions SET expires_at=NOW() WHERE user_id=%s", (target_id,))
            conn.commit()
            return ok({'message': 'Пользователь удалён'})
        finally:
            conn.close()

    return err('Неизвестное действие', 400)