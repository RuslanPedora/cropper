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

var compressCroppedArea = false;
//document elements
//----------------------------------------------------------------
var mainCanvasEl      = document.getElementById( 'main-canvas' );
var saveCanvasEl      = document.getElementById( 'save-canvas' );
var fullImageCanvasEl = document.getElementById( 'full-image-canvas' );

var imgBuferEl = document.getElementById( 'img-buffer' );
var imgFullEl = document.getElementById( 'full-img-buffer' );

var cropAreaEl = document.getElementById( 'crop-area' );
var glassEl         = document.getElementById( 'glass' );
var paintContainerEl = document.getElementById( 'paint-container' );

var compressCroppedAreaEl  = document.getElementById( 'compress-crop-area' );
var switchBarEl  = document.getElementById( 'inner-mode-bar' );
var imagePathEl   = document.getElementById( 'image-path' );
var fileSrcEl    = document.getElementById( 'file-src' );
var trackerEl    = document.getElementById( 'tracker' );


var browseButtonEl  = document.getElementById( 'file-browse' );
var cancelButtonEl  = document.getElementById( 'cancel-button' );
var replaceButtonEl = document.getElementById( 'replace-button' );
var saveButtonEl    = document.getElementById( 'save-button' );
var servLinkEl      = document.getElementById( 'serv-link' );


var scrModeSelectionEls = document.getElementsByName( 'src-selection-mode' );


//event handlers
var srcModeHandler = function( event ) {

	browseButtonEl.style.display = event.target.value === 'remote' ? 'none' : 'initial';
}

for ( var i = 0; i < scrModeSelectionEls.length; i++ ) {
	scrModeSelectionEls[ i ].onclick = srcModeHandler;
}
//----------------------------------------------------------------
fileSrcEl.onchange = function( event ) {	
	var fReader = new FileReader();
	var fileNameShort = event.target.value;

	fileNameShort = fileNameShort.slice( fileNameShort.lastIndexOf( '\\' )  + 1 );
	fReader.readAsDataURL( event.target.files[ 0 ]);

	fReader.onloadend = ( event ) => {				
		var fileName = event.target.result;

		drawImage( fileName, fileNameShort );		
	}
}
//----------------------------------------------------------------
glassEl.onmousedown = function( event ) {

	if( !cropModeActivated) {
		return;
	}
	markup = true;

	xStart = event.offsetX;
	yStart = event.offsetY;
	xEnd = xStart;
	yEnd = yStart;

	canvasTop  = paintContainerEl.offsetTop;
	canvasLeft = paintContainerEl.offsetLeft;

	maxymizeGlass();

	cropAreaEl.style.display = 'initial';

	rednerCropArea( xStart, yStart, xEnd, yEnd )
	refreshTracker();
}
//----------------------------------------------------------------
glassEl.onmousemove = function( event ) {		
	var rect;

	if ( markup ) {
		xEnd = Math.min( Math.max( event.offsetX - canvasLeft, 0 ), mainCanvasEl.clientWidth );
		yEnd = Math.min( Math.max( event.offsetY - canvasTop, 0 ), mainCanvasEl.clientHeight );

		rednerCropArea( xStart, yStart, xEnd, yEnd );
		refreshTracker();
	}
		
}
//----------------------------------------------------------------
glassEl.onmouseup = function( event ) {

	xEnd = Math.min( Math.max( event.offsetX - canvasLeft, 0 ), mainCanvasEl.clientWidth );
	yEnd = Math.min( Math.max( event.offsetY - canvasTop, 0 ), mainCanvasEl.clientHeight );

	processCroppedArea();
	refreshTracker();
}
//----------------------------------------------------------------
glassEl.onmouseout = function( event ) {
	
	markup = false;
	cropAreaEl.style.display = 'none';

	minimizeGlass();
	refreshTracker();
}
//----------------------------------------------------------------
cancelButtonEl.onclick = function() {
	var drawingOuputContext = saveCanvasEl.getContext( '2d' );
	
	drawingOuputContext.clearRect( 0, 0, saveCanvasEl.clientWidth , saveCanvasEl.clientHeight );
}
//----------------------------------------------------------------
replaceButtonEl.onclick = function() {

	replaceByCropppedImage();	
}
//----------------------------------------------------------------
saveButtonEl.onclick = function() {
	var dataURL = saveCanvasEl.toDataURL( 'images/png' );

	console.log( dataURL);
	servLinkEl.download = 'cropped-image.png';
	servLinkEl.href = dataURL.replace("image/png", "image/octet-stream");
	servLinkEl.click();
}


