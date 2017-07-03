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
var lastValidURL = '';
//document elements
//----------------------------------------------------------------
var mainCanvasEl      = document.getElementById( 'main-canvas' );
var saveCanvasEl      = document.getElementById( 'save-canvas' );
var fullImageCanvasEl = document.getElementById( 'full-image-canvas' );
var cacheCanvasEl      = document.getElementById( 'cache-canvas' );

var imgBuferEl = document.getElementById( 'img-buffer' );
var imgFullEl = document.getElementById( 'full-img-buffer' );
var cacheImgEl      = document.getElementById( 'cache-img' );

var cropAreaEl = document.getElementById( 'crop-area' );
var glassEl         = document.getElementById( 'glass' );
var paintContainerEl = document.getElementById( 'paint-container' );
var cropContainerEl = document.getElementById( 'cropped-container' );


var compressCroppedAreaEl  = document.getElementById( 'compress-crop-area' );
var compressCroppedAreaWrapEl  = document.getElementById( 'compress-crop-area-wrapper' );
var switchBarEl  = document.getElementById( 'inner-mode-bar' );
var imagePathEl   = document.getElementById( 'image-path' );
var fileSrcEl    = document.getElementById( 'file-src' );
var hintEl = document.getElementById( 'hint' );
var trackerEl    = document.getElementById( 'tracker' );

var modalPopUpEl = document.getElementById( 'modal-wrapper' );

var browseButtonEl  = document.getElementById( 'file-browse' );
var cancelButtonEl  = document.getElementById( 'cancel-button' );
var replaceButtonEl = document.getElementById( 'replace-button' );
var saveButtonEl    = document.getElementById( 'save-button' );
var servLinkEl      = document.getElementById( 'serv-link' );


var scrModeSelectionEls = document.getElementsByName( 'src-selection-mode' );

var messageBoxEl = document.getElementById( 'message-box' );
var messageClosureEl = document.getElementById( 'message-closure' );
var messageContentEl = document.getElementById( 'message-content' );
//event handlers
var srcModeHandler = function( event ) {

	browseButtonEl.style.display = event.target.value === 'remote' ? 'none' : 'inline-block';
	imagePathEl.disabled = event.target.value === 'remote' ? false : true;
	hintEl.style.display = event.target.value === 'remote' ? 'initial' : 'none';
	if ( event.target.value === 'remote' ) {
		imagePathEl.value = '';
	}
}

