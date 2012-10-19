/*
 * Timeglider for Javascript / jQuery 
 * http://timeglider.com/jquery
 *
 * Copyright 2011, Mnemograph LLC
 * Licensed under Timeglider Dual License
 * http://timeglider.com/jquery/?p=license
 *
/*

*         DEPENDENCIES: 
                        rafael.js
                        ba-tinyPubSub
                        jquery
                        jquery ui (and css)
                        jquery.mousewheel
                        jquery.ui.ipad
                        
                        TG_Date.js
                        TG_Timeline.js
                        TG_TimelineView.js
                        TG_Mediator.js
                        TG_Org.js
                        Timeglider.css
*
*/




(function($){
	/**
	* The main jQuery widget factory for Timeglider
	*/
	
	var timelinePlayer, 
		tg = timeglider, 
		MED,
		TG_Date = timeglider.TG_Date;
	
	$.widget( "timeglider.timeline", {
		
		// defaults!
		options : { 
			base_namespace:"tg",
			timezone:"00:00",
			initial_focus:tg.TG_Date.getToday(), 
			editor:'none', 
			min_zoom : 1, 
			max_zoom : 100, 
			show_centerline:true, 
			data_source:"", 
			culture:"en",
			base_font_size:16, 
			mouse_wheel: "zoom", // !TODO | pan 
			initial_timeline_id:'',
			icon_folder:'js/timeglider/icons/',
			image_lane_height: 32,
			show_footer:true,
			minimum_timeline_bottom: 24,
			display_zoom_level:false,
			display_single_timeline_info:true,
			constrain_to_data:true,
			boost:0,
			tick_top:"",
			event_modal:{href:'', type:'default'},
			event_overflow:"plus"  // plus | scroll 
		},
		
		_create : function () {
		
			this._id = $(this.element).attr("id");
			/*
			Anatomy:
			*
			*  -container: main frame of entire timeline
			*  -centerline
			*  -truck: entire movable (left-right) container
			*  -ticks: includes "ruler" as well as events
			*  -handle: the grabbable part of the truck which 
			*           self-adjusts to center
			*  -slider-container: wrapper for zoom slider
			*  -slider: jQuery UI vertical slider
			*  -timeline-menu
			*
			*  -measure-span: utility div for measuring text lengths
			*
			*  -footer: (not shown) gets added dynamically unless
			*           options indicate otherwise
			*/
			// no need for template here as no data being passed
			var MAIN_TEMPLATE = "<div id='tg-container' class='timeglider-container'>"
				+ "<div class='timeglider-loading'><div>loading</div></div>"
				+ "<div class='timeglider-centerline'></div>"
				
				+ "<div class='timeglider-truck' id='tg-truck'>"
				+ "<div class='timeglider-ticks noselect'>"
				+ "<div class='timeglider-handle'></div>"
				
				+ "</div>"
				+ "</div>"
				
				+ "<div class='timeglider-slider-container noselect'>"
				+ "<div class='tg-slider-plusminus tg-slider-plus tg-zoom-in'></div>"
				+ "<div class='timeglider-slider'></div>"
				+ "<div class='tg-slider-plusminus tg-slider-minus tg-zoom-out'></div>"
				+ "<div class='timeglider-pan-buttons'>"
				+ "<div class='timeglider-pan-left'></div><div class='timeglider-pan-right'></div>"
				+ "</div>"
				+ "</div>"
				
				+ "<div class='tg-scrim'></div>"
				
				
				+ "<div class='timeglider-footer' id='tg-footer'>"
				+ "<div class='timeglider-logo'></div>" 
				
				+ "<div class='tg-footer-center'>"
				+ "<div class='tg-prev tg-prevnext'><a>prev</a></div>"
				+ "<div class='tg-date-display noselect'><div class='tg-date-display-arrow'></div><span></span></div>"
				+ "<div class='tg-next tg-prevnext'><a>next</a></div>"
				+ "</div>"
				
				+ "	<div class='tg-footer-buttons'>"
				+ "	<div class='timeglider-footer-button timeglider-filter-bt'></div>"
				+ "	<div class='timeglider-footer-button timeglider-settings-bt'></div>"
				+ "</div>"
				+ "</div>"
				+ "<div class='timeglider-event-hover-info'></div>"
				+ "</div><span id='timeglider-measure-span'></span>";
			
			this.element.html(MAIN_TEMPLATE);
		
		}, // eof _create()
		
		/**
		* takes the created template and inserts functionality
		*  from Mediator and View constructors
		*
		*
		*/
		_init : function () {
			
			// validateOptions should come out as empty string
			var optionsCheck = timeglider.validateOptions(this.options);
			
			if (optionsCheck == "") {
			
				tg.TG_Date.setCulture(this.options.culture);
			
				MED = new tg.TG_Mediator(this.options, this.element);
				timelinePlayer = new tg.TG_TimelinePlayer(this, MED);
				
				this.player = timelinePlayer;
				
				// after timelinePlayer is created this stuff can be done
				MED.setFocusDate(new TG_Date(this.options.initial_focus));
				
				MED.loadTimelineData(this.options.data_source, this.options.loaded);
			
			} else {
				alert("Rats. There's a problem with your widget settings:" + optionsCheck);
			}
		
		},
	
		
		/** 
		*********  PUBLIC METHODS ***************
		*
		*/
		
		
		/* 
		* goTo
		* sends timeline to a specific date and, optionally, zoom
		* @param d {String} ISO8601 date: 'YYYY-MM-DD HH:MM:SS'
		* @param z {Number} zoom level to change to; optional
		*/
		goTo : function (d, z) {
			
			if (d == "next") {
				MED.gotoNextEvent();
			} else if (d == "previous") {
				MED.gotoPreviousEvent();
			} else {
				MED.gotoDateZoom(d,z);
			}	
			
			return this;
		},
		
		refresh : function () {
			MED.refresh();
			return this;
		},
		
		resize : function () {
			timelinePlayer.resize();
			return this;
		},
		
		filterBy : function (type, content) {
			MED.filterBy(type, content);
			return this;
		},

		addFilterAction: function (name, filterFunction, actionFunction) {
			MED.addFilterAction(name, filterFunction, actionFunction);
			return this;
		},
		
		removeFilterAction: function (name) {
			MED.removeFilterAction(name);	
			return this;
		},
		
		getMediator : function () {
			return MED;
		},
		
		
		
		/*
		 * getEventByID
		 * By passing just an id, this returns the whole event object
		 * (or the attributes of the Backbone model)
		 * By adding a property such as "title", you can just get one property
		 * @param id {String} The event id, as it was passed in JSON data
		 * @param prop {String} optional property name string in case you 
		 *        only want that one property
		*/
		getEventByID : function (id, prop) {
			return MED.getEventByID(id, prop);
		},
		
				
		updateEvent: function (model_object) {
			return MED.updateEvent(model_object);
		},
		
		
		/*
		 * focusToEvent
		 * By passing just an id, this returns the whole event object
		 * (or the attributes of the Backbone model)
		 * By adding a property such as "title", you can just get one property
		 * @param id {String} The event id, as it was passed in JSON data
		 * @param prop {String} optional property name string in case you 
		 *        only want that one property
		*/
		focusToEvent : function (event_id) {
			var ev = MED.getEventByID(event_id);
			MED.focusToEvent(ev);
			
			return this;
		},
		
				
		getScope : function () {
			return MED.getScope();
		},
		
		
				
		fitToContainer : function () {
			MED.fitToContainer();
			
			return this;
		},
		
		
		
		/*
		 * adjustNowEvents
		 * keeps ongoing events current to the latest time
		 * For this to work, events need a property in them
		 * that looks like this:
		 *    "keepCurrent": "start"
		 *    OR
		 *    "keepCurrent": "end"
		 * The "start" value would update the startdate to be the 
		 * current time and if start & end are the same, it would
		 * update both;  the "end" value would update the enddate
		 * only, creating a "leading edge" event with a continuous
		 * "still happening" state
		 */
		adjustNowEvents : function () {
			return MED.adjustNowEvents();
		},
		
		
		/*
		 * addEvent
		 * adds and event to any of the existing, loaded timelines
		 * @param new_event {Object} simple TG event
		          including: .id, .title, .startdate
		          (as simple ISO8601 string)
		 *
		 */
		addEvent : function (new_event) {
			return MED.addEvent(new_event);
		},
		
		
		/**
		* zoom
		* zooms the timeline in or out, adding an amount, often 1 or -1
		*
		* @param n {number|string}
		*          numerical: -1 (or less) for zooming in, 1 (or more) for zooming out
		*          string:    "in" is the same as -1, "out" the same as 1
		*/
		zoom : function (n) {
		
			switch(n) {
				case "in": n = -1; break;
				case "out": n = 1; break;
			}
			// non-valid zoom levels
			if (n > 99 || n < -99) { return false; }
			
			MED.zoom(n);
			
			return this;
		},
		
		
		/**
		* loadTimeline
		* basic wrapper for Mediator loadTimeline
		* callback_object includes:
		*     .fn = function that will be called
		*     .args = arguments Object that can be passed
		*     .display = boolean, set to true to swap in just
		                 the first timeline loaded; otherwise
		                 it will load but won't immediately display
		*     (fn also has timeline(s) available as "data" in 2nd arg)
		*               
		* 
		*/
		loadTimeline : function (src, callback_object) {
			
			MED.loadTimelineData(src, callback_object);
			
			return this;
		},
		
		
		
		/**
		*  panButton
		*  sets a pan action on an element for mousedown and mouseup|mouseover
		*  
		*
		*/
		panButton : function (sel, vel) {
			var _vel = 0;
			switch(vel) {
				case "left": _vel = 30; break;
				case "right": _vel = -30; break;
				default: _vel = vel; break;
			}
			timelinePlayer.setPanButton(sel, _vel);
		},
		
		
		/**
		* destroy 
		* wipes out everything
		*/
		destroy : function () {
			$.Widget.prototype.destroy.apply(this, arguments);
			$(this.element).html("");
		}
	
	}); // end widget process

})(jQuery);
