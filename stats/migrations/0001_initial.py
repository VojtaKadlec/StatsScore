# Generated by Django 5.1.5 on 2025-01-26 13:25

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('teamy', '0001_initial'),
        ('zapasy', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='Stats',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('goly', models.IntegerField(blank=True, default=0, null=True)),
                ('zlute_karty', models.IntegerField(blank=True, default=0, null=True)),
                ('trestne_minuty', models.IntegerField(blank=True, default=0, null=True)),
                ('hrac', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='teamy.hrac')),
                ('zapas', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='zapasy.zapas')),
            ],
        ),
    ]
