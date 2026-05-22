"""
Платёжный сервис: создание платежей через ЮКассу, Сбербанк, Т-Банк.
Поддерживает редирект на страницу оплаты с webhook-подтверждением.
"""
import json
import os
import uuid
import hmac
import hashlib
import base64
import psycopg2
import urllib.request
import urllib.parse
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

S = os.environ.get('MAIN_DB_SCHEMA', 't_p87395805_secret_key_draw')

CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Authorization',
}


def get_conn():
    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    conn.autocommit = False
    return conn


def ok(data, code=200):
    return {'statusCode': code, 'headers': {**CORS, 'Content-Type': 'application/json'},
            'body': json.dumps(data, ensure_ascii=False, default=str)}


def err(msg, code=400):
    return {'statusCode': code, 'headers': {**CORS, 'Content-Type': 'application/json'},
            'body': json.dumps({'error': msg}, ensure_ascii=False)}


def get_user_by_token(conn, token: str):
    if not token:
        return None
    with conn.cursor() as cur:
        cur.execute(f"""
            SELECT u.id, u.role, u.email, u.name, u.external_balance
            FROM {S}.sessions s JOIN {S}.users u ON u.id = s.user_id
            WHERE s.token = %s AND s.expires_at > NOW()""", (token,))
        row = cur.fetchone()
    if not row:
        return None
    return {'id': row[0], 'role': row[1], 'email': row[2], 'name': row[3], 'external_balance': row[4]}


def send_email(to: str, subject: str, html: str):
    """Отправляет email через SMTP (если настроен)."""
    smtp_host = os.environ.get('SMTP_HOST', '')
    smtp_port = int(os.environ.get('SMTP_PORT', '587'))
    smtp_user = os.environ.get('SMTP_USER', '')
    smtp_pass = os.environ.get('SMTP_PASS', '')
    smtp_from = os.environ.get('SMTP_FROM', smtp_user)

    if not smtp_host or not smtp_user:
        return

    msg = MIMEMultipart('alternative')
    msg['Subject'] = subject
    msg['From'] = smtp_from
    msg['To'] = to
    msg.attach(MIMEText(html, 'html', 'utf-8'))

    try:
        server = smtplib.SMTP(smtp_host, smtp_port, timeout=10)
        server.starttls()
        server.login(smtp_user, smtp_pass)
        server.sendmail(smtp_from, [to], msg.as_bytes())
        server.quit()
    except Exception:
        pass


def notify_payment_success(conn, payment_id: int, user_id: int, amount: int, provider: str):
    """Уведомляет пользователя и администратора об успешном платеже."""
    with conn.cursor() as cur:
        cur.execute(f"SELECT name, email FROM {S}.users WHERE id = %s", (user_id,))
        row = cur.fetchone()
    if not row:
        return
    user_name, user_email = row

    # Email пользователю
    if user_email:
        provider_label = {'yookassa': 'ЮКасса', 'sberbank': 'Сбербанк', 'tinkoff': 'Т-Банк'}.get(provider, provider)
        user_html = f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0a0b11; color: #fff; border-radius: 16px; padding: 32px;">
          <h1 style="color: #f59e0b; font-size: 24px; margin-bottom: 8px;">Golden Door</h1>
          <h2 style="color: #fff; font-size: 20px;">✅ Оплата прошла успешно</h2>
          <p style="color: rgba(255,255,255,0.7); font-size: 16px;">Привет, {user_name}!</p>
          <p style="color: rgba(255,255,255,0.7);">Ваш счёт пополнен на <strong style="color: #f59e0b;">{amount:,} ₽</strong> через {provider_label}.</p>
          <p style="color: rgba(255,255,255,0.7);">Средства уже доступны в личном кабинете.</p>
          <p style="color: rgba(255,255,255,0.4); font-size: 12px; margin-top: 24px;">Golden Door · Автоматическое уведомление · ID платежа: {payment_id}</p>
        </div>"""
        send_email(user_email, f'Оплата {amount:,} ₽ подтверждена — Golden Door', user_html)

    # Email администратору
    admin_email = os.environ.get('ADMIN_EMAIL', '')
    if admin_email:
        admin_html = f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0a0b11; color: #fff; border-radius: 16px; padding: 32px;">
          <h1 style="color: #f59e0b;">Golden Door — Новый платёж</h1>
          <table style="width: 100%; color: rgba(255,255,255,0.8); font-size: 14px;">
            <tr><td style="padding: 6px 0; color: rgba(255,255,255,0.4);">Пользователь</td><td>{user_name} ({user_email})</td></tr>
            <tr><td style="padding: 6px 0; color: rgba(255,255,255,0.4);">Сумма</td><td style="color: #f59e0b; font-weight: bold;">{amount:,} ₽</td></tr>
            <tr><td style="padding: 6px 0; color: rgba(255,255,255,0.4);">Провайдер</td><td>{provider}</td></tr>
            <tr><td style="padding: 6px 0; color: rgba(255,255,255,0.4);">ID платежа</td><td>{payment_id}</td></tr>
          </table>
        </div>"""
        send_email(admin_email, f'Новый платёж {amount:,} ₽ от {user_name}', admin_html)


