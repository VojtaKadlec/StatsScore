from django.db import models
from zapasy.models import Zapas

class Casomira(models.Model):
    zapas=models.OneToOneField(Zapas, on_delete=models.CASCADE)
    start=models.DateTimeField(null=True)
    konec=models.DateTimeField(null=True)
    segment=models.IntegerField(default=1)