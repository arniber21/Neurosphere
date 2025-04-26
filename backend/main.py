from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn, os

from routers import auth, scans, visualizations, users
from core.database import Database

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

@app.on_event("startup")
async def startup_db_client():
    # Get MongoDB Atlas connection string from environment variables
    mongo_username = os.getenv("MONGO_USERNAME")
    mongo_password = os.getenv("MONGO_PASSWORD")
    # Format the connection URI with credentials
    uri = f"mongodb+srv://{mongo_username}:{mongo_password}@cluster0.5pxx9.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
    # Connect using the updated pattern
    await Database.connect_to_mongo(uri)

@app.on_event("shutdown")
async def shutdown_db_client():
    # Close MongoDB connection when app shuts down
    await Database.close_mongo_connection()

@app.get("/")
async def root():
    return {"message": "Welcome to Neurosphere API"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
