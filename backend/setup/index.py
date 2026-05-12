"""
Создание первого администратора. Используй однократно.
POST / с телом {"secret": "GD_SETUP_SECRET", "email": "...", "password": "...", "name": "..."}
"""
import json
import os
import hashlib
import secrets
import psycopg2

SCHEMA = os.environ.get('MAIN_DB_SCHEMA', 't_p87395805_secret_key_draw')
CORS = {'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type'}

def hash_password(password: str) -> str:
    salt = secrets.token_hex(16)
    h = hashlib.pbkdf2_hmac('sha256', password.encode(), salt.encode(), 100000)
    return f"{salt}:{h.hex()}"

def ok(data):
    return {'statusCode': 200, 'headers': {**CORS, 'Content-Type': 'application/json'}, 'body': json.dumps(data, ensure_ascii=False)}

def err(msg, code=400):
    return {'statusCode': code, 'headers': {**CORS, 'Content-Type': 'application/json'}, 'body': json.dumps({'error': msg}, ensure_ascii=False)}

def handler(event: dict, context) -> dict:
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS, 'body': ''}

    if event.get('httpMethod') == 'GET':
        return {'statusCode': 200, 'headers': {**CORS, 'Content-Type': 'application/json'}, 'body': json.dumps({'status': 'ok'})}

    body = {}
    if event.get('body'):
        body = json.loads(event['body'])

    setup_secret = os.environ.get('JWT_SECRET', '')
    provided_secret = body.get('secret', '')
    if provided_secret != setup_secret:
        return err('Неверный секретный ключ', 403)

    name = body.get('name', 'Администратор')
    email = body.get('email', '')
    password = body.get('password', '')
    if not email or not password:
        return err('Нужны email и пароль')

    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    try:
        with conn.cursor() as cur:
            cur.execute(f"SELECT id FROM {SCHEMA}.users WHERE email = %s", (email,))
            row = cur.fetchone()
            ph = hash_password(password)
            if row:
                cur.execute(f"UPDATE {SCHEMA}.users SET password_hash=%s, role='admin', name=%s WHERE email=%s", (ph, name, email))
                conn.commit()
                return ok({'message': f'Администратор {email} обновлён'})
            else:
                ref_code = 'ADMIN' + secrets.token_hex(2).upper()
                cur.execute(
                    f"INSERT INTO {SCHEMA}.users (name, email, password_hash, role, referral_code) VALUES (%s,%s,%s,'admin',%s) RETURNING id",
                    (name, email, ph, ref_code)
                )
                conn.commit()
                return ok({'message': f'Администратор {email} создан', 'referral_code': ref_code})
    finally:
        conn.close()