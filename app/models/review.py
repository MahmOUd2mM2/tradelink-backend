from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime
from datetime import datetime
from app.db.base import Base

class Review(Base):
    __tablename__ = "reviews"
    
    id = Column(Integer, primary_key=True, index=True)
    reviewer_id = Column(Integer, ForeignKey("users.id"))
    target_type = Column(String)  # 'supplier' or 'product'
    target_id = Column(Integer)   # Supplier ID or Product ID
    rating = Column(Float)        # 1 to 5
    comment = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
