from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class InventoryCreate(BaseModel):
    product_id: int
    warehouse_id: int
    quantity: int

class InventoryOut(BaseModel):
    id: int
    product_id: int
    warehouse_id: int
    quantity: int
    updated_at: datetime

class WarehouseCreate(BaseModel):
    city: str
    address: str
    capacity: float

class WarehouseOut(BaseModel):
    id: int
    owner_id: int
    city: str
    address: str
    capacity: float
    created_at: datetime

class InvoiceCreate(BaseModel):
    order_id: int
    amount: float
    due_date: datetime

class InvoiceOut(BaseModel):
    id: int
    order_id: int
    invoice_number: str
    amount: float
    status: str
    created_at: datetime
    due_date: datetime

class PaymentCreate(BaseModel):
    order_id: int
    method: str
    amount: float

class PaymentOut(BaseModel):
    id: int
    order_id: int
    method: str
    amount: float
    status: str
    transaction_ref: str
    created_at: datetime

class ShipmentCreate(BaseModel):
    order_id: int
    company: str
    tracking_number: str

class ShipmentOut(BaseModel):
    id: int
    order_id: int
    company: str
    tracking_number: str
    status: str
    shipped_date: Optional[datetime]
    delivered_date: Optional[datetime]
    created_at: datetime
