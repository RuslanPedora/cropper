'use strict'


//const
//----------------------------------------------------------------
var SWITCHER_RADIUS = 30;


//markers
//----------------------------------------------------------------
var cropModeActivated = false;
var markup = false;
var xStart, yStart, xEnd, yEnd;
var canvasTop, canvasLeft;


//document elements
//----------------------------------------------------------------
var elementMainCanvas     = document.getElementById( 'main-canvas' );
var elementSaveCanvas     = document.getElementById( 'save-canvas' );
var elementPaintContainer = document.getElementById( 'paint-container' );
var elementSwitchBar  = document.getElementById( 'inner-mode-bar' );
var elementImageSrc   = document.getElementById( 'image-src' );
var elementFileSrc    = document.getElementById( 'file-src' );
var elementURLSrc     = document.getElementById( 'url-src' );
var elementImgBufer   = document.getElementById( 'img-buffer' );
var elementTracker    = document.getElementById( 'tracker' );
var elementImageSelector = document.getElementById( 'image-selector' );
var elementGlass         = document.getElementById( 'glass' );
var elementBody          = document.getElementById( 'glass' );


var elementBrowseButton  = document.getElementById( 'file-browse' );
var elementCancelButton  = document.getElementById( 'cancel-button' );
var elementReplaceButton = document.getElementById( 'replace-button' );
var elementSaveButton    = document.getElementById( 'save-button' );
var elementServLink      = document.getElementById( 'serv-link' );


var scrModeSelection = document.getElementsByName( 'srcMode' );


//event handlers
//----------------------------------------------------------------
document.addEventListener( 'paste', function ( evt ) {
  console.log(evt.clipboardData.getData('text/plain'));
});

var srcModeHandler = function( event ) {
	if ( event.target.value == 'remote' ) {
		elementBrowseButton.style.display = 'none';
		elementURLSrc.style.display = 'initial';
	} else {
		elementBrowseButton.style.display = 'initial';
		elementURLSrc.style.display = 'none';
	}
}

for ( var i = 0; i < scrModeSelection.length; i++ ) {
	scrModeSelection[ i ].onclick = srcModeHandler;
}
//----------------------------------------------------------------
elementBrowseButton.onclick = function() {
}
//----------------------------------------------------------------
elementURLSrc.onclick = function() {
	var fileName;

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
	}
}
//----------------------------------------------------------------
elementGlass.onmousedown = function( event ) {

	if( !cropModeActivated) {
		return;
	}
	markup = true;

	xStart = event.offsetX;
	yStart = event.offsetY;
	xEnd = xStart;
	yEnd = yStart;

	canvasTop  = elementMainCanvas.offsetTop + elementPaintContainer.offsetTop;
	canvasLeft = elementMainCanvas.offsetLeft + elementPaintContainer.offsetLeft;

	maxymizeGlass();

	elementImageSelector.style.display = 'initial';
	rednerImageSelector( xStart, yStart, xEnd, yEnd )

	refreshTracker();
}
//----------------------------------------------------------------
elementGlass.onmousemove = function( event ) {		
	var rect;

	if ( markup ) {
		xEnd = Math.min( Math.max( event.offsetX - canvasLeft, 0 ), elementMainCanvas.clientWidth );
		yEnd = Math.min( Math.max( event.offsetY - canvasTop, 0 ), elementMainCanvas.clientHeight );

		rednerImageSelector( xStart, yStart, xEnd, yEnd );
		refreshTracker();
	}
		
}
//----------------------------------------------------------------
elementGlass.onmouseup = function( event ) {


	if ( markup ) {
		var drawingInputContext = elementMainCanvas.getContext( '2d' );
		var drawingOutputContext = elementSaveCanvas.getContext( '2d' );
		var rect;
		var selectedArea;

		markup = false;
		xEnd = Math.min( Math.max( event.offsetX - canvasLeft, 0 ), elementMainCanvas.clientWidth );
		yEnd = Math.min( Math.max( event.offsetY - canvasTop, 0 ), elementMainCanvas.clientHeight );

		elementImageSelector.style.display = 'none';
		minimizeGlass();
		refreshTracker();

		rect = detectSelectedArea( xStart, yStart, xEnd, yEnd );

		if ( rect.width == 0 || rect.height == 0 ) {
			return;
		}
		
		selectedArea = drawingInputContext.getImageData( rect.x, rect.y, rect.width, rect.height );

		drawingOutputContext.clearRect( 0, 0, elementSaveCanvas.clientWidth , elementSaveCanvas.clientHeight );
		drawingOutputContext.putImageData( selectedArea, 0, 0 );		

	}
	
	refreshTracker();
}
//----------------------------------------------------------------
elementGlass.onmouseout = function( event ) {
	
	markup = false;
	elementImageSelector.style.display = 'none';

	minimizeGlass();
	refreshTracker();
}
//----------------------------------------------------------------
elementCancelButton.onclick = function() {
	var drawingOuputContext = elementSaveCanvas.getContext( '2d' );
	
	drawingOuputContext.clearRect( 0, 0, elementSaveCanvas.clientWidth , elementSaveCanvas.clientHeight );
}
//----------------------------------------------------------------
elementReplaceButton.onclick = function() {
	var drawingOutputContext = elementMainCanvas.getContext( '2d' );
	var drawingInputContext = elementSaveCanvas.getContext( '2d' );
	var selectedArea = drawingInputContext.getImageData( 0, 0, elementSaveCanvas.clientWidth, elementSaveCanvas.clientHeight );
	
	drawingOutputContext.putImageData( selectedArea, 0, 0 );		
}
//----------------------------------------------------------------
elementSaveButton.onclick = function() {
	var dataURL = elementSaveCanvas.toDataURL( 'C:\\Development\\Projects\\cropper\\1.jpg' );
	console.log( dataURL);

	elementServLink.download = 'cropped-image.png';
	elementServLink.href = dataURL.replace("image/png", "image/octet-stream");
	elementServLink.click();
}


