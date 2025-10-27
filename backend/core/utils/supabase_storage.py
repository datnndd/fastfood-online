# core/utils/supabase_storage.py
import os
from supabase import create_client
from django.conf import settings

def _client():
    return create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)

def upload_and_get_public_url(file_obj, dest_path: str, content_type: str) -> str:
    """
    Upload file bytes lên {bucket}/{dest_path} và trả về public URL.
    Yêu cầu bucket public. Nếu bucket private, bạn có thể đổi sang signed URL.
    """
    bucket = settings.SUPABASE_STORAGE_BUCKET
    sb = _client()

    # upsert=True để ghi đè nếu trùng path
    sb.storage.from_(bucket).upload(
        file=file_obj,
        path=dest_path,
        file_options={"contentType": content_type, "upsert": True},
    )

    # Tạo public URL theo chuẩn Supabase
    return f"{settings.SUPABASE_URL}/storage/v1/object/public/{bucket}/{dest_path}"
