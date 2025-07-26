from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import UserViewSet
from .views import RegisterView, LoginView, AdminView, LogoutView, ForgotPasswordView, ResetPasswordView, ChangePasswordView


router = DefaultRouter()
router.register(r'users', UserViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('register', RegisterView.as_view()),
    path('login', LoginView.as_view()),
    path('admin', AdminView.as_view()),
    path('logout', LogoutView.as_view()),

    path('forgot-password', ForgotPasswordView.as_view()),
    path('reset-password', ResetPasswordView.as_view()),
    path('change-password', ChangePasswordView.as_view()),
]
