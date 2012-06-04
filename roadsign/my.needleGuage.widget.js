/*
* The Widget Code
*/



(function($){

	
	$.widget( "my.needleGuage", {
		
		// defaults!
		options : {
			min_value:0,
			max_value:100,
			initial_value:0,
			unit:"units"
		},
		
		
		
		/* _create
		 * build DOM element
		 */
		_create : function () {

			this.id = $(this.element).attr("id");
			
			var html = "<div class='ng-needle'></div><div class='ng-quant'></div><div class='ng-unit'></div><div class='ng-label1'></div><div class='ng-label2'></div></div>";
			
			this.element
				.html(html)
				.addClass("needleGuage-container");
			
		}, // eof _create()
	
	
	
		
		/**
		* _init
		* trigger code required with the element having
		* been created on the DOM
		*/
		_init : function () {	
			
			this.element.find(".ng-label1").text(this.options.min_value);
			this.element.find(".ng-label2").text(this.options.max_value);
			this.element.find(".ng-unit").text(this.options.unit);

			this.setValue(this.options.initial_value);
			
			this._highest_value = this.options.initial_value;

		},
		  
		  
		  
	
		/* 
		* setValue
		*/
		setValue : function (value) {
			
			var makeNeedleCSS = function (val) {
				var val = "rotate(" + val + "deg)";
				return {
					"-moz-transform":val,
					"-webkit-transform":val,
					"-ms-transform":val,
					"-o-transform":val,
				}
			};
			
			var prop = value / this.options.max_value,
				relative = Math.floor(180 * prop) + 7,
				deg = 0;
			
			if (relative > 90) {
				deg = relative + 90;
			} else {
				deg = relative + 270;
			}
				
			var cssObj = makeNeedleCSS(deg);
			this.element.find(".ng-needle").css(cssObj);
			this.element.find(".ng-quant").text(value);
			
			this._value = value;
			
			if (value > this._highest_value) {
				this._highest_value = value;
				this._trigger("newhigh", value);
			}
		},
		
		
		
		getValue: function() {
			return this._value;
		},
		
		
		getHigestValue: function() {
			return this._highest_value;
		},
		
		
		
		/**
		* destroy 
		* wipes out everything
		*/
		destroy : function () {
			$.Widget.prototype.destroy.apply(this, arguments);
			$(this.element).html("");
		}
	
	}); // end widget process

})(jQuery);