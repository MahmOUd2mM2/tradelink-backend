from fastapi import APIRouter

from app.api.routes import auth, users, products, orders, admin, warehouse, services, returns, ai, pos, reviews

api_router = APIRouter(prefix="/api")

api_router.include_router(auth.router, tags=["auth"])
api_router.include_router(users.router, tags=["users"])
api_router.include_router(products.router, tags=["products"])
api_router.include_router(orders.router, tags=["orders"])
api_router.include_router(admin.router, tags=["admin"])
api_router.include_router(warehouse.router, tags=["warehouse", "inventory", "invoices", "payments", "shipments"])
api_router.include_router(services.router, tags=["services"])
api_router.include_router(returns.router, tags=["returns"])
api_router.include_router(ai.router, tags=["ai"])
api_router.include_router(pos.router, tags=["pos"])
api_router.include_router(reviews.router, prefix="/reviews", tags=["reviews"])