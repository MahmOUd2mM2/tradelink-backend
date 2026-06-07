from pydantic import BaseModel
from typing import Optional

class PaymentCreate(BaseModel):
    payment_method: str
    phone: Optional[str] = None
    reference: Optional[str] = None
    card_number: Optional[str] = None
    card_holder: Optional[str] = None
    expiry: Optional[str] = None
    cvv: Optional[str] = None
