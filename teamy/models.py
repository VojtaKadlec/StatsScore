from django.db import models
from sporty.models import Sport

class Team(models.Model):
    jmeno = models.CharField(max_length=100)
    sport = models.ForeignKey(Sport, on_delete=models.CASCADE)
    hraci = models.ManyToManyField("Hrac", related_name="team")  
    
    def __str__(self):
        return self.jmeno

class Hrac(models.Model):
    jmeno = models.CharField(max_length=100)
    cislo = models.IntegerField()

    def __str__(self):

        return f"[{self.cislo}] {self.jmeno}"




