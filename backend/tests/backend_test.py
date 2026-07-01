"""Backend API tests for Onanar Opportunity Desk.
Covers auth, opportunities, saves, admin CRUD, digest, and impact.
"""
import os
import uuid
import pytest
import requests
from datetime import datetime, timedelta

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://opportunity-hub-217.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"

ADMIN_EMAIL = "admin@onanar.in"
ADMIN_PASSWORD = "admin123"
ARTIST_EMAIL = "artist@test.in"
ARTIST_PASSWORD = "artist123"


# --------- fixtures ---------
@pytest.fixture(scope="session")
def sess():
    return requests.Session()


@pytest.fixture(scope="session")
def admin_token(sess):
    r = sess.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    assert r.status_code == 200, f"admin login failed: {r.status_code} {r.text}"
    return r.json()["token"]


@pytest.fixture(scope="session")
def artist_token(sess):
    # Ensure artist exists (idempotent)
    sess.post(f"{API}/auth/register", json={"name": "Test Artist", "email": ARTIST_EMAIL, "password": ARTIST_PASSWORD})
    r = sess.post(f"{API}/auth/login", json={"email": ARTIST_EMAIL, "password": ARTIST_PASSWORD})
    assert r.status_code == 200, f"artist login failed: {r.status_code} {r.text}"
    return r.json()["token"]


def hdr(tok):
    return {"Authorization": f"Bearer {tok}"}


# --------- auth ---------
class TestAuth:
    def test_root(self, sess):
        r = sess.get(f"{API}/")
        assert r.status_code == 200
        assert r.json().get("message") == "Onanar API"

    def test_login_admin(self, sess):
        r = sess.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
        assert r.status_code == 200
        data = r.json()
        assert "token" in data and data["user"]["role"] == "admin"

    def test_login_invalid(self, sess):
        r = sess.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": "wrongpass"})
        assert r.status_code == 401

    def test_register_and_me(self, sess):
        email = f"TEST_signup_{uuid.uuid4().hex[:8]}@onanar.in"
        r = sess.post(f"{API}/auth/register", json={"name": "New User", "email": email, "password": "secret123"})
        assert r.status_code == 200, r.text
        tok = r.json()["token"]
        assert r.json()["user"]["role"] == "artist"
        me = sess.get(f"{API}/auth/me", headers=hdr(tok))
        assert me.status_code == 200
        assert me.json()["email"] == email.lower()

    def test_register_duplicate(self, sess):
        r = sess.post(f"{API}/auth/register", json={"name": "Dup", "email": ARTIST_EMAIL, "password": "artist123"})
        assert r.status_code == 400

    def test_register_short_password(self, sess):
        r = sess.post(f"{API}/auth/register", json={"name": "x", "email": f"TEST_x_{uuid.uuid4().hex[:6]}@x.in", "password": "ab"})
        assert r.status_code == 400

    def test_me_no_token(self, sess):
        # Use a cookie-less request: `sess` may carry the httpOnly auth cookie
        # from earlier logins in this session, which would mask a 401 here.
        r = requests.get(f"{API}/auth/me")
        assert r.status_code == 401


# --------- opportunities public ---------
class TestOpportunities:
    def test_list_all(self, sess):
        r = sess.get(f"{API}/opportunities")
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, list)
        assert len(data) >= 40, f"expected 40+ seeded opps, got {len(data)}"
        # check enrichment
        assert "deadline_state" in data[0]

    def test_search(self, sess):
        r = sess.get(f"{API}/opportunities", params={"search": "residency"})
        assert r.status_code == 200
        data = r.json()
        assert len(data) >= 1
        # 'residency' should appear somewhere
        joined = " ".join(str(d) for d in data).lower()
        assert "residenc" in joined

    def test_filter_deadline_status(self, sess):
        r = sess.get(f"{API}/opportunities", params={"deadline_status": "open"})
        assert r.status_code == 200
        for d in r.json():
            assert d["deadline_state"] == "open"

    def test_filter_discipline(self, sess):
        # get one opp with a discipline
        r = sess.get(f"{API}/opportunities")
        opps = r.json()
        disc = None
        for o in opps:
            if o.get("disciplines"):
                disc = o["disciplines"][0]
                break
        assert disc
        r2 = sess.get(f"{API}/opportunities", params={"discipline": disc})
        assert r2.status_code == 200
        for d in r2.json():
            assert disc in d.get("disciplines", [])

    def test_get_by_id_and_similar(self, sess):
        r = sess.get(f"{API}/opportunities")
        opp_id = r.json()[0]["id"]
        r2 = sess.get(f"{API}/opportunities/{opp_id}")
        assert r2.status_code == 200
        detail = r2.json()
        assert detail["id"] == opp_id
        assert "similar" in detail
        assert isinstance(detail["similar"], list)

    def test_get_not_found(self, sess):
        r = sess.get(f"{API}/opportunities/nonexistent-id-xyz")
        assert r.status_code == 404


