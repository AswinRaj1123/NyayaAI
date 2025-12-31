import importlib.util
import sys
from pathlib import Path

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session

BASE_DIR = Path(__file__).resolve().parents[1]
AUTH_SERVICE_SRC = BASE_DIR / "services" / "auth-service" / "src"

def _import_from_path(name: str, file_path: Path):
    spec = importlib.util.spec_from_file_location(name, file_path)
    if spec is None or spec.loader is None:
        raise ImportError(f"Cannot load {name} from {file_path}")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    sys.modules[name] = module
    return module

auth_models = _import_from_path(
    "auth_service_models", AUTH_SERVICE_SRC / "models.py"
)
auth_database = _import_from_path(
    "auth_service_database", AUTH_SERVICE_SRC / "database.py"
)

get_db = auth_database.get_db  # type: ignore
User = auth_models.User  # type: ignore

SECRET_KEY = "your-super-secret-key-change-in-prod"  # Later move to .env
ALGORITHM = "HS256"

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="http://localhost:8000/login")

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise HTTPException(status_code=401, detail="Invalid token")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user