

	var TG_Coordinizer = function(args) {
				this.blocks = [];
				this.tree = [];
				this.levelHeight = args.level_height;
			}
	
	TG_Coordinizer.prototype = {
				
				/// ADD::: REMOVE BLOCK (i.e. to/from same arrangement);
				///////////////////////
				
				
				// public method
				addBlock : function (trbl) {
					/// WILL INCLUDE TITLE, ID, CLASS
					trbl.right = trbl.left + trbl.width;
					trbl.bottom = trbl.top + trbl.height;
					this.blocks.push(trbl);
				}, 
				
				freshTree : function () {
					this.tree = [];
					for (var a=0; a < 100; a++) {
						// create 50 empty nested arrays for "quad tree"
						this.tree[a] = [];
					}
				},
				
				organize : function () {
					this.freshTree();
					this.blocks.sort(this.sortBlocksByImportance);
					// cycle through them and move overlapping event
					var positioned = [], blHeight, lastPos, padding = 6;
					
					for (var b=0; b<this.blocks.length; b++) {
						var bl = this.blocks[b];
						this.checkAgainstLevel(bl, 0);
					}	
				},
			
			
				getOrganizedBlocks : function () {
					this.organize();
					// return this.blocks;
					// 
					var html = '';
					for (var i=0; i<this.blocks.length; i++) {
						
					}
				},
		
		
				sortBlocksByImportance : function (a, b) {
					    var x = b.imp, y = a.imp;
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

			}; // END TG_Coordinizer METHODS
		