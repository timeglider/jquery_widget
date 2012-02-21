/*
 * Timeglider for Javascript / jQuery 
 * http://timeglider.com/jquery
 *
 * Copyright 2011, Mnemograph LLC
 * Licensed under Timeglider Dual License
 * http://timeglider.com/jquery/?p=license
 *
 */
 

(function(tg){

  // standard "brick" height for placement grid
  var lev_ht = tg.levelHeight = 8,
      // number of available levels for events
      tree_levels = 300,
      $ = jQuery,
      ceiling_padding = 16;
      

  /*
  *  @constructor
  */
  tg.TG_Org = function() {
  
  	var me = this;
    var icon_f = tg.icon_folder;

    this.blocks = [];
    this.ids = [];
    this.vis = [];
    this.tree = [];
    this.pol = -1;
       
   
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
		me.blocks.push(evob);

    };
    
    
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
			freshTree();
			this.vis = [];
		}
	
		var level_tree = me.tree;
	
		this.blocks.sort(sortBlocksByImportance);
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
			blength = this.blocks.length,
			b_span_color = "",
			title_adj = 0,
			highest = 0,
			img_scale = 100,
			img_style = "",
			guageHighest = function(n) {
				highest = (n > highest) ? n : highest;
			};
      
		for (var i=0; i<blength; i++) {
	  		b = this.blocks[i];
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
		      
		           
						if (b.y_position > 0) {
							// absolute positioning
							b.top = me.pol * b.y_position;
						} else {
							// starts out checking block against the bottom layer
							// *** This CHANGES the `b` block object
							checkAgainstLevel(b, 0);
						}
						
						guageHighest(Math.abs(b.top));
	
						b_span_color = (b.span_color) ? ";background-color:" + b.span_color: "";
		            
						b.fontsize < 10 ? b.opacity = b.fontsize / 10 : b.opacity=1;
		            
						if (b.span == true) {
							span_selector_class = "timeglider-event-spanning";
							span_div = "<div class='timeglider-event-spanner' style='top:" + "px;height:" + b.fontsize + "px;width:" + b.spanwidth + "px" + b_span_color + "'></div>"
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
		            
						// note: divs that are higher have lower "top" values
						// `ceiling` being set at 0 (event_overflow set to "scroll") 
						// may require/allow for event scrolling possibilities...
						if (ceiling && (me.pol == -1) && (Math.abs(b.top) > (ceiling - ceiling_padding))) {
							
						 	// + + + symbols in place of events just under ceiling
						 	// if things are higher than the ceiling, show plus signs instead,
						 	// and we'll zoom in with these.
							html += "<div class='timeglider-more-plus' style='left:" + b.left  + 
						        "px; top:-" + (ceiling - (Math.floor(ceiling_padding/3))) + "px'>+</div>";
						         
						        
						} else {
						 
							south_padding = (me.pol === 1) ? 42 : 0;
						
						 
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
						
						} // end if/else :: height > ceiling
	
					} // end if it's got valid HTML
	
				} // end check for visible... EXPENSIVE!!!!
				
			} // end tickScope check
			
		} // end for()

	
	return {"html":html, "highest":highest};


	}; /// end getHTML





  /// PRIVATE STUFF ///
  
  /**
  * freshTree
  * Wipes out the old placement tree and sets up 300 empty levels
  */
   var freshTree = function () {
     me.tree = [];
     for (var a=0; a < tree_levels; a++) {
       // create 50 empty nested arrays for "quad tree"
       me.tree[a] = [];
     }
   };
   
   /**
   * sortBlocksByImportance
   * Sorter helper for sorting events by importance
   * @param a {Number} 1st sort number
   * @param b {Number} 2nd sort number
   */
   var sortBlocksByImportance = function (a, b) {
      var x = b.importance, y = a.importance;
      
      if (a.image && (!b.image)){
      	return -1;
      }
      
      return ((x < y) ? -1 : ((x > y) ? 1 : 0));
  };

  /**
   * isOverlapping
   * Takes two objects and sees if the prospect overlaps with
   * an existing object [part of loop in checkAgainstLevel()]
   *
   * @param {object} b1 Timeline-event object already in place
   * @param {object} b2 Timeline-event object being added to blocks
   */       
   var isOverlapping = function (b1, b2) {
      
      if ((b2.left > b1.right) || (b2.right < b1.left)) {
        // Whew: it's clear to left or right.
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
          if (  ((b2.bottom <= b1.bottom) && (b2.bottom >= b1.top)) || 
          		((b2.top <= b1.bottom) && (b2.top >= b1.top)) || 
          		((b2.top == b1.bottom) && (b2.top == b1.top))
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
	var checkAgainstLevel = function (block, level_num) {
       
		var ol = false, 
      		ol2 = false, 
      		tree = me.tree,

			// level_blocks is the array of blocks at a level
			level_blocks = tree[level_num],
			next_level = level_num + 1,
			collision = false,
			bricks_high = 2,
			last_lev = 0,
			shape_ol = false;
                
		if (level_blocks != undefined) {
        
			// Go through all the blocks on that level...
			for (var e=0; e < level_blocks.length; e++) {
			
				ol = isOverlapping(level_blocks[e],block);
				
				if (block.shape) {
					shape_ol = isOverlapping(level_blocks[e], block.shape);
				}
			
				if (ol == true || shape_ol == true) {
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
					checkAgainstLevel(block,next_level);
			
					collision = true;
					
					// STOP LOOP -- there's a collision
					break;
				} 
			} // end for

		
		if (collision == false) {
          	          
            if (me.pol === -1) {
            	block.top -= block.fontsize; 
            } else {
           		block.top += block.fontsize; 
            }
          	
          	// ADD TO TREE OF PLACED EVENTS
            // Place block in level
            level_blocks.push(block);
       
       		// find out how many (lev_ht px) levels (bricks) the event is high
        	bricks_high = Math.ceil(block.height / lev_ht);
            for (var k=1; k<=bricks_high; k++) {
            	//
            	add_to = level_num + k;
            	if (add_to <= tree_levels) {
            		tree[add_to].push(block); 
            		last_lev = add_to;
            	} else {
            		debug.log("too many levels!");
            	}
            }
                        // we have a "block shape"
            // i.e. something like an image
            if (block.shape) {
            	var shp = block.shape;
            	
            	var add_to = 0;
	            var bricks_high_img = Math.ceil(shp.img_ht / lev_ht);
	            var img_rt = block.left + shp.img_wi + 12;
	            var img_blk_bottom = block.top -4;
	            var img_blk_top = img_blk_bottom - shp.img_ht;
            	
				var img_blk = {left:block.left, right:img_rt, bottom:img_blk_bottom, top:img_blk_top};
				
				
	            // IMAGE
	            for (var i=1; i<=bricks_high_img; i++) { 
	 
	            	add_to = last_lev + i;
	            	
	            	if (add_to <= tree_levels) {
	            		tree[add_to].push(img_blk);
	            	}  
	            }
            }             

          } // end if collision is false
        
      }  // end if level_blocks != undefined
      }; // end checkAgainstLevel()
 
 
  }; ///// END TG_Org
      
      
	
})(timeglider);	