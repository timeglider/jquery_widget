/*
 * Timeglider for Javascript / jQuery 
 * http://timeglider.com/jquery
 *
 * Copyright 2011, Mnemograph LLC
 * Licensed under Timeglider Dual License
 * http://timeglider.com/jquery/?p=license
 *
 */

/*******************************
	TIMELINE MEDIATOR
	¥ handles timeline behavior, 
	¥ reflects state back to view
	¥ owns the timeline and event data models

********************************/
(function(tg){
  
  
var MED = {},
	TG_Date = tg.TG_Date,
	options = {},
	$ = jQuery,
	$container = {},
	container_name = '';
      
      

tg.TG_Mediator = function (wopts, $el) {
  
    this.options = options = wopts;
    
   	$container = $el;
   	
   	container_name = wopts.base_namespace + "#" + $container.attr("id");


    // these relate to the display ------ not individual timeline attributes
    this._focusDate = {};
    this._zoomInfo = {};
    this._zoomLevel = 1;
    
    this.ticksReady = false;
    this.ticksArray = [];
    this.startSec = 0;
    this.activeTimelines = [];
    this.max_zoom = options.max_zoom;
    this.min_zoom = options.min_zoom;
    
    this.icon_folder = tg.icon_folder = options.icon_folder || "js/timeglider/icons/";
    
    // setting this without setTimeoffset to avoid refresh();
    this.timeOffset = TG_Date.getTimeOffset(options.timezone);
  
    this.fixed_zoom = (this.max_zoom == this.min_zoom) ? true : false;
    this.gesturing = false;
    this.gestureStartZoom = 0;
    this.gestureStartScale = 0; // .999 etc reduced to 1 to 100
    this.filters = {include:"", exclude:"", legend:[], tags:[]};
    
    // 
    this.filterActions = {};

	this.loadedSources = [];
    this.timelineCollection = new tg.TG_TimelineCollection;
    this.eventCollection = new tg.TG_EventCollection;
    
    this.imagesSized = 0;
    this.imagesToSize = 0;
    this.timelineDataLoaded = false,
    
    // this.setZoomLevel(options.initial_zoom);
    this.initial_timeline_id = options.initial_timeline_id || "";
    this.sole_timeline_id = "";
    
    this.dimensions = {};
    
    this.focusedEvent = '';
    
    if (options.max_zoom === options.min_zoom) {
      this.fixed_zoom = options.min_zoom;
    }
    
    if (options.main_map) {
    	this.main_map = options.main_map;
    	timeglider.mapping.setMap(this.main_map, this);
    }

    MED = this;

    } // end mediator head
    
    

	tg.TG_Mediator.prototype = {
	
		
		focusToEvent: function(ev){
			// !TODO open event, bring to zoom
			this.focusedEvent = ev;
			this.gotoDateZoom(ev.startdateObj.dateStr, ev.importance)
			$.publish(container_name + ".mediator.focusToEvent");
		},
		
		/*
		 * filterBy
		 * @param type {String} tags|include|exclude|legend
		 * @param content {String} content to be filtered, i.e. keyword, etc
		 *
		 */
		filterBy: function(type, content){
			// !TODO open event, bring to zoom
			var fObj = {origin:type};
			fObj[type] = content;
			debug.log("fObj:", fObj);
			this.setFilters(fObj);
		},

		

	    /* PUBLIC METHODS MEDIATED BY $.widget front */
	    gotoDateZoom: function (fdStr, zoom) {
	        var fd = new TG_Date(fdStr),
	            zl = false;
	        this.setFocusDate(fd);
	        
	        // setting zoom _does_ refresh automatically
	        if (zoom) { 
	        	var zl = this.setZoomLevel(zoom);
	        };
	        
	        if (!zoom || zl == false) { 
	        	this.refresh(); 
	        }
	        
	        $.publish(container_name + ".mediator.scopeChange");
	    },
	    
	    
	    zoom : function (n) {
	      var new_zoom = this.getZoomLevel() + parseInt(n);
	      this.setZoomLevel(new_zoom);
	    },
	    
	    
	    getScope : function () {
	    
			var zi = this.getZoomInfo(),
				fd = this.getFocusDate(),
				tBounds = this.getActiveTimelinesBounds(),
				focusDateSec = Math.round(fd.sec),
				focus_seconds = tg.TG_Date.TGSecToUnixSec(focusDateSec),
				width = this.dimensions.container.width,
				half_width = width/2,
				spp = Math.round(zi.spp),
			
				// calculate milliseconds from focus date seconds
				// and dimensions of the timeline frame
				left_ms = (focus_seconds - (half_width * spp)) * 1000,
				focus_ms = focus_seconds * 1000,
				right_ms = (focus_seconds + (half_width * spp)) * 1000;

			return {
				"spp": spp, 
				"width": width,
				"focusDateSec": focusDateSec,
				"timelines": this.activeTimelines,
				"timelineBounds": tBounds,
				"container": $container,
				"leftMS":left_ms,
				"rightMS":right_ms,
				"focusMS":focus_ms
			}
			
	    },
	    
	    
	    /*
	     * fitToContainer
	     * Considers the time-width of the current timeline(s) and
	     * finds the best zoom level to fit all events in one view
	    */
	    fitToContainer: function() {
	    	
	    	var bds = this.getActiveTimelinesBounds();
	    	var seconds_wide = bds.last - bds.first;
	    	var middle_sec = (bds.first + bds.last) / 2;
	    	var width = this.dimensions.container.width;
	    	
	    	var z = _.find(tg.zoomTree, function (zl) {
	    		return seconds_wide/zl.spp < width;
	    	});

	    	this.gotoDateZoom(middle_sec, z.level);
	    		
	    },
	    
	    
	    
	    
	    addFilterAction: function(actionName, actionFilter, actionFunction) {
	    	this.filterActions[actionName] = {filter:actionFilter, fn:actionFunction};
	    	this.refresh();
	    },
	    
	    removeFilterAction: function(actionName) {
	    	delete this.filterActions[actionName];
	    	this.refresh();
	    },
	    
	    
	    getEventByID: function(id, prop) {
	    	var evob = this.eventCollection.get(id).attributes;
	    	
	    	if (prop && evob.hasOwnProperty(prop)) {
	    		return evob[prop];
	    	} else {
	    		return evob;
	    	}
	    },
	    
	    
	    /* 
	     * adjustNowEvents
	     * Keeps events with "keepCurrent" set to "start" or "end" up to
	     * date with current time, useful for real-time timelines with
	     * sensitive auto-adjusting event times. Automatically searches
	     * all events in the collection.
	     * NO PARAMS
	     *
	     */
	    adjustNowEvents: function() {
	    	
	    	var refresh = false,
	    		kC = "",
	    		dd = "";
	    	
	    	_.each(this.eventCollection.models, function(ev) {
	    		if (ev.get("keepCurrent")) {
	    			// debug.log("ev has keepCurrent:", ev.get("keepCurrent"));
	    			kC = ev.get("keepCurrent"),
	    			dd = ev.get("date_display");
	    			
	    			if (kC == "start") {
	    				ev.set({"startdateObj":new TG_Date("today", dd)});
	    			} else if (kC == "end") {
	    				ev.set({"enddateObj":new TG_Date("today", dd)});
	    			}
	    			
	    			ev.reIndex();
	    			
	    			refresh = true;
	    	
	    		}
	    	});
	    
	    	if (refresh) {
	    		this.refresh();
	    	}
	    },
	    
	    
	    
	    
	    
	    /*
	     * addEvent
	     * @param new_event {Object} is a simple tg event object
	     *        with .startdate and .enddate as ISO8601 strings,
	     *        and would accept other TG_Event attribs
	     *	
	     * @return the new (Backbone) Model for the event
	     *
	    */
	    addEvent: function(new_event) {
	    
			new_event.startdateObj = new tg.TG_Date(new_event.startdate);
			
			var enddate = new_event.enddate || new_event.startdate;
			
			new_event.enddateObj = new tg.TG_Date(enddate);

			new_event.mediator = this;
			
			new_event.cache = {
				timelines:new_event.timelines,
				startdateObj:new_event.startdateObj,
				enddateObj:new_event.enddateObj,
				span:true
			}
			
			var new_model = new tg.TG_Event(new_event);
			
			this.eventCollection.add(new_model);
			
			// incorporates TG_Event into hashes, re-evaluates
			// timeline start/end points
			new_model.reIndex();
			
			
			this.refresh();
			
	    	$.publish(container_name + ".mediator.addEvent"); 
	    	
	    	return new_model;
	    
	    },
	    
	    /*
	     * updateEvent
	     * @param event_edits {Object} is a 
	     *	
	     * @return the new (Backbone) Model for the event
	     *
	    */
	    updateEvent:function (event_edits) {
	    	if (!event_edits.id) {
	    		alert("error: you need a valid id set on the object in updateEvent()");
	    		return false;
	    	}
	    	
	    	var ev = this.eventCollection.get(event_edits.id);
	    	
	    	ev.set(event_edits);
	    	
	    	// re-index if dates have changed
	    	if (event_edits.startdateObject || event_edits.enddateObject) {
	    		ev.reIndex();
	    	}

	    	this.refresh();
	    	
	    	$.publish(container_name + ".mediator.updateEvent"); 
	    	
	    	return ev;

	    },
	    
	    
	    /*
	     * Gets the bounds for 1+ timelines in view
	     */
	    getActiveTimelinesBounds: function() {
	    	
	    	var active = this.activeTimelines,
	    		tl = {},
	    		startSec = 99999999999,
	    		endSec = 0;
	    	
	    	for (var t=0; t<active.length; t++) {
	    		tl = this.timelineCollection.get(active[t]);
	    		startSec = (tl.get("bounds").first < startSec) ? tl.get("bounds").first : startSec;
	    		endSec = (tl.get("bounds").last > endSec) ? tl.get("bounds").last : endSec;
	    	}
	    	
			return {"first":startSec, "last":endSec};
	    
	    },
    
    
    
	/*
	* loadTimelineData
	* @param src {object} object OR json data to be parsed for loading
	* !TODO: create option for XML?
	*/
	loadTimelineData : function (src, callback) {
		
		var M = this; // model ref
		// Allow to pass in either the url for the data or the data itself.
		
		if (src) {
		  
			// if we've not loaded it already!
			if (_.indexOf(M.loadedSources, src) == -1) {
			
			
			    if (typeof src === "object") {
			    
					// OBJECT (already loaded, created)
					M.parseTimelineData(src);
			      
			    } else if (src.substr(0,1) == "#") {
					// TABLE
					var tableData = [M.getTableTimelineData(src)];
					// debug.log(JSON.stringify(tableData));
					M.parseTimelineData(tableData);
			      
			    } else {
			    	// FROM NEW JSON
	
			        $.getJSON(src, function (data) {
						M.parseTimelineData(data, callback);
			        });
			
			    }// end [obj vs remote]
			    
			    
			    M.loadedSources.push(src);
		    
		    
		    } 
		
		
		} else {
		
		  // NO INITIAL DATA:
		  // That's cool. We still build the timeline
		  // focusdate has been set to today
		  // !AUTH: USED IN AUTHORING MODE
		  this.timelineDataLoaded = true;
		  this.setZoomLevel(Math.floor((this.max_zoom + this.min_zoom) / 2));
		  this.tryLoading();
		  
		}
	
	},
	
	
	// click coming from marker on Google map
	mapMarkerClick: function(ev) {
		this.focusToEvent(ev);
	},
	
	getTimelineCollection: function() {
		return this.timelineCollection;
	},
	
	timelineTitleClick: function(timeline_id) {
		$.publish(container_name + ".mediator.timelineTitleClick", {timeline_id:timeline_id});
	},
	  
	  
	/*
	*  getTableTimelineData
	*  @param table_id {string} the html/DOM id of the table
	*  @return timeline data object ready for parsing
	*
	*/
	getTableTimelineData : function (table_id) {
	
	  var tl = {},
	      now = 0,
	      keys = [], field, value,
		      event_id = '',
		      $table = $(table_id);
	
		  // timeline head
		  tl.id = table_id.substr(1);		 
		  tl.title = $table.attr("title") || "untitled";
		  tl.description = $table.attr("description") || "";
		  tl.focus_date = $table.attr("focus_date") || TG_Date.getToday();
		  tl.initial_zoom = $table.attr("initial_zoom") || 20;
		  tl.events = [];
	
	  $table.find('tr').each(function(i){
	
	      	var children = $(this).children(),
	          row_obj;
	
	      	// first row -- <th> or <td>, gather the field names
	       	if ( i === 0 ) {
	
	        	keys = children.map(function(){
	            	// using "tg-*" map each column to the corresponding data
	          		return $(this).attr( 'class' ).replace( /^.*?\btg-(\S+)\b.*?$/, '$1' );
	        	}).get();
	
	      	} else {
				// i.e. an event
	       		row_obj = {};
	
				children.each(function(i){
					field = keys[i];
					
					if (field == "description"){
						value = $(this).html();
					} else {
						value = $(this).text();
					}
					
					// TODO: VALIDATE EVENT STUFF HERE
	
					row_obj[ field ] = value;
				});
				event_id = 'ev_' + now++;
				row_obj.id = event_id;
	        	tl.events.push(row_obj);
	
	      	} // end if-else i===0
	}); // end .each()
	
	    $table.css("display", "none");
	    return tl;
	},
	
	
	runLoadedTimelineCallback: function(callback, data) {
	
		
		var args = callback.args || "";
				
		callback.fn(args, data);
		
		if (callback.display) {
			debug.log("callback DISPLAY true...");
			this.showSingleTimeline(data[0].id);
		} else if (callback.toggle) {
			debug.log("callback TOGGLE true...");
			this.toggleTimeline(data[0].id);
		}
		
	},
	
 
	/*
	* parseTimelineData
	* @param data {object} Multiple (1+) timelines object 
	* derived from data in loadTimelineData
	*/
	parseTimelineData : function (data, callback) {
	
		
		var M = this,
			ct = 0,
			dl = data.length, 
			ti = {}, 
			ondeck = {};
	
		for (var i=0; i<dl;i++) {
	  
			ondeck = data[i];
			ondeck.mediator = M;
			ti = new tg.TG_Timeline(ondeck).toJSON(); // the timeline
					
			if (ti.id.length > 0) {
				ct++;
				M.swallowTimeline(ti);
			}
			
	
		}

		// TYPICALLY A SECONDARY (user-called from page) LOAD
		// WHICH MIGHT HAVE CUSTOMIZD CALLBACK ACTIONS...
		if (callback && (typeof callback.fn == "function" || typeof callback == "function")) {
		
			if (typeof callback == "function") {
				callback = {fn:callback};
			}
			
			$.publish(container_name + ".mediator.timelineDataLoaded");
		
			setTimeout(function() {
				M.runLoadedTimelineCallback(callback, data);
			}, 100);
			
			
			if (callback.display || callback.toggle) {
				return false;
			}

		} 
		
		
		// THE INITIAL LOAD

		if (ct === 0) {
			alert("ERROR loading data: Check JSON with jsonLint");
		} else {
			this.timelineDataLoaded = true;
			this.tryLoading();
		}
	
	},
	
	
	
  
	/*
	*  tryLoading
	*  Sees if all criteria for proceeding to display the loaded data
	*  are complete: data, image sizeing and others
	*
	*/
	tryLoading : function () {
	
		var a = (this.imagesSized == this.imagesToSize),
	    	b = (this.timelineDataLoaded == true);
	
		if (a && b) {
	    	this.setInitialTimelines();
	   
	    	$.publish(container_name + ".mediator.timelineDataLoaded");
		}
	},
	
	


    /* Makes an indexed array of timelines */
    swallowTimeline : function (obj) {

		this.sole_timeline_id = obj.id;
		this.timelineCollection.add(obj);
      
		// MAY NOT NEED THIS WITH Backbone Collection change-binding
		$.publish(container_name + ".mediator.timelineListChangeSignal");
    },
    



    /* 
    now loads multiple initial timelines: make sure
    to set the "top" attributes of timelines to make sure
    they don't overlap when initially loaded
    */
    setInitialTimelines : function () {
        
        debug.log("!! setInitialTimelines ??");
		var me = this,
			initial_timelines = this.initial_timeline_id,
			first_focus_id = "";
			
		// i.e. really, it's an array
      	if (typeof initial_timelines == "object") {
      		// set first timeline in array as one to focus on
      		first_focus_id = this.initial_timeline_id[0];
      		// make all specified ids active
      		_.each(initial_timelines, function (id) {
      			me.activeTimelines.push(id);
      		});
      		
      	} else if (initial_timelines.length > 0){
      		// not an array: a string would be single id or ""
      		first_focus_id = this.initial_timeline_id || this.sole_timeline_id;
      		me.activeTimelines = [first_focus_id];
      	} else if (this.timelineCollection.length > 0) {
      		// in case there is no initial id
      		first_focus_id = this.timelineCollection.pluck("id")[0];
      		me.activeTimelines = [first_focus_id];
      	}
      	
      	
      	if (timeglider.mode == "authoring") {
      		// no timelines loaded right away
      		me.setZoomLevel(40);
      		
      	} else if (first_focus_id) {
      	
      		// we need to wait just a bit...
			setTimeout(function () { 
				
				// timeline on which to focus is first/only
				var tl = me.timelineCollection.get(first_focus_id);
				var tl_fd = tl.get("focusDateObj");
			
				me.setFocusDate(tl_fd);
			
				// resetting zoomLevel will refresh
				me.setZoomLevel(tl.get("initial_zoom"));
				
			}, 500);
			
		} else {
			// could be no timelines to load
			me.setZoomLevel(40);
		}
      
    }, 


	refresh : function () {
		$.publish(container_name + ".mediator.refreshSignal");       
    },

    
    setTicksReady : function (bool) {
        this.ticksReady = bool;
        
        this.startSec = this._focusDate.sec;
                
        if (bool === true) { 
          $.publish(container_name + ".mediator.ticksReadySignal");
        }
   
    },

    
    
     /*
    *  setTimeoffset
    *  @param offset [String] eg: "-07:00"
    *      
    */
    setTimeoffset : function (offsetStr) {
        this.timeOffset = TG_Date.getTimeOffset(offsetStr);
        this.refresh();
    },
    
    
    // timezone hours/minutes ofset
    getTimeoffset : function () {
        return this.timeOffset;
    },
    
    
    /*
    *  setTimeoffset
    *  @param offset [String] eg: "-07:00"
    *      
    */
    setDimensions : function (d) {
        this.dimensions = d;
        // debug.log("dimensions:", d);
    },
      
    /*
    *  setFocusDate
    *  @param fd [TG_Date instance]
    *      
    */
    setFocusDate : function (fd) {
     
		if (fd != this._focusDate) {
			this._focusDate = fd; 
        }
    },
    
    getFocusDate : function () {
        return this._focusDate;
    },
      
      
    
    /*
    * getZoomLevel
    * @return {Number} zoom level number from 1 to 100
    *
    *
    *
    */
    getZoomLevel : function () {
        return parseInt(this._zoomLevel);
    },
    
    
        
    mouseWheelChange: function(dir) {
    
    	var zl = this.getZoomLevel();
		this.setZoomLevel(zl += dir);
		
		$.publish(container_name + ".mediator.mouseWheelChange");
		
    },


	/* 
	*  setZoomLevel
	*  This in turn sets other zoomInfo attributes : width, label, tickWidth
	*  Other zoom info comes from the zoomTree array
	*  @param z ==> integer from 1-100
	*  
	*/
	setZoomLevel : function (z) {
	   
		if (z <= this.max_zoom && z >= this.min_zoom) {
		
			// focusdate has to come first for combined zoom+focusdate switch
			this.startSec = this._focusDate.sec;
			
			  
			if (z != this._zoomLevel) {
			    this._zoomLevel = z;
			    this._zoomInfo = tg.zoomTree[z];
			    $.publish(container_name + ".mediator.zoomLevelChange");
			    $.publish(container_name + ".mediator.scopeChange");
			    return true
			} else {
		    	return false;
			}
		  // end min/max check
		} else { return false; }
	
	}, 


	/*
	*  getZoomInfo
	*  @return obj {Object} with 
	*          zoomLevel (Number), label (String), tickWidth (Number), unit (String)
	*
	*/
	getZoomInfo : function () {
		return this._zoomInfo;
	},
	
	
	
	/* 
	 * from click etc. on page, what is the date?
	 */
	getDateFromOffset: function (dp_x) {
		var me = this,
			ctnr = me.dimensions.container,
			Cw = ctnr.width,
    		Cx = dp_x - (ctnr.offset.left),
    		offMid = Cx - Cw/2,
	    	secPerPx = me.getZoomInfo().spp,
	    	fdSec = me.getFocusDate().sec,
			dcSec = Math.floor(fdSec + (offMid * secPerPx));
			
			return new TG_Date(dcSec);
	},
	
	
	// incoming: {name:"dblclick", event:e, dimensions:me.dimensions}
	registerUIEvent: function (info) {
		var me = this;
		
		switch(info.name) {
			case "dblclick": 
			// info comes with 
				
				var clickDate = me.getDateFromOffset(info.event.pageX);
				////////////////////////////
				
				$.publish(container_name + ".mediator.dblclick", {date:clickDate});
				
			break;
		}
	},
        
        
        
	/*
	*  setFilters
	*  @param obj {Object} containing: 
	*         origin ("clude", "legend", "tags"), include (Str), exclude (Str), legend (Obj)
	*
	*/
    setFilters : function (obj) {
    
    	var me = this;
      
		switch (obj.origin) {
		
			case "clude":
				this.filters.include = obj.include;
				this.filters.exclude = obj.exclude;
			break;
			
			
			case "tags":
				if (obj.tags) {
					this.filters.tags = obj.tags.split(",");
				} else {
					this.filters.tags = [];
				}
			break;
			
			
			case "legend":
				
				// subtract the icons folder URL...
				// starting icon with "shapes/" etc.
				var icon = obj.icon.replace(me.options.icon_folder, "");
	
				if (icon == "all") {
					this.filters.legend = [];
					$.publish(container_name + ".mediator.legendAll");
				} else {
										
					if (_.indexOf(this.filters.legend, icon) == -1) {
						this.filters.legend.push(icon);
					} else {
						// remove it
						var fol = this.filters.legend;
						var fr = [];
						fr = $.grep(fol, function (a) { return a != icon; });
						this.filters.legend = fr;
					}
				
				 } // end if/else for "clear"
				  
			break;
			
			
			case "custom": 
				if (obj.action == "add") {
					this.filters.custom = obj.fn;
					debug.log("this.filters.custom:", this.filters.custom);
				} else {
					delete this.filters.custom;
				}
			break;
		
		} // end switch
   		
   		
        $.publish(container_name + ".mediator.filtersChange"); 
        // $.publish(container_name + ".mediator.scopeChange");
        
           
        this.refresh();
	},
         

	getTicksOffset : function () {
		return this._ticksOffset;
	},


	setTicksOffset : function (newOffset) {
		// This triggers changing the focus date
		// main listener hub for date focus and tick-appending
		this._ticksOffset = newOffset;
		
		// In other words, ticks are being dragged!
		$.publish(container_name + ".mediator.ticksOffsetChange");
		$.publish(container_name + ".mediator.scopeChange");
	},



	/*
	*  getTickBySerial
	*  @param serial {Number} serial date unit number (rata die, monthnum, year, etc)
	*
	*  @return {Object} info about _existing_ displayed tick
	*
	*/
	getTickBySerial : function (serial) {
		var ta = this.ticksArray,
		tal = ta.length;
		for (var t=0; t<tal; t++) {
			var tick = ta[t];
			if (tick.serial == serial) { return tick; }
		}
		return false;
	},



	/*
	*  addToTicksArray
	*	 @param obj {Object} 
	*		  serial: #initial tick
	*		  type:init|l|r
	*		  unit:ye | mo | da | etc
	*		  width: #px
	*		  left: #px
	*	 @param focusDate {TG_Date}
	*		 used for initial tick; others set off init
	*/
	addToTicksArray : function (obj, focusDate) {
		
		// var ser = 0;
		
		if (obj.type == "init") {
			// CENTER
			obj.serial = TG_Date.getTimeUnitSerial(focusDate, obj.unit);
			this.ticksArray = [obj];
		} else if (obj.type == "l") {
			// LEFT
			obj.serial = this.ticksArray[0].serial - 1;
			this.ticksArray.unshift(obj);
		} else {
			// RIGHT SIDE
			obj.serial = this.ticksArray[this.ticksArray.length -1].serial + 1;
			this.ticksArray.push(obj);
		}
		
		// this.ticksArrayChange.broadcast();
		$.publish(container_name + ".mediator.ticksArrayChange");
		
		return obj.serial;
	},


	showSingleTimeline: function(id) {
		this.activeTimelines = [];
		this.toggleTimeline(id);
		
		debug.log("clear active timelines, ought to be just the single showing timeline ", this.activeTimelines);
		
		
	},


	toggleTimeline : function (id) {
		
		// patch until we have better multi-timeline support
		// this is a true "toggle" in that it clears visible
		// timelines and loads the new timeline by id

		var tl = this.timelineCollection.get(id).attributes;
		
		debug.log("uh, is this..", id + " in " + this.activeTimelines + "?");
		
		var active = _.indexOf(this.activeTimelines, id);
		
		debug.log("is it active??", active);
		
		
		if (active == -1) {
			// timeline not active ---- bring it on
			this.activeTimelines.push(id);

			// timeline focus_date is ISO-8601 basic;
			// interface focusdate needs a TG_Date()
			var tl_fd = new TG_Date(tl.focus_date);
			
			// setting FD does NOT refresh
			this.setFocusDate(tl_fd);
			
			// resetting zoomLevel will refresh
			this.setZoomLevel(tl.initial_zoom);
			
		
		} else {
		
			// it's active, remove it
			this.activeTimelines.splice(active,1);
			
			
			// this will change the menu list/appearance
		}
		
		
		this.refresh();
		$.publish(container_name + ".mediator.activeTimelinesChange");
	
	},
           
	/*
	*  reportImageSize
	*  @param img {Object} has "id" of event, "src", "width" and "height" at least
	*  
	*  This information is reported from TG_Timeline as data is loading. Since image
	*  size gathering sidetracks from data loading, there's a 
	*/
	reportImageSize : function (img) {
	 
	 	// debug.log("reporting image size...", img)
		var ev = MED.eventCollection.get(img.id);
		
		if (ev.has("image")) {
			if (!img.error) {
				ev.attributes.image.width = img.width;
				ev.attributes.image.height = img.height;
			} else {
				ev.attributes.image = {};
				debug.log("WHOOPS: MISSING IMAGE: " + img.src);
			}
		
			this.imagesSized++;
		
			if (this.imagesSized == this.imagesToSize) {
				// if there are images, this would usually be
				// the last step before proceeding
				this.tryLoading();
			}
		}
	}



///// end model prototype object
}; 
        
        
tg.getLowHigh = function (arr) {
	
	var sorted = _.sortBy(arr, function(g){ return parseInt(g); });
	
	return {"low":_.first(sorted), "high":_.last(sorted)}

};
        
  
    	  
        
        
tg.validateOptions = function (widget_settings) {	
  
	this.optionsMaster = { 
		initial_focus:{type:"date"}, 
		timezone:{type:"timezone"},
    	editor:{type:"string"}, 
    	backgroundColor:{type:"color"}, 
    	backgroundImage:{type:"color"}, 
    	min_zoom:{type:"number", min:1, max:100}, 
    	max_zoom:{type:"number", min:1, max:100}, 
    	initial_zoom:{type:"number", min:1, max:100}, 
    	show_centerline:{type:"boolean"}, 
    	display_zoom_level:{type:"boolean"}, 
    	data_source:{type:"url"}, 
    	basic_fontsize:{type:"number", min:9, max:100}, 
    	mouse_wheel:{type:"string", possible:["zoom","pan"]}, 
    	initial_timeline_id:{type:"mixed"},
    	icon_folder:{type:"string"},
    	show_footer:{type:"boolean"},
    	display_zoom_level:{type:"boolean"},
    	constrain_to_data:{type:"boolean"},
    	boost:{type:"number", min:0, max:99},
    	event_modal:{type:"object"},
    	event_overflow:{type:"string"}
  	}
  	
	// msg: will be return value: validates when empty 
	// change lb to <br> if the error is returned in HTML (vs alert())
	var me = this, msg = "", lb = "\n";

	$.each(widget_settings, function(key, value) { 

		if (me.optionsMaster[key]) {

			switch (me.optionsMaster[key].type) {
				case "string": 
					if (typeof value != "string") { msg += (key + " needs to be a string." + lb); }
					if (me.optionsMaster[key].possible) {
						if (_.indexOf(me.optionsMaster[key].possible, value) == -1) {
							msg += (key + " must be: " + me.optionsMaster[key].possible.join(" or "));
						}
					}
				break;

				case "number":
					if (typeof value != "number") { msg += (value + " needs to be a number." + lb); }
					if (me.optionsMaster[key].min) {
						if (value < me.optionsMaster[key].min) {
							msg += (key + " must be greater than or equal to " + me.optionsMaster[key].min + lb);
						}
					}

					if (me.optionsMaster[key].max) {
						if (value > me.optionsMaster[key].max) {
							msg += (key + " must be less than or equal to " + me.optionsMaster[key].max + lb);
						}
					}
				break;

				case "date":
					// TODO validate a date string using TG_Date...
				break;
				
				case "timezone":
					
					var cities = ["New York", "Denver", "Chicago", "Los Angeles"];
					var pattern = /[+|-]?[0-9]+:[0-9]+/;
						if ((_.indexOf(cities, value) == -1) && (value.match(pattern) == -1)) { 
							msg += ("The timezone is not formatted properly");
						}
						
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

				case "mixed":
					/// TODO test for pattern for color, including "red", "orange", etc
				break;
			}
		}
	}); // end each

	return msg;

};

        
       
})(timeglider);