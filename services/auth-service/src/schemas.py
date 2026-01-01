"""  
Pydantic Schemas for Authentication Service

These schemas define the data structures for:
- API requests (what data we receive from frontend)
- API responses (what data we send back to frontend)

Pydantic automatically validates the data and converts it to the right types.
"""

from pydantic import BaseModel, EmailStr


class UserCreate(BaseModel):
    """
    Schema for user registration request.
    
    When a user registers, the frontend sends this data.
    
    Fields:
        email: Valid email address (automatically validated by EmailStr)
        password: Plain text password (will be hashed before storing)
        full_name: User's full name (optional)
    
    Example:
        {
            "email": "user@example.com",
            "password": "securepassword123",
            "full_name": "John Doe"
        }
    """
    email: EmailStr  # Validates email format automatically
    password: str  # Plain password (never logged or stored as-is)
    full_name: str | None = None  # Optional field


class UserOut(BaseModel):
    """
    Schema for user information response.
    
    This is what we send back to frontend when returning user info.
    NOTE: Never include password or hashed_password in response!
    
    Fields:
        id: User's unique database ID
        email: User's email address
        full_name: User's full name (if provided)
    
    Example:
        {
            "id": 1,
            "email": "user@example.com",
            "full_name": "John Doe"
        }
    """
    id: int
    email: EmailStr
    full_name: str | None


class Token(BaseModel):
    """
    Schema for authentication token response.
    
    Returned after successful login. Frontend stores this token
    and sends it in Authorization header for authenticated requests.
    
    Fields:
        access_token: JWT token string (valid for 24 hours)
        token_type: Always "bearer" (standard OAuth2 format)
    
    Example:
        {
            "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
            "token_type": "bearer"
        }
    
    Frontend usage:
        Authorization: Bearer <access_token>
    """
    access_token: str
    token_type: str = "bearer"