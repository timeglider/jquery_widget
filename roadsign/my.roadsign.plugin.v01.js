/*
* Version .01 is just the most primitive plugin code possible
*/
(function ($) {


 	$.fn.roadsign = function(options) {

			var defaults = {"info":""};
			
			// cycle through child elements in the main
			// plugin parent
    		return this.each(function() {
				
				var this_options = $.extend({}, defaults, options);

				var $el = $(this);
				var content = $el.text();

				$el
					.html("<span class='maintext'>" + content + "</span>")
					.addClass("roadsign")
					.bind("click", function() {
			    		$el.toggleClass("roadsign-info")
					});
				
				
				// make use of a data attribute
			    if ($el.data("miles")) {
			    	$("<div class='miles'>" + $el.data("miles") + "</div>").appendTo($el);
			    }
			    
			    
			    /*
			    if (this_options.info) {
	        		$el.append("<p>" + this_options.info + "</p>");
	        	}
	        	*/
	        	

    		});
    		
	} // end of $.fn.roadsign
    	


})(jQuery);

