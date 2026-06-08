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
