from sqlalchemy import String, Integer, DateTime, ForeignKey, func, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base

class ReturnRequest(Base):
    __tablename__ = "return_requests"
    __allow_unmapped__ = True

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    order_id: Mapped[int] = mapped_column(ForeignKey("orders.id"), index=True)
    product_id: Mapped[int] = mapped_column(ForeignKey("products.id"))
    buyer_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    quantity: Mapped[int] = mapped_column(Integer)
    reason: Mapped[str] = mapped_column(Text)
    status: Mapped[str] = mapped_column(String(50), default="pending") # pending, approved, rejected

    order = relationship("Order")
    product = relationship("Product")
    buyer = relationship("User")

    created_at: Mapped = mapped_column(DateTime(timezone=True), server_default=func.now())
