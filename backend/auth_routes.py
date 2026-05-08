"""Auth endpoints: register, login, logout, me, refresh."""
import os
import jwt
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, HTTPException, Request, Response, Depends
from bson import ObjectId

from auth_utils import (
    hash_password, verify_password,
    create_access_token, create_refresh_token,
    set_auth_cookies, clear_auth_cookies,
    get_current_user, JWT_ALGORITHM, _secret,
)
from models import RegisterRequest, LoginRequest, UserOut

router = APIRouter(prefix="/auth", tags=["auth"])


def _user_to_out(user_doc: dict) -> dict:
    return {
        "id": str(user_doc["_id"]) if "_id" in user_doc else user_doc.get("id"),
        "email": user_doc["email"],
        "name": user_doc.get("name", ""),
        "role": user_doc.get("role", "user"),
        "created_at": user_doc.get("created_at"),
        "banned": user_doc.get("banned", False),
    }


async def _record_failed(db, identifier: str):
    now = datetime.now(timezone.utc)
    doc = await db.login_attempts.find_one({"identifier": identifier})
    if doc:
        fa = doc.get("first_attempt")
        if isinstance(fa, datetime) and fa.tzinfo is None:
            fa = fa.replace(tzinfo=timezone.utc)
        if fa and (now - fa).total_seconds() > 900:
            await db.login_attempts.delete_one({"identifier": identifier})
            doc = None
    if doc is None:
        await db.login_attempts.insert_one({"identifier": identifier, "count": 1, "first_attempt": now})
    else:
        await db.login_attempts.update_one({"identifier": identifier}, {"$inc": {"count": 1}})


async def _is_locked(db, identifier: str) -> bool:
    now = datetime.now(timezone.utc)
    doc = await db.login_attempts.find_one({"identifier": identifier})
    if not doc:
        return False
    fa = doc.get("first_attempt")
    if isinstance(fa, datetime) and fa.tzinfo is None:
        fa = fa.replace(tzinfo=timezone.utc)
    if fa and (now - fa).total_seconds() > 900:
        await db.login_attempts.delete_one({"identifier": identifier})
        return False
    return doc.get("count", 0) >= 5


async def _clear_attempts(db, identifier: str):
    await db.login_attempts.delete_one({"identifier": identifier})


@router.post("/register")
async def register(payload: RegisterRequest, response: Response):
    from server import db
    email = payload.email.lower().strip()
    existing = await db.users.find_one({"email": email})
    if existing:
        raise HTTPException(status_code=409, detail="Email already registered")
    doc = {
        "email": email,
        "password_hash": hash_password(payload.password),
        "name": payload.name.strip(),
        "role": "user",
        "banned": False,
        "created_at": datetime.now(timezone.utc),
        "health_profile": {},
    }
    result = await db.users.insert_one(doc)
    user_id = str(result.inserted_id)
    access = create_access_token(user_id, email, "user")
    refresh = create_refresh_token(user_id)
    set_auth_cookies(response, access, refresh)
    return {
        "user": _user_to_out({**doc, "_id": result.inserted_id}),
        "access_token": access,
    }


@router.post("/login")
async def login(payload: LoginRequest, request: Request, response: Response):
    from server import db
    email = payload.email.lower().strip()
    ip = request.client.host if request.client else "unknown"
    identifier = f"{ip}:{email}"

    if await _is_locked(db, identifier):
        raise HTTPException(status_code=429, detail="Too many failed attempts. Try again in 15 minutes.")

    user = await db.users.find_one({"email": email})
    if not user or not verify_password(payload.password, user["password_hash"]):
        await _record_failed(db, identifier)
        raise HTTPException(status_code=401, detail="Invalid email or password")
    if user.get("banned"):
        raise HTTPException(status_code=403, detail="Account banned")

    await _clear_attempts(db, identifier)
    user_id = str(user["_id"])
    access = create_access_token(user_id, email, user.get("role", "user"))
    refresh = create_refresh_token(user_id)
    set_auth_cookies(response, access, refresh)
    return {"user": _user_to_out(user), "access_token": access}


@router.post("/logout")
async def logout(response: Response):
    clear_auth_cookies(response)
    return {"ok": True}


@router.get("/me", response_model=UserOut)
async def me(user: dict = Depends(get_current_user)):
    return user


@router.post("/refresh")
async def refresh_token(request: Request, response: Response):
    from server import db
    token = request.cookies.get("refresh_token")
    if not token:
        raise HTTPException(status_code=401, detail="No refresh token")
    try:
        payload = jwt.decode(token, _secret(), algorithms=[JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Refresh expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid refresh")
    if payload.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Invalid token type")
    try:
        user = await db.users.find_one({"_id": ObjectId(payload["sub"])})
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid user")
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    access = create_access_token(str(user["_id"]), user["email"], user.get("role", "user"))
    new_refresh = create_refresh_token(str(user["_id"]))
    set_auth_cookies(response, access, new_refresh)
    return {"ok": True}
