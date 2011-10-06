/*
 * Timeglider for Javascript / jQuery 
 * http://timeglider.com/jquery
 *
 * Copyright 2011, Mnemograph LLC
 * Licensed under Timeglider Dual License
 * http://timeglider.com/jquery/?p=license
 *
 */


// initial declaration of timeglider object
timeglider = window.timeglider || {version:"0.1.0"};

/*
*  TG_Date
* 
*  dependencies: jQuery, jQuery.global
*
* You might be wondering why we're not extending JS Date().
* That might be a good idea some day. There are some
* major issues with Date(): the "year zero" (or millisecond)
* in JS and other date APIs is 1970, so timestamps are negative
* prior to that. JS's Date() can't handle years prior to
* -271820, so some extension needs to be created to deal with
* times (on the order of billions of years) existing before that.
*
* This TG_Date object also has functionality which  goes hand-in-hand
* with the date hashing system: each event on the timeline is hashed
* according to day, year, decade, century, millenia, etc
*
*/

/*

IMPORTED DATE STANDARD

http://www.w3.org/TR/NOTE-datetime
"a profile of" ISO 8601 date format

Complete date plus hours, minutes and seconds:
YYYY-MM-DDThh:mm:ssTZD (eg 1997-07-16T19:20:30+01:00)

Acceptable:
YYYY
YYYY-MM
YYYY-MM-DD
YYYY-MM-DDT13
YYYY-MM-DD 08:15 (strlen 16)
YYYY-MM-DD 08:15:30 (strlen 19)
(above would assume either a timeline-level timezone, or UTC)

containing its own timezone, this would ignore timeline timezone
YYYY-MM-DD 08:15:30-07:00
   

*/

