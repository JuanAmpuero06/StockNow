from pydantic import BaseModel, EmailStr, Field
from typing import Optional

class UserBase(BaseModel):
    email: EmailStr

class UserCreate(UserBase):
    """Esquema para el registro: exige contraseña en texto plano"""
    password: str = Field(..., min_length=6, description="La contraseña debe tener al menos 6 caracteres")
    role: Optional[str] = "operator"

class UserResponse(UserBase):
    """Esquema de salida seguro: JAMÁS devuelve contraseñas o hashes"""
    id: int
    role: str
    is_active: bool

    class Config:
        from_attributes = True

class Token(BaseModel):
    """Esquema que se le devolverá al cliente cuando inicie sesión con éxito"""
    access_token: str
    token_type: str

class TokenData(BaseModel):
    """Esquema interno para validar el payload del JWT descodificado"""
    email: Optional[str] = None
