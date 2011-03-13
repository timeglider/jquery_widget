/* Unit testing for timeglider */


test("tgDate isLeapYear", function() {
	ok(timeglider.TG_Date.isLeapYear(1968), 'The year 1968 WAS a leap year!'); // there was a Feb 29 leap day!
	ok(timeglider.TG_Date.isLeapYear(2000), 'The year 2000 WAS leap year!');
	ok(!timeglider.TG_Date.isLeapYear(1900), 'The year 1900 WAS NOT a leap year!');
});


test("tgDate new TG_Date", function() {
	ok(new timeglider.TG_Date("2001-09-11 12:00:00"), '2001-9-11 is a valid date');

});




test("tgDate getRataDie", function() {
	ok(timeglider.TG_Date.getRataDie({ye:1, mo:1, da:1}), 'RataDie of 1-1-1- ought to be 1');

});