from sqlalchemy.orm import Session
from sqlalchemy import select

from app.models.service import ServiceRequest

ALLOWED_STATUSES = {"pending", "reviewed", "approved", "rejected"}


def create_service_request(db: Session, user_id: int, service_type: str, description: str = None, budget: float = None) -> ServiceRequest:
    """Create a new service request."""
    request = ServiceRequest(
        user_id=user_id,
        service_type=service_type,
        description=description,
        budget=budget,
        status="pending"
    )
    db.add(request)
    db.commit()
    db.refresh(request)
    return request


def get_user_service_requests(db: Session, user_id: int, skip: int = 0, limit: int = 50) -> list[ServiceRequest]:
    """Get all service requests for a user."""
    q = select(ServiceRequest).where(ServiceRequest.user_id == user_id).offset(skip).limit(limit)
    return list(db.scalars(q))


def get_all_service_requests(db: Session, skip: int = 0, limit: int = 50) -> list[ServiceRequest]:
    """Get all service requests (for admin)."""
    q = select(ServiceRequest).offset(skip).limit(limit)
    return list(db.scalars(q))


def update_service_request_status(db: Session, request_id: int, status: str, admin_notes: str = None) -> ServiceRequest:
    """Update service request status (admin only)."""
    if status not in ALLOWED_STATUSES:
        raise ValueError(f"Invalid status. Allowed: {', '.join(ALLOWED_STATUSES)}")
    
    request = db.get(ServiceRequest, request_id)
    if not request:
        raise ValueError("Service request not found")
    
    request.status = status
    if admin_notes:
        request.admin_notes = admin_notes
    
    db.commit()
    db.refresh(request)
    return request
