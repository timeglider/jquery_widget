/*
* TG_Utils
* 
*
*
*/


/* GLOBAL */
function output(arg, section) {
  
  $("#" + section).text(arg);
  
};


(function(tg){
  

tg.getLowHigh = function (arr) {
	
	var i, n, 
		high = parseFloat(arr[0]), 
		low = high;
	 
	for (i=0; i<arr.length; i++) {
		n = parseFloat(arr[i]);
		if (n<low) low = n;
		if (n>high) high = n;
	}
	
	return {"high":high, "low":low}
	
};



/* a div with id of "hiddenDiv" has to be pre-loaded */
tg.getStringWidth  = function (str) {
		// var size = obj.fontSize; 
		$ms = $("#TimegliderMeasureSpan");
		$ms.html(str + "");
		var w = $ms.width() + 4;
		// $ms.remove();
		$ms.html('');
		return w;
};
	
		
tg.invSliderVal = function(v) {
		return Math.abs(v - 101);
};




// DORMANT
tg.validateOptions = function (stgs) {	
		var ret = true,
			optionsTypes = optionsMaster;
			// final return message: good/true if empty
			msg = "",
			lb = "\n";
		
		$.each(stgs, function(key, value) { 
			
			if (optionsTypes[key]) {
				//trace ("key:" + key + ", type:" + optionsTypes[key].type);
				switch (optionsTypes[key].type) {
					case "string": 
						if (typeof value != "string") msg += (key + " needs to be a string." + lb);
						if (optionsTypes[key].possible) {
							if ($.inArray(value, optionsTypes[key].possible) == -1) {
								msg += (key + " must be: " + optionsTypes[key].possible.join(" or "));
							}
						}
					break;
					
					case "number":
						if (typeof value != "number") msg += (value + " needs to be a number." + lb);
						if (optionsTypes[key].min) {
							if (value < optionsTypes[key].min) {
								msg += (key + " must be greater than " + optionsTypes[key].min + lb);
							}
						}
						
						if (optionsTypes[key].max) {
							if (value > optionsTypes[key].max) {
								msg += (key + " must be less than " + optionsTypes[key].max + lb);
							}
						}
					break;
					
					case "date":
						// TODO validate a date string using TG_Date...
					break;
					
					case "boolean":
						if (typeof value != "boolean") msg += (value + " needs to be a number." + lb);
					break;
					
					case "url":
						// TODO test for pattern for url....
					break;
					
					case "color":
						/// TODO test for pattern for color, including "red", "orange", etc
					break;
					
					default: trace ("is there a default for validating options?");
					
				}
			}
		}); // end each
		
		return msg;
		
};

	
})(timeglider);	




