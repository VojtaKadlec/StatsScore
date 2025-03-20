import datetime
import json
from django.contrib.auth.decorators import login_required, user_passes_test
from django.shortcuts import get_object_or_404, redirect, render
from django.utils import timezone
from django.http import JsonResponse

from sporty.models import Sport
from stats.models import Stats
from teamy.models import Hrac
from .forms import CardForm, GoalForm
from .models import Liga, Zapas


def index(request):
    return render(request, 'zapasy/base.html')

def home(request):
    sporty = Sport.objects.all()
    ligy_podle_sportu = {sport: Liga.objects.filter(sport=sport) for sport in sporty}
    return render(request, 'zapasy/home.html', {'ligy_podle_sportu': ligy_podle_sportu})

def zapas(request, zapas_id):
    zapas = get_object_or_404(Zapas, id=zapas_id)
    stats = Stats.objects.filter(zapas=zapas)
    
    elapsed_time = zapas.elapsed_time
    if zapas.status == 'probihajici' and zapas.start_time:
        current_session_time = int((timezone.now() - zapas.start_time).total_seconds())
        elapsed_time += current_session_time
    
    timer_running = zapas.status == 'probihajici'
    
    player_stats = {stat.hrac_id: stat for stat in stats}

    active_penalties = get_active_penalties(zapas, player_stats)
    
    if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
        player_stats_data = {}
        for player_id, stat in player_stats.items():
            player_stats_data[player_id] = {
                'goly': stat.goly,
                'zlute_karty': stat.zlute_karty,
                'trestne_minuty': stat.trestne_minuty,
                'penalty_total_count': getattr(stat, 'penalty_total_count', 0),
                'disqualified': stat.disqualified
            }
        
        domaci_stats = get_team_stats(stats, zapas.domaci)
        hoste_stats = get_team_stats(stats, zapas.hoste)
        
        return JsonResponse({
            'status': zapas.status,
            'status_display': zapas.get_status_display(),
            'timer_running': timer_running,
            'elapsed_time': elapsed_time,
            'player_stats': player_stats_data,
            'domaci_stats': domaci_stats,
            'hoste_stats': hoste_stats
        })
    
    return render(request, 'zapasy/detail.html', {
        'zapas': zapas, 
        'stats': stats,
        'player_stats': player_stats,
        'timer_running': timer_running,
        'elapsed_time': elapsed_time,
        'active_penalties': active_penalties
    })


def get_team_stats(stats, team):
    team_players = team.hraci.all()
    team_player_ids = [player.id for player in team_players]
    team_stats = {
        'goals': sum(stat.goly for stat in stats if stat.hrac_id in team_player_ids),
        'yellow_cards': sum(stat.zlute_karty for stat in stats if stat.hrac_id in team_player_ids),
        'penalty_minutes': sum(stat.trestne_minuty for stat in stats if stat.hrac_id in team_player_ids)
    }
    return team_stats

def get_active_penalties(zapas, player_stats):
    active_penalties = []
    
    for player_id, stat in player_stats.items():
        if stat.trestne_minuty > 0 and stat.penalty_start_time and zapas.sport.jmeno != 'fotbal':
            player = get_object_or_404(Hrac, id=player_id)
            
        
            elapsed = timezone.now() - stat.penalty_start_time
            penalty_duration = datetime.timedelta(minutes=stat.trestne_minuty)
            
            if elapsed < penalty_duration:
                remaining_seconds = (penalty_duration - elapsed).total_seconds()
                remaining_minutes = remaining_seconds / 60
                
                team_type = 'Domácí' if player in zapas.domaci.hraci.all() else 'Hosté'
                
                active_penalties.append({
                    'player_id': player_id,
                    'player_number': player.cislo,
                    'player_name': player.jmeno,  
                    'team_type': team_type,
                    'team_color': 'primary' if team_type == 'Domácí' else 'danger', 
                    'remaining_minutes': remaining_minutes
                })
    
    return active_penalties

def liga(request, liga_id):
    liga = get_object_or_404(Liga, id=liga_id)
    zapasy = liga.zapasy.all()
    return render(request, 'zapasy/liga.html', {'liga': liga, 'zapasy': zapasy})

