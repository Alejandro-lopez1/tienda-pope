"""
URL configuration for Tienda Pope project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/4.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from . import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app import views
    2. Add a URL to urlpatterns:  path('', views.Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods

# Health check endpoint for monitoring
@require_http_methods(["GET"])
def health_check(request):
    """Simple health check endpoint for monitoring and load balancers."""
    return JsonResponse({
        "status": "healthy",
        "service": "Pope API",
        "version": "0.8.0"
    })

urlpatterns = [
    # Health check endpoint
    path('health/', health_check, name='health_check'),
    
    # Admin and API
    path('admin/', admin.site.urls),
    path('api/v1/', include('rest_framework.urls')),
    # API endpoints
    path('api/v1/auth/', include('apps.auth.urls')),
    path('api/v1/categories/', include('apps.categories.urls')),
    path('api/v1/products/', include('apps.products.urls')),
    path('api/v1/orders/', include('apps.orders.urls')),
    path('api/v1/customers/', include('apps.customers.urls')),
    # path('api/v1/reports/', include('apps.reports.urls')),
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
