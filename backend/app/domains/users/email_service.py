import aiosmtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from app.config import settings


async def send_reset_email(to_email: str, name: str, code: str) -> None:
    msg = MIMEMultipart("alternative")
    msg["Subject"] = "Redefinição de senha — Portal do Churras"
    msg["From"] = settings.SMTP_USER
    msg["To"] = to_email

    plain = (
        f"Olá, {name}!\n\n"
        f"Seu código de redefinição de senha é: {code}\n\n"
        "Este código expira em 15 minutos.\n\n"
        "Se você não solicitou a redefinição, ignore este e-mail.\n\n"
        "— Portal do Churras"
    )

    html = f"""
<div style="font-family:Georgia,serif;max-width:480px;margin:auto;padding:32px;background:#FAF5EC;border-radius:16px;">
  <h2 style="color:#2A1E14;margin-bottom:8px;">Redefinição de senha</h2>
  <p style="color:#2A1E14;">Olá, <strong>{name}</strong>!</p>
  <p style="color:#5A4A36;">Use o código abaixo no app para redefinir sua senha:</p>
  <div style="text-align:center;margin:32px 0;">
    <span style="font-size:40px;letter-spacing:10px;font-weight:bold;color:#D91C1C;
                 background:#fff;padding:16px 28px;border-radius:12px;
                 border:2px solid #E8DFD1;display:inline-block;">{code}</span>
  </div>
  <p style="color:#8A7558;font-size:13px;">
    Este código expira em <strong>15 minutos</strong>.
    Se você não solicitou a redefinição, ignore este e-mail.
  </p>
  <hr style="border:none;border-top:1px solid #E8DFD1;margin:24px 0;">
  <p style="color:#8A7558;font-size:12px;text-align:center;">Portal do Churras</p>
</div>
"""

    msg.attach(MIMEText(plain, "plain"))
    msg.attach(MIMEText(html, "html"))

    await aiosmtplib.send(
        msg,
        hostname=settings.SMTP_HOST,
        port=settings.SMTP_PORT,
        username=settings.SMTP_USER,
        password=settings.SMTP_PASSWORD,
        start_tls=True,
        timeout=15,
    )
