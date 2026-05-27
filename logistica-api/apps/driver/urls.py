from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.driver.views import DriverViewSet

router = DefaultRouter()
router.register(r'drivers', DriverViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
