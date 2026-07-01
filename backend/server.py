from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

import os
import uuid
import logging
import bcrypt
import jwt
from datetime import datetime, timezone, timedelta
from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field
from typing import List, Optional

from seed_data import get_seed_opportunities

client = AsyncIOMotorClient(os.environ['MONGO_URL'])
db = client[os.environ['DB_NAME']]

app = FastAPI()
api = APIRouter(prefix="/api")

JWT_ALG = "HS256"
JWT_SECRET = os.environ['JWT_SECRET']

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


# ---------- Auth helpers ----------
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))


def create_token(user_id: str, email: str, role: str) -> str:
    payload = {"sub": user_id, "email": email, "role": role,
               "exp": datetime.now(timezone.utc) + timedelta(days=7), "type": "access"}
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALG)


async def get_current_user(request: Request) -> dict:
    token = None
    auth_header = request.headers.get("Authorization", "")
    if auth_header.startswith("Bearer "):
        token = auth_header[7:]
    if not token:
        token = request.cookies.get("access_token")
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALG])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")
    user = await db.users.find_one({"id": payload["sub"]}, {"_id": 0, "password_hash": 0})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user


async def get_optional_user(request: Request) -> Optional[dict]:
    try:
        return await get_current_user(request)
    except HTTPException:
        return None


async def require_admin(user: dict = Depends(get_current_user)) -> dict:
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return user


# ---------- Models ----------
class RegisterIn(BaseModel):
    name: str
    email: str
    password: str


class LoginIn(BaseModel):
    email: str
    password: str


class ProfileIn(BaseModel):
    name: str = ""
    city: str = ""
    state: str = ""
    country: str = "India"
    primary_discipline: str = ""
    secondary_disciplines: List[str] = []
    career_stage: str = ""
    student_status: str = ""
    age_range: str = ""
    portfolio_link: str = ""
    website_link: str = ""
    instagram_link: str = ""
    languages: List[str] = []
    keywords: List[str] = []
    preferred_types: List[str] = []
    willing_to_travel: bool = True
    online_only: bool = False
    application_experience: str = "Beginner"


class OpportunityIn(BaseModel):
    title: str
    organisation: str
    opportunity_type: str
    disciplines: List[str] = []
    location: str = ""
    online_available: bool = False
    funding_amount: str = ""
    deadline: str
    summary: str = ""
    description: str = ""
    eligibility: str = ""
    required_documents: List[str] = []
    application_fee: str = "None"
    difficulty: str = "Medium"
    career_stage: str = "Any"
    source_url: str = ""
    source_type: str = ""
    tags: List[str] = []
    verified: bool = False
    status: str = "published"


class SaveIn(BaseModel):
    opportunity_id: str


class SaveUpdate(BaseModel):
    status: Optional[str] = None
    notes: Optional[str] = None


class ImpactIn(BaseModel):
    hours_before: float = 0
    hours_after: float = 0
    opportunities_discovered: int = 0
    users_supported: int = 0
    deadlines_saved: int = 0


class DigestIn(BaseModel):
    discipline: str = ""
    opportunity_type: str = ""
    location: str = ""
    deadline_window: int = 30
    career_stage: str = ""
    limit: int = 8


# ---------- Deadline & match logic ----------
def deadline_info(opp: dict) -> dict:
    try:
        dl = datetime.strptime(opp["deadline"], "%Y-%m-%d").date()
        days = (dl - datetime.now(timezone.utc).date()).days
    except Exception:
        days = None
    if opp.get("status") == "closed" or (days is not None and days < 0):
        state = "closed"
    elif days is not None and days <= 7:
        state = "closing_soon"
    elif days is not None and days <= 30:
        state = "closing_month"
    else:
        state = "open"
    return {"days_left": days, "deadline_state": state}


DIFF_FIT = {
    "Beginner": {"Easy": 5, "Medium": 3, "Hard": 1},
    "Intermediate": {"Easy": 4, "Medium": 5, "Hard": 3},
    "Experienced": {"Easy": 3, "Medium": 4, "Hard": 5},
}


