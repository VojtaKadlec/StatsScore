from django.db import models
from sporty.models import Sport
from teamy.models import Team

class Zapas(models.Model):
    sport = models.ForeignKey(Sport, on_delete=models.CASCADE)
    domaci = models.ForeignKey(Team, on_delete=models.CASCADE, related_name='domaci_zapasy')
    hoste = models.ForeignKey(Team, on_delete=models.CASCADE, related_name='hoste_zapasy')
    datum = models.DateTimeField()
    status = models.CharField(
        choices=[
            ("nadchazejici", "Nadcházející"),
            ("probihajici", "Probíhající"),
            ("paused", "Pozastaveno"),  # Add a paused status
            ("ukoncene", "Ukončené")
        ],
        max_length=20
    )
    start_time = models.DateTimeField(null=True, blank=True)
    pause_time = models.DateTimeField(null=True, blank=True)  # Add this field
    elapsed_time = models.IntegerField(default=0)  # Add this field (in seconds)

    def __str__(self):
        return f"{self.domaci} - {self.hoste}"

class Liga(models.Model):
    jmeno = models.CharField(max_length=20)
    sport = models.ForeignKey(Sport, on_delete=models.CASCADE)
    zapasy = models.ManyToManyField(Zapas)

    def __str__(self):
        return self.jmeno
    
