from django.conf import settings
from supabase import create_client, Client
from rest_framework import exceptions

def get_supabase_client() -> Client:
    url = settings.SUPABASE_URL
    key = settings.SUPABASE_SERVICE_ROLE_KEY
    if not url or not key:
        raise exceptions.APIException("Supabase credentials not configured")
    return create_client(url, key)

def create_supabase_user(email, password, user_metadata=None):
    supabase = get_supabase_client()
    try:
        attributes = {
            "email": email,
            "password": password,
            "email_confirm": True, # Confirm email automatically if using Admin API
            "user_metadata": user_metadata or {}
        }
        # Use admin auth client to create user without signing in
        response = supabase.auth.admin.create_user(attributes)
        return response.user
    except Exception as e:
        raise exceptions.APIException(f"Failed to create Supabase user: {str(e)}")
