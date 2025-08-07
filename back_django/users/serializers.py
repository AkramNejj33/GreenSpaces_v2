from rest_framework import serializers
from .models import User
from .models import Admin , Task
from django.contrib.auth.hashers import make_password



class AdminSerializer(serializers.ModelSerializer):
    class Meta:
        model = Admin
        fields = ['id', 'name', 'email', 'password']
        extra_kwargs = {
            'password': {'write_only': True}
        }

    def create(self, validated_data):
        password = validated_data.pop('password', None)
        instance = self.Meta.model(**validated_data)
        if password is not None:
            instance.set_password(password)
        instance.save()
        return instance


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'password', 'specialty', 'created_at']
        extra_kwargs = {
            'password': {'write_only': True}
        }

    def create(self, validated_data):
        validated_data['password'] = make_password(validated_data['password'])
        return super().create(validated_data)
    

class TaskSerializer(serializers.ModelSerializer):
    assigned_to = UserSerializer(read_only=True)
    created_by = AdminSerializer(read_only=True)
    assigned_to_id = serializers.UUIDField(write_only=True)
    created_by_id = serializers.UUIDField(write_only=True, required=False)

    class Meta:
        model = Task
        fields = [
            'id', 'title', 'type', 'description', 'assigned_to', 'assigned_to_id',
            'created_by', 'created_by_id', 'status', 'scheduled_at', 'done_at'
        ]

    def validate(self, data):
        # Validation pour s'assurer que assigned_to_id existe
        assigned_to_id = data.get('assigned_to_id')
        if assigned_to_id and not User.objects.filter(id=assigned_to_id).exists():
            raise serializers.ValidationError("L'utilisateur assigné n'existe pas.")
        return data    