//processors
//----------------------------------------------------------------
function maxymizeGlass() {

	glassEl.style.position = 'fixed';
	glassEl.style.width    = '100vw';
	glassEl.style.height   = '100vh';
}
//----------------------------------------------------------------
function minimizeGlass() {

	glassEl.style.position = 'absolute';
	glassEl.style.width    = mainCanvasEl.clientWidth + 'px';
	glassEl.style.height   = mainCanvasEl.clientHeight + 'px';	
}
//----------------------------------------------------------------
function rednerCropArea( xStart, yStart, xEnd, yEnd ) {
	var	rect = detectSelectedArea( xStart, yStart, xEnd, yEnd );

	cropAreaEl.style.left  = rect.x + 'px';
	cropAreaEl.style.width = rect.width + 'px';
	cropAreaEl.style.top    = rect.y + 'px';
	cropAreaEl.style.height = rect.height + 'px';
}
//----------------------------------------------------------------
function detectSelectedArea( xStart, yStart, xEnd, yEnd ) {
	var rectangle = {};

	if ( xStart < xEnd ) {
		rectangle.x     = Math.max( xStart, 1 ) + mainCanvasEl.offsetLeft;
		rectangle.width = xEnd - xStart;
	} else {
		rectangle.x     = Math.max( xEnd, 1 ) + mainCanvasEl.offsetLeft;			
		rectangle.width = xStart - xEnd;			
	}		
	rectangle.width = Math.min( rectangle.width, mainCanvasEl.clientWidth - rectangle.x - 1 );

	if ( yStart < yEnd ) {
		rectangle.y      = Math.max( yStart, 1 ) + mainCanvasEl.offsetTop;
		rectangle.height = yEnd - yStart;
	} else {
		rectangle.y      = Math.max( yEnd, 1 ) + mainCanvasEl.offsetTop;
		rectangle.height = yStart - yEnd;
	}
	rectangle.height = Math.min( rectangle.height, mainCanvasEl.clientHeight - rectangle.y - 1 );

	return rectangle;
}
//----------------------------------------------------------------
function cropSwticherOn() {
	switchBarEl.style.width = '100%';
	glassEl.style.cursor = 'crosshair';
	cropModeActivated= true;	
}
//----------------------------------------------------------------
function cropSwticherOf() {
	switchBarEl.style.width = SWITCHER_RADIUS + 'px';
}
//----------------------------------------------------------------
function drawImage( fileName, shortFileName ) {
	
	imgBuferEl.src = fileName;

	imgBuferEl.style.maxWidth = 'none';
	imgBuferEl.style.maxHeight = 'none';
	
	imgBuferEl.onload = function() {
		var drawingContext;
			
		fullImageCanvasEl.style.width = imgBuferEl.clientWidth + 'px';
		fullImageCanvasEl.style.height = imgBuferEl.clientHeight + 'px';
		fullImageCanvasEl.setAttribute( 'width', imgBuferEl.clientWidth );
		fullImageCanvasEl.setAttribute( 'height', imgBuferEl.clientHeight );

		drawingContext = fullImageCanvasEl.getContext( '2d' );
		drawingContext.drawImage( imgBuferEl, 0, 0 );

		if( imgBuferEl.clientWidth / paintContainerEl.clientWidth > 
			imgBuferEl.clientHeight / paintContainerEl.clientHeight ) {
			imgBuferEl.style.maxWidth = paintContainerEl.clientWidth;
		} else {
			imgBuferEl.style.maxHeight = paintContainerEl.clientHeight;
		}				

		document.getElementById( 'image-wrapper' ).style.zIndex = 10;
		setTimeout( function() {

		mainCanvasEl.style.width = imgBuferEl.clientWidth + 'px';
		mainCanvasEl.style.height = imgBuferEl.clientHeight + 'px';
		mainCanvasEl.setAttribute( 'width', imgBuferEl.clientWidth );
		mainCanvasEl.setAttribute( 'height', imgBuferEl.clientHeight );

		drawingContext = mainCanvasEl.getContext( '2d' );
		drawingContext.drawImage( imgBuferEl, 0, 0 );		

		document.getElementById( 'image-wrapper' ).style.zIndex = -10;

		}, 3000 );

		imagePathEl.value = shortFileName;
		cropSwticherOn();
		minimizeGlass();
	}; 

	imgBuferEl.onresize = function() {
		var q = 1;
	}
	imgBuferEl.onchange = function() {
		var q = 1;
	}
}
//----------------------------------------------------------------
function refreshTracker() {
	if ( markup ) {
		var rect = detectSelectedArea( xStart, yStart, xEnd, yEnd );
		trackerEl.innerText = '   ' + rect.x + ',' + rect.y + ' --> ' + rect.width + ' x ' + rect.height + 'px';
	} else {
		trackerEl.innerText = '';
	}	
}	
//----------------------------------------------------------------
function replaceByCropppedImage() {
	var drawingOutputContext = fullImageCanvasEl.getContext( '2d' );
	var drawingInputContext = saveCanvasEl.getContext( '2d' );
	var selectedArea = drawingInputContext.getImageData( 0, 0, saveCanvasEl.clientWidth, saveCanvasEl.clientHeight );
	var scaleX, scaleY, scale; 

	fullImageCanvasEl.style.width = saveCanvasEl.clientWidth + 'px';
	fullImageCanvasEl.style.height = saveCanvasEl.clientHeight + 'px';
	fullImageCanvasEl.setAttribute( 'width', saveCanvasEl.clientWidth );
	fullImageCanvasEl.setAttribute( 'height', saveCanvasEl.clientHeight );

	drawingOutputContext.putImageData( selectedArea, 0, 0 );

	scaleX = imgBuferEl.clientWidth / paintContainerEl.clientWidth;
	scaleY = imgBuferEl.clientHeight / paintContainerEl.clientHeight;
	scale = scaleX > scaleY ? scaleX : scaleY;

	if( scale > 1 ) {
		newWidth = saveCanvasEl.clientWidth / scale;
		newHeight = saveCanvasEl.clientHeight / scale;
		saveCanvasEl.style.width = newWidth + 'px';
		saveCanvasEl.style.height = newHeight + 'px';
		saveCanvasEl.setAttribute( 'width', newWidth );
		saveCanvasEl.setAttribute( 'height', newHeight );
	}	

	selectedArea = drawingInputContext.getImageData( 0, 0, saveCanvasEl.clientWidth, saveCanvasEl.clientHeight );
	drawingOutputContext = mainCanvasEl.getContext( '2d' );

	mainCanvasEl.style.width = saveCanvasEl.clientWidth + 'px';
	mainCanvasEl.style.height = saveCanvasEl.clientHeight + 'px';
	mainCanvasEl.setAttribute( 'width', saveCanvasEl.clientWidth );
	mainCanvasEl.setAttribute( 'height', saveCanvasEl.clientHeight );

	drawingOutputContext.putImageData( selectedArea, 0, 0 );
	minimizeGlass();
}
//----------------------------------------------------------------
function processCroppedArea() {
	var drawingInputContext;
	var drawingOutputContext;
	var rect;
	var areaToCopy;

	if ( markup ) {

		markup = false;

		cropAreaEl.style.display = 'none';
		minimizeGlass();
		refreshTracker();

		rect = detectSelectedArea( xStart, yStart, xEnd, yEnd );

		if ( rect.width == 0 || rect.height == 0 ) {
			return;
		}


		if ( compressCroppedAreaEl.checked ) {

			drawingInputContext = mainCanvasEl.getContext( '2d' );
			areaToCopy = drawingInputContext.getImageData( rect.x, rect.y, rect.width, rect.height );

		} else {

			rect.x = fullImageCanvasEl.clientWidth * rect.x / mainCanvasEl.clientWidth;
			rect.width = fullImageCanvasEl.clientWidth * rect.width / mainCanvasEl.clientWidth;
			rect.y = fullImageCanvasEl.clientHeight * rect.y / mainCanvasEl.clientHeight;
			rect.height = fullImageCanvasEl.clientHeight * rect.height / mainCanvasEl.clientHeight;

			drawingInputContext = fullImageCanvasEl.getContext( '2d' );

		}

		areaToCopy = drawingInputContext.getImageData( rect.x, rect.y, rect.width, rect.height );

		saveCanvasEl.style.width = rect.width + 'px';
		saveCanvasEl.style.height = rect.height + 'px';
		saveCanvasEl.setAttribute( 'width', rect.width );
		saveCanvasEl.setAttribute( 'height', rect.height );		

		drawingOutputContext = saveCanvasEl.getContext( '2d' );		
		drawingOutputContext.putImageData( areaToCopy, 0, 0 );		

	}
}