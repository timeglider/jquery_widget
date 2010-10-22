
TIMEGLIDER jQUERY WIDGET/PLUGIN


Welcome to the nascent Timeglider jQuery widget project. Timeglider is a web-based timeline application currently running in Flash: this is the transition to a free viewer module.

Project director: 
Michael Richardson
michael@timeglider.com

Our goal here is to create a lightweight, extensible time-viewer-explorer which can zoom/pan and otherwise explore future/past events easily. Timeglider.com provides an authoring environment for creating hosted timelines; this plug in is meant for enterprise media, medical software, private legal workspaces, etc. all of which may have APIs of their own such that they can output a JSON file.

TIMEGLIDER DATA FORMAT
See a sample json file @ json_tests/idaho.json.

IMPORTANCE
Events each have an importance value (if missing, importance will be set to 20). This is the KEY to structuring a timeline which does not "blow out". 


SPECIFIC UI/FUNCTIONALITY GOALS

SEARCH:
--- ability to search timelines and have a filtered view

FILTER
--- by event tags, legend/icons

MODALS
--- event details with a few different styles:
    -- sidebar
    -- pointing box with scrolling description, either in addition 
       to existing title, or as a kind of transformation which bumps
       other things to the side so that nothing is obscured
    -- possibility that above descriptive state could be opened on
       loading

ICONS/LEGEND
--- workflow with Mac-like + below a list, from which icons can be dragged 
	out for new events
	
IMAGES
--- detecting clusters of images (all on same day, i.e. iPhoto "events") 
       and turning them into albums
--- otherwise organizing images clearly, preventing spikes/lumps
--- allowing some events to be image-text oriented with pre-defined layouts
    like text-flow around the image initially expanded

AUDIO/VIDEO/FILES
--- more options inside of event editor, but also allowing for possibilities
    in advanced implementations.

PRINTING
--- be able to print any range of time (sweep might be optionally huge)
--- export to PDF (see http://www.highcharts.com/ 's PDF export)

IMPORT PARSERS
--- RSS, flickr, twitter, facebook, semantic "scraping" of dates on any webpage 
