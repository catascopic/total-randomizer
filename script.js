var landscapeLimit = 2;
var landscapeTypeLimits = {
	Way: 1
};
const KINGDOM_SIZE = 10;

var sets = {};
var promos = {};

var randomizerDeck;
var used = [];

var chosenCards;
var chosenLandscapes;

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
	randomizerDeck.push(...sets['Prosperity']);
	randomizerDeck.push(...sets['Nocturne']);
	randomizerDeck.push(...sets['Renaissance']);
	randomizerDeck.push(...sets['Guilds']);
	randomizerDeck.push(...sets['Cornucopia']);
	randomizerDeck.push(...sets['Dark Ages']);
	randomizerDeck.push(...sets['Adventures']);
	randomizerDeck.push(...sets['Intrigue']);
	
	randomizerDeck.push(promos['Black Market']);
	randomizerDeck.push(promos['Governor']);
	randomizerDeck.push(promos['Prince']);
	shuffle(randomizerDeck);
}

function generate() {
	chosenCards = [];
	chosenLandscapes = [];
	let skipped = [];

	while (chosenCards.length < KINGDOM_SIZE) {
		let rand = randomizerDeck.pop();
		used.push(rand);
		let target;
		if (rand.landscape) {
			target = chosenLandscapes.length < landscapeLimit
					? chosenLandscapes 
					: skipped;
			
		} else {
			target = chosenCards;
		}
		target.push(rand);
	}
	
	chosenCards.sort(cardComparator);
	chosenLandscapes.sort(cardComparator);
	
	for (let i = 0; i < KINGDOM_SIZE; i++) {
		cardTiles[i].setCard(chosenCards[i]);
	}
	
	let i = 0;
	for (; i < chosenLandscapes.length; i++) {
		landscapeTiles[i].setCard(chosenLandscapes[i]);
	}
	for (; i < landscapeLimit; i++) {
		landscapeTiles[i].hide();
	}

	shuffleInto(skipped, randomizerDeck);
}

var cardTiles = [];
var landscapeTiles = [];

function cardComparator(c1, c2) {
	let categoryCmp = cardCategory(c1) - cardCategory(c2);
	if (categoryCmp != 0) {
		return categoryCmp;
	}
	let costCmp = (c1.coins || 0) + (c1.debt || 0) - (c2.coins || 0) + (c2.debt|| 0);
	if (costCmp != 0) {
		return costCmp;
	}
	return c1.name.localeCompare(c2.name);
}

function cardCategory(card) {
	if (card.potion) {
		return 1;
	}
	if (card.debt) {
		return 2;
	}
	return 0;
}

window.onload = function() {
	let cardContainer = document.getElementById('cards');
	for (let i = 0; i < KINGDOM_SIZE; i++) {
		cardTiles.push(createTile(cardContainer, 
				'card', function(node, card) {
					node.classList.add(...card.types);
				}));
	}
	let landscapeContainer = document.getElementById('landscapes');
	for (let i = 0; i < landscapeLimit; i++) {
		landscapeTiles.push(createTile(landscapeContainer, 
				'landscape', function(node, card) {
					node.classList.add(card.landscape);
				}));
	}
	generate();
}
	
function createTile(container, type, typeSetter) {
	
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
			typeSetter(nameNode, card);
			nameNode.innerText = card.name;
			nameNode.href = 'http://wiki.dominionstrategy.com/index.php/' + card.name;
			costNode.innerText = card.coins;
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