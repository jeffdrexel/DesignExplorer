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

DesignExplorer.getKeyTypeSignifier = function (str) {
	return str + ":";
};

DesignExplorer.prototype.drawParallelCoordinates = function (divSelector) {

	// console.log('drawing');

	var designExplorer = this;

	$(divSelector)
		.html('');

	$(divSelector)
		.addClass('parcoords');

	// console.log(designExplorer.paramsPC);

	var graph = d3.parcoords()(divSelector)
		.data(designExplorer.getData())
		// .margin({
		// 	top: 50,
		// 	left: 20,
		// 	bottom: 10,
		// 	right: 20
		// })
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

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImhlYWRlci5qcyIsInN0YXRpY3MvZ2V0S2V5VHlwZVNpZ25pZmllci5qcyIsInBhcnRpYWxzL2RyYXdQYXJhbGxlbENvb3JkaW5hdGVzLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDNURBO0FBQ0E7QUFDQTtBQUNBO0FDSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImRlc2lnbi1leHBsb3Jlci1saWIuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcclxuICogQGNvbnN0cnVjdG9yXHJcbiAqL1xyXG52YXIgRGVzaWduRXhwbG9yZXIgPSBmdW5jdGlvbiAob3JpZ2luYWxEYXRhKSB7XHJcblxyXG5cdC8qKlxyXG5cdCAqIEBsZW5kcyBEZXNpZ25FeHBsb3Jlci5wcm90b3R5cGVcclxuXHQgKi9cclxuXHR2YXIgZGVzaWduRXhwbG9yZXIgPSB0aGlzO1xyXG5cclxuXHR2YXIgZGF0YSA9IFtdO1xyXG5cclxuXHRkZXNpZ25FeHBsb3Jlci5wYXJhbXMgPSB7XHJcblx0XHQnaW4nOiBbXSxcclxuXHRcdCdvdXQnOiBbXVxyXG5cdH07XHJcblxyXG5cdC8vIFBhcmFsbGVsIGNvb3JkaW5hdGUgZGltZW5zaW9uc1xyXG5cdGRlc2lnbkV4cGxvcmVyLnBhcmFtc1BDID0ge307XHJcblxyXG5cdC8vIEluaXRpYWwgQ2xlYW51cFxyXG5cdHZhciBrZXlzID0gZDMua2V5cyhvcmlnaW5hbERhdGFbMF0pO1xyXG5cclxuXHQvLyBQb3B1bGF0ZSB3aGljaCBhcmUgaW5wdXQgYW5kIG91dHB1dCBrZXlzXHJcblx0a2V5cy5mb3JFYWNoKGZ1bmN0aW9uIChrZXkpIHtcclxuXHRcdE9iamVjdC5rZXlzKGRlc2lnbkV4cGxvcmVyLnBhcmFtcylcclxuXHRcdFx0LmZvckVhY2goZnVuY3Rpb24gKGtleVR5cGUpIHtcclxuXHRcdFx0XHR2YXIgc2lnbmlmaWVyID0gRGVzaWduRXhwbG9yZXIuZ2V0S2V5VHlwZVNpZ25pZmllcihrZXlUeXBlKTtcclxuXHRcdFx0XHR2YXIga2V5T2JqO1xyXG5cdFx0XHRcdGlmIChrZXkuc3RhcnRzV2l0aChzaWduaWZpZXIpKSB7XHJcblx0XHRcdFx0XHRrZXlPYmogPSB7XHJcblx0XHRcdFx0XHRcdCdvcmlnaW5hbCc6IGtleSxcclxuXHRcdFx0XHRcdFx0J2Rpc3BsYXk6Jzoga2V5LnN1YnN0cmluZyhzaWduaWZpZXIubGVuZ3RoLCBrZXkubGVuZ3RoKVxyXG5cdFx0XHRcdFx0fTtcclxuXHRcdFx0XHRcdGRlc2lnbkV4cGxvcmVyLnBhcmFtc1trZXlUeXBlXS5wdXNoKGtleU9iaik7XHJcblx0XHRcdFx0XHRkZXNpZ25FeHBsb3Jlci5wYXJhbXNQQ1trZXldID0ge307XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9KTtcclxuXHR9KTtcclxuXHJcblx0Ly8gY2xlYW4gZGF0YVxyXG5cdG9yaWdpbmFsRGF0YS5mb3JFYWNoKGZ1bmN0aW9uIChkYXR1bSwgaSkge1xyXG5cdFx0dmFyIGNsZWFuZWREYXR1bSA9IHtcclxuXHRcdFx0X2lkOiBpXHJcblx0XHR9O1xyXG5cclxuXHRcdE9iamVjdC5rZXlzKGRhdHVtKVxyXG5cdFx0XHQuZm9yRWFjaChmdW5jdGlvbiAoa2V5KSB7XHJcblx0XHRcdFx0dmFyIGZsb2F0VmVyc2lvbiA9IHBhcnNlRmxvYXQoZGF0dW1ba2V5XSk7XHJcblx0XHRcdFx0Y2xlYW5lZERhdHVtW2tleV0gPSBpc05hTihmbG9hdFZlcnNpb24pID8gZGF0dW1ba2V5XSA6IGZsb2F0VmVyc2lvbjtcclxuXHRcdFx0fSk7XHJcblxyXG5cdFx0ZGF0YS5wdXNoKGNsZWFuZWREYXR1bSk7XHJcblx0fSk7XHJcblxyXG5cdERlc2lnbkV4cGxvcmVyLnByb3RvdHlwZS5nZXREYXRhID0gZnVuY3Rpb24gKCkge1xyXG5cdFx0cmV0dXJuIGRhdGE7XHJcblx0fTtcclxuXHJcbn07XHJcbiIsIkRlc2lnbkV4cGxvcmVyLmdldEtleVR5cGVTaWduaWZpZXIgPSBmdW5jdGlvbiAoc3RyKSB7XHJcblx0cmV0dXJuIHN0ciArIFwiOlwiO1xyXG59O1xyXG4iLCJEZXNpZ25FeHBsb3Jlci5wcm90b3R5cGUuZHJhd1BhcmFsbGVsQ29vcmRpbmF0ZXMgPSBmdW5jdGlvbiAoZGl2U2VsZWN0b3IpIHtcclxuXHJcblx0Ly8gY29uc29sZS5sb2coJ2RyYXdpbmcnKTtcclxuXHJcblx0dmFyIGRlc2lnbkV4cGxvcmVyID0gdGhpcztcclxuXHJcblx0JChkaXZTZWxlY3RvcilcclxuXHRcdC5odG1sKCcnKTtcclxuXHJcblx0JChkaXZTZWxlY3RvcilcclxuXHRcdC5hZGRDbGFzcygncGFyY29vcmRzJyk7XHJcblxyXG5cdC8vIGNvbnNvbGUubG9nKGRlc2lnbkV4cGxvcmVyLnBhcmFtc1BDKTtcclxuXHJcblx0dmFyIGdyYXBoID0gZDMucGFyY29vcmRzKCkoZGl2U2VsZWN0b3IpXHJcblx0XHQuZGF0YShkZXNpZ25FeHBsb3Jlci5nZXREYXRhKCkpXHJcblx0XHQvLyAubWFyZ2luKHtcclxuXHRcdC8vIFx0dG9wOiA1MCxcclxuXHRcdC8vIFx0bGVmdDogMjAsXHJcblx0XHQvLyBcdGJvdHRvbTogMTAsXHJcblx0XHQvLyBcdHJpZ2h0OiAyMFxyXG5cdFx0Ly8gfSlcclxuXHRcdC5hbHBoYSgwLjIpXHJcblx0XHQuYWxwaGFPbkJydXNoZWQoMC4wNSlcclxuXHRcdC5tb2RlKFwicXVldWVcIilcclxuXHRcdC5yYXRlKDIwKVxyXG5cdFx0LmRpbWVuc2lvbnMoZGVzaWduRXhwbG9yZXIucGFyYW1zUEMpXHJcblx0XHQucmVuZGVyKClcclxuXHRcdC5icnVzaE1vZGUoXCIxRC1heGVzXCIpIC8vIGVuYWJsZSBicnVzaGluZ1xyXG5cdFx0LmludGVyYWN0aXZlKClcclxuXHRcdC5yZW9yZGVyYWJsZSgpO1xyXG59O1xyXG4iXX0=
