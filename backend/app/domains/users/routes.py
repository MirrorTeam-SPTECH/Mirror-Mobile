from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.auth import get_current_user
from app.domains.users.models import User
from app.domains.users.schemas import UserCreate, LoginRequest, UserResponse, Token
from app.domains.users.repository import UserRepository
from app.domains.users.services import verify_password, create_access_token

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
