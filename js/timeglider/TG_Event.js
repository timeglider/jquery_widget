/*
 * Timeglider for Javascript / jQuery 
 * http://timeglider.com/jquery
 *
 * Copyright 2011, Mnemograph LLC
 * Licensed under Timeglider Dual License
 * http://timeglider.com/jquery/?p=license
 *
 */
 
 /*
*
* TG_Event (Backbone Model)
*
*
*/

(function(tg){

	
	var TG_Date = tg.TG_Date,
		$ = jQuery,
		app_mediator;
	
	
	// map model onto larger timeglider namespace
	/////////////////////////////////////////////
	tg.TG_Event = Backbone.Model.extend({
	
		urlRoot : '/event',
	
		defaults: {
			"title":  "Untitled",
			"modalOpen":false
		},
		
	
		initialize: function(ev) { 
		
			if (ev.image) {
			// register image with image collection for gathering sizes.

				var display_class = ev.image_class || "layout";

				ev.image = {id: ev.id, src:ev.image, display_class:display_class, width:0, height:0};

				// this will follow up with reporting size in separate "thread"
				this.getEventImageSize(ev.image);
			
				// app_mediator.imagesToSize++;
				
	
			} else {
				ev.image = '';
			}
			
			ev.titleWidth = tg.getStringWidth(ev.title);	
			
			this.set(ev);
			
		},
		
		
		// TODO: validate event attributes
		validate: function (attrs) {
			// TODO		
		},
		
		
		getEventImageSize:function(img) { 
		
			var that = this,
				imgTesting = new Image(),
				img_src = imgTesting.src = img.src;
		
			imgTesting.onerror= delegatr(imgTesting, function () {
				debug.log("error loading image:" + img_src);
			});
		
			imgTesting.onload = delegatr(imgTesting, function () {
				that.get("image").height = this.height;
				that.get("image").width = this.width;
			});
		
			// hoised function here... TODO: move this to utilities
			function delegatr(contextObject, delegateMethod) {
				return function() {
					return delegateMethod.apply(contextObject, arguments);
				}
			};
	
		} // end getEventImageSize

	
	});
	
	
		

	
	
	
})(timeglider);