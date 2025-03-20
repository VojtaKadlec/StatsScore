from django.contrib import admin
from .models import Zapas, Liga

@admin.register(Zapas)
class ZapasAdmin(admin.ModelAdmin):
    list_display = ('__str__', 'sport', 'datum', 'status')
    autocomplete_fields = ['domaci', 'hoste']
    list_filter = ('status', 'sport')
    search_fields = ('domaci__jmeno', 'hoste__jmeno', 'domaci__sport__nazev', 'hoste__sport__nazev')
    readonly_fields = ('start_time', 'pause_time', 'elapsed_time')
    
    def save_model(self, request, obj, form, change):
        if not change:
            obj.status = "nadchazejici"
        super().save_model(request, obj, form, change)

@admin.register(Liga)
class LigaAdmin(admin.ModelAdmin):
    list_display = ('jmeno', 'sport')
    search_fields = ('jmeno',)
    filter_horizontal = ('zapasy',)