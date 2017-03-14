/**
 * @constructor
 */
var DesignExplorer = function (originalData) {

	/**
	 * @lends DesignExplorer.prototype
	 */
	var designExplorer = this;

	var data = [];

	designExplorer.params = {
		'in': [],
		'out': []
	};

	// Parallel coordinate dimensions
	designExplorer.paramsPC = {};

	// All graphs namespace
	designExplorer.graphs = {};

	// Initial Cleanup
	var keys = d3.keys(originalData[0]);

	// Populate which are input and output keys
	keys.forEach(function (key) {
		Object.keys(designExplorer.params)
			.forEach(function (keyType) {
				var signifier = DesignExplorer.getKeyTypeSignifier(keyType);
				var keyObj;
				if (key.startsWith(signifier)) {
					keyObj = {
						'original': key,
						'display:': key.substring(signifier.length, key.length)
					};
					designExplorer.params[keyType].push(keyObj);
					designExplorer.paramsPC[key] = {};
				}
			});
	});

	// clean data
	originalData.forEach(function (datum, i) {
		var cleanedDatum = {
			_id: i
		};

		Object.keys(datum)
			.forEach(function (key) {
				var floatVersion = parseFloat(datum[key]);
				cleanedDatum[key] = isNaN(floatVersion) ? datum[key] : floatVersion;
			});

		data.push(cleanedDatum);
	});

	DesignExplorer.prototype.getData = function () {
		return data;
	};

};

DesignExplorer.prototype.drawParallelCoordinates = function (divSelector) {

	var designExplorer = this;

	$(divSelector)
		.html('');

	$(divSelector)
		.addClass('parcoords');

	designExplorer.graphs.parcoords = d3.parcoords()(divSelector)
		.data(designExplorer.getData())
		// .margin({
		// 	top: 50,
		// 	left: 20,
		// 	bottom: 10,
		// 	right: 20
		// })
		// .smoothness(0.2)
		.alpha(0.2)
		.alphaOnBrushed(0.05)
		.mode("queue")
		.rate(20)
		.dimensions(designExplorer.paramsPC)
		.render()
		.brushMode("1D-axes") // enable brushing
		.interactive()
		.reorderable();
};


