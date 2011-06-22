/**
* @license
* jQuery Tiny Pub/Sub - v0.3pre - 11/4/2010
* http://benalman.com/
*
* Copyright (c) 2010 "Cowboy" Ben Alman
* Dual licensed under the MIT and GPL licenses.
* http://benalman.com/about/license/
*/

(function($){
  
  var o = $({});
  
  $.subscribe = function(){
    o.bind.apply( o, arguments );
  };
  
  $.unsubscribe = function(){
    o.unbind.apply( o, arguments );
  };
  
  $.publish = function(){
    o.trigger.apply( o, arguments );
  };
  
})(jQuery);
