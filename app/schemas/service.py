from pydantic import BaseModel
from typing import Optional, Literal
from datetime import datetime

SERVICE_TYPES = Literal["financing", "insurance", "shipping", "logistics", "warehousing", "consultation"]


class ServiceRequestCreate(BaseModel):
    service_type: SERVICE_TYPES
    description: Optional[str] = None
    budget: Optional[float] = None


class ServiceRequestOut(BaseModel):
    model_config = {"from_attributes": True}
    
    id: int
    user_id: int
    service_type: str
    description: Optional[str]
    budget: Optional[float]
    status: str
    admin_notes: Optional[str]
    created_at: datetime
    updated_at: datetime
