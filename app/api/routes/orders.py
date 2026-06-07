from __future__ import annotations

from decimal import Decimal
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.models.order import Order
from app.models.order_item import OrderItem
from app.models.product import Product
from app.schemas.order import OrderCreate, OrderOut
from app.schemas.payment import PaymentCreate

from fastapi import APIRouter, Depends, HTTPException
from app.db.session import get_db
from app.services.orders import (
    create_order as svc_create_order,
    list_orders_for_user as svc_list_orders_for_user,
    list_orders_for_seller as svc_list_orders_for_seller,
    update_order_status as svc_update_order_status,
    get_stats as svc_get_stats,
)
from app.api.deps import get_current_user
from app.models.role import Role

router = APIRouter(prefix="/orders")


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

        unit_price = p.price
        if p.tier_discount_qty and item.quantity >= p.tier_discount_qty:
            if p.tier_discount_percent:
                discount_ratio = Decimal(str(p.tier_discount_percent)) / Decimal("100")
                unit_price = float(Decimal(str(p.price)) * (Decimal("1") - discount_ratio))

        oi = OrderItem(
            order_id=order.id,
            product_id=p.id,
            quantity=item.quantity,
            unit_price=unit_price,
        )
        db.add(oi)

        total += Decimal(str(unit_price)) * Decimal(str(item.quantity))

    order.total_amount = float(total)
    db.commit()
    db.refresh(order)
    return order


def list_orders_for_user(db: Session, user_id: int, skip: int = 0, limit: int = 50) -> list[Order]:
    """
    Returns orders where user is buyer OR seller.
    (مناسب لو endpoint بيعرض "كل الطلبات المتعلقة بالمستخدم")
    """
    q = (
        select(Order)
        .where((Order.buyer_id == user_id) | (Order.seller_id == user_id))
        .offset(skip)
        .limit(limit)
    )
    return list(db.scalars(q))


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

    Raises:
      - ValueError on invalid status / not found / forbidden
    """
    if new_status not in ALLOWED_ORDER_STATUS:
        raise ValueError(f"Invalid status '{new_status}'. Allowed: {sorted(ALLOWED_ORDER_STATUS)}")

    order = db.get(Order, order_id)
    if not order:
        raise ValueError("Order not found")

    if actor_role == "Admin":
        pass
    elif actor_role == "Supplier":
        if order.seller_id != actor_user_id:
            raise ValueError("Not allowed: not your order")
    else:
        raise ValueError("Insufficient permissions")

    order.status = new_status
    db.commit()
    db.refresh(order)
    return order


# -----------------------------------------------------------------------------
# HTTP routes exposing the order helpers
# -----------------------------------------------------------------------------

@router.post("", response_model=OrderOut)
def api_create_order(
    data: OrderCreate,
    db: Session = Depends(get_db),
    user = Depends(get_current_user),
):
    try:
        return svc_create_order(db, user.id, data)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@router.get("/stats")
def api_stats(
    db: Session = Depends(get_db),
    user = Depends(get_current_user),
):
    # any authenticated user can see basic stats
    return svc_get_stats(db)


@router.get("", response_model=list[OrderOut])
def api_list_orders(
    db: Session = Depends(get_db),
    user = Depends(get_current_user),
):
    return svc_list_orders_for_user(db, user.id)


@router.get("/all", response_model=list[OrderOut])
def api_list_all_orders(
    db: Session = Depends(get_db),
    user = Depends(get_current_user),
):
    role = db.get(Role, user.role_id)
    if not role or role.name != "Admin":
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    
    q = select(Order).order_by(Order.created_at.desc())
    return list(db.scalars(q))


@router.patch("/{order_id}/status", response_model=OrderOut)
def api_update_status(
    order_id: int,
    new_status: str,
    db: Session = Depends(get_db),
    user = Depends(get_current_user),
):
    role = db.get(Role, user.role_id)
    role_name = role.name if role else ""
    if role_name not in ("Admin", "Supplier"):
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    try:
        return svc_update_order_status(
            db,
            order_id=order_id,
            new_status=new_status,
            actor_user_id=user.id,
            actor_role=role_name,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@router.post("/{order_id}/pay", response_model=OrderOut)
def api_pay_order(
    order_id: int,
    payment_data: PaymentCreate,
    db: Session = Depends(get_db),
    user = Depends(get_current_user),
):
    """
    Mock payment endpoint: only the buyer may call this to 'pay' the order.
    On success the order will move from `pending` -> `accepted`.
    Payment details are recorded in the payment record.
    """
    order = db.get(Order, order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    # only buyer can pay
    if order.buyer_id != user.id:
        raise HTTPException(status_code=403, detail="Only buyer can perform payment")
    if order.status != "pending":
        raise HTTPException(status_code=400, detail="Order is not payable")

    # Create payment record (mock - in production would integrate with payment gateway)
    # Use transaction to ensure atomicity
    from app.models.warehouse import Payment
    import uuid
    try:
        with db.begin():
            payment = Payment(
                order_id=order.id,
                method=payment_data.payment_method,
                amount=order.total_amount,
                status="completed",
                transaction_ref=f"TXN-{uuid.uuid4().hex[:12].upper()}"
            )
            db.add(payment)
            order.status = "accepted"
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Payment failed: {str(e)}")
    
    db.refresh(order)
    return order

