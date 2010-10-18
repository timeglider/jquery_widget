

	var TGOrg = function(args) {
				this.blocks = [];
				this.tree = [];
				this.levelHeight = args.level_height;
			}
	
	TGOrg.prototype = {
	
				
				freshTree : function () {
					this.tree = [];
					for (var a=0; a < 100; a++) {
						// create 50 empty nested arrays for "quad tree"
						this.tree[a] = [];
					}
				},
				
				/// TODO::: REMOVE BLOCK (i.e. to/from same arrangement);
				///////////////////////
					
				// public method
				/*
				@param evob ==>  event object including position values
				@param tickScope ==>  "sweep" or single tick serial (Number)
				*/
				addBlock : function (evob, tickScope) {
					/// WILL INCLUDE TITLE, ID, CLASS
					/// 
					evob.right = evob.left + evob.width;
					evob.bottom = evob.top + evob.height;
					evob.tickScope = tickScope;
					this.blocks.push(evob);
				}, 
				
				
				getBorg : function () {
					return this;
				},
				
				getBlocks : function () {
					return this.blocks;
				},
				
				/*
				@param ==> serial would be to get just the new HTML for that tick
				*/
				getHTML : function (tickScope) {
					
					if (tickScope == "sweep") this.freshTree();
					
					this.blocks.sort(this.sortBlocksByImportance);
					// cycle through them and move overlapping event
					var positioned = [], blHeight, lastPos, padding = 6;
					var html = '', b;
					// is this redundant with getHTML?:
					for (var i=0; i<this.blocks.length; i++) {
						var b = this.blocks[i];
						
						if (b.tickScope == tickScope) {
						
						this.checkAgainstLevel(b, 0);

						b.fontsize < 10 ? b.opacity = b.fontsize / 10 : b.opacity=1;
					
						html += "<div class='timeglider-timeline-event' id='ev_" + b.id + "' "
						+ "style='width:" + b.width  + "px;"
						+ "height:" + b.height + "px;"
						+ "left:" + b.left  + "px;" 
						+ "opacity:" + b.opacity + ";"
						+ "top:" + b.top + "px;"
						+ "font-size:" + b.fontsize  + "px;'>"
						+ "<span id='evicon'><img src='img/test_icon.png' style='height:"
						+ b.fontsize + "px; width:auto'></span>"
						+ "<span id='evtitle'>" 
						+ b.title
						+ "</span></div>";
					} // end tickScope check
					}// end for()
					
					return html;
				},
		
		
				sortBlocksByImportance : function (a, b) {
					    var x = b.importance, y = a.importance;
						/// !TODO  
						/// if either is missing or invalid,. return -1
					    return ((x < y) ? -1 : ((x > y) ? 1 : 0));
				},
			
			
				is_overlapping : function (b1, b2) {
				
					if ((b2.left > b1.right) || (b2.right < b1.left)) {
					  // it's clear to left or right
					  return false;

					} else {

					// some kind of left-right overlap is happening...
						if (  
					      ((b2.left >= b1.left) && (b2.left <= b1.right)) || 
					      ((b2.right >= b1.left) && (b2.right <= b1.right)) || 
						  ((b2.right >= b1.right) && (b2.left <= b1.left)) || 
						  ((b2.right <= b1.right) && (b2.left >= b1.left))  
					   		) {
						
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

					return false;
					
				},
				
				checkAgainstLevel : function (block, l_index) {

						var tree = this.tree;
						var next_level = l_index + 1;
						var collision = false;

						for (var e=0; e < tree[l_index].length; e++) {

								// p_iterations++;
								var ol = this.is_overlapping(tree[l_index][e],block);
							
								if (ol == true) {
									/// BUMP UP!!
									block.top -= this.levelHeight;
									block.bottom -= this.levelHeight;
									//  THEN CHECK @ NEXT LEVEL
									this.checkAgainstLevel(block,next_level);
									collision = true;
									
									// stop loop --there's a collision!
									break;
								} 
						} // end for

						if (collision == false) {
							// ADD TO TREE OF PLACED EVENTS
							tree[l_index].push(block);
						}
				},

			}; // END TGOrg METHODS
		