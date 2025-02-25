# Generated by Django 5.1.5 on 2025-02-25 16:21

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('stats', '0001_initial'),
        ('teamy', '0002_remove_hrac_team_alter_team_hraci'),
        ('zapasy', '0002_zapas_elapsed_time_zapas_pause_time_zapas_start_time_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='stats',
            name='disqualified',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='stats',
            name='penalty_start_time',
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='stats',
            name='penalty_total_count',
            field=models.IntegerField(default=0),
        ),
        migrations.AlterField(
            model_name='stats',
            name='goly',
            field=models.IntegerField(default=0),
        ),
        migrations.AlterField(
            model_name='stats',
            name='trestne_minuty',
            field=models.IntegerField(default=0),
        ),
        migrations.AlterField(
            model_name='stats',
            name='zlute_karty',
            field=models.IntegerField(default=0),
        ),
        migrations.AlterUniqueTogether(
            name='stats',
            unique_together={('zapas', 'hrac')},
        ),
    ]
