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
/*
****************************************
TimegliderTimelineView
****************************************
*/
function TimegliderTimelineView (widget, mediator) {
	
	var options = widget.options;
	var PL = "#" + widget._id;

	this._views = {
		PLACE:PL,
		CONTAINER : PL + " .timeglider-container", 
		MENU : PL + " .timeglider-timeline-menu", 
		MENU_UL : PL + " .timeglider-timeline-menu ul", 
		MENU_HANDLE : PL + " .timeglider-timeline-menu-handle", 
		SLIDER_CONTAINER : PL + " .timeglider-slider-container", 
		SLIDER : PL + " .timeglider-slider", 
		TRUCK : PL + " .timeglider-truck", 
		CENTERLINE : PL + " .timeglider-centerline", 
		TICKS : PL + " .timeglider-ticks", 
		HANDLE : PL + " .timeglider-handle"
	}
	
	me = this,
	M = this.M = mediator,
    basicFontSize = options.basic_fontsize;

	// !!TODO validate these range/relation etc
	// move all to model?
	M.max_zoom = options.max_zoom;
	M.min_zoom = options.min_zoom;
	M.initial_timeline_id = options.initial_timeline_id;
	M.setZoomLevel(options.initial_zoom);
	
	this.dragSpeed = 0;
	this.dimensions = this.getTimelineDimensions();
	this.tickNum = 0;
	this.leftside = 0;
	this.rightside = 0;
	this.ticksHandleOffset = 0;	
	this.timeoout_id = 1;
	this.sliderActive = false;
	this.timelineMenuOpen = false;
	
		// INITIAL CONSTRUCTION
		this.buildSlider();
		
		this.castTicks();
	
	
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
		$(me._views.SLIDER).slider("value", invSliderVal(M.getZoomLevel()));
	});
	
	/// This happens on a TOTAL REFRESH of 
	/// ticks, as when zooming; panning will load
	/// events of active timelines per tick	
	M.ticksReadySignal.tuneIn(function (b) {
		if (M.getTicksReady() === true) {
			me.freshTimelines();
		} 
	});

		
	// TURN TO FUNCTION centerline show/hide
	if (options.show_centerline === true) {
		$(this._views.CENTERLINE).css({"height":me.dimensions.height, "left": me.dimensions.centerx});
	} else {
		$(this._views.CENTERLINE).css({"display":"none"});
	}	
																					
	$(this._views.TRUCK)
		.dblclick(function(e) {
			 	Cw = me.dimensions.width;
				var Cx = e.pageX - (me.dimensions.offset.left);
				var offMid = Cx - Cw/2;
				var secPerPx = M.getZoomInfo().spp;
				// don't need mouse_y yet :
				//	var Cy = e.pageY - $(PLACEMENT).offset().top;
				var fdSec = M.getFocusDate().sec;
				var dcSec = Math.floor(fdSec + (offMid * secPerPx));
				var clk = TGDate.getDateFromSec(dcSec);
				var foc = TGDate.getDateFromSec(fdSec);
				
				output("DBLCLICK:" + foc.mo + "-" + foc.ye + " dblclick:" + clk.mo + "-" + clk.ye, "note");	
			})			
		.bind('mousewheel', function(event, delta) {
						output("hello mousewheel?", "note");
			            var dir = Math.ceil(-1 * (delta * 3));
						var zl = M.getZoomLevel();
						M.setZoomLevel(zl += dir);
			            return false;
			});

	
		
	$(this._views.TICKS)
	  	.draggable({ axis: 'x',
			//start: function(event, ui) {
				/// 
			//},
			drag: function(event, ui) {
				// just report movement to model...
				M.setTicksOffset($(this).position().left);
				
				// M.updateState();
				// 
				// var updateState = function() {
				//   this.garbageCollect(
				// 	$('.far-offscreen').remove();
				//   )	
				// 
				//   this.updateText(
				// 	$('.edge-case').whatever();
				// 	);
				// }
			},
		
			stop: function(event, ui) {
				me.resetTicksHandle();
				me.easeOutTicks();
				me.registerDragging(); // one final time, plus more if easing...
				widget.doSomething();
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
			var title = M.eventPool[eid].title;
			output("hover, title:" + title, "note"); 
		})
		.delegate(".evCollapsed", "hover", function () { 
			var eid = $(this).attr("id"); 
			var title = M.eventPool[eid].title;
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
		// trace ("z: " + M.zoomLevel + "...fd: " + TGDate.formatFocusDate(M.focusDate));
		me.castTicks();
	});
	
	/* UPDATE TIMELINES MENU */
	
	M.timelineListChangeSignal.tuneIn( function (arg) {
	
	$(me._views.MENU_UL).html("");
	var id;
	var ta = M.timelinePool;
		for(id in ta) {
			if (ta.hasOwnProperty(id)) {
			var t = ta[id];
			$(me._views.MENU_UL)
				.append("<li class='timelineList' id='" + id + "'>" + t.title + "</li>");
			$("li#" + id)
				.click( function() { M.toggleTimeline($(this).attr("id"))  } );
			} // end filter
		}
	
	});
	

	M.activeTimelinesChange.tuneIn( function () {
		/// main timelines menu
		$(me._views.MENU_UL + " li").each(function () {
				var id = $(this).attr("id");
			    if ($.inArray(id, M._activeTimelines) != -1) {
					$(this).addClass("activeTimeline");
				} else { 
					$(this).removeClass("activeTimeline");	
				}	
        }); // end each	

	}); // end tune in
	
	
	$(this._views.MENU_HANDLE).click(function () {
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
/*
	if ($.browser.webkit) {	
		/// How to get a particular instance, like $(this._views.TRUCK)
		var truck = document.getElementById("TimegliderTruck");		
			truck.addEventListener ('gesturestart', gestureStart, false);
			truck.addEventListener ('gesturechange', gestureChange, false);
			truck.addEventListener ('gestureend', gestureEnd, false);
	}
	*/

} // end VIEW declarations/actions


/* VIEW METHODS */
TimegliderTimelineView.prototype = {

	registerTitles : function () {
		
		var toff, w, tw, sw, pos, titx, 
		  $elem, env, tb, ti, relPos, tbWidth,
		  mo = $(this._views.CONTAINER).offset().left;
		
		/*
		!!!TODO  inefficient, redundant
		should target only spanning events, not all events...
		FILTER!!!!
		*/
		// $(".timeglider-timeline-event").each(
			// !TODO find out if it's a span
			// use ba-cond or ba-iff
		$(".timeglider-event-spanning").each(
			function() {
			  // !TODO  needs optimizing of DOM "touching"
			 	toff = $(this).offset().left - mo;
				w = $(this).outerWidth();
				$elem = $(".timeglider-event-title",this);
				tw = $elem.outerWidth() + 5;
				sw = $elem.siblings(".timeglider-event-spanner").outerWidth();
			  console.log("tw:" + tw + "...sw:" + sw);
				if (sw > tw) {
          if ((toff < 0) && (Math.abs(toff) < (w-tw))) {
            $elem.css({marginLeft:(-1 * toff)+5});
          } 
			  }
				
				// is offscreen == false: $(this).removeClass('timeglider-event-offscreen')
			 }
		);

		$(".TGTimelineEnvelope").each(
				function() {
				  // !TODO  needs optimizing of DOM "touching"
					env = $(this).offset().left - mo;
					tb = $("#titleBar", this);
					ti = $("#titleBar #title", this);
					pos = tb.position().left;
				 	relPos = pos + env;
					tbWidth = tb.outerWidth();
					
				// 	output ("relpos:" + relPos, "note");
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
		var tickPos = $(this._views.TICKS).position().left;
		output("ticks x:" + tickPos, "tickpos");
		
		var secPerPx = M.getZoomInfo().spp;			
		var newSec = startSec - (tickPos * secPerPx);
		var newD = TGDate.getDateFromSec(newSec);
		
		output("FD: " + TGDate.formatFocusDate(newD), "focusdate");
		
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
	
		 	$(this._views.SLIDER)
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
		$(this._views.TICKS).css("left", 0)
				.html("<div class='timeglider-handle'></div>");
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
			mInfo = TGDate.getMonthAdj(serial, tickWidth);
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
		
		
		tid = this._views.PLACE + "_" + tickUnit + "_" + serial + "-" + this.tickNum;

		$tickDiv= $("<div class='timeglider-tick' id='" + tid + "'><div class='TGDateLabel' id='label'></div></div>").appendTo(this._views.TICKS);
		
		// $(this._views.TICKS).append(tickHtml);

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
		
		
		// DO OTHER STUFF TO THE TICK, MAKE THE LABEL AN ACTIONABLE ELEMENT
		$tickDiv.children("#label").text(label);

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
				i = TGDate.getDateFromMonthNum(obj.serial);
				return TGDate.monthNamesFull[i.mo] + ", " + i.ye; 
			case "da": 
				i = TGDate.getDateFromRD(obj.serial);
				return i.ye + "-" + i.mo + "-" + i.da; 
		
			default: return obj.unit + ":" + obj.serial + ":" + obj.width;
		}
		
	},


	tickHangies : function () {
		var tPos = $(this._views.TICKS).position().left;
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
	
			console.log(this._views.foo2);
		
			var container = $(this._views.CONTAINER),
				w = container.width(),
				wc = Math.floor(w / 2) + 1,
				h = container.height(),
				hc = Math.floor(h/2);
					console.log("container:" + container.attr("id"));
					
				var lft = container.position().left,
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
				var mdn = TGDate.getMonthDays(fdate.mo, fdate.ye);
			   
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
		$(this._views.HANDLE).offset({"left":$(this._views.CONTAINER).offset().left});
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
		var mw = $(this._views.MENU).width();
		if (M.timelineMenuOpen === false) {
			$(this._views.MENU).animate({left: '+=' + mw}, 50);
			$(this._views.MENU_HANDLE).text("<<");
			M.timelineMenuOpen =true;
		} else {
			$(this._views.MENU).animate({left: '-=' + mw}, 100);
			$(this._views.MENU_HANDLE).text("timelines >>");
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
		var tl = M.timelinePool[id];
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
			idArr,
			levHt = 24,
			buffer = 18;
			
		//////////////////////////////////////////
		// different kind of loop here for array?
		for (var a=0; a<active.length; a++) {

			// FOR EACH TIMELINE...
			tl = M.timelinePool[active[a]];
			
			var expCol = tl.display;
			var tlTop = (tl.top || 0);
			
			$(this._views.TICKS).append("<div class='TGTimelineEnvelope' id='" + tl.id
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
							ev = M.eventPool["ev_" + idArr[i]];
							posx = cx + ((ev.startdateObj.sec - foSec) / spp);
							impq = (ev.importance / zl);
							
						if (expCol == "expanded") {
							ev.width = (ev.titleWidth * impq) + buffer;
							if (ev.span == true) {
							  ev.spanwidth = (ev.enddateObj.sec - ev.startdateObj.sec) / spp;
							  if (ev.spanwidth > ev.width) { ev.width = ev.spanwidth; }
							}	else {
							  ev.spanwidth = 0;
							}					
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
				zl = M.getZoomInfo().level,
				buffer = 18;
				
			/// !!TODO --- dynamic heights in TGOrg.js
			var levHt = 24;

				for (var a=0; a<active.length; a++) {

					// FOR EACH TIMELINE...
					tl = M.timelinePool[active[a]];
					expCol = tl.display;
					borg = tl.borg; // existing layout object
					$tl = $(".TGTimelineEnvelope#" + tl.id);
					ht = $tl.height();
					idArr = this.getTimelineEventsByTick({tick:tick, timeline:tl});
					ids = idArr.length;
					expCol = tl.display;
					stuff = ''; // needs to be cleared
					
					for (i=0; i<ids; i++) {

						// !! WET WITH freshTimelines
						ev = M.eventPool["ev_" + idArr[i]];
						// !!TODO ==> TIMEZONE SETTING...
						posx = cx + ((ev.startdateObj.sec - foSec) / spp);
						
						if (expCol == "expanded") {
						  
							ev.left = posx; // will remain constant
							// !TODO --- ACCURATE WIDTH BASELINE FROM chewTimeline()
							impq = (ev.importance / zl);
							ev.fontsize = basicFontSize * impq;
							ev.width = (ev.titleWidth * impq) + buffer;
							if (ev.span == true) {
  							ev.spanwidth = (ev.enddateObj.sec - ev.startdateObj.sec) / spp;
  							if (ev.spanwidth > ev.width) { ev.width = ev.spanwidth; }
  						}	else {
  							 ev.spanwidth = 0;
  						}
  							
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
		var tl = M.timelinePool[id];
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
		var ev = M.eventPool[eid];
		
		var html = "<div class='TimegliderEvModal shadow roundedSmall' id='" + eid + "_modal' "
			+ "style='position:absolute;left:" + pos.left + "px;top:" + (pos.top + 40) + "px'>" 
			+ "<div class='closeBt' id='closer'><img src='img/close.png'></div>" 
			+ "<div class='startdate'>" + ev.startdate + "</div>"
			+ "<h4 id='title'>" + ev.title + "</h4>"
			+ "<p>" + ev.description + "</p>"
			+ "<div id='link'><a target='_blank' href='" + ev.link + "'>link</a></div>"
			+ "</div>";
			
		$(this._views.TICKS).append(html);
		
	}

}; // end VIEW METHODS