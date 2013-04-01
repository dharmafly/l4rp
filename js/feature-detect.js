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
		'svg ' : 'no-svg ';

	// Set className
	htmlElem.className = className;

	// Set up asynchronous test of of whether an <img> element can have a SVG file as its `src`
	img = new Image;
	img.src = 'data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%2F%3E';
	img.onload = function(){
		htmlElem.className += (
			img.width ? 'svg-image ' : 'no-svg-image '
		);
	};
}(this.document));