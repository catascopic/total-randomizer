const KINGDOM_SIZE = 10;
var landscapeLimit = 2;
var landscapeTypeLimits = {
	Way: 1
};

var dominion;

var active = {};
var piles;

var setupHistory;
var currentSetup;

function init(initDominion) {
	dominion = initDominion;
	
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
		piles = newState();
		setupHistory = [];
		saveState();
	} else {
		active = state.active;
		piles = state.piles;
		setupHistory = state.history;
	}
}

function newState() {
	piles = [];
	sets = {};
	
	for (let card of Object.values(dominion)) {
		if (card.set = 'Promo') {
			piles.push(newPromo(card));
		} else {
		
		}
	}
}

function newExpansion(expansion, lastIndex = -1) {
	let cards = expansion.cards;
	let index = lastIndex;
	return {
		size: cards.length,
		isActive: function() {
			return isActive(expansion);
		},
		get: function() {
			index = (index + 1) % cards.length;
			if (!index) {
				shuffle(cards);
			}
			return cards[index];
		}
	};
}

function newPromo(promo) {
	return {
		size: 1,
		isActive: function() {
			return isActive(promo);
		},
		get: function() {
			return promo;
		}
	};
}

function isActive(release) {
	if (!active[release.name]) {
		return false;
	}
	if (!release.landscape) {
		return true;
	}
	return landscapeTotal < landscapeLimit;
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
const SETS = [
	'Base', 'Intrigue', 'Seaside', 'Alchemy', 'Prosperity', 'Hinterlands', 
	'Dark Ages', 'Cornucopia', 'Guilds', 'Adventures', 'Empires', 'Nocturne',
	'Renaissance', 'Menagerie', 'Promo'
];

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
