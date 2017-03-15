/**
 * @constructor
 */
var DesignExplorer = function (originalData) {

	/**
	 * @lends DesignExplorer.prototype
	 */
	var designExplorer = this;

	var data = [];

	// Dictionaried params
	designExplorer.params = {};

	// All params
	designExplorer.paramsAll = [];

	// Set later by setColorer
	designExplorer.selectedParam = null;

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

	function sortKeys() {
		// Initial Cleanup
		var keys = d3.keys(originalData[0]);

		// Populate which are input and output keys
		keys.forEach(function (key) {
			Object.keys(DesignExplorer.typeDisplayDictionary)
				.forEach(function (keyType) {
					var type = DesignExplorer.typeDisplayDictionary[keyType];
					var signifier = type.signifier;
					var keyObj;
					if (key.startsWith(signifier)) {
						keyObj=new DesignExplorer.Param(key,type);
						designExplorer.paramsAll.push(keyObj);
						designExplorer.params[keyType] = designExplorer.params[keyType] || [];
						designExplorer.params[keyType].push(keyObj);
					}
				});
		});
	}

	function cleanData() {
		// clean data
		originalData.forEach(function (datum, i) {
			var cleanedDatum = {
				_id: i
			};

			Object.keys(datum)
				.forEach(function (key) {
					var keyObj = designExplorer.paramsAll.reduce(function (prev, cur) {
						return cur.original === key ? cur : prev;
					}, null);
					var floatVersion = parseFloat(datum[key]);
					var cleanKey = keyObj ? keyObj[DesignExplorer.dataKey] : key;
					cleanedDatum[cleanKey] = isNaN(floatVersion) ? datum[key] : floatVersion;
				});

			data.push(cleanedDatum);
		});
	}

};

DesignExplorer.dataKey='cleanKey';

DesignExplorer.Param = function (key, type) {
	var param = this;

	param.original = key;

	param.display = key.substring(type.signifier.length, key.length);

	param.type = type;

	param.cleanKey = key.replace(':', '_')
		.replace('[', '_')
		.replace(']', '_');

	param.shownInParacoords = true;
};

DesignExplorer.prototype.drawParallelCoordinates = function (divSelector) {

	var designExplorer = this;

	designExplorer.graphs._parcoordsDivSelector = divSelector;

	var div = $(divSelector);

	div.html('');

	div.addClass('parcoords');

	var dimensions = designExplorer.paramsAll.reduce(function (prev, cur) {
		prev[cur[DesignExplorer.dataKey]] = {};
		return prev;
	}, {});

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
		.dimensions(dimensions)
		.render()
		.brushMode("1D-axes") // enable brushing
		.autoscale()
		.interactive()
		.reorderable();

	postRender();

	designExplorer.graphs.parcoords.on('render', postRender);

	function postRender() {
		d3.selectAll(divSelector + " text.label")
			.each(function (d, i) {
				var key = designExplorer.getParamFromDatakey(d);
				d3.select(this)
					.text(key.display);
			});

		var ticklabels=d3.selectAll(divSelector + " g.tick text")
			.style("font-size", "9px");
	}

	// resize or re-render breaks the brush mode
	// $(window)
	// 	.on('resize', function () {
	// 		designExplorer.graphs.parcoords.width(div.width());
	// 	});
};

DesignExplorer.prototype.getParamFromDatakey = function (dataKey) {
	var designExplorer = this;

	return designExplorer.paramsAll.reduce(function (prev, cur) {
		return cur[DesignExplorer.dataKey] === dataKey ? cur : prev;
	}, null);
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

	if(designExplorer.graphs.parcoords) {
		designExplorer.graphs.parcoords.color(designExplorer.colorer).render();
	}

	function dataAccessor(d) {
		return d[param[DesignExplorer.dataKey]];
	}

};

