from django.urls import path
from .views import contact, health, portfolio

urlpatterns = [path("", portfolio), path("health/", health), path("contact/", contact)]

