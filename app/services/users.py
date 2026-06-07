from sqlalchemy.orm import Session
from sqlalchemy import select
from app.models.user import User
from app.models.role import Role
from app.core.security import hash_password
from app.schemas.user import UserCreate

def get_role_by_name(db: Session, role_name: str) -> Role | None:
    return db.scalar(select(Role).where(Role.name == role_name))

def get_user_by_email(db: Session, email: str) -> User | None:
    return db.scalar(select(User).where(User.email == email))

def create_user(db: Session, data: UserCreate) -> User:
    role = get_role_by_name(db, data.role_name)
    if not role:
        raise ValueError("Invalid role_name")

    user = User(
        name=data.name,
        email=data.email.lower(),
        phone=data.phone,
        company_name=data.company_name,
        role_id=role.id,
        password_hash=hash_password(data.password),
        status=True,
        parent_id=data.parent_id,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user
