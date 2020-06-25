'use strict';
import 'ol/ol.css';
import Feature from 'ol/Feature';
import Map from 'ol/Map';
import View from 'ol/View';
import Point from 'ol/geom/Point';
import LineString from 'ol/geom/LineString';
import {Tile as TileLayer, Vector as VectorLayer} from 'ol/layer';
import OSM from 'ol/source/OSM';
import VectorSource from 'ol/source/Vector';
import {setupAnimation,cutAndShut} from './animate.js'
import {nextRouteColour,setupStyles,createAthleteSVG} from './colours.js'
import {fetchEvents} from './events.js'
import {fetchAthletes,lookupAthlete,displayAthlete} from './athlete.js'

// Hack used to avoid reload errors caused by hot loading before parcel has finshed preparing the distribution.
if (module.hot) {
  module.hot.accept(function () {
    setTimeout(function() {
      location.reload();
    }, 300);
  });
}

// Fetch and Render activity 
export function fetchActivity(stravaActivityId,primary) {
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
        times: extractTimes(stream),
        activityRoute: extractRoute(stream)
      }

      // we are told it is a circular route but starting from a different place
      if (rearrangeRoute){
        let p=activities[0].activityRoute[0];
        for (let i=0; i<activities.length;i++) {
          if (activities[i].pramary) {
            p=activities[i].activityRoute[0];
            break;
          }
        }
        cutAndShut(p, activity);
      }

      lookupAthlete(activity);
      nextRouteColour(activity);
      createAthleteSVG(activity);
      
      DisplayActivity(activity);
      displayAthlete(activity);

      activities.push(activity);

      if (primary)
      {
        centreAndZoom( activities[0])
      }
    } 
  }
  xhr.send();
};

// Centre and zoom map to the specified activity.
function centreAndZoom(activity) {
  const extent = activity.activityFeature.getGeometry().getExtent();

  // add 5% to the extent otherwise activity is pressed up against the side of the map
  var bitMore=(extent[0]-extent[2])*0.05;
  extent[0]+=bitMore
  extent[2]-=bitMore
  bitMore=(extent[1]-extent[3])*0.05;
  extent[1]+=bitMore
  extent[3]-=bitMore

  map.getView().fit(extent, map.getSize());
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

// display the activity of an athlete.. namely their route on an map 
function DisplayActivity(activity) {
  const activityRoute = activity.activityRoute;
  const activityLineString = new LineString(activityRoute);
  var activityLayer;
  const activityStyle = 'route'+activity.activityRouteColourIndex.toString();
  
  activityLineString.transform('EPSG:4326', 'EPSG:3857');

  const activityFeature = new Feature({
    type: activityStyle,
    geometry: activityLineString
  });

  activityLayer = new VectorLayer({
    source: new VectorSource({
      features: [activityFeature]
    }),
    style: function(feature) {
      return styles[feature.get('type')];
    } 
  });

  map.getLayers().push(activityLayer);

  activity.activityLineString= activityLineString;
  activity.activityFeature =activityFeature;
  activity.activityLayer= activityLayer;
  activity.activityStyle= activityStyle;

  activityLayer.activity=activity;
}

// delete Activities
export function deleteActivities() {
  if (activities.length==0) return;
  for (let i=activities.length-1; i>-1; i--)
  {
    var activity = activities[i];
    map.removeLayer(activity.activityLayer);
    delete activity.activityRoute;
    delete activity.activityLineString;
    delete activity.activityLayer;
    delete activity.activityFeature;
    delete activity.activityStyle;
    delete activity.activityRouteColourIndex;
  }
  activities=[];
}

// Create a map centered on Win hill
function drawMap () {
  const winHill=new Point([ -1.721040,53.362571]).transform( 'EPSG:4326','EPSG:3857');
  const map = new Map({
    target: document.getElementById('map'),
    view: new View({
      center: winHill.flatCoordinates,
      zoom: 14,
      minZoom: 2,
      maxZoom: 19
    }),
    layers: [
      new TileLayer({
        source: new OSM()
      })
    ]
  });
  
  return map;
}

export var activities=[];

export const map=drawMap();
const styles=setupStyles();

fetchAthletes();
fetchEvents();
setupAnimation();