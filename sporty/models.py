from django.db import models

class Sport(models.Model):
    jmeno=models.CharField(max_length=20)