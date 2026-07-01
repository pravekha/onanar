import asyncio
import os
import re
import uuid
from datetime import datetime, timezone
from pathlib import Path

import openpyxl
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

load_dotenv(Path(__file__).parent / '.env')

XLSX = "/tmp/opps.xlsx"

TYPE_MAP = {"Mentorship": "Mentorship Programme"}
DATE_RX = re.compile(r"(\d{1,2}\s+[A-Za-z]{3,9}\s+\d{4})")


def parse_deadline(raw):
    raw = str(raw or "").strip()
    if not raw or raw.lower().startswith("opens"):
        return ""
    m = DATE_RX.search(raw)
    if not m:
        return ""
    for fmt in ("%d %b %Y", "%d %B %Y"):
        try:
            return datetime.strptime(m.group(1), fmt).strftime("%Y-%m-%d")
        except ValueError:
            continue
    return ""


def split_list(val):
    return [s.strip() for s in str(val or "").split(";") if s.strip()]


def build_rows():
    wb = openpyxl.load_workbook(XLSX)
    ws = wb["Opportunities"]
    rows = list(ws.iter_rows(values_only=True))
    cols = rows[0]
    now = datetime.now(timezone.utc).isoformat()
    docs = []
    for r in rows[1:]:
        if not r[0]:
            continue
        d = dict(zip(cols, r))
        types = split_list(d["Type"])
        otype = TYPE_MAP.get(types[0], types[0])
        extra_type_tags = [t.lower() for t in types[1:]]
        stage_raw = str(d["Career Stage"] or "").strip()
        career_stage = "Any" if stage_raw.lower() == "open to all" else stage_raw
        fee = str(d["Application Fee"] or "").strip()
        fee = "None" if fee.lower() == "free" else fee
        dl_status = str(d["Deadline Status (as of Jul 2026)"] or "").strip()
        deadline = parse_deadline(d["Deadline"])
        status = "closed" if dl_status.lower().startswith("closed") else "published"
        note_parts = [p for p in [str(d["Deadline"] or "").strip(), dl_status] if p]
        window = str(d["Typical Annual Window"] or "").strip()
        online = str(d["Online/Offline"] or "").strip().lower() in ("online", "both")
        eligibility = str(d["Eligibility"] or "").strip()
        funding = str(d["Funding / Benefit"] or "").strip()
        summary = f"{otype} — {funding}." if funding else f"{otype} by {d['Organisation']}."
        desc_bits = []
        if window:
            desc_bits.append(f"Typical annual window: {window}")
        if dl_status:
            desc_bits.append(f"Cycle status (as of Jul 2026): {dl_status}")
        docs.append({
            "id": str(uuid.uuid4()),
            "title": str(d["Title"]).strip(),
            "organisation": str(d["Organisation"] or "").strip(),
            "opportunity_type": otype,
            "disciplines": split_list(d["Disciplines"]),
            "location": str(d["Location"] or "").strip(),
            "online_available": online,
            "funding_amount": funding,
            "deadline": deadline,
            "deadline_note": " · ".join(note_parts),
            "summary": summary,
            "description": ". ".join(desc_bits) + ("." if desc_bits else ""),
            "eligibility": eligibility,
            "required_documents": split_list(d["Required Documents"]),
            "application_fee": fee,
            "difficulty": str(d["Difficulty"] or "Medium").strip(),
            "career_stage": career_stage,
            "source_url": str(d["Source URL"] or "").strip(),
            "source_type": str(d["Source Type"] or "").strip(),
            "tags": split_list(d["Tags"]) + extra_type_tags,
            "verified": True,
            "status": status,
            "created_at": now,
            "updated_at": now,
        })
    return docs


async def main():
    client = AsyncIOMotorClient(os.environ['MONGO_URL'])
    db = client[os.environ['DB_NAME']]
    docs = build_rows()
    await db.opportunities.delete_many({})
    await db.saves.delete_many({})
    await db.opportunities.insert_many(docs)
    dated = len([d for d in docs if d["deadline"]])
    closed = len([d for d in docs if d["status"] == "closed"])
    print(f"Imported {len(docs)} opportunities ({dated} with fixed deadlines, {closed} closed cycles)")


if __name__ == "__main__":
    asyncio.run(main())
