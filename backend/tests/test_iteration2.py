"""Iteration 2 specific tests: recurring deadlines, real Excel data, deadline_note,
career stage substring matching, and admin create with empty deadline.
"""
import os
import uuid
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://opportunity-hub-217.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"

ADMIN_EMAIL = "admin@onanar.in"
ADMIN_PASSWORD = "admin123"
ARTIST_EMAIL = "artist@test.in"
ARTIST_PASSWORD = "artist123"


@pytest.fixture(scope="module")
def sess():
    return requests.Session()


@pytest.fixture(scope="module")
def admin_token(sess):
    r = sess.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    assert r.status_code == 200, r.text
    return r.json()["token"]


@pytest.fixture(scope="module")
def artist_token(sess):
    # ensure artist exists
    sess.post(f"{API}/auth/register", json={"name": "Test Artist", "email": ARTIST_EMAIL, "password": ARTIST_PASSWORD})
    r = sess.post(f"{API}/auth/login", json={"email": ARTIST_EMAIL, "password": ARTIST_PASSWORD})
    assert r.status_code == 200, r.text
    return r.json()["token"]


def hdr(t):
    return {"Authorization": f"Bearer {t}"}


class TestRealDataCounts:
    """Verify import produced 71 opportunities with expected deadline_state buckets."""

    def test_total_count_71(self, sess):
        r = sess.get(f"{API}/opportunities", params={"limit": 500})
        assert r.status_code == 200
        data = r.json()
        # 71 = 58 rolling + 1 fixed-date open + 12 closed
        assert len(data) == 71, f"expected 71 opportunities, got {len(data)}"

    def test_rolling_count_58(self, sess):
        r = sess.get(f"{API}/opportunities", params={"deadline_status": "rolling", "limit": 500})
        assert r.status_code == 200
        data = r.json()
        assert len(data) == 58, f"expected 58 rolling, got {len(data)}"
        for d in data:
            assert d["deadline_state"] == "rolling"
            assert d.get("days_left") is None
            # rolling records should have deadline empty
            assert not d.get("deadline")

    def test_closed_count_12(self, sess):
        r = sess.get(f"{API}/opportunities", params={"deadline_status": "closed", "limit": 500})
        assert r.status_code == 200
        assert len(r.json()) == 12

    def test_open_dated_count_1(self, sess):
        # Per review request 'Closing in 30 days' filter (closing_month) shows 1 dated opp
        r = sess.get(f"{API}/opportunities", params={"deadline_status": "closing_month", "limit": 500})
        assert r.status_code == 200
        data = r.json()
        assert len(data) == 1, f"expected 1 closing_month, got {len(data)}"
        one = data[0]
        assert one.get("deadline") == "2026-07-31"
        assert "IFA" in one.get("title", "") or "Arts Education" in one.get("title", "")

    def test_deadline_note_present_on_rolling(self, sess):
        r = sess.get(f"{API}/opportunities", params={"deadline_status": "rolling", "limit": 500})
        data = r.json()
        with_note = [d for d in data if (d.get("deadline_note") or "").strip()]
        assert len(with_note) >= 1, "expected at least some rolling items to have deadline_note text"

    def test_sort_order(self, sess):
        """Dated open (days_left ascending), then rolling, then closed."""
        r = sess.get(f"{API}/opportunities", params={"limit": 500})
        data = r.json()
        # Compute group buckets and verify monotonic
        def grp(d):
            if d["deadline_state"] == "closed":
                return 2
            if d.get("days_left") is None:
                return 1
            return 0
        groups = [grp(d) for d in data]
        assert groups == sorted(groups), "opportunities not sorted by (dated, rolling, closed)"


class TestOpportunityDetailRecurring:
    def test_rolling_detail_has_no_deadline(self, sess):
        r = sess.get(f"{API}/opportunities", params={"deadline_status": "rolling", "limit": 5})
        assert r.status_code == 200
        opp_id = r.json()[0]["id"]
        detail = sess.get(f"{API}/opportunities/{opp_id}").json()
        assert detail["deadline_state"] == "rolling"
        assert detail.get("days_left") is None
        # deadline may be empty string
        assert not detail.get("deadline")
        assert "deadline_note" in detail

    def test_ifa_dated_detail(self, sess):
        r = sess.get(f"{API}/opportunities", params={"deadline_status": "closing_month", "limit": 500})
        opp = r.json()[0]
        detail = sess.get(f"{API}/opportunities/{opp['id']}").json()
        assert detail["deadline"] == "2026-07-31"
        assert detail["deadline_state"] in ("open", "closing_month")


