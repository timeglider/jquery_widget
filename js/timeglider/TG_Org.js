/*
* TG_Org
* sub-constructor of TimegliderTimelineView
*
*
*/

(function(tg){

  tg.levelHeight = 26; // across view and org, etc
  var levHt = tg.levelHeight; // local
  
  tg.TGOrg = function() {

    this.blocks = [];
    this.ids = [];
    this.vis = [];
    this.tree = [];
    var me = this;
 

    /// TODO::: REMOVE BLOCK (i.e. to/from same arrangement);
   
   
    /*
    ********* PUBLIC METHODS **********
    */
  
    
    /*
    * @param evob ==>  event object including position values
    * @param tickScope ==>  "sweep" or single tick serial (Number)
    */
    this.addBlock = function (evob, tickScope) {
       evob.right = evob.left + evob.width;
       evob.bottom = evob.top + evob.height;
       evob.tickScope = tickScope;
       me.blocks.push(evob);
    };
    
    this.getBorg = function () {
      return this;
    };

    this.getBlocks = function () {
      return this.blocks;
    };

    /*
    @param ==> serial would be to get new HTML for that tick ---
               on dragging the timeline vs. on zoom-refresh
    */
    this.getHTML = function (tickScope, filter) {

      if (tickScope == "sweep") { 
        freshTree();
        this.vis = [];
      }

      this.blocks.sort(sortBlocksByImportance);
      // cycle through them and move overlapping event
      var positioned = [], blHeight, lastPos, padding = 6,
      span_selector_class, span_div, img = "", html = '', b = {};
      // is this redundant with getHTML?:

      for (var i=0; i<this.blocks.length; i++) {
        b = this.blocks[i];

        if (b.tickScope == tickScope) {

          if (jQuery.inArray(b.id, this.vis) == -1) {
            this.vis.push(b.id);

            checkAgainstLevel(b, 0);
            
            if (b.image) {
              var vadj = "";
              if (b.image_class == "layout") {
                  vadj = " style='top:-" + (b.image_size.height + 4) + "px' ";
              }
              img = "<div class='timeglider-event-image-" + b.image_class + "'" + vadj + "><img src='" + b.image + "'></div>";
            } else {
              img = "";
            } 

            b.fontsize < 10 ? b.opacity = b.fontsize / 10 : b.opacity=1;
            if (b.span == true) {
              span_selector_class = "timeglider-event-spanning";
              span_div = "<div class='timeglider-event-spanner' style='height:" + b.fontsize + "px;width:" + b.spanwidth + "px'></div>"
            } else {
              span_selector_class = ""; 
              span_div = "";
            }

            if (b.image) {
              var vadj = "";
              if (b.image_class == "layout") {
                  vadj = " style='top:-" + (b.image_size.height + 4) + "px' ";
              }
              img = "<div class='timeglider-event-image-" + b.image_class + "'" + vadj + "><img src='" + b.image + "'></div>";
            } else {
              img = "";
            }

            html += "<div class='timeglider-timeline-event " + span_selector_class + "' id='ev_" + b.id + "' "
            + "style='width:" + b.width  + "px;"
            + "height:" + b.height + "px;"
            + "left:" + b.left  + "px;" 
            + "opacity:" + b.opacity + ";"
            + "top:" + b.top + "px;"
            + "font-size:" + b.fontsize  + "px;'>"
            + "<img class='timeglider-event-icon' src='" + b.icon + "' style='height:"
            + b.fontsize + "px;left:-" + (b.fontsize + 2) + "px'>" + img + span_div 
            + "<div class='timeglider-event-title'>" 
            + b.title
            + "</div></div>";

            } // end check for visible... EXPENSIVE!!!!
            } // end tickScope check
            } // end for()

            return html;
  }; /// end getHTML



  /*
    PROTECTED METHODS
  */
   var freshTree = function () {
     me.tree = [];
     for (var a=0; a < 100; a++) {
       // create 50 empty nested arrays for "quad tree"
       me.tree[a] = [];
     }
   };
   
 
   var sortBlocksByImportance = function (a, b) {
            var x = b.importance, y = a.importance;
            /// !TODO  
            /// if either is missing or invalid,. return -1
            return ((x < y) ? -1 : ((x > y) ? 1 : 0));
          };

             
   var isOverlapping = function (b1, b2) {

        if ((b2.left > b1.right) || (b2.right < b1.left)) {
          // Nice: it's clear to left or right.
          return false;

        } else {

          if (  
            ((b2.left >= b1.left) && (b2.left <= b1.right)) || 
            ((b2.right >= b1.left) && (b2.right <= b1.right)) || 
            ((b2.right >= b1.right) && (b2.left <= b1.left)) || 
            ((b2.right <= b1.right) && (b2.left >= b1.left))  
          ) {
            // Some kind of left-right overlap is happening...
            // passes first test of possible overlap: left-right overlap
            if (  ((b2.bottom <= b1.bottom) && (b2.bottom >= b1.top)) || ((b2.top <= b1.bottom) && (b2.top >= b1.top)) || ((b2.top == b1.bottom) && (b2.top == b1.top))  ) {
              // passes 2nd test -- it's overlapping
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

   var checkAgainstLevel = function (block, l_index) {

      var ol = false,
        tree = me.tree,
        index = tree[l_index],
        next_level = l_index + 1,
        collision = false;
      if (index != undefined) {
        
        for (var e=0; e < index.length; e++) {

          ol = isOverlapping(index[e],block);

          if (ol == true) {
            // BUMP UP
            block.top -= levHt; // timeglider.levelHeight;
            block.bottom -= levHt; // timeglider.levelHeight;
            // THEN CHECK @ NEXT LEVEL
            checkAgainstLevel(block,next_level);
            collision = true;
            // STOP LOOP -- there's a collision
            break;
          } 
          } // end for

          if (collision == false) {
            // ADD TO TREE OF PLACED EVENTS
            block.top -= block.fontsize;
          
            // PLACE BLOCK!
            index.push(block);
            
            
            if ((block.fontsize * 1.5) > (levHt * 2)) {
              tree[next_level].push(block);
              if ((block.fontsize * 1.5) > (levHt * 3)) {
                  tree[next_level + 1].push(block);
              }
            }
            
            
         
   
          }
        
      }
      }; // end checkAgainstLevel()
      
      
      ///// END TGOrg
  }; 
      
      
	
})(timeglider);	