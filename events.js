
import {deleteActivities, fetchActivity} from './index.js'
import {resetColours} from './colours.js'
import {clearAthletes} from './athlete.js'

var events; 

// display buttons for each event
function setupButtons() {
    for (let i=0; i<events.length; i++) {
      if (events[i].activities.length > 0)
      {
        const button = document.createElement("input");
        const buttonDiv = document.getElementById('buttons');
        const newP = buttonDiv; 
      
        button.type = "button";
        button.value = events[i].name;
        button.onclick = selectEventCallback;
        button.dataArg1=i;
        newP.appendChild(button);
      }
    } 
  }

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
export function fetchEvents() {
    const xhr = new XMLHttpRequest;
    xhr.open('GET', '/events')
    xhr.onload = function() 
    {
      if (this.status === 200) 
      {
        const responseJson = myJSONParse(this.responseText);
  
        events = responseJson.events;
        setupButtons();

        // select the last event and display it.
        for (let i=events.length-1; i>-1; i--){
          if (events[i].activities.length > 0) {
            selectEvent(i);
            break;
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

// display a selected event
export function selectEvent(eventIndex) {
    const thisEvent=events[eventIndex];
  
    // remove currently displayed event 
    removeEvent();
  
    const activityIds = thisEvent.activities;
    for (let i=0; i<activityIds.length; i++) {
      fetchActivity(activityIds[i],i==0);
    }
}

// remove currently displayed event 
export function removeEvent() {
    deleteActivities();
    resetColours();
    clearAthletes();  
}