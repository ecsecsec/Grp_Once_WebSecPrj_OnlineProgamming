from django.db import models
from django.conf import settings

# Create your models here.

LANG_CHOICES = (
    ('cpp', 'C++'),
    ('java', 'Java'),
    ('py', 'Python'),
)

class Problem(models.Model):
    title = models.CharField(max_length=200)
    description = models.TextField()
    input_format = models.TextField()
    output_format = models.TextField()
    time_limit = models.FloatField(default=1.0)  
    memory_limit = models.IntegerField(default=256)  
    allowed_languages = models.JSONField(default=list)
    creator = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)

    def __str__(self):
        return self.title

class Submission(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    problem = models.ForeignKey(Problem, on_delete=models.CASCADE)
    code = models.TextField()
    language = models.CharField(max_length=10, choices=LANG_CHOICES)
    status = models.CharField(max_length=20, default='Pending')  # e.g., Accepted, WA, CE
    submitted_at = models.DateTimeField(auto_now_add=True)
