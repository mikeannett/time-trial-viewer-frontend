import {cutAndShut} from './animate.js'
import {lookupAthlete} from './athlete.js'
import {getEvent} from './events.js';

export var activities=[];

// callback used after an Activity have been loaded.
var onLoadActivity= function (activity) {return};
export function setOnLoadActivity(callback) {
  onLoadActivity=callback;
}

// callback used before an Activities are deleted
var onDeleteActivities= function () {return};
export function setOnDeleteActivities(callback) {
    onDeleteActivities=callback;
}

// Fetch and Render activity 
export function fetchActivity(stravaActivityId,primary, eventIndex, callback ) {
    const xhr = new XMLHttpRequest;
    const rearrangeRoute=(stravaActivityId < 0);
    stravaActivityId=Math.abs(stravaActivityId);
    xhr.open('GET', `/activity/${stravaActivityId}`) 
    xhr.onload = function() 
    {
  
      if (this.status === 200) 
      {
        const responseJson = JSON.parse(this.responseText);
        const stream =responseJson.stream;
        var activity;
        var athleteId;
        var firstName;
  
        // Athletes with certain privacy settings will not have an Activity section in the Json document, so we won't know who the activity belongs to.
        try {
          athleteId=responseJson.activity.athleteId;
          firstName=responseJson.activity.firstName;
        } catch(err) {
          console.log(`Activity ${stravaActivityId} has no athleteId`);
          athleteId=0;
          // return;
        }
  
        activity = { 
          stravaActivityId: stravaActivityId,
          primary : primary,
          athleteId: athleteId,
          firstName: firstName,
          thisEvent: getEvent(eventIndex),
          times: extractTimes(stream),
          activityRoute: extractRoute(stream)
        }
  
        // we are told it is a circular route but starting from a different place
        if (rearrangeRoute){
          const p=getEvent(eventIndex).start;
          cutAndShut(p, activity);
        }
  
        lookupAthlete(activity);
        activities.push(activity);

        onLoadActivity(activity);

        if (callback) callback();
      } 
    }
    xhr.send();
  };
  
// delete Activities
export function deleteActivities() {
    if (activities.length==0) return;
    onDeleteActivities();

    for (let i=activities.length-1; i>-1; i--)
    {
        const activity = activities[i];

        delete activity.activityRoute;
        delete activity.activityLineString;
        delete activity.activityFeature;
        delete activity.activityStyle;
        delete activity.activityRouteColourIndex;
    }
    activities=[];
  }

  // Extract route (in opelaylayers convention [lng, lat]) from the Strava flyby stream object
  function extractRoute(stream) {
    const route = [];
    for (let i = 0; i < stream.length; i++) {
      route.push([stream[i].point.lng, stream[i].point.lat]);
    }
    return route;
  };
  
  // Extract times from the Strava flyby stream object
  function extractTimes(stream) {
    const times = [];
    for (let i = 0; i < stream.length; i++) {
      const d=new Date(0);
      d.setUTCSeconds(stream[i].time);
      times.push(stream[i].time);
    }
    return times;
  };
  