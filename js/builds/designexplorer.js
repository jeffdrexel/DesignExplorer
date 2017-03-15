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

	// Set later by setColorer
	designExplorer.selectedParam = null;

	// Parallel coordinate dimensions
	designExplorer.paramsPC = {};

	// All graphs namespace
	designExplorer.graphs = {};

	sortKeys();
	cleanData();

	// Access this data later
	DesignExplorer.prototype.getData = function () {
		return data;
	};

	// Set default sort by key
	designExplorer.setColorer(designExplorer.params.in[0]);

	/*
	 █████  ███    ██  ██████  ███    ██
	██   ██ ████   ██ ██    ██ ████   ██
	███████ ██ ██  ██ ██    ██ ██ ██  ██
	██   ██ ██  ██ ██ ██    ██ ██  ██ ██
	██   ██ ██   ████  ██████  ██   ████
	*/

	function sortKeys(){
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
	}

	function cleanData(){
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
	}

};

DesignExplorer.getKeyTypeSignifier = function (str) {
	return str + ":";
};

DesignExplorer.prototype.drawParallelCoordinates = function (divSelector) {

	var designExplorer = this;

	designExplorer.graphs._parcoordsDivSelector = divSelector;

	var div = $(divSelector);

	div.html('');

	div.addClass('parcoords');

	designExplorer.graphs.parcoords = d3.parcoords()(divSelector)
		.data(designExplorer.getData())
		// .margin({
		// 	top: 50,
		// 	left: 20,
		// 	bottom: 10,
		// 	right: 20
		// })
		// .smoothness(0.2)
		.color(designExplorer.colorer)
		.alpha(0.2)
		.alphaOnBrushed(0.05)
		.mode("queue")
		.rate(20)
		.dimensions(designExplorer.paramsPC)
		.render()
		.brushMode("1D-axes") // enable brushing
		.autoscale()
		.interactive()
		.reorderable();

		// resize or re-render breaks the brush mode
	// $(window)
	// 	.on('resize', function () {
	// 		designExplorer.graphs.parcoords.width(div.width());
	// 	});
};

/**
 * Tell us which param to color by
 * @param {object} param - Parameter
 */