# --------- profile & match ---------
class TestProfileAndMatch:
    def test_profile_upsert(self, sess, artist_token):
        payload = {
            "name": "Test Artist", "city": "Mumbai", "state": "Maharashtra",
            "primary_discipline": "Visual Arts", "career_stage": "Emerging",
            "keywords": ["painting", "sculpture"], "preferred_types": ["Grant", "Residency"],
            "application_experience": "Beginner", "willing_to_travel": True,
        }
        r = sess.put(f"{API}/profile", json=payload, headers=hdr(artist_token))
        assert r.status_code == 200
        r2 = sess.get(f"{API}/profile", headers=hdr(artist_token))
        assert r2.status_code == 200
        assert r2.json()["primary_discipline"] == "Visual Arts"

    def test_match_score_with_profile(self, sess, artist_token):
        r = sess.get(f"{API}/opportunities", headers=hdr(artist_token))
        assert r.status_code == 200
        data = r.json()
        # match_score should be present for at least some when logged in with profile
        has_score = any("match_score" in d for d in data)
        assert has_score, "expected match_score with logged in artist profile"

    def test_no_match_score_when_logged_out(self, sess):
        # Cookie-less request: `sess` may still carry an auth cookie from an
        # earlier login in this session.
        r = requests.get(f"{API}/opportunities")
        for d in r.json():
            assert "match_score" not in d


# --------- saves / tracker ---------
class TestSaves:
    def test_save_and_list_and_update_and_delete(self, sess, artist_token):
        opps = sess.get(f"{API}/opportunities").json()
        opp_id = opps[0]["id"]
        # clean prior save
        sess.delete(f"{API}/saves/{opp_id}", headers=hdr(artist_token))
        r = sess.post(f"{API}/saves", json={"opportunity_id": opp_id}, headers=hdr(artist_token))
        assert r.status_code == 200
        save = r.json()
        assert save["opportunity_id"] == opp_id
        assert save["status"] == "interested"
        save_id = save["id"]

        lst = sess.get(f"{API}/saves", headers=hdr(artist_token))
        assert lst.status_code == 200
        assert any(s["id"] == save_id for s in lst.json())

        upd = sess.patch(f"{API}/saves/{save_id}", json={"status": "applied", "notes": "TEST_note"}, headers=hdr(artist_token))
        assert upd.status_code == 200
        assert upd.json()["status"] == "applied"
        assert upd.json()["notes"] == "TEST_note"

        d = sess.delete(f"{API}/saves/{opp_id}", headers=hdr(artist_token))
        assert d.status_code == 200

    def test_save_requires_auth(self, sess):
        # Cookie-less request: `sess` may still carry an auth cookie from an
        # earlier login in this session.
        r = requests.post(f"{API}/saves", json={"opportunity_id": "any"})
        assert r.status_code == 401


# --------- admin ---------
class TestAdmin:
    def test_admin_stats(self, sess, admin_token):
        r = sess.get(f"{API}/admin/stats", headers=hdr(admin_token))
        assert r.status_code == 200
        data = r.json()
        assert data["total"] >= 40
        assert "open" in data and "verified" in data and "closing_7_days" in data
        assert isinstance(data["by_discipline"], list)

    def test_admin_forbidden_for_artist(self, sess, artist_token):
        r = sess.get(f"{API}/admin/stats", headers=hdr(artist_token))
        assert r.status_code == 403

    def test_admin_opportunity_crud(self, sess, admin_token):
        future = (datetime.utcnow() + timedelta(days=45)).strftime("%Y-%m-%d")
        payload = {
            "title": "TEST_Opportunity_" + uuid.uuid4().hex[:6],
            "organisation": "TEST_Org",
            "opportunity_type": "Grant",
            "disciplines": ["Visual Arts"],
            "location": "Pan-India",
            "deadline": future,
            "summary": "Test summary",
            "source_url": "https://example.com",
            "career_stage": "Any",
            "difficulty": "Medium",
            "tags": ["test"],
            "status": "published",
        }
        # create
        r = sess.post(f"{API}/admin/opportunities", json=payload, headers=hdr(admin_token))
        assert r.status_code == 200, r.text
        opp_id = r.json()["id"]

        # verify in directory
        listed = sess.get(f"{API}/opportunities").json()
        assert any(o["id"] == opp_id for o in listed)

        # patch verified
        p = sess.patch(f"{API}/admin/opportunities/{opp_id}", json={"verified": True}, headers=hdr(admin_token))
        assert p.status_code == 200
        assert p.json()["verified"] is True

        # patch status archived
        p2 = sess.patch(f"{API}/admin/opportunities/{opp_id}", json={"status": "archived"}, headers=hdr(admin_token))
        assert p2.status_code == 200

        # delete
        d = sess.delete(f"{API}/admin/opportunities/{opp_id}", headers=hdr(admin_token))
        assert d.status_code == 200

        # verify gone
        g = sess.get(f"{API}/opportunities/{opp_id}")
        assert g.status_code == 404

    def test_digest(self, sess, admin_token):
        r = sess.post(f"{API}/admin/digest", json={"deadline_window": 60, "limit": 5}, headers=hdr(admin_token))
        assert r.status_code == 200
        data = r.json()
        assert "opportunities" in data and "formats" in data
        for fmt in ("whatsapp", "email", "instagram", "linkedin"):
            assert fmt in data["formats"]
            assert len(data["formats"][fmt]) > 20

    def test_impact_get_and_update(self, sess, admin_token):
        r = sess.put(f"{API}/admin/impact", json={
            "hours_before": 10, "hours_after": 3,
            "opportunities_discovered": 20, "users_supported": 15, "deadlines_saved": 5,
        }, headers=hdr(admin_token))
        assert r.status_code == 200
        data = r.json()
        assert data["time_saved_per_week"] == 7
        assert data["pct_reduction"] == 70.0
        assert data["opportunities_added"] >= 40

    def test_admin_endpoints_require_auth(self, sess):
        # Cookie-less requests: `sess` may still carry an auth cookie from an
        # earlier login in this session.
        for path in ("/admin/stats", "/admin/opportunities"):
            r = requests.get(f"{API}{path}")
            assert r.status_code == 401
