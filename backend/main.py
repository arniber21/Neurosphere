from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

from routers import auth, scans, visualizations, users

app = FastAPI(title="Neurosphere API", description="Backend API for Neurosphere CT scan processing and 3D model generation")

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, restrict to your frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(scans.router, prefix="/api/scans", tags=["CT Scan Management"])
app.include_router(visualizations.router, prefix="/api/visualizations", tags=["3D Visualization"])
app.include_router(users.router, prefix="/api/users", tags=["User Statistics"])

@app.get("/")
async def root():
    return {"message": "Welcome to Neurosphere API"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
