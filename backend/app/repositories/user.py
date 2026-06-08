from typing import Optional
from sqlalchemy.orm import Session
from app.models.domain import User
from app.schemas.user import UserCreate
from app.core.security import hash_password

class UserRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_email(self, email: str) -> Optional[User]:
        """Busca un usuario en la base de datos por su correo electrónico"""
        return self.db.query(User).filter(User.email == email).first()

    def create_user(self, obj_in: UserCreate) -> User:
        """Crea un usuario transformando la contraseña plana en un hash seguro"""
        db_user = User(
            email=obj_in.email,
            hashed_password=hash_password(obj_in.password),  # 🔐 Hashing aquí
            role=obj_in.role,
            is_active=True
        )
        self.db.add(db_user)
        self.db.commit()
        self.db.refresh(db_user)
        return db_user
