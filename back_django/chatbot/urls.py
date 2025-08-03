# chatbot/urls.py
from django.urls import path
from .views import (
    LangChainChatbotView, 
    ChatbotMemoryView, 
    ChatbotHealthView
)

urlpatterns = [
    path('chat/', LangChainChatbotView.as_view(), name='langchain-chatbot'),
    path('chat/memory/', ChatbotMemoryView.as_view(), name='chatbot-memory'),
    path('chat/health/', ChatbotHealthView.as_view(), name='chatbot-health'),
]

