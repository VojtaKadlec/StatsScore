from django.db import models
from zapasy.models import Zapas
from teamy.models import Hrac

class Stats(models.Model):
    zapas = models.ForeignKey(Zapas, on_delete=models.CASCADE)
    hrac = models.ForeignKey(Hrac, on_delete=models.CASCADE)
    goly = models.IntegerField(default=0, blank=True, null=True)

    zlute_karty = models.IntegerField(default=0, blank=True, null=True)
    trestne_minuty= models.IntegerField(default=0, blank=True, null=True)
      



