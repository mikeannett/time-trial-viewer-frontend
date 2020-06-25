# time-trial-viewer-frontend
time-trial-viewer-frontend is used in conjunction with time-trial-viewer-frontend to create a Strava Flyby style visualisation of a Time Trial event. In TT athletes set off individually. This view places virtually all athletes on the start line together as if they were taking place in their own event.
##Getting Started
As these 2 projects work together these instructions cover both packages:

```
front=time-trial-viewer-frontend
server=time-trial-viewer-server
testroot=$PWD

git clone https://github.com/mikeannett/$front.git
cd $front
npm install
npm start &

cd $testroot
git clone https://github.com/mikeannett/$server.git
cd $server
npm install

cp athletes.example.json athletes.json
cp events.example.json events.json
cp .env.example .env

ln -s $testroot/$front/dist static```
