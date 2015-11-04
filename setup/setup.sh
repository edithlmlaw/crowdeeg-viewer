SHARED=/vagrant
CONDA_VERSION=Anaconda2-2.4.0-Linux-x86_64.sh
CONDA=$HOME/$CONDA_VERSION

echo "updating ubuntu..."
sudo apt-get update -y > /dev/null

if [ ! -d "$HOME/anaconda/" ]
then
	echo "downloading conda..."
	wget -q https://3230d63b5fc54e62148e-c95ac804525aac4b6dba79b00b39d1d3.ssl.cf1.rackcdn.com/$CONDA_VERSION

	echo "installing conda..."
	sudo chmod +x $CONDA
	$CONDA -b -p $HOME/anaconda > /dev/null
	echo "export PATH='$HOME/anaconda/bin:$PATH'" > $HOME/.bashrc
	. ~/.bashrc

	echo "installing numpy..."
	conda install numpy -y > /dev/null
	echo "installing scipy..."
	conda install scipy -y > /dev/null
	echo "installing django..."
	conda install django -y > /dev/null
	echo "installing psycopg2..."
	conda install psycopg2 -y > /dev/null
	echo "installing pandas..."
	conda install pandas -y > /dev/null
	echo "installing docopt..."
	pip install docopt > /dev/null
	echo "installing fabric..."
	pip install fabric > /dev/null

fi

echo "installing postgres..."

sudo apt-get install postgresql -y > /dev/null

sudo sed -i "s/#listen_address.*/listen_addresses '*'/" /etc/postgresql/9.3/main/postgresql.conf

sudo bash -c 'cat >> /etc/postgresql/9.3/main/pg_hba.conf << EOF
  # Accept all IPv4 connections - FOR DEVELOPMENT ONLY!!!
  host    all         all         0.0.0.0/0             md5
EOF'

sudo service postgresql restart

echo "upgrading applications..."
sudo apt-get upgrade -y > /dev/null
