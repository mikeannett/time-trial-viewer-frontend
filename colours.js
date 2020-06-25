import {Stroke, Style} from 'ol/style';

// Colours used for Athletes and their routes
export const colours = ['black', '#3875FB', '#AFFD48','#FD40E5', '#44FEDA', '#FDA041', '#6440FB', 
  '#4AFD46', '#FC387C', '#3DB6FC', '#F1FD4B', '#D141FC', '#43FD9A', '#FD5D3D'];

// Choose a colour for an athlete. Return value is the index to be used with the colour array.
var colourSetCounter = 1;
export function nextRouteColour(activity) {
  var ret;
  if (activity.primary) ret=0;
  else
  {
    ret=colourSetCounter;
    colourSetCounter++;
    if (colourSetCounter >= colours.length) resetColours();
  } 
  activity.activityRouteColourIndex=ret;
  return ret;
}

export function resetColours() {colourSetCounter=1}

// fabricate an SVG icon for an athlete
export function createAthleteSVG(activity) {
    const colour=activity.activityRouteColourIndex;
    const size=9;
    const initials = getInitials(activity.athleteName);
    const newSVG = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  
    newSVG.setAttribute('width',size*2+5);
    newSVG.setAttribute('height',size*2);
    newSVG.setAttribute( 'xmlns', 'http://www.w3.org/2000/svg' );
    newSVG.setAttribute('version','1.1')
  
    const newCircle=document.createElementNS("http://www.w3.org/2000/svg", "circle");
    newCircle.setAttribute('cx',size);
    newCircle.setAttribute('cy',size);
    newCircle.setAttribute('r',size);
    newCircle.setAttribute('fill',colours[colour]);
  
    const newText=document.createElementNS("http://www.w3.org/2000/svg", "text");
    newText.setAttribute('font-size',10);
    newText.setAttribute('font-family','Verdana');
    newText.setAttribute('x',1);
    newText.setAttribute('y',size*2-5);
    newText.setAttribute("fill", contrastingFGColour(colours[colour]));
  
    const svgText=document.createTextNode(initials);
    newText.appendChild(svgText);
  
    newSVG.appendChild(newCircle);
    newSVG.appendChild(newText);

    activity.athleteSVG = newSVG;
  
    return newSVG;
}

// Set up styles used to draw routes in different colours
export function setupStyles() {
    const styles = [];
    for (let i=0; i<colours.length;i++){
      styles['route'+i.toString()]=new Style({
        stroke: new Stroke({
          width: 2, color: colours[i]
        })
      });
    }
    return styles;
}

// return a contrasting foreground colour   
function contrastingFGColour( BGColour ) {
    if (BGColour.charAt(0) != '#') return "white";
    return (luma(BGColour.substr(1)) >= 165) ? 'black': 'white';
}

// return a brightness indicator for a colour in the format #rrggbb
function luma(color) // color can be a hx string or an array of RGB values 0-255
{
    const rgb = hexToRGBArray(color);
    return (0.2126 * rgb[0]) + (0.7152 * rgb[1]) + (0.0722 * rgb[2]); // SMPTE C, Rec. 709 weightings
}

// convert #rrggbb to [rr,gg,bb]
function hexToRGBArray(color)
{
    if (color.length === 3)
        color = color.charAt(0) + color.charAt(0) + color.charAt(1) + color.charAt(1) + color.charAt(2) + color.charAt(2);
    else if (color.length !== 6)
        throw('Invalid hex color: ' + color);
    var rgb = [];
    for (let i = 0; i <= 2; i++)
        rgb[i] = parseInt(color.substr(i * 2, 2), 16);
    return rgb;
}

// return the initials from an athlete's name
function getInitials(name) {
    const parts = name. split(' ');
    var initials = '';
  
    for (let i = 0; i < parts. length; i++) {
      if (parts[i]. length > 0 && parts[i] !== '') {
        initials += parts[i][0] 
      }
    }
    return initials;
}