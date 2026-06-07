from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.role import Role
from app.schemas.warehouse import (
    WarehouseCreate, WarehouseOut, InventoryCreate, InventoryOut,
    InvoiceCreate, InvoiceOut, PaymentCreate, PaymentOut,
    ShipmentCreate, ShipmentOut
)
from app.services.warehouse import (
    create_warehouse, get_user_warehouses, get_warehouse, update_warehouse, delete_warehouse,
    create_inventory, get_product_inventory, get_warehouse_inventory, update_inventory,
    create_invoice, get_order_invoice, update_invoice_status,
    create_payment, get_order_payments, update_payment_status,
    create_shipment, get_order_shipment, update_shipment_status, track_shipment
)
from app.api.deps import get_current_user, require_roles

router = APIRouter()

# ============ WAREHOUSES ============
@router.post("/warehouses", response_model=WarehouseOut)
def create_new_warehouse(
    data: WarehouseCreate,
    db: Session = Depends(get_db),
    user = Depends(get_current_user),
    _admin = Depends(require_roles("Admin", "Supplier"))
):
    return create_warehouse(db, user.id, data)

@router.get("/warehouses", response_model=list[WarehouseOut])
def list_warehouses(
    db: Session = Depends(get_db),
    user = Depends(get_current_user)
):
    return get_user_warehouses(db, user.id)

@router.get("/warehouses/{warehouse_id}", response_model=WarehouseOut)
def get_warehouse_details(
    warehouse_id: int,
    db: Session = Depends(get_db),
    user = Depends(get_current_user)
):
    warehouse = get_warehouse(db, warehouse_id)
    if not warehouse:
        raise HTTPException(status_code=404, detail="Warehouse not found")
    # Ownership check: only owner or admin can view
    role = db.get(Role, user.role_id)
    role_name = role.name if role else ""
    if warehouse.owner_id != user.id and role_name != "Admin":
        raise HTTPException(status_code=403, detail="Not authorized to access this warehouse")
    return warehouse

@router.put("/warehouses/{warehouse_id}", response_model=WarehouseOut)
def update_warehouse_details(
    warehouse_id: int,
    data: WarehouseCreate,
    db: Session = Depends(get_db),
    user = Depends(get_current_user),
    _admin = Depends(require_roles("Admin", "Supplier"))
):
    warehouse = get_warehouse(db, warehouse_id)
    if not warehouse:
        raise HTTPException(status_code=404, detail="Warehouse not found")
    # Ownership check: only owner can update
    if warehouse.owner_id != user.id:
        raise HTTPException(status_code=403, detail="Not authorized to update this warehouse")
    warehouse = update_warehouse(db, warehouse_id, data)
    return warehouse

@router.delete("/warehouses/{warehouse_id}")
def delete_warehouse_route(
    warehouse_id: int,
    db: Session = Depends(get_db),
    user = Depends(get_current_user),
    _admin = Depends(require_roles("Admin"))
):
    warehouse = delete_warehouse(db, warehouse_id)
    if not warehouse:
        raise HTTPException(status_code=404, detail="Warehouse not found")
    return {"message": "Warehouse deleted"}

# ============ INVENTORY ============
@router.post("/inventory", response_model=InventoryOut)
def add_inventory(
    data: InventoryCreate,
    db: Session = Depends(get_db),
    user = Depends(get_current_user),
    _admin = Depends(require_roles("Admin", "Supplier"))
):
    return create_inventory(db, data)

