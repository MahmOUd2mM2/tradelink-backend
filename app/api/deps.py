from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.core.config import settings
from app.core.security import ALGORITHM
from app.db.session import get_db
from app.models.user import User
from app.models.role import Role

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

def get_current_user(db: Session = Depends(get_db), token: str = Depends(oauth2_scheme)) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[ALGORITHM])
        sub: str | None = payload.get("sub")
        if not sub:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = db.get(User, int(sub))
    if not user or not user.status:
        raise credentials_exception
    return user

def require_roles(*roles: str):
    def _inner(user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> User:
        role = db.get(Role, user.role_id)
        if not role or role.name not in roles:
            raise HTTPException(status_code=403, detail="Insufficient permissions")
        return user
    return _inner
