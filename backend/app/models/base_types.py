from typing import Any

from cryptography.fernet import Fernet
from sqlalchemy import Dialect, LargeBinary, TypeDecorator

from app.core.config import settings


class EncryptedString(TypeDecorator[str]):
    impl = LargeBinary
    cache_ok = True

    @property
    def _fernet(self) -> Fernet:
        try:
            return Fernet(settings.ENCRYPTION_KEY.get_secret_value().encode("utf-8"))
        except (TypeError, ValueError) as exc:
            raise ValueError(
                "Invalid ENCRYPTION_KEY, must be a 32-byte "
                "url-safe base64-encoded Fernet key."
            ) from exc

    def process_bind_param(self, value: str | None, dialect: Dialect) -> bytes | None:
        if value is None:
            return None
        return self._fernet.encrypt(str(value).encode("utf-8"))

    def process_result_value(self, value: Any | None, dialect: Dialect) -> str | None:
        if value is None:
            return None
        return self._fernet.decrypt(value).decode("utf-8")
