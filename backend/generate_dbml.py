"""
generate_dbml.py
~~~~~~~~~~~~~~~~
Introspects the live SQLAlchemy metadata (via SQLModel) and emits a DBML
file that can be pasted into https://dbdiagram.io.

Usage (from the backend/ directory):
    uv run python generate_dbml.py [--output PATH]

Default output: devtrackr.dbml (next to this script).
"""

from __future__ import annotations

import argparse
import os
import sys
from datetime import UTC, datetime
from typing import Any, cast

from sqlalchemy import ColumnDefault

# Make sure `app` is importable when run from backend/
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

# ── Import all models so their metadata is registered ────────────────────────
from sqlmodel import SQLModel

import app.models  # noqa: F401  (side-effect: populates SQLModel metadata)

# ── Helpers ──────────────────────────────────────────────────────────────────

# SQLAlchemy type → DBML type mapping
_SA_TYPE_MAP: dict[str, str] = {
    "VARCHAR": "varchar",
    "TEXT": "text",
    "CHAR": "char",
    "UUID": "uuid",
    "INTEGER": "integer",
    "BIGINT": "bigint",
    "SMALLINT": "smallint",
    "FLOAT": "float",
    "REAL": "real",
    "NUMERIC": "decimal",
    "DECIMAL": "decimal",
    "BOOLEAN": "boolean",
    "BOOL": "boolean",
    "DATE": "date",
    "DATETIME": "timestamptz",
    "TIMESTAMP": "timestamptz",
    "LARGEBINARY": "bytea",
    "BLOB": "bytea",
    "JSON": "json",
    "JSONB": "jsonb",
    "ARRAY": "text[]",
    # SQLModel internals
    "AUTOSTRING": "varchar",
    "AUTOINT": "integer",
}


def sa_type_to_dbml(col_type: Any) -> str:
    """Convert a SQLAlchemy column type to a DBML type string."""
    type_name = type(col_type).__name__.upper()

    # TypeDecorators (e.g. EncryptedString): resolve via their impl
    impl = getattr(col_type, "impl", None) or getattr(col_type, "impl_instance", None)
    if impl is not None and type_name not in _SA_TYPE_MAP:
        return sa_type_to_dbml(impl)

    # Handle timezone-aware datetimes
    if type_name == "DATETIME":
        tz = getattr(col_type, "timezone", False)
        return "timestamptz" if tz else "timestamp"

    # Handle VARCHAR/CHAR with length
    if type_name in ("VARCHAR", "CHAR") and getattr(col_type, "length", None):
        return f"varchar({col_type.length})"

    return _SA_TYPE_MAP.get(type_name, type_name.lower())


def collect_foreign_keys(metadata: Any) -> list[str]:
    """Return a flat list of DBML ref lines across all tables."""
    refs: list[str] = []
    seen: set[str] = set()

    for table in metadata.sorted_tables:
        for fk in table.foreign_keys:
            local_col = f"{table.name}.{fk.parent.name}"
            remote_col = f"{fk.column.table.name}.{fk.column.name}"
            ref = f"Ref: {local_col} > {remote_col}"
            if ref not in seen:
                seen.add(ref)
                refs.append(ref)

    return refs


# ── Main ─────────────────────────────────────────────────────────────────────


def generate_dbml(output_path: str) -> None:
    metadata = SQLModel.metadata
    tables = list(metadata.sorted_tables)

    lines: list[str] = []

    # Header
    lines += [
        "// DevTrackr Database Schema",
        f"// Auto-generated on {datetime.now(UTC).strftime('%Y-%m-%d %H:%M UTC')}",
        "// Source: backend/app/models",
        "// Paste at https://dbdiagram.io",
        "",
        "Project DevTrackr {",
        "  database_type: 'PostgreSQL'",
        "  Note: 'DevTrackr application database schema'",
        "}",
        "",
    ]

    # One Table block per SQLAlchemy table
    for table in tables:
        lines.append(f"Table {table.name} {{")

        pk_cols = {c.name for c in table.primary_key.columns}

        for col in table.columns:
            dbml_type = sa_type_to_dbml(col.type)
            attrs: list[str] = []

            if col.name in pk_cols:
                # pk columns: mark as pk with a uuid default expression
                attrs.append("pk")
                attrs.append("default: `gen_random_uuid()`")
            else:
                # Non-pk defaults
                if col.default is not None and col.default.is_scalar:
                    val = cast(ColumnDefault, col.default).arg
                    if isinstance(val, bool):
                        # DBML requires backtick-quoted expressions for booleans
                        attrs.append(f"default: `{str(val).lower()}`")
                    elif isinstance(val, str):
                        attrs.append(f"default: '{val}'")
                    else:
                        attrs.append(f"default: {val}")

                if not col.nullable:
                    attrs.append("not null")

            if col.unique:
                attrs.append("unique")

            # NOTE: refs are NOT added inline — inline `ref:` is invalid DBML.
            # All relationships are emitted as standalone Ref: lines below.

            attr_str = f" [{', '.join(attrs)}]" if attrs else ""
            lines.append(f"  {col.name:<25} {dbml_type:<15}{attr_str}")

        if table.comment:
            lines.append(f"  Note: '{table.comment}'")

        lines.append("}")
        lines.append("")

    # Standalone Ref: lines (the only valid way to declare FK refs in DBML)
    refs = collect_foreign_keys(metadata)
    if refs:
        lines.append("// ── Relationships ──────────────────────────────")
        lines.extend(refs)
        lines.append("")

    dbml_output = "\n".join(lines)

    with open(output_path, "w", encoding="utf-8") as f:
        f.write(dbml_output)

    abs_path = os.path.abspath(output_path)
    print(f"✅ DBML schema written to: {abs_path}")
    print(f"   Tables: {len(tables)}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Generate a DBML schema from SQLModel metadata."
    )
    parser.add_argument(
        "--output",
        "-o",
        default="devtrackr.dbml",
        help="Output file path (default: devtrackr.dbml)",
    )
    args = parser.parse_args()
    generate_dbml(args.output)
