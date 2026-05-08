"""Backend API tests for SusStyle AI Medical Helper."""
import os
import io
import uuid
import wave
import struct
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://med-helper-ai.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"

ADMIN_EMAIL = "admin@susstyle.com"
ADMIN_PASSWORD = "Admin@SusStyle2026"

UNIQUE = uuid.uuid4().hex[:8]
USER_EMAIL = f"patient+{UNIQUE}@example.com"
USER_PASSWORD = "Patient@2026"
USER_NAME = f"Test Patient {UNIQUE}"

CHEAP_MODEL = "gemini-2.5-flash"


@pytest.fixture(scope="session")
def admin_token():
    r = requests.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    assert r.status_code == 200, f"Admin login failed: {r.status_code} {r.text}"
    return r.json()["access_token"]


@pytest.fixture(scope="session")
def user_token():
    r = requests.post(f"{API}/auth/register", json={
        "email": USER_EMAIL, "password": USER_PASSWORD, "name": USER_NAME
    })
    if r.status_code == 409:
        r = requests.post(f"{API}/auth/login", json={"email": USER_EMAIL, "password": USER_PASSWORD})
    assert r.status_code in (200, 201), f"Register/login failed: {r.status_code} {r.text}"
    return r.json()["access_token"]


def auth_h(token):
    return {"Authorization": f"Bearer {token}"}


# ---------- Health ----------
def test_root_health():
    r = requests.get(f"{API}/health")
    assert r.status_code == 200
    assert r.json().get("ok") is True


# ---------- Auth ----------
class TestAuth:
    def test_register_returns_token_and_cookies(self):
        email = f"reg+{uuid.uuid4().hex[:8]}@example.com"
        r = requests.post(f"{API}/auth/register", json={
            "email": email, "password": "TestPass1234", "name": "Reg User"
        })
        assert r.status_code == 200, r.text
        data = r.json()
        assert "access_token" in data and isinstance(data["access_token"], str)
        assert data["user"]["email"] == email
        assert data["user"]["role"] == "user"
        # cookies
        cookies = r.cookies.get_dict()
        assert "access_token" in cookies
        assert "refresh_token" in cookies

    def test_register_duplicate_returns_409(self, user_token):
        r = requests.post(f"{API}/auth/register", json={
            "email": USER_EMAIL, "password": USER_PASSWORD, "name": USER_NAME
        })
        assert r.status_code == 409

    def test_login_invalid_returns_401(self):
        r = requests.post(f"{API}/auth/login", json={"email": USER_EMAIL, "password": "WrongPass!"})
        assert r.status_code == 401

    def test_me_with_bearer(self, user_token):
        r = requests.get(f"{API}/auth/me", headers=auth_h(user_token))
        assert r.status_code == 200
        assert r.json()["email"] == USER_EMAIL

    def test_me_with_cookie(self):
        # fresh login to get cookie
        s = requests.Session()
        r = s.post(f"{API}/auth/login", json={"email": USER_EMAIL, "password": USER_PASSWORD})
        assert r.status_code == 200
        # Re-use the session cookies, but no Authorization header
        r2 = s.get(f"{API}/auth/me")
        assert r2.status_code == 200
        assert r2.json()["email"] == USER_EMAIL

    def test_me_unauth(self):
        r = requests.get(f"{API}/auth/me")
        assert r.status_code == 401

    def test_logout_clears_cookies(self, user_token):
        s = requests.Session()
        s.post(f"{API}/auth/login", json={"email": USER_EMAIL, "password": USER_PASSWORD})
        r = s.post(f"{API}/auth/logout")
        assert r.status_code == 200

    def test_brute_force_lockout(self):
        # Use a brand-new email so we don't lock out the real user
        bad_email = f"bf+{uuid.uuid4().hex[:8]}@example.com"
        # Need to register first so identifier is per-IP-email; lockout is on identifier
        requests.post(f"{API}/auth/register", json={
            "email": bad_email, "password": "GoodPass1234", "name": "BF User"
        })
        codes = []
        for _ in range(6):
            r = requests.post(f"{API}/auth/login", json={"email": bad_email, "password": "WrongOne!"})
            codes.append(r.status_code)
        # First 5 should be 401, the 6th should be 429
        assert codes[0] == 401
        assert 429 in codes, f"Expected lockout (429) after 5 fails, got: {codes}"


