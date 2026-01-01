"""  
Authentication Utilities

This module provides core authentication functionality:
1. Password hashing (converting passwords to secure hashes)
2. Password verification (checking if password matches hash)
3. JWT token creation (creating tokens for logged-in users)

Security Note: Never store plain text passwords!
"""

from datetime import datetime, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext

# ==============================================================================
# CONFIGURATION
# ==============================================================================
# IMPORTANT: In production, move this to environment variables!
SECRET_KEY = "your-super-secret-key-change-in-prod"  # Used to sign JWT tokens
ALGORITHM = "HS256"  # Hashing algorithm for JWT
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # Token valid for 24 hours

# Password hashing context using bcrypt algorithm
# bcrypt is slow by design to make brute-force attacks harder
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


# ==============================================================================
# PASSWORD FUNCTIONS
# ==============================================================================

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Check if a plain text password matches a hashed password.
    
    This is used during login to verify if the user entered the correct password.
    
    Args:
        plain_password: The password user entered (plain text)
        hashed_password: The bcrypt hash stored in database
    
    Returns:
        bool: True if password matches, False otherwise
    
    Example:
        >>> hashed = get_password_hash("mypassword")
        >>> verify_password("mypassword", hashed)
        True
        >>> verify_password("wrongpassword", hashed)
        False
    """
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """
    Convert a plain text password into a secure bcrypt hash.
    
    This is used during registration to store passwords securely.
    Each time you call this, you get a different hash (includes random salt).
    
    Args:
        password: Plain text password to hash
    
    Returns:
        str: Bcrypt hash string (safe to store in database)
    
    Example:
        >>> hash1 = get_password_hash("mypassword")
        >>> hash2 = get_password_hash("mypassword")
        >>> hash1 != hash2  # Different hashes due to random salt
        True
        >>> verify_password("mypassword", hash1)  # But both verify
        True
    """
    return pwd_context.hash(password)


# ==============================================================================
# JWT TOKEN FUNCTIONS
# ==============================================================================

def create_access_token(data: dict) -> str:
    """
    Create a JWT (JSON Web Token) for authenticated sessions.
    
    The token contains user information and an expiration time.
    Frontend stores this token and sends it with every request.
    
    Args:
        data: Dictionary containing user info (usually {"sub": email})
              "sub" stands for "subject" in JWT terminology
    
    Returns:
        str: Encoded JWT token string
    
    Example:
        >>> token = create_access_token({"sub": "user@example.com"})
        >>> # Token looks like: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
        >>> # Frontend uses it as: Authorization: Bearer <token>
    
    How it works:
    1. Copies the input data
    2. Adds an expiration timestamp (24 hours from now)
    3. Encodes everything using SECRET_KEY
    4. Returns the token string
    """
    # Make a copy of data to avoid modifying the original
    to_encode = data.copy()
    
    # Calculate expiration time (current time + 24 hours)
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    # Add expiration to the token data
    to_encode.update({"exp": expire})
    
    # Encode and sign the token using our secret key
    # Only our server can create valid tokens (because only we know SECRET_KEY)
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)