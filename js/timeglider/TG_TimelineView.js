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
 !TODO:
 add 
 change "click" bindings to CLICKORTOUCH
 relying solely on jquery.support ....



/*
****************************************
timeglider.TimelineView
****************************************
*/
(function(tg){

// MED below is a reference to the mediator reference
// that will be passed into the main Constructor below
var TG_Date = tg.TG_Date, 
	PL = "", 
	MED = "", 
	options = {},
	ticksSpeed = 0,
	t1Left = 0,
	t2Left = 0,
	ticksSpeedIv,
	container_name = '',
	$ = jQuery, 
	intervals ={}, 
	WIDGET_ID = "", 
	CONTAINER, TICKS, DATE,
	CLICKORTOUCH = $.support.touch ? "touchstart": "click";
    
    
/*
*  timeglider.TG_PlayerView
*  This is _not_ a backbone view, though
*  other elements inside of it are.
*  
*
*/
tg.TG_PlayerView = function (widget, mediator) {
    
    
	var me = this;
	

		// vars declared in closure above
		MED = mediator;
		options = MED.options;
				// core identifier to "uniquify" the container
		PL = "#" + widget._id;
		
		WIDGET_ID = widget._id;
      	container_name = options.base_namespace + "#" + WIDGET_ID;
	
		this.gens = 0;

	/*  references specific to the instance (rather than timeglider) so
		one can have more than one instance of the widget on a page */ 	      
	this._views = {
    		PLACE:PL,
    		CONTAINER : PL + " .timeglider-container", 
    		DATE : PL + " .timeglider-date-display",
    		TIMELINE_MENU : PL + " .timeglider-timeline-menu",
    		TIMELINE_MENU_UL : PL + " .timeglider-timeline-menu ul", 
    		TIMELINE_LIST_BT : PL + " .timeglider-list-bt", 
    		SLIDER_CONTAINER : PL + " .timeglider-slider-container", 
    		SLIDER : PL + " .timeglider-slider", 
    		ZOOM_DISPLAY : PL + " .timeglider-zoomlevel-display",
    		TRUCK : PL + " .timeglider-truck", 
    		CENTERLINE : PL + " .timeglider-centerline", 
    		TICKS : PL + " .timeglider-ticks", 
    		HANDLE : PL + " .timeglider-handle",
    		FOOTER : PL + " .timeglider-footer",
    		FILTER_BT : PL + " .timeglider-filter-bt",
    		FILTER_BOX : PL + " .timeglider-filter-box",
    		SETTINGS_BT : PL + " .timeglider-settings-bt"
	    }
	  
	// shorthand for common elements
	CONTAINER = this._views.CONTAINER;
	TICKS = this._views.TICKS;
	DATE = this._views.DATE;
	
	
	// height for images in the top image lane
	this.imageLaneHeight = 40;
	
	// distance from bottom of container (not vertically from ticks)
	// for timelines to be by default; if a timeline has a "top" value,
	// it will be set according to that
 	this.initTimelineVOffset = 100;
 	
 	// this needs to be less than or equal to
 	// timeglider.css value for .timeglider-tick 
 	// height property
 	this.tick_height = 34;
 	
 	
 	// a state var for the left-right position of the timeline
 	// to help track whether the timeline is too far left/right
 	this.dragScopeState = {state:"okay",pos:0};


	/*  TEMPLATES FOR THINGS LIKE MODAL WINDOWS
	*   events themselves are non-templated and rendered in TG_Org.js
	*   as there are too many on-the-fly style attributes etc, and 
	*   the current theory is that templating would create lag
	*
	*
	*/
	// in case custom event_modal fails, we need this object to exist
	this._templates = {}
  
	this._templates = {
	    // allows for customized templates imported
		test : "testola",
		
		event_modal_small: "<div class='tg-modal timeglider-ev-modal ui-widget-content' id='${id}_modal'>" 
      	   + "<div class='close-button-remove'></div>" 
      	   + "<div class='dateline'>{{html dateline}}</div>"
      	   + "<h4 id='title'>${title}</h4>"
      	   + "<p>{{html image}}{{html description}}</p>"
      	   + "<ul class='timeglider-ev-modal-links'>{{html links}}</ul>"
      	   + "</div>",
	
		// generated, appended on the fly, then removed
		event_modal_full : $.template( null,
		////////
		"<div class='tg-modal full_modal' id='ev_${id}_modal'>"
		+ "<div class='full_modal_scrim'></div>"
		+ "<div class='full_modal_panel'>"
		+ "<div class='close-button full_modal_close'>x</div>"
		+ "<div class='dateline'>{{html dateline}}</div>"
		+ "<table><tr><td>"
		+ "<h4>${title}</h4>"
		+ "<div class='description'>"
		+ "<p>{{html description}}</p>"
		+ "</div>"
		+ "</td><td>"
		+ "<div>{{html image}}</div>"
		+ "<div id='insert'></div>"
		+ "</td></tr></table>"
		+ "<div class='footer'><ul>{{html links}}</ul></div>"
		+ "</div>"),
			

     	// generated, appended on the fly, then removed
     	filter_modal : $.template( null,
          "<div class='tg-modal timeglider-menu-modal timeglider-filter-box'>"+
          "<div class='close-button'></div>"+
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
          "<div class='timeglider-menu-modal timeglider-timeline-menu'>"+
          "<div class='close-button'></div>"+
          "<h3>timelines</h3>"+
          "<div class='timeglider-menu-modal-content'><ul></ul></div>"+
          "<div class='timeglider-menu-modal-point-right'>"+
          "</div>"),
          
        settings_modal : $.template( null,
          "<div class='timeglider-menu-modal timeglider-settings-modal'>"+
          "<div class='close-button'></div>"+
          "<h3>settings</h3>"+
          "<div class='timeglider-menu-modal-content'><div class='timeglider-settings-timezone'></div></div>"+
          "<div class='timeglider-menu-modal-point-right'>"+
          "</div>"),
        
      	legend_modal : $.template( null,
          "<div class='timeglider-menu-modal timeglider-legend timeglider-display-none'  id='${id}_legend'>"+
          "<div class='timeglider-menu-modal-content'><ul id='${id}'>{{html legend_list}}</ul>"+
          "<div class='timeglider-close-button-small timeglider-legend-close'></div>"+
          "<div class='timeglider-legend-all'>all</div>"+
          "</div>"+
          "</div>")

    };
    
    
    
    
    
  	this.timelineModal = tg.TG_TimelineView.extend({
  	
  		tagName: "div",
		
		model:tg.TG_Timeline,
		
		className: 'tg-modal timeglider-timeline-modal ui-widget-content',
		
		events: {
			"click .close-button-remove": "remove"
		},
		
		template: "<div class='close-button-remove'></div>"
			+ "<h4 id='title'>${title}</h4>"
			+ "<p>{{html description}}</p>",

		initialize: function() {
			this.model.bind('change', this.render, this);
		},
		
		render: function() {
		$(this.el).html($.tmpl(this.template, this.model.attributes)).attr("id", this.model.get("id") + "_timelineModal");
		return this;
		},
		
		remove: function() {
			$(this.el).fadeOut();
		}
	});
	
	
	


	$(CONTAINER)
		.delegate(".tg-timeline-envelope .timeline-info", "click", function () {
			var id = $(this).data("timeline_id");
			me.openTimelineModal(id);
	})	
		.delegate(".tg-timeline-envelope .expand-collapse", "click", function () {
			var id = $(this).data("timeline_id");
			me.expandCollapseTimeline(id);
	})
		.delegate(".tg-timeline-envelope .tg-timeline-legend-bt", "click", function () {
			var id = $(this).data("timeline_id");
			me.legendModal(id);
	})
		.delegate(".close-button-remove", "click", function () {
			var parent_id = $(this).parent().attr("id");
			$("#" + parent_id).remove();
	})
		.delegate(".full_modal_scrim, .full_modal_close", "click", function () {
			$(".full_modal").remove();
	})
		.delegate(".timeglider-more-plus", "click", function () {
			MED.zoom(-1);
	})
	.	delegate(".timeglider-more-plus", "hover", function () {
			
			var evid = $(this).data("event_id");
			
			//!TODO
			// take id and focus to it, then zoom in until it's
			// visible: then highlight and fade out highlight
	})
		.delegate(".timeglider-legend-close", "click", function () {
			var $legend = $(CONTAINER + " .timeglider-legend");
			$legend.fadeOut(300, function () { $legend.remove(); });
	})
		.delegate(".timeglider-legend-all", "click", function () {
			$(CONTAINER + " .timeglider-legend li").each(function () {
				$(this).removeClass("tg-legend-icon-selected");
			});
		
			MED.setFilters({origin:"legend", icon: "all"});
	})
		.css("height", $(PL).height());
	// END CONTAINER CHAIN
	
	
	this.basicFontSize = options.basic_fontsize;
	
	if (options.show_footer == false) {
		$(this._views.FOOTER).css("display", "none");
	}

	this.dragSpeed = 0;
	this.dimensions = MED.dimensions = this.getWidgetDimensions();
	this.tickNum = 0;
	this.leftside = 0;
	this.rightside = 0;
	this.ticksHandleOffset = 0;	
	this.timeoout_id = 1;
	this.sliderActive = false;
	this.ztop = 1000;
	this.filterBoxActivated = false;
	
	// INITIAL CONSTRUCTION
	this.buildSlider();
	this.setupFilter();
	
	this.setPanButton($(".timeglider-pan-right"),-30);
	this.setPanButton($(".timeglider-pan-left"),30);
  
	$(this._views.TRUCK)
	
		// doubleclicking will be used by authoring mode
		.bind('dblclick', function(e) {
			MED.registerUIEvent({name:"dblclick", event:e});		
		})
		
		.bind('mousewheel', function(event, delta) {
			var dir = Math.ceil(-1 * (delta * 3));
			var zl = MED.getZoomLevel();
			MED.setZoomLevel(zl += dir);
			
			return false;    
		}); // end TRUCK EVENTS

	function registerTicksSpeed () {
		//!TODO: for gliding
	}
	
	$(TICKS)
  	.draggable({ axis: 'x',
		start: function(event, ui) {
			// anything??	
		},
		drag: function(event, ui) {
			
			t1Left = Math.floor($(this).position().left);
			
			MED.setTicksOffset(t1Left);
			
			ticksSpeed = t1Left - t2Left;
			t2Left = t1Left;
			
			
			// to keep dragging limited to
			// timeline scope, set "constrain_to_data"
			// to true in main widget options
			var dsState = me.dragScopeState;
			
			if (options.constrain_to_data && MED.activeTimelines.length == 1) {
				
				var $tb = $(".titleBar");			
				var tbPos = $tb.data("lef");
				var ctr = me.dimensions.container.centerx;
				
				if (dsState.state == "over-left") {
					// set timeline left side to center of frame
					var newPos = (-1 * tbPos) + (ctr-1);
					$(TICKS).css("left", newPos);
					me.dragScopeState = {state:"okay"};
					me.registerDragging();
					return false;
					
				} else if (dsState.state == "over-right") {
					// set timeline right side to center of frame
					var newPos = ((-1 * tbPos) + (ctr-1)) - ($tb.width() - 4);
					$(TICKS).css("left", newPos);
					me.dragScopeState = {state:"okay"};
					me.registerDragging();
					return false;
				}
			}
			
			return true;
			
		},
	
		stop: function(event, ui) {
			
			// debug.trace("::||" + ticksSpeed, "note");
			
			me.resetTicksHandle();
			me.registerDragging();
			me.registerTitles();
 
		}
		
	}) // end draggable
	.delegate(CONTAINER + " .timeglider-timeline-event", CLICKORTOUCH, function () { 
		
		// EVENT ON-CLICK !!!!!!
		var eid = $(this).attr("id"); 
		var ev = MED.eventCollection.get(eid).attributes;
		
		// debug.log("event id on touchstart/click:" + eid);
		
		if (timeglider.mode == "authoring") {
			// authoring will have its own handler
			
		} else {
			// custom callback for an event
			if (ev.click_callback) {
		    		try {
			    	var ccarr = ev.click_callback.split(".");
			    	var cclen = ccarr.length;
			    	if (cclen == 1) {
			    		// fn
			    		window[ccarr[0]](ev);
			    	} else if (cclen == 2) {
			    		// ns.fn
			    		window[ccarr[0]][ccarr[1]](ev);
			    	} else if (cclen == 3) {
			    		// ns.ns.fn
			    		window[ccarr[0]][ccarr[1]][ccarr[2]](ev);
			    	}
			    	
			    	} catch (e) {
			    		debug.log(ev.click_callback + " method cannot be found");
			    	}
			
		  // no custom callback ÑÊjust regular old modal
			} else {
	      		me.eventModal(eid);
			}
			
		} // end if/else for authoring
	  
	})	
	.delegate(".timeglider-timeline-event", "mouseover", function () { 

		var ev = MED.eventCollection.get($(this).attr("id")).attributes;
		me.eventHover($(this), ev)
	})
	.delegate(".timeglider-timeline-event", "mouseout", function () { 

		var ev = MED.eventCollection.get($(this).attr("id")).attributes;
		me.eventUnHover($(this), ev)
	})
	.delegate(".timeglider-event-collapsed", "hover", function () { 

		var title = MED.eventCollection.get($(this).attr("id")).attributes.title;
		// debug.trace("collapsed, title:" + title, "note");
		 
	});
	// END TICKS CHAIN!!
	
	
	// TODO: make function displayCenterline()
	// TODO: simply append a centerline template rather than .css'ing it!
	me.setCenterline();
	
	
	/* PUB-SUB "LISTENERS" SUBSCRIBERS */
 
	$.subscribe(container_name + ".mediator.ticksOffsetChange", function () {
		
		
		me.tickHangies();
		// TOO MUCH! CRASHES Firefox
		me.registerDragging();
		me.registerTitles();
		
	});
	
	$.subscribe(container_name + ".mediator.focusToEvent", function () {
		// mediator takes care of focusing date
		var ev = MED.focusedEvent;
	});


	$.subscribe(container_name + ".mediator.zoomLevelChange", function () {
		
		me.tickNum = 0;
		me.leftside = 0;
		
		var zl = MED.getZoomLevel();
		
		// if the slider isn't already at the given value change in
		$(me._views.SLIDER).slider("value", me.invSliderVal(zl));
		
		me.displayZoomLevel(zl);
    
		me.castTicks("zoomLevelChange");
		
	});
	
	
	$.subscribe(container_name + ".viewer.rendered", function () {
		// do things necessary after view has been
		// if you want to hide either titles or icons:
		// $(".timeglider-event-icon").hide();
		// $(".timeglider-event-title").hide();
	});

	
	
	/// This happens on a TOTAL REFRESH of 
	/// ticks, as when zooming; panning will load
	/// events of active timelines per tick	
	$.subscribe(container_name + ".mediator.ticksReadySignal", function (b) {
		if (MED.ticksReady === true) {
			me.freshTimelines();
		} 
	});
	
	
	/*
    	Renews the timeline at current focus/zoom, but with
    	possibly different timeline/legend/etc parameters
    	! The only view method that responds directly to a model refresh()
	*/
	$.subscribe(container_name + ".mediator.refreshSignal", function () {
	  
  		me.tickNum = 0;
  		me.leftside = 0;
  	
		me.castTicks("refreshSignal");
	});


	// adding to or removing from ticksArray
	// DORMANT: necessary?
	$.subscribe(container_name + ".mediator.ticksArrayChange", function () {
		// empty for now		
	});
	
	
	
	$.subscribe(container_name + ".mediator.scopeChange", function() {
		
		var scope = MED.getScope();
		var tbounds = scope.timelineBounds;
		var focus = scope.focusDateSec;
		
		if (focus > tbounds.last) {
			// past right end of timeline(s): stop leftward drag
			me.dragScopeState = {state:"over-right"};
		} else if (focus < tbounds.first) {
						// over left end of timeline(s): stop rightward drag
			me.dragScopeState = {state:"over-left"};
		} else {
		
			me.dragScopeState = {state:"okay"};

		}
		
	});
	
	
	
	// listen for focus date change
	// mainly if date is zipped-to rather than dragged
	$.subscribe(container_name + ".mediator.focusDateChange", function () {
		this.displayFocusDate();
	});
	
	
	// CREATE TIMELINES MENU
	$.subscribe(container_name + ".mediator.timelineDataLoaded", function (arg) {
	
		$(".timeglider-loading").fadeOut(500);  
		me.buildSettingsMenu();
    	me.buildTimelineMenu();
    	
	});
	

	$.subscribe(container_name + ".mediator.activeTimelinesChange", function () {
		
		$(me._views.TIMELINE_MENU_UL + " li").each(function () {
			
				var id = $(this).data("timeline_id");
			    if (_.indexOf(MED.activeTimelines, id) != -1) {
					$(this).addClass("activeTimeline");
				} else { 
					$(this).removeClass("activeTimeline");	
				}	
        }); // end each	
	});
	
	
	$.subscribe(container_name + ".mediator.filterChange", function () {
    	// refresh is done inside MED -- no need to refresh here
	});
	/* END PUB-SUB SUBSCRIBERS */



	/// TESTING /////
	
	//// GESTURES  ////
	/* !!TODO    Still a FAIL in iPad ---- 	   
	   PRIVATE/SCOPED IN CLOSURE, THESE ARE UN-TESTABLE
	*/
	function gestureChange (e) {
		e.preventDefault ();
		if (MED.gesturing === false) {
			MED.gesturing = true;
			MED.gestureStartZoom = MED.getZoomLevel();
		}
	    var target = e.target;
		// constant spatial converter value
		//$("#output").append("<br>start zoom:" + MED.gestureStartZoom);
		
		// This basically works, but it's funky still....
	    var g = Math.ceil(MED.gestureStartZoom / (e.scale));
		
		//$("#output").append("<br>new gest zoom:" + g);
		
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
	        $("#output").append("<br>gesture zoom:" + MED.getZoomLevel());
	    }, false);
	    
	    tgcompnt.addEventListener("gestureend", function (e) {
  	    	  e.preventDefault();
  	        $("#output").append("<br>gesture end:" + MED.getZoomLevel());
  	    }, false);
	  
	  
	  	tgcompnt.addEventListener("gesturechange", function (e) {
			e.preventDefault();
			
			gestureChange(e);
			//var gLeft = e.touches.item(0).pageX;
			//var gRight = e.touches.item(1).pageX;
			// debug.log("scale of e:" + e.scale)
			
			// var gLeft = "l", gRight = "r";
			// $("#output").append("[" + gLeft + ":" + gRight + "]");
    	        
		}, false);
	    
	} // end if ($.support.touch)

}



