import os, sys

sys.path.append('/var/www/crowdspot-testing/env/lib/python2.7/site-packages')
sys.path.append('/var/www/crowdspot-testing')
sys.path.append('/var/www/crowdspot-testing/crowdspot')

os.environ['DJANGO_SETTINGS_MODULE'] = 'crowdspot.settings'

#import django.core.handlers.wsgi
#application = django.core.handlers.wsgi.WSGIHandler()

from django.core.wsgi import get_wsgi_application
application = get_wsgi_application()
