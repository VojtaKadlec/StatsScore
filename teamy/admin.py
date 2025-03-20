from django.contrib import admin
from .models import Team, Hrac

@admin.register(Team)
class TeamAdmin(admin.ModelAdmin):
    list_display = ('jmeno', 'sport')
    search_fields = ('jmeno', 'sport__nazev')
    filter_horizontal = ('hraci',)
    search_help_text = "Vyhledávání podle jména týmu nebo sportu"
    
    def get_search_results(self, request, queryset, search_term):
        queryset, use_distinct = super().get_search_results(request, queryset, search_term)
        return queryset, use_distinct

@admin.register(Hrac)
class HracAdmin(admin.ModelAdmin):
    list_display = ('jmeno', 'cislo')
    search_fields = ('jmeno', 'cislo')