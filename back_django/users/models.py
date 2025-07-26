import uuid
from django.db import models
from django.contrib.auth.models import AbstractUser



class Admin(AbstractUser):
    name = models.CharField(max_length=255)
    email = models.CharField(max_length=255, unique=True)
    password = models.CharField(max_length=255)


    reset_token = models.CharField(max_length=100, null=True, blank=True)
    reset_token_expires = models.DateTimeField(null=True, blank=True)

    username = None

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []


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
