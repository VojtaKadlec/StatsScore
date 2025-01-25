from django.db import models
from sporty.models import Sport
from teamy.models import Team

class Zapas(models.Model):
    sport=models.ForeignKey(Sport, on_delete=models.CASCADE)
    domaci=models.ForeignKey(Team, on_delete=models.CASCADE)
    hoste=models.ForeignKey(Team, on_delete=models.CASCADE)
    datum=models.DateField()
    status=models.CharField(choices=["Nadcházející", "Probíhající", "Ukončené"], max_length=20)