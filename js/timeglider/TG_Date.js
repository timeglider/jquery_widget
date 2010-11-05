/*

    INITIAL DECLARATION OF "timeglider" CONSTRUCTOR HERE
    
*/

var timeglider = function () {};



timeglider.TGDate = {
	
	monthNamesFull : ["","January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
	monthNamesAbbr : ["","Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
	monthsDayNums : [0,31,28,31,30,31,30,31,31,30,31,30,31,29],
	monthNamesLet : ["","J","F","M","A","M","J","J","A","S","O","N","D"],
	dayNamesFull : ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
	dayNamesAbbr : ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
	dayNamesLet : ["S", "M", "T", "W", "T", "F", "S"],
	units : ["da", "mo", "ye", "de", "ce", "thou"],

	isLeapYear: function(y) {
    if ((y % 100  == 0) && ( y % 400  != 0)) {
      return false;
    }  else if (y % 4 == 0) {
      return true;
    } else {
      return false;
    }
	},
	

	boil : function (nstr) {
		return parseInt(nstr, 10);
	},
	
		
	getTimeUnitSerial : function (fd, unit) {
			switch (unit) {
				case "ye": return fd.ye; break;
				case "mo": return this.getMonthNum(fd); break;
				case "da": return this.getRataDie(fd);
				case "de": return Math.ceil(fd.ye / 10); break;
				case "ce": return Math.ceil(fd.ye / 100); break;
				case "thou": return Math.ceil(fd.ye / 1000); break;
				// tenthou
				// hundredthou
				// mill
				// tenmill
				// hundredmill
				// bill
			}
	},
	
	validateEventDates : function (start, end) {
	/*
	The goal here is to make a wide range of date formats valid, including with 
	timezones, and transform into a UTC zoned date object with ye,mo,da, etc
	*/
	
	/*
		1. get date format type (YYYY-MM-DD, YYYY only, etc)  --- _tests/getDateFormat...
		2. tranform non ISO-8601 dates to ISO, adding default values where necessary
		   (making sure to work with timezone offset, if necessary)
		3. make date object
	*/

		var s, e,
			
		// PLACEHOLDER PATTERN
		reg = new RegExp(/[0-9-: ]/);
		var startValid = reg.test(start);
		if (startValid) {
			s = this.makeDateObject(start);
		} else {
			trace ("start:" + start);
			s = "false";
		}
		
		// if valid and is after start
		var e = this.makeDateObject(end);
		
		return {"s": s, "e":e}
	},
		
	
	// BREAK DATE
	makeDateObject : function(datestr){
		var str = jQuery.trim(datestr);
		str = str.replace(",", "");
		// is a BC date
		var bce;
		str.substr(0,1) == "-" ? bce=1 : bce=0;
		bce == 1 ? str = str.substr(1) : str=str;
		
		str = str.replace(/[^0-9]/g, "-");
		var arr = str.split("-");
		
		var obj = {ye:this.boil(arr[0]), mo:this.boil(arr[1]), da:this.boil(arr[2]),  ho:this.boil(arr[3]), mi:this.boil(arr[4]), se:this.boil(arr[5]), bce:bce}
		obj.rd  = this.getRataDie(obj);
		obj.sec = this.getSec(obj);
		
		return obj;
	},
	
	
	getMonthDays : function(mo,ye) {
		if ((this.isLeapYear(ye) == true) && (mo==2)) {
			return 29;
		} else  {
			return this.monthsDayNums[mo];
		}
	},
	
	isValidDate : function (ye, mo, da) {
		var ld = this.getMonthDays(mo, ye);
		if ((da > ld) || (da <= 0)) { return false; }  
		if ((mo > 12) || (mo < 0)) { return false; }
		if (ye == 0) { return false; }
		var pat = new RegExp(/([0-9]+)/);
		if (ye.match(Math.abs(pat)) == false) { return false; }
	
		return true;
	},
	
	formatFocusDate : function (fd) {
		return fd.ye + "-" + fd.mo + "-" + fd.da + " " + fd.ho + ":" + fd.mi + ":00";
	},
	
	getSec : function (fd) {
		// 
		var daSec = Math.abs(fd.rd) * 86400;
		var hoSec = (fd.ho) * 3600;
		var miSec = (fd.mi - 1) * 60;
		var bc = 1;
		if (fd.rd < 0) bc = -1;
		return bc * (daSec + hoSec + miSec);
	},


	twentyFourToTwelve : function (e) {
		
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
	},
	
	/* @param ob -->  .ye  and  .mo */
	getMonthNum : function (ob) {
	    if (ob.ye > 0) {
			return  ((ob.ye -1) * 12) + ob.mo;
		} else {
			return this.getBCMonthNum(ob);
		}
	},
	
	getMonthAdj : function (serial, tw) {
		var d = this.getDateFromMonthNum(serial);
		var w;
		switch (d.mo) {
			
			// 31 days
			case 1: case 3: case 5: case 7: case 8: case 10: case 12:
				var w = Math.floor(tw + ((tw/28) * 3));
				return {"width":w, "days":31};
			break;

			// Blasted February!
			case 2:
			if (this.isLeapYear(d.ye) == true) {
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
		
		
	},
	
	// CORRECT
	getBCMonthNum: function(ob) {
		var ye = ob.ye;
		var mo = ob.mo;
		var absYe = Math.abs(ye);
		var n = ((absYe - 1) * 12) + (12-(mo -1));
		return -1 * n;
	},
	
	getDateFromMonthNum : function(mn) {
	
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
	},
	

	getMonthWidth : function(mo,ye,tickWidth) {

		var dayWidth = t / 28;
		var ad;
		var nd = 28;
	
		switch (mo) {
			case 1: case 3: case 5: case 7: case 8: case 10: case 12: ad = 3; break;
			case 4: case 6: case 9: case 11: ad = 2; break;
			// leap year
			case 2: if (this.isLeapYear(yr) == true) { ad = 1; } else { ad=0; }; break;
			
		}
	
		var width = Math.floor(tickWidth + (dayWidth * ad));
		var days = nd + ad;
	
		return {width:width, numDays:days};
	},
	
	
	getRataDie : function (dat) {
		
		var ye = dat.ye;
		var mo = dat.mo;
		var da = dat.da;
		var ret = 0;
	
	if (ye >= 0) { 
		// THERE IS NOYEARZERO!!!
		if (ye == 0) ye = 1;
	
		var initDiv = Math.floor(ye / 400);
		var fat =  initDiv * 146097;
		var remnant = ye % 400; // chunk of years after 400 y. cycle
		
		var remStart = (ye - remnant); //  + 1;
		var moreDays = parseInt(this.getDaysInYearSpan(remStart, ye));
			
		var daysSoFar = parseInt(this.getDaysSoFar(mo,ye));
		ret = (fat + moreDays + daysSoFar + da) - 366;
		
	} else if (ye < 0) {
		ret = this.getBCRataDie({ye:ye, mo:mo, da:da});
	} 
	
	return ret;
	},
	
	/*
	Counts serial days starting with -1 in year -1. Visualize a number counting 
	from "right to left" on top of the other calendrical pieces chunking away
	from "left to right".  But since there's no origin farther back before 0
	we have no choice. 
	
	@param dat  object with .ye, .mo, .da
	*/
	getBCRataDie : function(dat) {

		var ye = dat.ye;
		var mo = dat.mo;
		var da = dat.da;

		if (mo == 0) mo = 1;
		if (da == 0) da = 1;

		var absYe = Math.abs(ye);

		var chunks = [0,335,306,275,245,214,184,153,122,92,61,31,0];
		var mdays = this.monthsDayNums[mo];
		var rawYeDays = (absYe - 1) * 366;
		var rawMoDays = chunks[mo];
		var rawDaDays = (mdays - da) + 1;
		return -1 * (rawYeDays + rawMoDays + rawDaDays);
	},
	
	/*
	 GET YYYY.MM.DD FROM (serial) rata die 
	@param snum is the rata die or day serial number
	*/
	getDateFromRD : function (snum) {
	// in case it arrives as an RD-decimal
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
			if (this.isLeapYear(i)) { dechunker -= 1; }
			ct++;
		}  else { i = iz; }
	}

		var yt = chunk1yrs + ct;
		
		if (dechunker == 0) dechunker = 1;
		var inf = this.getMonthFromRemDays(dechunker,yt);
		// in case...
		var miLong = (snum - snumAb) * 1440;
		var mi = Math.floor(miLong % 60);
		var ho = Math.floor(miLong / 60);
		
		if ((this.isLeapYear(yt)) && (inf['mo'] == 2)) {
			inf['da'] += 1;
		}

		return {ye:yt, mo:inf['mo'], da:inf['da'], ho:ho, mi:mi};
		
		}, // end getDateFromRD 
		
	
	getDateFromSec : function (sec) {
		// FIRST GET Rata die
		var rdDec = sec / 86400; // constant days in big cal cycle
		return this.getDateFromRD(rdDec);
	},



	getMonthFromRemDays : function(dnum, yr) {

	var tack = 0;
	var rem = 0;
	var m = 0;

	if (this.isLeapYear(yr)){ tack = 1; } else { tack=0; }
	
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

	},


	
	/*
	*  a = initial year in span
	*  z = last year in span
	## used in getRataDie to calculate chunks of whole years
	*/
	getDaysInYearSpan: function (a, z) {
	
		var t = 0;
	
		for (var i = a; i < z; i++){
			if (this.isLeapYear(i)) { t+= 366; } else { t += 365; }
		}

		return t;

	},
	
	getDaysSoFar: function(mo,ye) {
		var moDays;
		
		switch (mo) {
			case 1: moDays=0;break; // 31
			case 2: moDays=31;break; // 29
			case 3: moDays=59;break; // 31
			case 4: moDays=90;break; // 30
			case 5: moDays=120;break; // 31
			case 6: moDays=151;break; // 30
			case 7: moDays=181;break; // 31
			case 8: moDays=212;break; // 31
			case 9: moDays=243;break; // 30
			case 10: moDays=273;break; // 31
			case 11: moDays=304;break; // 30
			case 12: moDays=334;break; // 31
		}
		
		if ((mo > 2) && (this.isLeapYear(ye))) { moDays += 1; }
	
		return moDays;
	},
	
	
} // end prototype obj




// Simulates PHP's date function
Date.prototype.format = function(format) {
	var returnStr = '';
	var replace = Date.replaceChars;
	for (var i = 0; i < format.length; i++) {
		var curChar = format.charAt(i);
		if (replace[curChar]) {
			returnStr += replace[curChar].call(this);
		} else {
			returnStr += curChar;
		}
	}
	return returnStr;
};

Date.replaceChars = {
	shortMonths: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
	longMonths: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
	shortDays: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
	longDays: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
	
	// Day
	d: function() { return (this.getDate() < 10 ? '0' : '') + this.getDate(); },
	D: function() { return Date.replaceChars.shortDays[this.getDay()]; },
	j: function() { return this.getDate(); },
	l: function() { return Date.replaceChars.longDays[this.getDay()]; },
	N: function() { return this.getDay() + 1; },
	S: function() { return (this.getDate() % 10 == 1 && this.getDate() != 11 ? 'st' : (this.getDate() % 10 == 2 && this.getDate() != 12 ? 'nd' : (this.getDate() % 10 == 3 && this.getDate() != 13 ? 'rd' : 'th'))); },
	w: function() { return this.getDay(); },
	z: function() { return "Not Yet Supported"; },
	// Week
	W: function() { return "Not Yet Supported"; },
	// Month
	F: function() { return Date.replaceChars.longMonths[this.getMonth()]; },
	m: function() { return (this.getMonth() < 9 ? '0' : '') + (this.getMonth() + 1); },
	M: function() { return Date.replaceChars.shortMonths[this.getMonth()]; },
	n: function() { return this.getMonth() + 1; },
	t: function() { return "Not Yet Supported"; },
	// Year
	L: function() { return (((this.getFullYear()%4==0)&&(this.getFullYear()%100 != 0)) || (this.getFullYear()%400==0)) ? '1' : '0'; },
	o: function() { return "Not Supported"; },
	Y: function() { return this.getFullYear(); },
	y: function() { return ('' + this.getFullYear()).substr(2); },
	// Time
	a: function() { return this.getHours() < 12 ? 'am' : 'pm'; },
	A: function() { return this.getHours() < 12 ? 'AM' : 'PM'; },
	B: function() { return "Not Yet Supported"; },
	g: function() { return this.getHours() % 12 || 12; },
	G: function() { return this.getHours(); },
	h: function() { return ((this.getHours() % 12 || 12) < 10 ? '0' : '') + (this.getHours() % 12 || 12); },
	H: function() { return (this.getHours() < 10 ? '0' : '') + this.getHours(); },
	i: function() { return (this.getMinutes() < 10 ? '0' : '') + this.getMinutes(); },
	s: function() { return (this.getSeconds() < 10 ? '0' : '') + this.getSeconds(); },
	// Timezone
	e: function() { return "Not Yet Supported"; },
	I: function() { return "Not Supported"; },
	O: function() { return (-this.getTimezoneOffset() < 0 ? '-' : '+') + (Math.abs(this.getTimezoneOffset() / 60) < 10 ? '0' : '') + (Math.abs(this.getTimezoneOffset() / 60)) + '00'; },
	P: function() { return (-this.getTimezoneOffset() < 0 ? '-' : '+') + (Math.abs(this.getTimezoneOffset() / 60) < 10 ? '0' : '') + (Math.abs(this.getTimezoneOffset() / 60)) + ':' + (Math.abs(this.getTimezoneOffset() % 60) < 10 ? '0' : '') + (Math.abs(this.getTimezoneOffset() % 60)); },
	T: function() { var m = this.getMonth(); this.setMonth(0); var result = this.toTimeString().replace(/^.+ \(?([^\)]+)\)?$/, '$1'); this.setMonth(m); return result;},
	Z: function() { return -this.getTimezoneOffset() * 60; },
	// Full Date/Time
	c: function() { return this.format("Y-m-d") + " " + this.format("H:i:s"); },
	r: function() { return this.toString(); },
	U: function() { return this.getTime() / 1000; }
};
