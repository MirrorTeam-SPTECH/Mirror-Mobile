import secrets
from datetime import datetime, timedelta

from sqlalchemy.orm import Session

from app.domains.users.models import PasswordResetToken, User
from app.domains.users.services import hash_password


class UserRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, user_id: int) -> User | None:
        return self.db.query(User).filter(User.id == user_id).first()

    def get_by_email(self, email: str) -> User | None:
        return self.db.query(User).filter(User.email == email).first()

    def create(self, email: str, name: str, password: str, phone: str | None = None) -> User:
        user = User(
            email=email,
            name=name,
            phone=phone,
            hashed_password=hash_password(password),
        )
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)
        return user

    def get_or_create_google_user(self, email: str, name: str) -> User:
        user = self.get_by_email(email)
        if not user:
            user = User(
                email=email,
                name=name,
                hashed_password=hash_password(secrets.token_hex(32)),
            )
            self.db.add(user)
            self.db.commit()
            self.db.refresh(user)
        return user

    def update_password(self, user: User, new_password: str) -> None:
        user.hashed_password = hash_password(new_password)
        self.db.commit()

    # ── Reset token ──────────────────────────────────────────────────────────

    def create_reset_token(self, user_id: int, token: str) -> PasswordResetToken:
        self.db.query(PasswordResetToken).filter(
            PasswordResetToken.user_id == user_id,
            PasswordResetToken.used == False,
        ).update({"used": True})

        reset_token = PasswordResetToken(
            user_id=user_id,
            token=token,
            expires_at=datetime.utcnow() + timedelta(minutes=15),
        )
        self.db.add(reset_token)
        self.db.commit()
        self.db.refresh(reset_token)
        return reset_token

    def get_valid_reset_token(self, token: str) -> PasswordResetToken | None:
        return (
            self.db.query(PasswordResetToken)
            .filter(
                PasswordResetToken.token == token.upper(),
                PasswordResetToken.used == False,
                PasswordResetToken.expires_at > datetime.utcnow(),
            )
            .first()
        )

    def mark_token_used(self, token_obj: PasswordResetToken) -> None:
        token_obj.used = True
        self.db.commit()
