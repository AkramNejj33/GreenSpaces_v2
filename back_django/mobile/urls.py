# chatbot/urls.py
from django.urls import path
from .views import (
    EmployeeLoginView,
    EmployeeProfileView,
    EmployeeLogoutView,
    EmployeeTokenRefreshView,
    EmployeeTokenStatusView,
    CheckAdminView,
    EmployeeForgotPasswordView,
    EmployeeResetPasswordView
)

urlpatterns = [
    path('login/', EmployeeLoginView.as_view(), name='employee-login'),
    path('profile/', EmployeeProfileView.as_view(), name='employee-profile'),
    path('logout/', EmployeeLogoutView.as_view(), name='employee-logout'),
    path('token/refresh/', EmployeeTokenRefreshView.as_view(), name='employee-token-refresh'),
    path('token/status/', EmployeeTokenStatusView.as_view(), name='employee-token-status'),
    path('check-admin/', CheckAdminView.as_view(), name='employee-check-admin'),
    path('forgot-password/', EmployeeForgotPasswordView.as_view(), name='employee-forgot-password'),
    path('reset-password/', EmployeeResetPasswordView.as_view(), name='employee-reset-password'),
]

