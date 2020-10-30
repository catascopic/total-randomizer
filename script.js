'use strict';

const KINGDOM_SIZE = 10;
const LANDSCAPE_TYPES = ['Event', 'Project', 'Way', 'Landmark'];

var dominion;

var active;
var piles;
var landscapeLimit;
var landscapeTypeLimits;
var setupHistory;
var globalCounter;

var currentSetup;

var pileLookup = {};

function loadCards(json) {
	dominion = json;
}

function setupPiles(startingPiles) {
	
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
	
	if (state) {
		Object.assign(window, state);
	} else {
		active = {'Base': true};
		piles = startingPiles;
		landscapeLimit = 2;
		landscapeTypeLimits = {Way: 1};
		setupHistory = [];
		globalCounter = 0;
		initializeStartingPiles();
		saveState();
	}
	initializePiles();
}

function initializeStartingPiles() {
	for (let pile of piles) {
		if (pile.cards) {
			shuffle(pile.cards);
		}
		pile.used = [];
		pile.count = 0;
		pile.rate = 0;
		pile.chosen = 0;
	}
}

function initializePiles() {
	for (let pile of piles) {
		
		if (pile.cards) {
			let setLookup = pileLookup[pile.name];
			if (!setLookup) {
				setLookup = {};
				pileLookup[pile.name] = setLookup;
			}
			setLookup[pile.landscape || 'Card'] = pile;
		} else {
			pileLookup[pile.name] = pile;
		}
		
		pile.generator = pile.cards
			? setupGenerator(pile)
			: setupSingleCardGenerator(pile);
	}
}

function logStats() {
	for (let pile of piles) {
		if (pile.count) {
			console.log(`${pileName(pile).padStart(20)}: expected=${Math.round(pile.rate * pile.count)}, actual=${pile.chosen}, d=${getFairness(pile)}`);
		}
	}
}

function pileName(pile) {
	return pile.cards ? (pile.name + '/' + (pile.landscape || 'Card')) : pile.name;
}

function round(x) {
	return Math.round(x * 10000) / 100;
}

function setupGenerator(pile) {

	let size = pile.cards.length + pile.used.length;
	let current = [];
	let recycle = 0;

	pile.size = function() {
		return size - current.length;
	};
		
	pile.draw = function() {
		// guard against overdrawing
		if (current.length == size) {
			throw pile;
		}
		if (!pile.cards.length) {
			pile.cards = pile.used;
			pile.used = [];
			shuffle(pile.cards);
			// the current cards missed the shuffle, so mark their position so we can shuffle them back in
			recycle = current.length;
		}
		let cardName = pile.cards.pop();
		current.push(cardName);
		return cardName;
	};
	
	pile.finish = function() {
		let i = 0;
		for (; i < recycle; i++) {
			randomInsert(pile.cards, current[i]);
		}
		for (; i < current.length; i++) {
			pile.used.push(current[i]);
		}
		current = [];
		recycle = 0;
	};
	
	pile.discard = function(cardName) {
		let i = pile.cards.indexOf(cardName);
		if (i != -1) {
			pile.cards.splice(i, 1);
			pile.used.push(cardName);
		}
	};
}

function setupSingleCardGenerator(pile) {

	let ready = true;

	pile.size = function() {
		return Number(ready);
	};

	pile.draw = function() {
		// guard against overdrawing
		if (!ready) {
			throw pile;
		}
		ready = false;
		return pile.name;
	};

	pile.finish = function() {
		ready = true;
	};
}

function discard(cardName) {
	let card = dominion[cardName];
	if (card.set != 'Promo') {
		pileLookup[card.set][card.landscape || 'Card'].discard(cardName);
	}
}

var landscapeTotal;
var landscapeTypeTotals;

function generate() {
	resetDisplay();
	landscapeTypeTotals = Object.fromEntries(LANDSCAPE_TYPES.map(x => [x, 0]));
	landscapeTotal = 0;
	let chosenCards = 0;
	while (chosenCards < KINGDOM_SIZE) {
		
		let activePiles = piles.filter(pileActive);
		let total = activePiles.reduce((running, pile) => running + pile.size(), 0);
		for (let pile of activePiles) {
			pile.rate = updateAverage(pile.rate, pile.count, pile.size() / total);
			pile.count++;
		}
		let chosenPile = (globalCounter++ % 7 == 0 ? chooseFair : chooseRandom)(activePiles, total);
		chosenPile.chosen++;
		
		let card = dominion[chosenPile.draw()];
		updateDisplay(card);
		if (card.landscape) {
			landscapeTotal++;
			landscapeTypeTotals[card.landscape]++;
		} else {
			chosenCards++;
		}
	}
	
	for (let pile of piles) {
		pile.finish();
	}
	
	logStats();
		
	finishDisplay();
	saveState();
}

