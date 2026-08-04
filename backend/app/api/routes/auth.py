import uuid

from fastapi import (
    APIRouter,
    Cookie,
    Depends,
    HTTPException,
    Request,
    Response,
    status,
)
from sqlalchemy.exc import IntegrityError
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.api.deps import CurrentUser
from app.api.responses import error_responses
from app.core.security import (
    ACCESS_TOKEN_COOKIE_NAME,
    REFRESH_TOKEN_COOKIE_NAME,
    create_access_token,
    decode_token,
    hash_password,
    hash_token,
    set_auth_cookies,
    verify_password,
)
from app.crud.auth import (
    create_session,
    get_session_by_id,
    revoke_session,
)
from app.db.session import get_db
from app.models.user import AuthResponse, User, UserCreate, UserLogin, UserPublic

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post(
    "/register",
    response_model=AuthResponse,
    status_code=status.HTTP_201_CREATED,
    responses=error_responses(status.HTTP_409_CONFLICT),
)
async def register(
    body: UserCreate,
    request: Request,
    response: Response,
    session: AsyncSession = Depends(get_db),
) -> AuthResponse:
    # Check if email is already taken
    result = await session.exec(select(User).where(User.email == body.email))
    if result.first():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A user with this email already exists",
        )

    user = User(
        email=body.email,
        username=body.username,
        hashed_password=hash_password(body.password),
    )
    session.add(user)
    try:
        await session.commit()
    except IntegrityError:
        await session.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A user with this email already exists",
        )
    await session.refresh(user)

    refresh_token = await create_session(
        session=session,
        user_id=user.id,
        device_name=request.headers.get("user-agent"),
    )

    access_token = create_access_token(user.id)
    set_auth_cookies(response, access_token, refresh_token)

    return AuthResponse(user=UserPublic.model_validate(user))


@router.post(
    "/login",
    response_model=AuthResponse,
    responses=error_responses(status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN),
)
async def login(
    body: UserLogin,
    request: Request,
    response: Response,
    session: AsyncSession = Depends(get_db),
) -> AuthResponse:
    result = await session.exec(select(User).where(User.email == body.email))
    user = result.first()

    if (
        user is None
        or user.hashed_password is None
        or not verify_password(body.password, user.hashed_password)
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is inactive",
        )

    # Create a stateful DB session
    refresh_token = await create_session(
        session=session,
        user_id=user.id,
        device_name=request.headers.get("user-agent"),
    )

    access_token = create_access_token(user.id)
    set_auth_cookies(response, access_token, refresh_token)

    return AuthResponse(user=UserPublic.model_validate(user))


@router.post(
    "/refresh",
    response_model=AuthResponse,
    responses=error_responses(status.HTTP_401_UNAUTHORIZED),
)
async def refresh(
    response: Response,
    session: AsyncSession = Depends(get_db),
    refresh_token: str | None = Cookie(alias=REFRESH_TOKEN_COOKIE_NAME, default=None),
) -> AuthResponse:
    if not refresh_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Refresh token missing"
        )

    try:
        # Decodes the JWT, which contains the session_id as 'sub'
        payload = decode_token(refresh_token)
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Invalid token type")

        session_id = uuid.UUID(payload["sub"])
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid session token")

    # Look up the session in the database
    db_session = await get_session_by_id(session=session, id=session_id)

    if not db_session or not db_session.is_valid:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session revoked or expired",
        )

    if db_session.token_hash != hash_token(refresh_token):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid session token"
        )

    user = await session.get(User, db_session.user_id)
    if not user:
        raise HTTPException(
            status_code=401, detail="User associated with session not found"
        )

    new_access_token = create_access_token(user.id)
    set_auth_cookies(response, new_access_token)

    return AuthResponse(user=UserPublic.model_validate(user))


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(
    response: Response,
    session: AsyncSession = Depends(get_db),
    refresh_token: str | None = Cookie(alias=REFRESH_TOKEN_COOKIE_NAME, default=None),
) -> None:
    if refresh_token:
        try:
            payload = decode_token(refresh_token)
            session_id = uuid.UUID(payload["sub"])
            db_session = await get_session_by_id(session=session, id=session_id)
            if db_session:
                await revoke_session(session=session, db_session=db_session)
        except Exception:
            pass  # Fail silently on logout if token is already mangled

    response.delete_cookie(key=ACCESS_TOKEN_COOKIE_NAME)
    response.delete_cookie(key=REFRESH_TOKEN_COOKIE_NAME)


@router.get(
    "/me",
    response_model=UserPublic,
    responses=error_responses(status.HTTP_401_UNAUTHORIZED),
)
async def me(user: CurrentUser) -> UserPublic:
    return UserPublic.model_validate(user)
