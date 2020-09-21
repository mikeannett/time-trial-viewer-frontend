import {selectEvent} from './events.js';

const menuUl = document.getElementById ("menus");
const eventNameDiv = document.getElementById ("eventName");

export function displayEventName( name )
{
	eventNameDiv.innerText=name;
}

function menuSelectionHandler()
{
	console.log( this.myName);
	selectEvent(this.myId);
	displayEventName(this.myName);
	return false
}


/*
<nav>
	<ul class="nav-menu nav-vertical">
		<li>
			<a href="#" class="nav-active">Choose Event</a>
			<ul id="menus">
				<li>
					<a>level 1</a>
					<ul>
						<li>
							<a>Level 2</a>
						</li>
					</ul>
				</li>
			</ul>
		</li>
	</ul>
</nav>
*/
// Return UL tag for folder if we have a folder with this label
function getMenuLevel1(label) {
    const lis = menuUl.children;
	for (let i = 0; i < lis.length; i++) {
  		const liTag = lis[i];
		const aTag=liTag.children[0];
		if (aTag.innerText==label) return liTag.children[1];
	}

    return null;
  }

  function getMenuLevel2(ul, label) {
    const lis = ul.children;
	for (let i = 0; i < lis.length; i++) {
  		const liTag = lis[i];
		const aTag=liTag.children[0];
		if (aTag.innerText==label) return true;
	}

    return null;
  }

function getOrCreateMenuLevel1( seriesName ) {
	const UL=getMenuLevel1(seriesName)

	if (UL!=null) return UL 

	const newLevel1 = document.createElement("li");
	menuUl.appendChild(newLevel1)

	const newA = document.createElement("a");

	newA.innerText=seriesName
	newLevel1.appendChild(newA)

	const newUl = document.createElement("ul");
	newLevel1.appendChild(newUl);

	return newUl;
} 

function getOrCreateMenuLevel2( ul, eventName, eventId ) {
	if (getMenuLevel2(ul, eventName ) != null) return;

	const newLevel2 = document.createElement("li");
	ul.appendChild(newLevel2)

	const newA = document.createElement("a");
	newA.myName=eventName
	newA.myId=eventId

	newA.innerText=eventName
	newA.addEventListener ("click", menuSelectionHandler, false);	

	newLevel2.appendChild(newA)
} 

export function AddLevel1And2( events, eventId ){
	const event=events[eventId]
	const seriesName=event.folder;
	const eventName=event.name;
	// const eventId=event;
	const noSeries = seriesName == null || seriesName=="";
	const ulTag=noSeries ? menuUl : getOrCreateMenuLevel1(seriesName);
	getOrCreateMenuLevel2(ulTag,eventName,eventId);
}

/*
AddLevel1And2( "DP", "dp 1.1" )
AddLevel1And2( "DP", "dp 1.2" )

AddLevel1And2( "SS", "ss 2.1" )
AddLevel1And2( "SS", "ss 2.2" )
AddLevel1And2( null, "leaf 1" )
AddLevel1And2( "", "leaf 2" )
*/