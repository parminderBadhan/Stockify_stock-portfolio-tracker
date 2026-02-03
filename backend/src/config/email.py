import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv

load_dotenv()

class EmailService:
    def __init__(self):
        self.service = os.getenv('EMAIL_SERVICE', 'smtp.gmail.com')
        self.user = os.getenv('EMAIL_USER', '')
        self.password = os.getenv('EMAIL_PASSWORD', '')
        self.port = 587
        self.is_production = os.getenv('NODE_ENV') == 'production'
    
    def send_email(self, to: str, subject: str, html_content: str):
        """Send an email"""
        try:
            if not self.is_production:
                print(f"[DEV MODE] Email not sent - would send to {to}")
                print(f"Subject: {subject}")
                print(f"Content: {html_content[:100]}...")
                return True
            
            message = MIMEMultipart('alternative')
            message['From'] = self.user
            message['To'] = to
            message['Subject'] = subject
            
            html_part = MIMEText(html_content, 'html')
            message.attach(html_part)
            
            with smtplib.SMTP(self.service, self.port) as server:
                server.starttls()
                server.login(self.user, self.password)
                server.send_message(message)
            
            print(f"Email sent successfully to {to}")
            return True
        except Exception as e:
            print(f"Error sending email: {e}")
            return False

# Singleton instance
email_service = EmailService()

def get_email_service() -> EmailService:
    """Get email service instance"""
    return email_service
