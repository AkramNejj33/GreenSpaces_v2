from rest_framework import generics
from .serializers import GreenSpaceSerializer
from rest_framework.permissions import IsAuthenticated
from .models import GreenSpace

class GreenSpaceList(generics.ListAPIView):
    queryset = GreenSpace.objects.all()
    permission_classes = [IsAuthenticated]
    serializer_class = GreenSpaceSerializer