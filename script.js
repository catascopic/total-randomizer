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

function setupPiles(initialPiles) {
	
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
		newPiles(initialPiles);
		setupHistory = [];
		saveState();
	} else {
		active = state.active;
		console.log(state.piles);
		piles = loadPiles(state.piles);
		setupHistory = state.history;
	}
}

function newPiles(initialPiles) {
	for (let pile of initialPiles) {
		piles.push({
			name: pile.name,
			landscape: pile.landscape,
			count: 0,
			rate: 0,
			picked: 0,
			generator: pile.cards
				? createPile(pile.cards, [])
				: createSingleCardPile(pile.name)
		});
	}
}

function loadPiles(pileState) {
	for (let pile of pileStates) {
		piles.push({
			name: pile.name,
			landscape: pile.landscape,
			count: pile.count,
			rate: pile.rate,
			picked: pile.picked,
			generator: pile.cards
				? createPile(pile.cards, pile.used)
				: createSingleCardPile(pile.name)
		});
	}
}

function updateAverage(average, size, value) {
    return (size * average + value) / (size + 1);
}

var weights = [1, 12, 26, 26, 35];

var slots = [];
let q = 0;
for (let w of weights) {
	slots.push({
		count: 0,
		picked: 0,
		rate: 0,
		weight: w,
		name: q++
	});
}

for (let i = 0; i < 100; i++) {
	for (let slot of slots) {
		slot.rate = updateAverage(slot.rate, slot.count, slot.weight / 100);
		slot.count++;
	}
	
	let p = randInt(0, 100);
	
	let chosen;
	if (i % 10 != 10) {
		for (let slot of slots) {
			if (p < slot.weight) {
				chosen = slot;
				break;
			}
			p -= slot.weight;
		}
	} else {
		disp();
		chosen = slots[0];
		let dMin = (chosen.picked / chosen.count - chosen.rate) / chosen.rate;
		for (let i = 1; i < slots.length; i++) {
			let slot = slots[i];
			let d = (slot.picked / slot.count - slot.rate) / slot.rate;
			if (d < dMin) {
				chosen = slot;
				dMin = d;
			}
		}
		console.log(chosen.name);
	}
	chosen.picked++;
}

function unfair(slot) {
	return slot.rate * slot.count >= 1;
}

function round(x) {
	return Math.round(x * 10000) / 100;
}

function disp() {
	for (let slot of slots) {
		let actual = slot.picked / slot.count;
		console.log(`expected=${round(slot.rate)}, actual=${round(actual)}, d=${(actual - slot.rate) / slot.rate}`);
	}
}

function sum(array) {
	return array.reduce((a, b) => a + b, 0);
}

function randomLandscapeCount(cards, landscapes, n) {
	let r = Math.random();
	for (let i = 0; i < n; i++) {
		let p = landscapeProb(cards, landscapes, i)
		if (r < p) {
			return i;
		}
		r -= p;
	}
	return n;
}

function landscapeProb(cards, landscapes, n) {
	let deck = cards + landscapes;
	return (factorialRange(landscapes, landscapes - n)
			* factorialRange(cards, cards - KINGDOM_SIZE)
			* combinations(KINGDOM_SIZE + n - 1, n))
					/ factorialRange(deck, deck - KINGDOM_SIZE - n);
}

function push(obj, key, item) {
	let array = obj[key];
	if (!array) {
		obj[key] = [item];
	} else {
		array.push(item);
	}
}

function createPile(_cards, _used) {

	let cards = _cards;
	let used = _used;
	let current = [];
	let recycle = 0;
	let size = cards.length;

	return {
		size: function() {
			return size - current.length;
		},
		draw: function() {
			if (!cards.length) {
				cards = used;
				used = [];
				shuffle(cards);
				// the current cards missed the shuffle, so mark their position so we can shuffle them back in
				recycle = current.length;
			}
			let card = cards.pop();
			current.push(card);
			return card;
		},
		finish: function() {
			let i;
			for (i = 0; i < recycle; i++) {
				randomInsert(cards, current[i]);
			}
			for (; i < current.length; i++) {
				used.push(current[i]);
			}
			current = [];
			recycle = 0;
		}
	};
}

// promos should rotate too!

/*
I was thinking about having one big stack, just skip the cards that aren't active. This sounded fine until I realized you might keep skipping the same cards while the set was inactive.  In that case, the pile method is better, but there are still two problems: promo distribution, and to a lesser extent, fairness in selecting the expansions.

Okay, what if I use the "one big stack" algorithm, but instead of cards being in the stack, there were "vouchers" that allowed drawing from the pile?

That really only makes the pile selection more fair, though.  Which is good, but that wasn't my biggest problem.  Although who knows, maybe my weird totalling-and-randomizing algorithm wasn't great anyway.  Draw until you hit a valid voucher probably isn't any worse, and it sounds easier to follow, at least.

Sideways cards are another issue, but because there are only 2 I can probably get away with pure randomness.  Although again, Ways make it a little more complicated.

Also, even with the voucher system, it's theoretically possible that you could overdraw from a pile.  Do we remove the vouchers while we shuffle?  If so, do we shuffle them back in when we're done, or put them in the "used" pile?  I think with vouchers it seems fine to put them back.

*/


function createSingleCardPile(promo) {

	let ready = true;

	return {
		size: function() {
			return Number(ready);
		},
		draw: function() {
			ready = false;
			return promo;
		},
		finish: function() {
			ready = true;
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
		let total = activePiles.reduce((running, pile) => running + pile.size(), 0);
		let index = randInt(0, total);
		for (let pile of activePiles) {
			if (index < pile.size()) {
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
