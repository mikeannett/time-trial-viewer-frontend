import Point from 'ol/geom/Point';
import Feature from 'ol/Feature';
import {Circle as CircleStyle, Fill, Icon, Stroke, Style} from 'ol/style';
import {Vector as VectorLayer} from 'ol/layer';
import {Vector as VectorSource} from 'ol/source';
import {getDistance} from 'ol/sphere';
import {transform} from 'ol/proj';
import {map,activities} from './index.js'

const startButton=document.getElementById('start-animation');

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

// FIXME need to remove usePoints
// switch between OL points and [lng,lat]
const usePoints=false;

// calculate distance between 2 pointss
function calDist(point1, point2) {
    var p1;
    var p2;
    if (usePoints)
    {
        p1=transform(point1.getCoordinates(), "EPSG:3857", "EPSG:4326") ;
        p2=transform(point2.getCoordinates(), "EPSG:3857", "EPSG:4326") ;
    } else {
        p1=point1;
        p2=point2;
    }
    return getDistance(p1,p2);
}

// Find the index for the closes point in an activity to the supplied point in the first half of the route
function findStartPoint(point, activity, stopAt) {
    var besti=0;
    var bestDist=100000000.1;
    var activityRoute;
    if (usePoints) {
        activityRoute = activity.activityLineString.getCoordinates();
    } else {
        activityRoute = activity.activityRoute;
    }
  
    for (let i=0; i<stopAt; i++)
    {
        var p;
        if (usePoints) {
            p=new Point(activityRoute[i])
        } else {
            p=activity.activityRoute[i];
        }
        const dist=calDist(p,point);
        if (dist < bestDist)
        {
            besti=i;
            bestDist=dist;
        }
    }
    // if we didn't find anthing within 100m then return start
    return bestDist < 100 ? besti : 0;
}

// Find the index for the closes point in an activity to the supplied point in the second half of the route
function findEndPoint(point, activity) {
    var besti=0;
    var bestDist=100000000.1;
    var activityRoute;
    if (usePoints) {
        activityRoute = activity.activityLineString.getCoordinates();
    } else {
        activityRoute = activity.activityRoute;
    }
    besti=activityRoute.length;

    for (let i=activityRoute.length-1; i>activityRoute.length/2; i--)
    {
        var p;
        if (usePoints) {
            p=new Point(activityRoute[i])
        } else {
            p=activity.activityRoute[i];
        }
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

    for (let i=0; i<activities.length; i++)
    {
        if (activities[i].primary) primaryActivityIndex=i;
    }

    const primaryActivity=activities[primaryActivityIndex];
    const primaryRouteCoordinates=primaryActivity.activityLineString.getCoordinates();
    var startPoint;
    var endPoint;
    if (usePoints) {
        startPoint=new Point (primaryRouteCoordinates[0]);
        endPoint=new Point (primaryRouteCoordinates[primaryRouteCoordinates.length-1]);
    } else {
        startPoint=primaryActivity.activityRoute[0];
        endPoint=primaryActivity.activityRoute[primaryActivity.activityRoute.length-1];
    }
    animating = true;

    startButton.textContent = 'Cancel Animation';

    for (let i=0; i<activities.length; i++)
    {
        const activity=activities[i];
        activity.lastRouteIndex=findStartPoint(startPoint, activity, activity.activityRoute.length/2);
        activity.StopRouteIndex=findEndPoint(endPoint, activity)
        activity.startRouteTime=activity.times[activity.lastRouteIndex];
        activity.lastRouteTime=activity.startRouteTime;
        activity.lastClock = new Date().getTime();
        animationCount++;
    }
    createAnimationLayer();
    myTimer = setInterval( moveFeatures, 100);

    map.render();
}
  
// stop endpending on ended either one or all animations
function stopAnimation(ended,activity) {
    if (ended) {    
      animationCount--;
      if (animationCount > 0) return;
    }
  
    {
      animating = false;
      startButton.textContent = 'Start Animation';
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

// function to configure a startup button
export function setupAnimation()
{
    animating = false;
    animationCount = 0;

    startButton.addEventListener('click', startButtonCallback, false);
}

// Closure items used by animation code
var animationLayer;
var iconFeatures;
var animationCount;
export var animating;
var myTimer;

// Create an on-top layer holding the athletes icons at their start possitions
function createAnimationLayer() {
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

   animationLayer = new VectorLayer({
       source: 
           vectorSource,
           updateWhileAnimating: true,
           updateWhileInteracting: true,
   });

   map.getLayers().push(animationLayer);
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
     map.removeLayer(animationLayer);
     map.render();
 }

 // Assuming the activity was circular but not started from the same point as everyone else... reorganise it so it starts and finishes at the same point as everyone else.
 export function cutAndShut(point, activity) {
    const len=activity.activityRoute.length;
    const startPoint=findStartPoint(point, activity, len-1);

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