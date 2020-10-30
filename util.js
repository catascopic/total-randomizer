function computeIfAbsent(obj, key, mapper) {
	let value = obj[key];
	if (value === undefined) {
		value = mapper(key);
		obj[key] = value;
	}
	return value;
}

function increment(obj, key, amount) {
	let value = obj[key];
	if (value === undefined) {
		obj[key] = amount;
		return 0;
	}
	obj[key] += amount;
	return value
}

function append(obj, key, item) {
	let value = obj[key];
	if (value === undefined) {
		obj[key] = [item];
	} else {
		value.push(item);
	}
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