def compute_match(opp: dict, profile: dict) -> dict:
    score = 0
    reasons = []
    cautions = []

    prim = profile.get("primary_discipline", "")
    secs = profile.get("secondary_disciplines", [])
    disciplines = opp.get("disciplines", [])
    if prim and (prim in disciplines or "Multi-disciplinary" in disciplines):
        score += 25
        reasons.append(f"matches your discipline ({prim})")
    elif any(s in disciplines for s in secs):
        score += 15
        reasons.append("matches a secondary discipline")
    else:
        cautions.append("This opportunity is outside your listed disciplines.")

    loc = (opp.get("location") or "").lower()
    state = (profile.get("state") or "").lower()
    city = (profile.get("city") or "").lower()
    if opp.get("online_available") or "pan-india" in loc:
        score += 15
        reasons.append("open across India / available online")
    elif (state and state in loc) or (city and city in loc):
        score += 15
        reasons.append("based in your region")
    elif profile.get("willing_to_travel") and "india" not in loc:
        score += 8
        reasons.append("international, and you're willing to travel")
    elif profile.get("willing_to_travel"):
        score += 8
        reasons.append("reachable, and you're willing to travel")
    else:
        cautions.append("Location may require travel you haven't opted for.")

    stage = profile.get("career_stage", "")
    opp_stage = opp.get("career_stage", "Any")
    if opp_stage == "Any" or opp_stage == stage:
        score += 15
        if opp_stage != "Any":
            reasons.append(f"suitable for {stage.lower()} practitioners")
        else:
            reasons.append("open to all career stages")
    else:
        cautions.append(f"Aimed at {opp_stage.lower()} practitioners; you listed {stage.lower() or 'no stage'}.")

    if opp.get("opportunity_type") in profile.get("preferred_types", []):
        score += 15
        reasons.append(f"a {opp['opportunity_type'].lower()} — one of your preferred types")

    kws = set(k.lower().strip() for k in profile.get("keywords", []))
    tags = set(t.lower().strip() for t in opp.get("tags", []))
    overlap = kws & tags
    if len(overlap) >= 2:
        score += 15
        reasons.append("strongly matches your interests")
    elif len(overlap) == 1:
        score += 8
        reasons.append(f"matches your interest in {list(overlap)[0]}")

    di = deadline_info(opp)
    days = di["days_left"]
    if di["deadline_state"] == "closed":
        cautions.append("This opportunity has closed.")
    elif days is not None:
        if 7 < days <= 30:
            score += 10
            reasons.append(f"closes in {days} days")
        elif days > 30:
            score += 6
        else:
            score += 3
            reasons.append(f"closing soon — only {days} days left")

    exp = profile.get("application_experience", "Beginner")
    score += DIFF_FIT.get(exp, DIFF_FIT["Beginner"]).get(opp.get("difficulty", "Medium"), 3)

    score = min(score, 100)
    summary = f"{score}% match" + (" — " + ", ".join(reasons[:4]).capitalize() + "." if reasons else "")
    return {"match_score": score, "match_reasons": reasons, "match_cautions": cautions, "match_summary": summary}


def enrich(opp: dict, profile: Optional[dict] = None) -> dict:
    opp.pop("_id", None)
    opp.update(deadline_info(opp))
    if profile:
        opp.update(compute_match(opp, profile))
    return opp


async def get_profile_for(user: Optional[dict]) -> Optional[dict]:
    if not user:
        return None
    return await db.profiles.find_one({"user_id": user["id"]}, {"_id": 0})


