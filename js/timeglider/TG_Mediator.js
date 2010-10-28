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

/*******************************
TIMELINE MEDIATOR
handles timeline behavior, 
reflects state back to view
********************************/

// MOVE THIS TO Models
function TimegliderTimeline (data) {
		return data;
	}


function TimegliderMediator () {
	
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
	
	this.eventPool = [], 
  this.timelinePool = {};
  
		
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
			var units = TGDate.units; 
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
					var startEnd = TGDate.validateEventDates(ev.startdate,ev.enddate);
					
					ev.startdateObj = startEnd.s; // TGDate.makeDateObject(ev.startdate);
					ev.enddateObj = startEnd.e; // TGDate.makeDateObject(ev.enddate);
					
					// this gets the title width at 12px
					ev.titleWidth = getStringWidth(ev.title) + 20;
				
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
						ser = TGDate.getTimeUnitSerial(ev.startdateObj, unit);
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
				this.eventPool["ev_" + id] = ev;
				
			}// end cycling through timeline's events
			
			// adding event secs to catalog of entire timeline
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
		this.timelinePool[obj.id] = obj;	
		this.timelineListChangeSignal.broadcast();
	},
	
	///  end of methods that need to go into (backbone) data model
	///////////////////////////
	
	/* TODO: turn to $each, adding to activeTimelines:
	         i.e. could be more than one 
	*/
	setInitialTimelines : function () {
		var me = this;
		var tid = this.initial_timeline_id;
		if (tid) {
			this.timelinePool[tid].top = 200;
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
			fd.mo_num = TGDate.getMonthNum(fd); 
			fd.rd = TGDate.getRataDie(fd);      
			fd.sec = TGDate.getSec(fd);
			
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
			obj.serial = TGDate.getTimeUnitSerial(focusDate, obj.unit);
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
		
		var lt = this.timelinePool[id];
		var ia = $.inArray(id, this._activeTimelines);

		if (ia == -1) {
			// not active ---- bring it on and focus to it
			this._activeTimelines.push(id);
		
			// setting FD does NOT refresh automatically
			this.setFocusDate(TGDate.makeDateObject(lt.focus_date));
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
