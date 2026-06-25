from rest_framework.routers import DefaultRouter
from apps.plushies.views import PlushiePublicViewSet, PlushieAdminViewSet

public_router = DefaultRouter()
public_router.register(r'plushies', PlushiePublicViewSet, basename='plushie-public')

admin_router = DefaultRouter()
admin_router.register(r'admin/plushies', PlushieAdminViewSet, basename='plushie-admin')

urlpatterns = public_router.urls + admin_router.urls
