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
*         DEPENDENCIES: timeglider/*
                        rafael.js
                        ba-tinyPubSub
                        jquery
                        jquery ui 
                        jquery.mousewheel
                        jquery.ui.ipad
*
*/



(function($){
  /**
   * The main jQuery widget factory for Timeglider
   *
   *
   */
   
    var timelineView, 
        timelineMediator, 
        tg = timeglider, 
        TG_Date = timeglider.TG_Date;
   
    $.widget( "timeglider.timeline", {
      
	    _tg: this,
      _element: this.element,
      
      // defaults!
      options : { 
        initial_focus:tg.TG_Date.getToday(), 
        editor:'none', 
        min_zoom : 1, 
        max_zoom : 100, 
        show_centerline: true, 
        data_source:"", 
        culture:"en",
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
	      	      
	      // validateOptions should come out as empty string
	      var optionsCheck = timeglider.validateOptions(this.options);
	    
	      if (optionsCheck == "") {
	        
          tg.TG_Date.setCulture(this.options.culture);
    
          timelineMediator = new tg.TG_Mediator(this.options);
          timelineView = new tg.TG_TimelineView(this, timelineMediator);

          // after timelineView is created this stuff can be done
          timelineMediator.setFocusDate(new TG_Date(this.options.initial_focus));
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
      
      zoom : function (n) {
        timelineMediator.zoom(n);
      },

      destroy : function () {
        // anything else?
        $.Widget.prototype.destroy.apply(this, arguments); // default destroy
        $(this.element).html("");
      }
			
}); // end widget process

})(jQuery);
