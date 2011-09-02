
TIMEGLIDER jQUERY WIDGET/PLUGIN


Welcome to the nascent Timeglider jQuery widget project. Timeglider is a web-based timeline application currently running in Flash: this is the transition to a free viewer module. Eventually all Flash-based pieces of Timeglider will be replaced with JS versions.

Our goal here is to create a lightweight, extensible time-viewer-explorer which can zoom/pan and otherwise explore future/past events easily. Timeglider.com provides an authoring environment for creating hosted timelines; this plug in is meant for enterprise media, medical software, private legal workspaces, etc. all of which may have APIs of their own.

LICENSE
IMPORTANT :: PLEASE NOTE :: As of Sept. 1, 2011, the Timeglider javascript plugin is no longer available under or according to the MIT License. Please read about our license arrangements at http://timeglider.com/jquery?p=license

TIMEGLIDER DATA FORMAT
See a sample json file @ json_tests/idaho.json.


ROADMAP (in order of rough priority)


DATE FORMATTING & LOCALIZATION
Formatting the date and adjusting to a timezone. Generally, when
data is imported, times will be translated to GMT time then retranslated
to a users default or selected timezone. We're going to use the 
jquery-glob (https://github.com/timeglider/jquery-glob) system for
localization of date and number formats (as soon as we figure out how
to reconcile our own TG_Date object with the more limited JS Date.)


SEARCH & LEGEND
--- currently, one can filter to include &or exclude words using comma separated inputs. We're working
on a legend system, so that icons can be given titles and the timeline filtered by them. 


EVENT ATTRIBUTES 
"html" : being able to use html as the event, so if there's a value in an
"html" (json) attribute, that will get painted in lieu of the default
icon + title, etc.  This would have the requirement of being a div 
element. A class could be added, so that the "html" attribute might look
like this:
"<div class='tg-decade-block'><img src='/img/the-eighties'></div>"

	
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


NOTE ON: EVENT IMPORTANCE
Events each have an importance value (if missing, importance will be set to 20). This is the key to structuring a timeline that does not "blow out". For example, applying a relatively low importance value (say, 10) to an event like "lunch with Don" means that it will fade from view by the time you're at a zoom-level of 30 --- a wider scope where you're looking across 10 years. 
