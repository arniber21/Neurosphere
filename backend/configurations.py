from pymongo.mongo_client import MongoClient 
from pymongo.server_api import ServerAPI 

uri = f"mongodb+srv://{mongo_username}:{mongo_password}@cluster0.5pxx9.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"

client = MongoClient(uri, server_api=ServerAPI('1'))

db = client.Neurosphere
collection = db["neuro"]