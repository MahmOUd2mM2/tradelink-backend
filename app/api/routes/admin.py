from __future__ import annotations

from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import require_roles
from app.db.session import get_db
from app.models.role import Role
from app.models.user import User
from app.schemas.user import UserOut  # لازم يكون موجود عندك

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/users", response_model=List[UserOut])
def list_users(
    db: Session = Depends(get_db),
    _admin=Depends(require_roles("Admin")),
) -> List[UserOut]:
    """
    Admin only: list all users.
    Returns UserOut list so Swagger shows the correct schema.
    """
    roles = list(db.scalars(select(Role)))
    role_map = {r.id: r.name for r in roles}

    users = list(db.scalars(select(User)))

    result: List[UserOut] = []
    for u in users:
        result.append(
            UserOut(
                id=u.id,
                name=u.name,
                email=u.email,
                phone=u.phone,
                company_name=u.company_name,
                role=role_map.get(u.role_id),
                status=bool(u.status),
            )
        )
    return result


@router.patch("/users/{user_id}/status")
def set_user_status(
    user_id: int,
    status_value: bool = Query(..., alias="status", description="New user status (true/false)"),
    db: Session = Depends(get_db),
    _admin=Depends(require_roles("Admin")),
):
    """
    Admin only: set a user's active status.
    """
    u = db.get(User, user_id)
    if not u:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    u.status = status_value
    db.commit()
    db.refresh(u)

    return {"ok": True, "user_id": user_id, "status": bool(u.status)}


@router.patch("/users/{user_id}/role")
def set_user_role(
    user_id: int,
    role_name: str = Query(..., description="New role name (Admin/Supplier/Wholesaler/Retailer/Customer)"),
    db: Session = Depends(get_db),
    _admin=Depends(require_roles("Admin")),
):
    """
    Admin only: change a user's role by role name.
    """
    u = db.get(User, user_id)
    if not u:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    role = db.scalar(select(Role).where(Role.name == role_name))
    if not role:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid role_name")

    u.role_id = role.id
    db.commit()
    db.refresh(u)

    return {"ok": True, "user_id": user_id, "role": role_name}