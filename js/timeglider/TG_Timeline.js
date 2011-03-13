/*
*
* Timeline (Backbone Model)
*
*
*/

(function(tg){
  
  var TG_Date = tg.TG_Date,
      $ = jQuery,
      widget_options = {};

  // map model onto larger timeglider namespace
  /////////////////////////////////////////////
  tg.TG_Timeline = Backbone.Model.extend({
  
  defaults: {
      "title":  "Untitled",
      "events": []
  },
  
  /*
    processes init model data, adds certain calculated values
  
  */
  _chewTimeline : function (tdata) {

    // TODO ==> add additional units
    var app_mediator = tdata.mediator;
    widget_options = app_mediator.options;
    
    var dhash                       = {"da":[], "mo":[], "ye":[], "de":[], "ce":[], "thou":[], 
                                        "tenthou":[], "hundredthou":[], "mill":[], "tenmill":[], "hundredmill":[],
                                        "bill":[]};
    var units                       = TG_Date.units; 
    tdata.startSeconds              = [];
    tdata.endSeconds                = [];
    tdata.spans                     = [];

    // TODO: VALIDATE COLOR, centralize default color(options?)
    if (!tdata.color) { tdata.color = "#333333"; }

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
        
        //XX var startEnd = TG_Date.validateEventDates(ev.startdate,ev.enddate);

        // This ought to be separated into two

        ev.startdateObj = new TG_Date(ev.startdate);
        ev.enddateObj = new TG_Date(ev.enddate);
       
        // CHECK VALIDITY OF EACH DATE & MAKE SURE end > start
        //if (TG_Date.isValidDate(ev.startdateObj) != "") {
        //         THROW ERROR, BREAK
        //}

        
        // default icon
        if (!ev.icon || ev.icon === "none") {
          ev.icon = "";
        }  else {
          ev.icon = widget_options.icon_folder + "/" + ev.icon;
        }
            
        ev.titleWidth = tg.getStringWidth(ev.title);
        
        if (ev.image) {
          if (!ev.image_class) { 
            ev.image_class = "layout"; 
            // get image size?
            ev.image_size = tg.getImageSize(ev.image);
            }
        }
      
        // microtimeline for collapsed view and other metrics
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
        // add*modify indexed pool
        
        // PROBLEM HERE --- MAKES THIS HAVE TO BE
        // INSIDE THIS TG_Mediator CLOSURE...
        // HOW TO PASS IN THE mediator environment
        app_mediator.eventPool["ev_" + id] = ev;

        }// end cycling through timeline's events

        // adding event secs to catalog of entire timeline
        var allsec = $.merge(tdata.startSeconds,tdata.endSeconds);
        var fl = timeglider.getLowHigh(allsec);
        /// bounds of timeline
        tdata.bounds = {"first": fl.low, "last":fl.high };

    } /// end if there are events!

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


})(timeglider);