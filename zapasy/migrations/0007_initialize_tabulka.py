from django.db import migrations, models
def initialize_tabulka(apps, schema_editor):
    Zapas = apps.get_model('zapasy', 'Zapas')
    Liga = apps.get_model('zapasy', 'Liga')
    Stats = apps.get_model('stats', 'Stats')
    TabulkaBody = apps.get_model('zapasy', 'TabulkaBody')
    
    for zapas in Zapas.objects.filter(status='ukoncene'):
        stats = Stats.objects.filter(zapas=zapas)
        domaci_score = sum(stat.goly for stat in stats if stat.hrac.team.filter(id=zapas.domaci.id).exists())
        hoste_score = sum(stat.goly for stat in stats if stat.hrac.team.filter(id=zapas.hoste.id).exists())
        
        ligy = Liga.objects.filter(zapasy=zapas)
        for liga in ligy:
            domaci_body, created = TabulkaBody.objects.get_or_create(team=zapas.domaci, liga=liga)
            hoste_body, created = TabulkaBody.objects.get_or_create(team=zapas.hoste, liga=liga)
            
            if domaci_score > hoste_score:
                domaci_body.body += 2
            elif hoste_score > domaci_score:
                hoste_body.body += 2
            else:
                domaci_body.body += 1
                hoste_body.body += 1
            
            domaci_body.save()
            hoste_body.save()

class Migration(migrations.Migration):
    dependencies = [
        ('zapasy', '0006_tabulkabody'),
    ]

    operations = [
        migrations.RunPython(initialize_tabulka),
    ]