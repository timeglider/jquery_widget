/*
 * Timeglider for Javascript / jQuery 
 * http://timeglider.com/jquery
 *
 * Copyright 2011, Mnemograph LLC
 * Licensed under Timeglider Dual License
 * http://timeglider.com/jquery/?p=license
 *
 */


(function(tg){


tg.TG_TimelineView = Backbone.View.extend({

    tagName:  "div",

    template: "",

    events: {
      "click .timeline-title" : "titleClick",
    },


    initialize: function() {
      // this.model.bind('change', this.render, this);
      // this.model.bind('destroy', this.remove, this);
    },


    render: function() {
    		var id = this.model.get(id);
    		var title = this.model.get("title")
       		// debug.log("timeline model::::::", );
    	
      	$(this.el)
      			.html("<div class='titleBar'><div class='timeline-title'>"
			 	+ title + "<div class='tg-timeline-env-buttons'>"
			 	+ "<span class='timeline-info'>info</span>"
			 	+ "<span class='tg-timeline-legend-bt'>legend</span>"
			 	+ "<span class='expand-collapse'>expand/collapse</span>" 
			 	+ "</div></div></div></div>")
			 	.addClass("tg-timeline-envelope")
			 	.attr("id", id);
   
      	return this;
    },


    setText: function() {
      /*
      var text = this.model.get('text');
      this.$('.todo-text').text(text);
      this.input = this.$('.todo-input');
      */
    },


    titleClick: function() {
      // $(this.el).addClass("editing");
      alert("TITLE CLICK");
    },


    remove: function() {
      $(this.el).remove();
    },


    //clear: function() {
    //  this.model.destroy();
    //}

});

})(timeglider);