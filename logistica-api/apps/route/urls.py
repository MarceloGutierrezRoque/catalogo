from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.route.views import RouteViewSet, StopViewSet

router = DefaultRouter()
router.register(r'routes', RouteViewSet)
router.register(r'stops', StopViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
