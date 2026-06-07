from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.db.session import get_db
from app.schemas.user import UserCreate, UserOut
from app.services.users import create_user, get_user_by_email
from app.api.deps import require_roles, get_current_user
from app.models.role import Role

router = APIRouter(prefix="/users")

@router.post("", response_model=UserOut)
def register_user(
    data: UserCreate,
    db: Session = Depends(get_db),
    _admin = Depends(require_roles("Admin")),
):
    existing = get_user_by_email(db, data.email.lower())
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    user = create_user(db, data)
    role = db.get(Role, user.role_id)
    return UserOut(
        id=user.id, name=user.name, email=user.email, phone=user.phone,
        company_name=user.company_name, role=role.name if role else "Unknown", status=user.status,
        wallet_balance=float(user.wallet_balance) if user.wallet_balance else 0.0, parent_id=user.parent_id
    )

@router.post("/subuser", response_model=UserOut)
def register_subuser(
    data: UserCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
):
    # A user can create a subuser for their own store. 
    # Force parent_id to current_user.id and role to match their store type or specific "Cashier" role.
    data.parent_id = current_user.id
    
    existing = get_user_by_email(db, data.email.lower())
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    user = create_user(db, data)
    role = db.get(Role, user.role_id)
    return UserOut(
        id=user.id, name=user.name, email=user.email, phone=user.phone,
        company_name=user.company_name, role=role.name if role else "Unknown", status=user.status,
        wallet_balance=float(user.wallet_balance) if user.wallet_balance else 0.0, parent_id=user.parent_id
    )

@router.get("/me", response_model=UserOut)
def me(user = Depends(get_current_user), db: Session = Depends(get_db)):
    role = db.get(Role, user.role_id)
    return UserOut(
        id=user.id, name=user.name, email=user.email, phone=user.phone,
        company_name=user.company_name, role=role.name if role else "Unknown", status=user.status,
        wallet_balance=float(user.wallet_balance) if user.wallet_balance else 0.0, parent_id=user.parent_id
    )
