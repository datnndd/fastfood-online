# accounts/views.py
from rest_framework import generics, permissions
from .serializers import RegisterSerializer, CreateStaffSerializer, UpdateRoleSerializer, ProfileSerializer
from .permissions import IsManager
from .models import User

class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]

class MeView(generics.RetrieveAPIView):
    serializer_class = ProfileSerializer
    permission_classes = [permissions.IsAuthenticated]
    def get_object(self):
        return self.request.user

class CreateStaffView(generics.CreateAPIView):
    serializer_class = CreateStaffSerializer
    permission_classes = [permissions.IsAuthenticated, IsManager]

class UpdateUserRoleView(generics.UpdateAPIView):
    queryset = User.objects.all()
    serializer_class = UpdateRoleSerializer
    permission_classes = [permissions.IsAuthenticated, IsManager]
    lookup_field = "pk"