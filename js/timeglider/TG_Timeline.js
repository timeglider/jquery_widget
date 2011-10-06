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
		MED;


	tg.TG_EventCollection = Backbone.Collection.extend({
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
		
			if (ev.image) {
			// register image with image collection for gathering sizes.

				var display_class = ev.image_class || "above";

				ev.image = {id: ev.id, src:ev.image, display_class:display_class, width:0, height:0};

				// this will follow up with reporting size in separate "thread"
				this.getEventImageSize(ev.image);
			
				// MED.imagesToSize++;
				
	
			} else {
				ev.image = '';
			}
			
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
			});
		
			imgTesting.onload = delegatr(imgTesting, function () {
				that.get("image").height = this.height;
				that.get("image").width = this.width;
			});
		
			// hoised function here... TODO: move this to utilities
			function delegatr(contextObject, delegateMethod) {
				return function() {
					return delegateMethod.apply(contextObject, arguments);
				}
			};
	
		} // end getEventImageSize

	
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
			"focus_date":"today",
			"timezone":"00:00",
			"title":  "Untitled",
			"events": [],
			"legend": []
		},
		
		// processes init model data, adds certain calculated values
		_chewTimeline : function (tdata) {
		
			// TODO ==> add additional units
			MED = tdata.mediator;
			
			widget_options = MED.options;
			
			var dhash = {
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
			
			var units = TG_Date.units;
			
			tdata.startSeconds = [];
			tdata.endSeconds = [];
			tdata.spans = [];
			tdata.hasImagesAbove = false;
			
			var tzoff = tdata.timezone || "00:00";
			tdata.timeOffset = TG_Date.getTimeOffset(tzoff);
						
			// TODO: VALIDATE COLOR, centralize default color(options?)
			if (!tdata.color) { tdata.color = "#333333"; }			
			
			if (tdata.events.length>0) {
			
				var date, ddisp, ev, id, unit, ser, tWidth;
				var l = tdata.events.length;
			
	
				for(var ei=0; ei< l; ei++) {
				
					/*
				 		We do some pre-processing ** INCLUDING HASHING THE EVENT *
				 		BEFORE putting the event into it's Model&Collection because some 
				 		(processed) event attributes are needed at the timeline level
					*/
			
					ev=tdata.events[ei];
					
					if (ev.map) {
						if (MED.main_map) {
							
							if (timeglider.mapping.ready){
								ev.map.marker_instance = timeglider.mapping.addAddMarkerToMap(ev, MED.main_map);
								debug.log("marker_instance", ev.map.marker_instance);
								
							}
							// requires TG_Mapping.js component
							
						} else {
							debug.log("NO MAIN MAP... BUT LOAD MAPS FOR MODAL");
							// load instance of maps for modal viewing
							tg.googleMapsLoad();
						}
					}
					
					// make sure it has an id!
					if (ev.id) { 
						// TODO :: make sure it's unique... append with timeline id?
						id = ev.id 
					} else { 
						ev.id = id = "anon" + this.anonEventId++; 
					}

					// date_limit is old JSON prop name, replaced by date_display
					
					ddisp = ev.date_display || ev.date_limit || "da";
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


					// TODO: if they're valid!
					if ((ev.enddate) && (ev.enddate !== ev.startdate)){
						ev.enddateObj = new TG_Date(ev.enddate, ev.date_display);
						ev.span=true;
						tdata.spans.push({id:ev.id, start:ev.startdateObj.sec, end:ev.enddateObj.sec});
					} else {
						ev.enddateObj = ev.startdateObj;
						ev.span = false;
					}
					
					
					if (ev.image_class == "above") { 
						tdata.hasImagesAbove = true; 
					}
	
					
					if (!ev.icon || ev.icon === "none") {
						ev.icon = "";
					}  else {
						ev.icon = widget_options.icon_folder + ev.icon;
					}
			
					// for collapsed view and other metrics
					tdata.startSeconds.push(ev.startdateObj.sec);
					tdata.endSeconds.push(ev.enddateObj.sec);

					//// !! TODO VALIDATE DATE respecting startdate, too
					var uxl=units.length;
					for (var ux=0; ux < uxl; ux++) {
						unit = units[ux];
						///// DATE HASHING in action 
						ser = TG_Date.getTimeUnitSerial(ev.startdateObj, unit);
						if (dhash[unit][ser] !== undefined) {
							dhash[unit][ser].push(id);
						} else {
							// create the array
							dhash[unit][ser] = [id];
						}
						/////////////////////////////
					} 
		
		
					/////////////////////////////////
					// Since model is defined in the eventCollection
					// we just need to add the raw object here and it
					// is "vivified"...
					var newEvent = new tg.TG_Event(ev);
					MED.eventCollection.add(newEvent);
					
								
				}// end for: cycling through timeline's events
			
				// adding event secs to catalog of entire timeline
				var fl = timeglider.getLowHigh($.merge(tdata.startSeconds,tdata.endSeconds));
				/// bounds of timeline
				tdata.bounds = {"first": fl.low, "last":fl.high };
			
			} /// end if there are events!
			
			
			
			/* TODO: necessary to parse this now, or just leave as is? */
			if (tdata.legend.length > 0) {
				var legend = tdata.legend;
				for (var i=0; i<legend.length; i++) {
					var legend_item = legend[i];
					// debug.log("leg. title:" + legend_item['title'])
				} 
			}
			
			
			/// i.e. expanded or compressed...
			/// ought to be attribute at the timeline level
			/// TODO: create a $.merge for defaults for a timeline
			tdata.display = "expanded";
			tdata.dateHash = dhash;
			
			// keeping events in the eventCollection
			// hashing references to evnet IDs inside the date hash
			delete tdata.events;
			
			return tdata;
		
		},
		
		
		
		initialize: function(attrs) { 
			var processed = this._chewTimeline(attrs);
			
			this.set(processed);
			
			this.bind("change", function() {
  				debug.log("changola");
			});
		},
		
		
		// TODO: validate event attributes
		validate: function (attrs) {
			// debug.log("validate data:" + attrs.title); 
		
		}
		
		
	
	});
	
	
	
	




})(timeglider);