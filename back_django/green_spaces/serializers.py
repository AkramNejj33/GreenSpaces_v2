from rest_framework import serializers
from .models import GreenSpace
  
    
class GreenSpaceSerializer(serializers.ModelSerializer):
    class Meta:
        model = GreenSpace
        fields = ['full_id', 'osm_id', 'name', 'geometry']    