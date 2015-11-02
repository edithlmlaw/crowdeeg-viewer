"""create_user.py -- a tool for setting up groups of user accounts for studies 

Usage:
  create_user.py [options] <username> <password> [task_type=<tt>]


Options:
  -e                Expert User

Arguments:
  <username>        Unique username
  <password>        Password, recommend randomly generating these
"""

from docopt import docopt
import os
os.environ['DJANGO_SETTINGS_MODULE'] = 'settings'
from django.contrib.auth.models import User
from viewer.models import *
from pprint import pprint

def create_turker(username, password, task_type):
    u = User.objects.create_user(username, password=password)
    turker = Turker.objects.create(user=u)
    turker.task_type = task_type
    turker.save()

def create_expert(username, password):
    user = User.objects.create_user(username, password=password)
    user.is_superuser=True
    user.save()

if __name__ == '__main__':
    arguments = docopt(__doc__)
    if arguments['-e']:
        create_expert(arguments['<username>'], arguments['<password>'])
    else:
        create_turker(arguments['<username>'], arguments['<password>'], arguments.get('<task_type>', ''))