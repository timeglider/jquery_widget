/*
 * Timeglider for Javascript / jQuery 
 * http://timeglider.com/jquery
 *
 * Copyright 2011, Mnemograph LLC
 * Licensed under the MIT open source license
 * http://timeglider.com/jquery/?p=license
 *
 */
 
/*
*
* Timeline (Backbone Model)
*
*
*/

(function(tg){
  
  var TG_Date = tg.TG_Date,
      $ = jQuery,
      widget_options = {},
      app_mediator;

  // map model onto larger timeglider namespace
  /////////////////////////////////////////////
  tg.TG_Timeline = Backbone.Model.extend({
  
  defaults: {
      "title":  "Untitled",
      "events": [],
      "legend": []
  },
  
  /*
    processes init model data, adds certain calculated values
  
  */
  _chewTimeline : function (tdata) {

    // TODO ==> add additional units
    app_mediator = tdata.mediator;
    widget_options = app_mediator.options;
    
    var dhash                       = {"da":[], "mo":[], "ye":[], "de":[], "ce":[], "thou":[], 
                                        "tenthou":[], "hundredthou":[], "mill":[], "tenmill":[], "hundredmill":[],
                                        "bill":[]};
    var units                       = TG_Date.units; 
    tdata.startSeconds              = [];
    tdata.endSeconds                = [];
    tdata.spans                     = [];
    tdata.hasImagesAbove = false;

    // TODO: VALIDATE COLOR, centralize default color(options?)
    if (!tdata.color) { tdata.color = "#333333"; }

    if (tdata.events) {

      var date, ddisp, ev, id, unit, ser, tWidth;
      var l = tdata.events.length;
     
      
      for(var ei=0; ei< l; ei++) {

        ev=tdata.events[ei];
        // app_mediator.eventPool["ev_" + id] = {image:{}};
        // id = ev.id;
        if (ev.id) { 
          // TODO :: make sure it's unique... append with timeline id?
          id = ev.id 
        } else { 
          ev.id = id = "anon" + this.anonEventId++; 
        }
        
        // April 2011 
        // date_limit is old JSON prop name, replaced by date_display
        ddisp = (ev.date_display || ev.date_limit || "da");
        ev.date_display = ddisp.toLowerCase().substr(0,2);
        
        ev.startdateObj = new TG_Date(ev.startdate, ev.date_display);
        ev.enddateObj = new TG_Date(ev.enddate, ev.date_display);
        
       
        // CHECK VALIDITY OF EACH DATE & MAKE SURE end > start
        //if (TG_Date.isValidDate(ev.startdateObj) != "") {
        //         THROW ERROR, BREAK
        //}

        // default icon
        if (!ev.icon || ev.icon === "none") {
          ev.icon = "";
        }  else {
          ev.icon = widget_options.icon_folder + ev.icon;
        }
            
        ev.titleWidth = tg.getStringWidth(ev.title);
        
        // arrives as just src -- we'll consolidate images props 
        // and gather some new ones (width, height)
        if (ev.image) {
          // register image with image collection for gathering sizes.
          var display_class = ev.image_class || "layout";
          if (ev.image_class == "above") { tdata.hasImagesAbove = true; }
         
          ev.image = {id: ev.id, src:ev.image, display_class:display_class};
          // this will follow up with sizing in separate "thread"
          getEventImageSize(ev.image);
          
          app_mediator.imagesToSize++;
        }
      
         
        // for collapsed view and other metrics
        tdata.startSeconds.push(ev.startdateObj.sec);
        tdata.endSeconds.push(ev.enddateObj.sec);

        // time span?
        if (ev.enddateObj.sec > ev.startdateObj.sec) {
          ev.span = true;
          tdata.spans.push({id:ev.id, start:ev.startdateObj.sec, end:ev.enddateObj.sec});
        } else {
          ev.span = false;
        }
        
        
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
          ///////////////////////////////
        } 
        
        app_mediator.eventPool["ev_" + id] = ev;
        
        }// end cycling through timeline's events

        // adding event secs to catalog of entire timeline
        var allsec = $.merge(tdata.startSeconds,tdata.endSeconds);
        var fl = timeglider.getLowHigh(allsec);
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
    // keeping events in the eventPool [collection]
    // hashing references to evnet IDs inside the date hash
    delete tdata.events;
    return tdata;

  },
  
  
  initialize: function(attrs) { 
    var processed = this._chewTimeline(attrs);
    this.set(processed)
  },
  
  validate: function (attrs) {
    // debug.log("validate data:" + attrs.title); 
    
  }

});

  

function getEventImageSize (img) { 
  
 	  var imgTesting = new Image(),
 	      // ID would be the event ID for the event pool
 	      img_id = img.id,
 	      img_src = imgTesting.src = img.src;
    
    imgTesting.onerror= delegatr(imgTesting, function () {
       	app_mediator.reportImageSize({id:img.id, src:img_src, error:true});
    });
    
   	imgTesting.onload = delegatr(imgTesting, function () {
   	     app_mediator.reportImageSize({id:img_id, src:img_src, width: this.width, height: this.height});
   	});

   	function delegatr(contextObject, delegateMethod) {
   	    return function() {
   	        return delegateMethod.apply(contextObject, arguments);
   	    }
   	};
   	
};

   



})(timeglider);