import uuid
from datetime import UTC, datetime, timedelta
from typing import Any

import jwt
from passlib.context import CryptContext

from app.core.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return pwd_context.verify(plain_password, hashed_password)
    except Exception:
        return False


# Security
ALGORITHM = settings.ALGORITHM
ACCESS_TOKEN_LIFETIME = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
REFRESH_TOKEN_LIFETIME = timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)


def create_access_token(user_id: uuid.UUID) -> str:
    payload = {
        "sub": str(user_id),
        "type": "access",
        "exp": datetime.now(UTC) + ACCESS_TOKEN_LIFETIME,
        "iat": datetime.now(UTC),
        "jti": str(uuid.uuid4()),
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=ALGORITHM)


def create_session_token(subject: uuid.UUID, expires_at: datetime) -> str:
    payload = {
        "sub": str(subject),
        "type": "refresh",
        "exp": expires_at,
        "iat": datetime.now(UTC),
        "jti": str(uuid.uuid4()),
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=ALGORITHM)


def decode_token(token: str) -> dict[str, Any]:
    return jwt.decode(token, settings.SECRET_KEY, algorithms=[ALGORITHM])


ACCESS_TOKEN_COOKIE_NAME = "devtrackr_access"
REFRESH_TOKEN_COOKIE_NAME = "devtrackr_refresh"
