from fabric.api import env, cd, require, local, sudo, put
from fabric.contrib.project import rsync_project
from fabric.contrib.console import confirm
from fabric.operations import prompt
from fabric.network import prompt_for_password
from fabric.context_managers import hide
import sys, os

PROJECT_NAME = 'crowdspot'

LOCAL_DIR = './'
ABS_LOCAL_DIR = os.path.dirname(os.path.abspath(__file__))
CODE_ROOT = '/var/www/%s-production' % PROJECT_NAME
TEST_CODE_ROOT = '/var/www/%s-testing' % PROJECT_NAME
PROJECT_FOLDER = PROJECT_NAME
SERVER_HOST = 'eeg.crowdresearch.ca'
COVERAGE_REPORT_DIR_NAME = 'coverage_report'


def production(user):
    '''
    set the environment for production server
    '''
    confirm("You are about to alter the PRODUCTION environment! Continue?")
    env.environment = 'production'
    env.hosts = [SERVER_HOST]
    env.user = user
    env.code_root = CODE_ROOT
    env.doc_root = CODE_ROOT + '/htdocs'


def testing(user):
    '''
    set the environment for testing server
    '''
    env.environment = 'testing'
    env.hosts = [SERVER_HOST]
    env.user = user
    env.code_root = TEST_CODE_ROOT
    env.doc_root = TEST_CODE_ROOT + '/htdocs'


def env_run(cmd):
    '''
    runs a command using virtualenv env
    '''
    sudo('source %s/env/bin/activate && %s' % (env.code_root, cmd))


def update_requirements():
    '''
    updates virtual environmnet with requirements
    '''
    with cd(env.code_root):
        #env_run('pip install -r ./.bootstrap.d/%s/requirements.txt' % env.environment)
        sudo('pip install -r ./.bootstrap.d/%s/requirements.txt' % env.environment)
        sudo('source %s/env/bin/activate' % env.code_root)

def sync():
    '''
    use rsync_project to sync files between local and server
    '''
    # Verifies that we are in the correct directory.
    fabfile_name = local('ls', capture=True)
    if 'fabfile.py' not in fabfile_name:
        print "You must run the Fabric script from the directory with fabfile.py in it!!" + fabfile_name
        sys.exit(1)

    require('code_root', provided_by=('production'))

    rsync_project(env.code_root, LOCAL_DIR, delete=True, extra_opts="-l",
                  exclude=('env',
                           '*.sublime*',
                           '*.pyc', '*.git', '*.gitignore',
                           '.coverage', COVERAGE_REPORT_DIR_NAME,
                           '%s/wsgi.py' % PROJECT_FOLDER,
                           '%s/local_settings.py' % PROJECT_FOLDER,
                           '%s/static' % PROJECT_FOLDER,
                           '%s/migrations' % PROJECT_FOLDER,
                           '%s/build' % PROJECT_FOLDER))


def bootstrap():
    '''
    bootstrap the server with virtualenv and proper pip installations
    according to requirements.txt
    '''
    sync()
    with cd(env.code_root):
        sudo('./bootstrap %s' % env.environment)


def touch():
    '''
    touch wsgi file to trigger site reload
    '''
    with cd(env.code_root):
        sudo('touch %s/wsgi.py' % PROJECT_FOLDER)


def manage(cmd):
    '''
    helper for manage.py
    '''
    sudo('python %s/manage.py %s' % (env.code_root, cmd))


def syncdb():
    '''
    python manage.py syncdb
    '''
    manage('syncdb')


def migrate():
    '''
    use South to migrate
    '''
    manage('migrate')


def collect_static():
    manage('collectstatic')


def restart_server():
    '''
    Restart the Apache2 server.
    '''
    sudo('apachectl graceful')

def copyStatic():
    with cd('%s/%s'%(env.code_root, PROJECT_NAME)):
        sudo('cp -r sitestatics static')

def deploy():
    bootstrap()
    sync()
    update_requirements()
    collect_static()
    copyStatic()
    restart_server()


def deploysimple():
    '''
    Deploys site without syncing or migrating database.
    '''
    sync()
    #update_requirements()
    collect_static()
    restart_server()
