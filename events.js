
import {deleteActivities, fetchActivity,activities, newLayers, getLayer} from './index.js'
import {resetColours} from './colours.js'
import {clearAthletes} from './athlete.js'
import {Vector as VectorLayer} from 'ol/layer';
import VectorSource from 'ol/source/Vector';

var events;
const markerLayerName='marker';

// Convert Long/Lat convention to Long/Lat openlayers convention
function JSONLongLatToOpenLayers(p) {
  const p0=p[0];
  p[0]=p[1];
  p[1]=p0;
  return p;
}

// Return true if we have a nav button with this label
function navButtonWithLabel(label) {
  const buttons = document. getElementsByClassName("navButton");
  for (let b of buttons) { 
    if (b.value == label) return true;
  }
  return false;
}

// display buttons for each event
function setupButtons() {
  for (let i=0; i<events.length; i++) {
    if (events[i].activities.length > 0 && !navButtonWithLabel(events[i].name))
    {
      const button = document.createElement("input");
      const buttonDiv = document.getElementById('buttons');
    
      button.type = "button";
      button.value = events[i].name;
      button.className = "navButton";
      button.onclick = selectEventCallback;
      button.dataArg1=i;
      buttonDiv.appendChild(button);
    }
  } 
}

// Set up long/lat points to comply with OpenLayers conventions
function setupPoints() {
  for (let i=0; i<events.length; i++) {
    const event=events[i];
    if (event.start) event.start=JSONLongLatToOpenLayers(event.start);
    if (event.end) event.end=JSONLongLatToOpenLayers(event.end);
    if (event.cps)
      for (let i=0; i<event.cps.length;i++)
        event.cps[i]=JSONLongLatToOpenLayers(event.cps[i]);
    if (event.start && !event.end) event.end=event.start;
  }
}

// display markers: start, end and CPs
function displayMarkers(activity) {
  const activityLayer = getLayer(markerLayerName);
  activityLayer.getSource().addFeature(activityFeature);
}

// create marker layer.
export function getEvent(eventIndex) {
  return events[eventIndex];
}

// create marker layer.
export function createMarkerLayer() {
  return new VectorLayer({
    source: new VectorSource({}),
    name: markerLayerName 
  });
}

// Safe version of JSONParse returning null structure on error and logging a more usefull message
function myJSONParse( data ) {
  try {
    return JSON.parse(data);
  } catch (e) {
    const mess=e.message;
    const messWords=mess.split( ' ');
    const pos=messWords[messWords.length-1];
    console.log( "Bad Events JSON");
    console.log( mess );
    if (!isNaN(pos))
      console.log( 'Text after possition ' + pos + ':' + data.substr( pos, 60 ) );
    return JSON.parse('{ "events" : []}');
  }
}
  // Fetch events structure
export function fetchEvents(callback) {
    const xhr = new XMLHttpRequest;
    xhr.open('GET', '/events')
    xhr.onload = function() 
    {
      if (this.status === 200) 
      {
        const responseJson = myJSONParse(this.responseText);
  
        events = responseJson.events;
        setupPoints();
        setupButtons();

        if (callback) callback();
        else {

          // select the last event and display it.
          for (let i=events.length-1; i>-1; i--){
            if (events[i].activities.length > 0) {
              selectEvent(i);
              break;
            }
          }
        }
      } 
    }
    xhr.send();
}

// callback function used by event selection buttons
export function selectEventCallback() {
    const eventIndex=this.dataArg1;
    selectEvent(eventIndex);
}

// display non primary activities
function displayEventPart2(eventIndex) {
  const thisEvent=events[eventIndex];

  const activityIds = thisEvent.activities;
  for (let i=1; i<activityIds.length; i++) {
    fetchActivity(activityIds[i],false,eventIndex);
  }
}

// display primary activity and when complete display the others.
function displayEvent(eventIndex) {
  const thisEvent=events[eventIndex];

  const activityIds = thisEvent.activities;
  fetchActivity(activityIds[0],true, eventIndex,() => {
    const primaryActivityRoute = activities[0].activityRoute;
    if (!thisEvent.start) { 
      thisEvent.start = primaryActivityRoute[0];
    }
    if (!thisEvent.end) { 
      thisEvent.end = primaryActivityRoute[ primaryActivityRoute.length-1 ];
    }
    activities[0].thisEvent=thisEvent;
    displayEventPart2(eventIndex);
  });
}

// display a selected event
export function selectEvent(eventIndex) {
    // remove currently displayed event 
    removeEvent();

    // Refresh the events structure and when complete display the event
    fetchEvents( () => {displayEvent(eventIndex)} );
}

// remove currently displayed event 
export function removeEvent() {
    deleteActivities();
    resetColours();
    clearAthletes();  
}