# ── ПРОВАЙДЕРЫ ────────────────────────────────────────────────────────────────

def create_yookassa_payment(amount: int, payment_uuid: str, return_url: str, description: str) -> dict:
    """Создаёт платёж в ЮКассе и возвращает confirmation_url."""
    shop_id = os.environ.get('YOOKASSA_SHOP_ID', '')
    secret_key = os.environ.get('YOOKASSA_SECRET_KEY', '')
    if not shop_id or not secret_key:
        raise ValueError('ЮКасса не настроена: укажите YOOKASSA_SHOP_ID и YOOKASSA_SECRET_KEY')

    payload = {
        'amount': {'value': f'{amount}.00', 'currency': 'RUB'},
        'confirmation': {'type': 'redirect', 'return_url': return_url},
        'capture': True,
        'description': description,
        'metadata': {'payment_uuid': payment_uuid},
    }
    data = json.dumps(payload).encode('utf-8')
    credentials = base64.b64encode(f'{shop_id}:{secret_key}'.encode()).decode()
    req = urllib.request.Request(
        'https://api.yookassa.ru/v3/payments',
        data=data,
        headers={
            'Content-Type': 'application/json',
            'Authorization': f'Basic {credentials}',
            'Idempotence-Key': payment_uuid,
        },
        method='POST',
    )
    with urllib.request.urlopen(req, timeout=15) as resp:
        result = json.loads(resp.read().decode())
    return {
        'provider_payment_id': result['id'],
        'confirmation_url': result['confirmation']['confirmation_url'],
        'status': result['status'],
    }


def create_sberbank_payment(amount: int, payment_uuid: str, return_url: str, fail_url: str, description: str) -> dict:
    """Регистрирует заказ в Сбербанке и возвращает ссылку на оплату."""
    username = os.environ.get('SBERBANK_USERNAME', '')
    password = os.environ.get('SBERBANK_PASSWORD', '')
    gateway = os.environ.get('SBERBANK_GATEWAY', 'https://securepayments.sberbank.ru')
    if not username or not password:
        raise ValueError('Сбербанк не настроен: укажите SBERBANK_USERNAME и SBERBANK_PASSWORD')

    params = urllib.parse.urlencode({
        'userName': username,
        'password': password,
        'orderNumber': payment_uuid,
        'amount': amount * 100,
        'returnUrl': return_url,
        'failUrl': fail_url,
        'description': description,
        'currency': 643,
        'language': 'ru',
    })
    url = f'{gateway}/payment/rest/register.do?{params}'
    req = urllib.request.Request(url, method='GET')
    with urllib.request.urlopen(req, timeout=15) as resp:
        result = json.loads(resp.read().decode())
    if result.get('errorCode', '0') != '0':
        raise ValueError(result.get('errorMessage', 'Ошибка Сбербанка'))
    return {
        'provider_payment_id': result['orderId'],
        'confirmation_url': result['formUrl'],
        'status': 'pending',
    }


def create_tinkoff_payment(amount: int, payment_uuid: str, return_url: str, description: str) -> dict:
    """Инициализирует платёж в Т-Банке и возвращает PaymentURL."""
    terminal_key = os.environ.get('TINKOFF_TERMINAL_KEY', '')
    secret_key = os.environ.get('TINKOFF_SECRET_KEY', '')
    if not terminal_key or not secret_key:
        raise ValueError('Т-Банк не настроен: укажите TINKOFF_TERMINAL_KEY и TINKOFF_SECRET_KEY')

    payload = {
        'TerminalKey': terminal_key,
        'Amount': amount * 100,
        'OrderId': payment_uuid,
        'Description': description,
        'SuccessURL': return_url,
        'FailURL': return_url + '?payment=fail',
    }
    # Подпись: конкатенация значений (включая Password) в алфавитном порядке ключей, SHA-256
    sign_pairs = {**payload, 'Password': secret_key}
    sign_string = ''.join(str(v) for k, v in sorted(sign_pairs.items()))
    payload['Token'] = hashlib.sha256(sign_string.encode()).hexdigest()

    data = json.dumps(payload).encode('utf-8')
    req = urllib.request.Request(
        'https://securepay.tinkoff.ru/v2/Init',
        data=data,
        headers={'Content-Type': 'application/json'},
        method='POST',
    )
    with urllib.request.urlopen(req, timeout=15) as resp:
        result = json.loads(resp.read().decode())
    if not result.get('Success'):
        raise ValueError(result.get('Message', 'Ошибка Т-Банка'))
    return {
        'provider_payment_id': str(result['PaymentId']),
        'confirmation_url': result['PaymentURL'],
        'status': 'pending',
    }


