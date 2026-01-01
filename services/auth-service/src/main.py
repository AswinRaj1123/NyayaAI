"""  
NyayaAI Authentication Service

This service handles all user authentication and authorization:
- User registration (creating new accounts)
- User login (validating credentials and issuing JWT tokens)
- User verification (validating JWT tokens from other services)

Technology: FastAPI, SQLAlchemy, JWT tokens
"""

import sys
from pathlib import Path

from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

# ==============================================================================
# PATH SETUP
# ==============================================================================
# Ensure this service's source directory is first in the Python import path
# This allows Python to find our local modules (database, models, etc.)
SRC_DIR = Path(__file__).resolve().parent
if str(SRC_DIR) not in sys.path:
    sys.path.insert(0, str(SRC_DIR))

# ==============================================================================
# IMPORT LOCAL MODULES
# ==============================================================================
from database import Base, engine, get_db  # Database connection utilities
from dependencies import get_current_user  # JWT token validation
from models import User  # User database model
from schemas import Token, UserCreate, UserOut  # Request/Response data structures
from utils.auth import create_access_token, get_password_hash, verify_password  # Password & JWT utilities

# ==============================================================================
# DATABASE INITIALIZATION
# ==============================================================================
# Create database tables if they don't exist
# Note: In production, use Alembic migrations instead of this auto-create
Base.metadata.create_all(bind=engine)

# ==============================================================================
# FASTAPI APPLICATION SETUP
# ==============================================================================
app = FastAPI(
    title="NyayaAI Auth Service",
    description="Handles user registration, login, and token validation",
    version="1.0.0"
)

# ==============================================================================
# CORS CONFIGURATION
# ==============================================================================
# Cross-Origin Resource Sharing (CORS) allows the React frontend to call this API
# Allow requests from:
# - http://localhost:3000 (React development server)
# - http://127.0.0.1:3000 (alternative localhost address)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,  # Allow cookies and authorization headers
    allow_methods=["*"],  # Allow all HTTP methods (GET, POST, etc.)
    allow_headers=["*"],  # Allow all headers
)

# ==============================================================================
# API ENDPOINTS
# ==============================================================================

@app.post("/register", response_model=UserOut)
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    """
    Register a new user account.
    
    What this does:
    1. Checks if the email is already registered
    2. Hashes the password (never store plain passwords!)
    3. Creates a new user in the database
    4. Returns the user information (without password)
    
    Args:
        user_in: User data (email, password, full_name)
        db: Database session (automatically injected)
    
    Returns:
        UserOut: The newly created user information
        
    Raises:
        HTTPException 400: If email is already registered
    """
    # Step 1: Check if email already exists in database
    db_user = db.query(User).filter(User.email == user_in.email).first()
    if db_user:
        raise HTTPException(
            status_code=400, 
            detail="Email already registered"
        )
    
    # Step 2: Hash the password using bcrypt for security
    # Never store plain text passwords!
    hashed = get_password_hash(user_in.password)
    
    # Step 3: Create new user object
    new_user = User(
        email=user_in.email, 
        hashed_password=hashed, 
        full_name=user_in.full_name
    )
    
    # Step 4: Save to database
    db.add(new_user)  # Add to session
    db.commit()  # Save to database
    db.refresh(new_user)  # Get the updated object with ID
    
    return new_user

@app.post("/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """
    Authenticate a user and issue a JWT access token.
    
    What this does:
    1. Finds the user by email
    2. Verifies the password matches
    3. Creates a JWT token (valid for 24 hours)
    4. Returns the token for future authenticated requests
    
    Args:
        form_data: OAuth2 form with username (email) and password
        db: Database session (automatically injected)
    
    Returns:
        Token: JWT access token and token type
        
    Raises:
        HTTPException 401: If credentials are invalid
    """
    # Step 1: Find user by email (username field contains email)
    user = db.query(User).filter(User.email == form_data.username).first()
    
    # Step 2: Verify user exists and password is correct
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=401, 
            detail="Incorrect email or password"
        )
    
    # Step 3: Create JWT token containing the user's email
    # This token will be used to authenticate future requests
    access_token = create_access_token(data={"sub": user.email})
    
    # Step 4: Return token (frontend will store this and send in headers)
    return {"access_token": access_token, "token_type": "bearer"}


@app.get("/me", response_model=UserOut)
def read_users_me(current_user: User = Depends(get_current_user)):
    """
    Get current logged-in user information.
    
    This endpoint validates the JWT token and returns the user's information.
    Used by frontend to check if user is still logged in.
    
    Args:
        current_user: User object (extracted from JWT token)
    
    Returns:
        UserOut: Current user's information
    """
    return current_user


@app.get("/")
def root():
    """
    Health check endpoint.
    
    Returns:
        dict: Service status message
    """
    return {"message": "Auth Service Running - NyayaAI v1.0"}