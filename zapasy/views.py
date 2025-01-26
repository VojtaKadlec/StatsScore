from django.shortcuts import render
from .models import Zapas
from stats.models import Stats

def index(request):
    return render(request, 'zapasy/base.html')

def home(request):
    return render(request, 'zapasy/home.html')

def zapas(request, zapas_id):
    zapas = Zapas.objects.get(id=zapas_id)
    stats = Stats.objects.filter(zapas=zapas)
    return render(request, 'zapasy/detail.html', {'zapas': zapas, 'stats': stats})