# ---------- Auth routes ----------
@api.post("/auth/register")
async def register(body: RegisterIn):
    email = body.email.lower().strip()
    if len(body.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")
    if await db.users.find_one({"email": email}):
        raise HTTPException(status_code=400, detail="An account with this email already exists")
    user = {"id": str(uuid.uuid4()), "name": body.name.strip(), "email": email,
            "password_hash": hash_password(body.password), "role": "artist",
            "created_at": datetime.now(timezone.utc).isoformat()}
    await db.users.insert_one(dict(user))
    token = create_token(user["id"], email, "artist")
    user.pop("password_hash")
    user.pop("_id", None)
    return {"token": token, "user": user}


@api.post("/auth/login")
async def login(body: LoginIn):
    email = body.email.lower().strip()
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(body.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token = create_token(user["id"], email, user.get("role", "artist"))
    user.pop("password_hash")
    user.pop("_id", None)
    return {"token": token, "user": user}


@api.get("/auth/me")
async def me(user: dict = Depends(get_current_user)):
    return user


# ---------- Profile ----------
@api.get("/profile")
async def get_profile(user: dict = Depends(get_current_user)):
    profile = await db.profiles.find_one({"user_id": user["id"]}, {"_id": 0})
    return profile or {}


@api.put("/profile")
async def update_profile(body: ProfileIn, user: dict = Depends(get_current_user)):
    doc = body.model_dump()
    doc["user_id"] = user["id"]
    doc["email"] = user["email"]
    doc["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db.profiles.update_one({"user_id": user["id"]}, {"$set": doc}, upsert=True)
    return doc


# ---------- Opportunities (public) ----------
@api.get("/opportunities")
async def list_opportunities(
    search: str = "", discipline: str = "", opportunity_type: str = "",
    location: str = "", career_stage: str = "", deadline_status: str = "",
    difficulty: str = "", featured: bool = False, limit: int = 200,
    user: Optional[dict] = Depends(get_optional_user),
):
    q: dict = {"status": {"$in": ["published", "closed"]}}
    if discipline:
        q["disciplines"] = discipline
    if opportunity_type:
        q["opportunity_type"] = opportunity_type
    if location:
        q["location"] = {"$regex": location, "$options": "i"}
    if career_stage:
        q["career_stage"] = {"$in": [career_stage, "Any"]}
    if difficulty:
        q["difficulty"] = difficulty
    if featured:
        q["verified"] = True
    if search:
        rx = {"$regex": search, "$options": "i"}
        q["$or"] = [{"title": rx}, {"organisation": rx}, {"summary": rx}, {"tags": rx}, {"disciplines": rx}]

    docs = await db.opportunities.find(q, {"_id": 0}).to_list(500)
    profile = await get_profile_for(user)
    docs = [enrich(d, profile) for d in docs]

    if deadline_status:
        docs = [d for d in docs if d["deadline_state"] == deadline_status]

    def sort_key(d):
        closed = 1 if d["deadline_state"] == "closed" else 0
        return (closed, d["days_left"] if d["days_left"] is not None else 9999)
    docs.sort(key=sort_key)
    return docs[:limit]


@api.get("/opportunities/{opp_id}")
async def get_opportunity(opp_id: str, user: Optional[dict] = Depends(get_optional_user)):
    doc = await db.opportunities.find_one({"id": opp_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Opportunity not found")
    profile = await get_profile_for(user)
    doc = enrich(doc, profile)
    similar = await db.opportunities.find(
        {"id": {"$ne": opp_id}, "status": "published",
         "$or": [{"disciplines": {"$in": doc.get("disciplines", [])}},
                 {"opportunity_type": doc.get("opportunity_type")}]},
        {"_id": 0}).to_list(20)
    similar = [enrich(s) for s in similar if enrich(s)["deadline_state"] != "closed"][:3]
    doc["similar"] = similar
    return doc


# ---------- Saves / Tracker ----------
@api.post("/saves")
async def save_opportunity(body: SaveIn, user: dict = Depends(get_current_user)):
    opp = await db.opportunities.find_one({"id": body.opportunity_id})
    if not opp:
        raise HTTPException(status_code=404, detail="Opportunity not found")
    existing = await db.saves.find_one({"user_id": user["id"], "opportunity_id": body.opportunity_id}, {"_id": 0})
    if existing:
        return existing
    save = {"id": str(uuid.uuid4()), "user_id": user["id"], "opportunity_id": body.opportunity_id,
            "status": "interested", "notes": "",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()}
    await db.saves.insert_one(dict(save))
    save.pop("_id", None)
    return save


@api.delete("/saves/{opportunity_id}")
async def unsave(opportunity_id: str, user: dict = Depends(get_current_user)):
    await db.saves.delete_one({"user_id": user["id"], "opportunity_id": opportunity_id})
    return {"ok": True}


@api.get("/saves")
async def list_saves(user: dict = Depends(get_current_user)):
    saves = await db.saves.find({"user_id": user["id"]}, {"_id": 0}).to_list(500)
    opp_ids = [s["opportunity_id"] for s in saves]
    opps = await db.opportunities.find({"id": {"$in": opp_ids}}, {"_id": 0}).to_list(500)
    profile = await get_profile_for(user)
    opp_map = {o["id"]: enrich(o, profile) for o in opps}
    result = []
    for s in saves:
        if s["opportunity_id"] in opp_map:
            s["opportunity"] = opp_map[s["opportunity_id"]]
            result.append(s)
    result.sort(key=lambda s: s.get("updated_at", ""), reverse=True)
    return result


@api.patch("/saves/{save_id}")
async def update_save(save_id: str, body: SaveUpdate, user: dict = Depends(get_current_user)):
    updates = {k: v for k, v in body.model_dump().items() if v is not None}
    updates["updated_at"] = datetime.now(timezone.utc).isoformat()
    res = await db.saves.update_one({"id": save_id, "user_id": user["id"]}, {"$set": updates})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Saved item not found")
    return await db.saves.find_one({"id": save_id}, {"_id": 0})


# ---------- Admin: opportunities ----------
@api.get("/admin/opportunities")
async def admin_list(admin: dict = Depends(require_admin)):
    docs = await db.opportunities.find({}, {"_id": 0}).to_list(1000)
    docs = [enrich(d) for d in docs]
    docs.sort(key=lambda d: d.get("created_at", ""), reverse=True)
    return docs


@api.post("/admin/opportunities")
async def admin_create(body: OpportunityIn, admin: dict = Depends(require_admin)):
    doc = body.model_dump()
    doc["id"] = str(uuid.uuid4())
    doc["created_at"] = datetime.now(timezone.utc).isoformat()
    doc["updated_at"] = doc["created_at"]
    await db.opportunities.insert_one(dict(doc))
    return enrich(doc)


@api.put("/admin/opportunities/{opp_id}")
async def admin_update(opp_id: str, body: OpportunityIn, admin: dict = Depends(require_admin)):
    doc = body.model_dump()
    doc["updated_at"] = datetime.now(timezone.utc).isoformat()
    res = await db.opportunities.update_one({"id": opp_id}, {"$set": doc})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Opportunity not found")
    updated = await db.opportunities.find_one({"id": opp_id}, {"_id": 0})
    return enrich(updated)


@api.patch("/admin/opportunities/{opp_id}")
async def admin_patch(opp_id: str, body: dict, admin: dict = Depends(require_admin)):
    allowed = {k: v for k, v in body.items() if k in ("verified", "status")}
    if not allowed:
        raise HTTPException(status_code=400, detail="No valid fields")
    allowed["updated_at"] = datetime.now(timezone.utc).isoformat()
    res = await db.opportunities.update_one({"id": opp_id}, {"$set": allowed})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Opportunity not found")
    updated = await db.opportunities.find_one({"id": opp_id}, {"_id": 0})
    return enrich(updated)


@api.delete("/admin/opportunities/{opp_id}")
async def admin_delete(opp_id: str, admin: dict = Depends(require_admin)):
    await db.opportunities.delete_one({"id": opp_id})
    await db.saves.delete_many({"opportunity_id": opp_id})
    return {"ok": True}


@api.get("/admin/stats")
async def admin_stats(admin: dict = Depends(require_admin)):
    docs = await db.opportunities.find({}, {"_id": 0}).to_list(1000)
    docs = [enrich(d) for d in docs]
    open_docs = [d for d in docs if d["status"] == "published" and d["deadline_state"] != "closed"]
    by_disc: dict = {}
    by_type: dict = {}
    for d in docs:
        by_type[d["opportunity_type"]] = by_type.get(d["opportunity_type"], 0) + 1
        for disc in d.get("disciplines", []):
            by_disc[disc] = by_disc.get(disc, 0) + 1
    recent = sorted(docs, key=lambda d: d.get("created_at", ""), reverse=True)[:5]
    return {
        "total": len(docs),
        "open": len(open_docs),
        "verified": len([d for d in docs if d.get("verified")]),
        "closing_7_days": len([d for d in docs if d["deadline_state"] == "closing_soon"]),
        "by_discipline": sorted(by_disc.items(), key=lambda x: -x[1]),
        "by_type": sorted(by_type.items(), key=lambda x: -x[1]),
        "recent": recent,
    }


# ---------- Digest ----------
@api.post("/admin/digest")
async def generate_digest(body: DigestIn, admin: dict = Depends(require_admin)):
    q: dict = {"status": "published"}
    if body.discipline:
        q["disciplines"] = body.discipline
    if body.opportunity_type:
        q["opportunity_type"] = body.opportunity_type
    if body.location:
        q["location"] = {"$regex": body.location, "$options": "i"}
    if body.career_stage:
        q["career_stage"] = {"$in": [body.career_stage, "Any"]}
    docs = await db.opportunities.find(q, {"_id": 0}).to_list(500)
    docs = [enrich(d) for d in docs]
    docs = [d for d in docs if d["deadline_state"] != "closed" and
            (d["days_left"] is None or d["days_left"] <= body.deadline_window)]
    docs.sort(key=lambda d: d["days_left"] if d["days_left"] is not None else 9999)
    picks = docs[:max(1, min(body.limit, 10))]

    lines_wa, lines_em, lines_ig, lines_li = [], [], [], []
    for i, d in enumerate(picks, 1):
        dl = d["deadline"]
        days = f"({d['days_left']} days left)" if d["days_left"] is not None else ""
        lines_wa.append(f"{i}. *{d['title']}* — {d['organisation']}\n   {d['summary']}\n   Deadline: {dl} {days} | {d['funding_amount']}\n   Apply: {d['source_url']}")
        lines_em.append(f"{i}. {d['title']} — {d['organisation']}\n   {d['summary']}\n   Deadline: {dl} {days} | Benefit: {d['funding_amount']}\n   Link: {d['source_url']}")
        lines_ig.append(f"{i}. {d['title']} ({d['organisation']}) — deadline {dl}")
        lines_li.append(f"→ {d['title']} | {d['organisation']} | Deadline: {dl} | {d['funding_amount']}")

    whatsapp = "*This Week's Creative Opportunities* 🗓️\nvia Onanar — India's Opportunity Desk\n\n" + "\n\n".join(lines_wa) + "\n\nForward this to a creative friend."
    email = "Subject: This Week's Creative Opportunities — Onanar Digest\n\nHello,\n\nHere are this week's hand-picked opportunities for India's creative practitioners:\n\n" + "\n\n".join(lines_em) + "\n\nWarmly,\nTeam Onanar\nCreative opportunities, opened up."
    instagram = "This Week's Creative Opportunities ✨\n\n" + "\n".join(lines_ig) + "\n\nFull details + links on Onanar. Save this post & tag an artist who needs it.\n\n#OpenCall #ArtistOpportunities #IndianArtists #Grants #Residencies #CreativeIndia #Onanar"
    linkedin = "This Week's Creative Opportunities — curated by Onanar, India's Opportunity Desk for Creative Practitioners.\n\n" + "\n".join(lines_li) + "\n\nCreative opportunities in India are scattered across PDFs, posts and closed networks. Onanar centralises them. Share with a practitioner who should apply."

    await db.impact.update_one({"id": "main"}, {"$inc": {"digests_generated": 1}}, upsert=True)
    return {"opportunities": picks,
            "formats": {"whatsapp": whatsapp, "email": email, "instagram": instagram, "linkedin": linkedin}}


# ---------- Impact ----------
@api.get("/admin/impact")
async def get_impact(admin: dict = Depends(require_admin)):
    doc = await db.impact.find_one({"id": "main"}, {"_id": 0}) or {"id": "main"}
    total_opps = await db.opportunities.count_documents({})
    total_saves = await db.saves.count_documents({})
    total_users = await db.users.count_documents({"role": "artist"})
    hb = doc.get("hours_before", 0)
    ha = doc.get("hours_after", 0)
    doc.setdefault("hours_before", 0)
    doc.setdefault("hours_after", 0)
    doc.setdefault("opportunities_discovered", 0)
    doc.setdefault("users_supported", 0)
    doc.setdefault("deadlines_saved", 0)
    doc.setdefault("digests_generated", 0)
    doc["opportunities_added"] = total_opps
    doc["applications_tracked"] = total_saves
    doc["registered_artists"] = total_users
    doc["time_saved_per_week"] = max(0, hb - ha)
    doc["pct_reduction"] = round((hb - ha) / hb * 100, 1) if hb > 0 else 0
    return doc


@api.put("/admin/impact")
async def update_impact(body: ImpactIn, admin: dict = Depends(require_admin)):
    await db.impact.update_one({"id": "main"}, {"$set": body.model_dump()}, upsert=True)
    return await get_impact(admin)


@api.get("/")
async def root():
    return {"message": "Onanar API"}


app.include_router(api)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup():
    await db.users.create_index("email", unique=True)
    admin_email = os.environ.get("ADMIN_EMAIL", "admin@onanar.in")
    admin_password = os.environ.get("ADMIN_PASSWORD", "admin123")
    existing = await db.users.find_one({"email": admin_email})
    if existing is None:
        await db.users.insert_one({"id": str(uuid.uuid4()), "name": "Onanar Admin", "email": admin_email,
                                   "password_hash": hash_password(admin_password), "role": "admin",
                                   "created_at": datetime.now(timezone.utc).isoformat()})
    elif not verify_password(admin_password, existing["password_hash"]):
        await db.users.update_one({"email": admin_email}, {"$set": {"password_hash": hash_password(admin_password)}})
    if await db.opportunities.count_documents({}) == 0:
        await db.opportunities.insert_many(get_seed_opportunities())
        logger.info("Seeded opportunities")


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