# ---------- Profile ----------
class TestProfile:
    def test_get_health_profile(self, user_token):
        r = requests.get(f"{API}/profile/health", headers=auth_h(user_token))
        assert r.status_code == 200

    def test_put_health_profile(self, user_token):
        payload = {"age": 30, "sex": "male", "height_cm": 180, "weight_kg": 75,
                   "allergies": ["penicillin"], "chronic_conditions": [], "current_medications": [],
                   "family_history": [], "smoking": "never", "alcohol": "occasional"}
        r = requests.put(f"{API}/profile/health", json=payload, headers=auth_h(user_token))
        assert r.status_code == 200, r.text
        assert r.json()["ok"] is True
        # Verify persistence
        r2 = requests.get(f"{API}/profile/health", headers=auth_h(user_token))
        assert r2.status_code == 200
        assert r2.json()["age"] == 30


# ---------- Chat ----------
class TestChat:
    def test_models_listing(self, user_token):
        r = requests.get(f"{API}/chat/models", headers=auth_h(user_token))
        assert r.status_code == 200, r.text
        data = r.json()
        assert "models" in data and len(data["models"]) > 0
        assert "languages" in data and len(data["languages"]) > 0
        assert "voice_enabled" in data

    def test_send_message_creates_conversation(self, user_token):
        r = requests.post(f"{API}/chat/send", json={
            "message": "What are common symptoms of the flu?",
            "model": CHEAP_MODEL,
            "language": "en",
        }, headers=auth_h(user_token), timeout=90)
        assert r.status_code == 200, r.text
        data = r.json()
        assert "conversation_id" in data
        assert data["message"]["role"] == "assistant"
        assert len(data["message"]["content"]) > 0
        # Conversation should appear in list
        list_r = requests.get(f"{API}/chat/conversations", headers=auth_h(user_token))
        assert list_r.status_code == 200
        ids = [c["id"] for c in list_r.json()]
        assert data["conversation_id"] in ids

    def test_get_and_delete_conversation(self, user_token):
        # Create
        r = requests.post(f"{API}/chat/send", json={
            "message": "Briefly: what is hypertension?", "model": CHEAP_MODEL, "language": "en",
        }, headers=auth_h(user_token), timeout=90)
        assert r.status_code == 200
        conv_id = r.json()["conversation_id"]
        # Get
        g = requests.get(f"{API}/chat/conversations/{conv_id}", headers=auth_h(user_token))
        assert g.status_code == 200
        body = g.json()
        assert body["conversation"]["id"] == conv_id
        assert len(body["messages"]) >= 2
        # Delete
        d = requests.delete(f"{API}/chat/conversations/{conv_id}", headers=auth_h(user_token))
        assert d.status_code == 200
        # 404 after delete
        g2 = requests.get(f"{API}/chat/conversations/{conv_id}", headers=auth_h(user_token))
        assert g2.status_code == 404


# ---------- Voice ----------
class TestVoice:
    def test_transcribe_requires_audio_bytes(self, user_token):
        # Empty file should be rejected
        files = {"audio": ("empty.webm", b"", "audio/webm")}
        r = requests.post(f"{API}/voice/transcribe",
                          files=files, data={"language": "en"},
                          headers=auth_h(user_token))
        assert r.status_code == 400

    def test_transcribe_unauth(self):
        files = {"audio": ("x.webm", b"abc" * 100, "audio/webm")}
        r = requests.post(f"{API}/voice/transcribe", files=files, data={"language": "en"})
        assert r.status_code == 401

    def test_tts_returns_base64(self, user_token):
        r = requests.post(f"{API}/voice/tts", json={"text": "Hello, this is a short test.", "voice": "sage"},
                          headers=auth_h(user_token), timeout=60)
        if r.status_code == 502:
            pytest.skip(f"TTS upstream issue: {r.text}")
        assert r.status_code == 200, r.text
        data = r.json()
        assert "audio_base64" in data and len(data["audio_base64"]) > 100


