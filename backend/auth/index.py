"""
Авторизация: вход по номеру пайщика, профиль, смена пароля, управление пользователями.
Свободная регистрация отключена — учётные записи создаёт только администратор.
Роутинг: ?action=login|me|logout|update|change_password|admin_create_user|admin_update_mentors|admin_reset_password|admin_set_role|admin_deposit|admin_delete_user|admin_mentor_log
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
_VERSION = '3'
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

def gen_password(length: int = 8) -> str:
    alphabet = string.ascii_uppercase + string.ascii_lowercase + string.digits
    return ''.join(secrets.choice(alphabet) for _ in range(length))

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
                   u.role, u.referral_code, u.referred_by, u.member_number,
                   u.mentor1_id, u.mentor2_id, u.mentor3_id,
                   u.external_balance, u.referral_balance,
                   u.keys_count, u.level, u.level_progress, u.is_blocked, u.is_main_admin
            FROM {S}.sessions s JOIN {S}.users u ON u.id = s.user_id
            WHERE s.token = %s AND s.expires_at > NOW()""", (token,))
        row = cur.fetchone()
    if not row:
        return None
    keys = ['id','name','full_name','email','phone','birth_date','role','referral_code',
            'referred_by','member_number','mentor1_id','mentor2_id','mentor3_id',
            'external_balance','referral_balance','keys_count',
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

    if action == 'login':
        member_number = (body.get('member_number') or body.get('email') or '').strip()
        password = body.get('password', '')
        if not member_number or not password:
            return err('Введите номер пайщика и пароль')
        conn = get_conn()
        try:
            with conn.cursor() as cur:
                cur.execute(f"SELECT id, password_hash, is_blocked FROM {S}.users WHERE member_number = %s", (member_number,))
                row = cur.fetchone()
            if not row:
                return err('Неверный номер пайщика или пароль')
            user_id, ph, is_blocked = row
            if is_blocked:
                return err('Аккаунт заблокирован')
            if not verify_password(password, ph):
                return err('Неверный номер пайщика или пароль')
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
                    cur.execute(f"SELECT COUNT(*) FROM {S}.users WHERE mentor1_id = %s", (user['id'],))
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

    if action == 'change_password':
        if not token:
            return err('Требуется авторизация', 401)
        conn = get_conn()
        try:
            user = get_user_by_token(conn, token)
            if not user:
                return err('Токен недействителен', 401)
            old_password = body.get('old_password', '')
            new_password = body.get('new_password', '')
            if len(new_password) < 6:
                return err('Новый пароль минимум 6 символов')
            with conn.cursor() as cur:
                cur.execute(f"SELECT password_hash FROM {S}.users WHERE id=%s", (user['id'],))
                ph = cur.fetchone()[0]
                if not verify_password(old_password, ph):
                    return err('Неверный текущий пароль')
                new_hash = hash_password(new_password)
                cur.execute(f"UPDATE {S}.users SET password_hash=%s WHERE id=%s", (new_hash, user['id']))
            conn.commit()
            return ok({'message': 'Пароль изменён'})
        finally:
            conn.close()

    # ── ADMIN: создание пайщиков вручную ────────────────────────────────────
    if action == 'admin_create_user':
        if not token:
            return err('Требуется авторизация', 401)
        conn = get_conn()
        try:
            caller = get_user_by_token(conn, token)
            if not caller or caller['role'] != 'admin':
                return err('Только для администратора', 403)

            name = (body.get('name') or '').strip()
            full_name = (body.get('full_name') or '').strip()
            phone = (body.get('phone') or '').strip()
            password = body.get('password') or gen_password()
            mentor1_id = body.get('mentor1_id')
            mentor2_id = body.get('mentor2_id')
            mentor3_id = body.get('mentor3_id')
            member_number = (body.get('member_number') or '').strip()

            if not name:
                return err('Укажите имя пользователя')
            if not mentor1_id or not mentor2_id or not mentor3_id:
                return err('Укажите трёх наставников (номера пайщиков)')
            if len({mentor1_id, mentor2_id, mentor3_id}) < 3:
                return err('Наставники должны быть разными')
            if len(password) < 6:
                return err('Пароль минимум 6 символов')

            with conn.cursor() as cur:
                for mid in (mentor1_id, mentor2_id, mentor3_id):
                    cur.execute(f"SELECT id FROM {S}.users WHERE id=%s", (mid,))
                    if not cur.fetchone():
                        return err(f'Наставник с ID {mid} не найден')

                if not member_number:
                    cur.execute(f"SELECT COALESCE(MAX(member_number::int), 1000) FROM {S}.users WHERE member_number ~ '^[0-9]+$'")
                    max_num = cur.fetchone()[0]
                    member_number = str(int(max_num) + 1)
                else:
                    cur.execute(f"SELECT id FROM {S}.users WHERE member_number=%s", (member_number,))
                    if cur.fetchone():
                        return err('Такой номер пайщика уже занят')

                my_code = gen_referral_code(name)
                for _ in range(5):
                    cur.execute(f"SELECT id FROM {S}.users WHERE referral_code = %s", (my_code,))
                    if not cur.fetchone():
                        break
                    my_code = gen_referral_code(name)

                fake_email = f"member{member_number}@internal.local"
                ph = hash_password(password)
                cur.execute(f"""
                    INSERT INTO {S}.users (name, full_name, email, phone, password_hash, referral_code,
                                            member_number, mentor1_id, mentor2_id, mentor3_id, referred_by)
                    VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s) RETURNING id""",
                    (name, full_name or name, fake_email, phone, ph, my_code,
                     member_number, mentor1_id, mentor2_id, mentor3_id, mentor1_id))
                user_id = cur.fetchone()[0]
                cur.execute(f"""INSERT INTO {S}.mentor_change_log
                    (user_id, changed_by, changed_by_name, old_mentor1_id, old_mentor2_id, old_mentor3_id,
                     new_mentor1_id, new_mentor2_id, new_mentor3_id, reason)
                    VALUES (%s,%s,%s,NULL,NULL,NULL,%s,%s,%s,'user_created')""",
                    (user_id, caller['id'], caller['name'], mentor1_id, mentor2_id, mentor3_id))
            conn.commit()
            return ok({'message': 'Пайщик создан', 'user_id': user_id, 'member_number': member_number, 'password': password})
        finally:
            conn.close()

    if action == 'admin_update_mentors':
        if not token:
            return err('Требуется авторизация', 401)
        conn = get_conn()
        try:
            caller = get_user_by_token(conn, token)
            if not caller or caller['role'] != 'admin':
                return err('Только для администратора', 403)
            target_id = body.get('user_id')
            mentor1_id = body.get('mentor1_id')
            mentor2_id = body.get('mentor2_id')
            mentor3_id = body.get('mentor3_id')
            if not mentor1_id or not mentor2_id or not mentor3_id:
                return err('Укажите трёх наставников')
            if len({mentor1_id, mentor2_id, mentor3_id}) < 3:
                return err('Наставники должны быть разными')
            with conn.cursor() as cur:
                cur.execute(f"SELECT mentor1_id, mentor2_id, mentor3_id FROM {S}.users WHERE id=%s", (target_id,))
                old_row = cur.fetchone()
                if not old_row:
                    return err('Пользователь не найден', 404)
                old_m1, old_m2, old_m3 = old_row
                cur.execute(f"UPDATE {S}.users SET mentor1_id=%s, mentor2_id=%s, mentor3_id=%s, referred_by=%s WHERE id=%s",
                            (mentor1_id, mentor2_id, mentor3_id, mentor1_id, target_id))
                cur.execute(f"""INSERT INTO {S}.mentor_change_log
                    (user_id, changed_by, changed_by_name, old_mentor1_id, old_mentor2_id, old_mentor3_id,
                     new_mentor1_id, new_mentor2_id, new_mentor3_id, reason)
                    VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,'manual_update')""",
                    (target_id, caller['id'], caller['name'], old_m1, old_m2, old_m3, mentor1_id, mentor2_id, mentor3_id))
            conn.commit()
            return ok({'message': 'Наставники обновлены'})
        finally:
            conn.close()

    if action == 'admin_reset_password':
        if not token:
            return err('Требуется авторизация', 401)
        conn = get_conn()
        try:
            caller = get_user_by_token(conn, token)
            if not caller or caller['role'] != 'admin':
                return err('Только для администратора', 403)
            target_id = body.get('user_id')
            new_password = body.get('password') or gen_password()
            if len(new_password) < 6:
                return err('Пароль минимум 6 символов')
            with conn.cursor() as cur:
                cur.execute(f"UPDATE {S}.users SET password_hash=%s WHERE id=%s", (hash_password(new_password), target_id))
            conn.commit()
            return ok({'message': 'Пароль изменён', 'password': new_password})
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

    if action == 'admin_mentor_log':
        if not token:
            return err('Требуется авторизация', 401)
        conn = get_conn()
        try:
            caller = get_user_by_token(conn, token)
            if not caller or caller['role'] != 'admin':
                return err('Только для администратора', 403)
            filter_user_id = qs.get('user_id')
            with conn.cursor() as cur:
                if filter_user_id:
                    cur.execute(f"""
                        SELECT l.id, l.user_id, u.name, u.member_number,
                               l.changed_by, l.changed_by_name,
                               l.old_mentor1_id, l.old_mentor2_id, l.old_mentor3_id,
                               l.new_mentor1_id, l.new_mentor2_id, l.new_mentor3_id,
                               l.reason, l.created_at
                        FROM {S}.mentor_change_log l
                        JOIN {S}.users u ON u.id = l.user_id
                        WHERE l.user_id = %s
                        ORDER BY l.created_at DESC LIMIT 200""", (filter_user_id,))
                else:
                    cur.execute(f"""
                        SELECT l.id, l.user_id, u.name, u.member_number,
                               l.changed_by, l.changed_by_name,
                               l.old_mentor1_id, l.old_mentor2_id, l.old_mentor3_id,
                               l.new_mentor1_id, l.new_mentor2_id, l.new_mentor3_id,
                               l.reason, l.created_at
                        FROM {S}.mentor_change_log l
                        JOIN {S}.users u ON u.id = l.user_id
                        ORDER BY l.created_at DESC LIMIT 200""")
                rows = cur.fetchall()

                mentor_ids = set()
                for r in rows:
                    for mid in (r[6], r[7], r[8], r[9], r[10], r[11]):
                        if mid:
                            mentor_ids.add(mid)
                mentor_map = {}
                if mentor_ids:
                    cur.execute(f"SELECT id, member_number, name FROM {S}.users WHERE id = ANY(%s)", (list(mentor_ids),))
                    for mid, mnum, mname in cur.fetchall():
                        mentor_map[mid] = {'member_number': mnum, 'name': mname}

            def mentor_info(mid):
                return mentor_map.get(mid) if mid else None

            result = []
            for r in rows:
                result.append({
                    'id': r[0], 'user_id': r[1], 'user_name': r[2], 'user_member_number': r[3],
                    'changed_by': r[4], 'changed_by_name': r[5],
                    'old_mentor1': mentor_info(r[6]), 'old_mentor2': mentor_info(r[7]), 'old_mentor3': mentor_info(r[8]),
                    'new_mentor1': mentor_info(r[9]), 'new_mentor2': mentor_info(r[10]), 'new_mentor3': mentor_info(r[11]),
                    'reason': r[12], 'created_at': r[13],
                })
            return ok(result)
        finally:
            conn.close()

    return err('Неизвестное действие', 400)