class TestCareerStageSubstringMatch:
    def test_filter_emerging_matches_multi_value(self, sess):
        # server regex: (Emerging|Any|Open to all)
        r = sess.get(f"{API}/opportunities", params={"career_stage": "Emerging", "limit": 500})
        assert r.status_code == 200
        data = r.json()
        assert len(data) >= 1
        for d in data:
            cs = (d.get("career_stage") or "").lower()
            assert ("emerging" in cs) or ("any" in cs) or ("open to all" in cs), \
                f"career_stage '{d.get('career_stage')}' should match Emerging|Any|Open to all"

    def test_match_score_emerging_matches_multi_value(self, sess, artist_token):
        # Set up profile with Emerging career stage
        payload = {
            "name": "Test Artist", "city": "Mumbai", "state": "Maharashtra",
            "primary_discipline": "Visual Arts", "career_stage": "Emerging",
            "keywords": ["painting"], "preferred_types": ["Grant"],
            "application_experience": "Beginner", "willing_to_travel": True,
        }
        p = sess.put(f"{API}/profile", json=payload, headers=hdr(artist_token))
        assert p.status_code == 200

        r = sess.get(f"{API}/opportunities", headers=hdr(artist_token), params={"limit": 500})
        data = r.json()
        # Find any opp with multi-value career_stage like "Emerging; Mid-career"
        multi = [d for d in data if ";" in (d.get("career_stage") or "")]
        if multi:
            # At least one such opp should have match_reasons mentioning emerging OR score >0
            found_stage_reason = False
            for d in multi:
                if d.get("career_stage", "").lower().startswith("emerging") or "emerging" in d.get("career_stage", "").lower():
                    reasons = " ".join(d.get("match_reasons", [])).lower()
                    if "emerging" in reasons or "suitable" in reasons:
                        found_stage_reason = True
                        break
            assert found_stage_reason, "expected match_reasons to include career-stage suitability for multi-value stage"

        # Also check rolling opportunity gets the specific reason
        rolling_with_score = [d for d in data if d.get("deadline_state") == "rolling" and "match_reasons" in d]
        assert rolling_with_score, "expected rolling opps to have match_reasons when logged in"
        found_recurring_reason = any(
            "recurring cycle" in " ".join(d.get("match_reasons", [])).lower()
            for d in rolling_with_score
        )
        assert found_recurring_reason, "expected 'recurring cycle — verify the current window' reason for rolling opps"


class TestAdminCreateEmptyDeadline:
    def test_create_no_deadline_yields_rolling(self, sess, admin_token):
        payload = {
            "title": "TEST_Recurring_" + uuid.uuid4().hex[:6],
            "organisation": "TEST_Org",
            "opportunity_type": "Grant",
            "disciplines": ["Visual Arts"],
            "location": "Pan-India",
            "deadline": "",
            "deadline_note": "Rolling cycle — opens quarterly",
            "summary": "TEST rolling",
            "source_url": "https://example.com",
            "career_stage": "Any",
            "difficulty": "Medium",
            "status": "published",
        }
        r = sess.post(f"{API}/admin/opportunities", json=payload, headers=hdr(admin_token))
        assert r.status_code == 200, r.text
        created = r.json()
        assert created["deadline_state"] == "rolling"
        assert created["days_left"] is None
        assert created["deadline_note"] == "Rolling cycle — opens quarterly"

        # Verify via public GET
        opp_id = created["id"]
        g = sess.get(f"{API}/opportunities/{opp_id}").json()
        assert g["deadline_state"] == "rolling"
        assert g["deadline_note"] == "Rolling cycle — opens quarterly"

        # cleanup
        d = sess.delete(f"{API}/admin/opportunities/{opp_id}", headers=hdr(admin_token))
        assert d.status_code == 200


class TestDigestRecurring:
    def test_digest_window_60_dated_plus_rolling(self, sess, admin_token):
        r = sess.post(f"{API}/admin/digest",
                      json={"deadline_window": 60, "limit": 8},
                      headers=hdr(admin_token))
        assert r.status_code == 200
        data = r.json()
        picks = data["opportunities"]
        assert len(picks) >= 1
        # First items with days_left should come before rolling
        seen_rolling = False
        for p in picks:
            if p.get("days_left") is None:
                seen_rolling = True
            else:
                assert not seen_rolling, "dated should come before rolling in digest picks"

        # For rolling items, digest text should contain the deadline_note text OR "Recurring"
        wa = data["formats"]["whatsapp"]
        rolling_pick = [p for p in picks if p.get("days_left") is None]
        if rolling_pick:
            rp = rolling_pick[0]
            expected_text = rp.get("deadline_note") or "Recurring"
            assert expected_text in wa, f"expected '{expected_text}' in whatsapp digest text"


class TestPagination:
    def test_71_supports_3_pages(self, sess):
        r = sess.get(f"{API}/opportunities", params={"limit": 500})
        total = len(r.json())
        # 71 / 24 = 3 pages (24, 24, 23)
        import math
        assert math.ceil(total / 24) == 3
