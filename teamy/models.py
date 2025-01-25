from django.db import models
from sporty.models import Sport

class Team(models.Model):
    jmeno = models.CharField(max_length=100)
    sport = models.ForeignKey(Sport, on_delete=models.CASCADE)
    hraci = models.ManyToManyField("Hrac", related_name="teams")  

class Hrac(models.Model):
    jmeno = models.CharField(max_length=100)
    team = models.ForeignKey(Team, on_delete=models.CASCADE, related_name="players")  
    cislo = models.IntegerField()



