from .models import Liga
from sporty.models import Sport

def ligy(request):
    sporty = Sport.objects.all()
    ligy_podle_sportu = {sport: Liga.objects.filter(sport=sport) for sport in sporty}
    return {'ligy_podle_sportu': ligy_podle_sportu}

