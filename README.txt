
TIMEGLIDER jQUERY WIDGET/PLUGIN


Welcome to the nascent Timeglider jQuery widget project. Timeglider is a web-based timeline application currently running in Flash: this is the transition to a free viewer module. Eventually all Flash-based pieces of Timeglider will be replaced with JS versions.

Project director: 
Michael Richardson
michael@timeglider.com

Our goal here is to create a lightweight, extensible time-viewer-explorer which can zoom/pan and otherwise explore future/past events easily. Timeglider.com provides an authoring environment for creating hosted timelines; this plug in is meant for enterprise media, medical software, private legal workspaces, etc. all of which may have APIs of their own.

LICENSE
As of yet, there is no license established for this widget. We at Timeglider HQ need to do some due diligence about how to frame a license that's permissive with all manner of small-scale, educational, non-profit, and non-commercial use, and yet defined for commercial use. Our plan is to give 20% of all commercial license fees to jQuery. 

TIMEGLIDER DATA FORMAT
See a sample json file @ json_tests/idaho.json.

IMPORTANCE
Events each have an importance value (if missing, importance will be set to 20). This is the key to structuring a timeline that does not "blow out". For example, applying a relatively low importance value (say, 10) to an event like "lunch with Don" means that it will fade from view by the time you're at a zoom-level of 30 --- a wider scope where you're looking across 10 years. 


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
