import uuid
from django.db import models


class User(models.Model):
    SPECIALTY_CHOICES = [
        ('jardinier', 'Jardinier'),
        ('paysagiste', 'Paysagiste'),
        ('horticulteur', 'Horticulteur'),
        ('electronicien', 'Électronicien'),
        ('technicien_iot', 'Technicien IoT'),
        ('installateur_capteurs', 'Installateur de capteurs'),
        ('maintenance', 'Agent de maintenance'),
        ('irrigation', 'Spécialiste irrigation'),
        ('gestion_energie', 'Gestion de l’énergie'),
        ('autre', 'Autre'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    username = models.CharField(max_length=100)
    email = models.EmailField(unique=True)
    password = models.CharField(max_length=128)
    specialty = models.CharField(max_length=30, choices=SPECIALTY_CHOICES , default='autre') 
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.username} - {self.get_specialty_display()}"
