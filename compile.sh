#!/bin/sh

#./compile.sh

# This does not include jquery or jquery UI!!

# jquery
# jquery UI

java -jar compiler.jar --js js/underscore-min.js --js js/backbone-min.js --js js/jquery.tmpl.js --js js/ba-debug.min.js --js js/ba-tinyPubSub.js --js js/jquery.mousewheel.min.js --js js/jquery.ui.ipad.js --js js/jquery.global.js --js js/timeglider/TG_Date.js --js js/timeglider/TG_Org.js --js js/timeglider/TG_Timeline.js --js js/timeglider/TG_TimelineView.js --js js/timeglider/TG_Mediator.js --js js/timeglider/timeglider.timeline.widget.js --js_output_file js/timeglider-0.1.4.min.js

# version 0.1.1 added transValidation methods to TG_Date

# version 0.1.2 "fixed" IE7 title tracking, changed event hash to eventCollection object
#               took out of core event.icon property, wired it into TG_Org from tg.

# version 0.1.3 removed Raphael, sharpened image layout

# version 0.1.4 [2012-06-06] modal positioning improved; new TG_Org that has better
#               collision detection; 
#               [2012-06-16] date display set to bottom; subtle design changes