@login_required
@user_passes_test(lambda u: u.is_superuser)
def control(request, zapas_id):
    zapas = get_object_or_404(Zapas, id=zapas_id)
    
   
    players = list(zapas.domaci.hraci.all()) + list(zapas.hoste.hraci.all())
    for player in players:
        Stats.objects.get_or_create(zapas=zapas, hrac=player)
    
  
    stats = Stats.objects.filter(zapas=zapas)
    player_stats = {stat.hrac.id: stat for stat in stats}
    
    timer_running = zapas.status == 'probihajici'
    elapsed_time = zapas.elapsed_time
    
    if request.method == 'POST':
        action = request.POST.get('action')
        if action == 'start':
            if zapas.status == 'nadchazejici':
                zapas.status = 'probihajici'
                zapas.start_time = timezone.now()
                zapas.save()
                timer_running = True
            elif zapas.status == 'paused':
                zapas.status = 'probihajici'
                zapas.start_time = timezone.now()  
                zapas.pause_time = None
                zapas.save()
                timer_running = True
        elif action == 'pause':
            if zapas.status == 'probihajici':
                current_session_time = int((timezone.now() - zapas.start_time).total_seconds())
                zapas.elapsed_time += current_session_time
                zapas.pause_time = timezone.now()
                zapas.status = 'paused'
                zapas.save()
                timer_running = False
        elif action == 'end':
            if zapas.status == 'probihajici':
                current_session_time = int((timezone.now() - zapas.start_time).total_seconds())
                zapas.elapsed_time += current_session_time
            zapas.status = 'ukoncene'
            zapas.save()
            timer_running = False
        elif action == 'update_stats':
            player_id = int(request.POST.get('hrac'))
            stat = player_stats.get(player_id)
            
            if stat:
                previous_penalty = stat.trestne_minuty
                
                stat.goly = int(request.POST.get('goly', 0))
                
                if 'zlute_karty' in request.POST:
                    stat.zlute_karty = int(request.POST.get('zlute_karty', 0))
                
                if 'trestne_minuty' in request.POST:
                    new_penalty = int(request.POST.get('trestne_minuty', 0))
                    stat.trestne_minuty = new_penalty
                    
                    if new_penalty > previous_penalty and new_penalty > 0:
                        stat.penalty_start_time = timezone.now()
                        
                        if zapas.sport.jmeno == 'hazena':
                            stat.penalty_total_count += 1
                            if stat.penalty_total_count >= 3:
                                stat.disqualified = True
                
                stat.disqualified = request.POST.get('disqualified') == 'on'
                
                stat.save()
        elif action == 'reset_penalty':
            player_id = int(request.POST.get('hrac'))
            stat = player_stats.get(player_id)
            
            if stat:
                stat.trestne_minuty = 0
                stat.penalty_start_time = None
                stat.save()
            
            return JsonResponse({
                'success': True,
                'player_id': player_id,
                'message': 'Penalty reset successfully',
                'stats': {
                    'goly': stat.goly,
                    'zlute_karty': stat.zlute_karty,
                    'trestne_minuty': 0,
                    'disqualified': stat.disqualified
                }
            })
        
        calculated_elapsed_time = zapas.elapsed_time
        if zapas.status == 'probihajici' and zapas.start_time:
            current_session_time = int((timezone.now() - zapas.start_time).total_seconds())
            calculated_elapsed_time += current_session_time
        
        if request.headers.get('X-Requested-With') == 'XMLHttpRequest' or 'action' in request.POST:
            player_stats_data = {}
            for player_id, stat in player_stats.items():
                player_stats_data[player_id] = {
                    'goly': stat.goly,
                    'zlute_karty': stat.zlute_karty,
                    'trestne_minuty': stat.trestne_minuty,
                    'penalty_total_count': getattr(stat, 'penalty_total_count', 0),
                    'disqualified': stat.disqualified
                }
            
            domaci_score = sum(stat.goly for player_id, stat in player_stats.items() 
                               if player_id in [p.id for p in zapas.domaci.hraci.all()])
            hoste_score = sum(stat.goly for player_id, stat in player_stats.items() 
                              if player_id in [p.id for p in zapas.hoste.hraci.all()])
            
            return JsonResponse({
                'status': zapas.status,
                'status_display': zapas.get_status_display(),
                'timer_running': timer_running,
                'elapsed_time': calculated_elapsed_time,
                'player_stats': player_stats_data,
                'teams_score': {
                    'domaci_score': domaci_score,
                    'hoste_score': hoste_score
                }
            })
    
    calculated_elapsed_time = elapsed_time
    if zapas.status == 'probihajici' and zapas.start_time:
        current_session_time = int((timezone.now() - zapas.start_time).total_seconds())
        calculated_elapsed_time += current_session_time
    
    active_penalties = []
    for player_id, stat in player_stats.items():
        if stat.trestne_minuty > 0 and stat.penalty_start_time:
            elapsed = timezone.now() - stat.penalty_start_time
            penalty_duration = datetime.timedelta(minutes=stat.trestne_minuty)
            
            if elapsed < penalty_duration:
                remaining_seconds = (penalty_duration - elapsed).total_seconds()
                remaining_minutes = remaining_seconds / 60
                
                player = get_object_or_404(Hrac, id=player_id)
                team_type = 'Domácí' if player.team == zapas.domaci else 'Hosté'
                
                active_penalties.append({
                    'player_id': player_id,
                    'player_number': player.cislo,
                    'team_type': team_type,
                    'remaining_minutes': remaining_minutes
                })
    
    goal_form = GoalForm()
    card_form = CardForm()
    
    domaci_score = 0
    hoste_score = 0

    domaci_player_ids = [player.id for player in zapas.domaci.hraci.all()]
    hoste_player_ids = [player.id for player in zapas.hoste.hraci.all()]

    for player_id, stat in player_stats.items():
        if player_id in domaci_player_ids:
            domaci_score += stat.goly
        elif player_id in hoste_player_ids:
            hoste_score += stat.goly

    context = {
        'zapas': zapas,
        'player_stats': player_stats,
        'goal_form': goal_form,
        'card_form': card_form,
        'timer_running': timer_running,
        'elapsed_time': calculated_elapsed_time,
        'active_penalties': json.dumps(active_penalties),
        'domaci_score': domaci_score,
        'hoste_score': hoste_score
    }
    return render(request, 'zapasy/control.html', context)