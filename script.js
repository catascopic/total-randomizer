const KINGDOM_SIZE = 10;
var landscapeLimit = 2;
var landscapeTypeLimits = {
	Way: 1
};

var sets = {};
var promos = {};

var randomizerDeck;

var chosen;
var used = [];

var SETS = [
	'Base', 'Intrigue', 'Seaside', 'Alchemy', 'Prosperity', 'Hinterlands', 
	'Dark Ages', 'Cornucopia', 'Guilds', 'Adventures', 'Empires', 'Nocturne',
	'Renaissance', 'Menagerie', 'Promo'
];

var displayers = [];

function init(json) {
	for (let set of json.sets) {
		sets[set.name] = set.cards;
	}
	for (let promo of json.promos) {
		promos[promo.name] = promo;
	}
	createRandomizerDeck();
}

function createRandomizerDeck() {
	randomizerDeck = [];
	randomizerDeck.push(...sets['Base']);
	randomizerDeck.push(...sets['Intrigue']);
	randomizerDeck.push(...sets['Prosperity']);
	randomizerDeck.push(...sets['Dark Ages']);
	randomizerDeck.push(...sets['Cornucopia']);
	randomizerDeck.push(...sets['Guilds']);
	randomizerDeck.push(...sets['Adventures']);
	randomizerDeck.push(...sets['Nocturne']);
	randomizerDeck.push(...sets['Renaissance']);
	// randomizerDeck.push(...sets['Menagerie']);
	
	randomizerDeck.push(promos['Black Market']);
	randomizerDeck.push(promos['Governor']);
	randomizerDeck.push(promos['Prince']);
	shuffle(randomizerDeck);
}

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

function generate() {
	
	chosen = {};
	for (let setName of SETS) {
		chosen[setName] = [];
	}
	
	let skipped = [];
	let cardCount = 0;
	let landscapeCount = 0;
	let landscapeTypeCounts = {};

	while (cardCount < KINGDOM_SIZE) {
		let rand = randomizerDeck.pop();
		if (rand.landscape) {
			if (landscapeCount >= landscapeLimit || !checkLandscapeTypeLimit(landscapeTypeCounts, rand)) {
				skipped.push(rand);
				continue;
			}
			landscapeTypeCounts[rand.landscape] = (landscapeTypeCounts[rand.landscape] || 0) + 1;
			landscapeCount++;
		} else {
			cardCount++;
		}
		chosen[rand.set].push(rand);
		used.push(rand);
	}
	
	shuffleInto(skipped, randomizerDeck);
	
	for (let displayer of displayers) {
		let cards = chosen[displayer.name];
		cards.sort(cardComparator);
		displayer.display(cards);
	}
}

function checkLandscapeTypeLimit(landscapeTypeCounts, rand) {
	let typeLimit = landscapeTypeLimits[rand.landscape];
	return typeLimit == undefined || (landscapeTypeCounts[rand.landscape] || 0) < typeLimit;
}

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
