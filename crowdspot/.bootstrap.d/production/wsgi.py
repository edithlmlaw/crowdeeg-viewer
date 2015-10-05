import os, sys

sys.path.append('/var/www/crowdspot-production/env/lib/python2.7/site-packages')
sys.path.append('/var/www/crowdspot-production')
sys.path.append('/var/www/crowdspot-production/crowdspot')

os.environ['DJANGO_SETTINGS_MODULE'] = 'crowdspot.settings'

import django.core.handlers.wsgi
application = django.core.handlers.wsgi.WSGIHandler()
