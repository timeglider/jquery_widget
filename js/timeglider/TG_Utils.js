

function getLowHigh(arr) {
	
	var i, n, 
		high = parseFloat(arr[0]), 
		low=parseFloat(arr[0]);
	
	for(i=0; i<arr.length; i++) {
		n = parseFloat(arr[i]);
		if (n<low) low = n;
		if (n>high) high = n;
	}
	
	return {"high":high, "low":low}
}



/* a div with id of "hiddenDiv" has to be pre-loaded! */
function getStringWidth (str) {
		// var size = obj.fontSize; 
		$ms = $("#TimegliderMeasureSpan");
		$ms.html(str + "");
		var w = $ms.width() + 4;
		// $ms.remove();
		$ms.html('');
		return w;
	}
	
		
function invSliderVal (v) {
		return Math.abs(v - 101);
}



function trace(msg) {
		if (msg == "x") { $("#trace_box").css({display:"none"}); return false; }
		if (msg == "c") { $("#trace_content").html(""); return false; }
		$("#trace_content").append("<br>" + msg);
	}
	
	
function output(arg, section) {
	$("#" + section).text(arg);
}

$(document).ready(function () { 
		$("#trace_box").draggable({handle:"#trace_head"});					
});

/*
 * jQuery touch and gesture detection.
 * 
 * identifies support for touch and gestures.
 * 
 * Usage:  
 * 
 * if ($fn.browserTouchSupport.touches) {
 *     // Touch specific interactions
 * }
 * 
 * Support:
 * bool $.fn.browserTouchSupport.touches  // all touches supported
 * bool $.fn.browserTouchSupport.gestures // all gestures supported
 * bool $.fn.browserTouchSupport.touchstart
 * bool $.fn.browserTouchSupport.touchmove
 * bool $.fn.browserTouchSupport.touchend
 * bool $.fn.browserTouchSupport.gesturestart
 * bool $.fn.browserTouchSupport.gesturechange
 * bool $.fn.browserTouchSupport.gestureend
 * 
 * 
 * @author     Jeffrey Sambells <jeff@tropicalpixels.com>
 * @license    The MIT License
 * 
 * Copyright (c) 2010 Jeffrey Sambells / TropicalPixels
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */
(function($) {
	
	var support = {};
	
	var events = [
		'touchstart',
		'touchmove',
		'touchend',
		'gesturestart',
		'gesturechange',
		'gestureend'
	];

	var el = document.createElement('div');

	for( i in events ) {
		var eventName = events[i];
		eventName = 'on' + eventName;
		var isSupported = (eventName in el);
		if (!isSupported) {
			el.setAttribute(eventName, 'return;');
			isSupported = typeof el[eventName] == 'function';
		}
		support[events[i]] = isSupported;
	}

	support.touches = 
		support.touchstart 
		&& support.touchend 
		&& support.touchmove;
	
	support.gestures = 
		support.gesturestart && 
		support.gesturechange && 
		support.gestureend;
	
	$.fn.browserTouchSupport = support;
	
})(jQuery);
