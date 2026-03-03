from cryptography.fernet import Fernet
from sqlalchemy import LargeBinary, TypeDecorator

from app.core.config import settings


class EncryptedString(TypeDecorator):
    impl = LargeBinary
    cache_ok = True

    @property
    def _fernet(self):
        try:
            return Fernet(settings.ENCRYPTION_KEY.get_secret_value().encode("utf-8"))
        except (TypeError, ValueError) as exc:
            raise ValueError("Invalid Fernet key in settings.ENCRYPTION_KEY") from exc

    def process_bind_param(self, value, dialect):
        if value is None:
            return None
        return self._fernet.encrypt(value.encode("utf-8"))

    def process_result_value(self, value, dialect):
        if value is None:
            return None
        return self._fernet.decrypt(value).decode("utf-8")
