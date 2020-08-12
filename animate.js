import playIcon from './play_512x512.png';
import stopIcon from './stop_64x64.png';
import Point from 'ol/geom/Point';
import Feature from 'ol/Feature';
import {Circle as CircleStyle, Fill, Icon, Stroke, Style} from 'ol/style';
import {Vector as VectorLayer} from 'ol/layer';
import {Vector as VectorSource} from 'ol/source';
import {getDistance} from 'ol/sphere';
import {transform} from 'ol/proj';
import {map,activities,oneLayer,getLayer} from './index.js'

var startButton;
export var startFromDropdown;

const animationLayerName='animate';

// return 2 digit string with leading zeros
function twoDigit(num){
    if (num<10) return '0'+num;
    return num.toString();
}

// return a formatted time string hh:mm:ss
function timeString(seconds){
    const hh=Math.trunc(seconds / 3600);
    const mm=Math.trunc( (seconds-hh*3600)/60);
    const ss=seconds%60;
  
    return twoDigit(hh) + ':' + twoDigit(mm) + ':' + twoDigit(ss);
}

function haversine(point1, point2)
{
    const lat1 = point1[1];
    const lat2 = point2[1];
    const lon1 = point1[0];
    const lon2 = point2[0];
    const R = 6371e3; // metres
    const φ1 = lat1 * Math.PI/180; // φ, λ in radians
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lon2-lon1) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    const d = R * c; // in metres

    return d;
}

// calculate distance between 2 points
function calDist(point1, point2) {
    return haversine(point1,point2) /*getDistance(point1,point2);*/
}

// Find the index for the closes point in an activity to the supplied point in the first half of the route
function findStartPoint(point, activity, startAt, stopAt) {
    var besti=startAt;
    var bestDist=100000000.1;
    const activityRoute= activity.activityRoute;
  
    for (let i=startAt; i<stopAt; i++)
    {

        const p=activity.activityRoute[i];
        const dist=calDist(p,point);
        if (dist < bestDist)
        {
            besti=i;
            bestDist=dist;
        }
    }
    // if we didn't find anthing within 100m then return start
    if (bestDist > 100)
    {
        console.log( `activity ${activity.stravaActivityId} ${bestDist}m from start`); 
        return startAt;
    } else return besti;
}

function findAnimationStartPoint(pointIndex, points, activity) {
    var result=findStartPoint(points[0].point, activity, 0, activity.activityRoute.length/2);
    for(var i=1; i<=pointIndex; i++) {
        result=findStartPoint(points[i].point, activity, result, activity.activityRoute.length);
    }
    return result;
}

// Find the index for the closes point in an activity to the supplied point in the second half of the route
function findEndPoint(point, activity) {
    var besti=0;
    var bestDist=100000000.1;
    const activityRoute=activity.activityRoute;

    besti=activityRoute.length;

    for (let i=activityRoute.length-1; i>activityRoute.length/2; i--)
    {

        const p=activity.activityRoute[i];
        const dist=calDist(p,point);
        if (dist < bestDist)
        {
            besti=i;
            bestDist=dist;
        }
    }
    // if we didn't find anthing within 100m then return end
    return bestDist < 100 ? besti : activityRoute.length-1;
}

// start the animation of athletes' markers
function startAnimation() {
    var primaryActivityIndex=0;

    for (let i=0; i<activities.length; i++) {
        if (activities[i].primary) primaryActivityIndex=i;
    }

    const primaryActivity=activities[primaryActivityIndex];
    const thisEvent=primaryActivity.thisEvent;
    const primaryRouteCoordinates=primaryActivity.activityLineString.getCoordinates();

    var startPoint=thisEvent.start;
    const pointIndex=startFromDropdown.value;
    const endPoint=thisEvent.end;

    if (thisEvent.points.length == 0) {
        pointIndex=0;
        thisEvent.points.push({name:"Start", point:thisEvent.start})
    }
    else {
        startPoint=thisEvent.points[pointIndex].point;
    }

    animating = true;

    stopImage();

    for (let i=0; i<activities.length; i++)
    {
        const activity=activities[i];
        
        activity.lastRouteIndex=findAnimationStartPoint(pointIndex, thisEvent.points, activity);
        activity.StopRouteIndex=findEndPoint(endPoint, activity)
        activity.startRouteTime=activity.times[activity.lastRouteIndex];
        activity.lastRouteTime=activity.startRouteTime;
        activity.lastClock = new Date().getTime();
        animationCount++;
    }
    populateAnimationLayer();
    myTimer = setInterval( moveFeatures, 100);

    map.render();
}
  
