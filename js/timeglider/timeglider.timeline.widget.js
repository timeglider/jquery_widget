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

  String.prototype.trim = function() {
  	return this.replace(/^\s+|\s+$/g,"");
  }
  String.prototype.ltrim = function() {
  	return this.replace(/^\s+/,"");
  }
  String.prototype.rtrim = function() {
  	return this.replace(/\s+$/,"");
  }
  
  /* TODO Use this to set options defaults, too */ 

    function getToday() { var d = new Date(); return d.format('c'); }
      
    $.widget( "timeglider.timeline", {
      
	    _tg: this,
      _element: this.element,
      
      options : { 
        initial_focus:getToday(), 
        editor:'none', 
        min_zoom : 1, 
        max_zoom : 100, 
        initial_zoom :20, 
        show_centerline: true, 
        data_source:"", 
        basic_fontsize:12, 
        mouse_wheel: "zoom", 
        initial_timeline_id:'',
        icon_folder:'js/timeglider/icons/'
      },

      _create : function () {
        // if a table exists, convert table data... and store it as one timeline...
        this._id = $(this.element).attr("id"); 
        var MAIN_TEMPLATE = "<div class='timeglider-container'>"+
                              "<div class='timeglider-centerline'></div>"+
                              "<div class='timeglider-truck'>"+
                                "<div class='timeglider-ticks'>"+
                                  "<div class='timeglider-handle'></div>"+
                                "</div>"+
                              "</div>"+
                              "<div class='timeglider-slider-container'>"+
                                "<div class='timeglider-slider'></div>"+
                              "</div>"+
                              "<div class='timeglider-timeline-menu'>"+
                                "<div class='timeglider-timeline-menu-handle'>timelines >></div>"+
                                "<h3>timelines</h3><ul></ul>"+
                              "</div>"+
                              "<div class='timeglider-footer'>Timeglider jQuery Widget"+
                                "<div class='timeglider-filter-bt'><img title='filter' src='js/timeglider/buttons/filter.png'></div>"+
                              "</div><div class='timeglider-filter-box'></div>"+
                            "</div><span id='TimegliderMeasureSpan'></span>";
                            
        this.element.html(MAIN_TEMPLATE);
		
	    },
	
	
	    _init : function () {
	
	      var optionsCheck = timeglider.validateOptions(this.options);
	      
	      if (optionsCheck == "") {
	      
          var timelineMediator = new timeglider.TimegliderMediator(this.options);
          timelineMediator.setFocusDate(timeglider.TGDate.makeDateObject(this.options.initial_focus));
          var timelineView = new timeglider.TimegliderTimelineView(this, timelineMediator);

          // load timelines
          timelineMediator.loadTimelineData(this.options.data_source);
          timelineView.toggleMenu();
        
        } else {
          alert("There's a problem with your widget settings:" + optionsCheck);
        }

	    },

      destroy : function () {
        // !TODO
      },
	
      
      doSomething : function () {
        debug.log("this is the original constructor");
      }

			
}); // end widget process



// models for extending the first widget
/*

var _newDoSomething = $.tg.timeglider.prototype._doSomething;
$.tg.timeglider.prototype._doSomething = function() {
    _newDoSomething.call(this);
	//alert('____and do something else!');
};



  $.widget("timeglider.timeline2", $.timeglider.timeline, {
	  
	  options: {
	    
	  },
	  
	  doSomething : function () {
		  console.log("this is the timeline2 constructor");
	  }
	  
  });
*/



	
})(jQuery);



/* GLOBAL */
function output(arg, section) {
  $("#" + section).text(arg);
};

