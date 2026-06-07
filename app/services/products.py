from sqlalchemy.orm import Session
from sqlalchemy import select
from app.models.product import Product
from app.schemas.product import ProductCreate

def list_products(db: Session, skip: int = 0, limit: int = 50) -> list[Product]:
    return list(db.scalars(select(Product).offset(skip).limit(limit)))

def create_product(db: Session, supplier_id: int, data: ProductCreate) -> Product:
    p = Product(
        supplier_id=supplier_id,
        name=data.name,
        sku=data.sku,
        price=data.price,
        min_order_qty=data.min_order_qty,
        status=data.status,
    )
    db.add(p)
    db.commit()
    db.refresh(p)
    return p

def get_product(db: Session, product_id: int) -> Product | None:
    return db.get(Product, product_id)
