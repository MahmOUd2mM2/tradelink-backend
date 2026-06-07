from pydantic import BaseModel
# use plain str for email to allow special domains like .local
from typing import Optional

class UserCreate(BaseModel):
    name: str
    email: str
    password: str
    phone: Optional[str] = None
    company_name: Optional[str] = None
    role_name: str  # Supplier | Wholesaler | Retailer | Customer
    parent_id: Optional[int] = None

class UserOut(BaseModel):
    id: int
    name: str
    email: str
    phone: Optional[str] = None
    company_name: Optional[str] = None
    role: str
    status: bool
    wallet_balance: Optional[float] = 0.0
    parent_id: Optional[int] = None

    class Config:
        from_attributes = True
