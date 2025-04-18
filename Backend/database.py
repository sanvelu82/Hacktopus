from motor.motor_asyncio import AsyncIOMotorClient

MONGO_URI = "mongodb://localhost:27017"
DB_NAME = "faculty_recruitment"

client = AsyncIOMotorClient(MONGO_URI)
database = client[DB_NAME]
candidates_collection = database["candidates"]
