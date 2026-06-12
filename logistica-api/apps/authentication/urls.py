from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.authentication.views import (
    CustomTokenObtainPairView,
    UserViewSet,
    GroupViewSet,
    MeView,
    PermissionListView,
)
from rest_framework_simplejwt.views import TokenRefreshView

router = DefaultRouter()
router.register(r'users', UserViewSet)
router.register(r'groups', GroupViewSet)

urlpatterns = [
    path('auth/login/', CustomTokenObtainPairView.as_view(), name='auth_login'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='auth_refresh'),
    path('auth/me/', MeView.as_view(), name='auth_me'),
    path('auth/permissions/', PermissionListView.as_view(), name='auth_permissions'),
    path('auth/', include(router.urls)),
]
