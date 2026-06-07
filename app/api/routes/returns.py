from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List

from app.db.session import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.return_request import ReturnRequest
from app.models.order import Order
from app.models.order_item import OrderItem

router = APIRouter(prefix="/returns", tags=["returns"])

class ReturnCreate(BaseModel):
    order_id: int
    product_id: int
    quantity: int
    reason: str

@router.post("")
def create_return_request(
    data: ReturnCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    # Verify order exists and user is buyer
    order = db.get(Order, data.order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if order.buyer_id != user.id:
        raise HTTPException(status_code=403, detail="Not authorized to return this order")
    if order.status != "delivered":
        raise HTTPException(status_code=400, detail="Can only return delivered orders")
        
    # Check if product is in order
    order_item = db.query(OrderItem).filter(
        OrderItem.order_id == data.order_id,
        OrderItem.product_id == data.product_id
    ).first()
    
    if not order_item:
        raise HTTPException(status_code=400, detail="Product not found in this order")
        
    if data.quantity > order_item.quantity:
        raise HTTPException(status_code=400, detail="Cannot return more than purchased quantity")
        
    req = ReturnRequest(
        order_id=data.order_id,
        product_id=data.product_id,
        buyer_id=user.id,
        quantity=data.quantity,
        reason=data.reason,
        status="pending"
    )
    db.add(req)
    db.commit()
    db.refresh(req)
    return {"message": "Return request submitted successfully", "id": req.id}
