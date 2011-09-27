#!/bin/sh

#./compile.sh

# This does not include jquery or jquery UI!!

# jquery
# jquery UI

java -jar compiler.jar --js js/underscore-min.js --js js/backbone-min.js --js js/ba-debug.min.js --js js/jquery.tmpl.js --js js/jquery.mousewheel.min.js --js js/jquery.ui.ipad.js --js js/raphael-min.js --js js/jquery.global.js --js js/ba-tinyPubSub.js --js js/timeglider/TG_Date.js --js js/timeglider/TG_Org.js --js js/timeglider/TG_Timeline.js  --js js/timeglider/TG_TimelineView.js --js js/timeglider/TG_Mediator.js --js js/timeglider/timeglider.timeline.widget.js --js_output_file js/timeglider-0.1.0.min.js