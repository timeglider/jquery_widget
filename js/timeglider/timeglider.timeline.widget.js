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
        display_zoom_level:true,
        event_modal:{href:'', type:'default'}
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
	    
	    
      /** 
      *********  PUBLIC METHODS ***************
      */
      
      goTo : function (d, z) {
        timelineMediator.gotoDateZoom(d,z);
      },
      
      
      /**
      * zoom
      * zooms the timeline in or out a specified amount, often 1 or -1
      *
      * @param n {number|string}
      *          numerical: -1 (or less) for zooming in, 1 (or more) for zooming out
      *          string:    "in" is the same as -1, "out" the same as 1
      */
      zoom : function (n) {
        var n = 0;
        switch(n) {
          case "in": n = -1; break;
          case "out": n = 1; break;
        }
        
        if (n > 99 || n < -99) { return false; }
        
        timelineMediator.zoom(n);
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
        timelineView.setPanButton(sel, _vel);
      },


      destroy : function () {
        $.Widget.prototype.destroy.apply(this, arguments);
        $(this.element).html("");
      }
			
}); // end widget process

})(jQuery);