@router.get("/inventory/product/{product_id}")
def get_product_stock(
    product_id: int,
    db: Session = Depends(get_db),
    user = Depends(get_current_user)
):
    # Get user's role
    role = db.get(Role, user.role_id)
    role_name = role.name if role else ""
    # Only allow access to own products (for Supplier) or Admin
    from app.models.product import Product
    product = db.get(Product, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    if product.supplier_id != user.id and role_name != "Admin":
        raise HTTPException(status_code=403, detail="Not authorized to view this product inventory")
    return get_product_inventory(db, product_id)

@router.get("/inventory/warehouse/{warehouse_id}")
def get_warehouse_stock(
    warehouse_id: int,
    db: Session = Depends(get_db),
    user = Depends(get_current_user)
):
    # Get user's role
    role = db.get(Role, user.role_id)
    role_name = role.name if role else ""
    # Ownership check
    warehouse = get_warehouse(db, warehouse_id)
    if not warehouse:
        raise HTTPException(status_code=404, detail="Warehouse not found")
    if warehouse.owner_id != user.id and role_name != "Admin":
        raise HTTPException(status_code=403, detail="Not authorized to view this warehouse inventory")
    return get_warehouse_inventory(db, warehouse_id)

@router.put("/inventory/{inventory_id}")
def update_stock(
    inventory_id: int,
    quantity: int,
    db: Session = Depends(get_db),
    user = Depends(get_current_user),
    _admin = Depends(require_roles("Admin", "Supplier"))
):
    inventory = update_inventory(db, inventory_id, quantity)
    if not inventory:
        raise HTTPException(status_code=404, detail="Inventory not found")
    return inventory

# ============ INVOICES ============
@router.post("/invoices", response_model=InvoiceOut)
def create_new_invoice(
    data: InvoiceCreate,
    db: Session = Depends(get_db),
    user = Depends(get_current_user),
    _admin = Depends(require_roles("Admin", "Supplier"))
):
    return create_invoice(db, data)

@router.get("/invoices/order/{order_id}")
def get_invoice(
    order_id: int,
    db: Session = Depends(get_db),
    user = Depends(get_current_user)
):
    # Get user's role
    role = db.get(Role, user.role_id)
    role_name = role.name if role else ""
    
    invoice = get_order_invoice(db, order_id)
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    
    # Get order to check ownership
    from app.models.order import Order
    order = db.get(Order, order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Only buyer, seller, or admin can view invoice
    if order.buyer_id != user.id and order.seller_id != user.id and role_name != "Admin":
        raise HTTPException(status_code=403, detail="Not authorized to view this invoice")
    return invoice

@router.patch("/invoices/{invoice_id}/status")
def update_invoice_payment_status(
    invoice_id: int,
    status: str,
    db: Session = Depends(get_db),
    user = Depends(get_current_user),
    _admin = Depends(require_roles("Admin"))
):
    invoice = update_invoice_status(db, invoice_id, status)
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    return invoice

# ============ PAYMENTS ============
@router.post("/payments", response_model=PaymentOut)
def create_new_payment(
    data: PaymentCreate,
    db: Session = Depends(get_db),
    user = Depends(get_current_user)
):
    return create_payment(db, data)

@router.get("/payments/order/{order_id}")
def get_order_payment_history(
    order_id: int,
    db: Session = Depends(get_db),
    user = Depends(get_current_user)
):
    # Get user's role
    role = db.get(Role, user.role_id)
    role_name = role.name if role else ""
    
    # Get order to check ownership
    from app.models.order import Order
    order = db.get(Order, order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Only buyer, seller, or admin can view payments
    if order.buyer_id != user.id and order.seller_id != user.id and role_name != "Admin":
        raise HTTPException(status_code=403, detail="Not authorized to view this payment history")
    return get_order_payments(db, order_id)

@router.patch("/payments/{payment_id}/status")
def update_payment_transaction_status(
    payment_id: int,
    status: str,
    db: Session = Depends(get_db),
    user = Depends(get_current_user),
    _admin = Depends(require_roles("Admin"))
):
    payment = update_payment_status(db, payment_id, status)
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    return payment

# ============ SHIPMENTS ============
@router.post("/shipments", response_model=ShipmentOut)
def create_new_shipment(
    data: ShipmentCreate,
    db: Session = Depends(get_db),
    user = Depends(get_current_user),
    _admin = Depends(require_roles("Admin", "Supplier"))
):
    return create_shipment(db, data)

@router.get("/shipments/order/{order_id}")
def get_shipment(
    order_id: int,
    db: Session = Depends(get_db),
    user = Depends(get_current_user)
):
    # Get user's role
    role = db.get(Role, user.role_id)
    role_name = role.name if role else ""
    
    # Get order to check ownership
    from app.models.order import Order
    order = db.get(Order, order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Only buyer, seller, or admin can view shipment
    if order.buyer_id != user.id and order.seller_id != user.id and role_name != "Admin":
        raise HTTPException(status_code=403, detail="Not authorized to view this shipment")
    
    shipment = get_order_shipment(db, order_id)
    if not shipment:
        raise HTTPException(status_code=404, detail="Shipment not found")
    return shipment

@router.get("/shipments/track/{tracking_number}")
def track_order(
    tracking_number: str,
    db: Session = Depends(get_db),
    user = Depends(get_current_user)
):
    shipment = track_shipment(db, tracking_number)
    if not shipment:
        raise HTTPException(status_code=404, detail="Shipment not found")
    return shipment

@router.patch("/shipments/{shipment_id}/status")
def update_shipment(
    shipment_id: int,
    status: str,
    db: Session = Depends(get_db),
    user = Depends(get_current_user),
    _admin = Depends(require_roles("Admin", "Supplier"))
):
    shipment = update_shipment_status(db, shipment_id, status)
    if not shipment:
        raise HTTPException(status_code=404, detail="Shipment not found")
    return shipment
