from motor.motor_asyncio import AsyncIOMotorClient
from pymongo.server_api import ServerApi

class Database:
    client = None
    db = None
    
    @classmethod
    async def connect_to_mongo(cls, mongo_url):
        """
        Establishes connection to MongoDB using the provided connection URL
        """
        cls.client = AsyncIOMotorClient(mongo_url, server_api=ServerApi('1'))
        cls.db = cls.client.scan_database  # Name of your database
        
        try:
            # Verify connection by pinging the database
            await cls.client.admin.command('ping')
            print("Pinged your deployment. You successfully connected to MongoDB!")
            return True
        except Exception as e:
            print(f"Failed to connect to MongoDB: {e}")
            return False
    
    @classmethod
    async def close_mongo_connection(cls):
        """
        Closes the MongoDB connection
        """
        if cls.client:
            cls.client.close()
            print("MongoDB connection closed")
    
    @classmethod
    def get_database(cls):
        """
        Returns the database instance
        """
        return cls.db