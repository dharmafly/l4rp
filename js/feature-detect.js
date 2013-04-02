(function(document){
	'use strict';

	var htmlElem = document.documentElement,
		className = htmlElem.className,
		img;

	// Add 'js' to className
	className = className ? className + ' ' : '';
	className += 'js ';

	// Test SVG element creation
	className += document.createElementNS('http://www.w3.org/2000/svg', 'svg').createSVGRect ?
		'svg' : 'no-svg';

	// Set className
	htmlElem.className = className;
}(this.document));