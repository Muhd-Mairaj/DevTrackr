from sqlmodel import Field
from .base import BaseModel

class User(BaseModel, table=True):
    email: str = Field(index=True, unique=True, nullable=False)
    username: str
    hashed_password: str = Field(nullable=False)

