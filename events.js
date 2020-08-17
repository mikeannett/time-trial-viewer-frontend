import {activities,fetchActivity} from './activities.js'

var events;

// callback used after the events have been loaded.
var onLoadEvents= function (event) {return};
export function setOnLoadEvents(callback) {
  onLoadEvents=callback;
}

// callback used after the event and primary activity have been loaded.
var onLoadPrimary= function (event) {return};
export function setOnLoadPrimary(callback) {
  onLoadPrimary=callback;
}

// callback used when an event is deselect
var onDeselectEvent= function (event) {return};
export function setOnDeselectEvent(callback) {
  onDeselectEvent=callback;
}

// Convert JSON Lat/Long convention to Long/Lat openlayers convention
function JSONLongLatToOpenLayers(p) {
  const p0=p[0];
  p[0]=p[1];
  p[1]=p0;
  return p;
}

// Convert open layers Long/Lat convention to Lat/Long JSON convention
function OpenLayersLongLatToJSON(p) {
  const p0=p[0];
  p[0]=p[1];
  p[1]=p0;
  return p;
}

// Set up long/lat points to comply with OpenLayers conventions
// Openlayers complies with RFC7946 describing points as 2 member array of decimals [Long,Lat]
// Our events.json represents points as [Lat,Long] because that is how points are presented in google/bing maps, and other tools and RFC5870
// making it easier create data by hand
function setupPoints() {
  for (let i=0; i<events.length; i++) {
    const event=events[i];
    const points=[];
    if (event.start)
    {
      event.start=JSONLongLatToOpenLayers(event.start);
      points.push( {name:"Start", point:event.start});
    } 
    if (event.end) event.end=JSONLongLatToOpenLayers(event.end);
    if (event.cps)
      for (let i=0; i<event.cps.length;i++) {
        event.cps[i]=JSONLongLatToOpenLayers(event.cps[i]);
        points.push( {name:"CP"+String(i+1), point:event.cps[i]});
      }
        
    if (event.start && !event.end) event.end=event.start;

    event.points = points;
  }
}

export function getEvent(eventIndex) {
  return events[eventIndex];
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
        onLoadEvents(events);

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

// fetch non primary activities
function fetchEventPart2(eventIndex) {
  const thisEvent=events[eventIndex];

  const activityIds = thisEvent.activities;
  for (let i=1; i<activityIds.length; i++) {
    fetchActivity(activityIds[i],false,eventIndex);
  }
}

// fetch primary activity and when complete display the others.
function fetchEvent(eventIndex) {
  const thisEvent=events[eventIndex];

  const activityIds = thisEvent.activities;
  fetchActivity(activityIds[0],true, eventIndex,() => {
    const primaryActivityRoute = activities[0].activityRoute;
    if (!thisEvent.start) { 
      thisEvent.start = OpenLayersLongLatToJSON( primaryActivityRoute[0] );
    }
    if (!thisEvent.end) { 
      thisEvent.end = OpenLayersLongLatToJSON( primaryActivityRoute[ primaryActivityRoute.length-1 ]);
    }
    activities[0].thisEvent=thisEvent;

    setupPoints();
    onLoadPrimary(thisEvent);
    fetchEventPart2(eventIndex);
  });
}

// fetch a selected event
export function selectEvent(eventIndex) {
    // remove currently displayed event 
    deselectEvent();

    // Refresh the events structure and when complete fetch activities
    fetchEvents( () => {fetchEvent(eventIndex)} );
}

// deselect currently displayed event 
function deselectEvent() {
  onDeselectEvent();
}