const KINGDOM_SIZE = 10;
var landscapeLimit = 2;
var landscapeTypeLimits = {
	Way: 1
};

var dominion;

var active = {};
var piles = [];

var setupHistory;
var currentSetup;

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
	
	if (!state) {
		active = {'Base': true};
		piles = startingPiles;
		initializePiles();
		setupHistory = [];
		saveState();
	} else {
		active = state.active;
		piles = state.piles
		setupHistory = state.setups;
	}
	loadGenerators();
}

function initializePiles() {
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

function loadGenerators() {
	for (let pile of piles) {
		pile.generator = pile.cards
			? setupGenerator(pile)
			: setupSingleCardGenerator(pile);
	}
}

function logStats() {
	for (let pile of piles) {
		if (pile.count) {
			let actual = pile.chosen / pile.count;
			console.log(`${pile.name.padStart(12)}: expected=${round(pile.rate).toString().padStart(5)}, actual=${round(actual).toString().padStart(5)}, d=${(actual - pile.rate) / pile.rate}`);
		}
	}
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
		let card = pile.cards.pop();
		current.push(card);
		return card;
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

// var landscapeTypeTotals;
var landscapeTotal;

var totalChoices = 0;

function generate() {
	resetDisplay();
	
	landscapeTotal = 0;
	let chosenCards = 0;
	while (chosenCards < KINGDOM_SIZE) {
		
		let activePiles = piles.filter(pileActive);
		let total = activePiles.reduce((running, pile) => running + pile.size(), 0);
		for (let pile of activePiles) {
			pile.rate = updateAverage(pile.rate, pile.count, pile.size() / total);
			pile.count++;
		}
		let chosenPile = (totalChoices % 7 == 0 ? chooseFair : chooseRandom)(activePiles, total);
		chosenPile.chosen++;
		
		let card = dominion[chosenPile.draw()];
		updateDisplay(card);
		if (card.landscape) {
			landscapeTotal++;
		} else {
			chosenCards++;
		}
		
		totalChoices++;
	}
	
	for (let pile of piles) {
		pile.finish();
	}
	
	logStats();
		
	finishDisplay();
	saveState();
}

function pileActive(release) {
	if (!active[release.name]) {
		return false;
	}
	if (!release.landscape) {
		return true;
	}
	return landscapeTotal < landscapeLimit;
}

function chooseRandom(activePiles, total) {
	console.log('random');
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
	console.log('fair');
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
	console.log('fair=' + best.name);
	return best;
}

function getFairness(pile) {
	return (pile.chosen / pile.count - pile.rate) / pile.rate;
}

function hadFairShot(pile) {
	return pile.count > 0 && (pile.rate * pile.count >= 1);
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
		setups: setupHistory
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
