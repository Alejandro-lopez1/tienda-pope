from rest_framework.routers import DefaultRouter
from .views import StoreSettingsViewSet

router = DefaultRouter()
router.register('store-settings', StoreSettingsViewSet, basename='store-settings')

urlpatterns = router.urls
