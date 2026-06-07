from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.utils import get_openapi
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.core.config import settings
from app.db.session import engine, SessionLocal
from app.db.base import Base
from app.api.router import api_router
from app.core.security import hash_password
from app.models.role import Role
from app.models.user import User
from app.models.product import Product
from app.models.service import ServiceRequest
from app.models.order import Order
from app.models.order_item import OrderItem
from app.models.warehouse import Warehouse, Inventory, Invoice, Payment, Shipment
from app.models.return_request import ReturnRequest
from app.models.review import Review
from sqlalchemy.exc import IntegrityError

Base.metadata.create_all(bind=engine)

app = FastAPI(title=settings.APP_NAME)


# ✅ Swagger: Use HTTP Bearer (JWT) instead of OAuth2 password flow
def custom_openapi():
    if app.openapi_schema:
        return app.openapi_schema

    openapi_schema = get_openapi(
        title=settings.APP_NAME,
        version="0.1.0",
        routes=app.routes,
    )

    # Replace/define security scheme as BearerAuth
    openapi_schema.setdefault("components", {})
    openapi_schema["components"]["securitySchemes"] = {
        "BearerAuth": {
            "type": "http",
            "scheme": "bearer",
            "bearerFormat": "JWT",
        }
    }

    # For any endpoint that already has "security", force it to BearerAuth
    for _path, methods in openapi_schema.get("paths", {}).items():
        for _method, meta in methods.items():
            if isinstance(meta, dict) and "security" in meta:
                meta["security"] = [{"BearerAuth": []}]

    app.openapi_schema = openapi_schema
    return app.openapi_schema


app.openapi = custom_openapi


app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_list(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router)


def seed(db: Session):
    # create tables
    Base.metadata.create_all(bind=engine)

    roles = ["Admin", "Supplier", "Wholesaler", "Retailer", "Customer"]
    for r in roles:
        if not db.scalar(select(Role).where(Role.name == r)):
            db.add(Role(name=r))
    db.commit()

    admin_role = db.scalar(select(Role).where(Role.name == "Admin"))
    admin = db.scalar(select(User).where(User.email == settings.SEED_ADMIN_EMAIL.lower()))
    if not admin:
        admin = User(
            name="Super Admin",
            email=settings.SEED_ADMIN_EMAIL.lower(),
            phone=None,
            company_name="TradeLink",
            role_id=admin_role.id,
            password_hash=hash_password(settings.SEED_ADMIN_PASSWORD),
            status=True,
        )
        db.add(admin)
        db.commit()

    # Seed sample products - only if none exist
    existing_products = db.scalars(select(Product)).first()
    if not existing_products:
        supplier = db.scalar(select(User).where(User.email == settings.SEED_ADMIN_EMAIL.lower()))
        
        sample_products = [
            {"name": "شاي أسود فاخر", "sku": "TEA001", "price": 150.00, "min_order_qty": 1, "stock": 500},
            {"name": "قهوة عربية 1 كغ", "sku": "COFFEE001", "price": 280.00, "min_order_qty": 1, "stock": 300},
            {"name": "زيت زيتون برتقالي", "sku": "OIL001", "price": 450.00, "min_order_qty": 1, "stock": 200},
            {"name": "عسل نقي 500غ", "sku": "HONEY001", "price": 120.00, "min_order_qty": 1, "stock": 150},
            {"name": "تمر أجود الأنواع", "sku": "DATES001", "price": 100.00, "min_order_qty": 1, "stock": 400},
        ]
        
        for prod_data in sample_products:
            p = Product(
                supplier_id=supplier.id,
                name=prod_data["name"],
                sku=prod_data["sku"],
                price=prod_data["price"],
                min_order_qty=prod_data["min_order_qty"],
                stock=prod_data["stock"],
                status=True,
            )
            db.add(p)
        db.commit()


@app.on_event("startup")
def on_startup():
    db = SessionLocal()
    try:
        seed(db)
    finally:
        db.close()


@app.get("/health")
def health():
    return {"status": "ok"}