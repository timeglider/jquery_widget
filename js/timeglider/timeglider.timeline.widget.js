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

(function($){
  /**
   * The main jQuery widget factory for Timeglider
   *
   *
   */
    $.widget( "timeglider.timeline", {
      
	    _tg: this,
      _element: this.element,
      
      
      options : { 
        initial_focus:timeglider.TGDate.getToday(), 
        editor:'none', 
        min_zoom : 1, 
        max_zoom : 100, 
        initial_zoom :20, 
        show_centerline: true, 
        data_source:"", 
        basic_fontsize:12, 
        mouse_wheel: "zoom", 
        initial_timeline_id:'',
        icon_folder:'js/timeglider/icons/',
        show_footer:true
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
                              "<div class='timeglider-centerline'></div>"+
                              "<div class='timeglider-truck' id='tg-truck'>"+
                                "<div class='timeglider-ticks'>"+
                                  "<div class='timeglider-handle'></div>"+
                                "</div>"+
                              "</div>"+
                              "<div class='timeglider-slider-container'>"+
                                "<div class='timeglider-slider'></div>"+
                              "</div>"+
                              "<div class='timeglider-footer'>"+
                              "<div class='timeglider-logo'></div>"+                      
                              "<img class='timeglider-filter-bt' title='filter' src='js/timeglider/buttons/filter.png'>"+
                              "<img class='timeglider-tools-bt' title='settings' src='js/timeglider/buttons/tools.png'>"+
                              "<img class='timeglider-list-bt' title='timelines' src='js/timeglider/buttons/list.png'>"+  
                              "</div>"+
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
	      
          var timelineMediator = new timeglider.TimegliderMediator(this.options);
          timelineMediator.setFocusDate(timeglider.TGDate.makeDateObject(this.options.initial_focus));
          var timelineView = new timeglider.TimegliderTimelineView(this, timelineMediator);

          // load timelines
          timelineMediator.loadTimelineData(this.options.data_source);
        
        } else {
          alert("There's a problem with your widget settings:" + optionsCheck);
        }
      
	    },

      destroy : function () {
        // anything else?
        $.Widget.prototype.destroy.apply(this, arguments); // default destroy
      }

			
}); // end widget process


	
})(jQuery);