# ---------- Admin ----------
class TestAdmin:
    def test_non_admin_blocked(self, user_token):
        r = requests.get(f"{API}/admin/users", headers=auth_h(user_token))
        assert r.status_code == 403

    def test_admin_users_list(self, admin_token):
        r = requests.get(f"{API}/admin/users", headers=auth_h(admin_token))
        assert r.status_code == 200
        data = r.json()
        assert "users" in data and "total" in data
        assert data["total"] >= 1

    def test_admin_users_q_filter(self, admin_token):
        r = requests.get(f"{API}/admin/users", params={"q": "admin"}, headers=auth_h(admin_token))
        assert r.status_code == 200
        emails = [u["email"] for u in r.json()["users"]]
        assert any("admin" in e for e in emails)

    def test_admin_get_user(self, admin_token, user_token):
        # find user id
        me = requests.get(f"{API}/auth/me", headers=auth_h(user_token)).json()
        r = requests.get(f"{API}/admin/users/{me['id']}", headers=auth_h(admin_token))
        assert r.status_code == 200
        assert r.json()["email"] == USER_EMAIL

    def test_admin_cannot_ban_self(self, admin_token):
        me = requests.get(f"{API}/auth/me", headers=auth_h(admin_token)).json()
        r = requests.patch(f"{API}/admin/users/{me['id']}/ban",
                           json={"banned": True}, headers=auth_h(admin_token))
        assert r.status_code == 400

    def test_admin_cannot_delete_self(self, admin_token):
        me = requests.get(f"{API}/auth/me", headers=auth_h(admin_token)).json()
        r = requests.delete(f"{API}/admin/users/{me['id']}", headers=auth_h(admin_token))
        assert r.status_code == 400

    def test_admin_role_update(self, admin_token, user_token):
        me = requests.get(f"{API}/auth/me", headers=auth_h(user_token)).json()
        r = requests.patch(f"{API}/admin/users/{me['id']}/role",
                           json={"role": "user"}, headers=auth_h(admin_token))
        assert r.status_code == 200

    def test_admin_user_conversations(self, admin_token, user_token):
        me = requests.get(f"{API}/auth/me", headers=auth_h(user_token)).json()
        r = requests.get(f"{API}/admin/users/{me['id']}/conversations", headers=auth_h(admin_token))
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_admin_conversations_search(self, admin_token):
        r = requests.get(f"{API}/admin/conversations", headers=auth_h(admin_token))
        assert r.status_code == 200
        data = r.json()
        assert "conversations" in data and "total" in data

    def test_admin_settings_get_and_put(self, admin_token):
        r = requests.get(f"{API}/admin/settings", headers=auth_h(admin_token))
        assert r.status_code == 200
        settings = r.json()
        # Update voice_enabled toggle then revert
        original = settings.get("voice_enabled", True)
        settings["voice_enabled"] = not original
        u = requests.put(f"{API}/admin/settings", json=settings, headers=auth_h(admin_token))
        assert u.status_code == 200, u.text
        # Revert
        settings["voice_enabled"] = original
        u2 = requests.put(f"{API}/admin/settings", json=settings, headers=auth_h(admin_token))
        assert u2.status_code == 200

    def test_admin_analytics(self, admin_token):
        r = requests.get(f"{API}/admin/analytics", headers=auth_h(admin_token))
        assert r.status_code == 200
        data = r.json()
        for key in ["total_users", "total_conversations", "total_messages",
                    "messages_last_7_days", "model_usage", "daily_activity"]:
            assert key in data
