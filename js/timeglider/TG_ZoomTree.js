

/*
      zoomTree
      ****************
      there's no zoom level of 0, so we create an empty element @ 0

      This could eventually be a more flexible system so that a 1-100 
      value-scale could apply not to "5 hours to 10 billion years", but 
      rather to 1 month to 10 years. For now, it's static according to 
      a "universal" system.
*/
  
timeglider.zoomTree = [
{},
{unit:"da", width:35000,level:1, label:"5 hours"},
{unit:"da", width:17600,level:2, label:"7 hours"},
{unit:"da", width:8800,level:3, label:"10 hours"},
{unit:"da", width:4400,level:4, label:"12 hours"},
{unit:"da", width:2200, level:5, label:"14 hours"},
{unit:"da", width:1100, level:6, label:"17 hours"},
{unit:"da", width:550, level:7, label:"22 hours"},
{unit:"da", width:432, level:8, label:"1 DAY"},
{unit:"da", width:343, level:9, label:"1.5 days"},
{unit:"da", width:272, level:10, label:"2 days"},
{unit:"da", width:216, level:11, label:"2.5 days"},
{unit:"da", width:171, level:12, label:"3 days"},
{unit:"da", width:136, level:13, label:"3.5 days"},
{unit:"da", width:108, level:14, label:"4 days"},
/* 108 * 30 = equiv to a 3240 month */
{unit:"mo", width:2509, level:15, label:"6 days"},
{unit:"mo", width:1945, level:16, label:"1 WEEK"},
{unit:"mo", width:1508, level:17, label:"10 days"},
{unit:"mo", width:1169, level:18, label:"2 weeks"},
{unit:"mo", width:913, level:19, label:"2.5 weeks"},
{unit:"mo", width:719, level:20, label:"3 weeks"},
{unit:"mo", width:566, level:21, label:"3.5 weeks"},
{unit:"mo", width:453, level:22, label:"1 MONTH"},
{unit:"mo", width:362, level:23, label:"5.5 weeks"},
{unit:"mo", width:290, level:24, label:"7 weeks"},
{unit:"mo", width:232, level:25, label:"2 months"},
{unit:"mo", width:186, level:26, label:"2.5 months"},
{unit:"mo", width:148, level:27, label:"3 months"},
{unit:"mo", width:119, level:28, label:"4 months"},
{unit:"mo", width:95,  level:29, label:"5 months"},
{unit:"mo", width:76,  level:30, label:"6 months"},
/* 76 * 12 = equiv to a 912 year */
{unit:"ye", width:723, level:31, label:"9 months"},
{unit:"ye", width:573, level:32, label:"1 YEAR"},
{unit:"ye", width:455, level:33, label:"1.25 years"},
{unit:"ye", width:361, level:34, label:"1.5 years"},
{unit:"ye", width:286, level:35, label:"2 years"},
{unit:"ye", width:227, level:36, label:"2.5 years"},
{unit:"ye", width:179, level:37, label:"3 years"},
{unit:"ye", width:142, level:38, label:"4 years"},
{unit:"ye", width:113,  level:39, label:"5 years"},
{unit:"ye", width:89,  level:40, label:"6 years"},
{unit:"de", width:705, level:41, label:"8 years"},
{unit:"de", width:559, level:42, label:"10 years"},
{unit:"de", width:443, level:43, label:"13 years"},

{unit:"de", width:302, level:44, label:"16 years"},
{unit:"de", width:240, level:45, label:"20 years"},
{unit:"de", width:190, level:46, label:"25 years"},
{unit:"de", width:150, level:47, label:"30 years"},
{unit:"de", width:120, level:48, label:"40 years"},
{unit:"de", width:95,  level:49, label:"50 years"},
{unit:"de", width:76,  level:50, label:"65 years"},
{unit:"ce", width:600, level:51, label:"80 years"},
{unit:"ce", width:480, level:52, label:"100 years"},
{unit:"ce", width:381, level:53, label:"130 years"},
{unit:"ce", width:302, level:54, label:"160 years"},
{unit:"ce", width:240, level:55, label:"200 years"},
{unit:"ce", width:190, level:56, label:"250 years"},
{unit:"ce", width:150, level:57, label:"300 years"},
{unit:"ce", width:120, level:58, label:"400 years"},
{unit:"ce", width:95,  level:59, label:"500 years"},
{unit:"ce", width:76,  level:60, label:"600 years"},
{unit:"thou", width:603, level:61, label:"1000 years"},
{unit:"thou", width:478, level:62, label:"1200 years"},
{unit:"thou", width:379, level:63, label:"1800 years"},
{unit:"thou", width:301, level:64, label:"160 years"},
{unit:"thou", width:239, level:65, label:"xxx years"},
{unit:"thou", width:190, level:66, label:"xxx years"},
{unit:"thou", width:150, level:67, label:"xxx years"},
{unit:"thou", width:120, level:68, label:"xxx years"},
{unit:"thou", width:95, level:69, label:"8,000 years"},
{unit:"thou", width:76,  level:70, label:"10,000 years"},
{unit:"tenthou", width:603, level:71, label:"15,000 years"},
{unit:"tenthou", width:358, level:72, label:"20,000 years"},
{unit:"tenthou", width:213, level:73, label:"30,000 years"},
{unit:"tenthou", width:126, level:74, label:"60,000 years"},
{unit:"tenthou", width:76, level:75, label:"100,000 years"},
{unit:"hundredthou", width:603, level:76, label:"180,000 years"},
{unit:"hundredthou", width:358, level:77, label:"300,000 years"},
{unit:"hundredthou", width:213, level:78, label:"500,000 years"},
{unit:"hundredthou", width:126, level:79, label:"800,000 years"},
{unit:"hundredthou", width:76,  level:80, label:"1 million years"},
{unit:"mill", width:603, level:81, label:"1.2 million years"},
{unit:"mill", width:358, level:82, label:"2 million years"},
{unit:"mill", width:213, level:83, label:"3 million years"},
{unit:"mill", width:126, level:84, label:"5 million years"},
{unit:"mill", width:76, level:85, label:"10 million years"},
{unit:"tenmill", width:603, level:86, label:"15 million years"},
{unit:"tenmill", width:358, level:87, label:"30 million years"},
{unit:"tenmill", width:213, level:88, label:"50 million years"},
{unit:"tenmill", width:126, level:89, label:"80 million years"},
{unit:"tenmill", width:76,  level:90, label:"100 million years"},
{unit:"hundredmill", width:603, level:91, label:"120 million years"},
{unit:"hundredmill", width:358, level:92, label:"200 million years"},
{unit:"hundredmill", width:213, level:93, label:"300 million years"},
{unit:"hundredmill", width:126, level:94, label:"500 million years"},
{unit:"hundredmill", width:76, level:95, label:"1 billion years"},
{unit:"bill", width:603, level:96, label:"15 million years"},
{unit:"bill", width:358, level:97, label:"30 million years"},
{unit:"bill", width:213, level:98, label:"50 million years"},
{unit:"bill", width:126, level:99, label:"80 million years"},
{unit:"bill", width:76,  level:100, label:"100 billion years"}
];


timeglider.calculateSecPerPx = function (zt) {
  	for (var z=1; z<zt.length; z++) {
			var zl = zt[z];
			var sec = 0;
			switch(zl.unit) {
				case "da": sec =   86400; break;
				case "mo": sec =   2419200; break; // assumes only 28 days per 
				case "ye": sec =   31536000; break;
				case "de": sec =   315360000; break;
				case "ce": sec =   3153600000; break;
				case "thou": sec =    3153600000; break;
				case "tenthou": sec = 31536000000; break;
				case "hundredthou": sec = 315360000000; break;
				case "mill": sec = 3153600000000; break;
				case "tenmill": sec = 290304000000000; break;
				case "hundredmill": sec = 2903040000000000; break;
				case "bill": sec =29030400000000000; break;
			}
			// pixels
			zl.spp = sec / parseInt(zl.width);
			// trace ("level " + z + " unit:" + zl.unit.substr(0,2) + " sec:" + Math.floor(zl.spp));
		}

// call it right away to establish values
}(timeglider.zoomTree);

		