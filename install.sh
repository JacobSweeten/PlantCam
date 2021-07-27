#!/bin/bash

mainDir=`pwd`

nodeDistPath="https://unofficial-builds.nodejs.org/download/release/v14.17.3/"
nodeDistFile="node-v14.17.3-linux-armv6l"

userdel plantcam

if [[ $EUID -ne 0 ]]; then
	echo "Please run as root!"
	exit 1
fi

apt update

if [[ $? -ne 0 ]]; then
	echo "Error updating repositories."
	exit 1
fi

apt install -y libgd-tools libgd3 libgd-dev git curl

if [[ $? -ne 0 ]]; then
	echo "Error installing dependencies."
	exit 1
fi

git clone https://github.com/fsphil/fswebcam.git

if [[ $? -ne 0 ]]; then
	echo "Failed to clone fswebcam repository."
	exit 1
fi

cd fswebcam
./configure --prefix=/usr
make
make install
cd ..
rm -R fswebcam

if [[ $? -ne 0 ]]; then
	echo "fswebcam installation failed."
	exit
fi

if [ `uname -m` = "armv6l" ]; then
	cd $mainDir
	curl "$nodeDistPath""$nodeDistFile".tar.gz --output node-dist.tar.gz
	tar -xzf node-dist.tar.gz
	rm node-dist.tar.gz
	cd "$nodeDistFile"
	cp -a bin/. /usr/bin/
	cp -a include/. /usr/include/
	cp -a lib/. /usr/lib/
	cp -a share/. /usr/share/
	cd ..
	rm -R "$nodeDistFile"
else	
	curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
	apt install -y nodejs

	if [[ $? -ne 0 ]]; then
		echo "Failed to install NodeJS"
		exit 1
	fi
fi

useradd -r -s /bin/false plantcam
usermod -a -G video plantcam

if [[ $? -ne 0 ]]; then
	echo "Failed to create user"
	exit 1
fi

cp -R ./Node /plantcam
cd /plantcam
npm install
chown -R plantcam:plantcam /plantcam

cp "$mainDir/"plantcam.service /etc/systemd/system/plantcam.service
systemctl enable plantcam.service

if [[ $? -ne 0 ]]; then
	echo "Failed to enable service."
	exit 1
fi

echo "Install complete"