function pileActive(pile) {
	if (!active[pile.name]) {
		return false;
	}
	if (!pile.landscape) {
		return true;
	}
	if (landscapeTotal >= landscapeLimit) {
		return false;
	}
	let typeLimit = landscapeTypeLimits[pile.landscape];
	return typeLimit == null || landscapeTypeTotals[pile.landscape] < typeLimit;
}

function chooseRandom(activePiles, total) {
	let index = randInt(0, total);
	for (let pile of activePiles) {
		if (index < pile.size()) {
			return pile;
		}
		index -= pile.size();
	}
	
	throw {
		index: index, 
		total: total, 
		activePiles: activePiles
	};
}

function chooseFair(activePiles, total) {
	let fairPiles = activePiles.filter(hadFairShot);
	if (fairPiles.length < 2) {
		return chooseRandom(activePiles, total);
	}
	let best = fairPiles[0];
	let leastFair = getFairness(best);
	for (let i = 1; i < fairPiles.length; i++) {
		let pile = fairPiles[i];
		let fairness = getFairness(pile);
		if (fairness < leastFair) {
			best = pile;
			leastFair = fairness;
		}
	}
	console.log('fair=' + pileName(best));
	return best;
}

function getFairness(pile) {
	let expected = pile.rate * pile.count;
	return (pile.chosen - expected) / expected;
}

function hadFairShot(pile) {
	return pile.rate * pile.count >= 1;
}

function updateAverage(average, size, value) {
    return (size * average + value) / (size + 1);
}

function resetState() {
	localStorage.removeItem('state');
}

function saveState() {
	localStorage.setItem('state', JSON.stringify({
		active: active,
		piles: piles,
		landscapeLimit: landscapeLimit,
		landscapeTypeLimits: landscapeTypeLimits,
		setupHistory: setupHistory,
		globalCounter: globalCounter
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
	currentSetup.sort(compareCard);
	setupHistory.push({
		setup: currentSetup,
		date: new Date().toString()
	});
	console.log(currentSetup.map(x => x.name).join('\n'));
	for (let displayer of Object.values(displayers)) {
		displayer.display();
	}
}

function compareCard(c1, c2) {
	let landscapeSign = landscapeIndex(c1) - landscapeIndex(c2);
	if (landscapeSign != 0) {
		return landscapeSign;
	}
	let coinsSign = (c1.coins || 0) - (c2.coins || 0);
	if (coinsSign != 0) {
		return coinsSign;
	}
	let debtSign = (c1.debt || 0) - (c2.debt || 0);
	if (debtSign != 0) {
		return debtSign;
	}
	let potionSign = compareTruthy(c1.potion, c2.potion);
	if (potionSign != 0) {
		return potionSign;
	}
	return c1.name.localeCompare(c2.name);
}

function compareTruthy(t1, t2) {
	return Number(Boolean(t1)) - Number(Boolean(t2));
}

const LANDSCAPE_ORDER = {Event: 1, Project: 2, Way: 3, Landmark: 4};

function landscapeIndex(card) {
	return LANDSCAPE_ORDER[card.landscape] || 0;
}

// assumes the array is already shuffled
function randomInsert(array, item) {
	let index = randInt(0, array.length + 1);
	// if index == length, we push undefined here, which is fine
	array.push(array[index]);
	array[index] = item;
}

function shuffleRange(array, start, end) {
	for (let i = end - 1; i > start; i--) {
		swap(array, i, randInt(start, i + 1));
	}
}

function shuffle(array) {
	shuffleRange(array, 0, array.length);
}

function randInt(origin, bound) {
    return Math.floor(Math.random() * (bound - origin)) + origin;
}

function swap(array, i, j) {
	let temp = array[i];
	array[i] = array[j];
	array[j] = temp;
}