(function(tg){
  
	var tg = timeglider, $ = jQuery;
  
	// caches speed up costly calculations
	var getRataDieCache = {},
		getDaysInYearSpanCache = {},
		getBCRataDieCache = {},
		getDateFromRDCache = {},
		getDateFromSecCache = {};
  
        
	tg.TG_Date = function (strOrNum, date_display, offSec) {

		var dateStr, isoStr, gotSec,
    		offsetSeconds = offSec || 0;
   
   
   		// Jim, we've got seconds coming in!
		if (typeof(strOrNum) == "number") {
      	  
			dateStr = isoStr = TG_Date.getDateFromSec(strOrNum);
			gotSec = (strOrNum + offsetSeconds);
			
		} else {
			// string -- floating dates like "today"
			if (strOrNum == "today") {
				strOrNum = TG_Date.getToday();
			} 
			dateStr = isoStr = strOrNum;
		}
  
  
  		if (isValidDateString(dateStr) === false) {
			return {error:"invalid date"};
			/// it's valid
		} else {
	    	
	    	      		
      		var parsed =  TG_Date.parse8601(dateStr);
      		
      		if (parsed.tz_ho) {
      			// this is working ------ timezones in the string translate correctly
      			parsed = TG_Date.toFromUTC(parsed, {hours:parsed.tz_ho, minutes:parsed.tz_mi}, "to")
      		}
      					
			$.extend(this,parsed);

      		// SERIAL day from year zero
      		this.rd  = TG_Date.getRataDie(this);
    
      		// SERIAL month from year 0
      		this.mo_num = getMoNum(this);
      		
      		// SERIAL second from year 0
      		this.sec = gotSec || getSec(this);
      		
      		this.date_display = (date_display) ? (date_display.toLowerCase()).substr(0,2) : "da";
			
			// TODO: get good str from parse8601  
      		this.dateStr = isoStr;
  		} 
		        
        // return this;

  } // end TG_Date Function



  var TG_Date = tg.TG_Date;

  /*
  *  getTimeUnitSerial
  *  gets the serial number of specified time unit, using a ye-mo-da date object
  *  used in addToTicksArray() in Mediator
  *
  *  @param fd {object} i.e. the focus date: {ye:1968, mo:8, da:20}
  *  @param unit {string} scale-unit (da, mo, ye, etc)
  *
  *  @return {number} a non-zero serial for the specified time unit
  */
  TG_Date.getTimeUnitSerial = function (fd, unit) {
      var ret = 0;
      
  		switch (unit) {
  			case "ye": ret = fd.ye; break;
  			// set up mo_num inside TG_Date constructor
  			case "mo": ret =  fd.mo_num; break;
  			case "da": ret =  fd.rd; break;
  			case "de": ret =  Math.floor(fd.ye / 10); break;
  			case "ce": ret =  Math.floor(fd.ye / 100); break;
  			case "thou": ret =  Math.floor(fd.ye / 1000); break;
  			case "tenthou": ret =  Math.floor(fd.ye / 10000); break;
  			case "hundredthou": ret =  Math.floor(fd.ye / 100000); break;
  			case "mill": ret =  Math.floor(fd.ye / 1000000); break;
  			case "tenmill": ret =  Math.floor(fd.ye / 10000000); break;
  			case "hundredmill": ret =  Math.floor(fd.ye / 100000000); break;
  			case "bill": ret =  Math.floor(fd.ye / 1000000000); break;
  		}
  		return ret;
  };



  TG_Date.getMonthDays = function(mo,ye) {
  	if ((TG_Date.isLeapYear(ye) == true) && (mo==2)) {
  		return 29;
  	} else  {
  		return TG_Date.monthsDayNums[mo];
  	}
  };


	TG_Date.twentyFourToTwelve = function (e) {
	
		var dob = {};
		dob.ye = e.ye;
		dob.mo = e.mo;
		dob.da = e.da;
		dob.ho = e.ho;
		dob.mi = e.mi;
		dob.ampm = "am";
	
		if (e.ho) {
			if (e.ho >= 12) {
				dob.ampm = "pm";
				if (e.ho > 12) {
					dob.ho = e.ho - 12;
				} else {
					dob.ho = 12;
				}
			} else if (e.ho == 0) {
				dob.ho = 12;
				dob.ampm = "am";
			} else {
				dob.ho = e.ho;
			}
		} else {
			dob.ho = 12;
			dob.mi = 0;
			dob.ampm = "am";
		}
	
		return dob;
	};
	
	
  /*
  * RELATES TO TICK WIDTH: SPECIFIC TO TIMELINE VIEW
  */
  TG_Date.getMonthAdj = function (serial, tw) {
  	var d = TG_Date.getDateFromMonthNum(serial);
  	var w;
  	switch (d.mo) {
		
  		// 31 days
  		case 1: case 3: case 5: case 7: case 8: case 10: case 12:
  			var w = Math.floor(tw + ((tw/28) * 3));
  			return {"width":w, "days":31};
  		break;

  		// Blasted February!
  		case 2:
  		if (TG_Date.isLeapYear(d.ye) == true) {
  			w = Math.floor(tw + (tw/28));
  			return {"width":w, "days":29};
  		} else {
  			return {"width":tw, "days":28};
  		}
  		break;
		
  		default: 
  		// 30 days
  		w = Math.floor(tw + ((tw/28) * 2));
  		return {"width":w, "days":30};
  	}
	
	
  };


  /*
  * getDateFromMonthNum
  * Gets a month (1-12) and year from a serial month number
  * @param mn {number} serial month number
  * @return {object} ye, mo (numbers)
  */
  TG_Date.getDateFromMonthNum = function(mn) {

  	var rem = 0;
  	var ye, mo;

  	if (mn > 0) {
  		rem = mn % 12;

  		if (rem == 0) { rem = 12 };

  		mo = rem;
  		ye = Math.ceil(mn / 12);

  	} else {
  		// BCE!
  		rem = Math.abs(mn) % 12;
  		mo = (12 - rem) + 1;
  		if (mo == 13) mo = 1;
  		// NOYEARZERO problem: here we would subtract
  		// a year from the results to eliminate the year 0
  		ye =  -1 * Math.ceil(Math.abs(mn) / 12); // -1

  		}
		
  	return {ye:ye, mo:mo};
  };



  /*
  * getMonthWidth
  * Starting with a base-width for a 28-day month, calculate
  * the width for any month with the possibility that it might
  * be a leap-year February.
  *
  * @param mo {number} month i.e. 1 = January, 12 = December
  * @param ye {number} year
  *
  * RELATES TO TICK WIDTH: SPECIFIC TO TIMELINE VIEW
  */
  TG_Date.getMonthWidth = function(mo,ye,tickWidth) {

  	var dayWidth = t / 28;
  	var ad;
  	var nd = 28;

  	switch (mo) {
  		case 1: case 3: case 5: case 7: case 8: case 10: case 12: ad = 3; break;
  		case 4: case 6: case 9: case 11: ad = 2; break;
  		// leap year
  		case 2: if (TG_Date.isLeapYear(yr) == true) { ad = 1; } else { ad=0; }; break;
		
  	}

  	var width = Math.floor(tickWidth + (dayWidth * ad));
  	var days = nd + ad;

  	return {width:width, numDays:days};
  };




  TG_Date.getToday = function () {
      var d = new Date(); 
      return d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate() + " " + d.getHours() + ":" + d.getMinutes() + ":00";
  }


  /*
   * Helps calculate the position of a modulo remainder in getRataDie()
   */
  TG_Date.getMonthFromRemDays = function (dnum, yr) {

  	var tack = 0;
  	var rem = 0;
  	var m = 0;

  	if (TG_Date.isLeapYear(yr)){ tack = 1; } else { tack=0; }
	
  	if (dnum <= 31) { m = 1; rem = dnum; }
  	else if ((dnum >31) && (dnum <= 59 + tack)) { m = 2; rem = dnum - (31 + tack); }
  	else if ((dnum > 59 + tack) && (dnum <= 90 + tack)) { m = 3; rem = dnum - (59 + tack); }
  	else if ((dnum > 90 + tack) && (dnum <= 120 + tack)) { m = 4; rem = dnum - (90 + tack); }
  	else if ((dnum > 120 + tack) && (dnum <= 151 + tack)) { m = 5; rem = dnum - (120 + tack); }
  	else if ((dnum > 151 + tack) && (dnum <= 181 + tack)) { m = 6; rem = dnum - (151 + tack); }
  	else if ((dnum > 181 + tack) && (dnum <= 212 + tack)) { m = 7; rem = dnum - (181 + tack); }
  	else if ((dnum > 212 + tack) && (dnum <= 243 + tack)) { m = 8; rem = dnum - (212 + tack); }
  	else if ((dnum > 243 + tack) && (dnum <= 273 + tack)) { m = 9; rem = dnum - (243 + tack); }
  	else if ((dnum > 273 + tack) && (dnum <= 304 + tack)) { m = 10; rem = dnum - (273 + tack); }
  	else if ((dnum > 304 + tack) && (dnum <= 334 + tack)) { m = 11; rem = dnum - (304 + tack); }
  	else { m = 12; rem = dnum - (334 + tack);  }

  	return {mo:m, da:rem};

  	};





  /*
   GET YYYY.MM.DD FROM (serial) rata die 
  @param snum is the rata die or day serial number
  */
  TG_Date.getDateFromRD = function (snum) {
    // in case it arrives as an RD-decimal
    if (getDateFromRDCache[snum]) {
      return getDateFromRDCache[snum]
    }
    var snumAb = Math.floor(snum);

    var bigP = 146097; // constant days in big cal cycle
    var chunk1 = Math.floor(snumAb / bigP);
    var chunk1days = chunk1 * bigP;
    var chunk1yrs = Math.floor(snumAb / bigP) * 400;
    var chunk2days = snumAb - chunk1days;
    var dechunker = chunk2days; 
    var ct = 1;

    var ia = chunk1yrs + 1;
    var iz = ia + 400;

    for (var i = ia; i <= iz; i++) {
    	if (dechunker > 365) {
    		dechunker -= 365;
    		if (TG_Date.isLeapYear(i)) { dechunker -= 1; }
    		ct++;
    	}  else { i = iz; }
    }

  	var yt = chunk1yrs + ct;
	
  	if (dechunker == 0) dechunker = 1;
  	var inf = TG_Date.getMonthFromRemDays(dechunker,yt);
  	// in case...
  	var miLong = (snum - snumAb) * 1440;
  	var mi = Math.floor(miLong % 60);
  	var ho = Math.floor(miLong / 60);
	
  	if ((TG_Date.isLeapYear(yt)) && (inf['mo'] == 2)) {
  		inf['da'] += 1;
  	}

  	var ret = yt + "-" + inf['mo'] + "-" + inf['da'] + " " + ho + ":" + mi + ":00";
	  getDateFromRDCache[snum] = ret;
	  
	  return ret;
	
  }, // end getDateFromRD


  TG_Date.getDateFromSec = function (sec) {
  	// FIRST GET Rata die
  	if (getDateFromSecCache[sec]) {
  	  return getDateFromSecCache[sec]
	  }
	  
	  // the sec/86400 represents a "rd-decimal form"
	  // that will allow extraction of hour, minute, second
  	var ret = TG_Date.getDateFromRD(sec / 86400);
  	getDateFromSecCache[sec] = ret;
  	return ret;
  };


  TG_Date.isLeapYear =  function(y) {
    if (y % 400 == 0) {
      return true;
    } else if (y % 100  == 0){
      return false;
    } else if (y % 4 == 0) {
      return true;
    } else {
      return false;
    }
  };


  /*
  * getRataDie
  * Core "normalizing" function for dates, the serial number day for
  * any date, starting with year 1 (well, zero...), wraps a getBCRataDie()
  * for getting negative year serial days
  *
  * @param dat {object} date object with {ye, mo, da}
  * @return {number} the serial day
  */
  TG_Date.getRataDie = function (dat) {
	  
  	var ye = dat.ye;
  	var mo = dat.mo;
  	var da = dat.da;
  	var ret = 0;
  	
  	if (getRataDieCache[ye + "-" + mo + "-" + da]) {
  	  return getRataDieCache[ye + "-" + mo + "-" + da];
	  }

  if (ye >= 0) { 
  	// THERE IS NO YEAR ZERO!!!
  	if (ye == 0) ye = 1;

  	var fat =  (Math.floor(ye / 400)) * 146097,
  	    remStart = (ye - (ye % 400)),
  	    moreDays = parseInt(getDaysInYearSpan(remStart, ye)),
  	    daysSoFar = parseInt(getDaysSoFar(mo,ye));
	    
  	ret = (fat + moreDays + daysSoFar + da) - 366;
	
  } else if (ye < 0) {
    
  	ret = TG_Date.getBCRataDie({ye:ye, mo:mo, da:da});
  } 

  getRataDieCache[ye + "-" + mo + "-" + da] = ret;
  
  return ret;

  ////// internal RataDie functions
      	/*
      	*  getDaysInYearSpan
      	*  helps calculate chunks of whole years
      	
      	*  @param a {number} initial year in span
      	*  @param z {number} last year in span
      	* 
      	*  @return {number} days in span of arg. years
      	*/
        function getDaysInYearSpan (a, z) {
  
          if (getDaysInYearSpanCache[a + "-" + z]) {
            return getDaysInYearSpanCache[a + "-" + z];
          }
        	var t = 0;

        	for (var i = a; i < z; i++){
        		if (TG_Date.isLeapYear(i)) { t += 366; } else { t += 365; }
        	}
      	
          getDaysInYearSpanCache[a + "-" + z] = t;
        
        	return t;

        };


        function getDaysSoFar (mo,ye) {
        	
        	var d;
	
        	switch (mo) {
        		case 1: d=0;   break; // 31
        		case 2: d=31;  break; // 29
        		case 3: d=59;  break; // 31
        		case 4: d=90;  break; // 30
        		case 5: d=120; break; // 31
        		case 6: d=151; break; // 30
        		case 7: d=181; break; // 31
        		case 8: d=212; break; // 31
        		case 9: d=243; break; // 30
        		case 10: d=273;break; // 31
        		case 11: d=304;break; // 30
        		case 12: d=334;break; // 31
        	}
	
        	if (mo > 2) {
        	   if (TG_Date.isLeapYear(ye)) { d += 1; }
        	}

        	return d;
        };


  };

  /*
  Counts serial days starting with -1 in year -1. Visualize a number counting 
  from "right to left" on top of the other calendrical pieces chunking away
  from "left to right".  But since there's no origin farther back before 0
  we have no choice. 

  @param dat  object with .ye, .mo, .da
  */
  TG_Date.getBCRataDie = function (dat) {

  	var ye = dat.ye,
  	    mo = dat.mo,
  	    da = dat.da;
  	
  	if (getBCRataDieCache[ye + "-" + mo + "-" + da]) {
    	  return getBCRataDieCache[ye + "-" + mo + "-" + da];
  	}

  	if (mo == 0) mo = 1;
  	if (da == 0) da = 1;

  	var absYe = Math.abs(ye);
  	var chunks = [0,335,306,275,245,214,184,153,122,92,61,31,0];
  	var mdays = TG_Date.monthsDayNums[mo];
  	var rawYeDays = (absYe - 1) * 366;
  	var rawMoDays = chunks[mo];
  	var rawDaDays = (mdays - da) + 1;
  	var ret = -1 * (rawYeDays + rawMoDays + rawDaDays);
  	
  	getBCRataDieCache[ye + "-" + mo + "-" + da] = ret;
  	return ret;
  };


  TG_Date.setCulture = function(culture_str) {
    
    jQuery.global.culture = jQuery.global.cultures[culture_str];
 
  	// ["","January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    TG_Date.monthNames = $.merge([""],jQuery.global.culture.calendar.months.names);
    
    // ["","Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    TG_Date.monthNamesAbbr = $.merge([""],jQuery.global.culture.calendar.months.namesAbbr);
  
    TG_Date.monthNamesLet = ["","J","F","M","A","M","J","J","A","S","O","N","D"];

    TG_Date.monthsDayNums = [0,31,28,31,30,31,30,31,31,30,31,30,31,29];
  
    // ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    TG_Date.dayNames = jQuery.global.culture.calendar.days.names;
  
    // ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    TG_Date.dayNamesAbbr = jQuery.global.culture.calendar.days.namesAbbr;
  
    TG_Date.dayNamesShort = jQuery.global.culture.calendar.days.namesShort;
  
  
    // NON-CULTURE
    TG_Date.units = ["da", "mo", "ye", "de", "ce", "thou", "tenthou", "hundredthou", "mill", "tenmill", "hundredmill", "bill"];
    
    TG_Date.patterns = jQuery.global.culture.calendar.patterns;
    
  };


  /*
  *  INSTANCE METHODS  
  *
  */
  
  TG_Date.prototype = {
      
		format : function (sig, useLimit, tz_off) {
		
			var offset = tz_off || {"hours":0, "minutes":0};
		
			var jsDate, fromUTC; // jsDate
		
			/* "en" formats
			// short date pattern
			d: "M/d/yyyy",
			// long date pattern
			D: "dddd, MMMM dd, yyyy",
			// short time pattern
			t: "h:mm tt",
			// long time pattern
			T: "h:mm:ss tt",
			// long date, short time pattern
			f: "dddd, MMMM dd, yyyy h:mm tt",
			// long date, long time pattern
			F: "dddd, MMMM dd, yyyy h:mm:ss tt",
			// month/day pattern
			M: "MMMM dd",
			// month/year pattern
			Y: "yyyy MMMM",
			// S is a sortable format that does not vary by culture
			S: "yyyy\u0027-\u0027MM\u0027-\u0027dd\u0027T\u0027HH\u0027:\u0027mm\u0027:\u0027ss"
			*/
			
			// If, for example, an event wants only year-level time being displayed
			// (and not month, day...) filter out the undesired time levels
			if (useLimit == true) {
			  // reduce to 2 chars for consistency
			  var ddlim = this.date_display.substr(0,2);
			  switch (ddlim) {
			    case "no": return ""; break;
			    case "ye": sig = "yyyy"; break;
			    case "mo": sig = "MMM yyyy"; break;
			    case "da": sig = "MMM d, yyyy"; break;
			    case "ho": sig = "MMM d, yyyy h:mm tt"; break;
			    
			    default: sig = "f";
			  }
			}
			
			          	
          	if (this.ye > -270000){
				
				fromUTC = TG_Date.toFromUTC(_.clone(this), offset, "from");  
          		  		
    			jsDate = new Date(fromUTC.ye, (fromUTC.mo-1), fromUTC.da, fromUTC.ho, fromUTC.mi, fromUTC.se, 0);
  
				return $.global.format(jsDate, sig);
			
			
    		} else {
    			// BIGNUM_PROBLEM
				// year < -271,000 will fail as js Date
    			// JUST RETURN YEAR
    			return this.ye;
    		}
			
		}

  	} // end .prototype
  	
  	
  
	TG_Date.getTimeOffset = function(offsetString) {
		
		// remove all but numbers, minus, colon
		var oss = offsetString.replace(/[^-\d:]/gi, ""),
			osA = oss.split(":"),
			ho = parseInt(osA[0], 10),
			mi = parseInt(osA[1], 10),
		
			// minutes negative if hours are 
			sw = (ho < 0) ? -1 : 1,
		
			miDec = sw * ( mi / 60 ),
			dec = (ho + miDec),
			se = dec * 3600;
			
			var ob = {"decimal":dec, "hours":ho, "minutes":mi, "seconds":se, "string":oss};
	
			return ob; 
		
	};	
	
	
	TG_Date.tzOffsetStr = function (datestr, offsetStr) {
		if (datestr) {
		if (datestr.length == 19) {
			datestr += offsetStr;
		} else if (datestr.length == 16) {
			datestr += ":00" + offsetStr;
		}
		return datestr;
		}
	};
	
		
	/*
	* TG_parse8601
	* transforms string into TG Date object
	*/
	TG_Date.parse8601 = function(str){
		
		/*
		len   str
    	4     YyYyYyY
		7     YyYyYyY-MM
		10    YyYyYyY-MM-DD
		13    YyYyYyY-MM-DDTHH (T is optional between day and hour)
		16    YyYyYyY-MM-DD HH:MM
		19    YyYyYyY-MM-DDTHH:MM:SS
		25    YyYyYyY-MM-DD HH:MM:SS-ZH:ZM
		*/
		
		var ye, mo, da, ho, mi, se, bce, bce_ye,
			mo_default = 1,
			da_default = 1,
			ho_default = 12,
			mi_default = 0,
			dedash = function (n){
				if (n) {
			 		return parseInt(n.replace("-", ""), 10);
			 	} else {
			 		return 0;
			 	}
			},
				
			reg = /^(\-?\d+)?(\-\d{1,2})?(\-\d{1,2})?(?:T| )?(\d{1,2})?(?::)?(\d{1,2})?(?::)?(\d{1,2})?(\+|\-)?(\d{1,2})?(?::)?(\d{1,2})/,
			rx = str.match(reg);

    	// picks up positive OR negative (bce)	
		ye = parseInt(rx[1]);
		
		if (!ye) return {"error":"invalid date; no year provided"};

		mo = dedash(rx[2]) || mo_default;
		da = dedash(rx[3]) || da_default;
		// rx[4] is the "T" or " "
		ho = dedash(rx[4]) || da_default;
		// rx[6] is ":"
		mi = dedash(rx[5]) || mi_default;
		// rx[8] is ":"
		se = dedash(rx[6]) || mi_default;
		
		// if year is < 1 or > 9999, override
		// tz offset, set it to 0/UTC no matter what
		
		// If the offset is negative, we want to make
		// sure that minutes are considered negative along
		// with the hours"-07:00" > {tz_ho:-7; tz_mi:-30}
		tz_pm = rx[7] || "+";
   		tz_ho = parseInt(rx[8], 10) || 0;
		if (tz_pm == "-") {tz_ho = tz_ho * -1;}
		tz_mi = parseInt(rx[9], 10) || 0;
		if (tz_pm == "-") {tz_mi = tz_mi * -1;}
		
		// is it a leap year?? get this once

		return {"ye":ye, "mo":mo, "da":da, "ho":ho, "mi":mi, "se":se, "tz_ho":tz_ho, "tz_mi":tz_mi}
		

	}; // parse8601
	
	

	
	/*
	* toFromUTC
	* transforms TG_Date object to be either in UTC or in non-UTC
	*
	* @param ob: {Object} date object including ye, mo, da, etc
	* @param offset: {String} eg: "-07:30"
	*
	* with offsets made clear. Used for formatting dates at all times
	* since all event dates are stored in UTC
	*/		
	TG_Date.toFromUTC = function (ob, offset, toFrom) {
				
		var nh_dec = 0,
			lastDays = [0,31,28,31,30,31,30,31,31,30,31,30,31,29],
			deltaFloatToHM = function (flt){
				var fl = Math.abs(flt),
					h = Math.floor(fl),
					dec = fl - h,
					m = Math.round(dec * 60);
				
				return {"ho":h, "mi":m};
			},
			delta = {};
			
		// Offset is the "timezone setting" on the timeline,
		// or the timezone to which to translate from UTC
		if (toFrom == "from") {
			delta.ho = -1 * offset.hours;
			delta.mi = -1 * offset.minutes;
		} else if (toFrom == "to"){
			delta.ho = offset.hours;
			delta.mi = offset.minutes;
		} else {
			delta.ho = -1 * ob.tz_ho;
			delta.mi = -1 * ob.tz_mi;
		}
	
		
		// no change, man!
		if (delta.ho == 0 && delta.mi ==0) {
			return ob; 
		}	
		
		// decimal overage or underage after adding offset
		var ho_delta = (ob.ho + (ob.mi / 60)) + ((-1 * delta.ho) + ((delta.mi * -1) / 60));
				
		// DO WE GO FWD OR BACK
		if (ho_delta < 0) {
			// go back a day
			nh_dec = 24 + ho_delta;
		
			if (ob.da > 1) {
				ob.da = ob.da - 1;
			} else { 
				// day is 1....
				if (ob.mo == 1) {
					// & month is JAN, go back to DEC
					ob.ye = ob.ye - 1; ob.mo = 12; ob.da = 31;
				} else { 
					ob.mo = ob.mo-1;
					// now that we know month, what is the last day number?
					if (ob.mo == 2 && TG_Date.isLeapYear(ob.ye) == true) {
						ob.da = 29;
					} else {
						ob.da = lastDays[ob.mo];
					}
				}
			}
			
		} else if (ho_delta > 24) {
			// going fwd a day
			nh_dec = ho_delta - 24;			

			if (TG_Date.isLeapYear(ob.ye) && ob.mo == 2 && ob.da==28){
				ob.da = 29;
			} else if (ob.da == lastDays[ob.mo]) {
				if (ob.mo == 12) {
					ob.ye = ob.ye + 1;
					ob.mo = 1;
				} else {
					ob.mo = ob.mo + 1;
				}
				ob.da = 1;
			} else {
				ob.da = ob.da + 1;
			}

		} else {
			nh_dec = ho_delta;
		}
		// delta did not take us from one day to another
		// only adjust the hour and minute
		var hm = deltaFloatToHM(nh_dec);
			ob.ho = hm.ho;
			ob.mi = hm.mi; 
			
		if (!offset) {
			ob.tz_ho = 0;
			ob.tz_mi = 0;
		} else {
			ob.tz_ho = offset.tz_ho;
			ob.tz_mi = offset.tz_mi;
		}
		
				
		////// 
		return ob;
		
	}; // toFromUTC
	
	
	TG_Date.timezones = [
	    {"offset": "-12:00", "name": "Int'l Date Line West"},
	    {"offset": "-11:00", "name": "Bering & Nome"},
	    {"offset": "-10:00", "name": "Alaska-Hawaii Standard Time"},
	    {"offset": "-10:00", "name": "U.S. Hawaiian Standard Time"},
	    {"offset": "-10:00", "name": "U.S. Central Alaska Time"},
	    {"offset": "-09:00", "name": "U.S. Yukon Standard Time"},
	    {"offset": "-08:00", "name": "U.S. Pacific Standard Time"},
	    {"offset": "-07:00", "name": "U.S. Mountain Standard Time"},
	    {"offset": "-07:00", "name": "U.S. Pacific Daylight Time"},
	    {"offset": "-06:00", "name": "U.S. Central Standard Time"},
	    {"offset": "-06:00", "name": "U.S. Mountain Daylight Time"},
	    {"offset": "-05:00", "name": "U.S. Eastern Standard Time"},
	    {"offset": "-05:00", "name": "U.S. Central Daylight Time"},
	    {"offset": "-04:00", "name": "U.S. Atlantic Standard Time"},
	    {"offset": "-04:00", "name": "U.S. Eastern Daylight Time"},
	    {"offset": "-03:30", "name": "Newfoundland Standard Time"},
	    {"offset": "-03:00", "name": "Brazil Standard Time"},
	    {"offset": "-03:00", "name": "Atlantic Daylight Time"},
	    {"offset": "-03:00", "name": "Greenland Standard Time"},
	    {"offset": "-02:00", "name": "Azores Time"},
	    {"offset": "-01:00", "name": "West Africa Time"},
	    {"offset": "00:00", "name": "Greenwich Mean Time/UTC"},
	    {"offset": "00:00", "name": "Western European Time"},
	    {"offset": "01:00", "name": "Central European Time"},
	    {"offset": "01:00", "name": "Middle European Time"},
	    {"offset": "01:00", "name": "British Summer Time"},
	    {"offset": "01:00", "name": "Middle European Winter Time"},
	    {"offset": "01:00", "name": "Swedish Winter Time"},
	    {"offset": "01:00", "name": "French Winter Time"},
	    {"offset": "02:00", "name": "Eastean EU"},
	    {"offset": "02:00", "name": "USSR-zone1"},
	    {"offset": "02:00", "name": "Middle European Summer Time"},
	    {"offset": "02:00", "name": "French Summer Time"},
	    {"offset": "03:00", "name": "Baghdad Time"},
	    {"offset": "03:00", "name": "USSR-zone2"},
	    {"offset": "03:30", "name": "Iran"},
	    {"offset": "04:00", "name": "USSR-zone3"},
	    {"offset": "05:00", "name": "USSR-zone4"},
	    {"offset": "05:30", "name": "Indian Standard Time"},
	    {"offset": "06:00", "name": "USSR-zone5"},
	    {"offset": "06:30", "name": "North Sumatra Time"},
	    {"offset": "07:00", "name": "USSR-zone6"},
	    {"offset": "07:00", "name": "West Australian Standard Time"},
	    {"offset": "07:30", "name": "Java"},
	    {"offset": "08:00", "name": "China & Hong Kong"},
	    {"offset": "08:00", "name": "USSR-zone7"},
	    {"offset": "08:00", "name": "West Australian Daylight Time"},
	    {"offset": "09:00", "name": "Japan"},
	    {"offset": "09:00", "name": "Korea"},
	    {"offset": "09:00", "name": "USSR-zone8"},
	    {"offset": "09:30", "name": "South Australian Standard Time"},
	    {"offset": "09:30", "name": "Central Australian Standard Time"},
	    {"offset": "10:00", "name": "Guam Standard Time"},
	    {"offset": "10:00", "name": "USSR-zone9"},
	    {"offset": "10:00", "name": "East Australian Standard Time"},
	    {"offset": "10:30", "name": "Central Australian Daylight Time"},
	    {"offset": "10:30", "name": "South Australian Daylight Time"},
	    {"offset": "11:00", "name": "USSR-zone10"},
	    {"offset": "11:00", "name": "East Australian Daylight Time"},
	    {"offset": "12:00", "name": "New Zealand Standard Time"},
	    {"offset": "12:00", "name": "Int'l Date Line East"},
	    {"offset": "13:00", "name": "New Zealand Daylight Time"}
	];
	
	

	
  		/// INTERNAL HOISTED FUNCTIONS

  	    function isValidDateString (str) {
      	  // VALIDATE STRING
      	  var aStr = jQuery.trim(str);
      		reg = new RegExp(/[T0-9-: ]/);
      		if (reg.test(aStr)) {
      		  return aStr;
      	  } else {
      	    return false;
          }
        };
  
  
      	/*
      	* isValidDate
      	* Rejects dates like "2001-13-32" and such
      	* TODO: make sure no non leap years have Feb 29
      	*
      	*/
      	function isValidDate (ye, mo, da) {
	  
      		var ld = TG_Date.getMonthDays(mo, ye);
      		// day isn't appropriate for month
      		if ((da > ld) || (da <= 0)) { return false; } 
      		// invalid month numbers
      		if ((mo > 12) || (mo < 0)) { return false; }
      		// there's no year "0"
      		if (ye == 0) { return false; }
      	  // Is it a hex number? We need to make sure it's only got 0-9
      		if ((typeof ye != "number") || (String(ye).match(/([0-9]+)/) == false)) { return false; }
	
      		return true;
      	};
	
        /*
        * boil
        * basic wrapper for parseInt to clean leading zeros,
        * as in dates
        */
      	function boil (n) {
      		return parseInt(n, 10);
      	};


      	function getSec (fd) {
      		// 
      		var daSec = Math.abs(fd.rd) * 86400;
      		var hoSec = (fd.ho) * 3600;
      		var miSec = (fd.mi - 1) * 60;
      		var bc = 1;
      		if (fd.rd < 0) bc = -1;
      		return bc * (daSec + hoSec + miSec);
      	};


  
        /* getMoNum
        *
        * @param mo {Number} month from 1 to 12
        * @param ye {Number} straight year
        *
        */ 
        function getMoNum (ob) {
        	    if (ob.ye > 0) {
        			return  ((ob.ye -1) * 12) + ob.mo;
        		} else {
        			return getMoNumBC(ob.mo, ob.ye);
        		}
        };
  
        /*
        * getMoNumBC
        * In BC time, serial numbers for months are going backward
        * starting with December of 1 bce. So, a month that is actually
        * "month 12 of year -1" is actually just -1, and November of 
        * year 1 bce is -2. Capiche!?
        *
        * @param {object} ob ---> .ye (year)  .mo (month)
        * @return {number} serial month number (negative in this case)
        */
        function getMoNumBC (mo, ye) {
        	var absYe = Math.abs(ye);
        	var n = ((absYe - 1) * 12) + (12-(mo -1));
        	return -1 * n;
        };
        


		function show(ob){
			return ob.ye + "-" + ob.mo + "-" + ob.da + " " + ob.ho + ":" + ob.mi;
		}
		

  
})(timeglider);

