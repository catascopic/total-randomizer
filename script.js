var landscapeLimit = 2;
var landscapeTypeLimits = {
	Way: 1
};
const KINGDOM_SIZE = 10;

var sets = {};
var promos = {};

var randomizerDeck;
var used = [];

var chosen = {
	'Base': [],
	'Intrigue': [],
	'Seaside': [],
	'Alchemy': [],
	'Prosperity': [],
	'Hinterlands': [],
	'Dark Ages': [],
	'Cornucopia': [],
	'Guilds': [],
	'Adventures': [],
	'Empires': [],
	'Nocturne': [],
	'Renaissance': [],
	'Menagerie': [],
	'Promo': []
};

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
	
	randomizerDeck.push(promos['Black Market']);
	randomizerDeck.push(promos['Governor']);
	randomizerDeck.push(promos['Prince']);
	shuffle(randomizerDeck);
}

window.onload = generate;

function generate() {
	for (let [set, cards] of Object.entries(chosen)) {
		if (cards.length) {
			cards.length = 0;
			let setNode = document.getElementById(set);
			setNode.parentNode.classList.add('hide');
			while (setNode.firstChild) {
				setNode.lastChild.remove();
			}
		}
	}
	
	let skipped = [];
	
	let cardCount = 0;
	let landscapeCount = 0;

	while (cardCount < KINGDOM_SIZE) {
		let rand = randomizerDeck.pop();
		used.push(rand);
		if (rand.landscape) {
			if (landscapeCount < 2) {
				chosen[rand.set].push(rand);
				landscapeCount++;
			} else {
				skipped.push(rand);
			}
		} else {
			chosen[rand.set].push(rand);
			cardCount++;
		}
	}
	
	for (let [set, cards] of Object.entries(chosen)) {
		if (cards.length) {
			let setNode = document.getElementById(set);
			cards.sort(cardComparator);
			for (let card of cards) {
				createTile(setNode, card.landscape ? 'landscape' : 'card').setCard(card);
			}
			setNode.parentNode.classList.remove('hide');
		}
	}

	shuffleInto(skipped, randomizerDeck);
}

function cardComparator(c1, c2) {
	let landscapeCmp = Number(Boolean(c1.landscape)) - Number(Boolean(c2.landscape));
	if (landscapeCmp != 0) {
		return landscapeCmp;
	}
	return c1.name.localeCompare(c2.name);
}

const SET_INDEX = {
	'Base': 0,
	'Intrigue': 1,
	'Seaside': 2,
	'Alchemy': 3,
	'Prosperity': 4,
	// moving Cornucopia to be next to Guilds
	'Hinterlands': 5,
	'Dark Ages': 6,
	'Cornucopia': 7,
	'Guilds': 8,
	'Adventures': 9,
	'Empires': 10,
	'Nocturne': 11,
	'Renaissance': 12,
	'Menagerie': 13
};
	
function createTile(container, type) {
	
	// It's 2020 and we're still doing this!?
	const tileNode = document.createElement('div');
	tileNode.className = type;
	const nameNode = document.createElement('a');
	nameNode.className = 'name';
	nameNode.target = '_blank';
	const artNode = document.createElement('img');
	const costNode = document.createElement('div');
	costNode.className = 'cost';
	tileNode.append(nameNode);
	tileNode.append(artNode);
	tileNode.append(costNode);
	container.append(tileNode);
	
	let card;
	
	return {
		setCard: function(newCard) {
			tileNode.classList.remove('hide');
			nameNode.className = 'name';
			card = newCard;
			
			if (type == 'card') {
				nameNode.classList.add(...card.types);
			} else {
				nameNode.classList.add(card.landscape);
			}
			
			nameNode.innerText = card.name;
			nameNode.href = 'http://wiki.dominionstrategy.com/index.php/' + card.name;

			if (card.coins) {
				costNode.classList.remove('hide');
				costNode.innerText = card.coins;
			} else {
				costNode.classList.add('hide');
			}
			
			artNode.src = `art/${getImageFileName(card.name)}.png`;
		},
		hide: function() {
			tileNode.classList.add('hide');
		}
	};
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

function getImageFileName(cardName) {
	return cardName.toLowerCase().replace(/[ \-\/]+/g, '_').replace(/[^a-z_]+/g, '');
}