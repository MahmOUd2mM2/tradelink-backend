from sqlalchemy import String, Integer, DateTime, ForeignKey, func, Numeric, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base

class Product(Base):
    __tablename__ = "products"
    __allow_unmapped__ = True

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    supplier_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)

    name: Mapped[str] = mapped_column(String(255), index=True)
    sku: Mapped[str] = mapped_column(String(80), unique=True, index=True)
    price: Mapped[float] = mapped_column(Numeric(12, 2))
    suggested_retail_price: Mapped[float] = mapped_column(Numeric(12, 2), nullable=True)
    min_order_qty: Mapped[int] = mapped_column(Integer, default=1)
    tier_discount_qty: Mapped[int] = mapped_column(Integer, nullable=True)
    tier_discount_percent: Mapped[float] = mapped_column(Numeric(5, 2), nullable=True)
    stock: Mapped[int] = mapped_column(Integer, default=0)
    status: Mapped[bool] = mapped_column(Boolean, default=True)

    supplier = relationship("User")

    created_at: Mapped = mapped_column(DateTime(timezone=True), server_default=func.now())
