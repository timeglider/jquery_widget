/*
* Timeglider jQuery plugin Timeglider
* jquery.timeglider.js
* http://timeglider.com/jquery
*
* © 2010 Timeglider / Mnemograph LLC
* Author: Michael Richardson
* Licences are still to be determined : )
*
*/


;(function($){
	


	// default options 
	/// in a widget, would be "options"
	     
		
		function validateOptions(stgs) {	
			var ret = true,
				optionsTypes = optionsMaster;
				// final return message: good/true if empty
				msg = "",
				lb = "\n";
			
			$.each(stgs, function(key, value) { 
				
				if (optionsTypes[key]) {
					//trace ("key:" + key + ", type:" + optionsTypes[key].type);
					switch (optionsTypes[key].type) {
						case "string": 
							if (typeof value != "string") msg += (key + " needs to be a string." + lb);
							if (optionsTypes[key].possible) {
								if ($.inArray(value, optionsTypes[key].possible) == -1) {
									msg += (key + " must be: " + optionsTypes[key].possible.join(" or "));
								}
							}
						break;
						
						case "number":
							if (typeof value != "number") msg += (value + " needs to be a number." + lb);
							if (optionsTypes[key].min) {
								if (value < optionsTypes[key].min) {
									msg += (key + " must be greater than " + optionsTypes[key].min + lb);
								}
							}
							
							if (optionsTypes[key].max) {
								if (value > optionsTypes[key].max) {
									msg += (key + " must be less than " + optionsTypes[key].max + lb);
								}
							}
						break;
						
						case "date":
							// TODO validate a date string using TG_Date...
						break;
						
						case "boolean":
							if (typeof value != "boolean") msg += (value + " needs to be a number." + lb);
						break;
						
						case "url":
							// TODO test for pattern for url....
						break;
						
						case "color":
							/// TODO test for pattern for color, including "red", "orange", etc
						break;
						
						default: trace ("is there a default for validating options?");
						
					}
				}
			});
			
			return msg;
			
		};

		  
		
		/*******************************
		TIMELINE MEDIATOR
		handles timeline behavior, 
		reflects state back to view
		********************************/
		TimegliderMediator : function () {
			
			// broadcast wires
			this.anonEventId = 0;
			this.zoomLevelChange = new Signal(this);
			this.ticksOffsetChange = new Signal(this);
			this.focusDateChange = new Signal(this);
			this.ticksArrayChange = new Signal(this);
			this.ticksReadySignal = new Signal(this);
			this.refreshSignal = new Signal(this);
			this.activeTimelinesChange = new Signal(this);
			this.timelineListChangeSignal = new Signal(this);	
			// why the underscores...?
			this._focusDate = {};
			this._zoomInfo = {};
			this._ticksReady = false;
			this._ticksArray = [];
			this._startSec = 0;
			this._activeTimelines = [];
			this.max_zoom = 100;
			this.min_zoom = 1;
			this.gesturing = false;
			this.gestureStartZoom = 0;
				
		} // end model head

		TimegliderMediator.prototype = {
		
		/*
		TODO
		Put this stuff into backbone collection of TimelineModel() instances
		*/
			loadTimelineData : function (src) {
					
					var M = this; // model ref
					var ct = 0;
				
					$.getJSON(src, function(data){
						var dl = data.length, ti = {}, t = {};
						
						for (var i=0; i<dl;i++) {
							
							t = new TimegliderTimeline(data[i]); // the timeline		
						
							ti = M.chewTimeline(t, true); // indexed, etc
							if (t.id.length > 0) { ct++; }// at least one timeline was loaded
							M.swallowTimeline(ti);	
						}
		
						if (ct === 0) { 
							alert("ERROR loading data @ " + src + ": Check JSON with jsonLint"); 
						} else {
							M.setInitialTimelines();
						}
		
					}); // end getJSON
					
					
			},
			
			/*
			* objectifies string dates
			* creates hashbase of events indexed by unit serial
			
			TODO ==> re-chew function for renewing stuff like startSeconds, etc
			     ==> move to Timeline really needs to be it's own class with methods...
			*/
			chewTimeline : function (tdata, init) {
					
					// TODO ==> add additional units
					var dhash = {"da":[], "mo":[], "ye":[], "de":[], "ce":[], "thou":[]};
					var units = tgDate.units; 
						tdata.startSeconds = [];
						tdata.endSeconds = [];
				
						// TODO: VALIDATE COLOR, centralize default color(options?)
						if (!tdata.color) { tdata.color="#333333"; }
						
					if (tdata.events) {
			
						var date, ev, id, unit, ser, tWidth;
						var l = tdata.events.length;

						for(var ei=0; ei< l; ei++) {
								
							ev=tdata.events[ei];
							// id = ev.id;
							if (ev.id) { 
								// TODO :: make sure it's unique... append with timeline id?
								id = ev.id 
							} else { 
								ev.id = id = "anon" + this.anonEventId++; 
							}

							//  objects will include seconds, rata die
							//  done coupled so end can validate off start
							var startEnd = tgDate.validateEventDates(ev.startdate,ev.enddate);
							
							ev.startdateObj = startEnd.s; // tgDate.makeDateObject(ev.startdate);
							ev.enddateObj = startEnd.e; // tgDate.makeDateObject(ev.enddate);
							
							ev.basicWidth = getStringWidth(ev.title) + 20;
						
							// microtimeline for collapsed view and other metrics
							tdata.startSeconds.push(ev.startdateObj.sec);
							tdata.endSeconds.push(ev.enddateObj.sec);
							
							// time span?
							ev.span = (ev.enddateObj.sec > ev.startdateObj.sec) ? true : false;
							//// !! TODO VALIDATE DATE respecting startdate, too
							var uxl=units.length;
							for (var ux=0; ux < uxl; ux++) {
							  unit = units[ux];
							  ///// DATE HASHING in action 
								ser = tgDate.getTimeUnitSerial(ev.startdateObj, unit);
								if (dhash[unit][ser] !== undefined) {
									dhash[unit][ser].push(id);
								} else {
									// create the array
									dhash[unit][ser] = [id];
								}
								// trace ("unit:" + unit + "...ser:" + ser);
							///////////////////////////////
							} 
						
						// add*modify indexed pool
						eventPool["ev_" + id] = ev;
						
					}// end cycling through timeline's events
					
					var allsec = $.merge(tdata.startSeconds,tdata.endSeconds);
					var fl = getLowHigh(allsec);
					/// bounds of timeline
					tdata.bounds = {"first": fl.low, "last":fl.high };
					
					} /// end if there are events!
					
					// bypass hashing if ! events
					if (init === true) {
						tdata.display = "expanded";
					}
					
					tdata.dateHash = dhash;
										
					return tdata;
			},
			
			
			/* Makes an indexed array of timelines */
			swallowTimeline : function (obj) {
				timelinePool[obj.id] = obj;	
				this.timelineListChangeSignal.broadcast();
			},
			
			///  end of methods that need to go into (backbone) data model
			///////////////////////////
			
			/* TODO: turn to $each, adding to activeTimelines:
			         i.e. could be more than one 
			*/
			setInitialTimelines : function () {
				var me = this;
				var tid = options.initial_timeline_id;
				if (tid) {
					timelinePool[tid].top = 200;
					setTimeout(function () { 
							me.toggleTimeline(tid);
							}, 500);
				}
			},
		
			refresh : function () {
				this.refreshSignal.broadcast();
			},

			// !!!TODO ---- get these back to normal setTicksReady, etc.
			setTicksReady : function (bool) {
				this._ticksReady = bool;
				if (bool === true) { this.ticksReadySignal.broadcast({"bool":bool}); }
			},
			
			getTicksReady : function () {
				return this._ticksReady;
			},
			
			getFocusDate : function () {
				return this._focusDate;
			},

			setFocusDate : function (fd) {
				// !TODO :: VALIDATE FOCUS DATE
				if (fd != this._focusDate && "valid" == "valid") {
					// "fillout" function which redefines fd ?
					fd.mo_num = tgDate.getMonthNum(fd); 
					fd.rd = tgDate.getRataDie(fd);      
					fd.sec = tgDate.getSec(fd);
					
					this._focusDate = fd; 
					
				}
			},

			getZoomLevel : function () {
				return Number(this._zoomLevel);
			},


			/*	This is the setter for
				other zoomInfo attributes : width, label, tickWidth
				@param z ==> integer from 1-100, other zoom info comes from zoomTree array
			*/
			setZoomLevel : function (z) {
			
			 if (z <= this.max_zoom && z >= this.min_zoom) {
				
				// focusdate has to come first for combined zoom+focusdate switch
				this._startSec = this._focusDate.sec;
				// output ("startsec:" + this._startSec, "note");

				if (z != this._zoomLevel) {
					this._zoomLevel = z;
					this._zoomInfo = zoomTree[z];
					$(SLIDER).slider("value", invSliderVal(z));
					this.zoomLevelChange.broadcast({"zoomLevel": z});
				}
				
				output("z:" + this._zoomLevel + " / " + this._zoomInfo.label, "zoomlevel");
				
				// end min/max check
		     	} else { return false; }
		
			}, 
				
				
			getZoomInfo : function () {
				return this._zoomInfo;
			},
			
			setGestureStart : function () {
				alert("z:" + this.getZoomLevel());
				this.gestureStartZoom = this.getZoomLevel();
			},

			getTicksOffset : function () {
				return this._ticksOffset;
			},
		
		
			setTicksOffset : function (newOffset) {
				// This would be the same as the focus date...
				// main listener hub for date focus and tick-appending
				this._ticksOffset = newOffset;
				/* In other words, ticks are being dragged! */
				this.ticksOffsetChange.broadcast({"leftOffset": newOffset});
			},
	
			
			getTickBySerial : function (serial) {
				var ta = this._ticksArray,
					tal = ta.length;
				for (var t=0; t<tal; t++) {
					var tick = ta[t];
					if (tick.serial == serial) { return tick; }
				}
				return false;
			},
			
			/*
				@param obj -----  
					serial: #initial tick
					type:init|l|r
					unit:ye|mo|da|etc
					width: #px
					left: #px
				@param focusDate ----
					used for initial tick; others set off init
			*/
			addToTicksArray : function (obj, focusDate) {
				
				if (obj.type == "init") {
					// CENTER
					obj.serial = tgDate.getTimeUnitSerial(focusDate, obj.unit);
					this._ticksArray = [obj];
				} else if (obj.type == "l") {
					// LEFT
					obj.serial = this._ticksArray[0].serial - 1;
					this._ticksArray.unshift(obj);
				} else {
					// RIGHT SIDE
					obj.serial = this._ticksArray[this._ticksArray.length -1].serial + 1;
					this._ticksArray.push(obj);
				}
				
				this.ticksArrayChange.broadcast();
				
				return obj.serial;
			},
		

			toggleTimeline : function (id) {
				
				var lt = timelinePool[id];
				var ia = $.inArray(id, this._activeTimelines);

				if (ia == -1) {
					// not active ---- bring it on and focus to it
					this._activeTimelines.push(id);
				
					// setting FD does NOT refresh automatically
					this.setFocusDate(tgDate.makeDateObject(lt.focus_date));
					// resetting zoomLevel DOES refresh
					this.setZoomLevel(lt.initial_zoom);
					
				} else {
					// it's active, remove it
					this._activeTimelines.splice(ia,1);
					this.refresh();
				}
				
				this.activeTimelinesChange.broadcast({});
			
			
			}
			
	
		}; ///// end model methods


		/*
		****************************************
		VIEW
		****************************************
		*/
		var TimegliderTimelineView = function (mediator, options) {

			var me = this;
			var M = this.M = mediator;
		
			// !!TODO validate these range/relation etc
			// move all to model?
			M.max_zoom = options.max_zoom;
			M.min_zoom = options.min_zoom;
			M.setZoomLevel(options.initial_zoom);
			basicFontSize = options.basic_fontsize;
			
			
			this.dragSpeed = 0;
			this.dimensions = this.getTimelineDimensions();

			this.tickNum = 0;
			this.leftside = 0;
			this.rightside = 0;
			this.ticksHandleOffset = 0;	
			this.timeoout_id = 1;
			this.sliderActive = false;
			
			this.timelineMenuOpen = false;
			
			// listen for focus date change
			// mainly ?? if date is zipped to...
			M.focusDateChange.tuneIn(function () {
				// 
			});
			
			/// listen for ticks movement, i.e. dragging
			M.ticksOffsetChange.tuneIn(function () {
				me.tickHangies();
				me.registerTitles();
				me.registerDragging();
			});
			
			// not doing anything with this yet: necessary?
			M.ticksArrayChange.tuneIn(function () {
				/*
				SCAN OVER TICKS FOR ANY REASON?
				*/
			});

			M.zoomLevelChange.tuneIn(function () {
				
				me.tickNum = 0;
				me.leftside = 0;
				me.castTicks();
				// if the slider isn't already at the given value change it?
			});
			
			/// This happens on a TOTAL REFRESH of 
			/// ticks, as when zooming; panning will load
			/// events of active timelines per tick	
			M.ticksReadySignal.tuneIn(function (b) {
				if (M.getTicksReady() === true) {
					me.freshTimelines();
				} 
			});

			// INITIAL CONSTRUCTION
			this.buildSlider();
			this.castTicks();
			
				
			// TURN TO FUNCTION centerline show/hide
			if (options.show_centerline === true) {
				$(CENTERLINE).css({"height":me.dimensions.height, "left": me.dimensions.centerx});
			} else {
				$(CENTERLINE).css({"display":"none"});
			}	
																							
			$(TRUCK)
				.dblclick(function(e) {
					 	Cw = me.dimensions.width;
						var Cx = e.pageX - (me.dimensions.offset.left);
						var offMid = Cx - Cw/2;
						var secPerPx = M.getZoomInfo().spp;
						// don't need mouse_y yet :
						//	var Cy = e.pageY - $(PLACEMENT).offset().top;
						var fdSec = M.getFocusDate().sec;
						var dcSec = Math.floor(fdSec + (offMid * secPerPx));
						var clk = tgDate.getDateFromSec(dcSec);
						var foc = tgDate.getDateFromSec(fdSec);
						
						output("DBLCLICK:" + foc.mo + "-" + foc.ye + " dblclick:" + clk.mo + "-" + clk.ye, "note");	
					})			
				.bind('mousewheel', function(event, delta) {
								output("hello mousewheel?", "note");
					            var dir = Math.ceil(-1 * (delta * 3));
								var zl = M.getZoomLevel();
								M.setZoomLevel(zl += dir);
					            return false;
					});
	
			
				
			$(TICKS)
			  	.draggable({ axis: 'x',
					//start: function(event, ui) {
						/// 
					//},
					drag: function(event, ui) {
						// just report movement to model...
						M.setTicksOffset($(this).position().left);
					},
				
					stop: function(event, ui) {
						me.resetTicksHandle();
						me.easeOutTicks();
						me.registerDragging(); // one final time, plus more if easing...
					}
				}) // end draggable
				.delegate(".timeglider-timeline-event", "click", function () { 
					// EVENT ON-CLICK !!!!!!
					var eid = $(this).attr("id"); 
					// output("click, id:" + eid, "note");
					me.eventModal(eid);
				})	
				.delegate(".timeglider-timeline-event", "hover", function () { 
					var eid = $(this).attr("id"); 
					var title = eventPool[eid].title;
					output("hover, title:" + title, "note"); 
				})
				.delegate(".evCollapsed", "hover", function () { 
					var eid = $(this).attr("id"); 
					var title = eventPool[eid].title;
					output("collapsed, title:" + title, "note"); 
				});
			
			// TODO ---> build this into jquery-ui component behavior
			$(".TimegliderEvModal .closeBt").live("click", function () {
				$(this).parent().remove();	
			});
			
				

			/*
			Renews the timeline at current focus/zoom, but with
			possibly different timeline/legend/etc parameters
			! The only view method that responds directly to a model refresh()
			*/
			M.refreshSignal.tuneIn(function () {
				// trace ("z: " + M.zoomLevel + "...fd: " + tgDate.formatFocusDate(M.focusDate));
				me.castTicks();
			});
			
			/* UPDATE TIMELINES MENU */
			
			M.timelineListChangeSignal.tuneIn( function (arg) {
			
			$(MENU_UL).html("");
			var id;
			var ta = timelinePool;
				for(id in ta) {
					if (ta.hasOwnProperty(id)) {
					var t = ta[id];
					$(MENU_UL)
						.append("<li class='timelineList' id='" + id + "'>" + t.title + "</li>");
					$("li#" + id)
						.click( function() { M.toggleTimeline($(this).attr("id"))  } );
					} // end filter
				}
			
			});
			

			M.activeTimelinesChange.tuneIn( function () {
				/// main timelines menu
				$(MENU_UL + " li").each(function () {
						var id = $(this).attr("id");
					    if ($.inArray(id, M._activeTimelines) != -1) {
							$(this).addClass("activeTimeline");
						} else { 
							$(this).removeClass("activeTimeline");	
						}	
		        }); // end each	
		
			}); // end tune in
			
			
			$(MENU_HANDLE).click(function () {
				me.toggleMenu();
			});
			
			
			//// GESTURES  ////
			/* !!TODO    Still a FAIL ---- 
			   When actually doing something, Safari seems to 
			   ignore attempts at preventing default... 
			*/
			
			function gestureChange (e) {
				e.preventDefault ();
				if (M.gesturing === false) {
					M.gesturing = true;
					M.gestureStartZoom = M.getZoomLevel();
				}
			    var target = e.target;
				// constant spatial converter value
			    var g = (e.scale / 5)* M.gestureStartZoom;
				output("gesture zoom:" + g, "note");
				M.setZoomLevel(g);
			}

			function gestureStart (e) {
			    e.preventDefault();
			}
	
			function gestureEnd (e) {
				M.gesturing = false;
			}
		
			if ($.browser.webkit) {	
				/// How to get a particular instance, like $(TRUCK)
				var truck = document.getElementById("TimegliderTruck");		
					truck.addEventListener ('gesturestart', gestureStart, false);
					truck.addEventListener ('gesturechange', gestureChange, false);
					truck.addEventListener ('gestureend', gestureEnd, false);
			}
		
		} // end VIEW declarations/actions
		

		/* VIEW METHODS */
		TimegliderTimelineView.prototype = {

			registerTitles : function () {
				
				var toff, w, tw, pos, titx;
				
				var mo = $(CONTAINER).offset().left;
				
				/*
				!!!TODO  inefficient, redundant
				should target only spanning events, not all events...
				
				*/
				$(".timeglider-timeline-event").each(
					// !TODO find out if it's a span
					// use ba-cond or ba-iff
					function() {
					 	toff = $(this).offset().left - mo;
						w = $(this).outerWidth();
						tw = $("#evtitle",this).outerWidth() + 5;
						// trace ("title width:" + tw);
						if ((toff < 0) && (Math.abs(toff) < (w-tw))) {
								$("#evtitle", this).css({marginLeft:(-1 * toff)+5});
						} 
					 }
					 );
				
				$(".TGTimelineEnvelope").each(
						function() {
							var env = $(this).offset().left - mo;
							var tb = $("#titleBar", this);
							var ti = $("#titleBar #title", this);
							pos = tb.position().left;
						 	var relPos = pos + env;
							var tbWidth = tb.outerWidth();
							
							output ("relpos:" + relPos, "note");
							tw = tb.outerWidth();
							
						   	titx = (-1 * relPos);
							
							// trace ("title width:" + tw);
						 	if ( (relPos < 0) ) {
									ti.css({marginLeft:titx+5});
								} 
						 }
				);
			},
			
			
			registerDragging : function () {
			    /* 
					startSec --> the seconds-value of the
			        initial focus date on landing @ zoom level
				*/
				
				var M = this.M;
			
				var startSec = M._startSec;
				
				var tickPos = $(TICKS).position().left;
				output("ticks x:" + tickPos, "tickpos");
				
				var secPerPx = M.getZoomInfo().spp;			
				var newSec = startSec - (tickPos * secPerPx);
				var newD = tgDate.getDateFromSec(newSec);
				
				output("FD: " + tgDate.formatFocusDate(newD), "focusdate");
				
				M.setFocusDate(newD);
			},
			
			
			/* 
				Zoom slider is inverted value-wise from the normal jQuery UI slider
			   	so we need to feed in and take out inverse values with invSliderVal()            
			*/
			buildSlider: function () {
				var M = this.M;
				
				var init_zoom = invSliderVal(M.getZoomLevel());
				var me = this;
				var hZoom = M.max_zoom;
				var lZoom = M.min_zoom;
				
				var sHeight = (1 + hZoom - lZoom) * 3;
			
				 	$(SLIDER)
					  .css("height", sHeight)
					  .slider({ 
	    				steps: 100,
	    				handle: $('.knob'),
	    				animate:500,
						orientation: 'vertical',

						/* "min" here is really the _highest_ zoom value @ upside down */
	    				min:invSliderVal(hZoom),

						/* "max" actually takes (inverse value of) low zoom level */
	    				max:invSliderVal(lZoom),

	    				value:init_zoom,

						start: function (e, ui) {
							// show zoom level legend
							me.sliderActive = true;
						},

						stop: function (e, ui) {
							// hide zoom level legend
							me.sliderActive = false;
						},

						change: function(e,ui){
	        				// i.e. on-release handler
							// possibly load throttled back events
	    				}, 

						slide: function(e, ui) {
							// sets model zoom level to INVERSE of slider value
							M.setZoomLevel(invSliderVal(ui.value));
						}
					});
			},


			clearTicks : function () {
				this.tickNum = 0;
				$(TICKS).css("left", 0)
						.html("<div id='TimegliderHandle'></div>");
			},


			/* The initial drawing of a full set of ticks, starting in the 
			   middle with a single, date-focused div with type:"init", after which
			   a left-right alternating loop fills out the width of the current frame
			*/
			castTicks: function () {
				var M = this.M;
				var zLevel = M.getZoomLevel(),
					fDate = M.getFocusDate(),
					tickWidth = M.getZoomInfo().width,
					twTotal = 0,
					ctr = this.dimensions.centerx,
					nTicks = Math.ceil(this.dimensions.width / tickWidth) + 4,
					leftright = 'l';
				
				this.clearTicks();
				M.setTicksReady(false);

				// INITIAL TICK added  in center according to focus date provided
				this.addTick({"type":"init", "focus_date":fDate});

				// determine how many are necessary to fill (overfill) container
				
				// ALTERNATING L & R
				for (var i=1; i<=nTicks; i +=1) {
					this.addTick({"type":leftright});
					leftright = (leftright == "l") ? "r" : "l";
				}
				
				M.setTicksReady(true);

			},
			
			
			/*
			@param info   ----> type: init|l|r
			                    focusDate: date object for init type
			*/											
			addTick : function (info) {
				
				var M = this.M,
				
					mDays = 0, dist = 0, pos = 0, ctr = 0, tperu = 0, serial = 0,
					tid = "", tickHtml = "", idRef = "", 
					$tickDiv = {}, tInfo = {}, pack = {}, label = {}, mInfo = {}, 
					tickUnit = M.getZoomInfo().unit,
					tickWidth = M.getZoomInfo().width,
					focusDate = M.getFocusDate();
				
					serial = M.addToTicksArray({type:info.type, unit:tickUnit}, focusDate);

				// adjust tick-width for months (mo)
				if (tickUnit == "mo") {
					// standard: 28 days, how many px, days to add?
					mInfo = tgDate.getMonthAdj(serial, tickWidth);
					tickWidth = mInfo.width;
					mDays = mInfo.days;
				} 

				this.tickNum ++;
	
				if (info.type == "init") {
				   	var shiftLeft = this.tickOffsetFromDate(M.getZoomInfo(), M.getFocusDate(), tickWidth);
					pos = Math.ceil(this.dimensions.centerx + shiftLeft);
					this.leftside = pos;
					this.rightside = (pos + tickWidth);
				} else if (info.type == "l") {
					pos = Math.floor(this.leftside - tickWidth);
					this.leftside = pos;
				} else if (info.type == "r") {
					pos = Math.floor(this.rightside);
					this.rightside += tickWidth;
				}
				
				// turn this into a function...
				M.getTickBySerial(serial).width = tickWidth;
				M.getTickBySerial(serial).left = pos;
				
				tid = RAW_PLACEMENT + "_" + tickUnit + "_" + serial + "-" + this.tickNum;
				tickHtml = "<div class='TimegliderTick' id='" + tid + "'><div class='TGDateLabel' id='label'></div></div>";
				
				$(TICKS).append(tickHtml);
		
				idRef = TICKS + " #" + tid;
				$tickDiv = $(idRef);
				$tickDiv.css({width:tickWidth, left:pos});
				
				// GET TICK DIVS FOR unit AND width
				tInfo = this.getTickMarksInfo({unit:tickUnit, width:tickWidth});
				tperu = (mDays > 0) ? mDays : tInfo.tperu;
											
				dist = tickWidth / tperu;
				if (dist > 5) {
				
					/* Raphael canvas for tick lines
					   @param dom id-with-no-hash, width, height 
					*/
					var lines = Raphael(tid, tickWidth, 30),
						c, l, xd, stk = '', ht = 10,
						downset = 20;
						
						for (l = 0; l < tperu; ++l) {
							xd = l * dist;
							stk += "M" + xd + " " + downset + " L" + xd + " " + (ht + downset);
						}
				
						c = lines.path(stk);
						// !TODO --- add stroke color into options object
						c.attr({"stroke":"#333", "stroke-width":1});
					} // end dist > 5  if there's enough space between tickmarks
				
				pack = {"unit":tickUnit, "width":tickWidth, "serial":serial};
				label = this.getDateLabelForTick(pack);
				
				// ?? how to use document.getElementByID to be quicker?
				$(idRef + " > #label").text(label);
				
				// DO OTHER STUFF TO THE TICK, MAKE THE LABEL AN ACTIONABLE ELEMENT
				$tickDiv
					.children("#label")
					.bind("click", pack, function () { trace ("do something with the label here?") });

				return pack;
				/* end addTick */
			}, 

			
			/* provides addTick() info for marks and for adj width for month or year */
			getTickMarksInfo : function (obj) {
				var tperu;
				switch (obj.unit) {
					case "da": 
						tperu = 24; 
						break;
					case "mo": 
						tperu = 30; 
						break;
					case "ye": 
						tperu = 12; 
						break;
					default: tperu = 10; 
				}
			
				return {"tperu":tperu};
			},
			
			
			getDateLabelForTick : function  (obj) {
				var i;
				switch(obj.unit) {
					
					case "de": 
						return ((obj.serial -1) * 10) + "s";
					case "ye": 
						return obj.serial; 
					case "mo": 
						i = tgDate.getDateFromMonthNum(obj.serial);
						return tgDate.monthNamesFull[i.mo] + ", " + i.ye; 
					case "da": 
						i = tgDate.getDateFromRD(obj.serial);
						return i.ye + "-" + i.mo + "-" + i.da; 
				
					default: return obj.unit + ":" + obj.serial + ":" + obj.width;
				}
				
			},


			tickHangies : function () {
				var tPos = $(TICKS).position().left;
				var lHangie = this.leftside + tPos;
				var rHangie = this.rightside + tPos - this.dimensions.width;
				// output("HANGIES left:" + lHangie + " / right:" + (rHangie));
				var tick, added = false;
				var me = this;
				
				if (lHangie > -100) {
					tick = this.addTick({"type":"l"});
					me.appendTimelines(tick);
				} else if (rHangie < 100) {
					tick = this.addTick({"type":"r"});
					me.appendTimelines(tick);
				}
			},
			
		
			getTimelineDimensions : function () {
					var container = $(CONTAINER),
						w = container.width(),
						wc = Math.floor(w / 2) + 1,
						h = container.height(),
						hc = Math.floor(h/2),
						lft = container.position().left,
						offset = container.offset();
					
					return {"width":w, "height":h, "centerx":wc, "centery":hc, "left": lft, "offset": offset};
			},

																						//---( VIEW
			/* tickUnit, fd */
			tickOffsetFromDate : function (zoominfo, fdate, tickwidth) {
				// this.model.zoomInfo (unit, width), fd
				var w = tickwidth;
				var u = zoominfo.unit;
				// switch unit, calculate width gain or loss.... or just loss!
				var p, prop;

				switch (u) {
					case "da": 
						// @4:30        4/24                30 / 1440
						//              .1666                .0201
						prop = ((fdate.ho) / 24) + ((fdate.mi) / 1440);
						p = w * prop;
						break;

					case "mo":
						var mdn = tgDate.getMonthDays(fdate.mo, fdate.ye);
					   
						// trace ("offset width:" + tickwidth + "...mdn:" + mdn);
						prop = ((fdate.da -1) / mdn) + (fdate.ho / (24 * mdn)) + (fdate.mi / (1440 * mdn));
						p = w * prop;
						break;

					case "ye":
						prop = (((fdate.mo - 1) * 30) + fdate.da) / 365;
						p = w * prop;
						break;

					case "de": 
						// 
						// 1995
						prop = ((fdate.ye % 10) / 10) + (fdate.mo / 120);
						p = w * prop;
						break;

					case "ce": 
						prop = ((fdate.ye % 100) / 100) + (fdate.mo / 1200);
						p = w * prop;
						break;
					
					case "thou": 
						prop = ((fdate.ye % 1000) / 1000) + (fdate.ye / 100) + (fdate.mo / 1200);
						p = w * prop;
						break;
						

					case "tenthou": p = 0; break;

					case "hundredthou": p = 0; break;

					default: p=0;

				}

				return -1 * p;
			},
			
			
			resetTicksHandle : function () {
				$(HANDLE).offset({"left":$(CONTAINER).offset().left});
			},
			

			easeOutTicks : function() {
				var me = this;
					if (Math.abs(this.dragSpeed) > 5) {
						// output("release @:" + this.dragSpeed + " px EaseOut!");
						// This works, but isn't great:offset fails to register
						// for new tim as it ends animation...
						// $('#TimegliderTicks').animate({left: '+=' + (5 * me.dragSpeed)}, 400, function() {
    					output("ticks stopped!");
  						// });
					}
				
			},
			
			toggleMenu : function () {
				var M = this.M;
				var mw = $(MENU).width();
				if (M.timelineMenuOpen === false) {
					$(MENU).animate({left: '+=' + mw}, 50);
					$(MENU_HANDLE).text("<<");
					M.timelineMenuOpen =true;
				} else {
					$(MENU).animate({left: '-=' + mw}, 100);
					$(MENU_HANDLE).text("timelines >>");
					M.timelineMenuOpen =false;
				}
				
			},
			
			/*
			@param    obj with { tick  |  timeline }
			@return   array of event ids 
			*/
			getTimelineEventsByTick: function (obj) {
				var M = this.M;
				var car = [];
				var i, evid, ev;
				var unit = obj.tick.unit;
				var serial = obj.tick.serial;
				var hash = obj.timeline.dateHash;

				if (hash[unit][serial] && hash[unit][serial].length > 0) {
					return hash[unit][serial];
				} else {
					return 0;
				}
			},
			
			setTimelineProp : function (id, prop, value) {
				var tl = timelinePool[id];
				tl[prop] = value;	
			},
			
			/*
			invoked upon a fresh sweep of entire container, having added a set of ticks
				--- occurs on expand/collapse
				--- ticks are created afresh
			*/
			freshTimelines : function () {

				var M = this.M;
				
				var t, i, tl, tu, ts, tick, tE, ht,
					active = M._activeTimelines,
					ticks = M._ticksArray,
					borg = '',
					$title, t_f, t_l,
					me = this,
					evid, ev, $ev, impq,
					stuff = '', 
					posx = 0,
					cx = me.dimensions.centerx,
					foSec = M.getFocusDate().sec,
					spp = M.getZoomInfo().spp,
					zl = M.getZoomInfo().level,
					idArr;
					
					var levHt = 24;
					
				//////////////////////////////////////////
				// different kind of loop here for array?
				for (var a=0; a<active.length; a++) {
		
					// FOR EACH TIMELINE...
					tl = timelinePool[active[a]];
					
					var expCol = tl.display;
					var tlTop = (tl.top || 0);
					
					$(TICKS).append("<div class='TGTimelineEnvelope' id='" + tl.id
						+ "'><div id='titleBar'><div id='title'>"
					 	+ tl.title + " <span id='clps'>expand/collapse</span></div></div></div>");
					
			  		$tl = $(".TGTimelineEnvelope#" + tl.id);
					$tl	
						.draggable({
						axis:"y",
						handle:"#titleBar", 
						stop: function () {
							me.setTimelineProp(tl.id,"top", $(this).css("top"));	
						}
					})
						.css("top", tlTop);
						
					ht = $tl.height();
					
					$(".TGTimelineEnvelope#" + tl.id + " #titleBar #clps").click(function () { 
							me.expandCollapseTimeline(tl.id );
					} );
				 
					$title = $tl.children("#titleBar");
					t_f = cx + ((tl.bounds.first - foSec) / spp);
					t_l = cx + ((tl.bounds.last - foSec) / spp);
					$title.css({"top":ht, "left":t_f, "width":(t_l-t_f)});
		
					/// @ FULL DISPLAY
					if (expCol == "expanded") { borg = new TGOrg({level_height:levHt}); }
			
					//cycle through ticks for all events
					for (var tx=0; tx<ticks.length; tx++) {
						
						idArr = this.getTimelineEventsByTick({tick:ticks[tx], timeline:tl});

							for (i=0; i<idArr.length; i++) {

									// both collapsed and expanded
									ev = eventPool["ev_" + idArr[i]];
									posx = cx + ((ev.startdateObj.sec - foSec) / spp);
									impq = (ev.importance / zl);
									
								if (expCol == "expanded") {
									ev.width = (ev.basicWidth * impq) + 18;									
									ev.fontsize = basicFontSize * impq;
									// !TODO isolate these into position object
									ev.left = posx; // will remain constant
									// !TODO --- ACCURATE WIDTH BASELINE FROM chewTimeline()
									ev.top = ht - levHt; // 330; ///// TODO ==> add to timeline div
									ev.height = 18;
									borg.addBlock(ev, "sweep");
									// no stuff yet...
							  	} else if (expCol == "collapsed") {
									stuff += "<div id='ev_" + ev.id + 
									"' class='evCollapsed' style='top:" + 
									(ht-2) + "px;left:" +
									posx + "px'></div>";
							  	}
			
							}	
					}
					// ev.blocks....
					
					// expanded only
					if (expCol == "expanded") {
						stuff = borg.getHTML("sweep");
						tl.borg = borg.getBorg();
					}
					if (stuff != "undefined") { $tl.append(stuff); }
					
				}// end for each timeline
				
				// initial title shift since it's not on-drag
				me.registerTitles();
				
			}, // ends freshTimelines()
			
			
			/* 
				this is per tick... pretty wet with freshTimelines()...
			*/
			appendTimelines : function (tick) {

					var M = this.M;
					var active = M._activeTimelines; 
					var cx = this.dimensions.centerx;
					var tl, ev, posx, expCol, ht, borg, stuff, impq, ids,
						foSec = M._startSec, 
						spp = M.getZoomInfo().spp,
						zl = M.getZoomInfo().level;
						
					/// !!TODO --- dynamic heights in TGOrg.js
					var levHt = 24;

						for (var a=0; a<active.length; a++) {

							// FOR EACH TIMELINE...
							tl = timelinePool[active[a]];
							expCol = tl.display;
							borg = tl.borg; // existing layout object
							$tl = $(".TGTimelineEnvelope#" + tl.id);
							ht = $tl.height();
							idArr = this.getTimelineEventsByTick({tick:tick, timeline:tl});
							ids = idArr.length;
							expCol = tl.display;
							stuff = ''; // needs to be cleared
							
							for (i=0; i<ids; i++) {

								// WET
								ev = eventPool["ev_" + idArr[i]];
								// !!TODO ==> TIMEZONE SETTING...
								posx = cx + ((ev.startdateObj.sec - foSec) / spp);
								
								if (expCol == "expanded") {
									ev.left = posx; // will remain constant
									// !TODO --- ACCURATE WIDTH BASELINE FROM chewTimeline()
									impq = (ev.importance / zl);
									trace ("bw:" + ev.basicWidth + "; imp:" + ev.importance + "; zl:" + zl);
									
									ev.width = (ev.basicWidth * impq) + 18;
									
									
									ev.top = ht - levHt; // 330; ///// TODO ==> add to timeline div
									ev.height = 18;
									borg.addBlock(ev, tick.serial);
										
								} else if (expCol == "collapsed") {
									stuff += "<div id='ev_" + ev.id 
									+ "' class='evCollapsed' style='top:" 
									+ (ht-2) + "px;left:" 
									+ posx + "px'></div>";
								}
							} // end for through idArr
							
								// borg it if it's expanded.
								if (expCol == "expanded"){ 
									tl.borg = borg.getBorg();
									trace ("tl.borg.length:" + tl.borg.blocks.length);
									stuff = borg.getHTML(tick.serial);
								}
					
								$tl.append(stuff);
								
					} // end for in active timelines
							
			}, // ends appendTimelines()
			
			
			expandCollapseTimeline : function (id) {
				var tl = timelinePool[id];
				if (tl.display == "expanded") {
					tl.display = "collapsed";
				} else {
					tl.display = "expanded";
				}
				trace ("tl.state:" + tl.display);
				
				this.M.refresh();
			},
			
			eventModal : function (eid) {
				// get position
				var pos = $("#" + eid).position();
				output("top:" + pos.top, "note");
				var ev = eventPool[eid];
				
				var html = "<div class='TimegliderEvModal shadow roundedSmall' id='" + eid + "_modal' "
					+ "style='position:absolute;left:" + pos.left + "px;top:" + (pos.top + 40) + "px'>" 
					+ "<div class='closeBt' id='closer'><img src='img/close.png'></div>" 
					+ "<div class='startdate'>" + ev.startdate + "</div>"
					+ "<h4 id='title'>" + ev.title + "</h4>"
					+ "<p>" + ev.description + "</p>"
					+ "<div id='link'><a target='_blank' href='" + ev.link + "'>link</a></div>"
					+ "</div>";
					
				$(TICKS).append(html);
				
			}

			
		}; // end VIEW METHODS
	
		
	
		var tg = this,
			eventPool = [],
			timelinePool = {},
			tgDate = new TimegliderDate(),
			today = new Date(),
			basicFontSize = 12,
			self = this,
			timelineMediator = {};
					
		// string value "constants" for $ reference later
		// all relative to specific id placement
		// somewhat brittle, depending on template nest structure
		// Should we place the template in-line up in here?
		// this is predicated on the idea that two instances of a timeline
		// would have conflicting CSS hooks, so it's anchored in the 
		// "raw placement"
		var RAW_PLACEMENT = $(this).attr("id"),
				PLACEMENT = "#" + RAW_PLACEMENT,
				CONTAINER = PLACEMENT + " #timeglider-container",
				MENU = CONTAINER + " #timeglider-timeline-menu",
				MENU_UL = CONTAINER + " #timeglider-timeline-menu ul",
				MENU_HANDLE = CONTAINER + " #timeglider-timeline-menu-handle",
				SLIDER_CONTAINER = CONTAINER + " #timeglider-slider-container",
				SLIDER = SLIDER_CONTAINER + " #timeglider-slider",
				TRUCK_ID = "timeglider-truck",
				CENTERLINE = CONTAINER + " #timeglider-centerline",
				TRUCK = CONTAINER + " #" + TRUCK_ID,
				TICKS = TRUCK + " #timeglider-ticks",
				HANDLE = TICKS + " #timeglider-handle",
				MAIN_TEMPLATE = "timeglider/main_template.html";
						
		/* 
		TODO Use this to set options defaults, too 
		*/	
		var optionsMaster  = {
			initial_focus:{type:"date"},
			editor:{type:"string"},
			backgroundColor:{type:"color"},
			backgroundImage:{type:"color"},
			min_zoom:{type:"number", min:1, max:100},
			min_zoom:{type:"number", min:1, max:100},
			initial_zoom:{type:"number", min:1, max:100},
			show_centerline:{type:"boolean"},
			data_source:{type:"url"},
			basic_fontsize:{type:"number", min:9, max:100},
			mouse_wheel:{type:"string", possible:["zoom","pan"]},
			initial_timeline_id:{type:"string"}
		}
		

	
	
		$.widget( "tg.timeglider", {
			
			options : {
				initial_focus: today.format('c'),
				editor:'none',
		        backgroundColor : "#F3F3F3",
				backgroundImage : "",
				min_zoom : 1,
				max_zoom : 100,
				initial_zoom :20,
				show_centerline: true,
				data_source:"",
				basic_fontsize:12,
				mouse_wheel: "zoom",
				initial_timeline_id:''
			},
			
			_create : function () {
				
				 this.element
					.html(MAIN_TEMPLATE)
					.css({"backgroundColor":options.backgroundColor});

					timelineMediator = new TimegliderMediator();
					timelineMediator.setFocusDate(tgDate.makeDateObject(options.initial_focus));

					var timelineView = new TimegliderTimelineView(timelineMediator, options);

					// load timelines
					timelineMediator.loadTimelineData(options.data_source);

					// close the timelines menu
					// timelineView.toggleMenu();
	
			},
			
			_init : function () {
				
			},
			
			destroy : function () {
				
			}
			
		
			
		}); // end widget process




})(jQuery);
