Vagrant.configure(2) do |config|
  config.vm.box = "ubuntu/trusty64"

  config.vm.provision "setup", type: "shell", path: "setup/setup.sh", privileged: false

  config.vm.provision "db", type: "shell", path: "setup/db.sh"

  config.vm.provision "alias", type: "shell", path: "setup/alias.sh", privileged: false

  config.vm.network "forwarded_port", guest: 8000, host: 8080

end