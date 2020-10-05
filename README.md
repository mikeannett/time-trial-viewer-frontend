# time-trial-viewer-frontend
time-trial-viewer-frontend is used in conjunction with time-trial-viewer-server to create a Strava Flyby style visualisation of a Time Trial event using data from Strava. In a TT athletes set off individually at different times/days... or as we now say socially distant. This viewer places all athletes on the start line together as if they were taking place in a traditional race event.
## Getting Started
As these 2 projects work together these instructions cover both packages. You will need to install node.JS first.

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

ln -s $testroot/$front/dist static
```
At this point you will need to edit .env. The application caches Strava flyby data and you have to specify a directory for this... and of course create that directory. 
You may also want to adjust the port number for the service.

```
npm start
```
The frontend build is done using **parcel watch** to create the site payload. In this mode parcel doesn't exit, but watches for changes to the front end project. In this example we ln the dist directory (which parcel has just built) to that static directory in the server project. This is handy for dev.
You could choose to tweak this arrangement and use parcel to product a production build which you phycically copy to the server static folder.

## Setting up events.
Use the events.json structure in the server project to set up events and the strava activity ids that go with them. Strava activity ids can be gleaned from the Stava page for an activity:
```
https://www.strava.com/activities/3610014214
https://www.strava.com/activities/3610014214#2706986703427248041
```
In these 2 examples the activity id is the first number after **activities/** in the url... namely 3610014214.
The first activity for an event is used to derive start and end coordinates for the event as a whole, so be careful you pick a good one.
Some of the events I've done allow you to complete a whole circuit but without necessarily starting at the official start point. If you have althetes who've started at a different point in the loop, you can mark these with a - (minus) eg. **987654321,-3610014214,12345678,...**. The viewer will attempt to split up and ressemble these activities so that it looked like they started at the official start. 
## Setting up athletes
Out of the box the viewer will extract the althete's forename out of the flyby data. Strava allows althetes to manage privacy settings and activity visibility. Occasionally the viewer is able to access an activity, which due to these settings, appears as anonymous. In these situations the viewer constructs an "Unknown" name for them.
The viewer does allow you to set up your own names for athletes. Use the atheles.json structure in the server project do this. This allows you to map strava Athlete Ids to text entries. The Strava Athlete id is visble in the url of the athlete's home page.
```
https://www.strava.com/athletes/1630456
```
## More on events.json
An event can have the following attributes:
```
    {"name":"DP Hunter Wreck", 
        "checkpointer" : true, "folder" : "Dark Peak 2020",
        "start":[53.429587, -1.634768],"cps":[[53.432168, -1.676186],[53.442469, -1.682889],[53.445282, -1.687361],[53.439652, -1.666753],[53.436529, -1.640383]],
        "activities":[], "comment" : ""},
```
Attribute | Comment
--------- | -------
name | Required, the name of the event
Checkpointer | Optional true/false, ignored by this application, but is used to expose events to the Checkpointer mobile app.
folder | Optional, used to organise events into menu folders. If missing items are placed in the root.
start | Optional, used to indicate the start location of the event. If missing the start point of the first activity is used.
end | Optional, used to indicate the end location of the event. If missing the **start** value is used, if **start** is missing, the end point of the first activity is used.
cps[] | Optional, Checkpoint locations. If present this will be indicated on the map, and you will be able to run the animation from these checkpoints.
activities[] | Optional, Strava activities for this event. If missing this event will not appear in the menu.
comment | Optional, Not used.

All locations appear as [Latitude, Longditude] in decimal form. This convention is used to make it easy to copy and paste from Google/Bing maps.
