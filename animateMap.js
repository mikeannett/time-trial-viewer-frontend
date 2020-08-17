import Point from 'ol/geom/Point';
import Feature from 'ol/Feature';
import {Icon, Style} from 'ol/style';
import {Vector as VectorLayer} from 'ol/layer';
import {Vector as VectorSource} from 'ol/source';

import {map,getLayer} from './index.js'
import playIcon from './play_512x512.png';
import stopIcon from './stop_64x64.png';
import {setOnStartAnimation,setOnStopAnimation,setOnUpdateTime,setOnAthleteMoved, animating, startAnimation, stopAnimation} from './animate.js'
import {activities} from './activities.js';

var startFromDropdown;
var startButton;
var animationLayer;
var iconFeatures;
// FIXME: remove this switch
var oneLayer=true;

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

// start (and stop) the animation of athletes' markers
function startButtonCallback() {
    if (animating) 
      stopAnimation(false);
    else
      startAnimation(startFromDropdown.value);
}

// Apply the play button image to the map
function playImage() {
    removeChildren(startButton);
    const startButtonImage = document.createElement('img');
    startButtonImage.src=playIcon;
    startButtonImage.width=9;
    startButtonImage.height=9;
    startButton.appendChild(startButtonImage);
}

// Apply the stop button image to the map
function stopImage() {
    removeChildren(startButton);
    const startButtonImage = document.createElement('img');
    startButtonImage.src=stopIcon;
    startButtonImage.width=9;
    startButtonImage.height=9;
    startButton.appendChild(startButtonImage);
}

// create the UI controls for animations
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

// Remove all child elements from an element
function removeChildren( element ) {
    while (element.firstChild) {
        element.removeChild(element.lastChild);
    }
}

// Add an item to the StartFrom option dropdown
function addStartFromOption(name, value) {
    const startOption=document.createElement('option');
    startOption.innerText=name;
    startOption.value=value;
    startFromDropdown.appendChild(startOption);
}

// Set up StartFrom drop down from the list of supplied points
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
 // callback when Animation is starting
function startAnimationEventHandler() {
    stopImage();
    populateAnimationLayer();
    map.render();
}

// Callback when Animation is finishing
function stopAnimationEventHandler() {
    playImage();
    destroyAnimationLayer();
}

// Callback when the elapsed time has changed
function updateTimeEventHandler (time) {
    const el=document.getElementById( 'time');
    el.innerHTML = '<p>'+timeString(time)+'</p>'
}

// Callback when an Athlete has been moved by the animation
function athleteMovedEventHandler(iconIndex, routeCoordinates,newRouteIndex,lastRouteIndex) {
    const deltaX=routeCoordinates[newRouteIndex][0]-routeCoordinates[lastRouteIndex][0];
    const deltaY=routeCoordinates[newRouteIndex][1]-routeCoordinates[lastRouteIndex][1];

    iconFeatures[iconIndex].getGeometry().translate(deltaX, deltaY);
}

// Set up the animation UI
export function setupAnimation()
{
    setupAnimationControls();
    setOnStartAnimation(startAnimationEventHandler);
    setOnStopAnimation(stopAnimationEventHandler);
    setOnUpdateTime(updateTimeEventHandler);
    setOnAthleteMoved(athleteMovedEventHandler);
}

// remove the animation layer
function destroyAnimationLayer() {
    if (oneLayer) {
        if (animationLayer)
            animationLayer.getSource().clear();
    } else {
        map.removeLayer(animationLayer);
        map.render();
    }
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

// Populate animation layer with athlete icons at their start possitions
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
     animationLayer.setSource(vectorSource);
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