DesignExplorer.getKeyTypeSignifier = function (str) {
	return str + ":";
};

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImhlYWRlci5qcyIsInBhcnRpYWxzL2RyYXdQYXJhbGxlbENvb3JkaW5hdGVzLmpzIiwic3RhdGljcy9nZXRGaWx0ZXJlZEVudHJpZXMuanMiLCJzdGF0aWNzL2dldEtleVR5cGVTaWduaWZpZXIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUMvREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDN0JBO0FDQUE7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZGVzaWduLWV4cGxvcmVyLWxpYi5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxyXG4gKiBAY29uc3RydWN0b3JcclxuICovXHJcbnZhciBEZXNpZ25FeHBsb3JlciA9IGZ1bmN0aW9uIChvcmlnaW5hbERhdGEpIHtcclxuXHJcblx0LyoqXHJcblx0ICogQGxlbmRzIERlc2lnbkV4cGxvcmVyLnByb3RvdHlwZVxyXG5cdCAqL1xyXG5cdHZhciBkZXNpZ25FeHBsb3JlciA9IHRoaXM7XHJcblxyXG5cdHZhciBkYXRhID0gW107XHJcblxyXG5cdGRlc2lnbkV4cGxvcmVyLnBhcmFtcyA9IHtcclxuXHRcdCdpbic6IFtdLFxyXG5cdFx0J291dCc6IFtdXHJcblx0fTtcclxuXHJcblx0Ly8gUGFyYWxsZWwgY29vcmRpbmF0ZSBkaW1lbnNpb25zXHJcblx0ZGVzaWduRXhwbG9yZXIucGFyYW1zUEMgPSB7fTtcclxuXHJcblx0Ly8gQWxsIGdyYXBocyBuYW1lc3BhY2VcclxuXHRkZXNpZ25FeHBsb3Jlci5ncmFwaHMgPSB7fTtcclxuXHJcblx0Ly8gSW5pdGlhbCBDbGVhbnVwXHJcblx0dmFyIGtleXMgPSBkMy5rZXlzKG9yaWdpbmFsRGF0YVswXSk7XHJcblxyXG5cdC8vIFBvcHVsYXRlIHdoaWNoIGFyZSBpbnB1dCBhbmQgb3V0cHV0IGtleXNcclxuXHRrZXlzLmZvckVhY2goZnVuY3Rpb24gKGtleSkge1xyXG5cdFx0T2JqZWN0LmtleXMoZGVzaWduRXhwbG9yZXIucGFyYW1zKVxyXG5cdFx0XHQuZm9yRWFjaChmdW5jdGlvbiAoa2V5VHlwZSkge1xyXG5cdFx0XHRcdHZhciBzaWduaWZpZXIgPSBEZXNpZ25FeHBsb3Jlci5nZXRLZXlUeXBlU2lnbmlmaWVyKGtleVR5cGUpO1xyXG5cdFx0XHRcdHZhciBrZXlPYmo7XHJcblx0XHRcdFx0aWYgKGtleS5zdGFydHNXaXRoKHNpZ25pZmllcikpIHtcclxuXHRcdFx0XHRcdGtleU9iaiA9IHtcclxuXHRcdFx0XHRcdFx0J29yaWdpbmFsJzoga2V5LFxyXG5cdFx0XHRcdFx0XHQnZGlzcGxheTonOiBrZXkuc3Vic3RyaW5nKHNpZ25pZmllci5sZW5ndGgsIGtleS5sZW5ndGgpXHJcblx0XHRcdFx0XHR9O1xyXG5cdFx0XHRcdFx0ZGVzaWduRXhwbG9yZXIucGFyYW1zW2tleVR5cGVdLnB1c2goa2V5T2JqKTtcclxuXHRcdFx0XHRcdGRlc2lnbkV4cGxvcmVyLnBhcmFtc1BDW2tleV0gPSB7fTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdH0pO1xyXG5cdH0pO1xyXG5cclxuXHQvLyBjbGVhbiBkYXRhXHJcblx0b3JpZ2luYWxEYXRhLmZvckVhY2goZnVuY3Rpb24gKGRhdHVtLCBpKSB7XHJcblx0XHR2YXIgY2xlYW5lZERhdHVtID0ge1xyXG5cdFx0XHRfaWQ6IGlcclxuXHRcdH07XHJcblxyXG5cdFx0T2JqZWN0LmtleXMoZGF0dW0pXHJcblx0XHRcdC5mb3JFYWNoKGZ1bmN0aW9uIChrZXkpIHtcclxuXHRcdFx0XHR2YXIgZmxvYXRWZXJzaW9uID0gcGFyc2VGbG9hdChkYXR1bVtrZXldKTtcclxuXHRcdFx0XHRjbGVhbmVkRGF0dW1ba2V5XSA9IGlzTmFOKGZsb2F0VmVyc2lvbikgPyBkYXR1bVtrZXldIDogZmxvYXRWZXJzaW9uO1xyXG5cdFx0XHR9KTtcclxuXHJcblx0XHRkYXRhLnB1c2goY2xlYW5lZERhdHVtKTtcclxuXHR9KTtcclxuXHJcblx0RGVzaWduRXhwbG9yZXIucHJvdG90eXBlLmdldERhdGEgPSBmdW5jdGlvbiAoKSB7XHJcblx0XHRyZXR1cm4gZGF0YTtcclxuXHR9O1xyXG5cclxufTtcclxuIiwiRGVzaWduRXhwbG9yZXIucHJvdG90eXBlLmRyYXdQYXJhbGxlbENvb3JkaW5hdGVzID0gZnVuY3Rpb24gKGRpdlNlbGVjdG9yKSB7XHJcblxyXG5cdHZhciBkZXNpZ25FeHBsb3JlciA9IHRoaXM7XHJcblxyXG5cdCQoZGl2U2VsZWN0b3IpXHJcblx0XHQuaHRtbCgnJyk7XHJcblxyXG5cdCQoZGl2U2VsZWN0b3IpXHJcblx0XHQuYWRkQ2xhc3MoJ3BhcmNvb3JkcycpO1xyXG5cclxuXHRkZXNpZ25FeHBsb3Jlci5ncmFwaHMucGFyY29vcmRzID0gZDMucGFyY29vcmRzKCkoZGl2U2VsZWN0b3IpXHJcblx0XHQuZGF0YShkZXNpZ25FeHBsb3Jlci5nZXREYXRhKCkpXHJcblx0XHQvLyAubWFyZ2luKHtcclxuXHRcdC8vIFx0dG9wOiA1MCxcclxuXHRcdC8vIFx0bGVmdDogMjAsXHJcblx0XHQvLyBcdGJvdHRvbTogMTAsXHJcblx0XHQvLyBcdHJpZ2h0OiAyMFxyXG5cdFx0Ly8gfSlcclxuXHRcdC8vIC5zbW9vdGhuZXNzKDAuMilcclxuXHRcdC5hbHBoYSgwLjIpXHJcblx0XHQuYWxwaGFPbkJydXNoZWQoMC4wNSlcclxuXHRcdC5tb2RlKFwicXVldWVcIilcclxuXHRcdC5yYXRlKDIwKVxyXG5cdFx0LmRpbWVuc2lvbnMoZGVzaWduRXhwbG9yZXIucGFyYW1zUEMpXHJcblx0XHQucmVuZGVyKClcclxuXHRcdC5icnVzaE1vZGUoXCIxRC1heGVzXCIpIC8vIGVuYWJsZSBicnVzaGluZ1xyXG5cdFx0LmludGVyYWN0aXZlKClcclxuXHRcdC5yZW9yZGVyYWJsZSgpO1xyXG59O1xyXG4iLCIiLCJEZXNpZ25FeHBsb3Jlci5nZXRLZXlUeXBlU2lnbmlmaWVyID0gZnVuY3Rpb24gKHN0cikge1xyXG5cdHJldHVybiBzdHIgKyBcIjpcIjtcclxufTtcclxuIl19
