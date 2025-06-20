
import smtplib
from email.mime.text import MIMEText

def send_alert(recipient_email: str, subject: str, body: str):
    sender_email = "your_email@example.com"
    sender_password = "your_email_password"

    msg = MIMEText(body)
    msg["Subject"] = subject
    msg["From"] = sender_email
    msg["To"] = recipient_email

    with smtplib.SMTP_SSL("smtp.gmail.com", 465) as smtp:
        smtp.login(sender_email, sender_password)
        smtp.send_message(msg)

