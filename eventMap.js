import {Vector as VectorLayer} from 'ol/layer';
import VectorSource from 'ol/source/Vector';
import Point from 'ol/geom/Point';
import Feature from 'ol/Feature';
import {Circle as CircleStyle, Fill, Icon, Stroke, Style} from 'ol/style';

import {getLayer} from './index.js'
import {deleteActivities} from './activities.js'
import {setOnLoadPrimary,setOnLoadEvents,setOnDeselectEvent,selectEvent} from './events.js';
import {populateStartFrom} from './animateMap.js'
import {resetColours} from './colours.js'
import {clearAthletes} from './athlete.js'
import {AddLevel1And2, displayEventName} from './menu.js'

const markerLayerName='marker';

// display markers: start, end and CPs
function displayMarkers(event) {
    const points=event.points;
    const activityLayer = getLayer(markerLayerName);
    activityLayer.getSource().clear();
  
    for( let i=0; i<points.length; i++)
    {
      const position=new Point(points[i].point).transform('EPSG:4326', 'EPSG:3857');
      const pointFeature = new Feature ( {geometry: position});
      const pointStyle =  new Style({
        image: new Icon({
            src: 'data:image/svg+xml;utf8,<svg width="10" height="10" xmlns="http://www.w3.org/2000/svg" version="1.1"><circle cx="5" cy="5" r="4" fill="Red"></circle></svg>' 
        })
      });
      pointFeature.setStyle(pointStyle);
      activityLayer.getSource().addFeature(pointFeature);
    }
  }
  
  // create marker layer.
  export function createMarkerLayer() {
    setOnLoadPrimary( (event) => { displayMarkers(event);
        displayEventName(event.name);
        populateStartFrom(event.points);
        });
    setOnLoadEvents(setupButtons);
    setOnDeselectEvent(removeEvent);
    return new VectorLayer({
      source: new VectorSource({}),
      name: markerLayerName 
    });
  }
  
// display buttons for each event
export function setupButtons(events) {
    for (let i=0; i<events.length; i++) {
      if (events[i].activities.length > 0 && !navButtonWithLabel(events[i].name))
      {
        AddLevel1And2(events, i);
        /*
        const button = document.createElement("input");
        const buttonDiv = document.getElementById('buttons');
      
        button.type = "button";
        button.value = events[i].name;
        button.className = "navButton";
        button.onclick = selectEventCallback;
        button.dataArg1=i;
        buttonDiv.appendChild(button); */
      }
    } 
  }

// Return true if we have a nav button with this label
function navButtonWithLabel(label) {
    const buttons = document. getElementsByClassName("navButton");
    for (let b of buttons) { 
      if (b.value == label) return true;
    }
    return false;
  }
  
// callback function used by event selection buttons
function selectEventCallback() {
    const eventIndex=this.dataArg1;
    selectEvent(eventIndex);
  }

// remove currently displayed event 
function removeEvent() {
      deleteActivities();
      resetColours();
      clearAthletes();  
  }