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
		CONTAINER, TICKS, DATE, FOCUS_DATE,
		CLICKORTOUCH = $.support.touch ? "touchstart": "click";
	    
	var stripPx = function (somethingPx) {
		if (typeof somethingPx == "number") return somethingPx;
		if (!somethingPx) return false;
		return parseInt(somethingPx.replace("px", ""), 10);
	}

/*
*  timeglider.TG_TimelineView
*  This is _not_ a backbone view, though
*  other elements inside of it are.
*  
*
*/
tg.TG_TimelinePlayer = function (widget, mediator) {
    
	var me = this;
	
	// this.MED = mediator;
	
	// vars declared in closure above
	MED = mediator;
	
	options = mediator.options;
			// core identifier to "uniquify" the container
	PL = "#" + widget._id;
	
	WIDGET_ID = widget._id;
  	container_name = options.base_namespace + "#" + WIDGET_ID;

	this.gens = 0;
	
	
	this.titleBar = true;
	this.singleTitleHeight = 0;
	
	MED.setImageLaneHeight(options.image_lane_height, false, true);
	
	
	/*  references specific to the instance (rather than timeglider) so
		one can have more than one instance of the widget on a page */ 	      
	this._views = {
    		PLACE:PL,
    		CONTAINER : PL + " .timeglider-container",
    		SCRIM : PL + " .tg-scrim", 
    		DATE : PL + " .tg-footer-center",
    		FOCUS_DATE : PL + " .tg-date-display",
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

	this.dragSpeed = 0;
	this.tickNum = 0;
	this.leftside = 0;
	this.rightside = 0;
	this.ticksHandleOffset = 0;	
	this.timeoout_id = 1;
	this.sliderActive = false;
	this.ztop = 1000;
	this.filterBoxActivated = false;

 	
 	// this needs to be less than or equal to
 	// timeglider.css value for .timeglider-tick 
 	// height property
 	this.tick_height = 32;
 	
 	
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
		
		event_modal_small: "<div class='tg-modal timeglider-ev-modal ui-widget-content ${extra_class}' id='${id}_modal'>" 
      	   + "<div class='tg-close-button tg-close-button-remove'></div>" 
      	   + "<div class='dateline'>{{html dateline}}</div>"
      	   + "<h4 id='title'>${title}</h4>"
      	   + "<div class='tg-ev-modal-description jscroll'><p>{{html image}}{{html description}}</p></div>"
      	   + "<ul class='timeglider-ev-modal-links'>{{html links}}</ul>"
      	   + "</div>",
      	  
      	// For displaying an exterior page directly in the modal
      	event_modal_iframe: "<div class='tg-modal timeglider-ev-modal ui-widget-content tg-iframe-modal' id='${id}_modal'>" 
      	   + "<div class='tg-close-button tg-close-button-remove'></div>" 
      	   + "<div class='dateline'>{{html dateline}}</div>"
      	   + "<h4 id='title'>{{html title}}</h4>"
      	   + "<iframe frameborder='none' src='${link}'></iframe>"
      	   + "</div>",
	
		// generated, appended on the fly, then removed
		event_modal_full : $.template( null,
		////////
		"<div class='tg-modal tg-full_modal' id='ev_${id}_modal'>"
		+ "<div class='tg-full_modal_scrim'></div>"
		+ "<div class='tg-full_modal_panel'>"
		+ "<div class='tg-full_modal_content'>"
		+ "<div class='tg-close-button tg-full_modal_close'></div>"
		+ "<div class='dateline'>{{html dateline}}</div>"
		+ "<h4>${title}</h4>"
		+ "<div class='tg-full_modal-body'>"
		+ "{{html image}}{{html description}}"
		// + "<div id='insert'></div>"
		+ "</div>"
		+ "<div class='tg-full_modal-links'><ul>{{html links}}</ul></div>"
		// end of modal
		+ "</div>"),
			

     	// generated, appended on the fly, then removed
     	filter_modal : $.template( null,
          "<div class='tg-modal timeglider-filter-box'>"+
          "<div class='tg-close-button'></div>"+
          "<h3>search/filter</h3>"+
          "<div class='timeglider-menu-modal-content'>"+
          "<div class='timeglider-formline'>"+
          "<input placeholder='keyword(s)' type='text' class='timeglider-filter-search'></div>"+
          "<div class='tg-filter-cbs'>"+
          "<input type='checkbox' id='filter_t' checked><label for='filter_t'>title</label>"+
          "&nbsp;&nbsp;&nbsp;<input type='checkbox' id='filter_d'><label for='filter_d'>description</label>"+
          "</div>"+
          "<div class='timeglider-formline filter-tags'>"+
          "<input type='text' id='filter-tags' class='timeglider-filter-tags'>"+
          "</div>"+
          // "<div class='timeglider-formline'>hide: "+
          // "<input type='text' class='timeglider-filter-exclude'></div>"+
          "<ul class='buttons'>"+
          "<li class='timeglider-filter-apply'>go</li>"+
          "<li class='timeglider-filter-clear'>clear</li>"+
          "</ul></div>"+
           "<div class='tg-modal-corner tg-modal-corner-south'>"+
           "</div>"),
          
      	timeline_list_modal : $.template( null,
          "<div class='timeglider-menu-modal timeglider-timeline-menu'>"+
          "<div class='tg-close-button'></div>"+
          "<h3>timelines</h3>"+
          "<div class='timeglider-menu-modal-content'><ul></ul></div>"+
          "<div class='timeglider-menu-modal-point-right'>"+
          "</div>"),
          
        settings_modal : $.template( null,
          "<div class='tg-modal timeglider-settings-modal'>"+
          "<div class='tg-close-button'></div>"+
          "<h3>settings</h3>"+
          "<div class='timeglider-menu-modal-content'>"+
          "<div class='timeglider-settings-timezone'></div></div>"+
          "<div class='tg-modal-corner tg-modal-corner-south'>"+
          "</div>"),
        
      	legend_modal : $.template( null,
          "<div class='timeglider-menu-modal tg-legend tg-display-none'  id='${id}_legend'>"+
          "<div class='tg-close-button-small tg-legend-close'></div>"+
          "<div class='timeglider-menu-modal-content'><ul id='${id}'>{{html legend_list}}</ul>"+
          
          "<div class='tg-legend-all'>all</div>"+
          "</div>"+
          "</div>")

    };
    
	this.timelineInfoModal = Backbone.View.extend({
  	
  		tagName: "div",
		
		model:tg.TG_Timeline,
		
		className: 'tg-modal tg-timeline-modal ui-widget-content',
		
		events: {
			"click .tg-close": "remove",
			"click .tg-timeline-start": "timelineStart",
			"click .tg-modal-tags": "openTagsInfo"
		},
		// "tags":{"mardigras":2,"chris":2,"arizona":2,"netscape":2,"flop":1},
		template: function () {
			
			var tags1 = "", tags_intro = "", tags2 = "", thtm = [];
			
			var tl_tags = this.model.get("tags");
			// if tags
			if (_.size(tl_tags) > 0) {
				tags1 = "<li class='tg-modal-tags'></li>";
				
				_.each(tl_tags, function(val, key) {
					thtm.push(key + " (" + val + ")");	
				});
				
				tags_intro = "<p class='tags-intro'>Use the search tool (at lower right) to filter this timeline according to these tags:</p>";
				
				tags2 = "<div class='tg-modal-tags-info'>" + tags_intro + thtm.join(", ") + "</div>"
			}
			return "<h4>${title}</h4>"
			+ "<div class='tg-close tg-close-button'></div>"
			+ "<div class='tg-timeline-description jscroll'>{{html description}}</div>"
			+ "<ul>" + tags1 + "<li data-timeline_id='" + this.model.get("id") + "' class='tg-timeline-start'>start</li></ul>" + tags2
			+ "<div class='tg-modal-corner tg-modal-corner-north'></div>";
			
			},
		
		openTagsInfo: function() {
			var $ti = $(this.el).find(".tg-modal-tags-info");
			
			if (!$ti.is(":visible")) {
				$(this.el).find(".tg-modal-tags-info").slideDown();
			} else {
				$(this.el).find(".tg-modal-tags-info").slideUp();
			}
		},
		
		timelineStart: function() {
			
			MED.focusTimeline(this.model.get("id"));
			this.remove();
		},
		
		initialize: function() {
			// this.model.bind('change', this.render, this);
		},
		
		render: function() {
			$(this.el).html($.tmpl(this.template(), this.model.attributes)).attr("id", this.model.get("id") + "_timelineInfoModal");
			return this;
		},
		
		remove: function() {
			$(this.el).fadeOut();
		}
	});
	
	
	
	
	this.presInfoModal = Backbone.View.extend({
  	
  		tagName: "div",
		
		model:tg.TG_Timeline,
		
		className: 'tg-modal tg-timeline-modal tg-pres-modal ui-widget-content',
		
		events: {
			"click .tg-close": "remove",
			"click .tg-pres-start": "presStart"
		},
		
		template: function () {
			
			return "<div class='tg-timeline-description jscroll'>{{html description}}</div>"
			+ "<ul><li class='tg-close'>close</li><li class='tg-pres-start'>start</li></ul>"
			+ "<div class='tg-modal-corner tg-modal-corner-north'></div>";
			
			},
		
		presStart: function() {
			var pres = MED.presentation;
			MED.gotoDateZoom(pres.focus_date.dateStr, pres.initial_zoom);
		},

		render: function() {
			$(this.el).html($.tmpl(this.template(), this.model)).attr("id", "presInfoModal");
			return this;
		},
		
		remove: function() {
			$(this.el).fadeOut();
		}
	});
	



	


	$(CONTAINER)
		.delegate(".timeline-info-bt", CLICKORTOUCH, function () {
			var id = $(this).data("timeline_id");
			me.timelineModal(id);
		})	
		.delegate(".tg-expcol-bt", CLICKORTOUCH, function () {
			var id = $(this).data("timeline_id");
			me.expandCollapseTimeline(id);
		})
		.delegate(".tg-invert-bt", CLICKORTOUCH, function () {
			var id = $(this).data("timeline_id");
			me.invertTimeline(id);
		})
		.delegate(".tg-legend-bt", CLICKORTOUCH, function () {
			var id = $(this).data("timeline_id");
			me.legendModal(id);
		})
		.delegate(".tg-close-button-remove", CLICKORTOUCH, function () {
			$(this).parent().remove()
		})
		.delegate(".tg-full_modal_scrim, .tg-full_modal_close", CLICKORTOUCH, function () {
			$(".tg-full_modal").remove();
		})
		.delegate(".tg-event-overflow", CLICKORTOUCH, function () {
			MED.zoom(-1);
		})
		.delegate(".tg-event-overflow", "hover", function () {
			
			var evid = $(this).data("event_id");
			
			//!TODO
			// take id and focus to it, then zoom in until it's
			// visible: then highlight and fade out highlight
		})
		.delegate(".tg-legend-close", CLICKORTOUCH, function () {
			var $legend = $(CONTAINER + " .tg-legend");
			$legend.fadeOut(300, function () { $legend.remove(); });
			
			MED.setFilters({origin:"legend", icon: "all"});
		})
		.delegate(".tg-legend-all", CLICKORTOUCH, function () {
			$(CONTAINER + " .tg-legend li").each(function () {
				$(this).removeClass("tg-legend-icon-selected");
			});
		
			MED.setFilters({origin:"legend", icon: "all"});
		})
		.delegate(".tg-timeline-start", CLICKORTOUCH, function() {
			var tid = $(this).data("timeline_id");
			MED.focusTimeline(tid);
		})
		.delegate(".tg-prev", CLICKORTOUCH, function() {
			MED.gotoPreviousEvent();
		})
		.delegate(".tg-next", CLICKORTOUCH, function() {
			MED.gotoNextEvent();
		})
		.delegate(".tg-pres-start", CLICKORTOUCH, function() {
			me.startPresentation();
		})
		.delegate(".pres-info-bt", CLICKORTOUCH, function () {
			me.presentationModal();
		})	
		.delegate(".tg-pres-header h2", CLICKORTOUCH, function () {
			me.startPresentation();
			me.presentationModal();
		})	
		
		
		.css("height", $(PL).height());
		
	
	
	
	$(".tg-zoom-in").bind(CLICKORTOUCH, function() {
		MED.zoom(-1);
	});
	
	
	$(".tg-zoom-out").bind(CLICKORTOUCH, function() {
		MED.zoom(1);
	});
	
	$(".tg-title-prev-events").live("click", function() {
		MED.gotoPreviousEvent(true);
	});
		
	$(".tg-title-next-events").live("click", function() {
		MED.gotoNextEvent(true);
	});
		
		
	$(window).resize(_.throttle(function() {
		MED.resize();
	}, 700));
	
	
		
	// END CONTAINER CHAIN
	
	
	MED.base_font_size = options.base_font_size;
	
	if (options.show_footer == false) {
		$(this._views.FOOTER).css("display", "none");
	}
	
	this.dimensions = MED.dimensions = this.getWidgetDimensions();
	
	
	// distance from bottom of container (not vertically from ticks)
	// for timelines to be by default; but if a timeline has a "top" value,
	// it's position will be set according to that
 	this.initTimelineVOffset = this.dimensions.container.height - (this.dimensions.footer.height + this.dimensions.tick.height + 18);
	
	
	// INITIAL CONSTRUCTION
	this.buildSlider();
	
	this.setPanButton($(".timeglider-pan-right"),-30);
	this.setPanButton($(".timeglider-pan-left"),30);
  
	$(this._views.TRUCK)
	
		// doubleclicking will be used by authoring mode
		.bind('dblclick', function(e) {
			MED.registerUIEvent({name:"dblclick", event:e});	
		})
		
		
		.bind('mousewheel', function(event, delta) {
			
			var vec = (delta < 0) ? Math.floor(delta): Math.ceil(delta);
			var dir = -1 * vec;
			
			MED.mouseWheelChange(dir);
						
			return false;    
		}); // end TRUCK EVENTS
	
	
	function registerTicksSpeed () {
		//!TODO: for gliding
	}
	
	$(TICKS)
  	.draggable({ axis: 'x',
		
		start: function(event, ui) {
			me.eventUnHover();
		},
		
		cancel:".tg-modal",
		
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
				
				var evts = MED.timelineCollection.get(MED.activeTimelines[0]).get("events").length;
				
				// at least 2 events to constrain the timeline
				if (evts > 1) {
				
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
			}
			
			return true;
			
		},
	
		stop: function(event, ui) {
 			
			me.resetTicksHandle();
			me.registerDragging();
			me.registerTitles();
			me.registerPrevNext();
		}
		
	}) // end draggable
	.delegate(CONTAINER + " .timeglider-timeline-event", CLICKORTOUCH, function () { 

		var $ev = $(this);
		
		me.eventUnHover($ev);
		
		var eid = $ev.attr("id"); 
		var ev = MED.eventCollection.get(eid).attributes;
				
		if (timeglider.mode == "authoring") {
			// authoring will have its own handler
		
		
		// "presentation" mode or 
		// "basic" mode
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
	
			    			window[ccarr[0]][ccarr[1]][ccarr[2]](ev);
			    			
			    		}
			    	
			    	} catch (e) {
			    		debug.log(ev.click_callback + " method cannot be found", e);
			    	}
			
		  // no custom callback ÑÊjust regular old modal
			} else {
	      		me.eventModal(eid, $ev);
			}
			
		} // end if/else for authoring
	  
	})	
	
	.delegate(".timeglider-timeline-event", "mouseover", function () { 
		
		me.eventUnHover();
		var ev = MED.eventCollection.get($(this).attr("id")).attributes;
		me.eventHover($(this), ev);
	})
	.delegate(".timeglider-timeline-event", "mouseout", function () { 

		var ev = MED.eventCollection.get($(this).attr("id")).attributes;
		me.eventUnHover($(this));
	})
	
	.delegate(".tg-event-collapsed", "hover", function () { 

		// var title = MED.eventCollection.get($(this).attr("id")).attributes.title;
		// debug.trace("collapsed, title:" + title, "note");
		 
	});
	// END TICKS CHAIN!!
	
	
	// TODO: make function displayCenterline()
	// TODO: simply append a centerline template rather than .css'ing it!
	me.resizeElements();
	
	
	/* PUB-SUB "LISTENERS" SUBSCRIBERS */
 
	$.subscribe(container_name + ".mediator.ticksOffsetChange", function () {
		
		me.tickHangies();
		me.registerDragging();
		me.registerTitles();
		
	});
	
	$.subscribe(container_name + ".mediator.focusToEvent", function () {
		// mediator takes care of focusing date
		var ev = MED.focusedEvent;
	});
	
	
	$.subscribe(container_name + ".mediator.imageLaneHeightSetUi", function () {
		me.setImageLaneHandle(); 
		
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
		me.registerPrevNext();
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
		
		if (MED.scopeChanges  == 1) {
			// first scope change after initial load
			me.initiateNavigation();
		}
		
		MED.scopeChanges++;
	});
	
	
	
	// listen for focus date change
	// mainly if date is zipped-to rather than dragged
	$.subscribe(container_name + ".mediator.focusDateChange", function () {
		me.displayFocusDate();
	});
	
	
	// CREATE TIMELINES MENU
	$.subscribe(container_name + ".mediator.timelineDataLoaded", function (arg) {
		
		
		if (MED.singleTimelineID) {		
			me.setupSingleTimeline();
    	} else {
    		// We might need a "presentation" layer here
    		me.buildTimelineMenu(MED.timelineCollection);
    		
    		if (timeglider.mode == "presentation") {
    			me.setupPresentation();
    		}
    	}

		me.buildSettingsMenu();
		
		me.setupFilter();

    	$(".timeglider-loading").fadeOut(500);  
    	    	
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

	
	
	$.subscribe(container_name + ".mediator.resize", function () {
		me.resize();
	});
	
	
	
	
	
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
		var g = Math.ceil(MED.gestureStartZoom / (e.scale / 2));
	
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



tg.TG_TimelinePlayer.prototype = {


	resize: function() {
		
		var new_height = $(PL).height();
		$(CONTAINER).height(new_height);
		
		// measure stuff
		this.dimensions = this.getWidgetDimensions();
		MED.setDimensions(this.dimensions);
		
		// use measurements to resize various things
		this.resizeElements();
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
				f_height = (options.show_footer == true) ? $(this._views.FOOTER).outerHeight() : 0,
				t_top = h - f_height - t_height,
				// objects to return
				ticks_ht = h-(f_height+t_height);
				
				head_ht = $(".tg-widget-header").outerHeight();
				
							
				var container = {"width":w, "height":h, "centerx":wc, "centery":hc, "left": lft, "offset": offset},
					ticks = {"height":ticks_ht},
					tick = {"top":t_top, "height":t_height},
					header = {"height":head_ht},
					footer = {"height":f_height};
			
 				return {container:container, ticks:ticks, tick:tick, header:header, footer:footer};
		  
	},
	
	
	
	initiateNavigation: function() {
		var me = this;
		
		$(".tg-single-timeline-header .tg-timeline-start").fadeIn();
		$(".tg-single-timeline-header h2").live("click", function() {
			me.timelineModal(MED.singleTimelineID);
			MED.focusTimeline(MED.singleTimelineID);
			
		});
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

		//var sc = MED.getScope();
		//$(this._views.LEFT_DATE).text(sc.left_sec);
		//$(this._views.RIGHT_DATE).text(sc.right_sec);
				
		var str = fd.format("d MMM yyyy", true);
		
		$(this._views.FOCUS_DATE).find("span").text(str);
		
		
	
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
	
	
	registerPrevNext: function() {
	
		var scope = MED.getScope();
		
		var cw = this.dimensions.container.width,
			btw = 0;
		
		$(CONTAINER + " .tg-title-next-events").each(function () {
			$bt = $(this);
			btw = 28;
			$bt.css("left", (cw - btw) + "px");

		});
	},
	
	
	getTimelinesTagsArray: function() {

		var me=this, tl, tags = [], tags_obj;
		_.each(MED.timelineCollection.models, function(tl) {
			tags_obj = tl.get("tags");
			_.each(tags_obj, function(val,key) {
				tags.push(key);
			});
		});
		
		return tags;
	},
	
	
	
	/* FILTER BOX SETUP */
	setupFilter : function () {
	
		var me = this, 
			$bt = $(me._views.FILTER_BT),
			$filter = $.tmpl(me._templates.filter_modal,{}).appendTo(me._views.CONTAINER),
			use_title = false, 
			use_desc = false,
			fbox = me._views.FILTER_BOX;
		
		var clearFilterFront = function() {
			MED.setFilters({origin:"title_andor_desc", title:'', tags:'', description:''});	
			$(fbox + " .timeglider-filter-search").val('');
			$(fbox + " .timeglider-filter-tags").val('');
			$("#filter-tags").val("").trigger("change");
		}
		
		var clearFilters = function() {
			MED.clearFilters({"legend":false, "custom":false});
		}
		
		// get tags array from active timelines
		var activeTags = me.getTimelinesTagsArray();
		if (activeTags.length > 0) {
		
			if ($.fn.select2) {
				$("#filter-tags").select2({
					tags:activeTags,
					placeholder:"Click to select",
					allowClear:true
				});
			}
		
		} else {
			// no tags -- hide tags element
			$(".filter-tags").hide();
		}
		

		$filter.position({
		    my: "right bottom",
		    at: "right top",
		    of: $(me._views.FILTER_BT),
		    offset: "32, -16"
         }).css("z-index", me.ztop++).hide();
        
       
        $(CONTAINER)
	    .delegate(".timeglider-filter-box .tg-close-button", "click", function () {
	    	clearFilterFront();
			$filter.fadeOut();
		})              
              
      
		$(me._views.FILTER_BT).bind("click", function() { 
			
			$filter.fadeIn();

  	      	var $bt = $(this);

			// If it's never been opened, apply actions to the buttons, etc
			if (me.filterBoxActivated == false) {

				me.filterBoxActivated =true;
				
				var $filter_apply = $(fbox + " .timeglider-filter-apply"),
				$filter_clear = $(fbox + " .timeglider-filter-clear"),
				incl = "", tags = "", excl = "", title_txt = "", desc_txt = "";
				
				// set up listeners
				$filter_apply.bind("click", function () {
					
					clearFilters();
					
					tags = $("#filter-tags").val();
										
					incl = $(fbox + " .timeglider-filter-search").val();
					excl = ""; // $(fbox + " .timeglider-filter-exclude").val();
					
					use_title = $(fbox + " input#filter_t").is(":checked");
					use_desc = $(fbox + " input#filter_d").is(":checked");
					
					if ((use_title && incl) || (use_desc && incl) || tags) {
						title_txt = use_title ? incl: "";
						desc_txt = use_desc ? incl: "";
						
						if(use_title && use_desc && incl) {
							// EITHER title OR description match
							MED.setFilters({origin:"clude", include:title_txt, exclude:"", tags:tags});
						} else {
							// just title, or just description match
							MED.setFilters({origin:"title_andor_desc", title:title_txt, description:desc_txt, tags:tags});
						}
						
					} else {
						// clear
						clearFilters();
						clearFilterFront();						
					}
					
					
				});

				
				$filter_clear.bind("click", function () {
					clearFilters();
					clearFilterFront();
				});
              
			} // end if filterBoxActivated

        }); // end FILTER_BT click
        
        



 	}, // end setupFilter
  

	
	  
	buildTimelineMenu : function () {

		var me=this;
		var $menu;
		// var $menu_bt = $(me._views.TIMELINE_LIST_BT);
	
		var $menu_bt = $(me._views.FOOTER).append("<div class='timeglider-footer-button timeglider-list-bt'></div>")
		
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
	    .delegate(".timeglider-timeline-menu .tg-close-button", "click", function () {
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
			.append('<span class="settings-label">timezone:</span> ' + tz_menu + '<br><a class="btn" id="timeglider-settings-save">save</a>');
			

		$s.position({
	        		my: "right bottom",
	      			at: "right top",
	      			of: $(me._views.SETTINGS_BT),
	      			offset: "32, -16"
	    }).hide();
	    
	    $(CONTAINER)
	    .delegate(".timeglider-settings-modal .tg-close-button", "click", function () {
			$s.fadeOut();
		})
		.delegate(this._views.SETTINGS_BT, "click", function() {
  			$s.fadeIn();
  		})
  		.delegate("#timeglider-settings-save", "click", function() {
  			// get timezone
  			
  			var tz_off = $(CONTAINER + " #timeglider-settings-timezone").val();
  			MED.setTimeoffset(tz_off); 
  			
  			$(".timeglider-settings-modal").fadeOut();	
  		});
	    
	},
	
	
	
	setupSingleTimeline: function() {
	
		var me = this,
			tid = MED.singleTimelineID,
			timeline = MED.timelineCollection.get(tid);
		
		if (MED.options.display_single_timeline_info != false) {
		
			var title = "<h2>" + timeline.get("title") + "</h2>";
			
			inf = (timeline.get("description")) ? "<li id='info' class='timeline-info-bt' data-timeline_id='" + tid + "'>info</li>":"",
			
			leg = (timeline.get("hasLegend")) ? "<li id='legend' class='tg-legend-bt' data-timeline_id='" + tid + "'>legend</li>":"",
			
			tools = ""; // "<a id='tools' class='tools-bt noselect'>tools</a>",
			
			tmpl = "<div class='tg-widget-header tg-single-timeline-header'>" + title + "<ul>" + inf + leg + "<li class='tg-timeline-start' data-timeline_id='" + tid + "'>start</li></ul>" + tools + "</div>";
			

			$st = $(tmpl).appendTo(CONTAINER);
			
			me.singleTitleHeight = $st.outerHeight();
		
		} else {
		
			me.singleTitleHeight = 0;
		}
		
		
		if (timeline.get("hasImageLane")) {
			me.buildImageLane();		
		} 
		
		
		// adjusts the zoom slider away from the timeline bar at top
		$(me._views.SLIDER_CONTAINER).css("top", me.singleTitleHeight + 4);
		
    	
    	me.timelineModal(tid);
    	
    	
    	if (timeline.get("hasLegend")) {
    		setTimeout(function() {
    			me.legendModal(tid);
    		}, 500);
    	}
    	
		
	},
	
	

  	
	//////// MODALS 
	presentationModal : function () {
  		
  		var me = this;
  		
  		if (MED.presentation.description) {
  		
			var ch = me.dimensions.container.height,
				modal = new this.presInfoModal({model:MED.presentation});

			var header_ht = 28;
			
			
			$modal = $(modal.render().el)
				.appendTo($(".timeglider-container"))
				.position({
					my: "left top",
					at: "left top",
					of: $(".timeglider-container"),
					offset: "16, 39", // left, top
					collision: "fit fit"
				})
				.css({"z-index":me.ztop++, "max-height":ch-64});
			
			if ($.jScrollPane) {
				$(".jscroll").jScrollPane();
			}
			
		}

		
	},



	startPresentation: function() {
	
		var me = this,
			pres = MED.presentation;
			
		MED.gotoDateZoom(pres.focus_date.dateStr, pres.initial_zoom);
	},
	
	
	setupPresentation: function() {
	
		var me = this,
			pres = MED.presentation;
					
		var title = "<h2 class='no-select'>" + pres.title + "</h2>",

			inf = (pres.description) ? "<li id='info' class='pres-info-bt'>info</li>":"",
			
			leg = (pres.legend) ? "<li id='legend' class='tg-legend-bt'>legend</li>":"",
			
			tools = "", // "<a id='tools' class='tools-bt noselect'>tools</a>",
			
			tmpl = "<div class='tg-widget-header tg-pres-header'>" + title + "<ul>" + inf + leg + "<li class='tg-pres-start'>start</li></ul>" + tools + "</div>",
				
			$st = $(tmpl).appendTo(CONTAINER);
			// end vars
			me.getWidgetDimensions();
			
			
			me.singleTitleHeight = $st.outerHeight();
		
		
			if (pres.image_lane_height) {
				me.buildImageLane();	
			} // end if has imagelane
		
			// adjusts the zoom slider away from the timeline bar at top
			$(me._views.SLIDER_CONTAINER).css("top", me.singleTitleHeight + 4);
		
			me.startPresentation();  			
  			
			if (pres.open_modal && pres.description) {
				me.presentationModal();
			}
	},
	


	
  	buildImageLane: function() {
  	
  		var me = this,
  			$imageLane = $("<div class='tg-image-lane-pull'><div title='This is the image lane!' class='tg-image-lane-bg'></div></div>").appendTo(CONTAINER);
			
			$imageLane.draggable({

				axis:"y",
				containment: "parent",
				drag: function () {
					var $pull = $(this);
					var ypos = $pull.position().top;
					
					if (ypos > 400) {
						$pull.css("top", 400);
						return false;
					} else if (ypos < 5) {
						$pull.css("top", 5);
						return false;
					}
				},
				stop:function() { 
					MED.setImageLaneHeight($(this).position().top - me.singleTitleHeight, true, false);
				}
			});

			me.setImageLaneHandle();

  	},
  	
  	
  	
  	/*
  	 * setImageLaneHandle
  	 * gets image_lane_height from MED and sets image lane
  	 * UI remotely (not from dragging, but from timeline/pres props)
  	*/
  	setImageLaneHandle: function () {
  		
  		var me = this;
  		var newHt = parseInt(MED.image_lane_height, 10) + parseInt(me.singleTitleHeight, 10);
  		  		
  		$(".tg-image-lane-pull").css("top", newHt + "px");
  	},
  
	
	
	/* 
		Zoom slider is inverted value-wise from the normal jQuery UI slider
	  so we need to feed in and take out inverse values with invSliderVal()            
	*/

	buildSlider : function () {
	
		var me = this,
			iz = MED.getZoomLevel();
	  
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
				.css({"height":sHeight})
				.slider({ 
					steps: 100,
					handle: $('.knob'),
					animate:300,
					orientation: 'vertical',
					
					// "min" here is really the _highest_ zoom value @ upside down
					min:me.invSliderVal(hZoom),
					
					// "max" actually takes (i  nverse value of) low zoom level
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
		
		if (typeof MED.options.eventHover == "function") {
			
			MED.options.eventHover($ev, ev);
		
		} else {
	    	
	    	var me = this, 
	        	$hov = $(".timeglider-event-hover-info"),
	        	title = "",
	        	date_line = "";      	

	        $ev.append("<div class='tg-event-hoverline'></div>").addClass("tg-event-hovered");
	    		    	
	    	if (ev.date_display == "no") {
	    		date_line = "";
	    	} else {
	    		date_line = me.getEventDateLine(ev);
	    	}
	    	
    		if ($ev.hasClass("tg-event-collapsed") || $ev.hasClass("tg-event-overflow")) {
    			title = "<div>" + ev.title + "</div>";
    		} else {
    			title = "";
    		}
			
			if (title || date_line) {
				$hov.position({
					my: "left top",
			  	    at: "left bottom",
			  	    of: $ev,
			  	    offset: "1, 4",
			  	    collision: "flip flip"}
				)
			  	.html(title + date_line)
		  	}
		}
	},

	
	eventUnHover : function ($ev) {
		var $ev = $ev || "";
		
		if (typeof MED.options.eventUnHover == "function") {
			MED.options.eventUnHover($ev);
		} else {
			$(".timeglider-event-hover-info").css("left", "-1000px");
			$(".timeglider-timeline-event").removeClass("tg-event-hovered");
			if ($ev) {
				$ev.find(".tg-event-hoverline").remove();
			}
		}
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
			zInfo = MED.getZoomInfo(),
			tickWidth = zInfo.width,
			twTotal = 0,
			ctr = this.dimensions.container.centerx,
			// determine how many are necessary to fill (overfill) container
			nTicks = Math.ceil(this.dimensions.container.width / tickWidth) + 4,
			leftright = 'l';

		if (typeof zInfo.width == "number") {
		
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
		
		}
	},
	
	
	getTickTop: function () {

		var tttype = typeof MED.options.tick_top;

		if (tttype == "number") {
			// default number, zero for ticks at top
			return MED.options.tick_top;
		} else if (tttype == "function") {
			// could be a custom setter function
			return MED.options.tick_top(me.dimensions);
		} else {
			// at the bottom
			return parseInt(this.dimensions.tick.top);
		}

	},
  
  
	
	/*
	* @param info {object} --object--> 
	*                     type: init|l|r 
	*                     focusDate: date object for init type
	*/											
	addTick: function (info) {
		
		var me = this,       mDays = 0,      dist = 0,        pos = 0,       
			tperu = 0,       serial = 0,     shiftLeft = 0,   ctr = 0,  
			tid = "",        tickHtml = "",  sub_label = "",  label = {}, 
			$tickDiv = {},   tInfo = {},     pack = {},       mInfo = {},
			sub_labels = "", sub_labels_arr = [], oeClass = '',
			
			tickUnit = MED.getZoomInfo().unit,
			tickWidth = MED.getZoomInfo().width,
			focusDate = MED.getFocusDate(),
			tick_top = me.getTickTop(),	
			serial = MED.addToTicksArray({type:info.type, unit:tickUnit}, focusDate);
			// end vars comma list

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
		
		oeClass = (serial % 2 == 0) ? "tg-even-tick": "tg-odd-tick";

		tid = this._views.PLACE + "_" + tickUnit + "_" + serial + "-" + this.tickNum;

		$tickDiv= $("<div class='timeglider-tick " + oeClass + "' id='" + tid + "'><div class='tg-tick-body'><div class='tg-tick-leftline'></div><div class='timeglider-tick-label'></div><div class='tg-tick-label-bottom'></div></div>")
		  .appendTo(TICKS);
		
		
		$tickDiv.css({width:tickWidth, left:pos, top:tick_top, zIndex:0});
						
		// GET TICK DIVS FOR unit AND width
		tInfo = this.getTickMarksInfo({unit:tickUnit, width:tickWidth});
		// if there's a value for month-days, us it, or use
		// tperu = (mDays > 0) ? mDays : tInfo.tperu;
		tperu = mDays || tInfo.tperu;				
			
		dist = tickWidth / tperu;
		
    	// Add tick-lines or times when divisions are spaced wider than 5
    
		if (dist > 8) {
		
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
						if (dist > 54){
							sub_label = (serial *10) + l;
						}
					} else if (tickUnit == "ce") {
						if (dist > 38){
							sub_label = ((serial *10) + l) * 10;
						}
					}
					
					
				} else {
					// less than 16
					sub_label = "";
				}
				
				
				sub_labels_arr.push("<div class='timeglider-tick-sub-label " + tickUnit + "' style='left:" + lpos + "px;width:" + dist + "px'>" + sub_label + "</div>");
				
				
				
								
				lpos += dist;
			}
			
			if (serial < 0) {
				sub_labels_arr.reverse();
			}
			
			sub_labels = sub_labels_arr.join("");
					
		} else {
			sub_labels = "";
		}// end dist > 5  if there's enough space between tickmarks
			
		// add hours gathered in loop above
		if (sub_labels) {
		  $tickDiv.append("<div class='tg-tick-sublabel-group' style='width:" + (tickWidth + 10) + "px;'>" + sub_labels + "</div>");
	  	} 
		
		pack = {"unit":tickUnit, "width":tickWidth, "serial":serial};
  		
		label = this.getDateLabelForTick(pack);
		
		// In order to gather whether an outlier span is 
		// occuring on drag-right (the right side of a span)
		// we need some seconds...	
			
		pack.seconds = this.getTickSeconds[tickUnit](pack.serial);
		
		// DO OTHER STUFF TO THE TICK, MAKE THE LABEL AN ACTIONABLE ELEMENT
		// SHOULD APPEND WHOLE LABEL + TICKLINES HERE
		
		$tickDiv.find(".timeglider-tick-label").text(label);
		
		var lb_offset = (MED.options.show_footer) ? 46 : 14;
		var ht = this.dimensions.container.height - lb_offset;
		
		$tickDiv.find(".tg-tick-label-bottom").text(label).css("top", ht);
		
		return pack;
		
		/* end addTick */
	}, 
	
	
	resizeElements: function () {
		
		var me = this,
		
		// measurements have just been taken...
			cx = me.dimensions.container.centerx,
			ch = me.dimensions.container.height,
			cw = me.dimensions.container.width,
			fh = me.dimensions.footer.height,
			th = me.dimensions.tick.height,
			$C = $(this._views.CENTERLINE),
			$D = $(this._views.DATE),
			dleft = cx - ($D.width() / 2);
					
		if (MED.options.show_centerline === true) {
			$C.css({"height":ch, "left": cx});
		} else {
			$C.css({"display":"none"});
		}
				
		var ticks_ht = ch-(fh+th);
		$(this._views.TICKS).css("height", ticks_ht);
		
		
		if (ch < 500 || cw < 500 ) {
			$(".timeglider-slider").css("display", "none");
		} else {
			$(".timeglider-slider").css("display", "block");
		}
		
		$D.css({"left":dleft});

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
				e = s   + 3154000000;
			return {start:s, end:e};
		},
		hundredmill: function(ser) {
			var s = ser * 31540000000,
				e = s   + 31540000000;
			return {start:s, end:e};
		},
		bill: function(ser) {
			var s = ser * 315400000000,
				e = s   + 315400000000;
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
				p = w * prop;
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
								    
				prop = ((fdate.ye % 100000000) / 100000000);
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
			ei = "", ea = [], e, titl, desc,
			ii = "", ia = [], da = [], i;
		
		// MASTER FILTER BY THRESHOLD
		if  ((zoomLevel < ev.low_threshold) || (zoomLevel > ev.high_threshold)) {
			return false;
		}
		
		// KEYWORDS FOR SHOWING THIS EVENT
		if (MED.filters.imp_min && MED.filters.imp_min > 1) {
			if (ev.importance < MED.filters.imp_min) { return false; }
		}
		
		if (MED.filters.imp_max && MED.filters.imp_max < 100) {
			if (ev.importance > MED.filters.imp_max) { return false; }
		}	


		if (MED.filters.include) {
			// title OR description
			ret = false;
			var incl = MED.filters.include;
			ea = incl.split(",");
			for (e=0; e<ea.length; e++) {
				ei = new RegExp($.trim(ea[e]), "i");
				if (ev.title.match(ei) || ev.description.match(ei)) { ret = true; }
			}
			
		} else {
		
			// KEYWORDS FOR SHOWING THIS EVENT
			if (MED.filters.title) {
				
				titl = MED.filters.title;
				ia = titl.split(",");
				ret = false;
				// cycle through comma separated include keywords
				for (i=0; i<ia.length; i++) {
					ii = new RegExp($.trim(ia[i]), "i");
					if (ev.title.match(ii)) { ret = true; }
				}
			}	
			
			// KEYWORDS FOR SHOWING THIS EVENT
			if (MED.filters.description) {
				
				desr = MED.filters.description;
				da = desr.split(",");
				ret = false;
				// cycle through comma separated include keywords
				for (i=0; i<da.length; i++) {
					ii = new RegExp($.trim(da[i]), "i");
					if (ev.description.match(ii)) { ret = true; }
				}
			}	
			
		}
		



		if (MED.filters.exclude) {
			var excl = MED.filters.exclude;
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
				ret = false;
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
		
		// CUSTOM FILTER
		if (MED.filters.custom && typeof MED.filters.custom == "function") {
			ret = MED.filters.custom(ev);
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
			ceiling = 0,
			tl_min_bottom = MED.options.minimum_timeline_bottom,
			ticks_ht = me.dimensions.ticks.height;
			
		
		/////////////////////////////////////////
		
		/* 
		var testDate = MED.getFocusDate();
		
		var tdFocus = Math.floor(testDate.sec);
		
		var tickSec = me.getTickSeconds['da'](testDate.rd);
		debug.log("testDate gts obj:", tdFocus - tickSec.start);
		*/
		
		//////////////////////////////////////////
		$.publish(container_name + ".viewer.rendering");
		
		for (var a=0; a<active.length; a++) {
			
			idArr = [];
			
			// FOR EACH _ACTIVE_ TIMELINE...
			tlModel = MED.timelineCollection.get(active[a]);

			tl = tlModel.attributes;
		
			tl.visibleEvents = [];
						
			expCol = tl.display;
			
			// TODO establish the 120 below in some kind of constant!
			// meanwhile: tl_top is the starting height of a loaded timeline 
			tl_bottom = (tl.bottom) ? stripPx(tl.bottom) : tl_min_bottom; 	
			if (tl_bottom < tl_min_bottom) tl_bottom = tl_min_bottom;	
			
			tl_top = ticks_ht - tl_bottom;	
			
			tl_min_bottom = MED.options.minimum_timeline_bottom;
					
			tlView = new tg.TG_TimelineView({model:tlModel});
			
			tz_offset = MED.timeOffset.seconds / spp;
						
      		$tl = $(tlView.render().el).appendTo(TICKS);
   			
   			$title = $tl.find(".titleBar");
   			// this is the individual (named) timeline, not the entire interface
   			
   			
			// if a single timeline, set images to the bottom
			var tbh = $title.outerHeight();
			
			me.room = tl_top; // (cht - (Math.abs(tl_top) + tbh)) - (me.dimensions.footer.height + me.dimensions.tick.height);
			
			
   			$tl.draggable({
					axis:"y",
					handle:".titleBar", 
					
					stop: function () {
						
						
						var posi = $(this).position();
						
						// chrome doesn't allow access the new bottom
						var new_bottom = (ticks_ht - stripPx($(this).css("top"))) -1;
						
						if (new_bottom < tl_min_bottom) {
							$(this).css("bottom", tl_min_bottom);
							new_bottom = tl_min_bottom;
						}
						
						var tid = $(this).attr("id");
						
						// if we've dragged the timeline up or down
						// reset its .top value and refresh, mainly
						// to reset ceiling (+/visible) properties
						var tl = MED.timelineCollection.get(tid);
						tl.set({bottom:new_bottom});
												
						// if a single timeline, set images to the bottom
						var tbh = $title.outerHeight();
						
						me.room = me.dimensions.ticks.height - new_bottom;
			
						MED.refresh();	
					}
				})
				.css({"bottom":tl_bottom, "left": tz_offset});

			
			
			if (typeof tl.bounds != "undefined") {
				
				t_f = cx + ((tl.bounds.first - foSec) / spp);
				t_l = cx + ((tl.bounds.last - foSec) / spp);
			} else {
				// if no events, we have to make this up
				t_f = cx;
				t_l = cx + 300;
			}
			
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
 			
 			
 			var tick;
			//cycle through ticks for hashed events
			for (var tx=0; tx<ticks.length; tx++) {
				tick = ticks[tx];
				tArr = this.getTimelineEventsByTick({tick:tick, timeline:tl});
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
			
			
			// future planning for scrollable overflow
			if (options.event_overflow == "scroll") {
				
				ceiling = 10000;
				
			} else {
				
				//!TODO: does ANY timeline have an image lane??
				if (tl.inverted) {
					ceiling = tl_bottom - 16;
					
					
				} else {
					ceiling = (tl.hasImageLane || tg.mode == "authoring") ? (tl_top - MED.image_lane_height) - me.singleTitleHeight : tl_top - me.singleTitleHeight ;
				
				}
				
							
			}
			
			// var beforeStuff = +new Date();
			
			var onIZoom = (tl.initial_zoom == MED.getZoomLevel());
			
			
			if (expCol == "expanded") {
				stuff = borg.getHTML({tickScope:"sweep", ceiling:ceiling, onIZoom:onIZoom, inverted:tl.inverted});
				tl.borg = borg.getBorg();
			} 
			
			
			if (stuff != "undefined") { $tl.append(stuff.html); }
			
			
			// var afterStuff = +new Date();	
			setTimeout( function() {
				me.registerEventImages($tl);
			}, 100);
			
		}// end for each timeline
		
		// initial title shift since it's not on-drag
		me.registerTitles();
		
		
		setTimeout(function () { me.applyFilterActions(); }, 300);
		
		$.publish(container_name + ".viewer.rendered");
		
	}, // ends freshTimelines()

  
  
	/*
	* appendTimelines
	* @param tick {Object} contains serial, time-unit, and more info
	*/
	appendTimelines : function (tick, side) {
      		
			var active = MED.activeTimelines, 
				idArr = [],
			    $tl, tl, f, 
			    stuff = "", diff = 0,
			    ceiling = 0,
			    me = this;
			
			$.publish(container_name + ".viewer.rendering");
			
			for (var a=0; a<active.length; a++) {
				
				tl = MED.timelineCollection.get(active[a]).attributes;

				// get the events from timeline model hash
				idArr = this.getTimelineEventsByTick({tick:tick, timeline:tl});
				
				tl.visibleEvents = _.union(tl.visibleEvents, idArr);
				
				tl_top = (tl.top) ? stripPx(tl.top) : (me.initTimelineVOffset); 
				
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
				
				// TODO: make 56 below part of layout constants collection
				if (options.event_overflow == "scroll") {
					ceiling = 10000;
				} else {
					ceiling = (tl.hasImageLane) ? (tl_top - MED.image_lane_height) - me.singleTitleHeight : tl_top;
				}
			
		
				var onIZoom = (tl.initial_zoom == MED.getZoomLevel());
				
				// borg it if it's expanded.
				if (tl.display == "expanded"){ 
					// tl.top is the ceiling
					stuff = tl.borg.getHTML({tickScope:tick.serial, ceiling:ceiling, onIZoom:onIZoom, inverted:tl.inverted}); 
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
		  
		  $.publish(container_name + ".viewer.rendered");
				
	}, // end appendTimelines()
	
	
	
	
  
  // events array, MED, tl, borg, 
  // "sweep" vs tick.serial  (or fresh/append)
  /*
   *
   * @param btype {String} "sweep" || "append"
   *
   *
  */
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
			borg = tl.borg || "",
			ev = {},
			font_ht = 0,
			shape = {},
			colTop = 0,
			impq,
			block_arg = "sweep"; // default for initial load
			
			
		if (borg) tl.borg.clearFresh();
			
		
		var isBig = function(tu) {
			if (tu == "da" || tu == "mo" || tu == "ye" || tu == "de" || tu == "ce" || tu == "thou"){
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
				
				impq = (tl.size_importance === true || tl.size_importance === 1) ? tg.scaleToImportance(ev.importance, zl) : 1;

      			ev.width = (ev.titleWidth * impq) + buffer;
      			ev.fontsize = MED.base_font_size * impq;
      			ev.left = posx;
				ev.spanwidth = 0;
				
				if (ev.span == true) {					
					ev.spanwidth = ((ev.enddateObj.sec - ev.startdateObj.sec) / spp);
					if (ev.spanwidth > ev.width) { ev.width = ev.spanwidth + buffer; }
				} 
  
   				img_ht = 0;
  				
  				font_ht = Math.ceil(ev.fontsize);
  				
				ev.height = (font_ht + 4);
      			ev.top = (ht - font_ht);
      			ev.bottom = 0;
    			
    			
				if (ev.image && ev.image.display_class == "inline") {
					
									
					var img_scale = (ev.image.scale || 100) / 100;
					img_ht = (img_scale * ev.image.height) + 2;
					img_wi = (img_scale * ev.image.width) + 2;
					// !TODO 
					// THIS NEEDS TO BE REVERSABLE WITH POLARITY
					
					ev.shape = {
						"img_ht":img_ht, 
						"img_wi":img_wi, 
						"title": "shape",
						"top": (ev.top - (img_ht + 8)), 
						"bottom": ev.bottom, 
						"left": ev.left, 
						"right":ev.left + (img_wi + 8)
					};
					
					
				} else {
					ev.shape = "";
				}
				
								
            	// block_arg is either "sweep" for existing ticks
            	// or the serial number of the tick being added by dragging
      			borg.addBlock(ev, block_arg);
          
          // end expanded state
          
      	  } else if (expCol == "collapsed") {
      	  		if (tl.inverted) {
      	  			colTop = 4;
      	  		} else {
      	  			colTop = ht - 20;
      	  		}
      	  		
      	  		colIcon = (ev.icon) ? tg.icon_folder + ev.icon: tg.icon_folder + "shapes/circle_white.png";
      	  		
      			stuff += "<div id='" + ev.id + 
      			"' class='timeglider-timeline-event tg-event-collapsed' style='top:" + 
      			colTop + "px;left:" +	posx + "px'><img src='" + colIcon + "'></div>";
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
	
  
	/*
	*  registerEventImages
	*  Events can have classes applied to their images; these routines
	*  take care of doing non-css-driven positioning after the layout
	*  has finished placing events in the tick sphere.
	*
	*
	*/
	registerEventImages : function ($timeline) {
		var me = this,
			laneHt = MED.image_lane_height,
			padding = 4,
			laneMax = 400,
			stht = this.singleTitleHeight;

	  	if (laneHt > laneMax) { laneHt = laneMax; }
      
      
		$(CONTAINER + " .timeglider-event-image-lane").each(
		    function () {
		    			    	
		    	var $div = $(this),
		    		imgHt = laneHt - (padding/2),
		    		$img = $(this).find("img"),
		    		imax = parseInt($div.data("max_height"), 10) || laneMax;

					if (imax < imgHt) {
						imgHt = imax;
					}
				
				if (imgHt > 10) {
					$div.css({"display":"block"})
					.position({
	        			my: "top",
    					at: "top",
    					of: $(CONTAINER),
    					offset: "0, " + (stht + padding)
	        		})
	        		.css({left:0});
	        
					$img.css("height", imgHt - (padding));
				} else {
					$div.css({"display":"none"});
				}
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
	
	
	invertTimeline : function (id) {
		var tl = MED.timelineCollection.get(id).attributes;
		if (tl.inverted == false) {
			tl.inverted = true;
		} else {
			tl.inverted = false;
		}
		MED.refresh();
	},
  
  
  
    //////// MODALS 
	timelineModal : function (id) {
  		  		
		$(".tg-timeline-modal").remove();
		
		var me = this,
			tl = MED.timelineCollection.get(id);

		if (tl.get("description")) {
			
			var ch = me.dimensions.container.height,
				modal = new this.timelineInfoModal({model:tl});
			
			var hh = $(".tg-widget-header").outerHeight() + 32;
						
			$modal = $(modal.render().el)
				.appendTo("body")
				.position({
					my: "left top",
					at: "left top",
					of: $(".timeglider-container"),
					offset: "16, 39", // left, top
					collision: "fit fit"
				})
				.css({"z-index":me.ztop++, "max-height":ch-64});
			
			if (MED.singleTimelineID) {
				$modal.find("h4").hide();
			}


			
			if ($.fn.jScrollPane) {
				$(".jscroll").jScrollPane();
			}
		
		}
		
	},
	
	
	/*
	 * Generates a horizontal menu of all links
	 * in the event's link_json array
	*/  
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
  
  
  
	eventModal : function (eid, $event) {
	
		// remove if same event already has modal opened
		$(CONTAINER + " #" + eid + "_modal").remove();
		
		var me = this,
			map_view = false, 
			video_view=false, 
			map = "", map_options = {}, $modal, llar=[], mapZoom = 0,
			
			ev = MED.eventCollection.get(eid).attributes,
			
			// modal type: first check event, then timeline-wide option
			modal_type = ev.modal_type || options.event_modal.type;
						
			var ev_img = (ev.image && ev.image.src) ? "<img src='" + ev.image.src + "'>" : "",
			
			links = this.createEventLinksMenu(ev.link),
		  	
			templ_obj = { 
				title:ev.title,
				description:ev.description,
				link:ev.link,
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
				
			// if the embed size is small
			} else if ((ev.description.length > 1200) || (me.dimensions.container.width < 500)) {
				modal_type = "full";
			}
						// return false;
	    
			switch (modal_type) {
			
				case "full":
					
					$modal = $.tmpl(me._templates.event_modal_full,templ_obj);
		  			// full modal with scrim, etc
		  			var pad = 32;
		  			
       				$modal
    					.appendTo(CONTAINER)
  			  			.position({
      						my: "left top",
      						at: "left top",
      						of: (CONTAINER),
      						offset:"0, 0",
      						collision: "none none"
      	  			   });

						
      	  			var ch = me.dimensions.container.height;
      	  			var cw = me.dimensions.container.width;
      	  			var $panel = $modal.find(".tg-full_modal_panel");
     				var pw = cw - 64;
     				var ph = ch - 64;
     				var iw = 0;
     				
					
      	  			
      				$panel.css({
      					"width":pw,
      					"height":ph,
      	    			"top":"32px",
    			  		"left":"32px"
    	  			});
    	  			
    	  			var $pp = $panel.find("p")[0];
    	  			var pph = ph-120;
    	  			
    	  			
      	  			if (map_view == true) {
      	  			
      	  			
      	  				$map = $("<div id='map_modal_map' class='tg-modal_map'></div>").prependTo($pp);
      	  				
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
      	  				
      	  				// var $insert = $modal.find("p");
      	  				
      	  				
      	  				$vid = $("<div class='tg-modal-video'><iframe frameborder='0' src='" + ev.video + "'></iframe></div>").prependTo(".tg-full_modal-body");
      	  				
      	  				$vid.find("iframe").css("height", $vid.width() * .66)
      	  				
      	  				
      	  			}
      	  			
      	  		
     				
     				if (ev.image) {
     				
     					if (ev.image.width < pw/3) {
     						// small image
     						iw = ev.image.width;
     						$panel.find("p img").css("width", iw);
     					}
     					
     					
     				} 
     				
    	  			
    	  			if ($pp.height() > pph) {
    	  				$pp.css({"height":pph, "overflow-y":"scroll"});
    	  			}
    	  			
    	  			
	
					
				break;
				
			
				
				
				
				case "link-iframe":
					// show the link (i.e. Wikipedia, etc) in an iframe
					
					$modal = $.tmpl(me._templates.event_modal_iframe,templ_obj);
					$modal
						.appendTo(TICKS)
						.css("z-index", me.ztop++)
						.position({
							my: "center top",
							at: "center top",
							of: $(CONTAINER),
							offset: "0, 32", // left, top
							collision: "flip fit"
					})
      				.hover(function () { $(this).css("z-index", me.ztop++); });
      				
				
				break;
				
				
				default:
					
					// !TODO: 
					// abstract this into a common positioning function
					// for any of the small modals...
					// $event.parent()
					
					templ_obj.extra_class = (templ_obj.image) ? "has-image":"no-image";
					
					
   					$modal = $.tmpl(me._templates.event_modal_small,templ_obj).appendTo($event.parent());
					
					
					var pad = 8;
					
					var arrow_class = "", tb_class = "", lr_class = "";
					
					var ev_left = $event.position().left;
      				var ev_top = $event.position().top;
      				var ev_off = $event.offset();
      				
      				var co_ht = me.dimensions.container.height;
      				var co_off = me.dimensions.container.offset;
      				
      				var modal_ht = $modal.outerHeight();
					var modal_wi = $modal.outerWidth();
					
					var extra_top = (MED.timelineCollection.length == 1) ? 32: 0;
					
					var space_above = co_ht - (Math.abs(ev_top)) -  60;
					
					var space_below = Math.abs(ev_top);
					
					var top_set = 0;
					
					if (space_below > modal_ht) {
						// position modal below the event
						top_set = ev_top + $event.height() + 8;
						tb_class = "top";
					} else if (space_above > modal_ht) {
						// all is good: position above
						top_set = ev_top - (modal_ht + 12);
						tb_class = "bottom";
					} else {
						top_set = ev_top - (modal_ht / 2);
						tb_class = "left";
					}
					
					var ev_rel = ev_off.left - co_off.left;
					var farthest = me.dimensions.container.width - (modal_wi + pad);
					
					if (ev_rel < pad) {
						// shift to the left
						ev_left += Math.abs(ev_rel) + pad;
						lr_class = "left";
					} else if (ev_rel > farthest) {
						// it's too far off to the right
						ev_left -= (ev_rel - farthest);
						lr_class = "right";
					} else {
						lr_class = "left";
					}
					arrow_class = "arrow-" + tb_class + "-" + lr_class;
					
      				$modal.css({
							"z-index": me.ztop++,
							"top":top_set,
							"left":ev_left
							});
      				
      
      		} // eof switch
      		
      		if ($.fn.jScrollPane) {
				$(".jscroll").jScrollPane();
			}
      		
	}, // eof eventModal
	
	
	
	legendModal : function (id) {
	  	// only one legend at a time ??
	  	// $(".tg-timeline-modal").remove();
	  	
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
				html += "<li><img class='tg-legend-icon' src='" + icon + "'><span class='legend-info'>" + title + "</span></li>";
				 
	    }
	   
	    var templ_obj = {id:id, legend_list:html};
	  	
	  	// remove existing legend
	    $(CONTAINER + " .tg-legend").remove();
	  		
	  	$.tmpl(me._templates.legend_modal,templ_obj)
  			.appendTo(CONTAINER)
  			.css("z-index", me.ztop++)
      		.toggleClass("tg-display-none")
      		.position({
				my: "right top",
				at: "right top",
				of: $(CONTAINER),
				offset: "-72, 32", // left, top
				collision: "fit fit"
      		});
			
			i_sel = CONTAINER + " .legend-info, " + CONTAINER + " .tg-legend-icon";
				
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
		
		this.mediator = t.model.get("mediator");
		
		this.model.bind('change:title', function () {
			$(me.el).find(".timeline-title-span").text(me.model.get("title"));
		});
		
		if (this.mediator.timelineCollection.length > 1 || tg.mode == "authoring") {
			this.titleBar = "fullBar";
		} else {
			this.titleBar = "hiddenBar";	
		}
					
		this.model.bind('destroy', this.remove, this);
	},
	

    tagName:  "div",
    
    events: {
      "click .timeline-title-span" : "titleClick"
    },
    
    className: "tg-timeline-envelope",
    
    
	getTemplate: function() {
		
		var tmpl = "",
			env_bts = "",
			env_b = "",
			inverted = "";
			
			
		if (this.model.get("inverted")) {
			inverted = " timeline-inverted";
			
		} else {
			inverted = "";
		} 
			
		
		if (this.titleBar == "fullBar") {
		
			tmpl = "<div class='titleBar'>"
					+ "<div class='timeline-title" + inverted + "'>"
	      			+ "<span class='timeline-title-span'>";
	      			
	      			
	      			
	      			
	      	env_bts = "<div class='tg-env-buttons'>";
	      	
	      	// INFO BUTTON
	      	if (this.model.get("description")) {
	      		env_bts += "<div class='tg-env-button tg-env-info timeline-info-bt' data-timeline_id='${id}'></div>";
	      	}
	      	
	      	// LEGEND BUTTON
	      	if (this.model.get("hasLegend")) {
	      		env_bts += "<div class='tg-env-button tg-env-legend tg-legend-bt' data-timeline_id='${id}'></div>";
	      	}
	      	
	      	// MAY WANT TO SUPPRESS THESE
	      	
	      	// INVERT BUTTON
	      	env_bts += "<div class='tg-env-button tg-env-invert tg-invert-bt' data-timeline_id='${id}'></div>";
	      	
			// EXPAND BUTTON
	      	env_bts += "<div class='tg-env-button tg-env-expcol tg-expcol-bt' data-timeline_id='${id}'></div>"; 
	      	
	      	env_bts += "</div>";
	      	
	      		      	
			env_b = (timeglider.mode == "preview" || timeglider.mode == "publish") ? env_bts : "";			
			
			tmpl += env_b + "${title}</span></div></div>";
			
			
		} else if (this.titleBar == "imageBar") {
			tmpl = "<div class='titleBar imageBar'></div>";
		} else {
			tmpl = "<div class='titleBar tg-display-none'></div>";
		}
 	
		return tmpl;	
	},

    render: function() {
    	
    	var me = this;
		var id = me.model.get("id");
		var title = me.model.get("title");
		
		var _template = me.getTemplate();
		
		var state_class = this.model.get("inverted") ? "inverted" : "straight-up";
 	
		$(this.el)
			.html($.tmpl(_template, this.model.attributes))
			.attr("id", this.model.get("id"))
			.addClass(state_class);
		
		
		
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
    {unit:"da", width:35000,level:1, label:"30 minutes"},
    {unit:"da", width:17600,level:2, label:"1 hour"},
    {unit:"da", width:8800,level:3, label:"2 hours"},
    {unit:"da", width:4400,level:4, label:"5 hours"},
    {unit:"da", width:2200, level:5, label:"10 hours"},
    {unit:"da", width:1100, level:6, label:"1 DAY"},
    {unit:"da", width:550, level:7, label:"40 hours"},
    {unit:"da", width:432, level:8, label:"2 days"},
    {unit:"da", width:343, level:9, label:"2.5 days"},
    {unit:"da", width:272, level:10, label:"3 days"},
    {unit:"da", width:216, level:11, label:"4 days"},
    {unit:"da", width:171, level:12, label:"5 days"},
    {unit:"da", width:136, level:13, label:"1 WEEK"},
    {unit:"da", width:108, level:14, label:"8 days"},
    /* 108 * 30 = equiv to a 3240 month */
    {unit:"mo", width:2509, level:15, label:"10 days"},
    {unit:"mo", width:1945, level:16, label:"2 WEEKS"},
    {unit:"mo", width:1508, level:17, label:"18 days"},
    {unit:"mo", width:1169, level:18, label:"3 weeks"},
    {unit:"mo", width:913, level:19, label:"1 MONTH"},
    {unit:"mo", width:719, level:20, label:"5 weeks"},
    {unit:"mo", width:566, level:21, label:"6 weeks"},
    {unit:"mo", width:453, level:22, label:"2 MONTHS"},
    
    
    {unit:"mo", width:362, level:23, label:"10 weeks"},
    {unit:"mo", width:290, level:24, label:"3 MONTHS"},
    {unit:"mo", width:232, level:25, label:"4 months"},
    {unit:"mo", width:186, level:26, label:"5 months"},
    {unit:"mo", width:148, level:27, label:"6 MONTHS"},
    {unit:"mo", width:119, level:28, label:"7 months"},
    {unit:"mo", width:95,  level:29, label:"9 months"},
    {unit:"mo", width:76,  level:30, label:"1 YEAR"},
    /* 76 * 12 = equiv to a 912 year */
    {unit:"ye", width:723, level:31, label:"15 months"},
    {unit:"ye", width:573, level:32, label:"18 months"},
    {unit:"ye", width:455, level:33, label:"2 YEARS"},
    {unit:"ye", width:361, level:34, label:"2.5 years"},
    {unit:"ye", width:286, level:35, label:"3 years"},
    {unit:"ye", width:227, level:36, label:"4 years"},
    {unit:"ye", width:179, level:37, label:"5 years"},
    {unit:"ye", width:142, level:38, label:"6 years"},
    {unit:"ye", width:113,  level:39, label:"8 years"},
    {unit:"ye", width:89,  level:40, label:"10 years"},
    {unit:"de", width:705, level:41, label:"13 years"},
    {unit:"de", width:559, level:42, label:"16 years"},
    {unit:"de", width:443, level:43, label:"20 years"},

    {unit:"de", width:302, level:44, label:"25 years"},
    {unit:"de", width:240, level:45, label:"30 years"},
    {unit:"de", width:190, level:46, label:"40 years"},
    {unit:"de", width:150, level:47, label:"50 years"},
    {unit:"de", width:120, level:48, label:"65 years"},
    {unit:"de", width:95,  level:49, label:"80 years"},
    {unit:"de", width:76,  level:50, label:"100 YEARS"},
    {unit:"ce", width:600, level:51, label:"130 years"},
    {unit:"ce", width:480, level:52, label:"160 years"},
    {unit:"ce", width:381, level:53, label:"200 YEARS"},
    {unit:"ce", width:302, level:54, label:"250 years"},
    {unit:"ce", width:240, level:55, label:"300 years"},
    {unit:"ce", width:190, level:56, label:"400 years"},
    {unit:"ce", width:150, level:57, label:"500 YEARS"},
    {unit:"ce", width:120, level:58, label:"600 years"},
    {unit:"ce", width:95,  level:59, label:"1000 YEARS"},
    {unit:"ce", width:76,  level:60, label:"1100 years"},
    {unit:"thou", width:603, level:61, label:"1500 years"},
    
    {unit:"thou", width:478, level:62, label:"2000 years"},
    {unit:"thou", width:379, level:63, label:"2500 years"},
    {unit:"thou", width:301, level:64, label:"3000 years"},
    {unit:"thou", width:239, level:65, label:"4000 years"},
    {unit:"thou", width:190, level:66, label:"5000 YEARS"},
    {unit:"thou", width:150, level:67, label:"6000 years"},
    {unit:"thou", width:120, level:68, label:"7500 years"},
    {unit:"thou", width:95, level:69, label:"10,000 YEARS"},
    {unit:"thou", width:76,  level:70, label:"12,000 years"},
    {unit:"tenthou", width:603, level:71, label:"15,000 years"},
    {unit:"tenthou", width:358, level:72, label:"25,000 years"},
    {unit:"tenthou", width:213, level:73, label:"40,000 years"},
    {unit:"tenthou", width:126, level:74, label:"70,000 years"},
    {unit:"tenthou", width:76, level:75, label:"100,000 YEARS"},
    {unit:"hundredthou", width:603, level:76, label:"150,000 years"},
    {unit:"hundredthou", width:358, level:77, label:"250,000 years"},
    {unit:"hundredthou", width:213, level:78, label:"400,000 years"},
    {unit:"hundredthou", width:126, level:79, label:"700,000 years"},
    {unit:"hundredthou", width:76,  level:80, label:"1 million years"},
    {unit:"mill", width:603, level:81, label:"1.5 million years"},
    {unit:"mill", width:358, level:82, label:"3 million years"},
    {unit:"mill", width:213, level:83, label:"4 million years"},
    {unit:"mill", width:126, level:84, label:"6 million years"},
    {unit:"mill", width:76, level:85, label:"10 million years"},
    {unit:"tenmill", width:603, level:86, label:"15 million years"},
    {unit:"tenmill", width:358, level:87, label:"25 million years"},
    {unit:"tenmill", width:213, level:88, label:"40 million years"},
    {unit:"tenmill", width:126, level:89, label:"70 million years"},
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
	
	var $ms = $("#timeglider-measure-span");
	$ms.css("font-size", MED.base_font_size);
	
  	if (str) {
  		// for good measure, make it a touch larger
		return $ms.html(str).width() + MED.base_font_size;
	} else {
		return false;
	}
};


		
tg.scaleToImportance = function(imp, zoom_level) {
		// flash version: return ((importance - zoomLev) * 4.5) + 100;
		// 100 being 1:1 or 12 px

		// first basic version: return imp / zoo;
		
		return (((imp - zoom_level) * 4.5) + 100) / 100;
},
	
	
	
        
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
