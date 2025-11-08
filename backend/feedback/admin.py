from django.contrib import admin

from .models import Feedback


@admin.register(Feedback)
class FeedbackAdmin(admin.ModelAdmin):
    list_display = ("full_name", "email", "phone", "subject", "created_at")
    list_filter = ("created_at",)
    search_fields = ("full_name", "email", "phone", "subject", "message")
    readonly_fields = ("created_at", "updated_at")
    ordering = ("-created_at",)
