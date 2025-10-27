import uuid

import jwt
from django.contrib.auth import get_user_model
from django.test import TestCase, override_settings
from rest_framework.test import APIRequestFactory

from .authentication import SupabaseJWTBackend


class SupabaseJWTBackendTests(TestCase):
    factory = APIRequestFactory()
    secret = "test-secret"

    def _build_token(self, **claims):
        payload = {
            "sub": str(uuid.uuid4()),
            "email": "demo@example.com",
            "email_confirmed_at": "2024-01-01T00:00:00Z",
            "user_metadata": {"full_name": "Demo User", "role": "manager"},
        }
        payload.update(claims)
        return jwt.encode(payload, self.secret, algorithm="HS256"), payload["sub"]

    @override_settings(SUPABASE_JWT_SECRET=secret, SUPABASE_AUTH_ENABLED=True)
    def test_authenticate_creates_local_user_profile(self):
        token, sub = self._build_token()
        request = self.factory.get("/me", HTTP_AUTHORIZATION=f"Bearer {token}")

        backend = SupabaseJWTBackend()
        user, auth_payload = backend.authenticate(request)

        self.assertIsNotNone(user)
        self.assertEqual(str(user.supabase_id), sub)
        self.assertEqual(user.email, "demo@example.com")
        self.assertTrue(user.email_verified)
        self.assertEqual(user.role, "manager")
        self.assertIn("email", auth_payload)

    @override_settings(SUPABASE_JWT_SECRET=secret, SUPABASE_AUTH_ENABLED=True)
    def test_authenticate_updates_existing_user(self):
        token, sub = self._build_token(phone="123456789")
        request = self.factory.get("/me", HTTP_AUTHORIZATION=f"Bearer {token}")
        backend = SupabaseJWTBackend()
        backend.authenticate(request)  # create

        user_model = get_user_model()
        user = user_model.objects.get(supabase_id=sub)
        user.phone = ""
        user.role = "customer"
        user.save(update_fields=["phone", "role"])

        updated_token, _ = self._build_token(phone="999999")
        updated_request = self.factory.get("/me", HTTP_AUTHORIZATION=f"Bearer {updated_token}")
        backend.authenticate(updated_request)

        user.refresh_from_db()
        self.assertEqual(user.phone, "999999")
        self.assertEqual(user.role, "manager")

    @override_settings(SUPABASE_JWT_SECRET=secret, SUPABASE_AUTH_ENABLED=False)
    def test_authenticate_returns_none_when_disabled(self):
        token, _ = self._build_token()
        request = self.factory.get("/me", HTTP_AUTHORIZATION=f"Bearer {token}")
        backend = SupabaseJWTBackend()
        self.assertIsNone(backend.authenticate(request))
