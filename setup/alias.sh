APP_DB_USER=joshbradshaw
APP_DB_PASS=password
APP_DB_NAME=eeg
HOME=/home/vagrant
SHARED=/vagrant
PORT=0.0.0.0:8000

APP_PATH=$SHARED/crowdeeg-viewer/crowdspot

echo "create alias: db_login"
echo "alias db_login='PGUSER=$APP_DB_USER PGPASSWORD=$APP_DB_PASS psql -h localhost $APP_DB_NAME'" >> $HOME/.bashrc

echo "create alias: db_migrate"
echo "alias db_migrate='python $APP_PATH/manage.py migrate'" >> $HOME/.bashrc 

echo "create alias: create_user"
echo "alias create_user='python $APP_PATH/crowdspot/create_user.py user password'" >> $HOME/.bashrc 

echo "create alias: server"
echo "alias server='python $APP_PATH/manage.py runserver $PORT'" >> $HOME/.bashrc 
