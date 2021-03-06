import {getDistance} from 'ol/sphere';

import {activities} from './activities.js'

export var animating=false;
var myTimer;
var animationCount=0;
var animationStopwatch;
var animationLastClock;

// callback used after animation has been set up to start.
var onStartAnimation;
export function setOnStartAnimation(callback) {
    onStartAnimation=callback;
}

// callback used when all animations are complete.
var onStopAnimation;
export function setOnStopAnimation(callback) {
    onStopAnimation=callback;
}

// callback used when animation time is updated
var onUpdateTime;
export function setOnUpdateTime(callback) {
    onUpdateTime=callback;
}

// callback used when animation time is updated
var onAthleteMoved;
export function setOnAthleteMoved(callback) {
    onAthleteMoved=callback;
}

// Calculate the distances between 2 points
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

// Calculate the point on a line between 2 points
function pointOnLine(point0, point1, t) {
// Carteasian line between 2 points as defined in RFC7946
// F(lon, lat) = (lon0 + (lon1 - lon0) * t, lat0 + (lat1 - lat0) * t)
    const p1= (point1) ? point1 :point0;
    const fLon = point0[0]+(p1[0]-point0[0])*t;
    const fLat = point0[1]+(p1[1]-point0[1])*t;
    return [fLon,fLat];
}

// Find the index for the closest point in an activity to the supplied point in the first half of the route
export function findStartPointCarefully(point, activity, startAt, stopAt) {
    var besti=startAt;
    var bestDist=100000000.1;
    const activityRoute= activity.activityRoute;
    var gotClose = false;
  
    for (let i=startAt; i<stopAt; i++)
    {

        const p=activity.activityRoute[i];
        const dist=calDist(p,point);
        if (dist < bestDist)
        {
            besti=i;
            bestDist=dist;

            if (bestDist < 100) gotClose = true;
        } else {
            if (gotClose && dist >100)
            {
                break;
            }
        }
    }
    // if we didn't find anthing within 100m then return start
    if (bestDist > 100)
    {
        console.log( `activity ${activity.stravaActivityId} ${bestDist}m from start`); 
        return startAt;
    } else return besti;
}

