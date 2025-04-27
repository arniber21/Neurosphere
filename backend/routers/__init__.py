# Neurosphere API routers package 
# routers/__init__.py

# Import each router so that we can do “from routers import auth, scans, visualizations, users”
from . import auth, scans, visualizations, users

# Re-export the shared dependency for protecting endpoints
from .auth import get_user_dependency

__all__ = [
    "auth",
    "scans",
    "visualizations",
    "users",
    "get_user_dependency",
]