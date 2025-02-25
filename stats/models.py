from django.db import models
from zapasy.models import Zapas
from teamy.models import Hrac

class Stats(models.Model):
    zapas = models.ForeignKey('zapasy.Zapas', on_delete=models.CASCADE)
    hrac = models.ForeignKey('teamy.Hrac', on_delete=models.CASCADE)
    goly = models.IntegerField(default=0)
    zlute_karty = models.IntegerField(default=0)
    trestne_minuty = models.IntegerField(default=0)
    penalty_start_time = models.DateTimeField(null=True, blank=True)
    penalty_total_count = models.IntegerField(default=0)
    disqualified = models.BooleanField(default=False)
    
    class Meta:
        unique_together = ('zapas', 'hrac')

    def __str__(self):
        return f"{self.hrac} [{self.zapas}]"
      



