import uuid

from sqlmodel import Field, SQLModel


class ProjectRepository(SQLModel, table=True):
    project_id: uuid.UUID = Field(
        primary_key=True, foreign_key="project.id", ondelete="CASCADE"
    )
    repository_id: uuid.UUID = Field(
        primary_key=True, foreign_key="repository.id", ondelete="CASCADE"
    )
