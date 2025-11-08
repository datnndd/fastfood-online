from rest_framework import viewsets, mixins, permissions, filters

from accounts.permissions import IsManager
from .models import Feedback
from .serializers import FeedbackSerializer


class FeedbackViewSet(
    mixins.CreateModelMixin,
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    viewsets.GenericViewSet,
):
    queryset = Feedback.objects.all().order_by("-created_at")
    serializer_class = FeedbackSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["full_name", "email", "phone", "subject", "message"]
    ordering_fields = ["created_at"]

    def get_permissions(self):
        if self.action == "create":
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated(), IsManager()]
