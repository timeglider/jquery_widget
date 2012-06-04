/*
* The Plugin Code
* based off Addi Osmani's plugin boilerplate pattern
*/
;(function ($, window, document, undefined ) {
  
	
	var pluginName = "roadsign",
		defaults = {"info":""};



	// The plugin constructor
	function Plugin( element, options ) {
        this.element = element;
        this.options = $.extend( {}, defaults, options) ;
        this._defaults = defaults;
        this._name = pluginName;
        this.init();
    }



	/* init()
	 * Does the main plugin stuff, using options and the element
	 */
    Plugin.prototype.init = function() {
        
	        var $el = $(this.element);
	        
	        this.content = $el.text();
	        
	        
	        // differentiate main text from other content
	        $el.html("<span class='maintext'>" + this.content + "</span>");
	        
	        
	        // making use of data attributes
	        if ($el.data("miles")) {
	        	$("<div class='miles'>" + $el.data("miles") + "</div>").appendTo($el);
	        }
	        
	        
	        if (this.options.info) {
	        	$el.append("<p>" + this.options.info + "</p>");
	        }
	        
	   
	        $el.addClass("roadsign")
				.bind("click", function() {
	        		$el.toggleClass("roadsign-info")
				});
	        
    };
    
    
   

    // PLUGIN TOASTER!
    $.fn[pluginName] = function ( options ) {
        return this.each(function () {
        	new Plugin( this, options );
        });
    }


})( jQuery, window, document);

/*
• immediate access to the core, data-containing instanceof
• simple object literal for framing methods
*/