DesignExplorer.prototype.setColorer = function (param) {

	var designExplorer = this;

	designExplorer.selectedParam = param;

	var data = designExplorer.getData();

	var extents = d3.extent(data, dataAccessor);

	var colorScale = d3.scale.linear()
		.domain(extents)
		.range(["#3b31b0", "#66CCDD"]);

	designExplorer.colorer = function (d) {
		return colorScale(dataAccessor(d));
	};

	function dataAccessor(d) {
		return d[param.original];
	}

};

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImhlYWRlci5qcyIsInN0YXRpY3MvZ2V0S2V5VHlwZVNpZ25pZmllci5qcyIsInBhcnRpYWxzL2RyYXdQYXJhbGxlbENvb3JkaW5hdGVzLmpzIiwicGFydGlhbHMvc2V0Q29sb3Jlci5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDckZBO0FBQ0E7QUFDQTtBQUNBO0FDSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUN2Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZGVzaWduZXhwbG9yZXIuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcclxuICogQGNvbnN0cnVjdG9yXHJcbiAqL1xyXG52YXIgRGVzaWduRXhwbG9yZXIgPSBmdW5jdGlvbiAob3JpZ2luYWxEYXRhKSB7XHJcblxyXG5cdC8qKlxyXG5cdCAqIEBsZW5kcyBEZXNpZ25FeHBsb3Jlci5wcm90b3R5cGVcclxuXHQgKi9cclxuXHR2YXIgZGVzaWduRXhwbG9yZXIgPSB0aGlzO1xyXG5cclxuXHR2YXIgZGF0YSA9IFtdO1xyXG5cclxuXHRkZXNpZ25FeHBsb3Jlci5wYXJhbXMgPSB7XHJcblx0XHQnaW4nOiBbXSxcclxuXHRcdCdvdXQnOiBbXVxyXG5cdH07XHJcblxyXG5cdC8vIFNldCBsYXRlciBieSBzZXRDb2xvcmVyXHJcblx0ZGVzaWduRXhwbG9yZXIuc2VsZWN0ZWRQYXJhbSA9IG51bGw7XHJcblxyXG5cdC8vIFBhcmFsbGVsIGNvb3JkaW5hdGUgZGltZW5zaW9uc1xyXG5cdGRlc2lnbkV4cGxvcmVyLnBhcmFtc1BDID0ge307XHJcblxyXG5cdC8vIEFsbCBncmFwaHMgbmFtZXNwYWNlXHJcblx0ZGVzaWduRXhwbG9yZXIuZ3JhcGhzID0ge307XHJcblxyXG5cdHNvcnRLZXlzKCk7XHJcblx0Y2xlYW5EYXRhKCk7XHJcblxyXG5cdC8vIEFjY2VzcyB0aGlzIGRhdGEgbGF0ZXJcclxuXHREZXNpZ25FeHBsb3Jlci5wcm90b3R5cGUuZ2V0RGF0YSA9IGZ1bmN0aW9uICgpIHtcclxuXHRcdHJldHVybiBkYXRhO1xyXG5cdH07XHJcblxyXG5cdC8vIFNldCBkZWZhdWx0IHNvcnQgYnkga2V5XHJcblx0ZGVzaWduRXhwbG9yZXIuc2V0Q29sb3JlcihkZXNpZ25FeHBsb3Jlci5wYXJhbXMuaW5bMF0pO1xyXG5cclxuXHQvKlxyXG5cdCDilojilojilojilojiloggIOKWiOKWiOKWiCAgICDilojiloggIOKWiOKWiOKWiOKWiOKWiOKWiCAg4paI4paI4paIICAgIOKWiOKWiFxyXG5cdOKWiOKWiCAgIOKWiOKWiCDilojilojilojiloggICDilojilogg4paI4paIICAgIOKWiOKWiCDilojilojilojiloggICDilojilohcclxuXHTilojilojilojilojilojilojilogg4paI4paIIOKWiOKWiCAg4paI4paIIOKWiOKWiCAgICDilojilogg4paI4paIIOKWiOKWiCAg4paI4paIXHJcblx04paI4paIICAg4paI4paIIOKWiOKWiCAg4paI4paIIOKWiOKWiCDilojiloggICAg4paI4paIIOKWiOKWiCAg4paI4paIIOKWiOKWiFxyXG5cdOKWiOKWiCAgIOKWiOKWiCDilojiloggICDilojilojilojiloggIOKWiOKWiOKWiOKWiOKWiOKWiCAg4paI4paIICAg4paI4paI4paI4paIXHJcblx0Ki9cclxuXHJcblx0ZnVuY3Rpb24gc29ydEtleXMoKXtcclxuXHRcdC8vIEluaXRpYWwgQ2xlYW51cFxyXG5cdFx0dmFyIGtleXMgPSBkMy5rZXlzKG9yaWdpbmFsRGF0YVswXSk7XHJcblxyXG5cdFx0Ly8gUG9wdWxhdGUgd2hpY2ggYXJlIGlucHV0IGFuZCBvdXRwdXQga2V5c1xyXG5cdFx0a2V5cy5mb3JFYWNoKGZ1bmN0aW9uIChrZXkpIHtcclxuXHRcdFx0T2JqZWN0LmtleXMoZGVzaWduRXhwbG9yZXIucGFyYW1zKVxyXG5cdFx0XHRcdC5mb3JFYWNoKGZ1bmN0aW9uIChrZXlUeXBlKSB7XHJcblx0XHRcdFx0XHR2YXIgc2lnbmlmaWVyID0gRGVzaWduRXhwbG9yZXIuZ2V0S2V5VHlwZVNpZ25pZmllcihrZXlUeXBlKTtcclxuXHRcdFx0XHRcdHZhciBrZXlPYmo7XHJcblx0XHRcdFx0XHRpZiAoa2V5LnN0YXJ0c1dpdGgoc2lnbmlmaWVyKSkge1xyXG5cdFx0XHRcdFx0XHRrZXlPYmogPSB7XHJcblx0XHRcdFx0XHRcdFx0J29yaWdpbmFsJzoga2V5LFxyXG5cdFx0XHRcdFx0XHRcdCdkaXNwbGF5Oic6IGtleS5zdWJzdHJpbmcoc2lnbmlmaWVyLmxlbmd0aCwga2V5Lmxlbmd0aClcclxuXHRcdFx0XHRcdFx0fTtcclxuXHRcdFx0XHRcdFx0ZGVzaWduRXhwbG9yZXIucGFyYW1zW2tleVR5cGVdLnB1c2goa2V5T2JqKTtcclxuXHRcdFx0XHRcdFx0ZGVzaWduRXhwbG9yZXIucGFyYW1zUENba2V5XSA9IHt9O1xyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdH0pO1xyXG5cdFx0fSk7XHJcblx0fVxyXG5cclxuXHRmdW5jdGlvbiBjbGVhbkRhdGEoKXtcclxuXHRcdC8vIGNsZWFuIGRhdGFcclxuXHRcdG9yaWdpbmFsRGF0YS5mb3JFYWNoKGZ1bmN0aW9uIChkYXR1bSwgaSkge1xyXG5cdFx0XHR2YXIgY2xlYW5lZERhdHVtID0ge1xyXG5cdFx0XHRcdF9pZDogaVxyXG5cdFx0XHR9O1xyXG5cclxuXHRcdFx0T2JqZWN0LmtleXMoZGF0dW0pXHJcblx0XHRcdFx0LmZvckVhY2goZnVuY3Rpb24gKGtleSkge1xyXG5cdFx0XHRcdFx0dmFyIGZsb2F0VmVyc2lvbiA9IHBhcnNlRmxvYXQoZGF0dW1ba2V5XSk7XHJcblx0XHRcdFx0XHRjbGVhbmVkRGF0dW1ba2V5XSA9IGlzTmFOKGZsb2F0VmVyc2lvbikgPyBkYXR1bVtrZXldIDogZmxvYXRWZXJzaW9uO1xyXG5cdFx0XHRcdH0pO1xyXG5cclxuXHRcdFx0ZGF0YS5wdXNoKGNsZWFuZWREYXR1bSk7XHJcblx0XHR9KTtcclxuXHR9XHJcblxyXG59O1xyXG4iLCJEZXNpZ25FeHBsb3Jlci5nZXRLZXlUeXBlU2lnbmlmaWVyID0gZnVuY3Rpb24gKHN0cikge1xyXG5cdHJldHVybiBzdHIgKyBcIjpcIjtcclxufTtcclxuIiwiRGVzaWduRXhwbG9yZXIucHJvdG90eXBlLmRyYXdQYXJhbGxlbENvb3JkaW5hdGVzID0gZnVuY3Rpb24gKGRpdlNlbGVjdG9yKSB7XHJcblxyXG5cdHZhciBkZXNpZ25FeHBsb3JlciA9IHRoaXM7XHJcblxyXG5cdGRlc2lnbkV4cGxvcmVyLmdyYXBocy5fcGFyY29vcmRzRGl2U2VsZWN0b3IgPSBkaXZTZWxlY3RvcjtcclxuXHJcblx0dmFyIGRpdiA9ICQoZGl2U2VsZWN0b3IpO1xyXG5cclxuXHRkaXYuaHRtbCgnJyk7XHJcblxyXG5cdGRpdi5hZGRDbGFzcygncGFyY29vcmRzJyk7XHJcblxyXG5cdGRlc2lnbkV4cGxvcmVyLmdyYXBocy5wYXJjb29yZHMgPSBkMy5wYXJjb29yZHMoKShkaXZTZWxlY3RvcilcclxuXHRcdC5kYXRhKGRlc2lnbkV4cGxvcmVyLmdldERhdGEoKSlcclxuXHRcdC8vIC5tYXJnaW4oe1xyXG5cdFx0Ly8gXHR0b3A6IDUwLFxyXG5cdFx0Ly8gXHRsZWZ0OiAyMCxcclxuXHRcdC8vIFx0Ym90dG9tOiAxMCxcclxuXHRcdC8vIFx0cmlnaHQ6IDIwXHJcblx0XHQvLyB9KVxyXG5cdFx0Ly8gLnNtb290aG5lc3MoMC4yKVxyXG5cdFx0LmNvbG9yKGRlc2lnbkV4cGxvcmVyLmNvbG9yZXIpXHJcblx0XHQuYWxwaGEoMC4yKVxyXG5cdFx0LmFscGhhT25CcnVzaGVkKDAuMDUpXHJcblx0XHQubW9kZShcInF1ZXVlXCIpXHJcblx0XHQucmF0ZSgyMClcclxuXHRcdC5kaW1lbnNpb25zKGRlc2lnbkV4cGxvcmVyLnBhcmFtc1BDKVxyXG5cdFx0LnJlbmRlcigpXHJcblx0XHQuYnJ1c2hNb2RlKFwiMUQtYXhlc1wiKSAvLyBlbmFibGUgYnJ1c2hpbmdcclxuXHRcdC5hdXRvc2NhbGUoKVxyXG5cdFx0LmludGVyYWN0aXZlKClcclxuXHRcdC5yZW9yZGVyYWJsZSgpO1xyXG5cclxuXHRcdC8vIHJlc2l6ZSBvciByZS1yZW5kZXIgYnJlYWtzIHRoZSBicnVzaCBtb2RlXHJcblx0Ly8gJCh3aW5kb3cpXHJcblx0Ly8gXHQub24oJ3Jlc2l6ZScsIGZ1bmN0aW9uICgpIHtcclxuXHQvLyBcdFx0ZGVzaWduRXhwbG9yZXIuZ3JhcGhzLnBhcmNvb3Jkcy53aWR0aChkaXYud2lkdGgoKSk7XHJcblx0Ly8gXHR9KTtcclxufTtcclxuIiwiLyoqXHJcbiAqIFRlbGwgdXMgd2hpY2ggcGFyYW0gdG8gY29sb3IgYnlcclxuICogQHBhcmFtIHtvYmplY3R9IHBhcmFtIC0gUGFyYW1ldGVyXHJcbiAqL1xyXG5EZXNpZ25FeHBsb3Jlci5wcm90b3R5cGUuc2V0Q29sb3JlciA9IGZ1bmN0aW9uIChwYXJhbSkge1xyXG5cclxuXHR2YXIgZGVzaWduRXhwbG9yZXIgPSB0aGlzO1xyXG5cclxuXHRkZXNpZ25FeHBsb3Jlci5zZWxlY3RlZFBhcmFtID0gcGFyYW07XHJcblxyXG5cdHZhciBkYXRhID0gZGVzaWduRXhwbG9yZXIuZ2V0RGF0YSgpO1xyXG5cclxuXHR2YXIgZXh0ZW50cyA9IGQzLmV4dGVudChkYXRhLCBkYXRhQWNjZXNzb3IpO1xyXG5cclxuXHR2YXIgY29sb3JTY2FsZSA9IGQzLnNjYWxlLmxpbmVhcigpXHJcblx0XHQuZG9tYWluKGV4dGVudHMpXHJcblx0XHQucmFuZ2UoW1wiIzNiMzFiMFwiLCBcIiM2NkNDRERcIl0pO1xyXG5cclxuXHRkZXNpZ25FeHBsb3Jlci5jb2xvcmVyID0gZnVuY3Rpb24gKGQpIHtcclxuXHRcdHJldHVybiBjb2xvclNjYWxlKGRhdGFBY2Nlc3NvcihkKSk7XHJcblx0fTtcclxuXHJcblx0ZnVuY3Rpb24gZGF0YUFjY2Vzc29yKGQpIHtcclxuXHRcdHJldHVybiBkW3BhcmFtLm9yaWdpbmFsXTtcclxuXHR9XHJcblxyXG59O1xyXG4iXX0=
