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
    admin = models.ForeignKey(Admin, on_delete=models.CASCADE)

    reset_token = models.CharField(max_length=100, null=True, blank=True)
    reset_token_expires = models.DateTimeField(null=True, blank=True)
    
    def set_password(self, password):
        from django.contrib.auth.hashers import make_password
        self.password = make_password(password)

    def __str__(self):
        return f"{self.username} - {self.get_specialty_display()}"




# Modèle Task
class Task(models.Model):
    TYPE_CHOICES = [
        ('arrosage', 'Arrosage'),
        ('désherbage', 'Désherbage'),
        ('taillage', 'Taillage'),
    ]

    STATUS_CHOICES = [
        ('à_faire', 'À faire'),
        ('en_cours', 'En cours'),
        ('terminée', 'Terminée'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=255)
    type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    description = models.TextField()
    assigned_to = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='tasks_assigned')
    created_by = models.ForeignKey(Admin, on_delete=models.CASCADE, related_name='tasks_created')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='à_faire')
    scheduled_at = models.DateTimeField()
    done_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"{self.title} - {self.get_type_display()} ({self.get_status_display()})"