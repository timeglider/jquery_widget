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
*
* Timeline
* Backbone Model
*
*/

(function(tg){

	
	var TG_Date = tg.TG_Date,
		$ = jQuery,
		widget_options = {},
		tg_units = TG_Date.units,
		MED;


	tg.TG_EventCollection = Backbone.Collection.extend({
		
		// "master hash"
		eventHash:{},

		setTimelineHash: function(timeline_id, hash) {
			this.eventHash[timeline_id] = hash;
		},
		
		getTimelineHash: function(timeline_id, hash) {
			return this.eventHash[timeline_id];
		},
		
		model: tg.TG_Event
	});
  
	
	
	
	// map model onto larger timeglider namespace
	/////////////////////////////////////////////
	tg.TG_Event = Backbone.Model.extend({
	
		urlRoot : '/event',
	
		defaults: {
			"title":  "Untitled"
		},
		
		initialize: function(ev) {
			// Images start out being given a default width and height
			// of 0, so that we can "find out for ourselves" what the
			// size is.... pretty costly, though...
			// can this be done better with PHP?
			
			if (ev.image) {
				var img = ev.image;
				
				if (typeof img == "string") {
				
					var display_class = ev.image_class || "above";

					ev.image = {id: ev.id, src:ev.image, display_class:display_class, width:0, height:0};
				
				} else {
						
					ev.image.display_class = ev.image.display_class || "above";
					ev.image.width = 0;
					ev.image.height = 0;
					
				}

				// this will follow up with reporting size in separate "thread"
				this.getEventImageSize(ev.image);
			
				// MED.imagesToSize++;
				
	
			} else {
				ev.image = '';
			}
			
			// further urldecoding?
			// by replacing the &amp; with & we actually
			// preserve HTML entities 	
			ev.title = ev.title.replace(/&amp;/g, "&");
			
			ev.titleWidth = tg.getStringWidth(ev.title);

			this.set(ev);
			
		},
	
		
		// TODO: validate event attributes
		validate: function (attrs) {
			// TODO		
		},
		
		
		getEventImageSize:function(img) { 
		
			var that = this,
				imgTesting = new Image(),
				img_src = imgTesting.src = img.src;
		
			imgTesting.onerror= delegatr(imgTesting, function () {
				debug.log("error loading image:" + img_src);
				that.set({"image":""});
			});
		
			imgTesting.onload = delegatr(imgTesting, function () {
				that.get("image").height = this.height;
				that.get("image").width = this.width;
			});
		
			function delegatr(contextObject, delegateMethod) {
				return function() {
					return delegateMethod.apply(contextObject, arguments);
				}
			};
	
		}, // end getEventImageSize
		
		
		reIndex: function(do_delete) {
		
		  	var model = this,
		  		deleting = do_delete || false,
		  		cache = model.get("cache"),
		  		event_id = model.get("id"),
		  		new_start = model.get("startdateObj"),
		  		new_end = model.get("enddateObj"),
		  		ev_timelines = model.get("timelines"),
		  		ev_timeline_cache = cache.timelines,
		  		cache_start = cache.startdateObj || new_start,
		  		span = cache.span,
		  		timeline = {}, 
		  		hash = {},
		  		ser = 0, new_ser = 0,		
		  		arr = [],
		  		tl_union = _.union(ev_timeline_cache, ev_timelines),
		  		TG_Date = tg.TG_Date,
		  		MED = model.get("mediator"),
		  		TIMELINES = MED.timelineCollection,
		  		EVENTS = MED.eventCollection;
		  	
		 
		  	// cycle through all event's past/present timelines
		  	// OUTER .each
		  	_.each(tl_union, function(timeline_id){ 
				
		  		timeline = TIMELINES.get(timeline_id);
		  		
		  		hash = EVENTS.getTimelineHash(timeline_id); 
					
		  		// remove from "all" array (used for bounds)
				hash["all"] = _.reject(hash["all"], function(eid){ 
					// truthy is rejected!!
					return eid == event_id;
				});
			
		  		
		  		// UNITS: "da", "mo", "ye", "de", "ce", "thou", "tenthou", 
		  		//        "hundredthou", "mill", "tenmill", "hundredmill", "bill"
		  		// INNER .each
		  		_.each(TG_Date.units, function(unit) {
		  		
					ser = TG_Date.getTimeUnitSerial(cache_start, unit);
					
					// REMOVE CACHED DATE INDICES FROM HASH 	
					// ALL TIMELINES ARE CLEARED		
					if (hash[unit][ser] !== undefined) {
						hash[unit][ser] = _.reject(hash[unit][ser], function(eid){ 
							// truthy is rejected!
							return eid == event_id;
						});
					} 
					
					// RE-INDEX IN EVENT'S CURRENT TIMELINES ARRAY!!
					if (deleting != true) {
						if ($.inArray(timeline_id, ev_timelines) != -1) {
							new_ser = TG_Date.getTimeUnitSerial(new_start, unit);
							if (hash[unit][new_ser] !== undefined) {
								hash[unit][new_ser].push(event_id);
							} else {
								// create the array
								hash[unit][new_ser] = [event_id];
							}
						}
					} // end if not deleting
								
		  		}); // end inner _.each
		  		
		  		
		  		if (deleting != true) {
			  		if ($.inArray(timeline_id, ev_timelines) != -1) {
			  			hash["all"].push(event_id);
			  		}
		  		}
		  		
		  		
		  		// REFRESH BOUNDS: CYCLE THROUGH HASH'S "all" INDEX
		  		// INCLUDE ALL IN UNIONED TIMELINES
		  		var bounds = timeline.get("bounds");
		  		
		  		var spill = [];
		  		
		  		_.each(hash["all"], function (id) {
		  			var ev = EVENTS.get(id);
		  			spill.push(ev.get("startdateObj").sec);
		  			spill.push(ev.get("enddateObj").sec);
		  		});
		  		
		  		// does it have any events
					
				// totally new set of bounds!
		   		timeline.set({bounds:{first:_.min(spill), last:_.max(spill)}});
		
		  		var timeline_spans = timeline.get("spans");
				
				// WIPE OUT OLD SPAN REF NO MATTER WHAT
		  		if (cache.span) {
		  			delete timeline_spans["s_" + event_id];
		  		} 
		  		
		  		// RE/LIST SPAN
		  		if (deleting != true) {
			  		if (model.get("span") == true) {
			  			timeline_spans["s_" + event_id] = {id:event_id, start:new_start.sec, end:new_end.sec};
			  		}
			  			
			  	} 
			  	
			  	// make sure timeline "has_events" is accurate
			  	timeline.set({has_events:hash["all"].length});
		  	
		  	}); // end outer/first _.each, cycling across timelines cached/new
  	  	
  		
		}	

	
	});
	
	
	
	tg.TG_TimelineCollection = Backbone.Collection.extend({
		model: tg.TG_Timeline
	});
	
	
	// map model onto larger timeglider namespace
	/////////////////////////////////////////////
	tg.TG_Timeline = Backbone.Model.extend({
		
		urlRoot : '/timeline',
		
		defaults: {
			// no other defaults?
			"initial_zoom":25,
			"timezone":"00:00",
			"title":  "Untitled",
			"events": [],
			"legend": []
		},
		
		// processes init model data, adds certain calculated values
		_chewTimeline : function (tdata) {
		
			// TODO ==> add additional units
			MED = tdata.mediator;
			
			tdata.timeline_id = tdata.id;
						
			widget_options = MED.options;
			
			var dhash = {
				"all":[],
				"da":[], 
				"mo":[], 
				"ye":[], 
				"de":[], 
				"ce":[], 
				"thou":[],
				"tenthou":[],
				"hundredthou":[],
				"mill":[],
				"tenmill":[],
				"hundredmill":[],
				"bill":[]
			};
			
			tdata.spans = {};
			tdata.hasImagesAbove = false;
			tdata.startSeconds = [];
			tdata.endSeconds = [];
			
			// render possible adjective/numeral strings to numeral
			tdata.size_importance = (tdata.size_importance == "false" || tdata.size_importance == "0")? 0 : 1;
			tdata.is_public = (tdata.is_public == "false" || tdata.is_public == "0")? 0 : 1;
			
			// widget options timezone default is "00:00";
			var tzoff = tdata.timezone || "00:00";
			
			tdata.timeOffset = TG_Date.getTimeOffset(tzoff);
						
			// TODO: VALIDATE COLOR, centralize default color(options?)
			if (!tdata.color) { tdata.color = "#333333"; }			
			
			if (tdata.events.length>0) {
				

				var date, ddisp, ev, id, unit, ser, tWidth;
				var l = tdata.events.length;
	
				for(var ei=0; ei< l; ei++) {
				
					ev=tdata.events[ei];

					// make sure it has an id!
					if (ev.id) { 
						id = ev.id 
					} else { 
						// if lacking an id, we'll make one...
						ev.id = id = "anon" + this.anonEventId++; 
					}
					
					ev.importance = parseInt(ev.importance, 10) + widget_options.boost;
					
					/*
				 		We do some pre-processing ** INCLUDING HASHING THE EVENT *
				 		BEFORE putting the event into it's Model&Collection because some 
				 		(processed) event attributes are needed at the timeline level
					*/
			
					if (ev.map) {
						if (MED.main_map) {
							
							if (timeglider.mapping.ready){
								ev.map.marker_instance = timeglider.mapping.addAddMarkerToMap(ev, MED.main_map);
								// debug.log("marker_instance", ev.map.marker_instance);
							}
							// requires TG_Mapping.js component
							
						} else {
							// debug.log("NO MAIN MAP... BUT LOAD MAPS FOR MODAL");
							// load instance of maps for modal viewing
							// requires: TG_Mapping.js
							tg.googleMapsLoad();
						}
					}
					
					
					ev.callbacks = ev.callbacks || {};
					
					
					if (typeof ev.date_display == "object") {
						ddisp = "da";
					} else {
						// date_limit is allowed old JSON prop name,
						// replaced by date_display
						ddisp = ev.date_display || ev.date_limit || "da";
					}
					
					
					
					
					ev.date_display = ddisp.toLowerCase().substr(0,2);
								
					// if a timezone offset is set on the timeline, adjust
					// any events that do not have the timezone set on them
					if (tdata.timeOffset.seconds) {
						ev.startdate = TG_Date.tzOffsetStr(ev.startdate, tdata.timeOffset.string);
						
						if (ev.enddate) {
						ev.enddate = TG_Date.tzOffsetStr(ev.enddate, tdata.timeOffset.string);
						}
					}
					
					ev.startdateObj = new TG_Date(ev.startdate, ev.date_display);
					
					// !TODO: only if they're valid!
					if ((ev.enddate) && (ev.enddate !== ev.startdate)){
						ev.enddateObj = new TG_Date(ev.enddate, ev.date_display);
						ev.span=true;
						// index it rather than push to stack
						
						tdata.spans["s_" + ev.id] = {id:ev.id, start:ev.startdateObj.sec, end:ev.enddateObj.sec};
						
					} else {
						ev.enddateObj = ev.startdateObj;
						ev.span = false;
					}
					
					
					// haven't parsed the image/image_class business...
					if (ev.image) {
						
						if (ev.image.display_class != "inline") { 
							
							tdata.hasImagesAbove = true; 
						}
					}
										
					tdata.startSeconds.push(ev.startdateObj.sec);
					tdata.endSeconds.push(ev.enddateObj.sec);

					// cache the initial date for updating hash later
					// important for edit/delete operations
					ev.cache = {timelines:[tdata.timeline_id], span:ev.span, startdateObj:_.clone(ev.startdateObj), enddateObj:_.clone(ev.enddateObj)}
										
					if (!ev.icon || ev.icon === "none") {
						ev.icon = "";
					}  else {
						ev.icon = ev.icon;
					}
					
					
					if ((!isNaN(ev.startdateObj.sec))&&(!isNaN(ev.enddateObj.sec))){
									
						dhash["all"].push(id);
						
						var uxl = tg_units.length;
						for (var ux = 0; ux < uxl; ux++) {
							unit = tg_units[ux];
							///// DATE HASHING in action 
							ser = TG_Date.getTimeUnitSerial(ev.startdateObj, unit);
							if (dhash[unit][ser] !== undefined) {
								var shash = dhash[unit][ser];
								if (_.indexOf(shash, id) === -1) {
									dhash[unit][ser].push(id);
								}
							} else {
								// create the array
								dhash[unit][ser] = [id];
							}
							/////////////////////////////
						} 
						
						ev.mediator = MED;
			
						/////////////////////////////////
						
						if (!MED.eventCollection.get(id)) {
						
							ev.timelines = [tdata.timeline_id];
						
							var new_model = new tg.TG_Event(ev);
							// model is defined in the eventCollection
							// we just need to add the raw object here and it
							// is "vivified", properties set, etc
							MED.eventCollection.add(new_model);
						
						} else {
							
							// trusting here that this is a true duplicate!
							// just needs to be associated with the timeline
							var existing_model = MED.eventCollection.get(id);
							existing_model.get("timelines").push(tdata.timeline_id);
	
						}
						
						
					
					} // end if !NaN
					
					
			
				} // end for: cycling through timeline's events
							
				// cycle through timeline, collecting start, end arrays
				// sort start, select first
				// sor last select last
				// set bounds
								
				var merged = $.merge(tdata.startSeconds,tdata.endSeconds);
				var sorted = _.sortBy(merged, function(g){ return parseInt(g); });

				/// bounds of timeline
				tdata.bounds = {"first": _.first(sorted), "last":_.last(sorted) };
				
				var date_from_sec = TG_Date.getDateFromSec(tdata.bounds.first);
				tdata.focus_date = tdata.focus_date || date_from_sec;
				tdata.focusDateObj = new TG_Date(tdata.focus_date);
				tdata.has_events = 1;
				
			} else {
			
				
				tdata.focus_date = tdata.focus_date || "today";				
				tdata.focusDateObj = new TG_Date(tdata.focus_date);
				tdata.bounds = {"first": tdata.focusDateObj.sec, "last":tdata.focusDateObj.sec + 86400};
				tdata.has_events = 0;
				
			}
			
			
			
			
			
			/* !TODO: necessary to parse this now, or just leave as is? */
			if (tdata.legend.length > 0) {
				//var legend = tdata.legend;
				//for (var i=0; i<legend.length; i++) {
				//	var legend_item = legend[i];
					// debug.log("leg. title:" + legend_item['title'])
				//}
				tdata.hasLegend = true;
			} else {
				tdata.hasLegend = false;
			}
			
			
			/// i.e. expanded or compressed...
			/// ought to be attribute at the timeline level
			/// TODO: create a $.merge for defaults for a timeline
			tdata.display = "expanded";
			
			
			MED.eventCollection.setTimelineHash(tdata.timeline_id, dhash);
			
			// keeping events in eventCollection
			// hashing references to evnet IDs inside the date hash
			delete tdata.events;

			return tdata;
		
		},
		
		initialize: function(attrs) { 
			var processed = this._chewTimeline(attrs);
			
			this.set(processed);
			
			this.bind("change", function() {
  				// debug.log("changola");
			});
		}
	
	});
	

})(timeglider);















