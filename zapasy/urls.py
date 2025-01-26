from django.urls import path
from . import views
from django.contrib.auth import views as auth_views


urlpatterns = [
    path('', views.home, name='home'),
    #path('logout/', auth_views.LogoutView.as_view(views.home), name="home"),
    path('zapas/<int:zapas_id>/', views.zapas, name='zapas'),
    #path('<int:zapas_id>/', views.detail, name='detail'),
    #path('<int:zapas_id>/results/', views.results, name='results'),
    #path('<int:zapas_id>/vote/', views.vote, name='vote'),
]