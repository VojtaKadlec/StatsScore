from django.db import models
from zapasy.models import Zapas
from teamy.models import Hrac

class Stats(models.Model):
    zapas = models.ForeignKey(Zapas, on_delete=models.CASCADE)
    hrac = models.ForeignKey(Hrac, on_delete=models.CASCADE)
    skore = models.IntegerField(default=0)
    tresty=models.ManyToManyField("Trest")
    
class Trest(models.Model):
    zapas = models.ForeignKey(Zapas, on_delete=models.CASCADE)
    hrac = models.ForeignKey(Hrac, on_delete=models.CASCADE)
    trest = models.IntegerField(default=0)

class Varovani(models.Model):
    zapas = models.ForeignKey(Zapas, on_delete=models.CASCADE)
    hrac = models.ForeignKey(Hrac, on_delete=models.CASCADE)
