from typing import Any, Literal

from pydantic import field_validator, model_validator
from sqlmodel import SQLModel

ColumnKind = Literal["TIME", "DURATION", "SOURCE", "DESCRIPTION", "CUSTOM"]

BUILTIN_KINDS: tuple[ColumnKind, ...] = (
    "TIME",
    "DURATION",
    "SOURCE",
    "DESCRIPTION",
)

DEFAULT_COLUMNS: list[dict[str, Any]] = [
    {"kind": "TIME", "name": "Time"},
    {"kind": "DURATION", "name": "Duration"},
    {"kind": "SOURCE", "name": "Source"},
    {"kind": "DESCRIPTION", "name": "Description"},
]


class ProjectColumnItem(SQLModel):
    kind: ColumnKind
    name: str
    builtin: bool = False

    @field_validator("name")
    @classmethod
    def name_not_blank(cls, value: str) -> str:
        stripped = value.strip()
        if not stripped:
            raise ValueError("column name cannot be empty")
        return stripped

    @model_validator(mode="after")
    def derive_builtin(self) -> "ProjectColumnItem":
        self.builtin = self.kind in BUILTIN_KINDS
        return self


def validate_column_config(items: list[ProjectColumnItem]) -> None:
    """Enforce the spec 4.9 rule: builtins appear exactly once, in any order."""
    if not items:
        raise ValueError("at least one column is required")
    kinds = [item.kind for item in items]
    for builtin in BUILTIN_KINDS:
        if kinds.count(builtin) != 1:
            raise ValueError(f"column kind {builtin} must appear exactly once")