tg.TG_PlayerView.prototype = {


	resize: function() {
		var new_height = $(PL).height();
		$(CONTAINER).height(new_height);
		this.dimensions = this.getWidgetDimensions();
		MED.setDimensions(this.dimensions);
		this.setCenterline();
		MED.refresh();
	},
	
	
	getWidgetDimensions : function () {
			
			var c = $(CONTAINER),
				w = c.width(),
				wc = Math.floor(w / 2) + 1,
				h = c.height(),
				hc = Math.floor(h/2),
				t_height = this.tick_height,
				lft = c.position().left,
				offset = c.offset(),
				f_height = (options.show_footer == true) ? $(this._views.FOOTER).height() : 0,
				t_top = h - f_height - t_height,
				// objects to return
				container = {"width":w, "height":h, "centerx":wc, "centery":hc, "left": lft, "offset": offset},
				footer = {"height":f_height},
				tick = {"top":t_top};
			
			return {container:container, tick:tick, footer:footer}
		  
	},
	
		
	scaleToImportance : function(imp, zoo) {
		return imp / zoo;
	},
	
	
	displayZoomLevel : function() {
		
		var me=this, 
			zl = MED.getZoomLevel();
		
		if (zl > 0) {
			if (options.display_zoom_level == true) {
				$(me._views.ZOOM_DISPLAY).text(zl);
			}
    	}
 	},
 	
 	
	displayFocusDate: _.throttle(function () {
		// this is expensive for real-time dragging...
		// without throttle, leads to crashing in Firefox
		var fd = MED.getFocusDate();
		$(DATE).text(fd.format("d MMM yyyy", false));
	}, 300),
	 	
 	
	/**
	* setPanButton
	* @param $sel {jquery dom selector} the button to be assigned
	* @parm vel {Number} positive for moving to the right, negative for moving left
	*
	*
	*/
 	setPanButton : function ($sel, vel) {
 	     var me = this,
 	         _int = 33; // 33/1000 second interval
 	     $($sel).live("mousedown", function () {
    	    me.intervalMachine("pan", {type:"set", fn: me.pan, args:[vel], intvl:_int});  })
        .live("mouseup", function () {
    	    me.intervalMachine("pan", {type:"clear", fn: me.pan, callback: "resetTicksHandle"});  })
        .live("mouseout", function () {
        	me.intervalMachine("pan", {type:"clear", fn: me.pan, callback: "resetTicksHandle"});  });
  	},
  
  
 	
	/* 
	* intervalMachine
	* param name {String} JS interval ref. name
	* @param info {Object} 
	*     type: clear | set
	*     fn: function to call on interval
	*     callback: function to invoke upon clearing
	*     eg: {type:"clear", fn: me.pan, callback: "resetTicksHandle"}
	*
	*
	*  PLUGIN CANDIDATE!
	
	*/
	intervalMachine : function (name, info) {
	  var me=this;
	  if (info.type === "clear") {
	    clearInterval(intervals[name]);
	    
	    if (info.callback) {
	      me[info.callback]();
      }
      
    } else {
      // run it 
	    intervals[name] = setInterval(function () {
	          info.fn.apply(me, info.args);
	        }, info.intvl);
    }
  },


  invSliderVal : function(v) {
  	return Math.abs(v - 101);
  },
  
  
  
  /*
  * pan
  * @param dir {Number}
  * simply moves the ticks one way or another
  * To work properly, it needs a resetTicksHandle() callback;
  * Using this with intervalMachine()
  */
  pan : function (dir) {

    var d = dir || 20,
    	$t = $(TICKS),
    	newPos = $t.position().left + d;
        
    $t.css({left:newPos});
    
    MED.setTicksOffset(newPos);
    
  },
  

  registerTitles : function () {
		
		var toff, w, tw, sw, pos, titx, 
		  $elem, $env, env, $tb, $ti, relPos, tbWidth,
		  mo = $(CONTAINER).offset().left,
		  trackTB = true;
		  

		$(CONTAINER + " .timeglider-event-spanning").each(
			function() {
			    // !TODO  needs optimizing of DOM "touching"
			    var $spev = $(this);
			 	toff = $spev.offset().left - mo;
				$elem = $spev.find(".timeglider-event-title");
				tw = $elem.outerWidth();
				sw = $elem.siblings(".timeglider-event-spanner").outerWidth();
				
				// if the span is wider than the title element
				if (sw > tw) {
					// if the offset is to the left of the frame
					if (toff < 0) {
						var dif = sw-tw;
						if (Math.abs(toff) < dif) {
							$elem.css({marginLeft:(-1 * toff) + 5});
						} else {
							// keep it aligned right if the right side is poking in
							$elem.css({marginLeft:(sw - tw) - 5});
						}
					// otherwise just keep it aligned on the left side of the span
					} else {
						$elem.css({marginLeft:5});
					}
				} 
				// is offscreen == false: $(this).removeClass('timeglider-event-offscreen')
			}
		);

		// IE 7,8 not able to find the .titleBar element below
		// while this .each is happening. Performance in .find()?
		// This hack just turns off the titleBar tracking... :(
		if ($.browser.msie && parseInt($.browser.version) <9) {
			trackTB = false;
		}
		
		// if (trackTB === true) {
		$(CONTAINER + " .tg-timeline-envelope").each(
				function () {
				  // !TODO  needs optimizing of DOM "touching"
					$env = $(this);
					env = $env.offset().left - mo;
					$tb = $env.find(".titleBar");
									
					// `pos` is a pre-cached $tb.position().left;
					// rather than calculating position here, it's
					// grabbing a cached value stored in element data()
					pos = $tb.data("lef");
					
				 	relPos = -1 * (pos + env);
					
					$ti = $tb.find(".timeline-title");
					// if it's pushed left of the window
					
					
				 	if ( (relPos > 0) ) {
				 		var dif = $tb.width()-$ti.width();
				 		if (relPos < dif) {
							$ti.css({marginLeft:relPos + 5});
						} else {
							$ti.css({marginLeft:dif - 5});
						}
					}  else {
						$ti.css({marginLeft:5});
					}
				
				}
		); 
		
			
	}, // end register titles
	
	
	registerDragging : function () {
	  	/* 
			startSec --> the seconds-value of the
	    initial focus date on landing @ zoom level
		*/
		// !TODO: See if we can throttle this to be only
		// once every 100ms....
		var startSec = MED.startSec,
			tickPos = $(TICKS).position().left,
			secPerPx = MED.getZoomInfo().spp;
			
			/*
			debug.log(MED.getFocusDate().ye);
		
			debug.log("RD.startSec:", startSec);
			debug.log("RD.tickPos:", tickPos);
			debug.log("RD.secPerPx", secPerPx);
			*/
						
		var newSec = startSec - (tickPos * secPerPx);
			
			//debug.log("RD.newSec:", newSec);
		
		var newD = new TG_Date(newSec);
			
			//debug.log("RD.newD.ye", newD.ye);
			
		MED.setFocusDate(newD);
		
		// remove this???
		this.displayFocusDate();
	},
	
	
	
	/* FILTER BOX SETUP */
	setupFilter : function () {
	
		var me = this, 
			$bt = $(me._views.FILTER_BT),
			$filter = $.tmpl(me._templates.filter_modal,{}).appendTo(me._views.CONTAINER);
		
		$filter.position({
          		    my: "right bottom",
        			    at: "right top",
        			    of: $(me._views.FILTER_BT),
        			    offset: "-8, -30"
              }).css("z-index", me.ztop++).hide();
        
        
        
           
        $(CONTAINER)
	    .delegate(".timeglider-filter-box .close-button", "click", function () {
			$filter.fadeOut();
		})              
              
      
		$(me._views.FILTER_BT).bind("click", function() { 
		
			$filter.fadeIn();

  	      	var $bt = $(this), fbox = me._views.FILTER_BOX;

			// If it's never been opened, apply actions to the buttons, etc
			if (me.filterBoxActivated == false) {

				me.filterBoxActivated =true;
				
				var $filter_apply = $(fbox + " .timeglider-filter-apply"),
				$filter_close = $(".timeglider-filter-box .close-button"),
				$filter_clear = $(fbox + " .timeglider-filter-clear"),
				incl = "", excl = "";
				
				// set up listeners
				$filter_apply.bind("click", function () {
				incl = $(fbox + " .timeglider-filter-include").val();
				excl = $(fbox + " .timeglider-filter-exclude").val();
				MED.setFilters({origin:"clude", include:incl, exclude:excl});
				$(fbox).toggleClass("timeglider-display-block");
				});
				
				$filter_close.bind("click", function () {
				$(fbox).toggleClass("timeglider-display-none");
				});
				
				$filter_clear.bind("click", function () {
				MED.setFilters({origin:"clude", include:'', exclude:''});
				$(fbox + " .timeglider-filter-include").val('');
				$(fbox + " .timeglider-filter-exclude").val('');
				$(fbox).toggleClass("timeglider-display-block");
				});
              
			} // end if filterBoxActivated

        }); // end FILTER_BT click
        
        



 	}, // end setupFilter
  

	
	  
	buildTimelineMenu : function () {

		var me=this;
		var $menu;
		var $menu_bt = $(me._views.TIMELINE_LIST_BT);
	
		
		if ($(me._views.TIMELINE_MENU)[0]) {
			$(me._views.TIMELINE_MENU).remove()
		}	
		
		var $menu= $.tmpl(me._templates.timeline_list_modal,{}).appendTo(me._views.CONTAINER);					
		// each timeline's <li> item in menu
		var menuItem = Backbone.View.extend({
		
			initialize: function (){
				this.model.bind('change', this.render, this);
			},
			
			tagName: "li",
			className: "timeglider-timeline-list-item",
			template: "${title}",
			
			events: {
				"click": "toggleTimeline"
			},
			
			toggleTimeline : function() {
				MED.toggleTimeline(this.model.get("id"));
			},
			
			render: function() {
				var tid = this.model.get("id");
				$(this.el).html($.tmpl(this.template, this.model.attributes)).data("timeline_id", tid)
				return this;
			}
	
		});
		
			
		$(me._views.TIMELINE_MENU_UL).html("");
	       
	    _.each(MED.timelineCollection.models, function(model){
	
	    	$(me._views.TIMELINE_MENU_UL).append(new menuItem({model:model}).render().el);			
	    });
	   		
		

	    $menu.position({
	        		my: "right bottom",
	      			at: "right top",
	      			of: $(me._views.TIMELINE_LIST_BT),
	      			offset: "-8, -30"
	    }).hide();
	    
	    
	    $(CONTAINER)
	    .delegate(".timeglider-timeline-menu .close-button", "click", function () {
			$menu.fadeOut();
		})
		.delegate(this._views.TIMELINE_LIST_BT, "click", function() {
  			$menu.fadeIn();
  		})
	    

	},
	
	
	
	getTimezonePulldown: function(id, sel){
		
		var html = "<select name='timezone' id='" + id + "'>",
			seld = false, selstr = "selected";
		
		$.map(TG_Date.timezones, function(tz){ 
		
			if (sel == tz.offset && seld == false) {
				selstr = "selected";
				seld = true;
				
			} else {
				selstr = "";
			}
			
			html += "<option value='" + tz.offset + "' " + selstr + ">" + tz.name + "</option>";
				
		});
		
		html += "</select>";
		return html;
		
	},
	
	
	
	
	buildSettingsMenu: function () {
			
		var me = this;
		
		var $s = $.tmpl(me._templates.settings_modal,{}).appendTo(me._views.CONTAINER);
	
		var tz_menu = this.getTimezonePulldown("timeglider-settings-timezone", MED.timeOffset.string);
		
		$s.find(".timeglider-settings-timezone")
			.append('<p>Make changes below, then click on "save". More settings options to come!</p>')
			.append('<span class="settings-label">timezone:</span> ' + tz_menu)
			.append("<p style='clear:both'>&nbsp;</p><div class='btn success' id='timeglider-settings-save'>save</div>");
			

		$s.position({
	        		my: "right bottom",
	      			at: "right top",
	      			of: $(me._views.SETTINGS_BT),
	      			offset: "-8, -30"
	    }).hide();
	    
	    
	    $(CONTAINER)
	    .delegate(".timeglider-settings-modal .close-button", "click", function () {
			$s.fadeOut();
		})
		.delegate(this._views.SETTINGS_BT, "click", function() {
  			$s.fadeIn();
  		})
  		.delegate("#timeglider-settings-save", "click", function() {
  			// get timezone
  			var tz_off = $(CONTAINER + " #timeglider-settings-timezone").val();
  			MED.setTimeoffset(tz_off); 			
  		});
	    
	},
	
	
  
  
	
	/* 
		Zoom slider is inverted value-wise from the normal jQuery UI slider
	  so we need to feed in and take out inverse values with invSliderVal()            
	*/
	buildSlider : function () {
		var iz = MED.getZoomLevel();
	  
		if (options.min_zoom == options.max_zoom) {
			// With a single zoom level, hide the zoom controller
			$(this._views.SLIDER_CONTAINER).css("display", "none");
  	  		
		} else {
      
			if (options.display_zoom_level == true) {
    			var $zl = $("<div>").appendTo(this._views.SLIDER_CONTAINER).addClass("timeglider-zoomlevel-display");
    		$zl.html('&nbsp;');
    		}
      
			var me = this,
				init_zoom = me.invSliderVal(iz),
      			hZoom = MED.max_zoom,
				lZoom = MED.min_zoom,
				sHeight = (1 + hZoom - lZoom) * 3;
	
		 	$(this._views.SLIDER)
				.css("height", sHeight)
				.slider({ 
					steps: 100,
					handle: $('.knob'),
					animate:300,
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
				}); // end .slider()
			
			} // end--if min_zoom == max_zoom 
	},
	
	
	/*
	* usage: timeline event hovering, modal display
	*
	*/
	
	getEventDateLine: function(ev) {
		var startDateF = "<span class='timeglider-dateline-startdate'>" + ev.startdateObj.format('', true, MED.timeOffset) + "</span>",
    		endDateF = "";
    	
    	if (ev.span == true) {
    		 endDateF = " &ndash; <span class='timeglider-dateline-enddate'>" + ev.enddateObj.format('', true, MED.timeOffset) + "</span>";
    	}
    	
    	return startDateF + endDateF;

	},


	eventHover : function ($ev, ev) {

    	var me = this, 
        	$hov = $(".timeglider-event-hover-info");
        	// using true in format() sets up display limit
        	        	
        	    
    	// This works, but what if it has to sit on the bottom?
    	if (ev.date_display != "no") {
			$hov
			.position({
				my: "left bottom",
		  	    at: "left top",
		  	    of: $ev,
		  	    offset: "1, -10",
		  	    collision: "flip flip"}
			)
		  	.html(me.getEventDateLine(ev));
		  	
    	}
	  	   
	  	$ev.addClass("tg-event-hovered");
	},
	
	
	eventUnHover : function ($ev, ev_obj) {
		$(".timeglider-event-hover-info").css("left", "-1000px");
		$ev.removeClass("tg-event-hovered");
	},
  
  
    
	clearTicks : function () {
	  this.leftside = 0;
		this.tickNum = 0;
		
		$(TICKS)
			.css("left", 0);
			// .html("<div class='timeglider-handle'></div>");
		
		// remove everything but HANDLE, which
		// needs to stay so that gesturing (pinching to zoom)
		// doesn't lose its target
		$(CONTAINER + " .tg-timeline-envelope").remove();
		$(CONTAINER + " .timeglider-tick").remove();
		
		
	},


	/* 
	  The initial drawing of a full set of ticks, starting in the 
	  middle with a single, date-focused div with type:"init", after which
	  a left-right alternating loop fills out the width of the current frame
	*/
	castTicks : function (orig) {
	  	  	
	  this.clearTicks();
    
		var zLevel = MED.getZoomLevel(),
			fDate = MED.getFocusDate(),
			tickWidth = MED.getZoomInfo().width,
			twTotal = 0,
			ctr = this.dimensions.container.centerx,
			// determine how many are necessary to fill (overfill) container
			nTicks = Math.ceil(this.dimensions.container.width / tickWidth) + 4,
			leftright = 'l';

		MED.setTicksReady(false);
    
		// INITIAL TICK added  in center according to focus date provided
		
		this.addTick({"type":"init", "focus_date":fDate});
		
		// ALTERNATING L & R ticks
		for (var i=1; i<=nTicks; i +=1) {
			this.addTick({"type":leftright});
			// switch l and r for alternating layout action
			leftright = (leftright == "l") ? "r" : "l";
		}
		
		MED.setTicksReady(true);
		
		this.displayFocusDate();
	},
  
  
	
	/*
	* @param info {object} --object--> 
	*                     type: init|l|r 
	*                     focusDate: date object for init type
	*/											
	addTick : function (info) {
		
		var me = this,       mDays = 0,      dist = 0,        pos = 0,       
			tperu = 0,       serial = 0,     shiftLeft = 0,   ctr = 0,  
			tid = "",        tickHtml = "",  sub_label = "",  label = {}, 
			$tickDiv = {},   tInfo = {},     pack = {},       mInfo = {},
			sub_labels = "",
			
			tickUnit = MED.getZoomInfo().unit,
			tickWidth = MED.getZoomInfo().width,
			focusDate = MED.getFocusDate(),
			tick_top = parseInt(this.dimensions.tick.top),	
			serial = MED.addToTicksArray({type:info.type, unit:tickUnit}, focusDate);
			
			
		// adjust tick-width for months (mo)
  		if (tickUnit == "mo") {
  			// starts with default tickWidth set for 28 days: How many px, days to add?
  			mInfo = TG_Date.getMonthAdj(serial, tickWidth);
  			tickWidth = mInfo.width;
  			mDays = mInfo.days;
			
  		} 

		// tickNum has been reset to zero by refresh/zoom
		this.tickNum ++;
		
		if (info.type == "init") {
			
			shiftLeft = this.tickOffsetFromDate(MED.getZoomInfo(), MED.getFocusDate(), tickWidth);
			
			pos = Math.ceil(this.dimensions.container.centerx + shiftLeft);
			$(TICKS).data("init-left", pos);
			// both and left and right sides are defined
			// here because it is the first tick on screen			
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
		  .appendTo(TICKS);
		
		$tickDiv.css({width:tickWidth, left:pos, top:tick_top});
						
		// GET TICK DIVS FOR unit AND width
		tInfo = this.getTickMarksInfo({unit:tickUnit, width:tickWidth});
		// if there's a value for month-days, us it, or use
		// tperu = (mDays > 0) ? mDays : tInfo.tperu;
		tperu = mDays || tInfo.tperu;				
			
		dist = tickWidth / tperu;

    	// Add tick-lines or times when divisions are spaced wider than 5
    
		if (dist > 5) {
		
			// As of Jan 29, 2012, no more Raphael!
			
			var c, l, xd, stk = '', sl4hd = 0,
				ht = 10, downset = 20, hr_info = {}, ampm = '',
				lpos = 0;
			
			for (l = 0; l < tperu; l++) {
			
				sub_label = "&nbsp;";
				
				if (dist > 16) {
				
					if (tickUnit == "da") {
						// hours starting with 0
						sub_label = me.getHourLabelFromHour(l, dist);
						
					} else  if (tickUnit == "mo") {
						// days starting with 1
						sub_label = l + 1;
					} else if (tickUnit == "ye") {
						if (dist > 30){
							// Jan, Feb, Mar...
							sub_label = "&nbsp;" + TG_Date.monthNamesAbbr[l+1];
						} else {
							// month abbrevs: J, F, M...
							sub_label = "&nbsp;" + TG_Date.monthNamesLet[l+1];
						}
					} else if (tickUnit == "de") {
						if (dist > 44){
							sub_label = serial + "" + l;
						}
					} else if (tickUnit == "ce") {
						if (dist > 28){
							sub_label = serial + "" + l + "0";
						}
					}
					
				}
				
				sub_labels += "<div class='timeglider-tick-sub-label' style='left:" + lpos + "px;width:" + dist + "px'>" + sub_label + "</div>";
				
				lpos += dist;
			}
					
		} // end dist > 5  if there's enough space between tickmarks
			
		// add hours gathered in loop above
		if (sub_labels) {
		  $tickDiv.append("<div style='background-color:none;height:24px;width:" + (tickWidth + 10) + "px;position:absolute;top:15px;left:0;overflow:hidden'>" + sub_labels + "</div>");
	  	} 
		
		pack = {"unit":tickUnit, "width":tickWidth, "serial":serial};
  		
		label = this.getDateLabelForTick(pack);
		
		// In order to gather whether an outlier span is 
		// occuring on drag-right (the right side of a span)
		// we need some seconds...
		
		pack.seconds = this.getTickSeconds[tickUnit](pack.serial);
		
		// DO OTHER STUFF TO THE TICK, MAKE THE LABEL AN ACTIONABLE ELEMENT
		// SHOULD APPEND WHOLE LABEL + TICKLINES HERE
		$tickDiv.children("#label").text(label);

		return pack;
		
		/* end addTick */
	}, 
	
	
	setCenterline: function () {
		var me = this;
		
		if (MED.options.show_centerline === true) {
			$(this._views.CENTERLINE).css({"height":me.dimensions.container.height, "left": me.dimensions.container.centerx});
		} else {
			$(this._views.CENTERLINE).css({"display":"none"});
		}
	},
	
	/* 
	 * @param pack {Object} `unit` and `serial`
	 */
	getTickSeconds: {
		da: function(ser) {
			var s = ser * 86400,
				e = s + 86400;
			return {start:s, end:e}; 
		},
		mo: function(ser) {
			var s = ser * 2629800,
				e = s + 2629800;
			return {start:s, end:e}; 
		},
		ye: function(ser) {
			var s = ser * 31540000,
				e = s + 31540000;
			return {start:s, end:e}; 
		}, 
		de: function(ser) {
			var s = ser * 315400000,
				e = s + 315400000;
			return {start:s, end:e};
		},
		ce: function(ser) {
			var s = ser * 3154000000,
				e = s + 3154000000;
			return {start:s, end:e};
		},
		thou: function(ser) {
			var s = ser * 3154000000,
				e = s + 3154000000;
			return {start:s, end:e};
		},
		tenthou: function(ser) {
			var s = ser * 3154000000,
				e = s + 3154000000;
			return {start:s, end:e};
		},
		hundredthou: function(ser) {
			var s = ser * 3154000000,
				e = s + 3154000000;
			return {start:s, end:e};
		},
		mill: function(ser) {
			var s = ser * 3154000000,
				e = s + 3154000000;
			return {start:s, end:e};
		},
		tenmill: function(ser) {
			var s = ser * 3154000000,
				e = s + 3154000000;
			return {start:s, end:e};
		},
		hundredmill: function(ser) {
			var s = ser * 3154000000,
				e = s + 3154000000;
			return {start:s, end:e};
		},
		bill: function(ser) {
			var s = ser * 3154000000,
				e = s + 3154000000;
			return {start:s, end:e};
		}
		
	},
	
	
	getHourLabelFromHour : function (h24, width) {
		
		var ampm = "", htxt = h24, bagels = "", sublabel = "", sl4hd = 0;

		if (width < 16) {
			// no room for anything; will just be ticks
			return '';
		} else {
			
			if (h24 > 12) {
				htxt = h24-12;
			} else if (h24 == 0) {
				htxt = 12;
			} 	
						
			if (width > 30) { 
				ampm = (h24 > 11) ? " pm" : " am";
			} 
			
			if (width > 200) {
				sl4hd = width/4 - 4;
				
				return "<div class='minutes' style='width:" + sl4hd + "px'>" + htxt + ":00 " + ampm + "</div>"
				+ "<div class='minutes' style='width:" + sl4hd + "px'>" + htxt + ":15 " + ampm + "</div>"
				+ "<div class='minutes' style='width:" + sl4hd + "px'>" + htxt + ":30 " + ampm + "</div>"
				+ "<div class='minutes' style='width:" + sl4hd + "px'>" + htxt + ":45 " + ampm + "</div>";
				
			} else {
				bagels = (width > 60) ? ":00" : "";
				return htxt + bagels + ampm;
			}
		}

	},

	
	/* provides addTick() info for marks and for adj width for month or year */
	getTickMarksInfo : function (obj) {
		var tperu;
		switch (obj.unit) {
			case "da": 
				tperu = 24; 
				break;
			case "mo": 
			  // this is adjusted for different months later
				tperu = 30; 
				break;
			case "ye": 
				tperu = 12; 
				break;
			default: tperu = 10; 
		}
	
		return {"tperu":tperu};
	},
	
	/*
	*  getDateLabelForTick
	*  determines label for date unit in "ruler"
	*  @param obj {object} carries these values:
	                       {"unit":tickUnit, "width":tickWidth, "serial":serial}
	*
	*/
	getDateLabelForTick : function  (obj) {
	
		var i, me=this, ser = obj.serial, tw = obj.width;
	
		switch(obj.unit) {

			case "bill":
				if (ser == 0) {
					return "1";
				} else if (ser > 0) {
					return (ser) + " billion";
				} else {
					return (ser) + " b.y. bce";
				}
			break;
	      
	      
			case "hundredmill":
				if (ser == 0) {
					return "1";
				} else if (ser > 0) {
					return (ser) + "00 million";
				} else {
					return (ser) + "00 m.y. bce";
				}
			break;
	      
	      
			case "tenmill":
				if (ser == 0) {
					return "1";
				} else if (ser > 0) {
					return (ser) + "0 million";
				} else {
					return (ser) + "0 m.y. bce";
				}
			break;
	      
	          
			case "mill":
				if (ser == 0) {
					return "1";
				} else if (ser > 0) {
					return (ser) + " million";
				} else {
					return (ser) + " m.y. bce";
				}
			break;
	      	
	      		    
			case "hundredthou":
				if (ser == 0) {
					return "1";
				} else if (ser > 0) {
					return (ser) + "00,000";
				} else {
					return (ser) + "00,000 bce";
				}
			break;
			
	    		    
			case "tenthou":
				if (ser == 0) {
					return "1";
				} else if (ser > 0) {
					return (ser) + "0,000";
				} else {
					return (ser) + "0,000 bce";
				}
			break;
	 
			case "thou": 
				if (ser == 0) {
					return "1" + "(" + ser + ")";
				} else if (ser > 0) {
					return (ser) + "000";
				} else {
					return (ser) + "000 bce";
				}
			break;
	
			case "ce": 
				if (ser == 0) {
					return "1" + "(" + ser + ")";
				} else if (ser > 0) {
					return (ser) + "00";
				} else {
					return (ser) + "00 bce";
				}
			break;
	        
	 	   		    
			case "de": 
				if (ser > 120){
					return (ser * 10) + "s";
				} else {
					return (ser * 10);
				}
			break;
			
			case "ye": 
				return ser; 
			break;
			
			case "mo": 
			  
				i = TG_Date.getDateFromMonthNum(ser);
				
				if (tw < 120) {
					return TG_Date.monthNamesAbbr[i.mo] + " " + i.ye; 
				} else {
					return TG_Date.monthNames[i.mo] + ", " + i.ye; 
				}
			break;
				
				
			case "da": 
			
				// COSTLY: test performance here on dragging
				i = new TG_Date(TG_Date.getDateFromRD(ser));
				
				if (tw < 120) {
					return TG_Date.monthNamesAbbr[i.mo] + " " + i.da + ", " + i.ye;
				} else {
					return TG_Date.monthNames[i.mo] + " " + i.da + ", " + i.ye;
				}
			break;
		
			default: return obj.unit + ":" + ser + ":" + tw;
		}
		
	},

    /*
     *	tickHangies
     *  When dragging the interface, we detect when to add a new
     *  tick on left or right side: whether the outer tick has
     *  come within a 100px margin of the left or right of the frame
     *
     */
	tickHangies : function () {
		var tPos = $(TICKS).position().left,
		    lHangie = this.leftside + tPos,
		    rHangie = this.rightside + tPos - this.dimensions.container.width,
		    tickPack, added = false,
		    me = this;
		
		if (lHangie > -100) {
			tickPack = this.addTick({"type":"l"});
			me.appendTimelines(tickPack, "left");
		} else if (rHangie < 100) {
			tickPack = this.addTick({"type":"r"});
			me.appendTimelines(tickPack, "right");
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
			  
				var mdn = TG_Date.getMonthDays(fdate.mo, fdate.ye);
			   
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
				prop = ((fdate.ye % 1000) / 1000); 
				p = w * prop;
				break;

			case "tenthou":  
			
				prop = ((fdate.ye % 10000) / 10000); 
				p = w * prop;
				break;

			case "hundredthou": 
			
				prop = ((fdate.ye % 100000) / 100000);
				debug.log("hundredthou prop:", prop);
				p = w * prop;
				debug.log("hundredthou p:", p);
				break;
				
			case "mill": 
			
				prop = ((fdate.ye % 1000000) / 1000000);
				p = w * prop;
				break;
				
			case "tenmill": 
			
				prop = ((fdate.ye % 10000000) / 10000000);
				p = w * prop;
				break;
				
			case "hundredmill": 
			
				prop = ((fdate.ye % 100000000) / 10000000);
				p = w * prop;
				break;
				
			case "bill": 
			
				prop = ((fdate.ye % 1000000000) / 1000000000);
				p = w * prop;
				break;

			default: p=0;

		}

		return -1 * p;
	},
	
	
  	resetTicksHandle : function () {
		$(this._views.HANDLE).offset({"left":$(CONTAINER).offset().left});
	},
	

	easeOutTicks : function() {
			
			if (Math.abs(ticksSpeed) > 5) {
				// This works, but isn't great:offset fails to register
				// for new tim as it ends animation...
				
				$(TICKS).animate({left: '+=' + (3 * ticksSpeed)}, 1000, "easeOutQuad", function() {
					debug.trace("stopping easing", "note")
				});
			}
		
	},
	


	/*
	@param    obj with { tick  |  timeline }
	@return   array of event ids 
	This is per-timeline...
	*/
	getTimelineEventsByTick : function (obj) {
	  	 	  	 
		var unit = obj.tick.unit,
			serial = obj.tick.serial,
			hash = MED.eventCollection.getTimelineHash(obj.timeline.timeline_id);
				
			if (hash[unit][serial] && hash[unit][serial].length > 0) {
				// looking for an array of events...
				return hash[unit][serial];
			} else {
				return [];
			}

	},
	
	
	passesFilters : function (ev, zoomLevel) {
		var ret = true,
			ev_icon = "",
			ei = "", ea = [], e,
			ii = "", ia = [], i;
		
		// MASTER FILTER BY THRESHOLD
		if  ((zoomLevel < ev.low_threshold) || (zoomLevel > ev.high_threshold)) {
			return false;
		}
		
		var incl = MED.filters.include;
		
		// KEYWORDS FOR SHOWING THIS EVENT
		if (incl) {
			ia = incl.split(",");
			ret = false;
			// cycle through comma separated include keywords
			for (i=0; i<ia.length; i++) {
				ii = new RegExp($.trim(ia[i]), "i");
				if (ev.title.match(ii) || ev.description.match(ii)) { ret = true; }
			}
		}
		
		// KEYWORDS THAT TRIGGER HIDING
		var excl = MED.filters.exclude;
		
		if (excl) {
			ea = excl.split(",");
			for (e=0; e<ea.length; e++) {
				ei = new RegExp($.trim(ea[e]), "i");
				if (ev.title.match(ei) || ev.description.match(ei)) { ret = false; }
			}
		}
		
		// LEGEND FILTER
		if (MED.filters.legend.length > 0) {
			ev_icon = ev.icon;
			if (_.indexOf(MED.filters.legend, ev_icon) == -1) {
				// if it's not in the legend list
				ret = false;
			}
		}
		
		// TAGS FILTER
		
		if (MED.filters.tags.length > 0) {
			if (ev.tags) {
				ev_tags = ev.tags.split(",");
				_.each(ev_tags, function(tag) {
					tag = $.trim(tag);
					if (_.indexOf(MED.filters.tags, tag) !== -1) {
						ret = true;
					}
				});
			} else {
				// event has no tags at all..
				ret = false;
			}
		}
		
		/////////////
		
		return ret;
	},
  
  
	
	/*
	ADDING EVENTS ON INITIAL SWEEP!
	invoked upon a fresh sweep of entire container, having added a set of ticks
		--- occurs on expand/collapse
		--- ticks are created afresh
	*/
	freshTimelines : function () {

		var me = this,
			t, i, tl, tlView, tlModel, tu, ts, tick, tE, tl_ht, t_f, t_l,
			active = MED.activeTimelines,
			ticks = MED.ticksArray,
			borg = '',
			$title, $ev, $tl,
			evid, ev,
			stuff = '', 
			cx = me.dimensions.container.centerx,
			cw = me.dimensions.container.width,
			foSec = MED.getFocusDate().sec,
			zi = MED.getZoomInfo(),
			spp = zi.spp,
			zl = zi.level,
			tickUnit = zi.unit,
			tArr = [],
			idArr = [],
			// left and right scope
			half = Math.floor(spp * (cw/2)),
			lsec = foSec - half,
			rsec = foSec + half,
			tz_offset = 0, tbwidth = 0,
			spanin,
			legend_label = "",
			spanins = [],
			expCol, tl_top=0,
			cht = me.dimensions.container.height,
			ceiling = 0;
			
	
		/////////////////////////////////////////
		
		/* 
		var testDate = MED.getFocusDate();
		
		var tdFocus = Math.floor(testDate.sec);
		
		var tickSec = me.getTickSeconds['da'](testDate.rd);
		debug.log("testDate gts obj:", tdFocus - tickSec.start);
		*/
		
		//////////////////////////////////////////
		
		
		for (var a=0; a<active.length; a++) {
			
			idArr = [];
			
			// FOR EACH _ACTIVE_ TIMELINE...
			tlModel = MED.timelineCollection.get(active[a]);

			tl = tlModel.attributes;
			tl.visibleEvents = [];
						
			expCol = tl.display;
			
			// TODO establish the 120 below in some kind of constant!
			// meanwhile: tl_top is the starting height of a loaded timeline 
			tl_top = (tl.top) ? parseInt(tl.top.replace("px", "")) : (cht-me.initTimelineVOffset); 
							
			tlView = new tg.TG_TimelineView({model:tlModel});
			
			tz_offset = MED.timeOffset.seconds / spp;
						
      		$tl = $(tlView.render().el).appendTo(TICKS);
   			
   			// this is the individual (named) timeline, not the entire interface
   			$tl.draggable({
					axis:"y",
					handle:".titleBar", 
					stop: function () {
						
						var ntop = $(this).css("top");
						var tid = $(this).attr("id");
						
						// if we've dragged the timeline up or down
						// reset its .top value and refresh, mainly
						// to reset ceiling (+/visible) properties
						MED.timelineCollection.get(tid).set({top:ntop}); // .attributes;
					
						MED.refresh();	
					}
				})
				.css({"top":tl_top, "left": tz_offset});

			$title = $tl.find(".titleBar");
			
			if (typeof tl.bounds != "undefined") {
				t_f = cx + ((tl.bounds.first - foSec) / spp);
				t_l = cx + ((tl.bounds.last - foSec) / spp);
			} else {
				// if no events, we have to make this up
				t_f = cx;
				t_l = cx + 300;
			}
			
			// debug.log("bounds", tl.bounds.first, tl.bounds.last);
			tbwidth = Math.floor(t_l - t_f);
						
			var tmax = 1000000;
			var farl = -1 * (tmax - 2000);
			
			// browsers have a maximum width for divs before
			// they konk out... if we get to a high point, we
			// can truncate the div, but have to make sure to
			// equally adjust the left position if the right
			// end of the div is needing to be placed in-screen
			// whew.
			if (tbwidth > tmax) {
				var dif = tbwidth - tmax;
				tbwidth = tmax;
				if (t_f < farl) {
					t_f = t_f + dif;
				}
			} 
			

			$title.css({"top":tl_ht, "left":t_f, "width":tbwidth}).data({"lef":t_f, "wid":tbwidth});

			/// for initial sweep display, setup fresh borg for organizing events
			if (expCol == "expanded") { tl.borg = borg = new timeglider.TG_Org(); }
 
			//cycle through ticks for hashed events
			for (var tx=0; tx<ticks.length; tx++) {
				tArr = this.getTimelineEventsByTick({tick:ticks[tx], timeline:tl});
		    	idArr = _.union(idArr, tArr);	
			}
						
			tl.visibleEvents = idArr;
			
			// detect if there are boundless spans (bridging, no start/end points)
		
			_.each(tl.spans, function (spanin) {
				
				if (_.indexOf(idArr, spanin.id) === -1) {
										
					if ((spanin.start < lsec && spanin.end > rsec) 
					 || (spanin.end < rsec && spanin.end > lsec)) {
	
					      // adds to beginning to prioritize
					      idArr.unshift(spanin.id);
					      tl.visibleEvents.push(spanin.id);
				      	
				    }
				    
			    }
			    
			});
			
			
			// clean out dupes with _.uniq
			stuff = this.compileTickEventsAsHtml(tl, _.uniq(idArr), 0, "sweep", tickUnit);
			
			// TODO: make 56 below part of layout constants collection
			if (options.event_overflow == "scroll") {
				ceiling = 0;
			} else {
				ceiling = (tl.hasImagesAbove) ? tl_top - me.imageLaneHeight : tl_top;
			}
			
			// var beforeStuff = +new Date();
			
			if (expCol == "expanded") {
				stuff = borg.getHTML("sweep", ceiling);
				tl.borg = borg.getBorg();
			} 
			
			if (stuff != "undefined") { $tl.append(stuff.html); }
			
			// var afterStuff = +new Date();	
			setTimeout( function() {
				me.registerEventImages($tl);
			}, 3);
			
		}// end for each timeline
		
		// initial title shift since it's not on-drag
		me.registerTitles();
		
		
		setTimeout(function () { me.applyFilterActions(); }, 300);
		
		
		$.publish("viewer.rendered"); 
		
	}, // ends freshTimelines()

  
  
	/*
	* appendTimelines
	* @param tick {Object} contains serial, time-unit, and more info
	*/
	appendTimelines : function (tick, side) {
      		
			var active = MED.activeTimelines, 
				idArr = [],
			    $tl, tl, tl_top, 
			    stuff = "", diff = 0,
			    me = this;
			
			// !PROCESS: EXTRASPANS
			// debug.log("ADD A TICK", tick.serial);
			// FOR EACH TIMELINE...
			for (var a=0; a<active.length; a++) {
				
				tl = MED.timelineCollection.get(active[a]).attributes;
        		
				// get the events from timeline model hash
				idArr = this.getTimelineEventsByTick({tick:tick, timeline:tl});
				
				tl.visibleEvents = _.union(tl.visibleEvents, idArr);
				
				// debug.log("visible events:", me.visibleEvents);
				// we need to see if the right end of a long span
				// is present in the newly added tick
				if (side == "left") {
					
					_.each(tl.spans, function (spanin) {
						
						//var diff = tick.seconds.start - spanin.end;
						if (spanin.end < tick.seconds.end && spanin.end > tick.seconds.start) {
							
							
						    //not already in array
						    if (_.indexOf(tl.visibleEvents, spanin.id) === -1) {
						      	// add to beginning to prioritize
						      	idArr.unshift(spanin.id);
						      	tl.visibleEvents.push(spanin.id);
					      	}
					    }
			    
					});
			
				}	
				
				// this either puts it into the timeline's borg object
				// or, if compressed, creates HTML for compressed version.
				// stuff here would be null if expanded...
				stuff = this.compileTickEventsAsHtml(tl, idArr, tick.serial, "append", tick.unit);
				
				// borg it if it's expanded.
				if (tl.display == "expanded"){ 
					// tl.top is the ceiling
					stuff = tl.borg.getHTML(tick.serial, tl.top); 
				}
			
				var $vu = $(CONTAINER + " .tg-timeline-envelope#" + tl.id);
				
				$vu.append(stuff.html);
				
				
				this.registerEventImages($tl);
					
		  } // end for() in active timelines
		  
		  // this needs to be delayed because the append usually 
		  // happens while dragging, which already brings the 
		  // browser to the processor limits; make timeout time
		  // below larger if things are crashing : )
		  setTimeout(function () { me.applyFilterActions(); }, 500);
		  
		  $.publish("viewer.rendered"); 
				
	}, // end appendTimelines()
	
	
	
	
  
  // events array, MED, tl, borg, 
  // "sweep" vs tick.serial  (or fresh/append)
  compileTickEventsAsHtml : function (tl, idArr, tick_serial, btype, tickUnit) {
   
		var me=this,
			posx = 0,
			cx = this.dimensions.container.centerx,
			expCol = tl.display,
			ht = 0,
			stuff = "",
			foSec = MED.startSec, 
			zi = MED.getZoomInfo(),
			spp = zi.spp,
			zl = zi.level,
			buffer = 16, 
			img_ht = 0, 
			img_wi = 0,
			borg = tl.borg,
			ev = {},
			impq,
			block_arg = "sweep"; // default for initial load
			
			tl.borg.clearFresh();
			
		
		var isBig = function(tu) {
			if (tu == "da" || tu == "mo" || tu == "ye" || tu == "ce" || tu == "de"){
				return false;
			} else {
				return true;
			}
		};
			    
		if (btype == "append") {
          block_arg = tick_serial;
		}
		
		for (var i=0; i<idArr.length; i++) {

		// BBONE
      	ev = MED.eventCollection.get(idArr[i]).attributes;

      	if (this.passesFilters(ev, zl) === true) {
      		
      		// the larger units (>=thou) have have an error
      		// in their placement from long calculations;
      		// we can compensate for them here...
      		var adjust = (isBig(tickUnit)) ? .99795 : 1;
      		var ev_sds = ev.startdateObj.sec * adjust;
     		      
      		posx = cx + ((ev_sds - foSec) / spp);
      		
      			
      		if (expCol == "expanded") {
				
				impq = (tl.size_importance !== false) ? this.scaleToImportance(ev.importance, zl) : 1;

      			ev.width = (ev.titleWidth * impq) + buffer;
      			ev.fontsize = this.basicFontSize * impq;
      			ev.left = posx;

				ev.spanwidth = 0;
				if (ev.span == true) {
										
					ev.spanwidth = ((ev.enddateObj.sec - ev.startdateObj.sec) / spp);
					if (ev.spanwidth > ev.width) { ev.width = ev.spanwidth + buffer; }
					
				} 
  
   				img_ht = 0;
  				
  				var font_ht = Math.ceil(ev.fontsize);
  				
				ev.height = (font_ht + 4);
      			ev.top = (ht - font_ht);
    
				if (ev.image && ev.image.display_class === "inline") {
					var img_scale = (ev.image.scale || 100) / 100;
					img_ht = (img_scale * ev.image.height) + 2;
					img_wi = (img_scale * ev.image.width) + 2;
					// !TODO 
					// THIS NEEDS TO BE REVERSABLE WITH POLARITY
					ev.shape = {
						"img_ht":img_ht, 
						"img_wi":img_wi, 
						"top": (ev.top - img_ht), 
						"bottom": ev.top - 4, 
						"left": ev.left, 
						"right":ev.left + img_wi
					};
					
				} else {
					ev.shape = null;
				}
				
            	// block_arg is either "sweep" for existing ticks
            	// or the serial number of the tick being added by dragging
      			borg.addBlock(ev, block_arg);
          
          // end expanded state
          
      	  } else if (expCol == "collapsed") {
      			stuff += "<div id='" + ev.id + 
      			"' class='timeglider-event-collapsed' style='top:" + 
      			(ht-2) + "px;left:" +	posx + "px'></div>";
      	  }
        } // end if it passes filters

      }
      
      if (expCol == "collapsed") {
        return {html:stuff};
      } else {
        // if expanded, "stuff" is
        // being built into the borg
        return "";
      }

	},
	

	setImageLaneHeight: function(new_height) {
		this.imageLaneHeight = new_height;
		MED.refresh();
	},
  
	/*
	* registerEventImages
	*  Events can have classes applied to their images; these routines
	*  take care of doing non-css-driven positioning after the layout
	*  has finished placing events in the tick sphere.
	*
	*
	*/
	registerEventImages : function ($timeline) {
	  var me = this;
	  /*
	  // decommissioned for now, since images in the bar
	  // collide with the title so often
	  $(CONTAINER + " .timeglider-event-image-bar").each(
		    function () {
		      $(this).position({
		        		my: "top",
        				at: "bottom",
        				of: $timeline,
        				offset: "0, 0"
	        }).css("left", 0);
	      }
      );
      */
      
      $(CONTAINER + " .timeglider-event-image-above").each(
    		    function () {
    		    	var alti = me.imageLaneHeight,
    		    		$div = $(this),
    		    		$img = $(this).find("img"),
    		    		yoff = 12,
    		    		imax = $img.data("max_height"),
    		    		
    		    		// if the image is smaller than the tallest
    		    		// allowed image, keep height smaller
    		    		imght = (imax < alti) ?  imax: alti;
  						
  						if (imax < alti) {
  							yoff += ((alti - imax) / 2)
  						} 
					$div.css({"display":"block"})
						.position({
		        			my: "top",
	    					at: "top",
	    					of: $(CONTAINER),
	    					offset: "0, " + yoff
    	        		})
    	        		.css({left:0});
    	        
					$img.css("height", imght);
    	      }
        );
	  
	},
  


	applyFilterActions: function() {
		
		var fa = MED.filterActions,
			collection = MED.eventCollection.models,
			ev_id;
	
		if (!_.isEmpty(fa)) {
			// For performance reasons, having just
			// one filter function is probably smart : )
			_.each(fa, function (f) {
				// filter:actionFilter, fn:actionFunction
				
				_.each(collection, function (ev) {
					if (f.filter(ev)) {
						ev_id = ev.get("id");
						// it's passed the filter, so run it through
						// the action function
						f.fn($(".timeglider-timeline-event#" + ev_id));
					}
				});
				
			})
		}	
		
	},
	
  
	expandCollapseTimeline : function (id) {
		var tl = MED.timelineCollection.get(id).attributes;
		if (tl.display == "expanded") {
			tl.display = "collapsed";
		} else {
			tl.display = "expanded";
		}
		MED.refresh();
	},
  
  
    //////// MODALS 
  
  openTimelineModal : function (id) {
  
  	var me=this,
  		tl = MED.timelineCollection.get(id),
  		item = new this.timelineModal({model:tl}),
  		$modal = $(item.render().el)
  		.appendTo("body")
		.position({
			my: "left top",
			at: "left top",
			of: (me._views.CONTAINER),
			offset: "32, 32", // left, top
			collision: "fit fit"
		})
		.css("z-index", me.ztop++)
		.draggable({stack: ".timeglider-modal"})	
	  
  },
  
  
	createEventLinksMenu : function (linkage) {
		if (!linkage) return "";
		
		var html = '', l = 0, lUrl = "", lLab="";
		
		if (typeof(linkage) == "string") {
			// single url string for link: use "link"
			html = "<li><a href='" + linkage + "' target='_blank'>link</a></li>"
		} else if (typeof(linkage) == "object"){
			// array of links with labels and urls
			for (l=0; l<linkage.length; l++) {
				lUrl = linkage[l].url;
				lLab = linkage[l].label;
				html += "<li><a href='" + lUrl + "' target='_blank'>" + lLab + "</a></li>"
		  	}
		}
		return html;
	},
  
  
  
	eventModal : function (eid) {
	
		// remove if same event already has modal opened
		$(CONTAINER + " #" + eid + "_modal").remove();
		
		var me = this,
			map_view = false, 
			video_view=false, 
			map = "", map_options = {}, $modal, llar=[], mapZoom = 0,
			
			$par = $("#" + eid),
			ev = MED.eventCollection.get(eid).attributes,
			
			// modal type: first check event, then timeline-wide option
			modal_type = ev.modal_type || options.event_modal.type,

			ev_img = (ev.image && ev.image.src) ? "<img src='" + ev.image.src + "'>" : "",
			links = this.createEventLinksMenu(ev.link),
		  	
			templ_obj = { 
				title:ev.title,
				description:ev.description,
				id:eid,
				dateline: me.getEventDateLine(ev),
				links:links,
				image:ev_img
			}
			
		  	
			if (ev.video) { 
				templ_obj.video = ev.video;
				modal_type = "full";
				video_view = true;
				templ_obj.video = ev.video;
			} else if (ev.map && ev.map.latlong) {
				map_view = true;
				modal_type = "full";
			}

	    
			switch (modal_type) {
			
				case "full":
					$modal = $.tmpl(me._templates.event_modal_full,templ_obj);
		  			// full modal with scrim, etc
		  			var pad = 32;
       				$modal
    					.appendTo(CONTAINER)
  			  			.css({"z-index": me.ztop++})
  			  			.position({
      						my: "left top",
      						at: "left top",
      						of: (CONTAINER),
      						offset:"0, 0",
      						collision: "none none"
      	  			   });

      	  			if (map_view == true) {
      	  				$modal.find("#insert").append("<div id='map_modal_map'></div>");
      	  				
      	  				mapZoom = ev.map.zoom || 12;
      	  				var llarr = String(ev.map.latlong).split(",");
      	  				
      	  				var map_ll = new google.maps.LatLng(parseFloat(llarr[0]), parseFloat(llarr[1]));
						map_options = {
							zoom:mapZoom,
							center: map_ll,
							mapTypeId: google.maps.MapTypeId.ROADMAP
						}
						map = new google.maps.Map($("#map_modal_map")[0], map_options);
						
						// if there are markers provided in the map:
						
						if (ev.map.markers) {
						
							for (var i=0; i<ev.map.markers.length; i++) {
								var marker = ev.map.markers[i];
							  	var image = new google.maps.MarkerImage(marker.image,
									new google.maps.Size(24, 32),
									new google.maps.Point(0,0),
									new google.maps.Point(0, 32)); // "plant" origin is lower left
							  
							  	var loc = marker.latlong.split(",");
									
							    var llobj = new google.maps.LatLng(loc[0], loc[1]);
							
							    var marker = new google.maps.Marker({
							        position: llobj,
							        map: map,
							        icon: marker.icon,
							        title: marker.title,
							        zIndex:marker.zIndex
							    });
							}
						}
		
		
      	  			} else if (video_view == true) {
      	  				$modal.find("#insert").append("<iframe width='100%' height='300' src='" + ev.video + "'></iframe></div>");
      	  			}
      	  			
      	  			var ch = me.dimensions.container.height;
      	  			var cw = me.dimensions.container.width;
      	  			var $panel = $(CONTAINER + " .full_modal_panel");
      	  			var pw = $panel.width();
      	  			var ph = $panel.height();
      	  			
      				$panel.css({
      	    			"top":((ch - ph)/2) + "px",
    			  		"left":((cw - pw)/2) + "px"
    	  			});
    	  			
			
				break;
				
				case "video":
					$modal = $.tmpl(me._templates.event_modal_video,templ_obj);
					$modal
						.appendTo(TICKS)
						.css("z-index", me.ztop++)
						.position({
							my: "right center",
							at: "left center",
							of: $par,
							offset: "-12, -1", // left, top
							collision: "flip fit"
					})
      				.hover(function () { $(this).css("z-index", me.ztop++); });
				
				break;
			
				// Add custom modal type here
				// and position, etc accordingly
		
		  		// normal small, draggable modal
				default:
					$modal = $.tmpl(me._templates.event_modal_small,templ_obj);
					$modal
						.appendTo(TICKS)
						.css("z-index", me.ztop++)
						.position({
							my: "center top",
							at: "center top",
							of: (CONTAINER),
							offset: "0, 100", // left, top
							collision: "fit fit"
					})
      				.draggable()
      				.hover(function () { $(this).css("z-index", me.ztop++); });
      
      		} // eof switch
      		
	}, // eof eventModal
	
	
	
	legendModal : function (id) {
	  	// only one legend at a time ??
	  
	    var me=this,
	    	leg = MED.timelineCollection.get(id).attributes.legend,
	      	l=0, 
	      	icon = "", 
	      	title = "", 
	      	html = "",
	      	i_sel = "";
	    
	    for (l=0; l < leg.length; l++) {
				icon = options.icon_folder + leg[l].icon;
				title = leg[l].title;				
				html += "<li><img class='legend-icon' src='" + icon + "'><span class='legend-info'>" + title + "</span></li>";
				 
	    }
	   
	    var templ_obj = {id:id, legend_list:html};
	  	
	  	// remove existing legend
	    $(CONTAINER + " .timeglider-legend").remove();
	  		
	  	$.tmpl(me._templates.legend_modal,templ_obj)
  			.appendTo(CONTAINER)
  			.css("z-index", me.ztop++)
      		.toggleClass("timeglider-display-none")
      		.position({
      				my: "left top",
      				at: "left top",
      				of: (CONTAINER),
      				offset: "16, -4", // x, y
      				collision: "none none"
      		});
			
			i_sel = CONTAINER + " .legend-info, " + CONTAINER + " .legend-icon";
				
	  		$(i_sel).bind("mouseup", function(e) { 
	  			// if dragged, return false...
	  		    var $legend_item = $(e.target).parent();
	  		    var icon = ($legend_item.children("img").attr("src"));
	  		    $(this).parent().toggleClass("tg-legend-icon-selected");
	  		    MED.setFilters({origin:"legend", icon: icon}); 
	  		});

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


	
tg.TG_TimelineView = Backbone.View.extend({

	initialize: function (t) {
		
		var me=this;
		
		this.model.bind('change:title', function () {
			$(me.el).find(".timeline-title-span").text(me.model.get("title"));
		});
		
		this.model.bind('destroy', this.remove, this);
	},
	

    tagName:  "div",
    
    events: {
      "click .timeline-title-span" : "titleClick"
    },
    
    className: "tg-timeline-envelope",
    
	getTemplate: function() {
		var me = this;
		
		var tmpl = "<div class='titleBar'>"
				+ "<div class='timeline-title'>"
      			+ "<span class='timeline-title-span'>${title}</span>"
      			+ "<div class='tg-timeline-env-buttons'>";
      	
      	if (me.model.get("description")) {
      		tmpl += "<span class='timeline-info' data-timeline_id='${id}'>info</span>";
      	}
      	
      	if (me.model.get("hasLegend")) {
      		tmpl += "<span class='tg-timeline-legend-bt' data-timeline_id='${id}'>legend</span>";
      	}
      	
      	
      	tmpl += "<span class='expand-collapse' data-timeline_id='${id}'>exp/col</span>"; 
		
		tmpl += "</div></div></div>";
 	
		return tmpl;	
	},

    render: function() {
    	
    	var me = this;
		var id = me.model.get("id");
		var title = me.model.get("title");
		
		var _template = me.getTemplate();
 	
		$(this.el)
			.html($.tmpl(_template, this.model.attributes))
			.attr("id", this.model.get("id"));
	
      	return this;
    },


    setText: function() {
      /*
      var text = this.model.get('text');
      this.$('.todo-text').text(text);
      this.input = this.$('.todo-input');
      */
    },


    titleClick: function() {
      MED.timelineTitleClick(this.model.get("id"));
    },


    remove: function() {
      $(this.el).remove();
    }


    //clear: function() {
    //  this.model.destroy();
    //}

});



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

    // immediately invokes to create extra information in zoom tree
    //
    tg.calculateSecPerPx = function (zt) {
      	for (var z=1; z<zt.length; z++) {
    			var zl = zt[z];
    			var sec = 0;
    			switch(zl.unit) {
    				case "da": sec =          86400; break;
    				case "mo": sec =          2419200; break; // assumes only 28 days per 
    				case "ye": sec =          31536000; break;
    				case "de": sec =          315360000; break;
    				case "ce": sec =          3153600000; break;
    				case "thou": sec =        31536000000; break;
    				case "tenthou": sec =     315360000000; break;
    				case "hundredthou": sec = 3153600000000; break;
    				case "mill": sec =        31536000000000; break;
    				case "tenmill": sec =     315360000000000; break;
    				case "hundredmill": sec = 3153600000000000; break;
    				case "bill": sec =        31536000000000000; break;
    			}
    			// generate hash for seconds per pixel
    			zl.spp = Math.round(sec / parseInt(zl.width));
    			
    		}

    // call it right away to establish values
}(tg.zoomTree); // end of zoomTree
    
    
/* a div with id of "hiddenDiv" has to be pre-loaded */
tg.getStringWidth  = function (str) {
  if (str) {
		var ms = $("#timeglider-measure-span").html(str);
		return ms.width();
		}
};
    
        
String.prototype.removeWhitespace = function () {
	var rg = new RegExp( "\\n", "g" )
	return this.replace(rg, "");
}

if (debug) {
	// adding a screen display for anything needed
	debug.trace = function (stuff, goes) {
		$("#" + goes).text(stuff);
	}
}


tg.googleMapsInit = function () {
	// debug.log("initializing google maps...")
}

tg.googleMapsLoaded = false;
tg.googleMapsLoad = function () {

	
	if (tg.googleMapsLoaded == false) {
	
		var script = document.createElement('script');
	    script.type = 'text/javascript';
	    script.src = 'http://maps.googleapis.com/maps/api/js?sensor=false&' +
	        'callback=timeglider.googleMapsInit';
	    document.body.appendChild(script);
	    
	    tg.googleMapsLoaded = true;
	}
	
}



})(timeglider);
