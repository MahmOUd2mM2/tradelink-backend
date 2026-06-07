from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import select
from typing import List

from app.db.session import get_db
from app.api.deps import get_current_user
from app.models.warehouse import Warehouse, Inventory
from app.models.product import Product

router = APIRouter()

class POSItem(BaseModel):
    product_id: int
    quantity: int

class POSSaleRequest(BaseModel):
    items: List[POSItem]

@router.get("/inventory")
def get_pos_inventory(db: Session = Depends(get_db), user = Depends(get_current_user)):
    """
    Returns the user's local POS inventory (joined with product details)
    """
    # Get user's warehouse
    warehouse = db.execute(select(Warehouse).where(Warehouse.owner_id == user.id)).scalar_first()
    if not warehouse:
        return []

    # Get inventory with products
    items = db.execute(
        select(Inventory, Product)
        .join(Product, Inventory.product_id == Product.id)
        .where(Inventory.warehouse_id == warehouse.id)
    ).all()

    result = []
    for inv, prod in items:
        result.append({
            "inventory_id": inv.id,
            "product_id": prod.id,
            "name": prod.name,
            "sku": prod.sku,
            "price": prod.suggested_retail_price or prod.price, # Use MSRP for POS
            "wholesale_price": prod.price,
            "quantity": inv.quantity,
            "supplier_id": prod.supplier_id,
        })
    return result

@router.post("/sale")
def process_pos_sale(data: POSSaleRequest, db: Session = Depends(get_db), user = Depends(get_current_user)):
    """
    Process a local B2C sale and deduct from local inventory.
    """
    warehouse = db.execute(select(Warehouse).where(Warehouse.owner_id == user.id)).scalar_first()
    if not warehouse:
        raise HTTPException(status_code=400, detail="No local inventory found")

    total = 0
    # Pre-validate stock
    for item in data.items:
        inv = db.execute(select(Inventory).where(
            Inventory.warehouse_id == warehouse.id,
            Inventory.product_id == item.product_id
        )).scalar_first()
        
        if not inv or inv.quantity < item.quantity:
            raise HTTPException(status_code=400, detail=f"Insufficient local stock for product {item.product_id}")

    # Deduct stock
    for item in data.items:
        inv = db.execute(select(Inventory).where(
            Inventory.warehouse_id == warehouse.id,
            Inventory.product_id == item.product_id
        )).scalar_first()
        inv.quantity -= item.quantity
        db.add(inv)
        
        prod = db.get(Product, item.product_id)
        if prod:
            total += (prod.suggested_retail_price or prod.price) * item.quantity

    # In a full system, we would log this to a RetailSales table.
    
    db.commit()
    return {"message": "Sale processed successfully", "total": total}
