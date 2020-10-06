function rgbToHsl(r, g, b) {
	let cmax = Math.max(r, g, b);
	let cmin = Math.min(r, g, b);
	let delta = cmax - cmin;
	
	let h, s, l;

	if (delta == 0) {
		h = 0;
	} else if (cmax == r) {
		h = 60 * (((g - b) / delta) % 6);
	} else if (cmax == g) {
		h = 60 * ((b - r) / delta + 2);
	} else {
		h = 60 * ((r - g) / delta + 4);
	}
	
	let l = (cmax + cmin) / 2;

	if (delta == 0) {
		s = 0; 
	} else {
		s = delta / (1 - abs(2 * l - 1));
	}
	return [h, s, l];
}


function hslToRgb(h, s, l) {
	let c = (1 - abs(2 * l - 1)) * s;
	let x = c * (1 - abs((h / 60) % 2 - 1));
	let m = l - c / 2;

	if (h < 60) {
		return [c + m, x + m, m];
	} else if (h < 120) {
		return [x + m, c + m, m];
	} else if (h < 180) {
		return [m, c + m, x + m];
	} else if (h < 240) {
		return [m, x + m, c + m];
	} else if (h < 300) {
		return [x + m, m, c + m];
	else {
		return [c + m, m, x + m];
	}
}

console.log(hslToRgb(*rgbToHsl(1, 0, 0)))