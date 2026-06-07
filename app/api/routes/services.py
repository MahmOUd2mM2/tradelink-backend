from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.db.session import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.schemas.service import ServiceRequestCreate, ServiceRequestOut
from app.services.services import (
    create_service_request,
    get_user_service_requests,
    get_all_service_requests,
    update_service_request_status,
)

router = APIRouter(prefix="/services", tags=["services"])


@router.post("/request", response_model=ServiceRequestOut)
def create_request(
    data: ServiceRequestCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Create a new service request."""
    try:
        return create_service_request(
            db,
            user_id=user.id,
            service_type=data.service_type,
            description=data.description,
            budget=data.budget,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/my-requests", response_model=List[ServiceRequestOut])
def get_my_requests(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Get all service requests for the current user."""
    return get_user_service_requests(db, user.id)


# Admin endpoints
from app.api.deps import require_roles


@router.get("/admin/requests", response_model=List[ServiceRequestOut])
def get_all_requests(
    db: Session = Depends(get_db),
    _admin=Depends(require_roles("Admin")),
):
    """Admin: Get all service requests."""
    return get_all_service_requests(db)


@router.patch("/admin/requests/{request_id}", response_model=ServiceRequestOut)
def update_request_status(
    request_id: int,
    status: str,
    admin_notes: str = None,
    db: Session = Depends(get_db),
    _admin=Depends(require_roles("Admin")),
):
    """Admin: Update service request status."""
    try:
        return update_service_request_status(db, request_id, status, admin_notes)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
