import LineString from 'ol/geom/LineString';
import Feature from 'ol/Feature';

import {stopAnimation} from './animate.js'
import {getLayer,map} from './index.js'
import {displayAthlete} from './athlete.js'
import {nextRouteColour,createAthleteSVG} from './colours.js'
import {activities,setOnLoadActivity,setOnDeleteActivities} from './activities.js'

// Fetch and Render activity 
function postLoadActivity(activity ) {

    nextRouteColour(activity);
    createAthleteSVG(activity);
    
    displayActivity(activity);
    displayAthlete(activity);

    if (activity.primary)
    {
        centreAndZoom( activities[0])
    }
};
  
// delete Activities
export function beforeDeleteActivities() {
    const activityLayer = getLayer('activity');

    stopAnimation( false )
    activityLayer.getSource().clear();
  }

// display the activity of an athlete.. namely their route on an map 
function displayActivity(activity) {
    const activityRoute = activity.activityRoute;
    const activityLineString = new LineString(activityRoute);
    const activityStyle = 'route'+activity.activityRouteColourIndex.toString();
    
    activityLineString.transform('EPSG:4326', 'EPSG:3857');
  
    const activityFeature = new Feature({
      type: activityStyle,
      geometry: activityLineString
    });
  
    const activityLayer = getLayer('activity');
    activityLayer.getSource().addFeature(activityFeature);

    activity.activityLineString= activityLineString;
    activity.activityFeature =activityFeature;
    activity.activityStyle= activityStyle;
}

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
  
  export function setupActivityLayer(){
    setOnLoadActivity(postLoadActivity);
    setOnDeleteActivities(beforeDeleteActivities);
  }
