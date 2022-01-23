from django.urls import path
from . import views

urlpatterns = [
    path('version/', views.version, name='version'),
    path('firmware/for-radio/<str:radiomodel>/', views.FirmwareForRadio.as_view(), name='firmware_for_radio'),
    # path('<int:question_id>/', views.detail, name='detail'),
    # path('<int:question_id>/results/', views.results, name='results'),
    # path('<int:question_id>/vote/', views.vote, name='vote'),
]
