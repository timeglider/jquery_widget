/* Unit testing for timeglider */

// Let's test this function
function isEven(val) {
	return val % 2 === 0;
}

test('testing isEven()', function() {
	ok(isEven(0), 'Zero is an even number');
	ok(isEven(2), 'So is two');
	ok(isEven(-4), 'So is negative four');
	ok(!isEven(1), 'One is not an even number');
	ok(!isEven(-7), 'Neither is negative seven');
});


test("tgDate isLeapYear", function() {
	ok(timeglider.TGDate.isLeapYear(1968), 'The year 1968 WAS a leap year!'); // there was a Feb 29 leap day!
	ok(timeglider.TGDate.isLeapYear(2000), 'The year 2000 WAS leap year!');
	ok(!timeglider.TGDate.isLeapYear(1900), 'The year 1900 WAS NOT a leap year!');
});


test("tgDate isValidDate", function() {
	ok(timeglider.TGDate.isValidDate(2001, 9, 11), '2001-9-11 is a valid date');
  ok(!timeglider.TGDate.isValidDate(2001, 21, 11), '2001-21-11 is NOT a valid date');
  ok(!timeglider.TGDate.isValidDate(0, 7, 11), 'Year zero NOT a valid date');
  ok(timeglider.TGDate.isValidDate(1995, 07, 11), '1995-07-11 IS a valid date');
});