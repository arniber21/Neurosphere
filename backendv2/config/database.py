from pymongo import MongoClient
import os

uri = "mongodb+srv://{mongo_username}:{mongo_password}@cluster0.5pxx9.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
client = MongoClient(uri)

db = client.Neurosphere
collection_name = db.neuro
