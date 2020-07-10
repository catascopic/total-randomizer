var sets = {};
var promos;

function init(json) {
	for (let set of json.sets) {
		sets[set.name] = set;
	}
	promos = json.promos;
}

function createTile(type) {
	
	// It's 2020 and we're still doing this!?
	const tileNode = document.createElement('div');
	tileNode.className = type;
	const nameNode = document.createElement('div');
	nameNode.className = 'name';
	const artNode = document.createElement('img');
	artNode.ondragstart = noDrag;
	const costNode = document.createElement('div');
	costNode.className = 'cost';
	tileNode.append(nameNode);
	tileNode.append(artNode);
	tileNode.append(costNode);
	
	let card;
	
	function initialize () {
		tileNode.classList.add(...card.types);
		nameNode.innerText = card.name;
		costNode.innerText = card.cost;
		artNode.src = `art/${getImageFileName(card.name)}.png`;
	}
	
	return function(newCard) {
		tileNode.classList.remove(...card.types);
		initialize(newCard);
	}
}

function getImageFileName(cardName) {
	return cardName.toLowerCase().replace(/[ \-\/]+/g, '_').replace(/[^a-z_]+/g, '');
}
