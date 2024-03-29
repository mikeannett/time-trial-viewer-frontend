'use strict';
import 'ol/ol.css';
import 'ol-layerswitcher/src/ol-layerswitcher.css';

import Map from 'ol/Map';
import {ScaleLine, defaults as defaultControls} from 'ol/control';
import BingMaps from 'ol/source/BingMaps';
import View from 'ol/View';
import Point from 'ol/geom/Point';
import {Tile as LayerTile, Vector as LayerVector} from 'ol/layer';
import OSM from 'ol/source/OSM';
import XYZ from 'ol/source/XYZ';
import VectorSource from 'ol/source/Vector';

import {setupAnimation,createAnimationLayer} from './animateMap.js'
import {setupStyles} from './colours.js'
import {setupActivityLayer} from './activityMap.js'
import {fetchEvents} from './events.js'
import {createMarkerLayer} from './eventMap.js'
import {fetchAthletes} from './athlete.js'

import LayerSwitcher from 'ol-layerswitcher'

// Hack used to avoid reload errors caused by hot loading before parcel has finshed preparing the distribution.
if (module.hot) {
  module.hot.accept(function () {
    setTimeout(function() {
      location.reload();
    }, 300);
  });
}

// get the layer with this name.
export function getLayer(name)
{
  let ret;
  map.getLayers().forEach(function(layer, i) {
    if (layer.get('name')==name)
    {
      ret=layer;
    }
  });
  return ret;
}

// Create a map centered on Win hill
function drawMap () {
  const winHill=new Point([ -1.721040,53.362571]).transform( 'EPSG:4326','EPSG:3857');
  const activityLayer = new LayerVector({
    style: function(feature) {
      return styles[feature.get('type')];
    },
    source: new VectorSource({}),
    name: 'activity' 
  });
  const animationLayer = new LayerVector({
    updateWhileAnimating: true,
    updateWhileInteracting: true,
    source: new VectorSource({}),
    name: 'animation' 
  });
  const scaleControl = new ScaleLine();
  
  const osmLayer = new LayerTile({
    title: 'Open Steet Map',
    type: 'base',
    source: new OSM()
  });

  const osmTopoLayer = new LayerTile({
    title: 'OSM Topo',
    type: 'base',
    visible: false,
    source: new XYZ({
        url: 'https://{a-c}.tile.opentopomap.org/{z}/{x}/{y}.png'
    })
  });
  // OSMImpl.CycleMap(name)
  //{
  //  "url" : "http://tile2.opencyclemap.org/transport/{z}/{x}/{y}.png"
  // }
  // https://a.tile.thunderforest.com/cycle/15/16234/10624.png?apikey=a5dd6a2f1c934394bce6b0fb077203eb
  const arcGISEsriTopoLayer=new LayerTile({
    title: 'ArcGIS Esri Topographical',
    type: 'base',
    visible: false,
    source: new XYZ({
      attributions:
        'Tiles © <a href="https://services.arcgisonline.com/ArcGIS/' +
        'rest/services/World_Topo_Map/MapServer">ArcGIS</a>',
      url:
        'https://server.arcgisonline.com/ArcGIS/rest/services/' +
        'World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
    }),
  });
  const arcGISEsriImagaryLayer=new LayerTile({
    title: 'ArcGIS Esri Image',
    type: 'base',
    visible: false,
    source: new XYZ({
      attributions:
        'Tiles © <a href="https://services.arcgisonline.com/ArcGIS/' +
        'rest/services/World_Imagery/MapServer">ArcGIS</a>',
      url:
        'https://server.arcgisonline.com/ArcGIS/rest/services/' +
        'World_Imagery/MapServer/tile/{z}/{y}/{x}',
    }),
  }); 
  const googleLayer = new LayerTile({
    title: 'Google Image',
    type: 'base',
    visible: false,
    source: new XYZ({
      attributions:
      'Imagery © TerraMetrics, Map data © <a href="https://www.google.com/intl/en_uk/help/terms_maps/">Google</a>',
      url: 'http://mt0.google.com/vt/lyrs=s&hl=en&x={x}&y={y}&z={z}'
    })
  });

  /*
  const bingOSLayer = new LayerTile({
    title: 'Bing OS',
    type: 'base',
    visible: false,
      source: new BingMaps({
        key: 'Your Bing Maps Key from http://www.bingmapsportal.com/ here',
        imagerySet: 'OrdnanceSurvey',
        // use maxZoom 19 to see stretched tiles instead of the BingMaps
        // "no photos at this zoom level" tiles
        // maxZoom: 19
      }),
    })
    */
  const map = new Map({
    controls: defaultControls().extend([scaleControl]),
    target: document.getElementById('map'),
    view: new View({
      center: winHill.flatCoordinates,
      zoom: 14,
      minZoom: 2,
      maxZoom: 19
    }),
    layers: [
      arcGISEsriTopoLayer,osmTopoLayer,arcGISEsriImagaryLayer,googleLayer,osmLayer, activityLayer, createAnimationLayer(), createMarkerLayer()
    ]
  });
  
  var layerSwitcher = new LayerSwitcher();
  map.addControl(layerSwitcher);

  return map;
}

export const map=drawMap();
const styles=setupStyles();
setupActivityLayer();
fetchAthletes();
fetchEvents();
setupAnimation();