from fastapi import FastAPI
from pymongo.mongo_client import MongoClient
import os

app = FastAPI()

# mongo_username = os.getenv("MONGO_USERNAME")
# mongo_password = os.getenv("MONGO_PASSWORD")

# Correctly format the URI with f-string
uri = f"mongodb+srv://{os.getenv("MONGO_USERNAME")}:{os.getenv("MONGO_PASSWORD")}@cluster0.5pxx9.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
client = MongoClient(uri)

# Send a ping to confirm a successful connection
try:
    client.admin.command('ping')
    print("Pinged your deployment. You successfully connected to MongoDB!")
except Exception as e:
    print(os.getenv("MONGO_USERNAME"))
    print(os.getenv("MONGO_PASSWORD"))

    print(e)

# Your API routes go here...


# @app.get("/")
# async def root():
#     return {"message": "Hello World"}

# @app.get("/users/{user_id}}")
# async def process_info(user_id):

#     # check if user is in database, if so, then return information from the database about the user
#     pass
#     # return {"item_id": item_id}

#     #     return {
#     #     "totalScans": 12,
#     #     "scansThisMonth": 2,
#     #     "tumorsDetected": 4,
#     #     "tumorPercentage": 33,
#     #     "lastScanDate": "2023-06-15T09:30:00Z",
#     #     "lastScanDaysAgo": 14
#     # } 

# @app.post("/upload/{user_id}")
# async def upload_data(user_id):
#     pass

# @app.get("/get_scans/{user_id}")
# async def get_scans(user_id):
#     pass