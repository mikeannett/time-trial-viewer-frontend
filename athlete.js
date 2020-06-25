var athletes;

// fetch athletes structure
export function fetchAthletes() {
    const xhr = new XMLHttpRequest;
    xhr.open('GET', '/athletes')
    xhr.onload = function() 
    {
      if (this.status === 200) 
      {
        const responseJson = JSON.parse(this.responseText);
  
        athletes = responseJson.athletes;
      } 
    }
    xhr.send();
  }
  
var unknownNameCounter=0;
function unknownName(activity) {
  const letters='0123456789ABCDEFGHJKLMNOPRSTUVWXYZ';
  const letter=letters.charAt(unknownNameCounter++);
  if (unknownNameCounter >= letters.length) unknownNameCounter=0;

  return `Unknown ${letter}`;
}

// Safe lookup of athlete's name dealing with unknown athletes.
export function lookupAthlete(activity) {
    const athleteId=activity.athleteId;
    var ret;

    if (athleteId!=0)
    {
      ret=athletes[athleteId.toString()];
      if (typeof ret == "undefined" || ret === null)
      {
        if (typeof activity.firstName == "undefined" || activity.athleteId === null)
        {
          ret = unknownName(activity);
        } else {
          ret= activity.firstName;
        }
      }
    } else {
      ret=unknownName(activity);
    }

    activity.athleteName=ret;
  }

  // Callback function to launch url in new tab/wondow
function openInNewTabListener(event) {
  const url=event.target.getAttribute('href');
  const win = window.open(url, '_blank');
  win.focus();
  event.preventDefault();
  }

// Add an athlete to the displayed list of athletes
export function displayAthlete(activity)
{
  const athleteName=activity.athleteName;
  const activityId=activity.stravaActivityId;
  const athleteDiv = document.getElementById('athletes');
  const newP =  document.createElement('p'); 
  if (activity.primary && (athleteDiv.childNodes.length > 0)) 
    athleteDiv.insertBefore(newP, athleteDiv.childNodes[0]);
  else
    athleteDiv.appendChild(newP);

  newP.appendChild(activity.athleteSVG);

  const aTag = document.createElement('a');
  aTag.setAttribute('href','https://www.strava.com/activities/' + activityId);
  aTag.addEventListener("click", function(event) {openInNewTabListener(event)}, false); 
  aTag.innerText = athleteName;
  newP.appendChild( aTag );
}

// remove the displayed list of athletes 
export function clearAthletes() {
  const athleteDiv = document.getElementById('athletes');
  while (athleteDiv.firstChild) {
    athleteDiv.removeChild(athleteDiv.lastChild);
  }
  unknownNameCounter=0;
}