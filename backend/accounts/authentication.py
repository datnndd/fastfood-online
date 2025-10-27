"""Supabase authentication helpers for DRF."""

from __future__ import annotations

import re
import uuid
from typing import Any, Dict, Optional

import jwt
from django.conf import settings
from django.core.exceptions import ImproperlyConfigured
from rest_framework import exceptions
from rest_framework.authentication import BaseAuthentication, get_authorization_header

from .models import User


def _get_supabase_secret() -> str:
    secret = getattr(settings, "SUPABASE_JWT_SECRET", None)
    if not secret:
        raise ImproperlyConfigured("SUPABASE_JWT_SECRET is not configured")
    return secret


def _decode_supabase_token(token: str) -> Dict[str, Any]:
    """Decode and validate a Supabase JWT token."""

    try:
        decode_kwargs: Dict[str, Any] = {"algorithms": ["HS256"]}
        audience = getattr(settings, "SUPABASE_JWT_AUDIENCE", None)
        if audience:
            decode_kwargs["audience"] = audience
        return jwt.decode(token, _get_supabase_secret(), **decode_kwargs)
    except jwt.ExpiredSignatureError as exc:  # pragma: no cover - defensive
        raise exceptions.AuthenticationFailed("Supabase token đã hết hạn") from exc
    except jwt.InvalidTokenError as exc:  # pragma: no cover - defensive
        raise exceptions.AuthenticationFailed("Supabase token không hợp lệ") from exc


def _parse_uuid(value: Any) -> Optional[uuid.UUID]:
    if value is None:
        return None
    try:
        return uuid.UUID(str(value))
    except (TypeError, ValueError, AttributeError):
        return None


def _normalise_username(value: Optional[str]) -> str:
    cleaned = re.sub(r"[^a-zA-Z0-9_]+", "", (value or "").strip())
    return cleaned or "user"


def _generate_username(preferred: Optional[str], supabase_id: Optional[uuid.UUID]) -> str:
    max_length = User._meta.get_field("username").max_length
    base = _normalise_username(preferred)
    if supabase_id and base == "user":
        base = f"user_{str(supabase_id)[:8]}"
    base = base[:max_length]

    candidate = base
    suffix = 1
    while User.objects.filter(username=candidate).exists():
        suffix_str = f"_{suffix}"
        candidate = f"{base[: max_length - len(suffix_str)]}{suffix_str}"
        suffix += 1
    return candidate


def _extract_phone(payload: Dict[str, Any]) -> Optional[str]:
    phone = payload.get("phone")
    if phone:
        return phone
    user_meta = payload.get("user_metadata") or {}
    return user_meta.get("phone")


def _sync_user_from_claims(payload: Dict[str, Any]) -> User:
    supabase_uuid = _parse_uuid(payload.get("sub"))
    if not supabase_uuid:
        raise exceptions.AuthenticationFailed("Supabase token thiếu thông tin người dùng")

    email = (payload.get("email") or "").lower()
    user_meta = payload.get("user_metadata") or {}
    app_meta = payload.get("app_metadata") or {}
    provider = (app_meta.get("provider") or "email").lower()
    username_hint = user_meta.get("username") or (email.split("@")[0] if email else None)
    phone = _extract_phone(payload)

    user = User.objects.filter(supabase_id=supabase_uuid).first()
    if not user and email:
        user = User.objects.filter(email__iexact=email).first()

    if not user:
        user = User(
            username=_generate_username(username_hint, supabase_uuid),
            email=email,
            supabase_id=supabase_uuid,
            auth_provider=provider,
            email_verified=bool(payload.get("email_confirmed_at")),
            phone_verified=bool(payload.get("phone_confirmed_at")),
        )
        if phone:
            user.phone = phone
        user.set_unusable_password()
        user.save()
        return user

    updates: list[str] = []

    def _set(field: str, value: Any, *, allow_blank: bool = False) -> None:
        if value is None:
            return
        if not allow_blank and value == "":
            return
        if getattr(user, field) != value:
            setattr(user, field, value)
            updates.append(field)

    _set("supabase_id", supabase_uuid)
    if email:
        _set("email", email)
    _set("auth_provider", provider)
    _set("email_verified", bool(payload.get("email_confirmed_at")))
    _set("phone_verified", bool(payload.get("phone_confirmed_at")))
    _set("phone", phone, allow_blank=True)

    desired_username = user_meta.get("username")
    if desired_username:
        desired_username = _normalise_username(desired_username)
        if desired_username and desired_username != user.username:
            candidate = desired_username[: User._meta.get_field("username").max_length]
            exists = User.objects.filter(username=candidate).exclude(pk=user.pk).exists()
            if not exists:
                _set("username", candidate)

    if updates:
        user.save(update_fields=sorted(set(updates)))

    if not user.is_active:
        raise exceptions.AuthenticationFailed("Tài khoản đã bị khóa")

    return user


class SupabaseAuthentication(BaseAuthentication):
    """Authenticate DRF requests using Supabase access tokens."""

    keyword = "Bearer"

    def authenticate(self, request):
        auth = get_authorization_header(request).split()
        if not auth:
            return None
        if auth[0].lower() != b"bearer":
            return None
        if len(auth) == 1:
            raise exceptions.AuthenticationFailed("Thiếu Supabase token")
        if len(auth) > 2:
            raise exceptions.AuthenticationFailed("Header Authorization không hợp lệ")

        token = auth[1].decode("utf-8")
        payload = _decode_supabase_token(token)
        user = _sync_user_from_claims(payload)
        return (user, payload)

    def authenticate_header(self, request):  # pragma: no cover - required by DRF
        return self.keyword
