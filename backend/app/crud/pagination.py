from sqlmodel import func, select
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlmodel.sql.expression import SelectOfScalar

from app.models.base import PaginatedResponse


async def fetch_page[T](
    *, session: AsyncSession, statement: SelectOfScalar[T], skip: int, limit: int
) -> PaginatedResponse[T]:
    """Run a count over the statement plus the offset/limit select."""
    count_result = await session.exec(
        select(func.count()).select_from(statement.subquery())
    )
    total = count_result.one()
    page_result = await session.exec(statement.offset(skip).limit(limit))
    return PaginatedResponse[T](
        items=list(page_result.all()), total=total, skip=skip, limit=limit
    )
