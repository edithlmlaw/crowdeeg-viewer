from django.conf.urls import patterns, include, url, handler404, handler500
from django.contrib.staticfiles.urls import staticfiles_urlpatterns
from django.contrib import admin
admin.autodiscover()

urlpatterns = patterns('',
    url(r'^login/$', 'django.contrib.auth.views.login', {'template_name': 'registration/login.html'}, name='login'),
    url(r'logout/$', 'django.contrib.auth.views.logout', name='logout'),

    url(r'^eegdata/(?P<recording>[\w0-9]+)/(?P<start_time>\d+)/(?P<window_length>\d+)/', 'crowdspot.viewer.views.getEEGData'),
    
    # strictly for development purposes
    url(r'^viewer/$', 'crowdspot.viewer.views.expert', name='viewer'),
    url(r'^viewer/addfeature$', 'crowdspot.viewer.views.expertaddfeature', name='expertaddfeature'),
    url(r'^viewer/deletefeature$', 'crowdspot.viewer.views.deleteFeature', name='deleteFeature'),
    url(r'^viewer/getannotations/(?P<recording_name>([\w_]+))/(?P<window_start>(\d+))/(?P<window_end>(\d+))/$', 'crowdspot.viewer.views.getAnnotations', name='getAnnotations'),

    url(r'^$', 'crowdspot.viewer.views.index', name='index'),
)

handler404 = handler404
handler500 = handler500