const KINGDOM_SIZE = 10;
var landscapeLimit = 2;
var landscapeTypeLimits = {
	Way: 1
};

var active = {};
var piles;

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
			console.log('loaded last session from ' + state.date);
		} catch (jsonException) {
			console.log('failed to parse last session, resetting');
		}
	} else {
		console.log('creating new session');
	}
	
	if (!state) {
		active = {'Base': true};
		piles = defaultPiles;
		setupNewState();
		localStorage.setItem('state', JSON.stringify({
			active: active,
			piles: piles,
			date: new Date().toString()
		}));
	} else {
		active = state.active;
		piles = state.piles;
	}
}

function setupNewState() {
	for (let pile of piles) {
		shuffle(pile.items);
		pile.used = [];
	}
}

var chosenLandscapes;

function generate() {
	active.Nocturne = true;
	
	chosenLandscapes = {};
	chosen = {};
	for (let setName of SETS) {
		chosen[setName] = [];
	}
	
	let chosenCards = 0;
	kingdom: while (chosenCards < KINGDOM_SIZE) {
		let activePiles = piles.filter(isActive);
		let total = activePiles.reduce(reducer, 0);
		let index = randInt(0, total);
		for (let pile of activePiles) {
			if (index < pile.items.length) {
				// we don't care removing the card at the actual index,
				// because all piles are shuffled.
				let item = pile.items.pop();
				// pile.used.push(item);
				chosen[item.set].push(item);
				if (item.landscape) {
					// TODO
				} else {
					chosenCards++;
				}
				continue kingdom;
			}
			index -= pile.items.length;			
		}
		// TODO: this should be unreachable
		throw 'unavailable';
	}
	
	for (let displayer of displayers) {
		let cards = chosen[displayer.name];
		cards.sort(cardComparator);
		displayer.display(cards);
	}
}

function reducer(running, pile) {
	return running + pile.items.length;
}

function isActive(pile) {
	if (!active[pile.set]) {
		return false;
	}
	if (!pile.landscape) {
		return true;
	}
	return true;
}

function resetState() {
	localStorage.removeItem('state');
}

var displayers = [];

window.onload = function() {
	let kingdom = document.getElementById('kingdom');
	for (let setName of SETS) {
		displayers.push({
			display: createSet(setName, kingdom),
			name: setName
		});
	}
	generate();
};

function cardComparator(c1, c2) {
	let landscapeCmp = Number(Boolean(c1.landscape)) - Number(Boolean(c2.landscape));
	if (landscapeCmp != 0) {
		return landscapeCmp;
	}
	return c1.name.localeCompare(c2.name);
}

function shuffleInto(cards, deck) {
	for (let card of cards) {
		deck.push(card);
		swap(deck, deck.length - 1, randInt(0, deck.length));
	}
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
