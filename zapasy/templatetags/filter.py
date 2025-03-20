from django import template

register = template.Library()

@register.filter
def get_stat(player_stats, player_id):
    return player_stats.get(player_id, {"goly": 0, "zlute_karty": 0, "trestne_minuty": 0})

@register.filter
def div(value, arg):
    return int(value) // int(arg)

@register.filter
def mod(value, arg):
    return int(value) % int(arg)

@register.filter
def mul(value, arg):
    return value * arg

@register.filter
def sum_goals(stats, team):
    team_player_ids = [player.id for player in team.hraci.all()]
    total_goals = sum(
        stat.goly for stat in stats if stat.hrac.id in team_player_ids
    )
    return total_goals

from django import template
register = template.Library()

@register.filter
def get_stat(player_stats, player_id):
    return player_stats.get(player_id, {"goly": 0, "zlute_karty": 0, "trestne_minuty": 0, "penalty_total_count": 0, "disqualified": False})

@register.filter
def div(value, arg):
    return int(value) // int(arg)

@register.filter
def mod(value, arg):
    return int(value) % int(arg)

@register.filter
def mul(value, arg):
    return value * arg

@register.filter
def sum_goals(stats, team):
    if isinstance(stats, dict) and 'player_stats' in stats:
        player_stats = stats['player_stats']
        team_player_ids = [str(player.id) for player in team.hraci.all()]
        total_goals = sum(
            int(player_stats[player_id]['goly']) 
            for player_id in player_stats 
            if player_id in team_player_ids
        )
        return total_goals
    else:
        team_player_ids = [player.id for player in team.hraci.all()]
        total_goals = sum(
            stat.goly for stat in stats if stat.hrac.id in team_player_ids
        )
        return total_goals

@register.filter
def team_stats(stats, team):
    if isinstance(stats, dict) and 'player_stats' in stats:
        player_stats = stats['player_stats']
        team_player_ids = [str(player.id) for player in team.hraci.all()]
        team_stats = {
            'goals': sum(int(player_stats[player_id]['goly']) for player_id in player_stats if player_id in team_player_ids),
            'yellow_cards': sum(int(player_stats[player_id]['zlute_karty']) for player_id in player_stats if player_id in team_player_ids),
            'penalty_minutes': sum(int(player_stats[player_id]['trestne_minuty']) for player_id in player_stats if player_id in team_player_ids)
        }
    else:
        team_player_ids = [player.id for player in team.hraci.all()]
        team_stats = {
            'goals': sum(stat.goly for stat in stats if stat.hrac.id in team_player_ids),
            'yellow_cards': sum(stat.zlute_karty for stat in stats if stat.hrac.id in team_player_ids),
            'penalty_minutes': sum(stat.trestne_minuty for stat in stats if stat.hrac.id in team_player_ids)
        }
    return team_stats
