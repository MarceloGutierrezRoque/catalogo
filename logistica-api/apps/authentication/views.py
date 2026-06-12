from django.contrib.auth.models import User, Group, Permission
from rest_framework import viewsets, generics
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.views import TokenObtainPairView
from apps.authentication.permissions import IsSuperUser
from apps.authentication.serializers import (
    CustomTokenObtainPairSerializer,
    UserSerializer,
    GroupSerializer,
    MeSerializer,
    PermissionSerializer,
)


class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer


class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated, IsSuperUser]


class GroupViewSet(viewsets.ModelViewSet):
    queryset = Group.objects.all()
    serializer_class = GroupSerializer
    permission_classes = [IsAuthenticated, IsSuperUser]


class MeView(generics.RetrieveUpdateAPIView):
    serializer_class = MeSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user


class PermissionListView(generics.ListAPIView):
    queryset = Permission.objects.select_related('content_type').all()
    serializer_class = PermissionSerializer
    permission_classes = [IsAuthenticated, IsSuperUser]
