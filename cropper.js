'use strict'


//const
//----------------------------------------------------------------
var SWITCHER_RADIUS = 30;


//markers
//----------------------------------------------------------------
var cropModeActivated = false;
var markup = false;
var xStart, yStart, xEnd, yEnd;


//document elements
//----------------------------------------------------------------
var elementMainCanvas = document.getElementById( 'main-canvas' );
var elementSaveCanvas = document.getElementById( 'save-canvas' );
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
	//elementFileSrc.click();

elementImageSrc.focus();
var e = new Event("keydown");
  e.key="v";    // just enter the char you want to send 
  e.keyCode=e.key.charCodeAt(0);
  e.which=e.keyCode;
  e.altKey=false;
  e.ctrlKey=true;
  e.shiftKey=false;
  e.metaKey=false;
  e.bubbles=true;
  document.dispatchEvent(e);	
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
	xEnd = event.offsetX;
	yEnd = event.offsetY;

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
		var drawingOutputContext = elementSaveCanvas.getContext( '2d' );

		var rect = detectSelectedArea( xStart, yStart, xEnd, yEnd );
		var selectedArea;

		markup = false;
		elementImageSelector.style.display = 'none';
		refreshTracker();

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

	//document.location.href = dataURL.replace("image/png", "image/octet-stream");

	elementServLink.download = 'save-fragment.png';
	elementServLink.href = dataURL.replace("image/png", "image/octet-stream");
	elementServLink.click();
}


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
		elementTracker.innerText = '' + rect.width + ' x ' + rect.height + 'px';
	} else {
		elementTracker.innerText = '';
	}	
}	
//----------------------------------------------------------------