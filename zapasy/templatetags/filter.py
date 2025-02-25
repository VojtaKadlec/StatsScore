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