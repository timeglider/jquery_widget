/*
wicked simple pub-sub
*/

(function(tg){
  
tg.Signal = function (sender) {
	this._sender = sender;        // SINGLE SENDER
	this._listeners = [];		  // MULTIPLE LISTENERS
};

tg.Signal.prototype = {
	tuneIn : function (listener) {
		this._listeners.push(listener);
	},
	broadcast : function (args) {
		for (var i = 0; i < this._listeners.length; i++) {
			this._listeners[i](this._sender, args);
		}
	}
}; 

})(timeglider);