DesignExplorer.typeDisplayDictionary={
  'in':{
    'signifier': 'in:',
    'key': 'in',
    'display':'Input',
  },
  'out':{
    'signifier': 'out:',
    'key': 'out',
    'display':'Output'
  }
};

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImhlYWRlci5qcyIsImNvbnN0cnVjdG9ycy9QYXJhbS5qcyIsInBhcnRpYWxzL2RyYXdQYXJhbGxlbENvb3JkaW5hdGVzLmpzIiwicGFydGlhbHMvZ2V0UGFyYW1Gcm9tRGF0YWtleS5qcyIsInBhcnRpYWxzL3NldENvbG9yZXIuanMiLCJzdGF0aWNzL3R5cGVEaXNwbGF5RGljdGlvbmFyeS5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDeEZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDZkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUM1REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ1BBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUMvQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZGVzaWduZXhwbG9yZXIuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcclxuICogQGNvbnN0cnVjdG9yXHJcbiAqL1xyXG52YXIgRGVzaWduRXhwbG9yZXIgPSBmdW5jdGlvbiAob3JpZ2luYWxEYXRhKSB7XHJcblxyXG5cdC8qKlxyXG5cdCAqIEBsZW5kcyBEZXNpZ25FeHBsb3Jlci5wcm90b3R5cGVcclxuXHQgKi9cclxuXHR2YXIgZGVzaWduRXhwbG9yZXIgPSB0aGlzO1xyXG5cclxuXHR2YXIgZGF0YSA9IFtdO1xyXG5cclxuXHQvLyBEaWN0aW9uYXJpZWQgcGFyYW1zXHJcblx0ZGVzaWduRXhwbG9yZXIucGFyYW1zID0ge307XHJcblxyXG5cdC8vIEFsbCBwYXJhbXNcclxuXHRkZXNpZ25FeHBsb3Jlci5wYXJhbXNBbGwgPSBbXTtcclxuXHJcblx0Ly8gU2V0IGxhdGVyIGJ5IHNldENvbG9yZXJcclxuXHRkZXNpZ25FeHBsb3Jlci5zZWxlY3RlZFBhcmFtID0gbnVsbDtcclxuXHJcblx0Ly8gQWxsIGdyYXBocyBuYW1lc3BhY2VcclxuXHRkZXNpZ25FeHBsb3Jlci5ncmFwaHMgPSB7fTtcclxuXHJcblx0c29ydEtleXMoKTtcclxuXHRjbGVhbkRhdGEoKTtcclxuXHJcblx0Ly8gQWNjZXNzIHRoaXMgZGF0YSBsYXRlclxyXG5cdERlc2lnbkV4cGxvcmVyLnByb3RvdHlwZS5nZXREYXRhID0gZnVuY3Rpb24gKCkge1xyXG5cdFx0cmV0dXJuIGRhdGE7XHJcblx0fTtcclxuXHJcblx0Ly8gU2V0IGRlZmF1bHQgc29ydCBieSBrZXlcclxuXHRkZXNpZ25FeHBsb3Jlci5zZXRDb2xvcmVyKGRlc2lnbkV4cGxvcmVyLnBhcmFtcy5pblswXSk7XHJcblxyXG5cdC8qXHJcblx0IOKWiOKWiOKWiOKWiOKWiCAg4paI4paI4paIICAgIOKWiOKWiCAg4paI4paI4paI4paI4paI4paIICDilojilojiloggICAg4paI4paIXHJcblx04paI4paIICAg4paI4paIIOKWiOKWiOKWiOKWiCAgIOKWiOKWiCDilojiloggICAg4paI4paIIOKWiOKWiOKWiOKWiCAgIOKWiOKWiFxyXG5cdOKWiOKWiOKWiOKWiOKWiOKWiOKWiCDilojilogg4paI4paIICDilojilogg4paI4paIICAgIOKWiOKWiCDilojilogg4paI4paIICDilojilohcclxuXHTilojiloggICDilojilogg4paI4paIICDilojilogg4paI4paIIOKWiOKWiCAgICDilojilogg4paI4paIICDilojilogg4paI4paIXHJcblx04paI4paIICAg4paI4paIIOKWiOKWiCAgIOKWiOKWiOKWiOKWiCAg4paI4paI4paI4paI4paI4paIICDilojiloggICDilojilojilojilohcclxuXHQqL1xyXG5cclxuXHRmdW5jdGlvbiBzb3J0S2V5cygpIHtcclxuXHRcdC8vIEluaXRpYWwgQ2xlYW51cFxyXG5cdFx0dmFyIGtleXMgPSBkMy5rZXlzKG9yaWdpbmFsRGF0YVswXSk7XHJcblxyXG5cdFx0Ly8gUG9wdWxhdGUgd2hpY2ggYXJlIGlucHV0IGFuZCBvdXRwdXQga2V5c1xyXG5cdFx0a2V5cy5mb3JFYWNoKGZ1bmN0aW9uIChrZXkpIHtcclxuXHRcdFx0T2JqZWN0LmtleXMoRGVzaWduRXhwbG9yZXIudHlwZURpc3BsYXlEaWN0aW9uYXJ5KVxyXG5cdFx0XHRcdC5mb3JFYWNoKGZ1bmN0aW9uIChrZXlUeXBlKSB7XHJcblx0XHRcdFx0XHR2YXIgdHlwZSA9IERlc2lnbkV4cGxvcmVyLnR5cGVEaXNwbGF5RGljdGlvbmFyeVtrZXlUeXBlXTtcclxuXHRcdFx0XHRcdHZhciBzaWduaWZpZXIgPSB0eXBlLnNpZ25pZmllcjtcclxuXHRcdFx0XHRcdHZhciBrZXlPYmo7XHJcblx0XHRcdFx0XHRpZiAoa2V5LnN0YXJ0c1dpdGgoc2lnbmlmaWVyKSkge1xyXG5cdFx0XHRcdFx0XHRrZXlPYmo9bmV3IERlc2lnbkV4cGxvcmVyLlBhcmFtKGtleSx0eXBlKTtcclxuXHRcdFx0XHRcdFx0ZGVzaWduRXhwbG9yZXIucGFyYW1zQWxsLnB1c2goa2V5T2JqKTtcclxuXHRcdFx0XHRcdFx0ZGVzaWduRXhwbG9yZXIucGFyYW1zW2tleVR5cGVdID0gZGVzaWduRXhwbG9yZXIucGFyYW1zW2tleVR5cGVdIHx8IFtdO1xyXG5cdFx0XHRcdFx0XHRkZXNpZ25FeHBsb3Jlci5wYXJhbXNba2V5VHlwZV0ucHVzaChrZXlPYmopO1xyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdH0pO1xyXG5cdFx0fSk7XHJcblx0fVxyXG5cclxuXHRmdW5jdGlvbiBjbGVhbkRhdGEoKSB7XHJcblx0XHQvLyBjbGVhbiBkYXRhXHJcblx0XHRvcmlnaW5hbERhdGEuZm9yRWFjaChmdW5jdGlvbiAoZGF0dW0sIGkpIHtcclxuXHRcdFx0dmFyIGNsZWFuZWREYXR1bSA9IHtcclxuXHRcdFx0XHRfaWQ6IGlcclxuXHRcdFx0fTtcclxuXHJcblx0XHRcdE9iamVjdC5rZXlzKGRhdHVtKVxyXG5cdFx0XHRcdC5mb3JFYWNoKGZ1bmN0aW9uIChrZXkpIHtcclxuXHRcdFx0XHRcdHZhciBrZXlPYmogPSBkZXNpZ25FeHBsb3Jlci5wYXJhbXNBbGwucmVkdWNlKGZ1bmN0aW9uIChwcmV2LCBjdXIpIHtcclxuXHRcdFx0XHRcdFx0cmV0dXJuIGN1ci5vcmlnaW5hbCA9PT0ga2V5ID8gY3VyIDogcHJldjtcclxuXHRcdFx0XHRcdH0sIG51bGwpO1xyXG5cdFx0XHRcdFx0dmFyIGZsb2F0VmVyc2lvbiA9IHBhcnNlRmxvYXQoZGF0dW1ba2V5XSk7XHJcblx0XHRcdFx0XHR2YXIgY2xlYW5LZXkgPSBrZXlPYmogPyBrZXlPYmpbRGVzaWduRXhwbG9yZXIuZGF0YUtleV0gOiBrZXk7XHJcblx0XHRcdFx0XHRjbGVhbmVkRGF0dW1bY2xlYW5LZXldID0gaXNOYU4oZmxvYXRWZXJzaW9uKSA/IGRhdHVtW2tleV0gOiBmbG9hdFZlcnNpb247XHJcblx0XHRcdFx0fSk7XHJcblxyXG5cdFx0XHRkYXRhLnB1c2goY2xlYW5lZERhdHVtKTtcclxuXHRcdH0pO1xyXG5cdH1cclxuXHJcbn07XHJcblxyXG5EZXNpZ25FeHBsb3Jlci5kYXRhS2V5PSdjbGVhbktleSc7XHJcbiIsIkRlc2lnbkV4cGxvcmVyLlBhcmFtID0gZnVuY3Rpb24gKGtleSwgdHlwZSkge1xyXG5cdHZhciBwYXJhbSA9IHRoaXM7XHJcblxyXG5cdHBhcmFtLm9yaWdpbmFsID0ga2V5O1xyXG5cclxuXHRwYXJhbS5kaXNwbGF5ID0ga2V5LnN1YnN0cmluZyh0eXBlLnNpZ25pZmllci5sZW5ndGgsIGtleS5sZW5ndGgpO1xyXG5cclxuXHRwYXJhbS50eXBlID0gdHlwZTtcclxuXHJcblx0cGFyYW0uY2xlYW5LZXkgPSBrZXkucmVwbGFjZSgnOicsICdfJylcclxuXHRcdC5yZXBsYWNlKCdbJywgJ18nKVxyXG5cdFx0LnJlcGxhY2UoJ10nLCAnXycpO1xyXG5cclxuXHRwYXJhbS5zaG93bkluUGFyYWNvb3JkcyA9IHRydWU7XHJcbn07XHJcbiIsIkRlc2lnbkV4cGxvcmVyLnByb3RvdHlwZS5kcmF3UGFyYWxsZWxDb29yZGluYXRlcyA9IGZ1bmN0aW9uIChkaXZTZWxlY3Rvcikge1xyXG5cclxuXHR2YXIgZGVzaWduRXhwbG9yZXIgPSB0aGlzO1xyXG5cclxuXHRkZXNpZ25FeHBsb3Jlci5ncmFwaHMuX3BhcmNvb3Jkc0RpdlNlbGVjdG9yID0gZGl2U2VsZWN0b3I7XHJcblxyXG5cdHZhciBkaXYgPSAkKGRpdlNlbGVjdG9yKTtcclxuXHJcblx0ZGl2Lmh0bWwoJycpO1xyXG5cclxuXHRkaXYuYWRkQ2xhc3MoJ3BhcmNvb3JkcycpO1xyXG5cclxuXHR2YXIgZGltZW5zaW9ucyA9IGRlc2lnbkV4cGxvcmVyLnBhcmFtc0FsbC5yZWR1Y2UoZnVuY3Rpb24gKHByZXYsIGN1cikge1xyXG5cdFx0cHJldltjdXJbRGVzaWduRXhwbG9yZXIuZGF0YUtleV1dID0ge307XHJcblx0XHRyZXR1cm4gcHJldjtcclxuXHR9LCB7fSk7XHJcblxyXG5cdGRlc2lnbkV4cGxvcmVyLmdyYXBocy5wYXJjb29yZHMgPSBkMy5wYXJjb29yZHMoKShkaXZTZWxlY3RvcilcclxuXHRcdC5kYXRhKGRlc2lnbkV4cGxvcmVyLmdldERhdGEoKSlcclxuXHRcdC8vIC5tYXJnaW4oe1xyXG5cdFx0Ly8gXHR0b3A6IDUwLFxyXG5cdFx0Ly8gXHRsZWZ0OiAyMCxcclxuXHRcdC8vIFx0Ym90dG9tOiAxMCxcclxuXHRcdC8vIFx0cmlnaHQ6IDIwXHJcblx0XHQvLyB9KVxyXG5cdFx0Ly8gLnNtb290aG5lc3MoMC4yKVxyXG5cdFx0LmNvbG9yKGRlc2lnbkV4cGxvcmVyLmNvbG9yZXIpXHJcblx0XHQuYWxwaGEoMC4yKVxyXG5cdFx0LmFscGhhT25CcnVzaGVkKDAuMDUpXHJcblx0XHQubW9kZShcInF1ZXVlXCIpXHJcblx0XHQucmF0ZSgyMClcclxuXHRcdC5kaW1lbnNpb25zKGRpbWVuc2lvbnMpXHJcblx0XHQucmVuZGVyKClcclxuXHRcdC5icnVzaE1vZGUoXCIxRC1heGVzXCIpIC8vIGVuYWJsZSBicnVzaGluZ1xyXG5cdFx0LmF1dG9zY2FsZSgpXHJcblx0XHQuaW50ZXJhY3RpdmUoKVxyXG5cdFx0LnJlb3JkZXJhYmxlKCk7XHJcblxyXG5cdHBvc3RSZW5kZXIoKTtcclxuXHJcblx0ZGVzaWduRXhwbG9yZXIuZ3JhcGhzLnBhcmNvb3Jkcy5vbigncmVuZGVyJywgcG9zdFJlbmRlcik7XHJcblxyXG5cdGZ1bmN0aW9uIHBvc3RSZW5kZXIoKSB7XHJcblx0XHRkMy5zZWxlY3RBbGwoZGl2U2VsZWN0b3IgKyBcIiB0ZXh0LmxhYmVsXCIpXHJcblx0XHRcdC5lYWNoKGZ1bmN0aW9uIChkLCBpKSB7XHJcblx0XHRcdFx0dmFyIGtleSA9IGRlc2lnbkV4cGxvcmVyLmdldFBhcmFtRnJvbURhdGFrZXkoZCk7XHJcblx0XHRcdFx0ZDMuc2VsZWN0KHRoaXMpXHJcblx0XHRcdFx0XHQudGV4dChrZXkuZGlzcGxheSk7XHJcblx0XHRcdH0pO1xyXG5cclxuXHRcdHZhciB0aWNrbGFiZWxzPWQzLnNlbGVjdEFsbChkaXZTZWxlY3RvciArIFwiIGcudGljayB0ZXh0XCIpXHJcblx0XHRcdC5zdHlsZShcImZvbnQtc2l6ZVwiLCBcIjlweFwiKTtcclxuXHR9XHJcblxyXG5cdC8vIHJlc2l6ZSBvciByZS1yZW5kZXIgYnJlYWtzIHRoZSBicnVzaCBtb2RlXHJcblx0Ly8gJCh3aW5kb3cpXHJcblx0Ly8gXHQub24oJ3Jlc2l6ZScsIGZ1bmN0aW9uICgpIHtcclxuXHQvLyBcdFx0ZGVzaWduRXhwbG9yZXIuZ3JhcGhzLnBhcmNvb3Jkcy53aWR0aChkaXYud2lkdGgoKSk7XHJcblx0Ly8gXHR9KTtcclxufTtcclxuIiwiRGVzaWduRXhwbG9yZXIucHJvdG90eXBlLmdldFBhcmFtRnJvbURhdGFrZXkgPSBmdW5jdGlvbiAoZGF0YUtleSkge1xyXG5cdHZhciBkZXNpZ25FeHBsb3JlciA9IHRoaXM7XHJcblxyXG5cdHJldHVybiBkZXNpZ25FeHBsb3Jlci5wYXJhbXNBbGwucmVkdWNlKGZ1bmN0aW9uIChwcmV2LCBjdXIpIHtcclxuXHRcdHJldHVybiBjdXJbRGVzaWduRXhwbG9yZXIuZGF0YUtleV0gPT09IGRhdGFLZXkgPyBjdXIgOiBwcmV2O1xyXG5cdH0sIG51bGwpO1xyXG59O1xyXG4iLCIvKipcclxuICogVGVsbCB1cyB3aGljaCBwYXJhbSB0byBjb2xvciBieVxyXG4gKiBAcGFyYW0ge29iamVjdH0gcGFyYW0gLSBQYXJhbWV0ZXJcclxuICovXHJcbkRlc2lnbkV4cGxvcmVyLnByb3RvdHlwZS5zZXRDb2xvcmVyID0gZnVuY3Rpb24gKHBhcmFtKSB7XHJcblxyXG5cdHZhciBkZXNpZ25FeHBsb3JlciA9IHRoaXM7XHJcblxyXG5cdGRlc2lnbkV4cGxvcmVyLnNlbGVjdGVkUGFyYW0gPSBwYXJhbTtcclxuXHJcblx0dmFyIGRhdGEgPSBkZXNpZ25FeHBsb3Jlci5nZXREYXRhKCk7XHJcblxyXG5cdHZhciBleHRlbnRzID0gZDMuZXh0ZW50KGRhdGEsIGRhdGFBY2Nlc3Nvcik7XHJcblxyXG5cdHZhciBjb2xvclNjYWxlID0gZDMuc2NhbGUubGluZWFyKClcclxuXHRcdC5kb21haW4oZXh0ZW50cylcclxuXHRcdC5yYW5nZShbXCIjM2IzMWIwXCIsIFwiIzY2Q0NERFwiXSk7XHJcblxyXG5cdGRlc2lnbkV4cGxvcmVyLmNvbG9yZXIgPSBmdW5jdGlvbiAoZCkge1xyXG5cdFx0cmV0dXJuIGNvbG9yU2NhbGUoZGF0YUFjY2Vzc29yKGQpKTtcclxuXHR9O1xyXG5cclxuXHRpZihkZXNpZ25FeHBsb3Jlci5ncmFwaHMucGFyY29vcmRzKSB7XHJcblx0XHRkZXNpZ25FeHBsb3Jlci5ncmFwaHMucGFyY29vcmRzLmNvbG9yKGRlc2lnbkV4cGxvcmVyLmNvbG9yZXIpLnJlbmRlcigpO1xyXG5cdH1cclxuXHJcblx0ZnVuY3Rpb24gZGF0YUFjY2Vzc29yKGQpIHtcclxuXHRcdHJldHVybiBkW3BhcmFtW0Rlc2lnbkV4cGxvcmVyLmRhdGFLZXldXTtcclxuXHR9XHJcblxyXG59O1xyXG4iLCJEZXNpZ25FeHBsb3Jlci50eXBlRGlzcGxheURpY3Rpb25hcnk9e1xyXG4gICdpbic6e1xyXG4gICAgJ3NpZ25pZmllcic6ICdpbjonLFxyXG4gICAgJ2tleSc6ICdpbicsXHJcbiAgICAnZGlzcGxheSc6J0lucHV0JyxcclxuICB9LFxyXG4gICdvdXQnOntcclxuICAgICdzaWduaWZpZXInOiAnb3V0OicsXHJcbiAgICAna2V5JzogJ291dCcsXHJcbiAgICAnZGlzcGxheSc6J091dHB1dCdcclxuICB9XHJcbn07XHJcbiJdfQ==
