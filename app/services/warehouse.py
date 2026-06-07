from sqlalchemy.orm import Session
from sqlalchemy import select, and_
from app.models.warehouse import Warehouse, Inventory, Invoice, Payment, Shipment, ShipmentStatus
from app.schemas.warehouse import WarehouseCreate, InventoryCreate, InvoiceCreate, PaymentCreate, ShipmentCreate
from datetime import datetime
import uuid

# Warehouse Services
def create_warehouse(db: Session, owner_id: int, data: WarehouseCreate) -> Warehouse:
    warehouse = Warehouse(
        owner_id=owner_id,
        city=data.city,
        address=data.address,
        capacity=data.capacity
    )
    db.add(warehouse)
    db.commit()
    db.refresh(warehouse)
    return warehouse

def get_user_warehouses(db: Session, user_id: int):
    return list(db.scalars(select(Warehouse).where(Warehouse.owner_id == user_id)))

def get_warehouse(db: Session, warehouse_id: int):
    return db.scalar(select(Warehouse).where(Warehouse.id == warehouse_id))

def update_warehouse(db: Session, warehouse_id: int, data: WarehouseCreate):
    warehouse = get_warehouse(db, warehouse_id)
    if warehouse:
        warehouse.city = data.city
        warehouse.address = data.address
        warehouse.capacity = data.capacity
        db.commit()
        db.refresh(warehouse)
    return warehouse

def delete_warehouse(db: Session, warehouse_id: int):
    warehouse = get_warehouse(db, warehouse_id)
    if warehouse:
        db.delete(warehouse)
        db.commit()
    return warehouse

# Inventory Services
def create_inventory(db: Session, data: InventoryCreate) -> Inventory:
    inventory = Inventory(
        product_id=data.product_id,
        warehouse_id=data.warehouse_id,
        quantity=data.quantity
    )
    db.add(inventory)
    db.commit()
    db.refresh(inventory)
    return inventory

def get_product_inventory(db: Session, product_id: int):
    return list(db.scalars(select(Inventory).where(Inventory.product_id == product_id)))

def get_warehouse_inventory(db: Session, warehouse_id: int):
    return list(db.scalars(select(Inventory).where(Inventory.warehouse_id == warehouse_id)))

def update_inventory(db: Session, inventory_id: int, quantity: int):
    inventory = db.scalar(select(Inventory).where(Inventory.id == inventory_id))
    if inventory:
        inventory.quantity = quantity
        inventory.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(inventory)
    return inventory

# Invoice Services
def create_invoice(db: Session, data: InvoiceCreate) -> Invoice:
    invoice_number = f"INV-{datetime.utcnow().strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"
    invoice = Invoice(
        order_id=data.order_id,
        invoice_number=invoice_number,
        amount=data.amount,
        due_date=data.due_date
    )
    db.add(invoice)
    db.commit()
    db.refresh(invoice)
    return invoice

def get_order_invoice(db: Session, order_id: int):
    return db.scalar(select(Invoice).where(Invoice.order_id == order_id))

def update_invoice_status(db: Session, invoice_id: int, status: str):
    invoice = db.scalar(select(Invoice).where(Invoice.id == invoice_id))
    if invoice:
        invoice.status = status
        db.commit()
        db.refresh(invoice)
    return invoice

# Payment Services
def create_payment(db: Session, data: PaymentCreate) -> Payment:
    transaction_ref = f"TXN-{uuid.uuid4().hex[:12].upper()}"
    payment = Payment(
        order_id=data.order_id,
        method=data.method,
        amount=data.amount,
        transaction_ref=transaction_ref
    )
    db.add(payment)
    db.commit()
    db.refresh(payment)
    return payment

def get_order_payments(db: Session, order_id: int):
    return list(db.scalars(select(Payment).where(Payment.order_id == order_id)))

def update_payment_status(db: Session, payment_id: int, status: str):
    payment = db.scalar(select(Payment).where(Payment.id == payment_id))
    if payment:
        payment.status = status
        db.commit()
        db.refresh(payment)
    return payment

# Shipment Services
def create_shipment(db: Session, data: ShipmentCreate) -> Shipment:
    shipment = Shipment(
        order_id=data.order_id,
        company=data.company,
        tracking_number=data.tracking_number,
        status=ShipmentStatus.pending
    )
    db.add(shipment)
    db.commit()
    db.refresh(shipment)
    return shipment

def get_order_shipment(db: Session, order_id: int):
    return db.scalar(select(Shipment).where(Shipment.order_id == order_id))

def update_shipment_status(db: Session, shipment_id: int, status: str):
    shipment = db.scalar(select(Shipment).where(Shipment.id == shipment_id))
    if shipment:
        try:
            shipment.status = ShipmentStatus(status)
        except ValueError:
            return None
        if status == "shipped":
            shipment.shipped_date = datetime.utcnow()
        elif status == "delivered":
            shipment.delivered_date = datetime.utcnow()
        db.commit()
        db.refresh(shipment)
    return shipment

def track_shipment(db: Session, tracking_number: str):
    return db.scalar(select(Shipment).where(Shipment.tracking_number == tracking_number))
