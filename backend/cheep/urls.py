"""cheep URL Configuration

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/3.1/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.conf import settings
from django.contrib import admin
from django.urls import path, include
import cheep_api.urls
import cheep_api.rest
import cheep_api.views

from django.views.generic.base import TemplateView

#dev only
from django.conf.urls.static import static

urlpatterns = [
    path('', TemplateView.as_view(template_name='home.html'), name='home'), #this is now the frontenddist index, so don't expect to see it

    #all these paths need te be specified in caddy to reverse proxy to our django instance
    #OR i need to find a way to merge the frontend dist into this container with django/uwsgi
    path('accounts/signup/', cheep_api.views.SignUpView.as_view(), name='signup'),
    path('accounts/profile/', TemplateView.as_view(template_name='profile.html'), name='profile'),
    path('accounts/', include('django.contrib.auth.urls')),
    path('admin/', admin.site.urls),
    path("stripe/", include("djstripe.urls", namespace="djstripe")),
    #webhook is at /stripe/webhook/
    path('cheep/', include(cheep_api.urls)),
    path('api/', include(cheep_api.rest.router.urls)),
    path('api/', include(cheep_api.urls)),
    path('api-auth/', include('rest_framework.urls')),
    #and bes/ for static files as configured in settings.py for dev
    #and u/ for user data (MEDIA) as configured below for dev
]
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
