const KINGDOM_SIZE = 10;
var landscapeLimit = 2;
var landscapeTypeLimits = {
	Way: 1
};

var active = {};
var piles;

var setupHistory;
var currentSetup;

const SETS = [
	'Base', 'Intrigue', 'Seaside', 'Alchemy', 'Prosperity', 'Hinterlands', 
	'Dark Ages', 'Cornucopia', 'Guilds', 'Adventures', 'Empires', 'Nocturne',
	'Renaissance', 'Menagerie', 'Promo'
];

function init(defaultPiles) {
	let rawState = localStorage.getItem('state');

	let state;
	if (rawState) {
		try {
			state = JSON.parse(rawState);
			console.log('loaded last session');
		} catch (jsonException) {
			console.log('failed to parse last session, resetting');
		}
	} else {
		console.log('creating new session');
	}
	
	if (!state) {
		active = {'Base': true};
		piles = defaultPiles;
		initializeNewState();
		saveState();
	} else {
		active = state.active;
		piles = state.piles;
		setupHistory = state.history;
	}
}

function initializeNewState() {
	for (let pile of piles) {
		shuffle(pile.items);
		pile.size = pile.items.length;
		pile.used = [];
	}
}

// var landscapeTypeTotals;
var landscapeTotal;

function generate() {
	resetDisplay();
	
	landscapeTotal = 0;
	let chosenCards = 0;
	while (chosenCards < KINGDOM_SIZE) {
		let activePiles = piles.filter(isActive);
		let total = activePiles.reduce((running, pile) => running + pile.size, 0);
		let index = randInt(0, total);
		for (let pile of activePiles) {
			if (index < pile.size) {
				let item = getItem(pile);
				updateDisplay(item);
				if (item.landscape) {
					landscapeTotal++;
				} else {
					chosenCards++;
				}
				break;
			}
			index -= pile.size;			
		}
	}
		
	finishDisplay();
	saveState();
}

function getItem(pile) {
	// we don't care removing the card at the actual index,
	// because all piles are shuffled.
	let item = pile.items.pop();
	pile.used.push(item);
	// console.log(`chose ${item.name} from ${pile.set} ${(pile.landscape || 'Card')}, ${pile.items.length}/${pile.size}`);
	if (pile.items.length == 0) {
		pile.items = pile.used;
		shuffle(pile.items);
		pile.used = [];
		// console.log(`recycling ${pile.set} ${(pile.landscape || 'Card')}`);
	}
	return item;
}

function isActive(pile) {
	if (!active[pile.set]) {
		return false;
	}
	if (!pile.landscape) {
		return true;
	}
	return landscapeTotal < landscapeLimit;
}

function resetState() {
	localStorage.removeItem('state');
}

function saveState() {
	localStorage.setItem('state', JSON.stringify({
		active: active,
		piles: piles,
		history: setupHistory
	}));
}

var displayers = {};

window.onload = function() {
	let kingdom = document.getElementById('kingdom');
	for (let setName of SETS) {
		displayers[setName] = createSet(setName, kingdom);
	}
};

function resetDisplay() {
	currentSetup = [];
	for (let displayer of Object.values(displayers)) {
		displayer.reset();
	}
}

function updateDisplay(card) {
	currentSetup.push(card);
	displayers[card.set].update(card);
}

function finishDisplay(card) {
	currentSetup.sort(cardComparator);
	setupHistory.push({
		setup: currentSetup,
		date: new Date().toString()
	});
	console.log(currentSetup.map(x => x.name).join('\n'));
	for (let displayer of Object.values(displayers)) {
		displayer.display();
	}
}

function cardComparator(c1, c2) {
	let landscapeCmp = Number(Boolean(c1.landscape)) - Number(Boolean(c2.landscape));
	if (landscapeCmp != 0) {
		return landscapeCmp;
	}
	let costCmp = (c1.coins || 0) - (c2.coins || 0);
	if (costCmp != 0) {
		return costCmp;
	}
	return c1.name.localeCompare(c2.name);
}

function randomInsert(pile, thing) {
	let index = randInt(0, pile.length + 1);
	// if index == length, we push undefined here, which is fine
	pile.push(pile[index]);
	pile[index] = thing;
}

function shuffle(array) {
	for (let i = array.length; i > 1; i--) {
		swap(array, i - 1, randInt(0, i));
	}
}

function randInt(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
}

function swap(array, i, j) {
	let temp = array[i];
	array[i] = array[j];
	array[j] = temp;
}
