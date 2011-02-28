/*
*         Timeglider jQuery plugin Timeglider
*         jquery.timeglider.js
*         http://timeglider.com/jquery
*
*         © 2010 Timeglider / Mnemograph LLC
*         Author: Michael Richardson
*         Licences are still to be determined : )
*
*         DEPENDENCIES: timeglider/*
                        rafael.js
                        ba-tinyPubSub
                        jquery
                        jquery ui (full)
                        jquery.mousewheel
                        jquery.ui.ipad
*
*/



/* TESTING CALLBACKS FROM EVENTS "callback" property */
function doSomething (args) { 
  alert("global doSomething: " + args.title);
}

window.uniqueNamespace = uniqueNamespace  = {
   good: function (args) { 
    alert("global.doSomething good: " + args.title);
  },
   okay : function () {
    debug.log("okay");
  }
  
};




(function($){
  /**
   * The main jQuery widget factory for Timeglider
   *
   *
   */
   
   /* here's how to extend the jquery.glob object */
   /*
   var dlet = {let : ["S", "M", "T", "W", "T", "F", "S"]};
   $.extend($.cultures.en.calendars.standard.days, dlet);
   debug.log(jQuery.format(new Date(1955,10,5,11,12,13), "X"));
   */
   
    var timelineView, timelineMediator;
   
    $.widget( "timeglider.timeline", {
      
	    _tg: this,
      _element: this.element,
      
      // defaults!
      options : { 
        initial_focus:timeglider.TGDate.getToday(), 
        editor:'none', 
        min_zoom : 1, 
        max_zoom : 100, 
        show_centerline: true, 
        data_source:"", 
        basic_fontsize:12, 
        mouse_wheel: "zoom", 
        initial_timeline_id:'',
        icon_folder:'js/timeglider/icons/',
        show_footer:true,
        display_zoom_level:true
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
        var MAIN_TEMPLATE = "<div class='timeglider-container'>"+
                              
                              "<div class='timeglider-loading'>loading</div>"+
                              "<div class='timeglider-centerline'></div>"+
                              "<div class='timeglider-truck' id='tg-truck'>"+
                                "<div class='timeglider-ticks'>"+
                                  "<div class='timeglider-handle'></div>"+
                                "</div>"+
                              "</div>"+
                              "<div class='timeglider-slider-container'>"+
                                  "<div class='timeglider-slider'></div>"+
                                  "<div class='timeglider-pan-buttons'>"+
                                  "<div class='timeglider-pan-left'></div><div class='timeglider-pan-right'></div>"+
                                  "</div>"+
                              "</div>"+
                              "<div class='timeglider-footer'>"+
                              "<div class='timeglider-logo'></div>"+                      
                              "<img class='timeglider-filter-bt' title='filter' src='js/timeglider/buttons/filter.png'>"+
                              "<img class='timeglider-tools-bt' title='settings' src='js/timeglider/buttons/tools.png'>"+
                              "<img class='timeglider-list-bt' title='timelines' src='js/timeglider/buttons/list.png'>"+  
                              "</div>"+
                              "<div class='timeglider-event-hover-info'></div>"+
                            "</div><span id='timeglider-measure-span'></span>";
                                   
        this.element.html(MAIN_TEMPLATE);
		
	    },
	
	    /**
       * takes the created template and inserts functionality
       *  from Mediator and View constructors
       *
       *
       */
	    _init : function () {
	      	      
	      // should come out as empty string
	      var optionsCheck = timeglider.validateOptions(this.options);
	    
	      if (optionsCheck == "") {
	      
          timelineMediator = new timeglider.TimegliderMediator(this.options);
          timelineView = new timeglider.TimegliderTimelineView(this, timelineMediator);

          // after timelineView is created this stuff can be done
          timelineMediator.setFocusDate(timeglider.TGDate.makeDateObject(this.options.initial_focus));
          timelineMediator.loadTimelineData(this.options.data_source);
        
        } else {
          alert("Rats. There's a problem with your widget settings:" + optionsCheck);
        }
      
	    },
	    
	    
      /* PUBLIC METHODS */
  
      gotoDate : function (d) {
        debug.log("d:" + d);
        timelineMediator.gotoDate(d);
      },
      
      gotoDateZoom : function (d, z) {
        debug.log("d:" + z);
        timelineMediator.gotoDateZoom(d,z);
      },
    
  
      destroy : function () {
        // anything else?
        $.Widget.prototype.destroy.apply(this, arguments); // default destroy
        $(this.element).html("");
      }
			
}); // end widget process



	
})(jQuery);
