"""
Webhook-обработчик входящих уведомлений от ЮКассы, Сбербанка и Т-Банка.
При успешной оплате зачисляет средства на счёт пользователя и отправляет email.
"""
import json
import os
import hmac
import hashlib
import psycopg2
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


def ok(data=None, code=200):
    body = json.dumps(data or {'ok': True}, ensure_ascii=False)
    return {'statusCode': code, 'headers': {**CORS, 'Content-Type': 'application/json'}, 'body': body}


def err(msg, code=400):
    return {'statusCode': code, 'headers': {**CORS, 'Content-Type': 'application/json'},
            'body': json.dumps({'error': msg}, ensure_ascii=False)}


def send_email(to: str, subject: str, html: str):
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


def credit_user_and_notify(conn, payment_row: dict):
    """Зачисляет средства пользователю и отправляет уведомления."""
    user_id = payment_row['user_id']
    amount = payment_row['amount']
    payment_id = payment_row['id']
    provider = payment_row['provider']

    with conn.cursor() as cur:
        cur.execute(f"UPDATE {S}.users SET external_balance = external_balance + %s WHERE id = %s",
                    (amount, user_id))
        cur.execute(f"""INSERT INTO {S}.transactions
            (user_id, type, amount, balance_type, description, status)
            VALUES (%s, 'deposit', %s, 'external', %s, 'completed')""",
                    (user_id, amount,
                     f'Пополнение через {provider} (платёж #{payment_id})'))
        cur.execute(f"""UPDATE {S}.payments
            SET status = 'succeeded', completed_at = NOW()
            WHERE id = %s""", (payment_id,))

    # Email пользователю и администратору
    with conn.cursor() as cur:
        cur.execute(f"SELECT name, email FROM {S}.users WHERE id = %s", (user_id,))
        row = cur.fetchone()
    if not row:
        return
    user_name, user_email = row
    provider_label = {'yookassa': 'ЮКасса', 'sberbank': 'Сбербанк', 'tinkoff': 'Т-Банк'}.get(provider, provider)

    if user_email:
        user_html = f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0a0b11; color: #fff; border-radius: 16px; padding: 32px;">
          <h1 style="color: #f59e0b; margin-bottom: 8px;">Golden Door</h1>
          <h2 style="color: #fff;">✅ Счёт пополнен</h2>
          <p style="color: rgba(255,255,255,0.7);">Привет, {user_name}!</p>
          <p style="color: rgba(255,255,255,0.7);">Ваш счёт успешно пополнен на
            <strong style="color: #f59e0b; font-size: 20px;">{amount:,} ₽</strong>
            через {provider_label}.
          </p>
          <p style="color: rgba(255,255,255,0.7);">Средства уже доступны в личном кабинете — можете покупать ключи и открывать двери!</p>
          <div style="margin-top: 24px; padding: 16px; background: rgba(245,158,11,0.1); border-radius: 12px; border: 1px solid rgba(245,158,11,0.3);">
            <p style="color: rgba(255,255,255,0.5); font-size: 12px; margin: 0;">ID платежа: #{payment_id} · {provider_label}</p>
          </div>
        </div>"""
        send_email(user_email, f'Счёт пополнен на {amount:,} ₽ — Golden Door', user_html)

    admin_email = os.environ.get('ADMIN_EMAIL', '')
    if admin_email:
        admin_html = f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0a0b11; color: #fff; border-radius: 16px; padding: 32px;">
          <h1 style="color: #f59e0b;">Golden Door — Платёж получен</h1>
          <table style="width: 100%; color: rgba(255,255,255,0.8); font-size: 14px; border-collapse: collapse;">
            <tr><td style="padding: 8px 0; color: rgba(255,255,255,0.4); width: 40%;">Пользователь</td>
                <td>{user_name} &lt;{user_email}&gt;</td></tr>
            <tr><td style="padding: 8px 0; color: rgba(255,255,255,0.4);">Сумма</td>
                <td><strong style="color: #f59e0b; font-size: 18px;">{amount:,} ₽</strong></td></tr>
            <tr><td style="padding: 8px 0; color: rgba(255,255,255,0.4);">Провайдер</td>
                <td>{provider_label}</td></tr>
            <tr><td style="padding: 8px 0; color: rgba(255,255,255,0.4);">ID платежа</td>
                <td>#{payment_id}</td></tr>
          </table>
        </div>"""
        send_email(admin_email, f'Получен платёж {amount:,} ₽ от {user_name}', admin_html)


