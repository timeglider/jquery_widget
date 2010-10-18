

(function($){

  $.fn.timegliderImpSizer = function(paramObj) {
	
    var settings = $.extend({},{event_selector_class: ".ev"},  paramObj);
	var epX, epY, selID, selVal, initSize, $sel;
	var selectClass = settings.event_selector_class;

	function cancel () {
		// cancel this shit
		$sel.css("font-size",initSize); 
		close();
	}
	
	function close() {
		$("#Timeglider_rzBox").css({"left":0, "top":"-500px"});
	}
	
	function setImportanceValue() {
		output("selID:" + selID + "...selVal:" + selVal);
		close();
	}

	var resizeHtml = "<div id='Timeglider_rzBox' class='shadow'><div class='closeBt roundedSmall' id='Timeglider_rzClose'>x</div><div id='Timeglider_rzPntr'>▲</div><div id='Timeglider_rzVal'>0</div><div id='Timeglider_rzSlider'></div><div class='okBt roundedSmall' id='Timeglider_rzOk'>OK</div></div>";
	$("body").append(resizeHtml);		
	$("#Timeglider_rzClose").live("click", function() { cancel(); });
	$("#Timeglider_rzOk").live("click", function() { setImportanceValue(); });
	
	$("#Timeglider_rzSlider").slider({ 
		steps:200,
		step:1,
		value:1,
		animate:'fast',
		start: function (e, ui) {
			// show zoom level legend
		},

		stop: function (e, ui) {
			// hide zoom level legend
		},

		slide: function(e,ui){
			if ($sel != undefined) {
			var v = Math.ceil(ui.value);
			$("#Timeglider_rzVal").text(v);
			$sel.css({"font-size":v});
			selVal = v;
			}
		} 

	});

	$(selectClass + " #icon").live("click", function () { 
			var ev = $sel = $(this).parent();
			initSize = ev.css("fontSize");
			selID = ev.attr("id"); output("id:" + selID);
			var pos = ev.position();
			var top = pos.top + ev.outerHeight() + 6;
			var lef = pos.left - 18;
			$("#Timeglider_rzBox").css({"left":lef, "top":top});
			var imp = ev.css("font-size");
			selVal = parseInt(imp.replace("px",""));
			$("#Timeglider_rzSlider").slider({value:selVal});
			$("#Timeglider_rzVal").text(selVal);

	});
	

	/////////////////////
	} // end of fn.timegliderImpsizer
})(jQuery);