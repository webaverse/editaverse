#!/bin/bash

#give permission for everything in the express-app directory
sudo chmod -R 777 /home/ubuntu/editaverse

#navigate into our working directory where we have all our github files
cd /home/ubuntu/editaverse


#install node modules
npm install

#start our node app in the background using PM2
#pm2 --name editaverse start "npm run dev"
pm2 restart editaverse