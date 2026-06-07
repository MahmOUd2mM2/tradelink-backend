from pydantic import BaseModel, ConfigDict
from typing import Optional

class ProductCreate(BaseModel):
    name: str
    sku: str
    price: float
    suggested_retail_price: Optional[float] = None
    min_order_qty: int = 1
    tier_discount_qty: Optional[int] = None
    tier_discount_percent: Optional[float] = None
    status: bool = True

class ProductOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    supplier_id: int
    name: str
    sku: str
    price: float
    suggested_retail_price: Optional[float]
    min_order_qty: int
    tier_discount_qty: Optional[int]
    tier_discount_percent: Optional[float]
    stock: int
    status: bool
