import uuid
from collections.abc import Sequence

from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.models.commit import Commit, CommitCreate


async def create_commit(
    *, session: AsyncSession, commit_in: CommitCreate, repository_id: uuid.UUID
) -> Commit:
    db_obj = Commit.model_validate(commit_in, update={"repository_id": repository_id})
    session.add(db_obj)
    await session.commit()
    await session.refresh(db_obj)
    return db_obj


async def create_commits_bulk(
    *, session: AsyncSession, commits_in: list[CommitCreate], repository_id: uuid.UUID
) -> list[Commit]:
    db_objs = [
        Commit.model_validate(c, update={"repository_id": repository_id})
        for c in commits_in
    ]
    session.add_all(db_objs)
    await session.commit()
    return db_objs


async def get_commit(*, session: AsyncSession, id: uuid.UUID) -> Commit | None:
    return await session.get(Commit, id)


async def get_commits_by_repo(
    *, session: AsyncSession, repository_id: uuid.UUID, skip: int = 0, limit: int = 100
) -> Sequence[Commit]:
    statement = (
        select(Commit)
        .where(Commit.repository_id == repository_id)
        .offset(skip)
        .limit(limit)
    )
    result = await session.exec(statement)
    return result.all()


async def get_commit_by_sha(
    *, session: AsyncSession, repository_id: uuid.UUID, sha: str
) -> Commit | None:
    statement = select(Commit).where(
        Commit.repository_id == repository_id, Commit.sha == sha
    )
    result = await session.exec(statement)
    return result.first()
