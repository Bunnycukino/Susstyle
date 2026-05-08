"""Health profile endpoints."""
from fastapi import APIRouter, Depends
from bson import ObjectId

from auth_utils import get_current_user
from models import HealthProfile

router = APIRouter(prefix="/profile", tags=["profile"])


@router.get("/health")
async def get_health_profile(user: dict = Depends(get_current_user)):
    from server import db
    doc = await db.users.find_one({"_id": ObjectId(user["id"])}, {"_id": 0, "health_profile": 1})
    return doc.get("health_profile") if doc else {}


@router.put("/health")
async def update_health_profile(profile: HealthProfile, user: dict = Depends(get_current_user)):
    from server import db
    await db.users.update_one(
        {"_id": ObjectId(user["id"])},
        {"$set": {"health_profile": profile.model_dump()}},
    )
    return {"ok": True, "profile": profile.model_dump()}
