from sqlalchemy.orm import DeclarativeBase

class Base(DeclarativeBase):
    pass

from app.models.role import Role
from app.models.user import User
from app.models.product import Product
from app.models.order import Order
from app.models.order_item import OrderItem
from app.models.warehouse import Warehouse, Inventory, Shipment, Payment
from app.models.service import ServiceRequest
from app.models.return_request import ReturnRequest
