import sys
import os

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

import app.main
from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.models.user import User
from app.core.security import hash_password
from sqlalchemy import select

def reset_admin():
    db = SessionLocal()
    admin = db.scalar(select(User).where(User.email == "admin@tradelink.local"))
    if admin:
        admin.password_hash = hash_password("Admin@12345")
        db.commit()
        print("Admin password reset successfully to: Admin@12345")
    else:
        print("Admin user not found!")
    db.close()

if __name__ == "__main__":
    reset_admin()
