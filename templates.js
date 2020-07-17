function createTile(card, container) {

	// It's 2020 and we're still doing this!?
	const tileNode = document.createElement('div');
	tileNode.classList.add(card.landscape ? 'landscape' : 'card');
	if (card.landscape) {
		tileNode.classList.add(card.landscape);
	} else {
		tileNode.classList.add(...card.types);
	}
	
	const nameNode = document.createElement('a');
	nameNode.className = 'name';
	nameNode.target = '_blank';
	nameNode.innerText = card.name;
	nameNode.href = 'http://wiki.dominionstrategy.com/index.php/' + card.name.replaceAll(' ', '_');
	tileNode.append(nameNode);
	
	const artNode = document.createElement('img');
	artNode.src = `art/${getImageFileName(card.name)}.png`;
	tileNode.append(artNode);
	
	if (card.coins != undefined) {
		const costNode = document.createElement('div');
		costNode.className = 'cost';
		costNode.innerText = card.coins;
		tileNode.append(costNode);
	}
	
	container.append(tileNode);
}

function createSet(setName, container) {

	const setNode = document.createElement('div');
	setNode.classList.add('set', 'hide');
	
	const headerNode = document.createElement('div');
	headerNode.classList.add('set-header', setName.toLowerCase().replaceAll(' ', '-'));
	headerNode.innerText = setName;
	setNode.append(headerNode);
	
	const cardsNode = document.createElement('div');
	cardsNode.classList.add('cards');
	setNode.append(cardsNode);
	
	container.append(setNode);

	return function(cards) {
		setNode.classList.toggle('hide', !cards.length);
		while (cardsNode.firstChild) {
			cardsNode.lastChild.remove();
		}
		for (let card of cards) {
			createTile(card, cardsNode);
		}
	};
}

function getImageFileName(cardName) {
	return cardName.toLowerCase().replaceAll(/[ \-\/]+/g, '_').replaceAll(/[^a-z_]+/g, '');
}
