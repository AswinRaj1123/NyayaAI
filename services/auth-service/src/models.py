"""  
Database Models for Authentication Service

This file defines the structure of the 'users' table in the database.
Each User represents a registered account in the NyayaAI system.
"""

from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime

# Base class for all database models
Base = declarative_base()


class User(Base):
    """
    User Model - Represents a registered user in the system.
    
    This table stores user account information including:
    - Email (unique identifier for login)
    - Hashed password (never store plain passwords!)
    - Full name (optional)
    - Registration timestamp
    
    Table name: 'users'
    """
    __tablename__ = "users"
    
    # Primary key - unique ID for each user (auto-incremented)
    id = Column(Integer, primary_key=True, index=True)
    
    # Email address - must be unique and is used for login
    # indexed for faster lookups during login
    email = Column(String, unique=True, index=True, nullable=False)
    
    # Hashed password - stored using bcrypt hashing
    # NEVER store plain text passwords for security!
    hashed_password = Column(String, nullable=False)
    
    # User's full name (optional field)
    full_name = Column(String, nullable=True)
    
    # Timestamp when user registered
    # Automatically set to current UTC time when user is created
    created_at = Column(DateTime, default=datetime.utcnow)