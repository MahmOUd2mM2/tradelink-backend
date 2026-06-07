import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.db.session import SessionLocal
from app.models.user import User
from app.models.role import Role
from app.core.security import hash_password
from sqlalchemy import select

db = SessionLocal()

# التأكد من وجود الدور
role = db.scalar(select(Role).where(Role.name == "Retailer"))
if not role:
    role = Role(name="Retailer")
    db.add(role)
    db.commit()
    db.refresh(role)

email = "retailer@tradelink.com"
password = "Retailer@1234"

user = db.scalar(select(User).where(User.email == email))
if not user:
    user = User(
        name="تاجر تجزئة",
        email=email,
        phone="0500000001",
        company_name="مؤسسة التجزئة",
        role_id=role.id,
        password_hash=hash_password(password),
        status=True,
    )
    db.add(user)
    db.commit()
    print("User created successfully!")
else:
    # Update password if exists just in case
    user.password_hash = hash_password(password)
    db.commit()
    print("User already exists, password updated.")