for ( var i = 0; i < scrModeSelectionEls.length; i++ ) {
	scrModeSelectionEls[ i ].onclick = srcModeHandler;
}
//----------------------------------------------------------------
messageClosureEl.onclick = function() {

	hideMessage();
}
//----------------------------------------------------------------
imagePathEl.oninput = function( event ) {

	imagePathEl.value = '';
}
//----------------------------------------------------------------
imagePathEl.onpaste = function( event ) {
	var pastedText = event.clipboardData.getData('Text');

	if ( !isValidURLImageName( pastedText ) ) {
		showMessage( 'Wrong image URL name <br>' + pastedText + '<br> please paste an image URL' );
		return;
	}

	lastValidURL = pastedText;
	drawImage( pastedText, pastedText );			
	
}
//----------------------------------------------------------------
fileSrcEl.onclick = function( event ) {
	this.value = '';
}
//----------------------------------------------------------------
fileSrcEl.onchange = function( event ) {	
	var fReader = new FileReader();
	var fileNameShort = event.target.value;

	if ( !isValidFileName( fileNameShort ) ) {
		showMessage( 'Wrong image file name <br>' + fileNameShort + '<br> please select an image file (.bmp|.jpg|.jpeg|.png|.tiff|.gif)' );
		return;
	}

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
	hidePopUp();
}
//----------------------------------------------------------------
replaceButtonEl.onclick = function() {

	replaceByCropppedImage();	
	hidePopUp();
}
//----------------------------------------------------------------
saveButtonEl.onclick = function() {
	var dataURL = saveCanvasEl.toDataURL( 'images/png' );

	servLinkEl.download = 'cropped-image.png';	
	servLinkEl.href = dataURL;
	servLinkEl.click();
	if ( dataURL.length > 2000000 ) {
		showMessage( 'Please for large image use \'Save as\' option directly on cropped image' );
	} else {
		hidePopUp();	
	}
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
		rectangle.x     = Math.max( xStart, 0 ) + mainCanvasEl.offsetLeft;
		rectangle.width = xEnd - xStart;
	} else {
		rectangle.x     = Math.max( xEnd, 0 ) + mainCanvasEl.offsetLeft;			
		rectangle.width = xStart - xEnd;			
	}		
	rectangle.width = Math.min( rectangle.width, mainCanvasEl.clientWidth - rectangle.x - 2 );

	if ( yStart < yEnd ) {
		rectangle.y      = Math.max( yStart, 0 ) + mainCanvasEl.offsetTop;
		rectangle.height = yEnd - yStart;
	} else {
		rectangle.y      = Math.max( yEnd, 0 ) + mainCanvasEl.offsetTop;
		rectangle.height = yStart - yEnd;
	}
	rectangle.height = Math.min( rectangle.height, mainCanvasEl.clientHeight - rectangle.y - 2 );

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
	var cashSrc = imgBuferEl.src;	

	imgBuferEl.style.maxWidth = 'none';
	imgBuferEl.style.maxHeight = 'none';

	imgBuferEl.crossOrigin = 'anonymous';
	try {
		imgBuferEl.src = fileName;
	}
	catch ( err ) {
	}	
	
	imgBuferEl.onload = function() {
		var drawingContext;
			
		fullImageCanvasEl.style.width = imgBuferEl.clientWidth + 'px';
		fullImageCanvasEl.style.height = imgBuferEl.clientHeight + 'px';
		fullImageCanvasEl.width = imgBuferEl.clientWidth;
		fullImageCanvasEl.height = imgBuferEl.clientHeight;

		drawingContext = fullImageCanvasEl.getContext( '2d' );
		drawingContext.drawImage( imgBuferEl, 0, 0 );

		if ( imgBuferEl.clientWidth > paintContainerEl.clientWidth || imgBuferEl.clientHeight > paintContainerEl.clientHeight ) {
			compressCroppedAreaEl.disabled = false;
			compressCroppedAreaWrapEl.style.color = 'initial';
		} else {
			compressCroppedAreaEl.disabled = true;
			compressCroppedAreaWrapEl.style.color = 'rgb( 200, 200, 200 )';
		}

		if( imgBuferEl.clientWidth / paintContainerEl.clientWidth > 
			imgBuferEl.clientHeight / paintContainerEl.clientHeight ) {
			imgBuferEl.style.maxWidth = paintContainerEl.clientWidth;
		} else {
			imgBuferEl.style.maxHeight = paintContainerEl.clientHeight;
		}				

		mainCanvasEl.style.width = imgBuferEl.clientWidth + 'px';
		mainCanvasEl.style.height = imgBuferEl.clientHeight + 'px';
		mainCanvasEl.width = imgBuferEl.clientWidth;
		mainCanvasEl.height = imgBuferEl.clientHeight;

		drawingContext = mainCanvasEl.getContext( '2d' );
		drawingContext.drawImage( imgBuferEl, 0, 0, imgBuferEl.clientWidth, imgBuferEl.clientHeight );		

		imagePathEl.value = shortFileName;
		cropSwticherOn();
		minimizeGlass();
	}; 

	imgBuferEl.onerror = function () {
		showMessage( 'Image loading fail <br>' + shortFileName + '<br> wrong URL name or server doesn\'t support anonymous request' );
		imagePathEl.value = '';
	}
}
//----------------------------------------------------------------
function refreshTracker() {
	if ( markup ) {
		var rect = detectSelectedArea( xStart, yStart, xEnd, yEnd );
		trackerEl.innerText = '   ' + xStart + ',' + yStart + '	' + '❐ ' + rect.width + ' x ' + rect.height + 'px';
	} else {
		trackerEl.innerText = '';
	}	
}	
//----------------------------------------------------------------
function replaceByCropppedImage() {
	var drawingOutputContext = fullImageCanvasEl.getContext( '2d' );
	var drawingInputContext = saveCanvasEl.getContext( '2d' );
	var selectedArea = drawingInputContext.getImageData( 0, 0, saveCanvasEl.clientWidth, saveCanvasEl.clientHeight );
	var scaleX, scaleY, scale, newWidth, newHeight; 

	fullImageCanvasEl.style.width = saveCanvasEl.clientWidth + 'px';
	fullImageCanvasEl.style.height = saveCanvasEl.clientHeight + 'px';
	fullImageCanvasEl.width = saveCanvasEl.clientWidth;
	fullImageCanvasEl.height = saveCanvasEl.clientHeight;

	drawingOutputContext.putImageData( selectedArea, 0, 0 );

	scaleX = saveCanvasEl.clientWidth / paintContainerEl.clientWidth;
	scaleY = saveCanvasEl.clientHeight / paintContainerEl.clientHeight;
	scale = scaleX > scaleY ? scaleX : scaleY;

	if( scale > 1 ) {		
		newWidth = Math.round( saveCanvasEl.clientWidth / scale );
		newHeight = Math.round( saveCanvasEl.clientHeight / scale );

		imgBuferEl.style.maxWidth = 'none';
		imgBuferEl.style.maxHeight = 'none';
		imgBuferEl.src = saveCanvasEl.toDataURL("image/png");

		imgBuferEl.onload = function (){

			imgBuferEl.style.maxWidth = newWidth + 'px';
			imgBuferEl.style.maxHeight = newHeight + 'px';

			mainCanvasEl.style.width = newWidth + 'px';
			mainCanvasEl.style.height = newHeight + 'px';
			mainCanvasEl.width = newWidth;
			mainCanvasEl.height = newHeight;

			drawingOutputContext = mainCanvasEl.getContext( '2d' );

		    drawingOutputContext.drawImage( imgBuferEl, 0, 0, newWidth, newHeight );
		}

		return;
	} else {
		compressCroppedAreaEl.disabled = true;
		compressCroppedAreaWrapEl.style.color = 'rgb( 200, 200, 200 )';
	}

	drawingOutputContext = mainCanvasEl.getContext( '2d' );

	mainCanvasEl.style.width = saveCanvasEl.clientWidth + 'px';
	mainCanvasEl.style.height = saveCanvasEl.clientHeight + 'px';
	mainCanvasEl.width = saveCanvasEl.clientWidth;
	mainCanvasEl.height = saveCanvasEl.clientHeight;

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
		try {
			areaToCopy = drawingInputContext.getImageData( rect.x, rect.y, rect.width, rect.height );
		}
		catch ( errorObj ) {
			showMessage( 'Unable to crop data '  + errorObj.name );
			return;
		}	

		saveCanvasEl.style.width = rect.width + 'px';
		saveCanvasEl.style.height = rect.height + 'px';
		saveCanvasEl.width = rect.width;
		saveCanvasEl.height = rect.height;

		drawingOutputContext = saveCanvasEl.getContext( '2d' );		
		drawingOutputContext.putImageData( areaToCopy, 0, 0 );		

		showPopUp();
	}
}
//----------------------------------------------------------------
function showPopUp() {

	cropContainerEl.style.display = 'initial';
	modalPopUpEl.style.width = '100vw';
	modalPopUpEl.style.height = '100vh';
	modalPopUpEl.style.visibility = 'visible';
}
//----------------------------------------------------------------
function hidePopUp() {

	modalPopUpEl.style.width = '.1px';
	modalPopUpEl.style.height = '.1px';
	modalPopUpEl.style.visibility = 'hidden';
	cropContainerEl.style.display = 'none';
}
//----------------------------------------------------------------
function showMessage( text ) {
	messageContentEl.innerHTML = text;
	messageBoxEl.style.display = 'initial';
	messageBoxEl.style.left = 'calc( 50% - ' + messageBoxEl.clientWidth / 2 + 'px )';
}
//----------------------------------------------------------------
function hideMessage() {
	messageBoxEl.style.display = 'none';
}
//----------------------------------------------------------------
function isValidFileName( fileName ) {
	return fileName.match( /(.bmp|.jpg|.jpeg|.png|.tiff|.gif)$/i );
}
//----------------------------------------------------------------
function isValidURLImageName( pastedText ) {
	return pastedText.match( /^(http[s]*\:\/\/)([\w.-]+)(\/[\w.-]+)*(.bmp|.jpg|.jpeg|.png|.tiff|.gif)$/i );
}