// stop endpending on ended either one or all animations
export function stopAnimation(ended,activity) {
    if (ended) {    
      animationCount--;
      if (animationCount > 0) return;
    }
  
    {
      animating = false;
      playImage();
      clearInterval(myTimer);
      destroyAnimationLayer();
    }
}

// start (and stop) the animation of athletes' markers
function startButtonCallback() {
    if (animating) 
      stopAnimation(false);
    else
      startAnimation();
}

function playImage() {
    removeChildren(startButton);
    const startButtonImage = document.createElement('img');
    startButtonImage.src=playIcon;
    startButtonImage.width=9;
    startButtonImage.height=9;
    startButton.appendChild(startButtonImage);
}

function stopImage() {
    removeChildren(startButton);
    const startButtonImage = document.createElement('img');
    startButtonImage.src=stopIcon;
    startButtonImage.width=9;
    startButtonImage.height=9;
    startButton.appendChild(startButtonImage);
}

function setupAnimationControls()
{
    const animationsDiv = document.getElementById('animations');
    
    const sliderLabel =  document.createElement('label');
    sliderLabel.innerHTML = 'speed:&nbsp;<input id="speed" type="range" min="0" max="300" step="5" value="30">';
    animationsDiv.appendChild(sliderLabel); 

    startFromDropdown = document.createElement('select');
    startFromDropdown.id = 'startfrom';
    animationsDiv.appendChild(startFromDropdown); 

    startButton =  document.createElement('button');
    startButton.id = "start-animation";
    playImage();
    animationsDiv.appendChild(startButton); 
    startButton.addEventListener('click', startButtonCallback, false);

    const elapsedTimeDiv =  document.createElement('div');
    elapsedTimeDiv.id="time";
    elapsedTimeDiv.innerHTML="<p>&nbsp;</p>";
    animationsDiv.appendChild(elapsedTimeDiv); 
}

function removeChildren( element ) {
    while (element.firstChild) {
        element.removeChild(element.lastChild);
    }

}

function addStartFromOption(name, value) {
    const startOption=document.createElement('option');
    startOption.innerText=name;
    startOption.value=value;
    startFromDropdown.appendChild(startOption);
}

export function populateStartFrom(points) {
    removeChildren(startFromDropdown);
    if (points.length == 0)
    {
        addStartFromOption( "Start", 0 );
        return;
    }

    for (var i=0; i<points.length; i++)
    {
        addStartFromOption(points[i].name, i);
    }
}

// function to configure a startup button
export function setupAnimation()
{
    animating = false;
    animationCount = 0;

    setupAnimationControls();
}

// create animation layer.
export function createAnimationLayer() {
    return new VectorLayer({
        updateWhileAnimating: true,
        updateWhileInteracting: true,
        source: new VectorSource({}),
        name: animationLayerName 
      });
}

// Closure items used by animation code
var animationLayer;
var iconFeatures;
var animationCount;
export var animating;
var myTimer;