// Find the index for the closest point in an activity to the supplied point in the first half of the route
export function findStartPoint(point, activity, startAt, stopAt) {
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

// Check the check points and mark (in closePoint[]) any that are close to each other
function checkForCloseCPs(event) {
    if (!event.closePoint) event.closePoint = [event.points.length];
    for(var i=0; i<event.points.length; i++) event.closePoint[i]=false;

    for(var i=0; i<event.points.length; i++) {
        for(var j=i+1; j<event.points.length; j++) {
            const dist=calDist(event.points[i].point,event.points[j].point);
            if (dist <100) {
                event.closePoint[i]=true;
                console.log( `point ${i} is close to point ${j}`); 
                // event.closePoint[j]=true;
            }
        }
    }
}

// Find the start point for the animation for an athlete that best matches passing through all points up to pointIndex
function findAnimationStartPoint(pointIndex, event, activity) {
    var result=findStartPoint(event.points[0].point, activity, 0, activity.activityRoute.length/2);
    for(var i=1; i<=pointIndex; i++) {
        if (event.closePoint[i])
        {
            result=findStartPointCarefully(event.points[i].point, activity, result, activity.activityRoute.length);
        } else {
            result=findStartPoint(event.points[i].point, activity, result, activity.activityRoute.length);
        }
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
export function startAnimation(pointIndex) {
    var primaryActivityIndex=0;

    for (let i=0; i<activities.length; i++) {
        if (activities[i].primary) primaryActivityIndex=i;
    }

    const primaryActivity=activities[primaryActivityIndex];
    const thisEvent=primaryActivity.thisEvent;

    var startPoint=thisEvent.start;
    const endPoint=thisEvent.end;

    if (thisEvent.points.length == 0) {
        pointIndex=0;
        thisEvent.points.push({name:"Start", point:thisEvent.start})
    }
    else {
        startPoint=thisEvent.points[pointIndex].point;
    }

    animationLastClock=new Date().getTime();
    animationCount=0;

    checkForCloseCPs(thisEvent);

    for (let i=0; i<activities.length; i++)
    {
        const activity=activities[i];
        const routeCoordinates=activity.activityLineString.getCoordinates();
        
        activity.lastRouteIndex=findAnimationStartPoint(pointIndex, thisEvent, activity);
        activity.lastPoint=routeCoordinates[activity.lastRouteIndex];
        activity.StopRouteIndex=findEndPoint(endPoint, activity)
        activity.startRouteTime=activity.times[activity.lastRouteIndex];
        activity.animating = true;
        animationCount++;
    }

    // UI hook
    if (onStartAnimation) onStartAnimation();

    animating = true;
    animationStopwatch=0;
    myTimer = setInterval( moveFeatures, 100);
}
  
// stop (depending on ended) either one or all animations
export function stopAnimation(ended,activity) {
    if (ended) {    
      animationCount--;
      activity.animating=false;
      if (animationCount > 0) return;
    }
  
    {
      animating = false;
      clearInterval(myTimer);

      // UI Hook
      if (onStopAnimation) onStopAnimation();
    }
}

// Calculate the next animation point.
function nextPoint( activity, newRouteIndex, newRouteTime) {
// Strava data often samples every few seconds and occasionally has longer gaps.
// This implementation smooths this out by working out animation points between sample points.
    const routeCoordinates=activity.activityLineString.getCoordinates();
    const nextP = (newRouteIndex >= activity.StopRouteIndex) ? newRouteIndex : newRouteIndex + 1;

    const p0=routeCoordinates[newRouteIndex];     // First sample point
    const p1=routeCoordinates[nextP];             // Next sample point
    const t0=activity.times[newRouteIndex];       // Time of first sample point
    const t1=activity.times[nextP];               // Time of next sample point
    const t= (t0==t1) ? 1 : (newRouteTime-t0)/(t1-t0);    // proportion of the time we are between t0 and t1
    const newPoint=pointOnLine(p0,p1,t);

    return newPoint;
}

// timer callback function to move athletes' markers to create an animation
function moveFeatures() {
    const speedInput = document.getElementById('speed');
    const nowClock = new Date().getTime();

    // How much time has passed since we last did this.
    const animationElapsedClock = nowClock - animationLastClock;

    // Convert that into Animation Stopwatch seconds using the speed slider as a multiplier
    const animationDeltaRouteSeconds = Math.round(speedInput.value * animationElapsedClock / 1000);
    const animationNewStopwatch = animationStopwatch+animationDeltaRouteSeconds;

    animationLastClock=nowClock;
    animationStopwatch=animationNewStopwatch;

    // display how much time has passed since we started animating
    if (onUpdateTime) onUpdateTime(animationNewStopwatch);

    for (let i=0; i<activities.length; i++) {
        const activity = activities[i];

        const stopRouteIndex=activity.StopRouteIndex;
        const lastRouteIndex=activity.lastRouteIndex

        if (activity.animating) {
            const newRouteTime=activity.startRouteTime+animationNewStopwatch;
    
            // Check our route to see if the any new points have been reached in this time
            var newRouteIndex=lastRouteIndex;
            for (let j=lastRouteIndex+1; j<=stopRouteIndex; j++)
            {
                if (activity.times[j] > newRouteTime)
                {  
                    break;
                }
                newRouteIndex=j;
            }

            // if enough time has passed for us to move the marker
            // if (newRouteIndex > lastRouteIndex)
            {
                const lastPoint=activity.lastPoint;
                // const newPoint=routeCoordinates[newRouteIndex];
                const newPoint=nextPoint(activity, newRouteIndex, newRouteTime);
                // UI hook
                if (onAthleteMoved) onAthleteMoved(i, lastPoint, newPoint);

                activity.lastRouteIndex=newRouteIndex;
                activity.lastPoint=newPoint;
            }
        
            // check to see if we've reached the end.
            if (newRouteIndex >= stopRouteIndex) {
                stopAnimation(true, activity);
            }
        }
    }
    
    // console.log(new Date().getTime()- nowClock + 'ms');  // telemetry to help understand exection time so we can fine tune the timer
}