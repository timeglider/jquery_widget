
//// PLUG IN ////////////////////////////////

(function($, undefined){
	
				
  $.fn.timeglider = function(params) {

		var eventPool = [];
		var tgDate = new TGDate();
		var today = new Date();
		var basicFontSize = 12;
		
		// relative global vars --- should more go here?
		// string value "constants" for $ reference later
	  	var RAW_PLACEMENT = $(this).attr("id"),
	  		 	PLACEMENT = "#" + RAW_PLACEMENT,
				CONTAINER = PLACEMENT + " #TimegliderContainer",
				MENU = CONTAINER + " #TimegliderTimelineMenu",
				MENU_UL = CONTAINER + " #TimegliderTimelineMenu ul",
				MENU_HANDLE = CONTAINER + " #TimegliderTimelineMenu #handle",
				SLIDER_CONTAINER = CONTAINER + " #TimegliderSliderContainer",
				SLIDER = SLIDER_CONTAINER + " #TimegliderSlider",
				CENTERLINE = CONTAINER + " #TimegliderCenterline",
				TRUCK = CONTAINER + " #TimegliderTruck",
				TICKS = TRUCK + " #TimegliderTicks",
				HANDLE = TICKS + " #TimegliderHandle",
				MAIN_TEMPLATE = "timeglider/main_template.html",
				tg = this,
				model;

	     // merge input parameters and defaults.   
	     var settings = $.extend(
	          {},
	          {
				  initial_focus: today.format('c'),
				  editor:'none',
	              backgroundColor : "#F3F3F3",
				  backgroundImage : "",
				  min_zoom : 1,
				  max_zoom : 100,
				  initial_zoom :20,
				  show_centerline: true,
				  data_source:"dummy.json",
				  data_type:"json",
				  basic_fontsize:12,
				  mouse_wheel: "zoom"
				
	          },  params);



			/*
			PUBLIC METHODS
			*/
				this.getZoom = function () {
					return model.getZoomLevel();
				},

				this. setZoom = function (z) {
					n = parseInt(z);
					if (n <=100 && n>0) tg.model.setZoomLevel(n);
				}
				
		
				
		/*******************************
		        MODEL
		********************************/
		var TimegliderModel = function () {
			
			// broadcast wires
			this.zoomLevelChange = new Signal(this);
			this.ticksOffsetChange = new Signal(this);
			this.focusDateChange = new Signal(this);
			this.ticksArrayChange = new Signal(this);
			this.ticksReadySignal = new Signal(this);
			this.refreshSignal = new Signal(this);
			this.activeTimelinesChange = new Signal(this);
			this.timelineListChangeSignal = new Signal(this);
					
			var _focusDate = {},
				_zoomInfo = {},
				_ticksReady = false,
				_ticksArray = [],
				_startSec = 0;
	
				this._activeTimelines = [];
				this._timelines = [];
				
				this.max_zoom = 100;
				this.min_zoom = 1;
				
		} // end model head
		

		TimegliderModel.prototype = {
		
			loadTimelineData : function (src, type) {
					
					var M = this; // model ref
					var ct = 0;
				
					$.getJSON(src, function(data){
	
						for (var i=0; i<data.length;i++) {
							
							var t = data[i]; // the timeline		
						
							var ti = M.chewTimeline(t, true); // indexed, etc
							if (t.id.length > 0) ct++; // at least one timeline was loaded
							
							M.swallowTimeline(ti);	
						}
						
							if (ct == 0) alert("ERROR loading data @ " + src + ": Check JSON with jsonLint");
						
					}); // end getJSON
			},
			
			/*
			
			* objectifies string dates
			* creates hashbase of events indexed by unit serial
			
			TODO ==> re-chew function for renewing stuff like startSeconds, etc
			     ==> timeline actually needs to be it's own class with methods...
			
			
			*/
			chewTimeline : function (tdata, init) {
					
					// TODO ==> add additional units
					var dhash = {"da":[], "mo":[], "ye":[], "de":[], "ce":[], "thou":[]};
					var units = tgDate.units; 
						tdata.startSeconds = [];
						tdata.endSeconds = [];
				
					if (tdata.events) {
			
						var date, ev, ei, id, ux, unit, ser, tWidth;
						var l = tdata.events.length;

						for(ei=0; ei< l; ei++) {
								
							ev=tdata.events[ei];
							id = ev.id;
							// is this a span?
							ev.startdate == ev.enddate ? ev.span=true : ev.span=false;
							//// !! TODO VALIDATE DATE respecting startdate, too
						
							//  these include seconds and rata die
							ev.startdateObj = tgDate.makeDateObject(ev.startdate);
							ev.enddateObj = tgDate.makeDateObject(ev.enddate);
							ev.basicWidth = getStringWidth(ev.title);
							trace ("ev:" + ev.title + "=" + ev.width + "px");
						
							// create microtimeline for collapsed view and other metrics
							tdata.startSeconds.push(ev.startdateObj.sec);
							tdata.endSeconds.push(ev.enddateObj.sec);
						
							for (ux =0; ux< units.length; ux++) {
							  unit = units[ux];
							  ///// DATE HASHING in action 
								ser = tgDate.getTimeUnitSerial(ev.startdateObj, unit);
								if (dhash[unit][ser] != undefined) {
									dhash[unit][ser].push(id);
								} else {
									// create the array
									dhash[unit][ser] = [id];
								}
								// trace ("unit:" + unit + "...ser:" + ser);
							///////////////////////////////
							} 
						
						// add*modify indexed pool
						eventPool[id] = ev;
						
					}// end cycling through timeline's events
					
					var allsec = $.merge(tdata.startSeconds,tdata.endSeconds);
					var fl = getLowHigh(allsec);
					/// bounds of timeline
					tdata.bounds = {"first": fl.low, "last":fl.high }
					
					} /// end if there are events!
					
					// bypass hashing if ! events
					if (init == true) {
						tdata.display = "expanded";
					}
					
					tdata.dateHash = dhash;
										
					return tdata;
			},
			
			
			/* Makes an indexed array of timelines */
			swallowTimeline : function (obj) {
				this._timelines[obj.id] = obj;	
				this.timelineListChangeSignal.broadcast();
			},
		
			refresh : function () {
				this.refreshSignal.broadcast();
			},

			// !!!TODO ---- get these back to normal setTicksReady, etc.
			setTicksReady : function (bool) {
				this._ticksReady = bool;
				if (bool == true) this.ticksReadySignal.broadcast({"bool":bool});
			},
			
			getTicksReady : function () {
				return this._ticksReady;
			},
			
			getFocusDate : function () {
				return this._focusDate;
			},

			setFocusDate : function (fd) {
				// TO DO :: VALIDATE FOCUS DATE
				
				if (fd != this._focusDate && "valid" == "valid") {
					// "fillout" function which redefines fd ?
					fd.mo_num = tgDate.getMonthNum(fd); 
					fd.rd = tgDate.getRataDie(fd);      
					fd.sec = tgDate.getSec(fd);
					
					this._focusDate = fd; 
					
				}
			},

			getZoomLevel : function () {
				return this._zoomLevel;
			},

			/* 	also the effective setter for 
			   	other zoomInfo elements : width, label, tickWidth 
				@param z ==> integer from 1-100, other zoom info comes from zoomTree array
			*/
			setZoomLevel : function (z) {
				
			 if (z <= this.max_zoom && z >= this.min_zoom) {
				
				// focusdate has to come first for combined zoom+focusdate switch
				this._startSec = this._focusDate.sec;
				// output ("startsec:" + this._startSec, "note");
				trace ("setting zoom level");
				if (z != this._zoomLevel) {
					this._zoomLevel = z;
					this._zoomInfo = zoomTree[z];
					$(SLIDER).slider("value", invSliderVal(z));
					
					this.zoomLevelChange.broadcast({"zoomLevel": z});
				
				}
				
				output("z:" + this._zoomLevel + " / " + this._zoomInfo.label, "zoomlevel");
				
		     	} else { return false; }// end min/max check
		
			}, 
				
			getZoomInfo : function () {
				return this._zoomInfo;
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
				var ta = this._ticksArray;
				for (var t=0; t<ta.length; t++) {
					var tick = ta[t];
					if (tick.serial == serial) return tick;
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
				
				var lt = this._timelines[id];
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
			
			
			},
			
	
		} ///// end model methods
		

			
		
		/*****************************************
		    VIEW
		*****************************************/
		var TimelineView = function (mod, settings) {

			var me = this;
			var M = this.M = mod;
		
			// !TODO validate these range/relation etc
			// move all to model?
			M.max_zoom = settings.max_zoom;
			M.min_zoom = settings.min_zoom;
			M.setZoomLevel(settings.initial_zoom);
			basicFontSize = settings.basic_fontsize;
			
			
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
			
			M.ticksArrayChange.tuneIn(function () {
				var ht = '';
				/*
				var ta = M.ticksArray;
				for (var t=0; t < ta.length; t++) {
					var ti = ta[t];
				 	ht += "<br>" + ti.unit + "-" + ti.serial;
				}
				*/
				$("#ticksinfo").html(ht);
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
		
				if (M.getTicksReady() == true) {
					
					/// HOW TO CREATE TIMER DELAY FOR ZOOMING TO NOT CLOG UP
					/// PROCESSOR WHILE SLIDER IS BEING DRAGGED
					//setTimeout(function () {
						me.freshTimelines();
					//}, 10);
					
					// get active timelines events for all ticks on display
					
					
				} else {
					// SOME KIND OF ISSUE:: Don't add ticks...

				}
			});

			// INITIAL CONSTRUCTION
			this.buildSlider();
			this.castTicks();


				
			// TURN TO FUNCTION centerline show/hide
			if (settings.show_centerline == true) {
				$(CENTERLINE).css({"height":me.dimensions.height, "left": me.dimensions.centerx});
			} else {
				$(CENTERLINE).css({"display":"none"});
			}	
																				//---( VIEW
																							
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
					            var dir = Math.ceil(-1 * (delta * 3));
								var zl = M.getZoomLevel();
								M.setZoomLevel(zl += dir);
					            return false;
					});
			
				
			$(TICKS)
			  .draggable({ axis: 'x', 
				
				start: function(event, ui) {
					/// 
				},
				drag: function(event, ui) {
					// just report movement to model...
					M.setTicksOffset($(this).position().left);
				},
				
				stop: function(event, ui) {
					me.resetTicksHandle();
					me.easeOutTicks();
					me.registerDragging(); // one final time, plus more if easing...
				}
				// other methods: start and stop 
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
			
			$("#TimegliderTimelineMenu ul").html("");
			var id;
			var ta = M._timelines;
				for(id in ta) {
					var t = ta[id];
					$("#TimegliderTimelineMenu ul")
						.append("<li class='timelineList' id='" + id + "'>" + t.title + "</li>");
					$("li#" + id).click( function() { M.toggleTimeline($(this).attr("id"))  } );
				}
			
			}),
			
			
			
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
					
			
		}


		/* VIEW METHODS */
		TimelineView.prototype = {

			
			/* Zoom slider is inverted value-wise from the normal jQuery UI slider
			   so we need to feed in and take out inverse values               */
			
			
			registerTitles : function () {
				/*
				!!!TODO  
				wicked inefficient.... 
				
				1. target only spans, not all events...
				
				*/
				var mo = $(CONTAINER).offset().left;
				$(".ev").each(
					function() {
					 	var toff = $(this).offset().left - mo;
						var w = $(this).outerWidth();
						var tw = $("#evtitle",this).outerWidth() + 5;
						// trace ("title width:" + tw);
					 	if ((toff < 0) && (Math.abs(toff) < (w-tw))) {
								$("#evtitle", this).css({marginLeft:(-1 * toff)+5});
							} 
					 }
					 )
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

																						//---( VIEW
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
				// trace ("cast ticks...");
				M.setTicksReady(false);
				
				this.clearTicks();
				var zLevel = M.getZoomLevel();
				var fDate = M.getFocusDate();
				var tickWidth = M.getZoomInfo().width;
				var twTotal = 0;

				// START FROM CENTER
				var ctr = this.dimensions.centerx; // don't center - (tickWidth / 2);

				// INITIAL TICK !  added according to focus date provided
				this.addTick({"type":"init", "focus_date":fDate});

				// determine how many are necessary to fill (overfill) container
				var nTicks = Math.ceil(this.dimensions.width / tickWidth) + 2,
				    leftright = 'l';
				// ALTERNATING L & R
				for (var i=1; i<=nTicks; i++) {
					this.addTick({"type":leftright});
					leftright == "l" ? leftright = "r" : leftright = "l";
				}
				
				M.setTicksReady(true);

			},
			
			/*
			@param info   ----> type: init|l|r
			                    focusDate: date object for init type
			*/											
			addTick : function (info) {
				var M = this.M;
				var tickUnit = M.getZoomInfo().unit;
				var tickWidth = M.getZoomInfo().width;
				var mDays;
				
				/// this is the broadcast of change to ticks array
				//// too early???
				var serial = M.addToTicksArray({type:info.type, unit:tickUnit}, M.getFocusDate());
	
				if (tickUnit == "mo") {
					var mInfo = tgDate.getMonthAdj(serial, tickWidth);
					tickWidth = mInfo.width;
					var mDays = mInfo.days;
				} 
				
				var focusDate = M.getFocusDate();
				this.tickNum ++;
				
				// raw placement to keep css/dom namespace unique
				var tid = RAW_PLACEMENT + "_tick_" + this.tickNum;
				
				var pos, ctr, tperu;
			
				/*
				Here we need to adjust tick-width for months (mo)
				*/
			
			
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
				
				var tid = RAW_PLACEMENT + "_" + tickUnit + "_" + serial + "-" + this.tickNum;
				
				var tickHtml = "<div class='TimegliderTick' id='" + tid + "'><div class='TGDateLabel' id='label'></div></div>";
				
				$(TICKS).append(tickHtml);
		
				var idRef = TICKS + " #" + tid;
				var $tickDiv = $(idRef);
				$tickDiv.css({width:tickWidth, left:pos});
				
				// GET TICK DIVS FOR tickUnit AND WIDTH
				var tInfo = this.getTickMarksInfo({unit:tickUnit, width:tickWidth});
				(mDays > 0) ? tperu = mDays : tperu=tInfo.tperu;
											
				var dist = tickWidth / tperu;
				if (dist > 5) {
				
					/* Raphael canvas for tick lines
					   @param dom id-with-no-hash, width, height 
					*/
					var lines = Raphael(tid, tickWidth, 30);
					var c, l, xd, stk = '', ht = 10;
					var num = tperu;
					var downset = 20;
				for (l = 0; l < num; ++l) {
					xd = l * dist;
					stk += "M" + xd + " " + downset + " L" + xd + " " + (ht + downset);
				}
				
				c = lines.path(stk);
				// !TODO --- add stroke color into settings object
				c.attr({"stroke":"#333", "stroke-width":1});
				} // end if there's enough space between tickmarks
				
				/*
				SHOULD THIS BE QUEUED IN A SEPARATE "when" ???
				*/
				var pack = {"unit":tickUnit, "width":tickWidth, "serial":serial};
				var label = this.getDateLabelForTick(pack);
				
				// ?? use document.getElementByID???
				$(idRef + " > #label").text(label);
				
				// DO OTHER STUFF TO THE TICK, MAKE THE LABEL AN ACTIONABLE ELEMENT
				$tickDiv
					.children("#label")
					.bind("click", pack, function () { trace ("do something with the label here?") })


				return pack;
				/* end addTick */
			}, 

			
			/* provides addTick() info for marks and for adj width for month or year */
			getTickMarksInfo : function (obj) {
				var tperu;
				switch (obj.unit) {
					case "da": tperu = 24; break;
					case "mo": tperu = 30; break;
					case "ye": tperu = 12; break;
					default: tperu = 10; 
				}
			
				return {"tperu":tperu}
			},
			
			
			getDateLabelForTick : function  (obj) {
				var i;
				switch(obj.unit) {
					
					case "de": return ((obj.serial -1) * 10) + "s"; break;
					case "ye": return obj.serial; break;
					case "mo": 
						i = tgDate.getDateFromMonthNum(obj.serial);
						return tgDate.monthNamesFull[i.mo] + ", " + i.ye; break;
					case "da": 
						i = tgDate.getDateFromRD(obj.serial);
						return i.ye + "-" + i.mo + "-" + i.da; break;
					
				
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
				
				if (lHangie > 0) {
					tick = this.addTick({"type":"l"});
					me.appendTimelines(tick);
				} else if (rHangie < 0) {
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
					
					return {"width":w, "height":h, "centerx":wc, "centery":hc, "left": lft, "offset": offset} 
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
			
																						//---( VIEW
			easeOutTicks : function() {
				var me = this;
					if (Math.abs(this.dragSpeed) > 5) {
						// output("release @:" + this.dragSpeed + " px EaseOut!");
						// This works, but isn't great:offset fails to register
						// for new tim as it ends animation...
						// $('#TimegliderTicks').animate({left: '+=' + (5 * me.dragSpeed)}, 400, function() {
    					// output("ticks stopped!");
  						// });
					}
				
			},
			
			toggleMenu : function () {
				var M = this.M;
				var mw = $(MENU).width();
				if (M.timelineMenuOpen == false) {
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
				var tl = this.M._timelines[id];
				tl[prop] = value;	
			},
			
			/*
			invoked upon a fresh sweep of entire stage, having added a set of ticks
			--- occurs on expand/collapse
			--- blocks are created afresh
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
					M = this.M,
					cx = me.dimensions.centerx,
					foSec = M.getFocusDate().sec,
					spp = M.getZoomInfo().spp,
					zl = M.getZoomInfo().level,
					idArr;
					
					var levHt = 24;
				//////////////////////////////////////////
				
				for (t in active) {
					
					// FOR EACH TIMELINE...
					tl = M._timelines[active[t]];
					
					var expCol = tl.display;
					var tlTop = (tl.top || 0);
					
					$(TICKS).append("<div class='TGTimelineEnvelope' id='"
					 	+ tl.id + "'><div id='title'>"
					 	+ tl.title + " <span id='clps'>vv</span></div></div>");
					
			  		$tl = $(".TGTimelineEnvelope#" + tl.id);
					$tl	
						.draggable({
						axis:"y",
						handle:"#title", 
						stop: function () {
							me.setTimelineProp(tl.id,"top", $(this).css("top"));	
						}
					})
						.css("top", tlTop);
						
					ht = $tl.height();
					
					$(".TGTimelineEnvelope#" + tl.id + " #title #clps").click(function () { 
							/// TODO a little tenuous -- better way to delegate?
							var par = $(this).parent().parent().attr("id");
							me.expandCollapseTimeline(par);
					} );
				 
					$title = $tl.children("#title");
					t_f = cx + ((tl.bounds.first - foSec) / spp);
					t_l = cx + ((tl.bounds.last - foSec) / spp);
					$title.css({"top":ht, "left":t_f, "width":(t_l-t_f)});
		
					/// @ FULL DISPLAY
					if (expCol == "expanded") borg = new TGOrg({level_height:levHt});
			
					//cycle through ticks for all events
					for (i in ticks) {
						
						idArr = this.getTimelineEventsByTick({tick:ticks[i], timeline:tl});

							for (i=0; i<idArr.length; i++) {

									// both collapsed and expanded
									ev = eventPool[idArr[i]];
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
			
					$tl.append(stuff);
					
				}// end for each timeline
				
				
				
				
			}, // ends freshTimelines()
			
			
			/* 
				this is per tick... pretty wet with freshTimelines()...
			*/
			appendTimelines : function (tick) {

					var M = this.M;
					var active = M._activeTimelines; 
					var cx = this.dimensions.centerx;
					var tl, ev, posx, expCol, ht, borg, stuff,
						foSec = M._startSec, 
						spp = M.getZoomInfo().spp,
						zl  = M.getZoomInfo().zoomLevel;
						
					/// !!TODO --- dynamic heights in TGOrg.js
					var levHt = 24;

					for (var t in active) {
							tl = M._timelines[active[t]];
							expCol = tl.display;
							borg = tl.borg; // existing layout object
							$tl = $(".TGTimelineEnvelope#" + tl.id);
							ht = $tl.height();
							idArr = this.getTimelineEventsByTick({tick:tick, timeline:tl});
							expCol = tl.display;
					
							for (i=0; i<idArr.length; i++) {

								// WET
								ev = eventPool[idArr[i]];
								// !!TODO ==> TIMEZONE SETTING...
								posx = cx + ((ev.startdateObj.sec - foSec) / spp);
						
								if (expCol == "expanded") {
									ev.left = posx; // will remain constant
									// !TODO --- ACCURATE WIDTH BASELINE FROM chewTimeline()
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
								if (expCol == "expanded") stuff = borg.getHTML(tick.serial);
							}

							$tl.append(stuff);
						
			}, // ends appendTimelines()
			
			
			expandCollapseTimeline : function (id) {
				var tl = this.M._timelines[id];
				if (tl.display == "expanded") {
					tl.display = "collapsed";
				} else {
					tl.display = "expanded";
				}
				trace ("tl.state:" + tl.display);
				
				this.M.refresh();
			}
			
			
			
		}// end VIEW METHODS
		
		
		
				
	    this.load(MAIN_TEMPLATE, {}, function() {
				
				$(CONTAINER).css({"backgroundColor":settings.backgroundColor});
				
				MODEL = new TimegliderModel();
				MODEL.setFocusDate(tgDate.makeDateObject(settings.initial_focus));

				var timelineView = new TimelineView(MODEL, settings);
				
				// load timelines
				MODEL.loadTimelineData(settings.data_source, settings.data_type);
				
				timelineView.toggleMenu();
								
		}); // end load callback
		
		
	
			
		return $.timeglider;


  } // end of fn.timeGlider
})(jQuery);
