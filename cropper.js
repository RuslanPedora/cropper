'use strict'


//const
//----------------------------------------------------------------
var SWITCHER_RADIUS = 30;


//markers
//----------------------------------------------------------------
var markup = false;
var xStart, yStart, xEnd, yEnd;


//document elements
//----------------------------------------------------------------
var elementMainCanvas;
var elementSaveCanvas;
var elementSwitchBar;
var elementFileSrc;
var elementImageSrc;
var elementURLSrc;
var elementImgBufer;
var elementTracker;
var elementImageSelector;
var elementGlass;

elementMainCanvas = document.getElementById( 'main-canvas' );
elementSaveCanvas = document.getElementById( 'save-canvas' );
elementSwitchBar  = document.getElementById( 'inner-mode-bar' );
elementImageSrc   = document.getElementById( 'image-src' );
elementFileSrc    = document.getElementById( 'file-src' );
elementURLSrc     = document.getElementById( 'url-src' );
elementImgBufer   = document.getElementById( 'img-buffer' );
elementTracker    = document.getElementById( 'tracker' );
elementImageSelector = document.getElementById( 'image-selector' );
elementGlass         = document.getElementById( 'glass' );

var scrModeSelection = document.getElementsByName( 'srcMode' );


//event handlers
//----------------------------------------------------------------

var srcModeHandler = function( event ) {
	if ( event.target.value == 'remote' ) {
		elementFileSrc.style.display = 'none';
		elementURLSrc.style.display = 'initial';
	} else {
		elementFileSrc.style.display = 'initial';
		elementURLSrc.style.display = 'none';
	}
}

for ( var i = 0; i < scrModeSelection.length; i++ ) {
	scrModeSelection[ i ].onclick = srcModeHandler;
}
//----------------------------------------------------------------
elementURLSrc.onclick = function() {
	var fileName = window.clipboardData.getData( 'Text' );
	if ( true  ) {
		cropSwticherOn();
		elementImageSrc.value = fileName;
	}	
}
//----------------------------------------------------------------
elementFileSrc.onchange = function( event ) {	
	var fReader = new FileReader();

	fReader.readAsDataURL( event.target.files[ 0 ]);

	fReader.onloadend = ( event ) => {				
		var fileName = event.target.result;

		drawImage( fileName );
		cropSwticherOn();
		elementImageSrc.value = fileName;
	}
}
//----------------------------------------------------------------
elementGlass.onmousedown = function( event ) {
	markup = true;

	xStart = event.offsetX;
	yStart = event.offsetY;
	elementImageSelector.style.display = 'initial';
	elementImageSelector.style.left    = xStart + 'px';
	elementImageSelector.style.top     = yStart + 'px';
	elementImageSelector.style.width   = '1px';
	elementImageSelector.style.height  = '1px';
	refreshTracker();
}
//----------------------------------------------------------------
elementGlass.onmousemove = function( event ) {		
	var rect;

	if ( markup ) {
		xEnd = event.offsetX;
		yEnd = event.offsetY;

		rect = detectSelectedArea( xStart, yStart, xEnd, yEnd );

		elementImageSelector.style.left  = rect.x + 'px';
		elementImageSelector.style.width = rect.width + 'px';
		elementImageSelector.style.top    = rect.y + 'px';
		elementImageSelector.style.height = rect.height + 'px';
	
		refreshTracker();
	}
		
}
//----------------------------------------------------------------
elementGlass.onmouseup = function( event ) {


	if ( markup ) {
		var drawingInputContext = elementMainCanvas.getContext( '2d' );
		var drawingOuputContext = elementSaveCanvas.getContext( '2d' );

		var rect = detectSelectedArea( xStart, yStart, xEnd, yEnd );
		var selectedArea = drawingInputContext.getImageData( rect.x, rect.y, rect.width, rect.height );
		
		drawingOuputContext.clearRect( 0, 0, elementSaveCanvas.clientWidth , elementSaveCanvas.clientHeight );
		drawingOuputContext.putImageData( selectedArea, 0, 0 );		

		markup = false;
		elementImageSelector.style.display = 'none';
	}
	
	refreshTracker();
}
//----------------------------------------------------------------

//processor
//----------------------------------------------------------------
function detectSelectedArea( xStart, yStart, xEnd, yEnd ) {
	var rectangle = {};

	if ( xStart < xEnd ) {
		rectangle.x     = xStart;
		rectangle.width = xEnd - xStart;
	} else {
		rectangle.x     = xEnd;			
		rectangle.width = xStart - xEnd;			
	}
	if ( yStart < yEnd ) {
		rectangle.y      = yStart;
		rectangle.height = yEnd - yStart;
	} else {
		rectangle.y      = yEnd;
		rectangle.height = yStart - yEnd;
	}

	return rectangle;
}
//----------------------------------------------------------------
function cropSwticherOn() {
	elementSwitchBar.style.width = '100%';
}
//----------------------------------------------------------------
function cropSwticherOf() {
	elementSwitchBar.style.width = SWITCHER_RADIUS + 'px';
}
//----------------------------------------------------------------
function drawImage( fileName ) {
	var drawingContext = elementMainCanvas.getContext( '2d' );
	elementImgBufer.src = fileName;
	
	elementImgBufer.onload = function() {
		drawingContext.clearRect( 0, 0, elementMainCanvas.clientWidth , elementMainCanvas.clientHeight );
		drawingContext.drawImage( elementImgBufer, 0, 0, elementImgBufer.clientWidth, elementImgBufer.clientHeight );
	}; 
}
//----------------------------------------------------------------
function refreshTracker() {
	if ( markup ) {
		elementTracker.innerText = 'markup ' + markup + ' xStart = ' + xStart + ' yStart = ' + yStart + ' xEnd = ' + xEnd + ' yEnd = ' + yEnd;
	} else {
		elementTracker.innerText = '';
	}	
}	
//----------------------------------------------------------------