# ── HANDLER ───────────────────────────────────────────────────────────────────

def handler(event: dict, context) -> dict:
    """Создание платежей: ЮКасса, Сбербанк, Т-Банк. Редирект на страницу оплаты."""
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
        return ok({'status': 'ok', 'service': 'payments'})

    conn = get_conn()
    try:
        user = get_user_by_token(conn, token)
        if not user:
            return err('Требуется авторизация', 401)

        # ── create_payment: создаём платёж и отдаём confirmation_url ─────────
        if action == 'create_payment':
            amount = int(body.get('amount', 0))
            provider = body.get('provider', 'yookassa')
            return_url = body.get('return_url', 'https://golden-door.poehali.dev/?payment=success')

            if amount < 100:
                return err('Минимальная сумма — 100 ₽')
            if provider not in ('yookassa', 'sberbank', 'tinkoff'):
                return err('Неизвестный провайдер')

            payment_uuid = str(uuid.uuid4())
            description = f'Пополнение счёта Golden Door на {amount} ₽'
            fail_url = return_url.replace('success', 'fail')

            try:
                if provider == 'yookassa':
                    result = create_yookassa_payment(amount, payment_uuid, return_url, description)
                elif provider == 'sberbank':
                    result = create_sberbank_payment(amount, payment_uuid, return_url, fail_url, description)
                else:
                    result = create_tinkoff_payment(amount, payment_uuid, return_url, description)
            except ValueError as e:
                return err(str(e))

            with conn.cursor() as cur:
                cur.execute(f"""
                    INSERT INTO {S}.payments
                      (user_id, amount, provider, provider_payment_id, status, confirmation_url, return_url, metadata)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s) RETURNING id""",
                    (user['id'], amount, provider,
                     result['provider_payment_id'], result['status'],
                     result['confirmation_url'], return_url,
                     json.dumps({'payment_uuid': payment_uuid})))
                new_id = cur.fetchone()[0]
            conn.commit()

            return ok({
                'payment_id': new_id,
                'confirmation_url': result['confirmation_url'],
                'provider': provider,
            })

        # ── get_payment_status: проверяем статус платежа ──────────────────────
        if action == 'get_payment_status':
            payment_id = int(body.get('payment_id') or qs.get('payment_id', 0))
            with conn.cursor() as cur:
                cur.execute(f"""
                    SELECT id, amount, provider, status, confirmation_url, created_at
                    FROM {S}.payments WHERE id = %s AND user_id = %s""",
                    (payment_id, user['id']))
                row = cur.fetchone()
            if not row:
                return err('Платёж не найден', 404)
            keys = ['id', 'amount', 'provider', 'status', 'confirmation_url', 'created_at']
            return ok(dict(zip(keys, row)))

        # ── get_payments_history: история платежей пользователя ──────────────
        if action == 'get_payments_history':
            with conn.cursor() as cur:
                cur.execute(f"""
                    SELECT id, amount, provider, status, created_at, completed_at
                    FROM {S}.payments WHERE user_id = %s
                    ORDER BY created_at DESC LIMIT 50""", (user['id'],))
                rows = cur.fetchall()
            keys = ['id', 'amount', 'provider', 'status', 'created_at', 'completed_at']
            return ok([dict(zip(keys, r)) for r in rows])

        # ── admin_get_payments: все платежи для администратора ────────────────
        if action == 'admin_get_payments':
            if user['role'] != 'admin':
                return err('Только для администратора', 403)
            with conn.cursor() as cur:
                cur.execute(f"""
                    SELECT p.id, p.amount, p.provider, p.status, p.created_at, p.completed_at,
                           u.name, u.email
                    FROM {S}.payments p
                    JOIN {S}.users u ON u.id = p.user_id
                    ORDER BY p.created_at DESC LIMIT 100""")
                rows = cur.fetchall()
            keys = ['id', 'amount', 'provider', 'status', 'created_at', 'completed_at', 'user_name', 'user_email']
            return ok([dict(zip(keys, r)) for r in rows])

        return err('Неизвестное действие', 404)

    finally:
        conn.close()
