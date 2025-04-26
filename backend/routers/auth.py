from fastapi import APIRouter, Header, HTTPException
from typing import Optional, Dict, Any

router = APIRouter()

@router.get("/validate")
async def validate_session(authorization: Optional[str] = Header(None)) -> Dict[str, Any]:
    """
    Validate user's authentication token.
    
    This endpoint verifies the Clerk session token and returns user information.
    """
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization header missing")
    
    # TODO: Implement Clerk SDK validation
    
    # Placeholder response for scaffolding
    return {
        "isAuthenticated": True,
        "userId": "user_123",
        "permissions": ["read:scans", "write:scans"]
    } 