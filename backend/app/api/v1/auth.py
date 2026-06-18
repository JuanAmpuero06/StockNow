from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import verify_password, create_access_token
from app.repositories.user import UserRepository
from app.schemas.user import UserCreate, UserResponse, Token

router = APIRouter(prefix="/auth", tags=["Authentication"])

def get_user_repository(db: Session = Depends(get_db)) -> UserRepository:
    return UserRepository(db)


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register_user(
    payload: UserCreate, 
    repo: UserRepository = Depends(get_user_repository)
):
    """
    Registra un nuevo operador o administrador en el sistema.
    """
    existing_user = repo.get_by_email(payload.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El correo electrónico ya está registrado."
        )
    return repo.create_user(payload)


@router.post("/login", response_model=Token)
def login_user(
    form_data: OAuth2PasswordRequestForm = Depends(),
    repo: UserRepository = Depends(get_user_repository)
):
    """
    Endpoint OAuth2. Verifica credenciales y otorga el token JWT de acceso.
    Nota: El formulario requiere el campo 'username' (aquí pasaremos el email).
    """
    user = repo.get_by_email(form_data.username)
    
    # Verificación de doble vía: que exista el usuario y que el hash coincida
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales incorrectas.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La cuenta de usuario está desactivada."
        )

    # El token llevará el email del usuario en el claim 'sub'
    access_token = create_access_token(subject=user.email)
    return {"access_token": access_token, "token_type": "bearer"}


from app.api.v1.deps import get_current_user
from app.models.domain import User
from app.core.security import create_access_token

@router.get("/me", response_model=UserResponse)
def read_users_me(current_user: User = Depends(get_current_user)):
    """
    Retorna los detalles del usuario autenticado actual.
    """
    return current_user

from typing import List
from pydantic import BaseModel
from app.api.v1.deps import RoleChecker

class RoleUpdatePayload(BaseModel):
    role: str

@router.get("/users", response_model=List[UserResponse])
def list_users(
    db: Session = Depends(get_db),
    current_user = Depends(RoleChecker(["admin"]))
):
    """
    Retorna la lista de todos los usuarios registrados en el sistema. (Solo Admin)
    """
    from app.models.domain import User as DBUser
    return db.query(DBUser).all()

@router.put("/users/{user_id}/role", response_model=UserResponse)
def update_user_role(
    user_id: int,
    payload: RoleUpdatePayload,
    db: Session = Depends(get_db),
    current_user = Depends(RoleChecker(["admin"]))
):
    """
    Modifica el rol de un usuario específico. (Solo Admin)
    """
    from app.models.domain import User as DBUser
    user = db.query(DBUser).filter(DBUser.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado.")
    
    if payload.role not in ["admin", "manager", "operator", "user"]:
        raise HTTPException(status_code=400, detail="Rol inválido. Debe ser 'admin', 'manager', 'operator' o 'user'.")
        
    user.role = payload.role
    db.commit()
    db.refresh(user)
    return user

@router.put("/users/{user_id}/toggle-active", response_model=UserResponse)
def toggle_user_active(
    user_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(RoleChecker(["admin"]))
):
    """
    Activa o desactiva la cuenta de un usuario. (Solo Admin)
    """
    from app.models.domain import User as DBUser
    user = db.query(DBUser).filter(DBUser.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado.")
        
    user.is_active = not user.is_active
    db.commit()
    db.refresh(user)
    return user
