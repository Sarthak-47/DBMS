"""JWT helpers and password utilities."""
import os
from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext

SECRET_KEY = os.getenv("SECRET_KEY", "evenzo-secret-key-2026-do-not-use-in-prod")
ALGORITHM  = "HS256"
EXPIRE_HOURS = 24

pwd_context   = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

ORG_PASSCODE   = "EVENZO-ORG-2026"
ADMIN_PASSCODE = "EVENZO-ADMIN-2026"


def hash_password(plain: str) -> str:
    return pwd_context.hash(plain)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


def create_token(user_id: int, role: str, full_name: str, email: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(hours=EXPIRE_HOURS)
    payload = {
        "sub":       str(user_id),
        "role":      role,
        "full_name": full_name,
        "email":     email,
        "exp":       expire,
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def decode_token(token: str) -> dict:
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )


def get_current_user(token: str = Depends(oauth2_scheme)) -> dict:
    return decode_token(token)


def require_role(*roles: str):
    def checker(user: dict = Depends(get_current_user)) -> dict:
        if user["role"] not in roles:
            raise HTTPException(status.HTTP_403_FORBIDDEN, "Insufficient permissions")
        return user
    return checker
