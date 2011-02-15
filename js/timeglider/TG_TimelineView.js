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
timeglider.TimegliderTimelineView
****************************************
*/
(function(tg){

 // MED below is a reference to the mediator reference
 // that will be passed into the main Constructor below
  var TGDate = tg.TGDate, MED, options, $ = jQuery;
  

  /*
  *  timeglider.TimegliderTimelineView
  *  
  *
  */
  tg.TimegliderTimelineView = function (widget, mediator) {

	options = widget.options,
	    // core identifier to "uniquify"
	    PL = "#" + widget._id,
	    WIDGET_ID = widget._id,
	    pl_ht = $(PL).height(),
	    me = this;
  
  MED = mediator;
	
	/* references specific to the instance (rather than timeglider) so
	   one can have more than one instance of the widget on a page */ 	      
	this._views = {
    		PLACE:PL,
    		CONTAINER : PL + " .timeglider-container", 
    		TIMELINE_MENU : PL + " .timeglider-timeline-menu", 
    		TIMELINE_MENU_UL : PL + " .timeglider-timeline-menu ul", 
    		TIMELINE_LIST_BT : PL + " .timeglider-list-bt", 
    		SLIDER_CONTAINER : PL + " .timeglider-slider-container", 
    		SLIDER : PL + " .timeglider-slider", 
    		TRUCK : PL + " .timeglider-truck", 
    		CENTERLINE : PL + " .timeglider-centerline", 
    		TICKS : PL + " .timeglider-ticks", 
    		HANDLE : PL + " .timeglider-handle",
    		FOOTER : PL + " .timeglider-footer",
    		FILTER_BT : PL + " .timeglider-filter-bt",
    		FILTER_BOX : PL + " .timeglider-filter-box",
    		TOOLS_BT : PL + " .timeglider-tools-bt"
	}
	
	
  /*  TEMPLATES FOR THINGS LIKE MODAL WINDOWS
  *   events themselves are non-templated and rendered in TG_Org.js
  *   as there are too many on-the-fly style attributes etc, and 
  *   the current theory is that templating would create lag
  *
  *
  */
  
	this._templates = {
	    // generated, appended on the fly, then removed
      event_modal: $.template( null, "<div class='tg-modal timeglider-ev-modal ui-widget-content' id='ev_${id}_modal'>" 
    	  + "<div class='close-button-remove'><img src='img/close.png'></div>" 
    	  + "<div class='startdate'>${startdate}</div>"
    	  + "<h4 id='title'>${title}</h4>"
    	  + "<p>{{html description}}</p>"
    	  + "<ul class='timeglider-ev-modal-links'><li><a target='_blank' href='${link}'>link</a></li></ul>"
    	  + "</div>"),
    	  
    	// generated, appended on the fly, then removed
    	event_modal_video : $.template( null,
    	  "<div class='tg-modal timeglider-ev-video-modal ui-widget-content' id='${id}_modal'>"
    	  + "<div class='close-button-remove'><img src='img/close.png'></div>"
        + "<iframe width = '100%' height='300' src='${video}'></iframe></div>"),
        
      // generated, appended on the fly, then removed
      timeline_modal : $.template( null, "<div class='tg-modal timeglider-timeline-modal ui-widget-content' id='tl_${id}_modal'>" 
      	  + "<div class='close-button-remove'><img src='img/close.png'></div>"
      	  + "<h4 id='title'>${title}</h4>"
      	  + "<p>{{html description}}</p>"
      	  + "</div>"),
     
     // generated, appended on the fly, then removed
     filter_modal : $.template( null,
          "<div class='tg-modal timeglider-menu-modal timeglider-filter-box timeglider-menu-hidden'>"+
          "<div class='close-button'><img src='img/close.png'></div>"+
          "<h3>filter</h3>"+
          "<div class='timeglider-menu-modal-content'>"+
          "<div class='timeglider-formline'>show: "+
          "<input type='text' class='timeglider-filter-include'></div>"+
          "<div class='timeglider-formline'>hide: "+
          "<input type='text' class='timeglider-filter-exclude'></div>"+
          "<ul><li class='timeglider-filter-clear'>clear</li>"+
          "<li class='timeglider-filter-apply'>apply</li></ul></div>"+
           "<div class='timeglider-menu-modal-point-right'>"+
           "</div>"),
          
      timeline_list_modal : $.template( null,
          "<div class='timeglider-menu-modal timeglider-timeline-menu timeglider-menu-hidden'>"+
          "<div class='close-button'><img src='img/close.png'></div>"+
          "<h3>timelines</h3>"+
          "<div class='timeglider-menu-modal-content'><ul></ul></div>"+
          "<div class='timeglider-menu-modal-point-right'>"+
          "</div>")

    }
  
  
  
  
	$(this._views.CONTAINER).css("height", pl_ht);
	this.basicFontSize = options.basic_fontsize;
	
	if (options.show_footer == false) {
	  $(this._views.FOOTER).css("display", "none");
	  debug.log("HIDE FOOTER!");
  }
  
  
	// !!TODO validate range/relation of min/max
	// move all to model?
	MED.max_zoom = options.max_zoom;
	MED.min_zoom = options.min_zoom;
	MED.initial_timeline_id = options.initial_timeline_id;
	MED.setZoomLevel(options.initial_zoom);
	
	this.dragSpeed = 0;
	this.dimensions = this.getWidgetDimensions();
	this.tickNum = 0;
	this.leftside = 0;
	this.rightside = 0;
	this.ticksHandleOffset = 0;	
	this.timeoout_id = 1;
	this.sliderActive = false;
	this.timelineMenuOpen = false;
	this.ztop = 1000;
	this.filterBoxActivated = false;
	
	// INITIAL CONSTRUCTION
	this.buildSlider();
	this.castTicks();


	/// listen for ticks movement, i.e. dragging
	// MED.ticksOffsetChange.tuneIn(function () {
	$.subscribe("mediator.ticksOffsetChange", function () {
		me.tickHangies();
		me.registerTitles();
		me.registerDragging();
	});
	
	
	$.subscribe("mediator.zoomLevelChange", function () {
		me.tickNum = 0;
		me.leftside = 0;
		me.castTicks();
		// if the slider isn't already at the given value change it
		$(me._views.SLIDER).slider("value", me.invSliderVal(MED.getZoomLevel()));
	});
	
	/// This happens on a TOTAL REFRESH of 
	/// ticks, as when zooming; panning will load
	/// events of active timelines per tick	
	$.subscribe("mediator.ticksReadySignal", function (b) {
		if (MED.getTicksReady() === true) {
			me.freshTimelines();
		} 
	});
	
	
	/*
    	Renews the timeline at current focus/zoom, but with
    	possibly different timeline/legend/etc parameters
    	! The only view method that responds directly to a model refresh()
	*/
	$.subscribe("mediator.refreshSignal", function () {
		me.castTicks();
	});
	


	// adding to or removing from ticksArray
	// DORMANT: necessary?
	$.subscribe( 'mediator.ticksArrayChange', function () {
		/*
    	SCAN OVER TICKS FOR ANY REASON?
		*/
	});
	
	
	// listen for focus date change
	// I.E. if date is zipped to rather than dragged
	$.subscribe("mediator.focusDateChange", function () {
		// 
	});
	
	
	// UPDATE TIMELINES MENU
	$.subscribe("mediator.timelineListChangeSignal", function (arg) {
		me.adjustTimelineTitleStyles();
    me.buildTimelineMenu();
	});
	

	$.subscribe("mediator.activeTimelinesChange", function () {
		
		$(me._views.TIMELINE_MENU_UL + " li").each(function () {
				var id = $(this).attr("id");
			    if ($.inArray(id, MED._activeTimelines) != -1) {
					$(this).addClass("activeTimeline");
				} else { 
					$(this).removeClass("activeTimeline");	
				}	
        }); // end each	
        

	}); // end tune in


  /* FOOTER TIMELINE_MENU MODALS */
  
  
  $.tmpl(this._templates.filter_modal,{}).appendTo(this._views.CONTAINER);
	$(this._views.FILTER_BT).click(function() {  
	  
	  var $bt = $(this),
	      fbox = me._views.FILTER_BOX;
	  
	  // If it's never been opened, apply actions to the buttons, etc
	  if (me.filterBoxActivated == false) {

	    me.filterBoxActivated =true;
	    
	    var $filter_apply = $(fbox + " .timeglider-filter-apply"),
          $filter_close = $(".timeglider-filter-box .close-button"),
          $filter_clear = $(fbox + " .timeglider-filter-clear"),
          incl = "", excl = "";
	    
	    // set up listeners
	    $filter_apply.click(function () {
	      incl = $(fbox + " .timeglider-filter-include").val();
	      excl = $(fbox + " .timeglider-filter-exclude").val();
	      MED.setFilterObject({include:incl, exclude:excl});
	      $(fbox).toggleClass("timeglider-menu-shown");
      });
 
      $filter_close.click(function () {
        $(fbox).toggleClass("timeglider-menu-hidden");
      });
      
      $filter_clear.click(function () {
        MED.setFilterObject({include:'', exclude:''});
        $(fbox + " .timeglider-filter-include").val('');
	      $(fbox + " .timeglider-filter-exclude").val('');
        $(fbox).toggleClass("timeglider-menu-shown");
      });
      
    } // end initial set up
    
    // open the box
	  $(fbox)
	    .toggleClass("timeglider-menu-hidden")
	    .css("z-index", me.ztop++)
	      .position({
        		my: "right bottom",
      			at: "right top",
      			of: $bt,
      			offset: "-8, -12"
          });
      
  }); // end FILTER_BT click


  $.subscribe("mediator.filterObjectChange", function () {
    // refresh is done inside MED -- no need to refresh here
		// debug.log("filter:" + MED.filterObject.include + "/" + MED.filterObject.exclude);
	});
	
															
	$(this._views.TRUCK)
		.dblclick(function(e) {
			 	var Cw = me.dimensions.container.width,
			    Cx = e.pageX - (me.dimensions.container.offset.left),
				  offMid = Cx - Cw/2,
			    secPerPx = MED.getZoomInfo().spp,
				  // don't need mouse_y yet :
				  //	var Cy = e.pageY - $(PLACEMENT).offset().top;
			    fdSec = MED.getFocusDate().sec,
				  dcSec = Math.floor(fdSec + (offMid * secPerPx)),
				  clk = TGDate.getDateFromSec(dcSec),
				  foc = TGDate.getDateFromSec(fdSec);
				
				debug.trace("DBLCLICK:" + foc.mo + "-" + foc.ye + " dblclick:" + clk.mo + "-" + clk.ye, "note");	
		})			
		.bind('mousewheel', function(event, delta) {
						
			      var dir = Math.ceil(-1 * (delta * 3));
						var zl = MED.getZoomLevel();
						MED.setZoomLevel(zl += dir);
			      return false;
			            
		}); // end TRUCK EVENTS


	
	$(this._views.TICKS)
	  	.draggable({ axis: 'x',
			//start: function(event, ui) {
				/// 
			//},
			drag: function(event, ui) {
				// just report movement to model...
				MED.setTicksOffset($(this).position().left);
			},
		
			stop: function(event, ui) {
				me.resetTicksHandle();
				me.easeOutTicks();
				me.registerDragging(); // one final time, plus more if easing...
				// TESTING widget.doSomething();
			}
		}) // end draggable
		.delegate(".timeglider-timeline-event", "click", function () { 
			// EVENT ON-CLICK !!!!!!
			var eid = $(this).attr("id"); 
			me.eventModal(eid);
		})	
		.delegate(".timeglider-timeline-event", "hover", function () { 
			var eid = $(this).attr("id"); 
			var title = MED.eventPool[eid].title;
			debug.trace("hover, title:" + title, "note"); 
		})
		.delegate(".timeglider-event-collapsed", "hover", function () { 
			var eid = $(this).attr("id"); 
			var title = MED.eventPool[eid].title;
			debug.trace("collapsed, title:" + title, "note"); 
		});
	
	
	// TODO ---> build this into jquery-ui component behavior
	$(".close-button-remove").live("click", function () {
		$(this).parent().remove();	
	});


 $.tmpl(me._templates.timeline_list_modal,{}).appendTo(this._views.CONTAINER);
 $(me._views.TIMELINE_LIST_BT).click(function () {
		  $(me._views.TIMELINE_MENU).toggleClass("timeglider-menu-hidden")
		    .position({
        		my: "right bottom",
      			at: "right top",
      			of: $(me._views.TIMELINE_LIST_BT),
      			offset: "-8, -12"
          });
	});
	
	
	
	$(this._views.TIMELINE_MENU + " .close-button").live("click", function () {
		 $(me._views.TIMELINE_MENU).toggleClass("timeglider-menu-hidden")
	});
  
  /* SETTINGS BUSINESS */
  $(this._views.TOOLS_BT).click(function() {
    alert("TOOLS!");
  }); 
  
  
  
  
  
	
	// TODO: make function displayCenterline()
	if (options.show_centerline === true) {
		$(this._views.CENTERLINE).css({"height":me.dimensions.container.height, "left": me.dimensions.container.centerx});
	} else {
		$(this._views.CENTERLINE).css({"display":"none"});
	}
	
	
	//// GESTURES  ////
	/* !!TODO    Still a FAIL in iPad ---- 
	   When actually doing something, Safari seems to 
	   ignore attempts at preventing default... 
	   
	   SCOPED IN CLOSURE, THESE ARE UNTESTABLE
	*/
	function gestureChange (e) {
		e.preventDefault ();
		if (MED.gesturing === false) {
			MED.gesturing = true;
			MED.gestureStartZoom = MED.getZoomLevel();
		}
	    var target = e.target;
		// constant spatial converter value
	    var g = (e.scale / 5)* MED.gestureStartZoom;
		  debug.trace("gesture zoom:" + g, "note");
		  MED.setZoomLevel(g);
	}



	function gestureEnd (e) {
		MED.gesturing = false;
	}


	if ($.support.touch) {   
	  // alert("widget:" + WIDGET_ID);
	  $("#" + WIDGET_ID).addTouch();
	  
	  var tgcompnt = document.getElementById(WIDGET_ID);
	  
	  tgcompnt.addEventListener("gesturestart", function (e) {
	    	  e.preventDefault();
	        debug.trace("gesture zoom:" + MED.getZoomLevel(), "note");
	    }, false);
	  
	  
	  tgcompnt.addEventListener("gesturechange", function (e) {
    	    	  e.preventDefault();
    	        debug.trace("gesture change!!!!", "note");
    	 }, false);
    	    
    	    
    	    
	}

	
} 


tg.TimegliderTimelineView.prototype = {
	
	getWidgetDimensions : function () {
			
			var c = $(this._views.CONTAINER),
				w = c.width(),
				wc = Math.floor(w / 2) + 1,
				h = c.height(),
				hc = Math.floor(h/2);
					
				var lft = c.position().left,
				offset = c.offset();
		  
		  var f_height = (options.show_footer == true) ? $(this._views.FOOTER).height() : 0;
	
			var container = {"width":w, "height":h, "centerx":wc, "centery":hc, "left": lft, "offset": offset};
			var footer = {"height":f_height};
			var tick = {"top":h - f_height - 30};
			
			return {container:container, tick:tick, footer:footer}
		  
	},
	
  scaleToImportance : function(imp, zoo) {
		    return imp / zoo;
	},
	

  invSliderVal : function(v) {
  		return Math.abs(v - 101);
  },
  

  


  registerTitles : function () {
		
		var toff, w, tw, sw, pos, titx, 
		  $elem, env, tb, ti, relPos, tbWidth,
		  mo = $(this._views.CONTAINER).offset().left;
		
		$(".timeglider-event-spanning").each(
			function() {
			  // !TODO  needs optimizing of DOM "touching"
			 	toff = $(this).offset().left - mo;
				w = $(this).outerWidth();
				$elem = $(".timeglider-event-title",this);
				tw = $elem.outerWidth() + 5;
				sw = $elem.siblings(".timeglider-event-spanner").outerWidth();
				if (sw > tw) {
          if ((toff < 0) && (Math.abs(toff) < (w-tw))) {
            $elem.css({marginLeft:(-1 * toff)+5});
          } 
			  }
				
				// is offscreen == false: $(this).removeClass('timeglider-event-offscreen')
			 }
		);

		$(".tg-timeline-envelope").each(
				function () {
				  // !TODO  needs optimizing of DOM "touching"
					env = $(this).offset().left - mo;
					tb = $(".titleBar", this);
					ti = $(".titleBar .timeline-title", this);
					pos = tb.position().left;
				 	relPos = pos + env;
					tbWidth = tb.outerWidth();
					
					tw = tb.outerWidth();
					
				  titx = (-1 * relPos);
					
				 	if ( (relPos < 0) ) {
						ti.css({marginLeft:titx+5});
					} 
				}
		); 
	// whew! end register titles
	},
	
	
	registerDragging : function () {
	  /* 
			startSec --> the seconds-value of the
	    initial focus date on landing @ zoom level
		*/
		
		var startSec = MED._startSec,
		  tickPos = $(this._views.TICKS).position().left,
		  secPerPx = MED.getZoomInfo().spp,
		  newSec = startSec - (tickPos * secPerPx),
		  newD = TGDate.getDateFromSec(newSec);
		
		debug.trace("ticks x:" + tickPos, "tickpos");
		debug.trace("FD: " + TGDate.formatFocusDate(newD), "focusdate");
		
		MED.setFocusDate(newD);
	},
	
	
	adjustTimelineTitleStyles : function () {
	  debug.log("modifyTimelineTitles!");
	  
  },
  
  buildTimelineMenu : function () {
    debug.log("buildTimelineMenu!");
    
    var id, ta = MED.timelinePool, ta_ct = 0, me=this;
		
		    // cycle through menu
        $(me._views.TIMELINE_MENU_UL + " li").remove();
      	for (id in ta) {
      			if (ta.hasOwnProperty(id)) {
        			var t = ta[id];
        			$(me._views.TIMELINE_MENU_UL).append("<li class = 'timelineList' id='" + id + "'>" + t.title + "</li>");
        			$("li#" + id).click( function() { 
        			    MED.toggleTimeline($(this).attr("id"));
        			    });
      			} // end filter
      			ta_ct ++;
      	}
  },
  
	
	/* 
		Zoom slider is inverted value-wise from the normal jQuery UI slider
	  so we need to feed in and take out inverse values with invSliderVal()            
	*/
	buildSlider : function () {
		
		var me = this,
		  init_zoom = me.invSliderVal(MED.getZoomLevel()),
      hZoom = MED.max_zoom,
      lZoom = MED.min_zoom,
      sHeight = (1 + hZoom - lZoom) * 3;
	
		 	$(this._views.SLIDER)
			  .css("height", sHeight)
			  .slider({ 
  				steps: 100,
  				handle: $('.knob'),
  				animate:500,
				orientation: 'vertical',

				/* "min" here is really the _highest_ zoom value @ upside down */
  				min:me.invSliderVal(hZoom),

				/* "max" actually takes (i  nverse value of) low zoom level */
  				max:me.invSliderVal(lZoom),

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
					MED.setZoomLevel(me.invSliderVal(ui.value));
				}
			});
	},


	clearTicks : function () {
		this.tickNum = 0;
		$(this._views.TICKS)
		  .css("left", 0)
			.html("<div class='timeglider-handle'></div>");
		
		
	},


	/* 
	  The initial drawing of a full set of ticks, starting in the 
	  middle with a single, date-focused div with type:"init", after which
	  a left-right alternating loop fills out the width of the current frame
	*/
	castTicks : function () {
		var zLevel = MED.getZoomLevel(),
			fDate = MED.getFocusDate(),
			tickWidth = MED.getZoomInfo().width,
			twTotal = 0,
			ctr = this.dimensions.container.centerx,
			nTicks = Math.ceil(this.dimensions.container.width / tickWidth) + 4,
			leftright = 'l';
	
		this.clearTicks();
		
		
		MED.setTicksReady(false);

		// INITIAL TICK added  in center according to focus date provided
		this.addTick({"type":"init", "focus_date":fDate});
	
		// determine how many are necessary to fill (overfill) container
		
		// ALTERNATING L & R
		for (var i=1; i<=nTicks; i +=1) {
			this.addTick({"type":leftright});
			leftright = (leftright == "l") ? "r" : "l";
		}
		
		MED.setTicksReady(true);
	},
  
  
	
	/*
	* @param info {object} --object--> type: init|l|r focusDate: date object for init type
	*/											
	addTick : function (info) {
		  
			var mDays = 0, dist = 0, pos = 0, ctr = 0, 
			tperu = 0, serial = 0, shiftLeft = 0,
			tid = "", tickHtml = "", idRef = "", 
			$tickDiv = {}, tInfo = {}, pack = {}, label = {}, mInfo = {}, 
			tickUnit = MED.getZoomInfo().unit,
			tickWidth = MED.getZoomInfo().width,
			focusDate = MED.getFocusDate(),
			tick_top = parseInt(this.dimensions.tick.top),
			me = this,	
			serial = MED.addToTicksArray({type:info.type, unit:tickUnit}, focusDate);
						
		// adjust tick-width for months (mo)
		if (tickUnit == "mo") {
			
			// standard: 28 days, how many px, days to add?
			mInfo = TGDate.getMonthAdj(serial, tickWidth);
			tickWidth = mInfo.width;
			mDays = mInfo.days;
			
		} 

		this.tickNum ++;
		if (info.type == "init") {
			
		  shiftLeft = this.tickOffsetFromDate(MED.getZoomInfo(), MED.getFocusDate(), tickWidth);
			pos = Math.ceil(this.dimensions.container.centerx + shiftLeft);
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
		MED.getTickBySerial(serial).width = tickWidth;
		MED.getTickBySerial(serial).left = pos;

		tid = this._views.PLACE + "_" + tickUnit + "_" + serial + "-" + this.tickNum;

		$tickDiv= $("<div class='timeglider-tick' id='" + tid + "'>"
		            + "<div class='timeglider-tick-label' id='label'></div></div>")
		  .appendTo(this._views.TICKS);
		
		$tickDiv.css({width:tickWidth, left:pos, top:tick_top});
						
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

      case "bill":
      	if (obj.serial == 1) return "1";
        return (obj.serial -1) + " bya";
        
      case "hundredmill":
      	if (obj.serial == 1) return "1";
        return ((obj.serial -1) * 100) + " mya";
        
      case "tenmill":
      	if (obj.serial == 1) return "1";
        return ((obj.serial -1) * 10) + " mya";
        		    
      case "mill":
    		if (obj.serial == 1) return "1";
      	return (obj.serial -1) + " mya";
      		    
      case "hundredthou":
  		  if (obj.serial == 1) return "1";
    		return (obj.serial -1) + "00,000";    
    		    
		  case "tenthou":
		    if (obj.serial == 1) return "1";
  		  return (obj.serial -1) + "0000";
 
		  case "thou": 
		    if (obj.serial == 1) return "1";
		    return (obj.serial -1) + "000";

		  case "ce": 
		    if (obj.serial == 1) return "1";
		    return (obj.serial -1) + "00";
		    
			case "de": 
				return ((obj.serial -1) * 10) + "s";
			case "ye": 
				return obj.serial; 
			case "mo": 
				i = TGDate.getDateFromMonthNum(obj.serial);
				return TGDate.monthNamesFull[i.mo] + ", " + i.ye; 
			case "da": 
				i = TGDate.getDateFromRD(obj.serial);
				return TGDate.monthNamesAbbr[i.mo] + " " + i.da + ", " + i.ye;
		
			default: return obj.unit + ":" + obj.serial + ":" + obj.width;
		}
		
	},


	tickHangies : function () {
		var tPos = $(this._views.TICKS).position().left,
		    lHangie = this.leftside + tPos,
		    rHangie = this.rightside + tPos - this.dimensions.container.width,
		    tick, added = false,
		    me = this;
		
		if (lHangie > -100) {
			tick = this.addTick({"type":"l"});
			me.appendTimelines(tick);
		} else if (rHangie < 100) {
			tick = this.addTick({"type":"r"});
			me.appendTimelines(tick);
		}
	},
	

	/* tickUnit, fd */
	tickOffsetFromDate : function (zoominfo, fdate, tickwidth) {
		
		// switch unit, calculate width gain or loss.... or just loss!
		var w = tickwidth,
		    u = zoominfo.unit, p, prop;

		switch (u) {
			case "da": 
				// @4:30        4/24                30 / 1440
				//              .1666                .0201
				prop = ((fdate.ho) / 24) + ((fdate.mi) / 1440);
				p = w * prop;
				break;

			case "mo":
				var mdn = TGDate.getMonthDays(fdate.mo, fdate.ye);
			   
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
				prop = ((fdate.ye % 1000) / 1000); //   + (fdate.ye / 1000) + (fdate.mo / 12000);
				p = w * prop;
				break;
				

			case "tenthou":  
			
				prop = ((fdate.ye % 10000) / 10000); //   + (fdate.ye / 1000) + (fdate.mo / 12000);
				p = w * prop;
				
				break;

			case "hundredthou": 
			
				prop = ((fdate.ye % 100000) / 100000); //   + (fdate.ye / 1000) + (fdate.mo / 12000);
				p = w * prop;
				
				break;

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
				// This works, but isn't great:offset fails to register
				// for new tim as it ends animation...
				// $('#TimegliderTicks').animate({left: '+=' + (5 * me.dragSpeed)}, 400, function() {
					debug.trace("ticks stopped!", "note");
					// });
			}
		
	},
	

	/*
	@param    obj with { tick  |  timeline }
	@return   array of event ids 
	*/
	getTimelineEventsByTick : function (obj) {
	  
		var unit = obj.tick.unit,
		  serial = obj.tick.serial,
		  hash = obj.timeline.dateHash,
		  spans = obj.timeline.spans;
		  	
		if (hash[unit][serial] && hash[unit][serial].length > 0) {
			return hash[unit][serial];
		} else {
			return 0;
		}
	},
	
	/* WOAH! MOVE THIS TO MEDIATOR/TIMELINE MODEL!!!! */
	setTimelineProp : function (id, prop, value) {
		var tl = MED.timelinePool[id];
		tl[prop] = value;	
	},
	
	
	passesFilters : function (ev, zoomLevel) {
	   var ret = true,
	    ei = "", ea = [], e,
	    ii = "", ia = [], i;
	   
	   // filter by thresholds first
	   if  ((zoomLevel < ev.low_threshold) || (zoomLevel > ev.high_threshold)) {
	     return false;
     }
	   
	   var incl = MED.filterObject.include;
 	   if (incl) {
 	      ia = incl.split(",");
 	      ret = false;
 	      for (i=0; i<ia.length; i++) {
 	        ii = new RegExp($.trim(ia[i]), "i");
 	        if (ev.title.match(ii)) { ret = true; }
         }
      }

	   var excl = MED.filterObject.exclude;
	   if (excl) {
	      ea = excl.split(",");
	      for (e=0; e<ea.length; e++) {
	        ei = new RegExp($.trim(ea[e]), "i");
	        if (ev.title.match(ei)) { ret = false; }
        }
     }
	   
	   return ret;
  },
  
  
	
	/*
	ADDING EVENTS!
	invoked upon a fresh sweep of entire container, having added a set of ticks
		--- occurs on expand/collapse
		--- ticks are created afresh
	*/
	freshTimelines : function () {
		
		var t, i, tl, tu, ts, tick, tE, ht, t_f, t_l,
			active = MED._activeTimelines,
			ticks = MED._ticksArray,
			borg = '',
			$title, $ev, 
			me = this,
			evid, ev, impq,
			stuff = '', 
			posx = 0,
			cx = me.dimensions.container.centerx,
			cw = me.dimensions.container.width,
			foSec = MED.getFocusDate().sec,
			spp = MED.getZoomInfo().spp,
			zl = MED.getZoomInfo().level,
			tArr = [],
			idArr = [],
			buffer = 18,
			// left and right scope
			half = Math.floor(spp * (cw/2)),
			lsec = foSec - half,
			rsec = foSec + half,
			spanin,
			spanins = [],
			expCol, tlTop=0,
			cht = me.dimensions.container.height;
			
		//////////////////////////////////////////
		for (var a=0; a<active.length; a++) {

			// FOR EACH _ACTIVE_ TIMELINE...
			tl = MED.timelinePool[active[a]];
			
			expCol = tl.display;
		  tlTop = (tl.top || (cht-120));
			
			//  TEMPLATE!
			$tl = $("<div class='tg-timeline-envelope' id='" + tl.id
				+ "'><div class='titleBar'><div class='timeline-title'>"
			 	+ tl.title + "<div class='tg-timeline-env-buttons'>"
			 	+ "<span class='timeline-info'>info</span><span class='expand-collapse'>expand/collapse</span></div></div></div></div>")
			 	.appendTo(this._views.TICKS);
			
			$tl.draggable({
				axis:"y",
				handle:".titleBar", 
				stop: function () {
					me.setTimelineProp(tl.id,"top", $(this).css("top"));	
				}
			})
				.css("top", tlTop);
				
			ht = $tl.height();
			
			$(".tg-timeline-envelope#" + tl.id + " .titleBar .expand-collapse").click(function () { 
					me.expandCollapseTimeline(tl.id );
			} );
			
			$(".tg-timeline-envelope#" + tl.id + " .titleBar .timeline-info").click(function () { 
  				me.timelineModal(tl.id);
  		} );

			$title = $tl.children(".titleBar");
			t_f = cx + ((tl.bounds.first - foSec) / spp);
			t_l = cx + ((tl.bounds.last - foSec) / spp);
			$title.css({"top":ht, "left":t_f, "width":(t_l-t_f)});

			/// for full display, setup new borg for organizing events
			if (expCol == "expanded") { borg = new timeglider.TGOrg(); }
 
			//cycle through ticks for hashed events
			for (var tx=0; tx<ticks.length; tx++) {
				tArr = this.getTimelineEventsByTick({tick:ticks[tx], timeline:tl});
		    $.merge(idArr, tArr);	
			}
			
			// detect if there are boundless spans (bridging, no start/end points)
      for (var sp1=0; sp1<tl.spans.length; sp1++) {
			  spanin = tl.spans[sp1];;
			  if (spanin.start < lsec && spanin.end > lsec) {
			    //not already in array
			    if ($.inArray(spanin.id, idArr) == -1) {
			      idArr.unshift(spanin.id);
		      }
		    }
		  }
	
			for (i=0; i<idArr.length; i++) {

					// both collapsed and expanded
					ev = MED.eventPool["ev_" + idArr[i]];
					
			    /// filter patterns & thresholds 
  				if (this.passesFilters(ev, zl) == true) {
  						  
					  posx = cx + ((ev.startdateObj.sec - foSec) / spp);
					  impq = this.scaleToImportance(ev.importance, zl);
					
    				if (expCol == "expanded") {
    					ev.width = (ev.titleWidth * impq) + buffer;
    					if (ev.span == true) {
    					  ev.spanwidth = (ev.enddateObj.sec - ev.startdateObj.sec) / spp;
    					  if (ev.spanwidth > ev.width) { ev.width = ev.spanwidth; }
    					}	else {
    					  ev.spanwidth = 0;
    					}					
    					ev.fontsize = this.basicFontSize * impq;
    					// !TODO isolate these into position object
    					ev.left = posx; // will remain constant
    					// !TODO --- ACCURATE WIDTH BASELINE FROM chewTimeline()
					    
					    var img_ht = 0;
					    if (ev.image && ev.image_class=="layout") {
					      img_ht = ev.image_size.height + 2;
					      ev.width = ev.image_size.width + 2;
				      }
    					
    					ev.height = Math.ceil(ev.fontsize) + img_ht;
    					ev.top = ht - ev.height;
    					
    					borg.addBlock(ev, "sweep");
    					// no stuff yet...
					
    			  } else if (expCol == "collapsed") {
    					stuff += "<div id='ev_" + ev.id + 
    					"' class='timeglider-event-collapsed' style='top:" + 
    					(ht-2) + "px;left:" +
    					posx + "px'></div>";
    			  }
    			  
  			  } // end if it passes filters

			}
			
			// ev.blocks....
			
			// expanded only
			if (expCol == "expanded") {
				stuff = borg.getHTML("sweep");
				tl.borg = borg.getBorg();
			}
			if (stuff != "undefined") { $tl.append(stuff); }
			
			$(".timeglider-event-image-bar").each(
			    function () {
			      $(this).position({
			        		my: "top",
          				at: "bottom",
          				of: $tl,
          				offset: "0, 0"
		        }).css("left", 0);
		      }
	      );
			
		}// end for each timeline
		
		// initial title shift since it's not on-drag
		me.registerTitles();
		
	}, // ends freshTimelines()
	
	
  
	/* 
		this is per tick... pretty wet with freshTimelines()...
	*/
	appendTimelines : function (tick) {

			var active = MED._activeTimelines, 
			  cx = this.dimensions.container.centerx,
		    tl, ev, posx, expCol, ht, borg, stuff, impq, ids,
				foSec = MED._startSec, 
				spp = MED.getZoomInfo().spp,
				zl = MED.getZoomInfo().level,
				// left right "margin" (not css, just added space)
				buffer = 18;
			  /// !!TODO --- dynamic heights in TGOrg.js

				for (var a=0; a<active.length; a++) {

					// FOR EACH TIMELINE...
					tl = MED.timelinePool[active[a]];
					expCol = tl.display;
					borg = tl.borg; // existing layout object
					$tl = $(".tg-timeline-envelope#" + tl.id);
					ht = $tl.height();
					idArr = this.getTimelineEventsByTick({tick:tick, timeline:tl});
					ids = idArr.length;
					expCol = tl.display;
					stuff = ''; // needs to be cleared
					
					for (i=0; i<ids; i++) {

						// !! WET WITH freshTimelines
						ev = MED.eventPool["ev_" + idArr[i]];
						// !!TODO ==> TIMEZONE SETTING...
						posx = cx + ((ev.startdateObj.sec - foSec) / spp);
						
						/// filter patterns & thresholds 
						if (this.passesFilters(ev, zl)==true) {
						 
						if (expCol == "expanded") {
						  
							ev.left = posx; // will remain constant
							// !TODO --- ACCURATE WIDTH BASELINE FROM chewTimeline()
							impq = this.scaleToImportance(ev.importance, zl);
							ev.fontsize = this.basicFontSize * impq;
							ev.width = (ev.titleWidth * impq) + buffer;
							if (ev.span == true) {
  							ev.spanwidth = (ev.enddateObj.sec - ev.startdateObj.sec) / spp;
  							if (ev.spanwidth > ev.width) { ev.width = ev.spanwidth; }
  						}	else {
  							 ev.spanwidth = 0;
  						}
							ev.top = ht - timeglider.levelHeight; 
							ev.height = 18;
							borg.addBlock(ev, tick.serial);
								
						} else if (expCol == "collapsed") {
							stuff += "<div id='ev_" + ev.id 
							+ "' class='timeglider-event-collapsed' style='top:" 
							+ (ht-2) + "px;left:" 
							+ posx + "px'></div>";
						}
						
					}	//////// END FILTERS
						
						
					} // end for through idArr
					
						// borg it if it's expanded.
						if (expCol == "expanded"){ 
							tl.borg = borg.getBorg();
							stuff = borg.getHTML(tick.serial);
						}
			
						$tl.append(stuff);
						
			} // end for in active timelines
					
	}, // end appendTimelines()
	
	
	expandCollapseTimeline : function (id) {
		var tl = MED.timelinePool[id];
		if (tl.display == "expanded") {
			tl.display = "collapsed";
		} else {
			tl.display = "expanded";
		}
		
		MED.refresh();
	},
  

  timelineModal : function (id) {
    
    $("#tl_" + id + "_modal").remove();
  
    var tl = MED.timelinePool[id], 
    me = this;
    templ_obj = {
  			  title:tl.title,
  			  description:tl.description,
  			  id:id
  		}
  		
		 $.tmpl(me._templates.timeline_modal,templ_obj)
  			.appendTo(this._views.CONTAINER)
  			.css("z-index", me.ztop++)
	      .position({
      				my: "left top",
      				at: "left top",
      				of: (me._views.CONTAINER),
      				offset: "32, 32", // left, top
      				collision: "fit fit"
      	})
      	.draggable({stack: ".timeglider-modal"});
  
  },
  
	eventModal : function (eid) {
		// get position
		$("#ev_" + eid + "_modal").remove();
		var me = this,
		  $par = $("#" + eid),
		  modalTemplate = me._templates.event_modal;
		  ev = MED.eventPool[eid],
		  ev_img = ev.image ? "<img src='" + ev.image + "'>" : "",
		  templ_obj = {
  			  title:ev.title,
  			  description:ev_img + ev.description,
  			  id:eid,
  			  startdate: ev.startdate,
  			  link: ev.link,
  			  video: ev.video
  		}
		  
			if (ev.video) { 
       modalTemplate = me._templates.event_modal_video;
       templ_obj.video = ev.video;
			}
	
		  $.tmpl(modalTemplate,templ_obj)
  			.appendTo(this._views.TICKS)
			  .css("z-index", me.ztop++)
	      .position({
      				my: "right center",
      				at: "left top",
      				of: $par,
      				offset: "0, -12", // left, top
      				collision: "fit fit"
      	})
      	.draggable({stack: ".timeglider-modal"});

	},
	
	parseHTMLTable : function(table_id) {
		var obj = {},
		now = +new Date(),
		keys = [];

		$('#' + table_id).find('tr').each(function(i){
			////////// each..
			var children = $(this).children(),
			row_obj;

			if ( i === 0 ) {
				keys = children.map(function(){
					return $(this).attr( 'class' ).replace( /^.*?\btg-(\S+)\b.*?$/, '$1' );
					}).get();

				} else {
					row_obj = {};

					children.each(function(i){
						row_obj[ keys[i] ] = $(this).text();
					});

					obj[ 'prefix' + now++ ] = row_obj;
				}
				/////////
			});
			return obj;
			
	}

} // end VIEW prototype



    /*
          zoomTree
          ****************
          there's no zoom level of 0, so we create an empty element @ 0

          This could eventually be a more flexible system so that a 1-100 
          value-scale could apply not to "5 hours to 10 billion years", but 
          rather to 1 month to 10 years. For now, it's static according to 
          a "universal" system.
    */
  
    tg.zoomTree = [
    {},
    {unit:"da", width:35000,level:1, label:"5 hours"},
    {unit:"da", width:17600,level:2, label:"7 hours"},
    {unit:"da", width:8800,level:3, label:"10 hours"},
    {unit:"da", width:4400,level:4, label:"12 hours"},
    {unit:"da", width:2200, level:5, label:"14 hours"},
    {unit:"da", width:1100, level:6, label:"17 hours"},
    {unit:"da", width:550, level:7, label:"22 hours"},
    {unit:"da", width:432, level:8, label:"1 DAY"},
    {unit:"da", width:343, level:9, label:"1.5 days"},
    {unit:"da", width:272, level:10, label:"2 days"},
    {unit:"da", width:216, level:11, label:"2.5 days"},
    {unit:"da", width:171, level:12, label:"3 days"},
    {unit:"da", width:136, level:13, label:"3.5 days"},
    {unit:"da", width:108, level:14, label:"4 days"},
    /* 108 * 30 = equiv to a 3240 month */
    {unit:"mo", width:2509, level:15, label:"6 days"},
    {unit:"mo", width:1945, level:16, label:"1 WEEK"},
    {unit:"mo", width:1508, level:17, label:"10 days"},
    {unit:"mo", width:1169, level:18, label:"2 weeks"},
    {unit:"mo", width:913, level:19, label:"2.5 weeks"},
    {unit:"mo", width:719, level:20, label:"3 weeks"},
    {unit:"mo", width:566, level:21, label:"3.5 weeks"},
    {unit:"mo", width:453, level:22, label:"1 MONTH"},
    {unit:"mo", width:362, level:23, label:"5.5 weeks"},
    {unit:"mo", width:290, level:24, label:"7 weeks"},
    {unit:"mo", width:232, level:25, label:"2 months"},
    {unit:"mo", width:186, level:26, label:"2.5 months"},
    {unit:"mo", width:148, level:27, label:"3 months"},
    {unit:"mo", width:119, level:28, label:"4 months"},
    {unit:"mo", width:95,  level:29, label:"5 months"},
    {unit:"mo", width:76,  level:30, label:"6 months"},
    /* 76 * 12 = equiv to a 912 year */
    {unit:"ye", width:723, level:31, label:"9 months"},
    {unit:"ye", width:573, level:32, label:"1 YEAR"},
    {unit:"ye", width:455, level:33, label:"1.25 years"},
    {unit:"ye", width:361, level:34, label:"1.5 years"},
    {unit:"ye", width:286, level:35, label:"2 years"},
    {unit:"ye", width:227, level:36, label:"2.5 years"},
    {unit:"ye", width:179, level:37, label:"3 years"},
    {unit:"ye", width:142, level:38, label:"4 years"},
    {unit:"ye", width:113,  level:39, label:"5 years"},
    {unit:"ye", width:89,  level:40, label:"6 years"},
    {unit:"de", width:705, level:41, label:"8 years"},
    {unit:"de", width:559, level:42, label:"10 years"},
    {unit:"de", width:443, level:43, label:"13 years"},

    {unit:"de", width:302, level:44, label:"16 years"},
    {unit:"de", width:240, level:45, label:"20 years"},
    {unit:"de", width:190, level:46, label:"25 years"},
    {unit:"de", width:150, level:47, label:"30 years"},
    {unit:"de", width:120, level:48, label:"40 years"},
    {unit:"de", width:95,  level:49, label:"50 years"},
    {unit:"de", width:76,  level:50, label:"65 years"},
    {unit:"ce", width:600, level:51, label:"80 years"},
    {unit:"ce", width:480, level:52, label:"100 years"},
    {unit:"ce", width:381, level:53, label:"130 years"},
    {unit:"ce", width:302, level:54, label:"160 years"},
    {unit:"ce", width:240, level:55, label:"200 years"},
    {unit:"ce", width:190, level:56, label:"250 years"},
    {unit:"ce", width:150, level:57, label:"300 years"},
    {unit:"ce", width:120, level:58, label:"400 years"},
    {unit:"ce", width:95,  level:59, label:"500 years"},
    {unit:"ce", width:76,  level:60, label:"600 years"},
    {unit:"thou", width:603, level:61, label:"1000 years"},
    {unit:"thou", width:478, level:62, label:"1200 years"},
    {unit:"thou", width:379, level:63, label:"1800 years"},
    {unit:"thou", width:301, level:64, label:"160 years"},
    {unit:"thou", width:239, level:65, label:"xxx years"},
    {unit:"thou", width:190, level:66, label:"xxx years"},
    {unit:"thou", width:150, level:67, label:"xxx years"},
    {unit:"thou", width:120, level:68, label:"xxx years"},
    {unit:"thou", width:95, level:69, label:"8,000 years"},
    {unit:"thou", width:76,  level:70, label:"10,000 years"},
    {unit:"tenthou", width:603, level:71, label:"15,000 years"},
    {unit:"tenthou", width:358, level:72, label:"20,000 years"},
    {unit:"tenthou", width:213, level:73, label:"30,000 years"},
    {unit:"tenthou", width:126, level:74, label:"60,000 years"},
    {unit:"tenthou", width:76, level:75, label:"100,000 years"},
    {unit:"hundredthou", width:603, level:76, label:"180,000 years"},
    {unit:"hundredthou", width:358, level:77, label:"300,000 years"},
    {unit:"hundredthou", width:213, level:78, label:"500,000 years"},
    {unit:"hundredthou", width:126, level:79, label:"800,000 years"},
    {unit:"hundredthou", width:76,  level:80, label:"1 million years"},
    {unit:"mill", width:603, level:81, label:"1.2 million years"},
    {unit:"mill", width:358, level:82, label:"2 million years"},
    {unit:"mill", width:213, level:83, label:"3 million years"},
    {unit:"mill", width:126, level:84, label:"5 million years"},
    {unit:"mill", width:76, level:85, label:"10 million years"},
    {unit:"tenmill", width:603, level:86, label:"15 million years"},
    {unit:"tenmill", width:358, level:87, label:"30 million years"},
    {unit:"tenmill", width:213, level:88, label:"50 million years"},
    {unit:"tenmill", width:126, level:89, label:"80 million years"},
    {unit:"tenmill", width:76,  level:90, label:"100 million years"},
    {unit:"hundredmill", width:603, level:91, label:"120 million years"},
    {unit:"hundredmill", width:358, level:92, label:"200 million years"},
    {unit:"hundredmill", width:213, level:93, label:"300 million years"},
    {unit:"hundredmill", width:126, level:94, label:"500 million years"},
    {unit:"hundredmill", width:76, level:95, label:"1 billion years"},
    {unit:"bill", width:603, level:96, label:"15 million years"},
    {unit:"bill", width:358, level:97, label:"30 million years"},
    {unit:"bill", width:213, level:98, label:"50 million years"},
    {unit:"bill", width:126, level:99, label:"80 million years"},
    {unit:"bill", width:76,  level:100, label:"100 billion years"}
    ];


    tg.calculateSecPerPx = function (zt) {
      	for (var z=1; z<zt.length; z++) {
    			var zl = zt[z];
    			var sec = 0;
    			switch(zl.unit) {
    				case "da": sec =   86400; break;
    				case "mo": sec =   2419200; break; // assumes only 28 days per 
    				case "ye": sec =   31536000; break;
    				case "de": sec =   315360000; break;
    				case "ce": sec =   3153600000; break;
    				case "thou": sec =    31536000000; break;
    				case "tenthou": sec = 315360000000; break;
    				case "hundredthou": sec = 3153600000000; break;
    				case "mill": sec =    31536000000000; break;
    				case "tenmill": sec = 315360000000000; break;
    				case "hundredmill": sec = 3153600000000000; break;
    				case "bill": sec =31536000000000000; break;
    			}
    			// pixels
    			zl.spp = sec / parseInt(zl.width);
    			// trace ("level " + z + " unit:" + zl.unit.substr(0,2) + " sec:" + Math.floor(zl.spp));
    		}

    // call it right away to establish values
    }(tg.zoomTree);

    /*
    var filterBoxTemplate = "<div class='timeglider-formline'>show: "+
                            "<input type='text' class='timeglider-filter-include'></div>"+
                            "<div class='timeglider-formline'>hide: "+
                            "<input type='text' class='timeglider-filter-exclude'></div>"+
                            "<ul>"+
                            "<li class='timeglider-filter-clear'>clear</li>"+
                            "<li class='timeglider-filter-close'>close</li>"+
                            "<li class='timeglider-filter-apply'>apply</li>"+
                            "</ul>"
    */
   

})(timeglider);



