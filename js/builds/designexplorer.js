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

	param.shownInParcoords = true;
};

DesignExplorer.prototype.populateIterationTable=function(jqElement,iteration){
  var designExplorer=this;

  var paramTypes = Object.keys(designExplorer.params);

  jqElement.html('');

  paramTypes.forEach(function (key) {
    var type = DesignExplorer.typeDisplayDictionary[key];
    var table = $('<table class="table table-condensed"></table>');
    var params = designExplorer.params[key];
    params.forEach(function (param) {
      var row = $('<tr></tr>');
      row.append('<td>' + param.display + '</td>');
      row.append('<td>' + iteration[param[DesignExplorer.dataKey]] + '</td>');
      table.append(row);

      if (param === designExplorer.selectedParam) row.css('border-left', '5px solid ' + designExplorer.colorer(iteration))
        .css('font-weight', 'bold');
    });
    jqElement.append('<h4>' + type.display + 's</h4>');
    jqElement.append(table);
  });


};

DesignExplorer.prototype.getParamFromDatakey = function (dataKey) {
	var designExplorer = this;

	return designExplorer.paramsAll.reduce(function (prev, cur) {
		return cur[DesignExplorer.dataKey] === dataKey ? cur : prev;
	}, null);
};

DesignExplorer.prototype.parcoords_create = function (divSelector) {

	var designExplorer = this;

	designExplorer.graphs._parcoordsDivSelector = divSelector;

	var div = $(divSelector);

	div.html('');

	div.addClass('parcoords');

	var dimensions=designExplorer.parcoords_getCurDims();

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

DesignExplorer.prototype.parcoords_getCurDims = function () {

	var designExplorer = this;

	var dimensions = designExplorer.paramsAll.reduce(function (prev, cur) {
		if (cur.shownInParcoords) {
			prev[cur[DesignExplorer.dataKey]] = {};
		}
		return prev;
	}, {});

	return dimensions;

};

DesignExplorer.prototype.parcoords_redraw = function () {

	var designExplorer = this;

	if (!designExplorer.graphs.parcoords) return;

	designExplorer.graphs.parcoords.dimensions(designExplorer.parcoords_getCurDims());

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

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImhlYWRlci5qcyIsImNvbnN0cnVjdG9ycy9QYXJhbS5qcyIsInBhcnRpYWxzL2dldEl0ZXJhdGlvblRhYmxlLmpzIiwicGFydGlhbHMvZ2V0UGFyYW1Gcm9tRGF0YWtleS5qcyIsInBhcnRpYWxzL3BhcmNvb3Jkc19jcmVhdGUuanMiLCJwYXJ0aWFscy9wYXJjb29yZHNfZ2V0Q3VyRGltcy5qcyIsInBhcnRpYWxzL3BhcmNvb3Jkc19yZWRyYXcuanMiLCJwYXJ0aWFscy9zZXRDb2xvcmVyLmpzIiwic3RhdGljcy90eXBlRGlzcGxheURpY3Rpb25hcnkuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3hGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ2ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQzFCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDUEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUN6REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDZEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNUQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDL0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImRlc2lnbmV4cGxvcmVyLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXHJcbiAqIEBjb25zdHJ1Y3RvclxyXG4gKi9cclxudmFyIERlc2lnbkV4cGxvcmVyID0gZnVuY3Rpb24gKG9yaWdpbmFsRGF0YSkge1xyXG5cclxuXHQvKipcclxuXHQgKiBAbGVuZHMgRGVzaWduRXhwbG9yZXIucHJvdG90eXBlXHJcblx0ICovXHJcblx0dmFyIGRlc2lnbkV4cGxvcmVyID0gdGhpcztcclxuXHJcblx0dmFyIGRhdGEgPSBbXTtcclxuXHJcblx0Ly8gRGljdGlvbmFyaWVkIHBhcmFtc1xyXG5cdGRlc2lnbkV4cGxvcmVyLnBhcmFtcyA9IHt9O1xyXG5cclxuXHQvLyBBbGwgcGFyYW1zXHJcblx0ZGVzaWduRXhwbG9yZXIucGFyYW1zQWxsID0gW107XHJcblxyXG5cdC8vIFNldCBsYXRlciBieSBzZXRDb2xvcmVyXHJcblx0ZGVzaWduRXhwbG9yZXIuc2VsZWN0ZWRQYXJhbSA9IG51bGw7XHJcblxyXG5cdC8vIEFsbCBncmFwaHMgbmFtZXNwYWNlXHJcblx0ZGVzaWduRXhwbG9yZXIuZ3JhcGhzID0ge307XHJcblxyXG5cdHNvcnRLZXlzKCk7XHJcblx0Y2xlYW5EYXRhKCk7XHJcblxyXG5cdC8vIEFjY2VzcyB0aGlzIGRhdGEgbGF0ZXJcclxuXHREZXNpZ25FeHBsb3Jlci5wcm90b3R5cGUuZ2V0RGF0YSA9IGZ1bmN0aW9uICgpIHtcclxuXHRcdHJldHVybiBkYXRhO1xyXG5cdH07XHJcblxyXG5cdC8vIFNldCBkZWZhdWx0IHNvcnQgYnkga2V5XHJcblx0ZGVzaWduRXhwbG9yZXIuc2V0Q29sb3JlcihkZXNpZ25FeHBsb3Jlci5wYXJhbXMuaW5bMF0pO1xyXG5cclxuXHQvKlxyXG5cdCDilojilojilojilojiloggIOKWiOKWiOKWiCAgICDilojiloggIOKWiOKWiOKWiOKWiOKWiOKWiCAg4paI4paI4paIICAgIOKWiOKWiFxyXG5cdOKWiOKWiCAgIOKWiOKWiCDilojilojilojiloggICDilojilogg4paI4paIICAgIOKWiOKWiCDilojilojilojiloggICDilojilohcclxuXHTilojilojilojilojilojilojilogg4paI4paIIOKWiOKWiCAg4paI4paIIOKWiOKWiCAgICDilojilogg4paI4paIIOKWiOKWiCAg4paI4paIXHJcblx04paI4paIICAg4paI4paIIOKWiOKWiCAg4paI4paIIOKWiOKWiCDilojiloggICAg4paI4paIIOKWiOKWiCAg4paI4paIIOKWiOKWiFxyXG5cdOKWiOKWiCAgIOKWiOKWiCDilojiloggICDilojilojilojiloggIOKWiOKWiOKWiOKWiOKWiOKWiCAg4paI4paIICAg4paI4paI4paI4paIXHJcblx0Ki9cclxuXHJcblx0ZnVuY3Rpb24gc29ydEtleXMoKSB7XHJcblx0XHQvLyBJbml0aWFsIENsZWFudXBcclxuXHRcdHZhciBrZXlzID0gZDMua2V5cyhvcmlnaW5hbERhdGFbMF0pO1xyXG5cclxuXHRcdC8vIFBvcHVsYXRlIHdoaWNoIGFyZSBpbnB1dCBhbmQgb3V0cHV0IGtleXNcclxuXHRcdGtleXMuZm9yRWFjaChmdW5jdGlvbiAoa2V5KSB7XHJcblx0XHRcdE9iamVjdC5rZXlzKERlc2lnbkV4cGxvcmVyLnR5cGVEaXNwbGF5RGljdGlvbmFyeSlcclxuXHRcdFx0XHQuZm9yRWFjaChmdW5jdGlvbiAoa2V5VHlwZSkge1xyXG5cdFx0XHRcdFx0dmFyIHR5cGUgPSBEZXNpZ25FeHBsb3Jlci50eXBlRGlzcGxheURpY3Rpb25hcnlba2V5VHlwZV07XHJcblx0XHRcdFx0XHR2YXIgc2lnbmlmaWVyID0gdHlwZS5zaWduaWZpZXI7XHJcblx0XHRcdFx0XHR2YXIga2V5T2JqO1xyXG5cdFx0XHRcdFx0aWYgKGtleS5zdGFydHNXaXRoKHNpZ25pZmllcikpIHtcclxuXHRcdFx0XHRcdFx0a2V5T2JqPW5ldyBEZXNpZ25FeHBsb3Jlci5QYXJhbShrZXksdHlwZSk7XHJcblx0XHRcdFx0XHRcdGRlc2lnbkV4cGxvcmVyLnBhcmFtc0FsbC5wdXNoKGtleU9iaik7XHJcblx0XHRcdFx0XHRcdGRlc2lnbkV4cGxvcmVyLnBhcmFtc1trZXlUeXBlXSA9IGRlc2lnbkV4cGxvcmVyLnBhcmFtc1trZXlUeXBlXSB8fCBbXTtcclxuXHRcdFx0XHRcdFx0ZGVzaWduRXhwbG9yZXIucGFyYW1zW2tleVR5cGVdLnB1c2goa2V5T2JqKTtcclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHR9KTtcclxuXHRcdH0pO1xyXG5cdH1cclxuXHJcblx0ZnVuY3Rpb24gY2xlYW5EYXRhKCkge1xyXG5cdFx0Ly8gY2xlYW4gZGF0YVxyXG5cdFx0b3JpZ2luYWxEYXRhLmZvckVhY2goZnVuY3Rpb24gKGRhdHVtLCBpKSB7XHJcblx0XHRcdHZhciBjbGVhbmVkRGF0dW0gPSB7XHJcblx0XHRcdFx0X2lkOiBpXHJcblx0XHRcdH07XHJcblxyXG5cdFx0XHRPYmplY3Qua2V5cyhkYXR1bSlcclxuXHRcdFx0XHQuZm9yRWFjaChmdW5jdGlvbiAoa2V5KSB7XHJcblx0XHRcdFx0XHR2YXIga2V5T2JqID0gZGVzaWduRXhwbG9yZXIucGFyYW1zQWxsLnJlZHVjZShmdW5jdGlvbiAocHJldiwgY3VyKSB7XHJcblx0XHRcdFx0XHRcdHJldHVybiBjdXIub3JpZ2luYWwgPT09IGtleSA/IGN1ciA6IHByZXY7XHJcblx0XHRcdFx0XHR9LCBudWxsKTtcclxuXHRcdFx0XHRcdHZhciBmbG9hdFZlcnNpb24gPSBwYXJzZUZsb2F0KGRhdHVtW2tleV0pO1xyXG5cdFx0XHRcdFx0dmFyIGNsZWFuS2V5ID0ga2V5T2JqID8ga2V5T2JqW0Rlc2lnbkV4cGxvcmVyLmRhdGFLZXldIDoga2V5O1xyXG5cdFx0XHRcdFx0Y2xlYW5lZERhdHVtW2NsZWFuS2V5XSA9IGlzTmFOKGZsb2F0VmVyc2lvbikgPyBkYXR1bVtrZXldIDogZmxvYXRWZXJzaW9uO1xyXG5cdFx0XHRcdH0pO1xyXG5cclxuXHRcdFx0ZGF0YS5wdXNoKGNsZWFuZWREYXR1bSk7XHJcblx0XHR9KTtcclxuXHR9XHJcblxyXG59O1xyXG5cclxuRGVzaWduRXhwbG9yZXIuZGF0YUtleT0nY2xlYW5LZXknO1xyXG4iLCJEZXNpZ25FeHBsb3Jlci5QYXJhbSA9IGZ1bmN0aW9uIChrZXksIHR5cGUpIHtcclxuXHR2YXIgcGFyYW0gPSB0aGlzO1xyXG5cclxuXHRwYXJhbS5vcmlnaW5hbCA9IGtleTtcclxuXHJcblx0cGFyYW0uZGlzcGxheSA9IGtleS5zdWJzdHJpbmcodHlwZS5zaWduaWZpZXIubGVuZ3RoLCBrZXkubGVuZ3RoKTtcclxuXHJcblx0cGFyYW0udHlwZSA9IHR5cGU7XHJcblxyXG5cdHBhcmFtLmNsZWFuS2V5ID0ga2V5LnJlcGxhY2UoJzonLCAnXycpXHJcblx0XHQucmVwbGFjZSgnWycsICdfJylcclxuXHRcdC5yZXBsYWNlKCddJywgJ18nKTtcclxuXHJcblx0cGFyYW0uc2hvd25JblBhcmNvb3JkcyA9IHRydWU7XHJcbn07XHJcbiIsIkRlc2lnbkV4cGxvcmVyLnByb3RvdHlwZS5wb3B1bGF0ZUl0ZXJhdGlvblRhYmxlPWZ1bmN0aW9uKGpxRWxlbWVudCxpdGVyYXRpb24pe1xyXG4gIHZhciBkZXNpZ25FeHBsb3Jlcj10aGlzO1xyXG5cclxuICB2YXIgcGFyYW1UeXBlcyA9IE9iamVjdC5rZXlzKGRlc2lnbkV4cGxvcmVyLnBhcmFtcyk7XHJcblxyXG4gIGpxRWxlbWVudC5odG1sKCcnKTtcclxuXHJcbiAgcGFyYW1UeXBlcy5mb3JFYWNoKGZ1bmN0aW9uIChrZXkpIHtcclxuICAgIHZhciB0eXBlID0gRGVzaWduRXhwbG9yZXIudHlwZURpc3BsYXlEaWN0aW9uYXJ5W2tleV07XHJcbiAgICB2YXIgdGFibGUgPSAkKCc8dGFibGUgY2xhc3M9XCJ0YWJsZSB0YWJsZS1jb25kZW5zZWRcIj48L3RhYmxlPicpO1xyXG4gICAgdmFyIHBhcmFtcyA9IGRlc2lnbkV4cGxvcmVyLnBhcmFtc1trZXldO1xyXG4gICAgcGFyYW1zLmZvckVhY2goZnVuY3Rpb24gKHBhcmFtKSB7XHJcbiAgICAgIHZhciByb3cgPSAkKCc8dHI+PC90cj4nKTtcclxuICAgICAgcm93LmFwcGVuZCgnPHRkPicgKyBwYXJhbS5kaXNwbGF5ICsgJzwvdGQ+Jyk7XHJcbiAgICAgIHJvdy5hcHBlbmQoJzx0ZD4nICsgaXRlcmF0aW9uW3BhcmFtW0Rlc2lnbkV4cGxvcmVyLmRhdGFLZXldXSArICc8L3RkPicpO1xyXG4gICAgICB0YWJsZS5hcHBlbmQocm93KTtcclxuXHJcbiAgICAgIGlmIChwYXJhbSA9PT0gZGVzaWduRXhwbG9yZXIuc2VsZWN0ZWRQYXJhbSkgcm93LmNzcygnYm9yZGVyLWxlZnQnLCAnNXB4IHNvbGlkICcgKyBkZXNpZ25FeHBsb3Jlci5jb2xvcmVyKGl0ZXJhdGlvbikpXHJcbiAgICAgICAgLmNzcygnZm9udC13ZWlnaHQnLCAnYm9sZCcpO1xyXG4gICAgfSk7XHJcbiAgICBqcUVsZW1lbnQuYXBwZW5kKCc8aDQ+JyArIHR5cGUuZGlzcGxheSArICdzPC9oND4nKTtcclxuICAgIGpxRWxlbWVudC5hcHBlbmQodGFibGUpO1xyXG4gIH0pO1xyXG5cclxuXHJcbn07XHJcbiIsIkRlc2lnbkV4cGxvcmVyLnByb3RvdHlwZS5nZXRQYXJhbUZyb21EYXRha2V5ID0gZnVuY3Rpb24gKGRhdGFLZXkpIHtcclxuXHR2YXIgZGVzaWduRXhwbG9yZXIgPSB0aGlzO1xyXG5cclxuXHRyZXR1cm4gZGVzaWduRXhwbG9yZXIucGFyYW1zQWxsLnJlZHVjZShmdW5jdGlvbiAocHJldiwgY3VyKSB7XHJcblx0XHRyZXR1cm4gY3VyW0Rlc2lnbkV4cGxvcmVyLmRhdGFLZXldID09PSBkYXRhS2V5ID8gY3VyIDogcHJldjtcclxuXHR9LCBudWxsKTtcclxufTtcclxuIiwiRGVzaWduRXhwbG9yZXIucHJvdG90eXBlLnBhcmNvb3Jkc19jcmVhdGUgPSBmdW5jdGlvbiAoZGl2U2VsZWN0b3IpIHtcclxuXHJcblx0dmFyIGRlc2lnbkV4cGxvcmVyID0gdGhpcztcclxuXHJcblx0ZGVzaWduRXhwbG9yZXIuZ3JhcGhzLl9wYXJjb29yZHNEaXZTZWxlY3RvciA9IGRpdlNlbGVjdG9yO1xyXG5cclxuXHR2YXIgZGl2ID0gJChkaXZTZWxlY3Rvcik7XHJcblxyXG5cdGRpdi5odG1sKCcnKTtcclxuXHJcblx0ZGl2LmFkZENsYXNzKCdwYXJjb29yZHMnKTtcclxuXHJcblx0dmFyIGRpbWVuc2lvbnM9ZGVzaWduRXhwbG9yZXIucGFyY29vcmRzX2dldEN1ckRpbXMoKTtcclxuXHJcblx0ZGVzaWduRXhwbG9yZXIuZ3JhcGhzLnBhcmNvb3JkcyA9IGQzLnBhcmNvb3JkcygpKGRpdlNlbGVjdG9yKVxyXG5cdFx0LmRhdGEoZGVzaWduRXhwbG9yZXIuZ2V0RGF0YSgpKVxyXG5cdFx0Ly8gLm1hcmdpbih7XHJcblx0XHQvLyBcdHRvcDogNTAsXHJcblx0XHQvLyBcdGxlZnQ6IDIwLFxyXG5cdFx0Ly8gXHRib3R0b206IDEwLFxyXG5cdFx0Ly8gXHRyaWdodDogMjBcclxuXHRcdC8vIH0pXHJcblx0XHQvLyAuc21vb3RobmVzcygwLjIpXHJcblx0XHQuY29sb3IoZGVzaWduRXhwbG9yZXIuY29sb3JlcilcclxuXHRcdC5hbHBoYSgwLjIpXHJcblx0XHQuYWxwaGFPbkJydXNoZWQoMC4wNSlcclxuXHRcdC5tb2RlKFwicXVldWVcIilcclxuXHRcdC5yYXRlKDIwKVxyXG5cdFx0LmRpbWVuc2lvbnMoZGltZW5zaW9ucylcclxuXHRcdC5yZW5kZXIoKVxyXG5cdFx0LmJydXNoTW9kZShcIjFELWF4ZXNcIikgLy8gZW5hYmxlIGJydXNoaW5nXHJcblx0XHQuYXV0b3NjYWxlKClcclxuXHRcdC5pbnRlcmFjdGl2ZSgpXHJcblx0XHQucmVvcmRlcmFibGUoKTtcclxuXHJcblx0cG9zdFJlbmRlcigpO1xyXG5cclxuXHRkZXNpZ25FeHBsb3Jlci5ncmFwaHMucGFyY29vcmRzLm9uKCdyZW5kZXInLCBwb3N0UmVuZGVyKTtcclxuXHJcblx0ZnVuY3Rpb24gcG9zdFJlbmRlcigpIHtcclxuXHRcdGQzLnNlbGVjdEFsbChkaXZTZWxlY3RvciArIFwiIHRleHQubGFiZWxcIilcclxuXHRcdFx0LmVhY2goZnVuY3Rpb24gKGQsIGkpIHtcclxuXHRcdFx0XHR2YXIga2V5ID0gZGVzaWduRXhwbG9yZXIuZ2V0UGFyYW1Gcm9tRGF0YWtleShkKTtcclxuXHRcdFx0XHRkMy5zZWxlY3QodGhpcylcclxuXHRcdFx0XHRcdC50ZXh0KGtleS5kaXNwbGF5KTtcclxuXHRcdFx0fSk7XHJcblxyXG5cdFx0dmFyIHRpY2tsYWJlbHM9ZDMuc2VsZWN0QWxsKGRpdlNlbGVjdG9yICsgXCIgZy50aWNrIHRleHRcIilcclxuXHRcdFx0LnN0eWxlKFwiZm9udC1zaXplXCIsIFwiOXB4XCIpO1xyXG5cdH1cclxuXHJcblx0Ly8gcmVzaXplIG9yIHJlLXJlbmRlciBicmVha3MgdGhlIGJydXNoIG1vZGVcclxuXHQvLyAkKHdpbmRvdylcclxuXHQvLyBcdC5vbigncmVzaXplJywgZnVuY3Rpb24gKCkge1xyXG5cdC8vIFx0XHRkZXNpZ25FeHBsb3Jlci5ncmFwaHMucGFyY29vcmRzLndpZHRoKGRpdi53aWR0aCgpKTtcclxuXHQvLyBcdH0pO1xyXG59O1xyXG4iLCJEZXNpZ25FeHBsb3Jlci5wcm90b3R5cGUucGFyY29vcmRzX2dldEN1ckRpbXMgPSBmdW5jdGlvbiAoKSB7XHJcblxyXG5cdHZhciBkZXNpZ25FeHBsb3JlciA9IHRoaXM7XHJcblxyXG5cdHZhciBkaW1lbnNpb25zID0gZGVzaWduRXhwbG9yZXIucGFyYW1zQWxsLnJlZHVjZShmdW5jdGlvbiAocHJldiwgY3VyKSB7XHJcblx0XHRpZiAoY3VyLnNob3duSW5QYXJjb29yZHMpIHtcclxuXHRcdFx0cHJldltjdXJbRGVzaWduRXhwbG9yZXIuZGF0YUtleV1dID0ge307XHJcblx0XHR9XHJcblx0XHRyZXR1cm4gcHJldjtcclxuXHR9LCB7fSk7XHJcblxyXG5cdHJldHVybiBkaW1lbnNpb25zO1xyXG5cclxufTtcclxuIiwiRGVzaWduRXhwbG9yZXIucHJvdG90eXBlLnBhcmNvb3Jkc19yZWRyYXcgPSBmdW5jdGlvbiAoKSB7XHJcblxyXG5cdHZhciBkZXNpZ25FeHBsb3JlciA9IHRoaXM7XHJcblxyXG5cdGlmICghZGVzaWduRXhwbG9yZXIuZ3JhcGhzLnBhcmNvb3JkcykgcmV0dXJuO1xyXG5cclxuXHRkZXNpZ25FeHBsb3Jlci5ncmFwaHMucGFyY29vcmRzLmRpbWVuc2lvbnMoZGVzaWduRXhwbG9yZXIucGFyY29vcmRzX2dldEN1ckRpbXMoKSk7XHJcblxyXG59O1xyXG4iLCIvKipcclxuICogVGVsbCB1cyB3aGljaCBwYXJhbSB0byBjb2xvciBieVxyXG4gKiBAcGFyYW0ge29iamVjdH0gcGFyYW0gLSBQYXJhbWV0ZXJcclxuICovXHJcbkRlc2lnbkV4cGxvcmVyLnByb3RvdHlwZS5zZXRDb2xvcmVyID0gZnVuY3Rpb24gKHBhcmFtKSB7XHJcblxyXG5cdHZhciBkZXNpZ25FeHBsb3JlciA9IHRoaXM7XHJcblxyXG5cdGRlc2lnbkV4cGxvcmVyLnNlbGVjdGVkUGFyYW0gPSBwYXJhbTtcclxuXHJcblx0dmFyIGRhdGEgPSBkZXNpZ25FeHBsb3Jlci5nZXREYXRhKCk7XHJcblxyXG5cdHZhciBleHRlbnRzID0gZDMuZXh0ZW50KGRhdGEsIGRhdGFBY2Nlc3Nvcik7XHJcblxyXG5cdHZhciBjb2xvclNjYWxlID0gZDMuc2NhbGUubGluZWFyKClcclxuXHRcdC5kb21haW4oZXh0ZW50cylcclxuXHRcdC5yYW5nZShbXCIjM2IzMWIwXCIsIFwiIzY2Q0NERFwiXSk7XHJcblxyXG5cdGRlc2lnbkV4cGxvcmVyLmNvbG9yZXIgPSBmdW5jdGlvbiAoZCkge1xyXG5cdFx0cmV0dXJuIGNvbG9yU2NhbGUoZGF0YUFjY2Vzc29yKGQpKTtcclxuXHR9O1xyXG5cclxuXHRpZihkZXNpZ25FeHBsb3Jlci5ncmFwaHMucGFyY29vcmRzKSB7XHJcblx0XHRkZXNpZ25FeHBsb3Jlci5ncmFwaHMucGFyY29vcmRzLmNvbG9yKGRlc2lnbkV4cGxvcmVyLmNvbG9yZXIpLnJlbmRlcigpO1xyXG5cdH1cclxuXHJcblx0ZnVuY3Rpb24gZGF0YUFjY2Vzc29yKGQpIHtcclxuXHRcdHJldHVybiBkW3BhcmFtW0Rlc2lnbkV4cGxvcmVyLmRhdGFLZXldXTtcclxuXHR9XHJcblxyXG59O1xyXG4iLCJEZXNpZ25FeHBsb3Jlci50eXBlRGlzcGxheURpY3Rpb25hcnk9e1xyXG4gICdpbic6e1xyXG4gICAgJ3NpZ25pZmllcic6ICdpbjonLFxyXG4gICAgJ2tleSc6ICdpbicsXHJcbiAgICAnZGlzcGxheSc6J0lucHV0JyxcclxuICB9LFxyXG4gICdvdXQnOntcclxuICAgICdzaWduaWZpZXInOiAnb3V0OicsXHJcbiAgICAna2V5JzogJ291dCcsXHJcbiAgICAnZGlzcGxheSc6J091dHB1dCdcclxuICB9XHJcbn07XHJcbiJdfQ==
