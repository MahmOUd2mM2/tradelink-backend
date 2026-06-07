from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship
from datetime import datetime
import enum

from app.db.base import Base

class Warehouse(Base):
    __tablename__ = "warehouses"
    
    id = Column(Integer, primary_key=True, index=True)
    owner_id = Column(Integer, ForeignKey("users.id"))
    city = Column(String, index=True)
    address = Column(String)
    capacity = Column(Float)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    owner = relationship("User", back_populates="warehouses")
    inventory = relationship("Inventory", back_populates="warehouse")

class Inventory(Base):
    __tablename__ = "inventory"
    
    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"))
    warehouse_id = Column(Integer, ForeignKey("warehouses.id"))
    quantity = Column(Integer, default=0)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    product = relationship("Product")
    warehouse = relationship("Warehouse", back_populates="inventory")

class Invoice(Base):
    __tablename__ = "invoices"
    
    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"))
    invoice_number = Column(String, unique=True, index=True)
    amount = Column(Float)
    status = Column(String, default="pending")  # pending, paid, overdue
    created_at = Column(DateTime, default=datetime.utcnow)
    due_date = Column(DateTime)
    
    order = relationship("Order")

class Payment(Base):
    __tablename__ = "payments"
    
    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"))
    method = Column(String)  # credit_card, bank, wallet, cash
    amount = Column(Float)
    status = Column(String, default="pending")  # pending, completed, failed
    transaction_ref = Column(String, unique=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    order = relationship("Order")

class ShipmentStatus(str, enum.Enum):
    pending = "pending"
    processing = "processing"
    shipped = "shipped"
    in_transit = "in_transit"
    delivered = "delivered"
    cancelled = "cancelled"

class Shipment(Base):
    __tablename__ = "shipments"
    
    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"))
    company = Column(String)  # shipping company name
    tracking_number = Column(String, unique=True, index=True)
    status = Column(SQLEnum(ShipmentStatus), default=ShipmentStatus.pending)
    shipped_date = Column(DateTime)
    delivered_date = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    order = relationship("Order", back_populates="shipment")

# Update User model to add relationship
from app.models.user import User
User.warehouses = relationship("Warehouse", back_populates="owner")

# Update Order model to add shipment relationship
from app.models.order import Order
Order.shipment = relationship("Shipment", back_populates="order", uselist=False)
