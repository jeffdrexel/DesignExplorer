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

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImhlYWRlci5qcyIsImNvbnN0cnVjdG9ycy9QYXJhbS5qcyIsInN0YXRpY3MvdHlwZURpc3BsYXlEaWN0aW9uYXJ5LmpzIiwicGFydGlhbHMvZHJhd1BhcmFsbGVsQ29vcmRpbmF0ZXMuanMiLCJwYXJ0aWFscy9nZXRQYXJhbUZyb21EYXRha2V5LmpzIiwicGFydGlhbHMvc2V0Q29sb3Jlci5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDeEZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDZkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNaQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQzVEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDUEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJkZXNpZ25leHBsb3Jlci5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxyXG4gKiBAY29uc3RydWN0b3JcclxuICovXHJcbnZhciBEZXNpZ25FeHBsb3JlciA9IGZ1bmN0aW9uIChvcmlnaW5hbERhdGEpIHtcclxuXHJcblx0LyoqXHJcblx0ICogQGxlbmRzIERlc2lnbkV4cGxvcmVyLnByb3RvdHlwZVxyXG5cdCAqL1xyXG5cdHZhciBkZXNpZ25FeHBsb3JlciA9IHRoaXM7XHJcblxyXG5cdHZhciBkYXRhID0gW107XHJcblxyXG5cdC8vIERpY3Rpb25hcmllZCBwYXJhbXNcclxuXHRkZXNpZ25FeHBsb3Jlci5wYXJhbXMgPSB7fTtcclxuXHJcblx0Ly8gQWxsIHBhcmFtc1xyXG5cdGRlc2lnbkV4cGxvcmVyLnBhcmFtc0FsbCA9IFtdO1xyXG5cclxuXHQvLyBTZXQgbGF0ZXIgYnkgc2V0Q29sb3JlclxyXG5cdGRlc2lnbkV4cGxvcmVyLnNlbGVjdGVkUGFyYW0gPSBudWxsO1xyXG5cclxuXHQvLyBBbGwgZ3JhcGhzIG5hbWVzcGFjZVxyXG5cdGRlc2lnbkV4cGxvcmVyLmdyYXBocyA9IHt9O1xyXG5cclxuXHRzb3J0S2V5cygpO1xyXG5cdGNsZWFuRGF0YSgpO1xyXG5cclxuXHQvLyBBY2Nlc3MgdGhpcyBkYXRhIGxhdGVyXHJcblx0RGVzaWduRXhwbG9yZXIucHJvdG90eXBlLmdldERhdGEgPSBmdW5jdGlvbiAoKSB7XHJcblx0XHRyZXR1cm4gZGF0YTtcclxuXHR9O1xyXG5cclxuXHQvLyBTZXQgZGVmYXVsdCBzb3J0IGJ5IGtleVxyXG5cdGRlc2lnbkV4cGxvcmVyLnNldENvbG9yZXIoZGVzaWduRXhwbG9yZXIucGFyYW1zLmluWzBdKTtcclxuXHJcblx0LypcclxuXHQg4paI4paI4paI4paI4paIICDilojilojiloggICAg4paI4paIICDilojilojilojilojilojiloggIOKWiOKWiOKWiCAgICDilojilohcclxuXHTilojiloggICDilojilogg4paI4paI4paI4paIICAg4paI4paIIOKWiOKWiCAgICDilojilogg4paI4paI4paI4paIICAg4paI4paIXHJcblx04paI4paI4paI4paI4paI4paI4paIIOKWiOKWiCDilojiloggIOKWiOKWiCDilojiloggICAg4paI4paIIOKWiOKWiCDilojiloggIOKWiOKWiFxyXG5cdOKWiOKWiCAgIOKWiOKWiCDilojiloggIOKWiOKWiCDilojilogg4paI4paIICAgIOKWiOKWiCDilojiloggIOKWiOKWiCDilojilohcclxuXHTilojiloggICDilojilogg4paI4paIICAg4paI4paI4paI4paIICDilojilojilojilojilojiloggIOKWiOKWiCAgIOKWiOKWiOKWiOKWiFxyXG5cdCovXHJcblxyXG5cdGZ1bmN0aW9uIHNvcnRLZXlzKCkge1xyXG5cdFx0Ly8gSW5pdGlhbCBDbGVhbnVwXHJcblx0XHR2YXIga2V5cyA9IGQzLmtleXMob3JpZ2luYWxEYXRhWzBdKTtcclxuXHJcblx0XHQvLyBQb3B1bGF0ZSB3aGljaCBhcmUgaW5wdXQgYW5kIG91dHB1dCBrZXlzXHJcblx0XHRrZXlzLmZvckVhY2goZnVuY3Rpb24gKGtleSkge1xyXG5cdFx0XHRPYmplY3Qua2V5cyhEZXNpZ25FeHBsb3Jlci50eXBlRGlzcGxheURpY3Rpb25hcnkpXHJcblx0XHRcdFx0LmZvckVhY2goZnVuY3Rpb24gKGtleVR5cGUpIHtcclxuXHRcdFx0XHRcdHZhciB0eXBlID0gRGVzaWduRXhwbG9yZXIudHlwZURpc3BsYXlEaWN0aW9uYXJ5W2tleVR5cGVdO1xyXG5cdFx0XHRcdFx0dmFyIHNpZ25pZmllciA9IHR5cGUuc2lnbmlmaWVyO1xyXG5cdFx0XHRcdFx0dmFyIGtleU9iajtcclxuXHRcdFx0XHRcdGlmIChrZXkuc3RhcnRzV2l0aChzaWduaWZpZXIpKSB7XHJcblx0XHRcdFx0XHRcdGtleU9iaj1uZXcgRGVzaWduRXhwbG9yZXIuUGFyYW0oa2V5LHR5cGUpO1xyXG5cdFx0XHRcdFx0XHRkZXNpZ25FeHBsb3Jlci5wYXJhbXNBbGwucHVzaChrZXlPYmopO1xyXG5cdFx0XHRcdFx0XHRkZXNpZ25FeHBsb3Jlci5wYXJhbXNba2V5VHlwZV0gPSBkZXNpZ25FeHBsb3Jlci5wYXJhbXNba2V5VHlwZV0gfHwgW107XHJcblx0XHRcdFx0XHRcdGRlc2lnbkV4cGxvcmVyLnBhcmFtc1trZXlUeXBlXS5wdXNoKGtleU9iaik7XHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0fSk7XHJcblx0XHR9KTtcclxuXHR9XHJcblxyXG5cdGZ1bmN0aW9uIGNsZWFuRGF0YSgpIHtcclxuXHRcdC8vIGNsZWFuIGRhdGFcclxuXHRcdG9yaWdpbmFsRGF0YS5mb3JFYWNoKGZ1bmN0aW9uIChkYXR1bSwgaSkge1xyXG5cdFx0XHR2YXIgY2xlYW5lZERhdHVtID0ge1xyXG5cdFx0XHRcdF9pZDogaVxyXG5cdFx0XHR9O1xyXG5cclxuXHRcdFx0T2JqZWN0LmtleXMoZGF0dW0pXHJcblx0XHRcdFx0LmZvckVhY2goZnVuY3Rpb24gKGtleSkge1xyXG5cdFx0XHRcdFx0dmFyIGtleU9iaiA9IGRlc2lnbkV4cGxvcmVyLnBhcmFtc0FsbC5yZWR1Y2UoZnVuY3Rpb24gKHByZXYsIGN1cikge1xyXG5cdFx0XHRcdFx0XHRyZXR1cm4gY3VyLm9yaWdpbmFsID09PSBrZXkgPyBjdXIgOiBwcmV2O1xyXG5cdFx0XHRcdFx0fSwgbnVsbCk7XHJcblx0XHRcdFx0XHR2YXIgZmxvYXRWZXJzaW9uID0gcGFyc2VGbG9hdChkYXR1bVtrZXldKTtcclxuXHRcdFx0XHRcdHZhciBjbGVhbktleSA9IGtleU9iaiA/IGtleU9ialtEZXNpZ25FeHBsb3Jlci5kYXRhS2V5XSA6IGtleTtcclxuXHRcdFx0XHRcdGNsZWFuZWREYXR1bVtjbGVhbktleV0gPSBpc05hTihmbG9hdFZlcnNpb24pID8gZGF0dW1ba2V5XSA6IGZsb2F0VmVyc2lvbjtcclxuXHRcdFx0XHR9KTtcclxuXHJcblx0XHRcdGRhdGEucHVzaChjbGVhbmVkRGF0dW0pO1xyXG5cdFx0fSk7XHJcblx0fVxyXG5cclxufTtcclxuXHJcbkRlc2lnbkV4cGxvcmVyLmRhdGFLZXk9J2NsZWFuS2V5JztcclxuIiwiRGVzaWduRXhwbG9yZXIuUGFyYW0gPSBmdW5jdGlvbiAoa2V5LCB0eXBlKSB7XHJcblx0dmFyIHBhcmFtID0gdGhpcztcclxuXHJcblx0cGFyYW0ub3JpZ2luYWwgPSBrZXk7XHJcblxyXG5cdHBhcmFtLmRpc3BsYXkgPSBrZXkuc3Vic3RyaW5nKHR5cGUuc2lnbmlmaWVyLmxlbmd0aCwga2V5Lmxlbmd0aCk7XHJcblxyXG5cdHBhcmFtLnR5cGUgPSB0eXBlO1xyXG5cclxuXHRwYXJhbS5jbGVhbktleSA9IGtleS5yZXBsYWNlKCc6JywgJ18nKVxyXG5cdFx0LnJlcGxhY2UoJ1snLCAnXycpXHJcblx0XHQucmVwbGFjZSgnXScsICdfJyk7XHJcblxyXG5cdHBhcmFtLnNob3duSW5QYXJhY29vcmRzID0gdHJ1ZTtcclxufTtcclxuIiwiRGVzaWduRXhwbG9yZXIudHlwZURpc3BsYXlEaWN0aW9uYXJ5PXtcclxuICAnaW4nOntcclxuICAgICdzaWduaWZpZXInOiAnaW46JyxcclxuICAgICdrZXknOiAnaW4nLFxyXG4gICAgJ2Rpc3BsYXknOidJbnB1dCcsXHJcbiAgfSxcclxuICAnb3V0Jzp7XHJcbiAgICAnc2lnbmlmaWVyJzogJ291dDonLFxyXG4gICAgJ2tleSc6ICdvdXQnLFxyXG4gICAgJ2Rpc3BsYXknOidPdXRwdXQnXHJcbiAgfVxyXG59O1xyXG4iLCJEZXNpZ25FeHBsb3Jlci5wcm90b3R5cGUuZHJhd1BhcmFsbGVsQ29vcmRpbmF0ZXMgPSBmdW5jdGlvbiAoZGl2U2VsZWN0b3IpIHtcclxuXHJcblx0dmFyIGRlc2lnbkV4cGxvcmVyID0gdGhpcztcclxuXHJcblx0ZGVzaWduRXhwbG9yZXIuZ3JhcGhzLl9wYXJjb29yZHNEaXZTZWxlY3RvciA9IGRpdlNlbGVjdG9yO1xyXG5cclxuXHR2YXIgZGl2ID0gJChkaXZTZWxlY3Rvcik7XHJcblxyXG5cdGRpdi5odG1sKCcnKTtcclxuXHJcblx0ZGl2LmFkZENsYXNzKCdwYXJjb29yZHMnKTtcclxuXHJcblx0dmFyIGRpbWVuc2lvbnMgPSBkZXNpZ25FeHBsb3Jlci5wYXJhbXNBbGwucmVkdWNlKGZ1bmN0aW9uIChwcmV2LCBjdXIpIHtcclxuXHRcdHByZXZbY3VyW0Rlc2lnbkV4cGxvcmVyLmRhdGFLZXldXSA9IHt9O1xyXG5cdFx0cmV0dXJuIHByZXY7XHJcblx0fSwge30pO1xyXG5cclxuXHRkZXNpZ25FeHBsb3Jlci5ncmFwaHMucGFyY29vcmRzID0gZDMucGFyY29vcmRzKCkoZGl2U2VsZWN0b3IpXHJcblx0XHQuZGF0YShkZXNpZ25FeHBsb3Jlci5nZXREYXRhKCkpXHJcblx0XHQvLyAubWFyZ2luKHtcclxuXHRcdC8vIFx0dG9wOiA1MCxcclxuXHRcdC8vIFx0bGVmdDogMjAsXHJcblx0XHQvLyBcdGJvdHRvbTogMTAsXHJcblx0XHQvLyBcdHJpZ2h0OiAyMFxyXG5cdFx0Ly8gfSlcclxuXHRcdC8vIC5zbW9vdGhuZXNzKDAuMilcclxuXHRcdC5jb2xvcihkZXNpZ25FeHBsb3Jlci5jb2xvcmVyKVxyXG5cdFx0LmFscGhhKDAuMilcclxuXHRcdC5hbHBoYU9uQnJ1c2hlZCgwLjA1KVxyXG5cdFx0Lm1vZGUoXCJxdWV1ZVwiKVxyXG5cdFx0LnJhdGUoMjApXHJcblx0XHQuZGltZW5zaW9ucyhkaW1lbnNpb25zKVxyXG5cdFx0LnJlbmRlcigpXHJcblx0XHQuYnJ1c2hNb2RlKFwiMUQtYXhlc1wiKSAvLyBlbmFibGUgYnJ1c2hpbmdcclxuXHRcdC5hdXRvc2NhbGUoKVxyXG5cdFx0LmludGVyYWN0aXZlKClcclxuXHRcdC5yZW9yZGVyYWJsZSgpO1xyXG5cclxuXHRwb3N0UmVuZGVyKCk7XHJcblxyXG5cdGRlc2lnbkV4cGxvcmVyLmdyYXBocy5wYXJjb29yZHMub24oJ3JlbmRlcicsIHBvc3RSZW5kZXIpO1xyXG5cclxuXHRmdW5jdGlvbiBwb3N0UmVuZGVyKCkge1xyXG5cdFx0ZDMuc2VsZWN0QWxsKGRpdlNlbGVjdG9yICsgXCIgdGV4dC5sYWJlbFwiKVxyXG5cdFx0XHQuZWFjaChmdW5jdGlvbiAoZCwgaSkge1xyXG5cdFx0XHRcdHZhciBrZXkgPSBkZXNpZ25FeHBsb3Jlci5nZXRQYXJhbUZyb21EYXRha2V5KGQpO1xyXG5cdFx0XHRcdGQzLnNlbGVjdCh0aGlzKVxyXG5cdFx0XHRcdFx0LnRleHQoa2V5LmRpc3BsYXkpO1xyXG5cdFx0XHR9KTtcclxuXHJcblx0XHR2YXIgdGlja2xhYmVscz1kMy5zZWxlY3RBbGwoZGl2U2VsZWN0b3IgKyBcIiBnLnRpY2sgdGV4dFwiKVxyXG5cdFx0XHQuc3R5bGUoXCJmb250LXNpemVcIiwgXCI5cHhcIik7XHJcblx0fVxyXG5cclxuXHQvLyByZXNpemUgb3IgcmUtcmVuZGVyIGJyZWFrcyB0aGUgYnJ1c2ggbW9kZVxyXG5cdC8vICQod2luZG93KVxyXG5cdC8vIFx0Lm9uKCdyZXNpemUnLCBmdW5jdGlvbiAoKSB7XHJcblx0Ly8gXHRcdGRlc2lnbkV4cGxvcmVyLmdyYXBocy5wYXJjb29yZHMud2lkdGgoZGl2LndpZHRoKCkpO1xyXG5cdC8vIFx0fSk7XHJcbn07XHJcbiIsIkRlc2lnbkV4cGxvcmVyLnByb3RvdHlwZS5nZXRQYXJhbUZyb21EYXRha2V5ID0gZnVuY3Rpb24gKGRhdGFLZXkpIHtcclxuXHR2YXIgZGVzaWduRXhwbG9yZXIgPSB0aGlzO1xyXG5cclxuXHRyZXR1cm4gZGVzaWduRXhwbG9yZXIucGFyYW1zQWxsLnJlZHVjZShmdW5jdGlvbiAocHJldiwgY3VyKSB7XHJcblx0XHRyZXR1cm4gY3VyW0Rlc2lnbkV4cGxvcmVyLmRhdGFLZXldID09PSBkYXRhS2V5ID8gY3VyIDogcHJldjtcclxuXHR9LCBudWxsKTtcclxufTtcclxuIiwiLyoqXHJcbiAqIFRlbGwgdXMgd2hpY2ggcGFyYW0gdG8gY29sb3IgYnlcclxuICogQHBhcmFtIHtvYmplY3R9IHBhcmFtIC0gUGFyYW1ldGVyXHJcbiAqL1xyXG5EZXNpZ25FeHBsb3Jlci5wcm90b3R5cGUuc2V0Q29sb3JlciA9IGZ1bmN0aW9uIChwYXJhbSkge1xyXG5cclxuXHR2YXIgZGVzaWduRXhwbG9yZXIgPSB0aGlzO1xyXG5cclxuXHRkZXNpZ25FeHBsb3Jlci5zZWxlY3RlZFBhcmFtID0gcGFyYW07XHJcblxyXG5cdHZhciBkYXRhID0gZGVzaWduRXhwbG9yZXIuZ2V0RGF0YSgpO1xyXG5cclxuXHR2YXIgZXh0ZW50cyA9IGQzLmV4dGVudChkYXRhLCBkYXRhQWNjZXNzb3IpO1xyXG5cclxuXHR2YXIgY29sb3JTY2FsZSA9IGQzLnNjYWxlLmxpbmVhcigpXHJcblx0XHQuZG9tYWluKGV4dGVudHMpXHJcblx0XHQucmFuZ2UoW1wiIzNiMzFiMFwiLCBcIiM2NkNDRERcIl0pO1xyXG5cclxuXHRkZXNpZ25FeHBsb3Jlci5jb2xvcmVyID0gZnVuY3Rpb24gKGQpIHtcclxuXHRcdHJldHVybiBjb2xvclNjYWxlKGRhdGFBY2Nlc3NvcihkKSk7XHJcblx0fTtcclxuXHJcblx0aWYoZGVzaWduRXhwbG9yZXIuZ3JhcGhzLnBhcmNvb3Jkcykge1xyXG5cdFx0ZGVzaWduRXhwbG9yZXIuZ3JhcGhzLnBhcmNvb3Jkcy5jb2xvcihkZXNpZ25FeHBsb3Jlci5jb2xvcmVyKS5yZW5kZXIoKTtcclxuXHR9XHJcblxyXG5cdGZ1bmN0aW9uIGRhdGFBY2Nlc3NvcihkKSB7XHJcblx0XHRyZXR1cm4gZFtwYXJhbVtEZXNpZ25FeHBsb3Jlci5kYXRhS2V5XV07XHJcblx0fVxyXG5cclxufTtcclxuIl19
