from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.product import ProductCreate, ProductOut
from app.services.products import list_products, create_product
from app.api.deps import get_current_user, require_roles

router = APIRouter(prefix="/products")

@router.get("", response_model=list[ProductOut])
def products(db: Session = Depends(get_db), skip: int = 0, limit: int = 50):
    return list_products(db, skip, limit)

@router.post("", response_model=ProductOut)
def add_product(
    data: ProductCreate,
    db: Session = Depends(get_db),
    user = Depends(require_roles("Admin", "Supplier")),
):
    # Admin can create as themselves; for V1 we use current user as supplier_id
    return create_product(db, supplier_id=user.id, data=data)
