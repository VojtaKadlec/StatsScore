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

@register.filter
def team_stats(stats, team):
    team_player_ids = [player.id for player in team.hraci.all()]
    team_stats = {
        'goals': sum(stat.goly for stat in stats if stat.hrac.id in team_player_ids),
        'yellow_cards': sum(stat.zlute_karty for stat in stats if stat.hrac.id in team_player_ids),
        'penalty_minutes': sum(stat.trestne_minuty for stat in stats if stat.hrac.id in team_player_ids)
    }
    return team_stats