(function(document){
	'use strict';

	var htmlElem = document.documentElement,
		className = htmlElem.className,
		supportsSvg;

	// Test SVG element creation
	supportsSvg = 'createElementNS' in document &&
		'createElementNS' in document &&
		'createSVGRect' in document.createElementNS('http://www.w3.org/2000/svg', 'svg');

	// Add 'js' to className
	className = className ? className + ' ' : '';
	className += 'js ';

	className += supportsSvg ? 'svg' : 'no-svg';

	// Set className
	htmlElem.className = className;
}(this.document));