from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import re

from app.db.session import get_db
from app.schemas.user import UserCreate, UserOut
from app.schemas.auth import LoginRequest, Token
from app.services.users import create_user, get_user_by_email, get_role_by_name
from app.core.security import verify_password, create_access_token

router = APIRouter(prefix="/auth")


def validate_password_strength(password: str) -> str | None:
    """
    Validate password strength. Returns None if valid, error message if invalid.
    Requirements:
    - At least 8 characters
    - At least one uppercase letter
    - At least one lowercase letter
    - At least one digit
    - At least one special character
    """
    if len(password) < 8:
        return "Password must be at least 8 characters long"
    if not re.search(r"[A-Z]", password):
        return "Password must contain at least one uppercase letter"
    if not re.search(r"[a-z]", password):
        return "Password must contain at least one lowercase letter"
    if not re.search(r"\d", password):
        return "Password must contain at least one digit"
    if not re.search(r"[!@#$%^&*(),.?\":{}|<>]", password):
        return "Password must contain at least one special character"
    return None


@router.post("/register", response_model=UserOut)
def register_public(data: UserCreate, db: Session = Depends(get_db)):
    # Validate password strength
    password_error = validate_password_strength(data.password)
    if password_error:
        raise HTTPException(status_code=400, detail=password_error)
    
    # allow public registration but validate role exists
    existing = get_user_by_email(db, data.email.lower())
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    role = get_role_by_name(db, data.role_name)
    if not role:
        raise HTTPException(status_code=400, detail="Invalid role")
    try:
        user = create_user(db, data)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    return UserOut(
        id=user.id, name=user.name, email=user.email, phone=user.phone,
        company_name=user.company_name, role=role.name if role else "Unknown", status=user.status
    )


@router.post("/login", response_model=Token)
def login(data: LoginRequest, db: Session = Depends(get_db)):
    user = get_user_by_email(db, data.email.lower())
    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token = create_access_token(subject=str(user.id))
    return Token(access_token=token)
