function permutations(n, k) {
    return (n < k) ? 0 : factorialRange(n, n - k);
}

function combinations(n, k) {
    return permutations(n, k) / factorial(k);
}

function factorial(n) {
    return factorialRange(n, 1);
}

function factorialRange(num, denom) {
    let p = 1;
	for (let f = num; f > denom; f--) {
		p *= f;
	}
	return p;
}
