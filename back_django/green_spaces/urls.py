from django.urls import path
from . import views
urlpatterns = [
    path("green_spaces/", views.GreenSpaceList.as_view(), name="green-space-list")
]