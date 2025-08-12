from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('users.urls')),
    path('api/', include('green_spaces.urls')),
    path('api/chatbot/', include('chatbot.urls')),
    path('api/employee/', include('mobile.urls')),
]

