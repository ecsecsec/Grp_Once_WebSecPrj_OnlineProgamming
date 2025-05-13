from django.urls import path
from . import views

urlpatterns = [
    path('', views.problem_list, name='problem_list'),
    path('<int:pk>/', views.problem_detail, name='problem_detail'),
    path('create/', views.create_problem, name='create_problem'),
]
