from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import select, func
from typing import List, Optional
from datetime import datetime

from app.db.session import get_db
from app.api.deps import get_current_user
from app.models.review import Review
from app.models.user import User
from app.models.product import Product

router = APIRouter()

class ReviewCreate(BaseModel):
    target_type: str # 'supplier' or 'product'
    target_id: int
    rating: float
    comment: Optional[str] = None

class ReviewOut(BaseModel):
    id: int
    reviewer_id: int
    reviewer_name: str
    target_type: str
    target_id: int
    rating: float
    comment: Optional[str]
    created_at: datetime

@router.post("/", response_model=ReviewOut)
def create_review(data: ReviewCreate, db: Session = Depends(get_db), user = Depends(get_current_user)):
    if data.rating < 1 or data.rating > 5:
        raise HTTPException(status_code=400, detail="Rating must be between 1 and 5")
        
    review = Review(
        reviewer_id=user.id,
        target_type=data.target_type,
        target_id=data.target_id,
        rating=data.rating,
        comment=data.comment
    )
    db.add(review)
    db.commit()
    db.refresh(review)
    
    return ReviewOut(
        id=review.id,
        reviewer_id=review.reviewer_id,
        reviewer_name=user.name,
        target_type=review.target_type,
        target_id=review.target_id,
        rating=review.rating,
        comment=review.comment,
        created_at=review.created_at
    )

@router.get("/{target_type}/{target_id}", response_model=List[ReviewOut])
def get_reviews(target_type: str, target_id: int, db: Session = Depends(get_db)):
    query = select(Review, User.name).join(User, Review.reviewer_id == User.id).where(
        Review.target_type == target_type,
        Review.target_id == target_id
    )
    results = db.execute(query).all()
    
    return [
        ReviewOut(
            id=r.id,
            reviewer_id=r.reviewer_id,
            reviewer_name=name,
            target_type=r.target_type,
            target_id=r.target_id,
            rating=r.rating,
            comment=r.comment,
            created_at=r.created_at
        ) for r, name in results
    ]

@router.get("/{target_type}/{target_id}/average")
def get_average_rating(target_type: str, target_id: int, db: Session = Depends(get_db)):
    avg = db.execute(
        select(func.avg(Review.rating))
        .where(Review.target_type == target_type, Review.target_id == target_id)
    ).scalar()
    
    count = db.execute(
        select(func.count(Review.id))
        .where(Review.target_type == target_type, Review.target_id == target_id)
    ).scalar()
    
    return {"average": float(avg) if avg else 0.0, "count": count}
