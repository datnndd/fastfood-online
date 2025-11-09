# core/utils/supabase_storage.py
import os
from functools import lru_cache
from io import BytesIO

import boto3
from botocore.config import Config
from django.conf import settings
from django.core.exceptions import ImproperlyConfigured, ValidationError
from PIL import Image, ImageOps, UnidentifiedImageError

try:
    RESAMPLE_METHOD = Image.Resampling.LANCZOS
except AttributeError:  # Pillow < 9.1 fallback
    RESAMPLE_METHOD = Image.LANCZOS


def _missing_settings():
    required = {
        "S3_ENDPOINT_URL": settings.S3_ENDPOINT_URL,
        "S3_REGION": settings.S3_REGION,
        "S3_ACCESS_KEY_ID": settings.S3_ACCESS_KEY_ID,
        "S3_SECRET_ACCESS_KEY": settings.S3_SECRET_ACCESS_KEY,
        "S3_BUCKET": settings.S3_BUCKET,
    }
    return [name for name, value in required.items() if not value]


@lru_cache(maxsize=1)
def _client():
    missing = _missing_settings()
    if missing:
        raise ImproperlyConfigured(
            f"Thiếu cấu hình S3 cho Supabase: {', '.join(missing)}"
        )
    session = boto3.session.Session()
    return session.client(
        "s3",
        endpoint_url=settings.S3_ENDPOINT_URL,
        region_name=settings.S3_REGION,
        aws_access_key_id=settings.S3_ACCESS_KEY_ID,
        aws_secret_access_key=settings.S3_SECRET_ACCESS_KEY,
        config=Config(signature_version="s3v4"),
    )


FORMAT_META = {
    "JPEG": {"ext": ".jpg", "mime": "image/jpeg", "save_kwargs": {"quality": 85, "optimize": True}},
    "PNG": {"ext": ".png", "mime": "image/png", "save_kwargs": {"optimize": True}},
    "WEBP": {"ext": ".webp", "mime": "image/webp", "save_kwargs": {"quality": 90}},
}


def _build_public_url(dest_path: str) -> str:
    base = (settings.S3_PUBLIC_BASE_URL or "").rstrip("/")
    if not base:
        return dest_path
    return f"{base}/{dest_path.lstrip('/')}"


def _normalize_dest_path(dest_path: str, extension: str) -> str:
    clean_path = dest_path.strip().lstrip("/")
    root, _ = os.path.splitext(clean_path)
    return f"{root}{extension}"


def _prepare_image(file_obj, max_dimension: int):
    try:
        with Image.open(file_obj) as img:
            image = ImageOps.exif_transpose(img)
            image.load()
    except UnidentifiedImageError as exc:
        raise ValidationError("File tải lên phải là ảnh hợp lệ.") from exc
    if hasattr(image, "format") and image.format:
        format_name = image.format.upper()
    else:
        format_name = "JPEG"

    image.thumbnail((max_dimension, max_dimension), RESAMPLE_METHOD)

    if format_name not in FORMAT_META:
        format_name = "JPEG"

    if format_name == "JPEG" and image.mode not in ("RGB", "L"):
        image = image.convert("RGB")
    elif format_name in {"PNG", "WEBP"} and image.mode == "P":
        image = image.convert("RGBA")

    buffer = BytesIO()
    meta = FORMAT_META[format_name]
    image.save(buffer, format=format_name, **meta.get("save_kwargs", {}))
    buffer.seek(0)
    return buffer, meta["mime"], meta["ext"]


def upload_and_get_public_url(file_obj, dest_path: str, content_type: str) -> str:
    """
    Upload file bytes lên Supabase Storage thông qua S3 API và trả về public URL.
    Yêu cầu bucket đã được đặt là public trong Supabase.
    """
    if hasattr(file_obj, "seek"):
        file_obj.seek(0)

    processed_file, mime_type, extension = _prepare_image(
        file_obj,
        getattr(settings, "UPLOAD_IMAGE_MAX_DIMENSION", 1280),
    )
    normalized_dest = _normalize_dest_path(dest_path, extension)

    _client().upload_fileobj(
        Fileobj=processed_file,
        Bucket=settings.S3_BUCKET,
        Key=normalized_dest,
        ExtraArgs={"ContentType": mime_type or content_type},
    )

    return _build_public_url(normalized_dest)
