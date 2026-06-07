from pydantic import BaseModel
# login doesn't enforce strict email validation because we may use special domains

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

class LoginRequest(BaseModel):
    email: str  # allow non‑RFC‑standard addresses like *.local
    password: str
