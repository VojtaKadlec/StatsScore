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
            ("paused", "Pozastaveno"),
            ("ukoncene", "Ukončené")
        ],
        max_length=20,
        default="nadchazejici"
    )
    start_time = models.DateTimeField(null=True, blank=True)
    pause_time = models.DateTimeField(null=True, blank=True)
    elapsed_time = models.IntegerField(default=0)

    def __str__(self):
        return f"{self.domaci} - {self.hoste}"

    def save(self, *args, **kwargs):
        if not self.pk:
            self.status = "nadchazejici"
        super().save(*args, **kwargs)

class Liga(models.Model):
    jmeno = models.CharField(max_length=20)
    sport = models.ForeignKey(Sport, on_delete=models.CASCADE)
    zapasy = models.ManyToManyField(Zapas)

    def __str__(self):
        return self.jmeno
    
class TabulkaBody(models.Model):
    team = models.ForeignKey(Team, on_delete=models.CASCADE)
    liga = models.ForeignKey(Liga, on_delete=models.CASCADE)
    body = models.IntegerField(default=0)
    
    class Meta:
        unique_together = ('team', 'liga')
        
    def __str__(self):
        return f"{self.team} - {self.liga}: {self.body} bodů"