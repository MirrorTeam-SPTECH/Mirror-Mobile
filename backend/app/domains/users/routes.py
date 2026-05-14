import logging

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.database import get_db
from app.domains.users.email_service import send_reset_email
from app.domains.users.models import User
from app.domains.users.repository import UserRepository
from app.domains.users.schemas import (
    ForgotPasswordRequest,
    GoogleLoginRequest,
    LoginRequest,
    MessageResponse,
    ResetPasswordRequest,
    Token,
    UserCreate,
    UserResponse,
)
from app.domains.users.services import (
    create_access_token,
    generate_reset_code,
    verify_google_token,
    verify_password,
)

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/register", response_model=Token, status_code=201)
def register(data: UserCreate, db: Session = Depends(get_db)):
    repo = UserRepository(db)
    if repo.get_by_email(data.email):
        raise HTTPException(status_code=400, detail="E-mail já cadastrado")
    user = repo.create(
        email=data.email,
        name=data.name,
        password=data.password,
        phone=data.phone,
    )
    return Token(
        access_token=create_access_token(user.id),
        token_type="bearer",
        user=UserResponse.model_validate(user),
    )


@router.post("/login", response_model=Token)
def login(data: LoginRequest, db: Session = Depends(get_db)):
    repo = UserRepository(db)
    user = repo.get_by_email(data.email)
    if not user or not verify_password(data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="E-mail ou senha incorretos")
    return Token(
        access_token=create_access_token(user.id),
        token_type="bearer",
        user=UserResponse.model_validate(user),
    )


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user


@router.post("/forgot-password", response_model=MessageResponse)
async def forgot_password(data: ForgotPasswordRequest, db: Session = Depends(get_db)):
    from app.config import settings
    if not settings.SMTP_USER or settings.SMTP_USER == "seuemail@gmail.com":
        raise HTTPException(status_code=503, detail="Serviço de e-mail não configurado. Preencha SMTP_USER e SMTP_PASSWORD no backend/.env")

    _GENERIC_MSG = "Se esse e-mail estiver cadastrado, você receberá o código em breve."
    repo = UserRepository(db)
    user = repo.get_by_email(data.email)
    if not user:
        return MessageResponse(message=_GENERIC_MSG)

    code = generate_reset_code()
    repo.create_reset_token(user.id, code)

    try:
        await send_reset_email(data.email, user.name, code)
    except Exception as exc:
        logger.error("Erro ao enviar e-mail de reset: %s", exc)
        raise HTTPException(status_code=500, detail=f"Erro ao enviar e-mail: {exc}")

    return MessageResponse(message=_GENERIC_MSG)


@router.post("/reset-password", response_model=MessageResponse)
def reset_password(data: ResetPasswordRequest, db: Session = Depends(get_db)):
    repo = UserRepository(db)
    token_obj = repo.get_valid_reset_token(data.code)
    if not token_obj:
        raise HTTPException(status_code=400, detail="Código inválido ou expirado")

    user = repo.get_by_id(token_obj.user_id)
    repo.update_password(user, data.new_password)
    repo.mark_token_used(token_obj)

    return MessageResponse(message="Senha redefinida com sucesso")


@router.post("/google-login", response_model=Token)
async def google_login(data: GoogleLoginRequest, db: Session = Depends(get_db)):
    try:
        google_data = await verify_google_token(data.id_token)
    except ValueError as exc:
        raise HTTPException(status_code=401, detail=str(exc))

    email = google_data.get("email")
    if not email:
        raise HTTPException(status_code=400, detail="Token sem e-mail")

    name = google_data.get("name") or email.split("@")[0]
    repo = UserRepository(db)
    user = repo.get_or_create_google_user(email, name)

    return Token(
        access_token=create_access_token(user.id),
        token_type="bearer",
        user=UserResponse.model_validate(user),
    )
