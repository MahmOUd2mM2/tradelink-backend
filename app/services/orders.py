from __future__ import annotations

from sqlalchemy import func
from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.order import Order
from app.models.order_item import OrderItem
from app.models.product import Product
from app.schemas.order import OrderCreate


# الحالات المسموحة
ALLOWED_ORDER_STATUS = {"pending", "accepted", "shipped", "delivered", "cancelled"}


def create_order(db: Session, buyer_id: int, data: OrderCreate) -> Order:
    """
    Create a new order for buyer_id from a specific seller_id with items.
    Validates:
      - product belongs to seller
      - quantity >= product.min_order_qty
    """
    # Validate products exist and belong to seller
    products = list(db.scalars(select(Product).where(Product.supplier_id == data.seller_id)))
    product_map = {p.id: p for p in products}

    total = Decimal("0")
    order = Order(
        buyer_id=buyer_id,
        seller_id=data.seller_id,
        status="pending",
        total_amount=0,
    )
    db.add(order)
    db.flush()  # get order.id

    for item in data.items:
        p = product_map.get(item.product_id)
        if not p:
            raise ValueError(f"Product {item.product_id} not found for seller {data.seller_id}")

        if item.quantity < p.min_order_qty:
            raise ValueError(f"Quantity for product {p.id} must be >= min_order_qty ({p.min_order_qty})")

        # Check stock availability
        if getattr(p, "stock", None) is None:
            # product has no stock field (old DB), treat as unlimited
            available = None
        else:
            available = int(p.stock)
        if available is not None and item.quantity > available:
            raise ValueError(f"Insufficient stock for product {p.id}. Available: {available}")

        oi = OrderItem(
            order_id=order.id,
            product_id=p.id,
            quantity=item.quantity,
            unit_price=p.price,
        )
        db.add(oi)

        # decrement stock if tracked
        if available is not None:
            p.stock = available - int(item.quantity)
            db.add(p)

        total += Decimal(str(p.price)) * Decimal(str(item.quantity))

    order.total_amount = float(total)
    db.commit()
    db.refresh(order)
    return order


def list_orders_for_user(db: Session, user_id: int, skip: int = 0, limit: int = 50) -> list[Order]:
    """
    Returns orders where user is buyer OR seller.
    """
    q = (
        select(Order)
        .where((Order.buyer_id == user_id) | (Order.seller_id == user_id))
        .offset(skip)
        .limit(limit)
    )
    return list(db.scalars(q))


def get_stats(db: Session) -> dict:
    """Return basic statistics for dashboard."""
    from sqlalchemy import desc
    
    # Using modern SQLAlchemy select API
    total_sales_result = db.query(func.coalesce(func.sum(Order.total_amount), 0)).first()
    total_sales = float(total_sales_result[0]) if total_sales_result else 0
    
    total_orders = db.query(func.count(Order.id)).first()[0] or 0
    
    orders_by_status = {}
    for status in ALLOWED_ORDER_STATUS:
        count = db.query(func.count(Order.id)).filter(Order.status == status).first()[0] or 0
        orders_by_status[status] = count
    
    unique_products = db.query(func.count(func.distinct(OrderItem.product_id))).first()[0] or 0
    
    # get recent orders using select
    recent_orders_q = select(Order).order_by(desc(Order.created_at)).limit(5)
    recent_orders = list(db.scalars(recent_orders_q))
    
    # top selling products by quantity (using query for group_by)
    top_prods = (
        db.query(OrderItem.product_id, func.sum(OrderItem.quantity).label("qty"))
        .group_by(OrderItem.product_id)
        .order_by(desc(func.sum(OrderItem.quantity)))
        .limit(5)
        .all()
    )
    
    top_products = [{"product_id": p.product_id, "quantity": int(p.qty)} for p in top_prods]
    
    return {
        "total_sales": total_sales,
        "total_orders": total_orders,
        "orders_by_status": orders_by_status,
        "unique_products": unique_products,
        "recent_orders": [
            {
                "id": o.id,
                "buyer_id": o.buyer_id,
                "seller_id": o.seller_id,
                "total_amount": float(o.total_amount),
                "status": o.status,
                "created_at": o.created_at.isoformat() if hasattr(o.created_at, 'isoformat') else str(o.created_at),
            }
            for o in recent_orders
        ],
        "top_products": top_products,
    }


def list_orders_for_seller(db: Session, seller_id: int, skip: int = 0, limit: int = 50) -> list[Order]:
    """
    Returns orders where user is the seller (Supplier).
    """
    q = select(Order).where(Order.seller_id == seller_id).offset(skip).limit(limit)
    return list(db.scalars(q))


def get_order(db: Session, order_id: int) -> Order | None:
    return db.get(Order, order_id)


def update_order_status(
    db: Session,
    *,
    order_id: int,
    new_status: str,
    actor_user_id: int,
    actor_role: str,
) -> Order:
    """
    Update order status with authorization rules:
      - Admin can update any order
      - Supplier can update only orders where seller_id == actor_user_id
      - Others are not allowed
    """
    if new_status not in ALLOWED_ORDER_STATUS:
        raise ValueError(f"Invalid status '{new_status}'. Allowed: {sorted(ALLOWED_ORDER_STATUS)}")

    order = db.get(Order, order_id)
    if not order:
        raise ValueError("Order not found")

    if actor_role == "Admin" or actor_role == "Shipper":
        pass
    elif actor_role == "Supplier":
        if order.seller_id != actor_user_id:
            raise ValueError("Not allowed: not your order")
    else:
        raise ValueError("Insufficient permissions")

    if new_status == "delivered" and order.status != "delivered":
        from app.models.user import User
        from app.models.warehouse import Warehouse, Inventory
        from sqlalchemy import select

        seller = db.get(User, order.seller_id)
        if seller:
            current_balance = seller.wallet_balance if seller.wallet_balance is not None else 0
            seller.wallet_balance = float(current_balance) + order.total_amount
            db.add(seller)

        # Update Buyer's local inventory for POS
        buyer = db.get(User, order.buyer_id)
        if buyer:
            # 1. Ensure buyer has a warehouse (virtual POS store)
            buyer_warehouse = db.execute(select(Warehouse).where(Warehouse.owner_id == buyer.id)).scalar_first()
            if not buyer_warehouse:
                buyer_warehouse = Warehouse(owner_id=buyer.id, city="Local", address="POS Local Store", capacity=9999)
                db.add(buyer_warehouse)
                db.flush()
            
            # 2. Add ordered items to local inventory
            for item in order.items:
                inv = db.execute(select(Inventory).where(
                    Inventory.warehouse_id == buyer_warehouse.id,
                    Inventory.product_id == item.product_id
                )).scalar_first()
                if inv:
                    inv.quantity += item.quantity
                else:
                    inv = Inventory(product_id=item.product_id, warehouse_id=buyer_warehouse.id, quantity=item.quantity)
                    db.add(inv)

    order.status = new_status
    db.commit()
    db.refresh(order)
    return order