// Create an on-top layer holding the athletes icons at their start possitions
function populateAnimationLayer() {
   const vectorSource = new VectorSource({});

   iconFeatures = [];
   for (var i=0; i<activities.length; i++)
   {
       const activity=activities[i];
       const athleteSVGHTML=activity.athleteSVG.outerHTML.replace("#", "%23");  // OL doesn't like # in uri
       const routeCoordinates=activity.activityLineString.getCoordinates();
       const geo = routeCoordinates[activity.lastRouteIndex];

       const iconFeature=new Feature({
        geometry: new Point(geo) });

       const athleteStyle =  new Style({
           image: new Icon({
               src: 'data:image/svg+xml;utf8,' + athleteSVGHTML 
           })
       });

       iconFeature.setStyle(athleteStyle);
       vectorSource.addFeature(iconFeature);
       iconFeatures.push(iconFeature);
   }

   if (oneLayer) {
    animationLayer = getLayer(animationLayerName);
    activityLayer.addSource(activityFeature);
   } else {
    animationLayer = new VectorLayer({
        source: vectorSource,
        updateWhileAnimating: true,
        updateWhileInteracting: true,
    });

    map.getLayers().push(animationLayer);
   }

   map.render();
}

// timer callback function to move athletes' markers to create an animation
function moveFeatures() {
    const speedInput = document.getElementById('speed');
    const nowClock = new Date().getTime();

    for (let i=0; i<iconFeatures.length; i++) {
        const activity = activities[i];
        const routeCoordinates=activity.activityLineString.getCoordinates();
        const routeLength=activity.StopRouteIndex;
        const lastRouteTime=activity.lastRouteTime;
        const lastRouteIndex=activity.lastRouteIndex

        if ((lastRouteIndex+1) < routeLength) {
            // Work out how much the clock has advanced since we last moved the marker
            const elapsedClock = nowClock - activity.lastClock;
            // Convert that into seconds using the speed slider as a multiplier
            const deltaRouteSeconds = Math.round(speedInput.value * elapsedClock / 1000);

            // Work out what time this would be for our route
            const newRouteTime=lastRouteTime+deltaRouteSeconds;
    
            // Check our route to see if the any new points have been reached in this time
            var newRouteIndex=lastRouteIndex;
            for (let j=lastRouteIndex+1; j<activity.times.length; j++)
            {
                if (activity.times[j] > newRouteTime)
                {  
                    break;
                }
                newRouteIndex=j;
            }

            // display how much time has passed since we started animating
            const el=document.getElementById( 'time');
            el.innerHTML = '<p>'+timeString(newRouteTime-activity.startRouteTime)+'</p>'
        
            // if enough time has passed for us to move the marker
            if (newRouteIndex > lastRouteIndex)
            {
                const deltaX=routeCoordinates[newRouteIndex][0]-routeCoordinates[activity.lastRouteIndex][0];
                const deltaY=routeCoordinates[newRouteIndex][1]-routeCoordinates[activity.lastRouteIndex][1];
        
                iconFeatures[i].getGeometry().translate(deltaX, deltaY);

                activity.lastRouteIndex=newRouteIndex
                activity.lastRouteTime=newRouteTime;
                activity.lastClock=nowClock;
            }
        
            // check to see if we've reached the end.
            if ((newRouteIndex+1) >= routeLength) {
                stopAnimation(true, activity);
            }
        }
    }
    
    // console.log(new Date().getTime()- nowClock + 'ms');  // telemetry to help understand exection time so we can fine tune the timer
}

// remove the animation layer
function destroyAnimationLayer() {
    if (!oneLayer) {
        if (animationLayer)
            animationLayer.getSource().clear();
    } else {
        map.removeLayer(animationLayer);
        map.render();
    }
 }

 // Assuming the activity was circular but not started from the same point as everyone else... reorganise it so it starts and finishes at the same point as everyone else.
 export function cutAndShut(point, activity) {
    const len=activity.activityRoute.length;
    const startPoint=findStartPoint(point, activity, 0, len-1);

    if (startPoint==0) return;

    {
        const ar=new Array(len);
        let j=0;
        for (let i=startPoint; i<len;i++) ar[j++]=activity.activityRoute[i];
        for (let i=0; i<startPoint;i++) ar[j++]=activity.activityRoute[i];
        activity.activityRoute=ar;
    }
    {
        const t=new Array(len);
        const delta=activity.times[len-1]-activity.times[0];
        let j=0;
        for (let i=startPoint; i<len;i++) t[j++]=activity.times[i];
        for (let i=0; i<startPoint;i++) t[j++]=activity.times[i]+delta;
        activity.times=t;
    }
 }