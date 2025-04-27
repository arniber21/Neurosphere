# all fetching of people and data happens here
from fastapi import APIRouter
# from models.scans import Scan
# from models.users import NeurospherePerson
# from config.database import collection_name
# from schema.schemas import all_people
# from bson import ObjectID # how mongodb gets the id for each person

router = APIRouter()

@router.get("/")
async def test():
    return {"message": "meow"}