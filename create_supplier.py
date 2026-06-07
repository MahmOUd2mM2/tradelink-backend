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
role_name = "Supplier"
role = db.scalar(select(Role).where(Role.name == role_name))
if not role:
    role = Role(name=role_name)
    db.add(role)
    db.commit()
    db.refresh(role)

email = "supplier@tradelink.com"
password = "Supplier@1234"

user = db.scalar(select(User).where(User.email == email))
if not user:
    user = User(
        name="تاجر جملة (مورد)",
        email=email,
        phone="0500000002",
        company_name="مؤسسة الجملة",
        role_id=role.id,
        password_hash=hash_password(password),
        status=True,
    )
    db.add(user)
    db.commit()
    print("Wholesaler user created successfully!")
else:
    user.password_hash = hash_password(password)
    db.commit()
    print("Wholesaler user already exists, password updated.")
