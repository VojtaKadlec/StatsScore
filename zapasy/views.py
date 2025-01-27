from django.shortcuts import render, get_object_or_404
from .models import Zapas, Liga
from stats.models import Stats
from sporty.models import Sport

def index(request):
    return render(request, 'zapasy/base.html')

def home(request):
    sporty = Sport.objects.all()
    ligy_podle_sportu = {sport: Liga.objects.filter(sport=sport) for sport in sporty}
    return render(request, 'zapasy/home.html', {'ligy_podle_sportu': ligy_podle_sportu})

def zapas(request, zapas_id):
    zapas = get_object_or_404(Zapas, id=zapas_id)
    stats = Stats.objects.filter(zapas=zapas)
    return render(request, 'zapasy/detail.html', {'zapas': zapas, 'stats': stats})

def liga(request, liga_id):
    liga = get_object_or_404(Liga, id=liga_id)
    zapasy = liga.zapasy.all()
    return render(request, 'zapasy/liga.html', {'liga': liga, 'zapasy': zapasy})