//processor
//----------------------------------------------------------------
function maxymizeGlass() {

	elementGlass.style.position = 'fixed';
	elementGlass.style.width    = '100vw';
	elementGlass.style.height   = '100vh';
}
//----------------------------------------------------------------
function minimizeGlass() {

	elementGlass.style.position = 'absolute';
	elementGlass.style.width    = elementMainCanvas.clientWidth + 'px';
	elementGlass.style.height   = elementMainCanvas.clientHeight + 'px';	
}
//----------------------------------------------------------------
function rednerImageSelector( xStart, yStart, xEnd, yEnd ) {
	var	rect = detectSelectedArea( xStart, yStart, xEnd, yEnd );

	elementImageSelector.style.left  = rect.x + 'px';
	elementImageSelector.style.width = rect.width + 'px';
	elementImageSelector.style.top    = rect.y + 'px';
	elementImageSelector.style.height = rect.height + 'px';
}
//----------------------------------------------------------------
function detectSelectedArea( xStart, yStart, xEnd, yEnd ) {
	var rectangle = {};

	if ( xStart < xEnd ) {
		rectangle.x     = Math.max( xStart, 1 ) + elementMainCanvas.offsetLeft;
		rectangle.width = xEnd - xStart;
	} else {
		rectangle.x     = Math.max( xEnd, 1 ) + elementMainCanvas.offsetLeft;			
		rectangle.width = xStart - xEnd;			
	}		
	rectangle.width = Math.min( rectangle.width, elementMainCanvas.clientWidth - rectangle.x - 1 );

	if ( yStart < yEnd ) {
		rectangle.y      = Math.max( yStart, 1 ) + elementMainCanvas.offsetTop;
		rectangle.height = yEnd - yStart;
	} else {
		rectangle.y      = Math.max( yEnd, 1 ) + elementMainCanvas.offsetTop;
		rectangle.height = yStart - yEnd;
	}
	rectangle.height = Math.min( rectangle.height, elementMainCanvas.clientHeight - rectangle.y - 1 );

	return rectangle;
}
//----------------------------------------------------------------
function cropSwticherOn() {
	elementSwitchBar.style.width = '100%';
	elementGlass.style.cursor = 'crosshair';
	cropModeActivated= true;	
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
		elementImageSrc.value = fileName;
		drawingContext.clearRect( 0, 0, elementMainCanvas.clientWidth , elementMainCanvas.clientHeight );
		drawingContext.drawImage( elementImgBufer, 0, 0, elementImgBufer.clientWidth, elementImgBufer.clientHeight );

		cropSwticherOn();
	}; 
}
//----------------------------------------------------------------
function refreshTracker() {
	if ( markup ) {
		var rect = detectSelectedArea( xStart, yStart, xEnd, yEnd );
		elementTracker.innerText = '' + rect.width + ' x ' + rect.height + 'px' + ' x  = ' + rect.x + ' y  = ' + rect.y;
	} else {
		elementTracker.innerText = '';
	}	
}	
//----------------------------------------------------------------