from django.db import models
from django.contrib.auth.models import AbstractUser

# Create your models here.

class CustomUser(AbstractUser):
    USER_TYPE_CHOICES = (
        ('admin', 'Admin'),
        ('creator', 'Creator'),
        ('user', 'User'),
    )
    user_type = models.CharField(max_length=10, choices=USER_TYPE_CHOICES, default='user')

    def is_admin(self):
        return self.user_type == 'admin'

    def is_creator(self):
        return self.user_type == 'creator'
