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
  * Version 2 of TG_Org has a "global" check of
  * event-block position, rather than checking
  * against a tree of levels... 
  */

(function(tg){

  // standard "brick" height for placement grid
  var lev_ht = tg.levelHeight = 12,
      // number of available levels for events
      $ = jQuery,
      ceiling_padding = 18;
      

  /*
  *  @constructor
  */
  tg.TG_Org = function() {
  
  	var me = this;
    var icon_f = tg.icon_folder;

    this.blocks = [];
    this.ids = [];
    this.vis = [];
    this.pol = -1;
    this.placedBlocks = [];
    this.freshBlocks = [];
       
   
	/*
	* ******** PUBLIC METHODS **********
	*/
  
    
    /*
    * TG_Org.addBlock
    * Adds a 2D geometric block object, corresponding to an event
    * into the "borg" layout.
    * 
    * @param {object} evob Event object including position values: left, width, top, height
                           -- no need for right and bottom
    * @param {string/number} tickScope This either "sweep" or the serial of a single tick (Number)
    * 
    */
    this.addBlock = function (evob, tickScope) {

		evob.right = evob.left + evob.width;
		evob.bottom = evob.top + evob.height;
		evob.tickScope = tickScope;
		me.freshBlocks.push(evob);
		me.blocks.push(evob);

    };
    
    
    /*
     *
     */
    this.clearFresh = function () {
    	me.freshBlocks = [];
    }
    
    
    /*
    * TG_Org.getBorg
    *
    * @return {object} This particular "borg" object with its blocks, etc
    * 
    */
    this.getBorg = function () {
      return this;
    };


    /*
    * TG_Org.getBlocks
    * 
    * @return {array} An array of placement blocks (objects), each corresponding
    *                 to an event on the timeline.
    * 
    */
    this.getBlocks = function () {
      return this.blocks;
    };


    /*
    * TG_Org.getHTML
    * @param {string|number} tickScope This either "sweep" or the serial of a single tick (Number)
    * @param {number} ceiling The max height of the timeline display, after which a "+" appears
    * @return {string} HTML with events passed back to view for actual layout of timeline
    */
    this.getHTML = function (tickScope, ceiling) {
      
		if (tickScope == "sweep") { 
			this.vis = [];
		}
	
		this.freshBlocks.sort(sortBlocksByImportance);
		// cycle through events and move overlapping event up
	
		var positioned = [], 
			blHeight, 
			lastPos, 
			span_selector_class, 
			span_div, 
			img = '', 
			icon = '',
			html = '', 
			south_padding = 0,
			b = {},
			blength = this.freshBlocks.length,
			b_span_color = "",
			title_adj = 0,
			highest = 0,
			img_scale = 100,
			img_style = "";
		
	
		for (var i=0; i<blength; i++) {
		
	  		b = this.freshBlocks[i];
			title_adj = 0;
			img_scale = 100;
			img_style = "";
			
	    	// full sweep or just a tick added left or right
			if (b.tickScope == tickScope) {

				// is it not yet visible?
				if (_.indexOf(b.id, this.vis) == -1) {
	
					// it's not in the "visible" array, so add it
					this.vis.push(b.id);
					
					// if it's got static HTML in it
					if (b.html && b.html.substr(0,4) == "<div") {
		            	// chop off the end and re-glue with style & id
						html += ("<div"+ 
		                      " style='left:" + b.left + "px' "+
		                      "id='" + b.id + "'"+
		                       b.html.substr(4));
		              
					} else {      
		            	
		            	// if it has an image, it's either in "layout" mode (out on timeline full size)
		            	// or it's going to be thumbnailed into the "bar"
						if (b.image) {
							
							if (b.shape && b.image.display_class == "inline") {
								img_style = " style='width:" + b.shape.img_wi + "px;height:auto;top:-" + b.shape.img_ht + "px'";
							} else {
								img_style = "";
							}

														 
								
							title_adj = 0; // b.shape.img_ht + 4;
							
							// different image classes ("bar", "above") are positioned
							// using a separate $.each routine in TimelineView rather than
							// being given absolute positioning here.
							img = "<div class='timeglider-event-image-" + b.image.display_class + "'><img src='" + b.image.src + "' " + img_style + "></div>";
							
							
						} else {
							// no image
							img = "";
						} 
		      		    
		      		    
		      		    highest = ceiling - ceiling_padding;
			           		
						if (b.y_position > 0) {
							// absolute positioning
							b.top = me.pol * b.y_position;
							
							
						} else {
							// starts out checking block against the bottom layer
							//!RECURSIVE
							// *** alters the `b` block object
							b.attempts = 0;
							checkAgainstPlaced(b, highest);
							
						}
						
												
						// note: divs that are higher have lower "top" values
						// `ceiling` being set at 0 (event_overflow set to "scroll") 
						// may require/allow for event scrolling possibilities...
						if (ceiling && (me.pol == -1) && (Math.abs(b.top) > highest)) {
							
							var p_icon = (b.icon) ? "<img src='" + icon_f + b.icon + "'>": "+";
							
						 	// + + + symbols in place of events just under ceiling
						 	// if things are higher than the ceiling, show plus signs instead,
						 	// and we'll zoom in with these.
							html += "<div class='timeglider-more-plus' style='left:" + b.left  + 
						        "px; top:-" + ceiling + "px'>" + p_icon + "</div>";
						        
						} else {
							
							if (b.fontsize > 2) {
							
								b_span_color = (b.span_color) ? ";background-color:" + b.span_color: "";
							
								b.fontsize < 10 ? b.opacity = b.fontsize / 10 : b.opacity=1;
							
								if (b.span == true) {
									span_selector_class = "timeglider-event-spanning";
									// add seconds into span data in case calculations
									// are in demand in DOM
									span_div = "<div data-starts='" + b.startdateObj.sec + "' data-ends='" + b.enddateObj.sec + "' class='timeglider-event-spanner' style='top:" + "px;height:" + b.fontsize + "px;width:" + b.spanwidth + "px" + b_span_color + "'></div>";
								} else {
									span_selector_class = ""; 
									span_div = "";
								}
			
								if (b.icon) {
								  icon = "<img class='timeglider-event-icon' src='" + icon_f + b.icon + "' style='height:"
								+ b.fontsize + "px;left:-" + (b.fontsize + 2) + "px; top:" + title_adj + "px'>";
								} else {
								  icon = '';
								}
							 
								// pad inverted (polarity 1) events to exceed the height
								// of the timeline title bar; pad "normal" top-up events
								// to have some space between them and the title bar
								south_padding = (me.pol === 1) ? 42 : -12;
							
								
							 
								// TODO: function for getting "standard" event shit
								html += "<div class='timeglider-timeline-event " 
									+ b.css_class + " " + span_selector_class 
									+ "' id='" + b.id + "' "
									+ "style='width:" + b.width  + "px;"
									+ "height:" + b.height + "px;"
									+ "left:" + b.left  + "px;" 
									+ "opacity:" + b.opacity + ";"
									+ "top:" + (b.top + south_padding) + "px;"
									+ "font-size:" + b.fontsize  + "px;'>"
									+ icon + img + span_div 
									+ "<div class='timeglider-event-title' style='top:" + title_adj + "px'>" 
									+ b.title
									+ "</div></div>";
							
							} // endif fontsize is > 1
						
						} // end if/else :: height > ceiling
	
					} // end if it's got valid HTML
	
				} // end check for visible... EXPENSIVE!!!!
				
			} // end tickScope check
			
		} // end for()

	
	return {"html":html};


	}; /// end getHTML





  /// PRIVATE STUFF ///
     
   /**
   * sortBlocksByImportance
   * Sorter helper for sorting events by importance
   * @param a {Number} 1st sort number
   * @param b {Number} 2nd sort number
   */
   var sortBlocksByImportance = function (a, b) {
      var x = b.importance, 
      	  y = a.importance;
      
      if (a.image && b.image){
      	return -1;
      }
      
      return ((x < y) ? -1 : ((x > y) ? 1 : 0));
  };

	/**
	* isOverlapping
	* Takes two objects and sees if the prospect overlaps with
	* an existing object [part of loop in checkAgainstPlaced()]
	*
	* @param {object} b1 Timeline-event object already in place
	* @param {object} b2 Timeline-event object being added to blocks
	*/       
	var isOverlapping = function (b1, b2) {
      
      //!TODO ******* POLARITY IS NOT WORKED INTO THIS YET
		
		var vPadding = -6,
			lPadding = -16;
		
		
		if ((b2.left + lPadding > b1.right) || (b2.right < b1.left + lPadding) || (b2.bottom < b1.top + vPadding)) {
			// clear to left or right.
			return false;
		
		} else {
		
			if (  
				((b2.left >= b1.left) && (b2.left <= b1.right)) ||
				((b2.right >= b1.left) && (b2.right <= b1.right)) ||
				((b2.right >= b1.right) && (b2.left <= b1.left)) ||
				((b2.right <= b1.right) && (b2.left >= b1.left))
		    ) {
		
			  	// OK, some kind of left-right overlap is happening, but
			  	// there also has to be top-bottom overlap for collision
				if (
	          		// 
	          		((b2.bottom <= b1.bottom) && (b2.bottom >= b1.top)) || 
	          		((b2.top <= b1.bottom) && (b2.top >= b1.top)) || 
	          		((b2.bottom == b1.bottom) && (b2.top == b1.top))
	          	  ) {
		    		// passes 2nd test -- it's overlapping!
		    		return true;
		
		  		} else {
		    		return false;
				}
				
		  	// end first big if: fails initial test
			}  
		return false;
		}

      // return false;

    };


	// private function
	var checkAgainstPlaced = function (block, ceil) {
       	
		var ol = false, 

			placed = me.placedBlocks,
			placed_len = me.placedBlocks.length,
			
			collision = false,

			shape_ol = false;

		
		if ((placed_len == 0) || (Math.abs(block.top) > ceil)) {
        	// just place it!
        	collision = false;
        	
        } else {
		
			// Go through all the blocks on that level...
			for (var e=0; e < placed_len; e++) {
				
				ol = isOverlapping(placed[e],block);
				
				/*
				if (block.shape) {
					shape_ol = isOverlapping(level_blocks[e], block.shape);
				}
				*/
				
				if (ol == true) {
					// BUMP UP
					if (me.pol === -1) {
						// DEFAULT, bottom up
						block.top -= lev_ht; 
						block.bottom -= lev_ht; 
					} else {
						// "SOUTH" side, top town
						block.top += lev_ht; 
						block.bottom += lev_ht; 
					}
			
					// THEN CHECK @ NEXT LEVEL
					// *** RECURSIVE ***
					block.attempts++;
					
					checkAgainstPlaced(block, ceil);
			
					collision = true;
					
					// STOP LOOP -- there's a collision
					break;
				} // end if overlap is true
				
			} // end for
		}

		if (collision == false) {
            
            me.placedBlocks.push(block);
               

			} // end if collision is false
        
		}; // end checkAgainstPlaced()
 
 
	}; ///// END TG_Org
      
      
	
})(timeglider);	