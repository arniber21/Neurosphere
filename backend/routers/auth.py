from fastapi import APIRouter, Header, HTTPException, Depends, Request
from typing import Optional, Dict, Any
from clerk_backend_api import Clerk, models
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

router = APIRouter()

# Create Clerk SDK client
clerk = Clerk(bearer_auth=os.getenv("CLERK_SECRET_KEY"))

# Dependency for getting the current active user
async def get_current_user(request: Request, authorization: Optional[str] = Header(None)):
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization header missing")
    
    # The authorization header should be in the format "Bearer {token}"
    # Remove "Bearer " prefix if present
    if authorization.startswith("Bearer "):
        token = authorization[7:]
    else:
        token = authorization
    
    try:
        # Authenticate the request using Clerk SDK
        auth_state = clerk.authenticate_request(token)
        
        if not auth_state.is_signed_in:
            raise HTTPException(status_code=401, detail="Not authenticated")
        
        # Get user details
        user = clerk.users.get(user_id=auth_state.user_id)
        
        return {
            "userId": auth_state.user_id,
            "email": user.email_addresses[0].email_address if user.email_addresses else None,
            "firstName": user.first_name,
            "lastName": user.last_name,
            "permissions": ["read:scans", "write:scans"]  # This can be customized based on user roles
        }
    except models.ClerkErrors as e:
        raise HTTPException(status_code=401, detail=f"Authentication error: {str(e)}")
    except models.SDKError as e:
        raise HTTPException(status_code=500, detail=f"SDK error: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e)}")

@router.get("/validate")
async def validate_session(user: Dict = Depends(get_current_user)) -> Dict[str, Any]:
    """
    Validate user's authentication token.
    This endpoint verifies the Clerk session token and returns user information.
    """
    return {
        "isAuthenticated": True,
        "userId": user["userId"],
        "email": user["email"],
        "firstName": user["firstName"],
        "lastName": user["lastName"],
        "permissions": user["permissions"]
    }

# Add this to be used as a dependency in other routers
def get_user_dependency():
    return get_current_user 