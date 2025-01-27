from django.db import models

class Sport(models.Model):
    jmeno=models.CharField(max_length=20, choices=[("fotbal", "Fotbal"), ("hazena", "Házená"), ("hokej", "Hokej")], unique=True)

    def __str__(self):
        return dict(self._meta.get_field('jmeno').choices).get(self.jmeno, self.jmeno)