def handle_yookassa(body: dict, conn) -> dict:
    """Обрабатывает webhook от ЮКассы."""
    event_type = body.get('event', '')
    if event_type != 'payment.succeeded':
        return ok()

    payment_obj = body.get('object', {})
    provider_payment_id = payment_obj.get('id', '')

    with conn.cursor() as cur:
        cur.execute(f"""SELECT id, user_id, amount, provider, status
            FROM {S}.payments WHERE provider_payment_id = %s AND provider = 'yookassa'""",
                    (provider_payment_id,))
        row = cur.fetchone()

    if not row:
        return ok()
    payment = dict(zip(['id', 'user_id', 'amount', 'provider', 'status'], row))

    if payment['status'] == 'succeeded':
        return ok()

    credit_user_and_notify(conn, payment)
    conn.commit()
    return ok()


def handle_sberbank(qs: dict, conn) -> dict:
    """Обрабатывает callback от Сбербанка (GET-параметры)."""
    order_id = qs.get('orderId', '')
    operation = qs.get('operation', '')

    if operation != 'deposited':
        return ok()

    with conn.cursor() as cur:
        cur.execute(f"""SELECT id, user_id, amount, provider, status
            FROM {S}.payments WHERE provider_payment_id = %s AND provider = 'sberbank'""",
                    (order_id,))
        row = cur.fetchone()

    if not row:
        return ok()
    payment = dict(zip(['id', 'user_id', 'amount', 'provider', 'status'], row))

    if payment['status'] == 'succeeded':
        return ok()

    credit_user_and_notify(conn, payment)
    conn.commit()
    return ok()


def handle_tinkoff(body: dict, conn) -> dict:
    """Обрабатывает webhook от Т-Банка с проверкой подписи."""
    terminal_key = os.environ.get('TINKOFF_TERMINAL_KEY', '')
    secret_key = os.environ.get('TINKOFF_SECRET_KEY', '')

    # Проверка подписи токена
    if terminal_key and secret_key:
        received_token = body.get('Token', '')
        sign_pairs = {k: v for k, v in body.items() if k != 'Token'}
        sign_pairs['Password'] = secret_key
        sign_string = ''.join(str(v) for k, v in sorted(sign_pairs.items()))
        expected = hashlib.sha256(sign_string.encode()).hexdigest()
        if received_token != expected:
            return err('Неверная подпись', 403)

    status = body.get('Status', '')
    if status != 'CONFIRMED':
        return ok()

    provider_payment_id = str(body.get('PaymentId', ''))

    with conn.cursor() as cur:
        cur.execute(f"""SELECT id, user_id, amount, provider, status
            FROM {S}.payments WHERE provider_payment_id = %s AND provider = 'tinkoff'""",
                    (provider_payment_id,))
        row = cur.fetchone()

    if not row:
        return ok()
    payment = dict(zip(['id', 'user_id', 'amount', 'provider', 'status'], row))

    if payment['status'] == 'succeeded':
        return ok()

    credit_user_and_notify(conn, payment)
    conn.commit()
    return ok({'ok': True})


def handler(event: dict, context) -> dict:
    """Webhook-эндпоинт: принимает уведомления от платёжных систем и зачисляет деньги."""
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS, 'body': ''}

    qs = event.get('queryStringParameters') or {}
    provider = qs.get('provider', '')

    body = {}
    if event.get('body'):
        try:
            body = json.loads(event['body'])
        except Exception:
            pass

    if not provider:
        return ok({'status': 'ok', 'service': 'webhook'})

    conn = get_conn()
    try:
        if provider == 'yookassa':
            return handle_yookassa(body, conn)
        elif provider == 'sberbank':
            return handle_sberbank(qs, conn)
        elif provider == 'tinkoff':
            return handle_tinkoff(body, conn)
        else:
            return err('Неизвестный провайдер', 404)
    finally:
        conn.close()
