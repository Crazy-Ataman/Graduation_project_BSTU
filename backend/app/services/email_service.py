import os
import smtplib, ssl
from fastapi import HTTPException
from dotenv import load_dotenv
load_dotenv()

class EmailService:
    def __init__(self):
        self.server = None
        self.sender_email = os.getenv("EMAIL")
        self.sender_password = os.getenv("EMAIL_PASSWORD")
        self.port = 465 # For SSL

    def connect_smtp_server(self):
        context = ssl.create_default_context()
        self.server = smtplib.SMTP_SSL("smtp.gmail.com", self.port, context=context)
        self.server.login(self.sender_email, self.sender_password)

    def send_email(self, receiver_email, subject, body):
        if self.server is None or not self.server.noop()[0] == 250:
            raise HTTPException(status_code=500, detail="SMTP server not connected. Call connect_smtp_server() first.")

        message = f"Subject: {subject}\n\n{body}"

        self.server.sendmail(self.sender_email, receiver_email, message)

    def disconnect_smtp_server(self):
        if self.server is not None:
            self.server.quit()
            self.server = None