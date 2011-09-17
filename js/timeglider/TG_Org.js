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
  var lev_ht = tg.levelHeight = 10,
      // number of available levels for events
      tree_levels = 300,
      $ = jQuery,
      ceiling_padding = 16;
  
  
  /*
  *  @constructor
  */
  tg.TG_Org = function() {

    this.blocks = [];
    this.ids = [];
    this.vis = [];
    this.tree = [];
    var me = this;
 

    /// TODO::: REMOVE BLOCK (i.e. to/from same arrangement);
   
   
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
        img = '', icon = ''
        html = '', 
        b_htm = '',
        b = {},
        blength = this.blocks.length,
        title_adj = 0;
      
      for (var i=0; i<blength; i++) {
        b = this.blocks[i];

        // not sure why we're checking against this...
        if (b.tickScope == tickScope) {
          
          // is it not yet visible?
          if ($.inArray(b.id, this.vis) == -1) {
            
            // it's not in the "visible" array, so add it
            this.vis.push(b.id);
            title_adj = 0;
            
            
            if (b.html && b.html.substr(0,4) == "<div") {
              // chop off the end and re-glue with style & id
              
              b_htm = "<div"+ 
                      " style='left:" + b.left + "px' "+
                      "id='" + b.id + "'"+
                       b.html.substr(4);
              
              html += b_htm;
              
            } else {      
            
            // if it has an image, it's either in "layout" mode (out on timeline full size)
            // or it's going to be thumbnailed into the "bar"
            if (b.image) {
              if (b.image.display_class == "layout") {
                title_adj = b.image.height + 4;
              } 
              // different image classes ("bar", "above") are positioned
              // in an $.each routine back in TimelineView rather than
              // being given absolute positioning here.
              img = "<div class='timeglider-event-image-" + b.image.display_class + "'><img src='" + b.image.src + "'></div>";
            } else {
              // no image
              img = "";
            } 
      
            // starts out checking block against the bottom layer
            // *** This actually makes changes to the block object
            checkAgainstLevel(b, 0);
            
            // KEEP 
            if (b.y_position > 0) {
              b.top = -1 * b.y_position;
            }
    
            b.fontsize < 10 ? b.opacity = b.fontsize / 10 : b.opacity=1;
            if (b.span == true) {
              span_selector_class = "timeglider-event-spanning";
              span_div = "<div class='timeglider-event-spanner' style='top:" + title_adj + "px;height:" + b.fontsize + "px;width:" + b.spanwidth + "px'></div>"
            } else {
              span_selector_class = ""; 
              span_div = "";
            }
            
            if (b.icon) {
              icon = "<img class='timeglider-event-icon' src='" + b.icon + "' style='height:"
            + b.fontsize + "px;left:-" + (b.fontsize + 2) + "px; top:" + title_adj + "px'>";
            } else {
              icon = '';
            }
            
          // note: divs that are higher have lower "top" values
           if (Math.abs(b.top) > (ceiling - ceiling_padding)) {
             // + + + symbols in place of events just under ceiling
             // if things are higher than the ceiling, show plus signs instead,
             // and we'll zoom in with these.
              html += "<div class='timeglider-more-plus' style='left:" + b.left  + 
                    "px; top:-" + (ceiling - (Math.floor(ceiling_padding/3))) + "px'>+</div>";
                    
                    
           } else {
             
             // TODO: function for getting "standard" event shit
              html += "<div class='timeglider-timeline-event " + span_selector_class + "' id='" + b.id + "' "
              + "style='width:" + b.width  + "px;"
              + "height:" + b.height + "px;"
              + "left:" + b.left  + "px;" 
              + "opacity:" + b.opacity + ";"
              + "top:" + b.top + "px;"
              + "font-size:" + b.fontsize  + "px;'>"
              + icon + img + span_div 
              + "<div class='timeglider-event-title' style='top:" + title_adj + "px'>" 
              + b.title
              + "</div></div>";
              
              
            
           }// end if/else :: height > ceiling
            
          } // end if it's got valid HTML
            

            } // end check for visible... EXPENSIVE!!!!
          } // end tickScope check
        } // end for()

            return html;
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
      /// !TODO :: if missing or invalid, return -1
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
    
          // So, some kind of left-right overlap is happening, but
          // there also has to be top-bottom overlap for collision
          if (  ((b2.bottom <= b1.bottom) && (b2.bottom >= b1.top)) || ((b2.top <= b1.bottom) && (b2.top >= b1.top)) || ((b2.top == b1.bottom) && (b2.top == b1.top))  ) {
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


   var checkAgainstLevel = function (block, level_num) {
       
      var ol = false, ol2 = false, tree = me.tree,

        // level_blocks is the array of blocks at a level
        level_blocks = tree[level_num],
        next_level = level_num + 1,
        collision = false,
        bricks_high = 2;
        bump_ht = lev_ht;
                
      if (level_blocks != undefined) {
        
        // Go through all the blocks on that level...
        for (var e=0; e < level_blocks.length; e++) {
    
          ol = isOverlapping(level_blocks[e],block);
          // Add more isOverlapping checks here for taller blocks
  
          if (ol == true) {
            // BUMP UP
            block.top -= bump_ht; 
            block.bottom -= bump_ht; 
            // THEN CHECK @ NEXT LEVEL
            
            // *** RECURSIVE ***
            checkAgainstLevel(block,next_level);
            
            collision = true;
            // STOP LOOP -- there's a collision
            break;
          } 
          } // end for

          if (collision == false) {
            // ADD TO TREE OF PLACED EVENTS
            block.top -= block.fontsize;
          
            // Place block in level
            level_blocks.push(block);
         
            // find out how many (lev_ht px) levels (bricks) the event is high
            bricks_high = Math.ceil(block.height / lev_ht);
            var k=0, levToAddTo;
            
            for (k=1; k<=bricks_high; k++) {
              levToAddTo = level_num + k;
              tree[levToAddTo].push(block);
            }
   
          } // end if collision if false
        
      }  // end if level_blocks != undefined
      }; // end checkAgainstLevel()
 
 
  }; ///// END TG_Org
      
      
	
})(timeglider);	