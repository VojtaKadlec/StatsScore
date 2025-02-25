from django.urls import path
from . import views

urlpatterns = [
    path('', views.home, name='home'),
    path('zapas/<int:zapas_id>/', views.zapas, name='zapas'),
    path('liga/<int:liga_id>/', views.liga, name='liga'),
    path('control/<int:zapas_id>/', views.control_match, name='control_match'),
]
