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
	designExplorer.params = {
		'custom':[]
	};

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
						keyObj = new DesignExplorer.Param(key, type);
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

DesignExplorer.dataKey = 'cleanKey';

DesignExplorer.Param = function (key, type) {
	var param = this;

	param.original = key;

	param.display = key.substring(type.signifier.length, key.length);

	param.type = type;

	param.cleanKey = key.replace(':', '_')
		.replace('[', '_')
		.replace(']', '_')
		.replace(' ', '_')
		.replace(' ', '_');

	// param.cleanKey=key.replace(/[!\"#$%&'\(\)\*\+,\.\/:;<=>\?\@\[\\\]\^`\{\|\}~]/g, '_');

	// console.log(key, param.cleanKey);

	param.shownInParcoords = true;

	return this;
};

(function () {

	var customParamCount = 0;

	DesignExplorer.ParamCustom = function () {

		customParamCount += 1;

		DesignExplorer.Param.apply(this, ['custom:' + customParamCount, DesignExplorer.typeDisplayDictionary.custom]);

		var customParam = this;

	};

	DesignExplorer.ParamCustom.prototype = Object.create(DesignExplorer.Param.prototype);


})();



	DesignExplorer.prototype.addCustomParam = function () {
		var designExplorer = this;

		createdCustomCount += 1;

		var param = new DesignExplorer.ParamCustom();

		designExplorer.params.custom.push(param);
		designExplorer.paramsAll.push(custom);

	};

DesignExplorer.prototype.populateIterationTable = function (jqElement, iteration) {
	var designExplorer = this;

	var paramTypes = Object.keys(designExplorer.params);

	jqElement.html('');

	paramTypes.forEach(function (key) {
		var type = DesignExplorer.typeDisplayDictionary[key];
		var table = $('<table class="table table-condensed"></table>');
		var params = designExplorer.params[key];
		params.forEach(function (param) {
			if (!param.shownInParcoords) return;
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

	var contextMenu = $('#context-menu');

	div.html('');

	div.addClass('parcoords');

	var dimensions = designExplorer.parcoords_getCurDims();

	designExplorer.graphs.parcoords = d3.parcoords()(divSelector)
		.data(designExplorer.getData())
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

	designExplorer.graphs.parcoords.on('render', _.debounce(postRender, 400));
	designExplorer.graphs.parcoords.on('dimensions', _.debounce(postRender, 400));
	// designExplorer.graphs.parcoords.on('brush', _.debounce(postBrush, 400));

	function postRender() {

		var domainColors = [];

		d3.selectAll(divSelector + ' g.dimension')
			.each(function (d, i) {
				var param = designExplorer.getParamFromDatakey(d);
				var paramColor = (param.type.key === 'in') ? '#999' : '#000';
				var thisD3 = d3.select(this);

				thisD3.selectAll('text.label')
					.text(param.display)
					.style('fill', paramColor);

				thisD3.selectAll('path.domain')
					.style('stroke', paramColor);

				thisD3.selectAll(' g.tick text')
					.style('font-size', '9px')
					.style('fill', paramColor);

				thisD3.selectAll(' g.brush rect.extent')
					.style('fill', 'rgba(255,255,255,0.5)')
					.on('contextmenu', function (d, i) {
						var jThis = $(this);

						if (Number(jThis.attr('height')) === 0) return;

						d3.event.preventDefault();

						contextMenu.html('');
						contextMenu.css('left', d3.event.clientX);
						contextMenu.css('top', d3.event.clientY);

						var lg = $('<ul class="list-group"></ul>');

						var resetBrush = $('<a class="list-group-item">Reset these extents</a>');

						resetBrush.on('click', function () {
							designExplorer.graphs.parcoords.brushReset(d);
						});

						lg.append(resetBrush);
						contextMenu.append(lg);

						contextMenu.show();

						lg.on('click', function () {
							contextMenu.hide();
						});

					});
			});

		designExplorer.abstract_parcoords_postRender();
	}

	// resize or re-render breaks the brush mode
	// $(window)
	// 	.on('resize', function () {
	// 		designExplorer.graphs.parcoords.width(div.width());
	// 	});
};

/*
 █████  ██████  ███████ ████████ ██████   █████   ██████ ████████ ███████
██   ██ ██   ██ ██         ██    ██   ██ ██   ██ ██         ██    ██
███████ ██████  ███████    ██    ██████  ███████ ██         ██    ███████
██   ██ ██   ██      ██    ██    ██   ██ ██   ██ ██         ██         ██
██   ██ ██████  ███████    ██    ██   ██ ██   ██  ██████    ██    ███████
*/

/**
 * Intended for overwrite.
 */
DesignExplorer.prototype.abstract_parcoords_postRender = function () {};

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
  },
  'custom':{
    'signifier': 'custom:',
    'key': 'custom',
    'display':'Custom Output'
  },
};

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImhlYWRlci5qcyIsImNvbnN0cnVjdG9ycy9QYXJhbS5qcyIsImNvbnN0cnVjdG9ycy9QYXJhbUN1c3RvbS5qcyIsInBhcnRpYWxzL2FkZEN1c3RvbVBhcmFtLmpzIiwicGFydGlhbHMvZ2V0SXRlcmF0aW9uVGFibGUuanMiLCJwYXJ0aWFscy9nZXRQYXJhbUZyb21EYXRha2V5LmpzIiwicGFydGlhbHMvcGFyY29vcmRzX2NyZWF0ZS5qcyIsInBhcnRpYWxzL3BhcmNvb3Jkc19nZXRDdXJEaW1zLmpzIiwicGFydGlhbHMvcGFyY29vcmRzX3JlZHJhdy5qcyIsInBhcnRpYWxzL3NldENvbG9yZXIuanMiLCJzdGF0aWNzL3R5cGVEaXNwbGF5RGljdGlvbmFyeS5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQzFGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUN2QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNsQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ2JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDM0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNQQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDaEhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ2RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDVEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQy9CQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZGVzaWduZXhwbG9yZXIuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcclxuICogQGNvbnN0cnVjdG9yXHJcbiAqL1xyXG52YXIgRGVzaWduRXhwbG9yZXIgPSBmdW5jdGlvbiAob3JpZ2luYWxEYXRhKSB7XHJcblxyXG5cdC8qKlxyXG5cdCAqIEBsZW5kcyBEZXNpZ25FeHBsb3Jlci5wcm90b3R5cGVcclxuXHQgKi9cclxuXHR2YXIgZGVzaWduRXhwbG9yZXIgPSB0aGlzO1xyXG5cclxuXHR2YXIgZGF0YSA9IFtdO1xyXG5cclxuXHQvLyBEaWN0aW9uYXJpZWQgcGFyYW1zXHJcblx0ZGVzaWduRXhwbG9yZXIucGFyYW1zID0ge1xyXG5cdFx0J2N1c3RvbSc6W11cclxuXHR9O1xyXG5cclxuXHQvLyBBbGwgcGFyYW1zXHJcblx0ZGVzaWduRXhwbG9yZXIucGFyYW1zQWxsID0gW107XHJcblxyXG5cdC8vIFNldCBsYXRlciBieSBzZXRDb2xvcmVyXHJcblx0ZGVzaWduRXhwbG9yZXIuc2VsZWN0ZWRQYXJhbSA9IG51bGw7XHJcblxyXG5cdC8vIEFsbCBncmFwaHMgbmFtZXNwYWNlXHJcblx0ZGVzaWduRXhwbG9yZXIuZ3JhcGhzID0ge307XHJcblxyXG5cdHNvcnRLZXlzKCk7XHJcblx0Y2xlYW5EYXRhKCk7XHJcblxyXG5cdC8vIEFjY2VzcyB0aGlzIGRhdGEgbGF0ZXJcclxuXHREZXNpZ25FeHBsb3Jlci5wcm90b3R5cGUuZ2V0RGF0YSA9IGZ1bmN0aW9uICgpIHtcclxuXHRcdHJldHVybiBkYXRhO1xyXG5cdH07XHJcblxyXG5cdC8vIFNldCBkZWZhdWx0IHNvcnQgYnkga2V5XHJcblx0ZGVzaWduRXhwbG9yZXIuc2V0Q29sb3JlcihkZXNpZ25FeHBsb3Jlci5wYXJhbXMuaW5bMF0pO1xyXG5cclxuXHQvKlxyXG5cdCDilojilojilojilojiloggIOKWiOKWiOKWiCAgICDilojiloggIOKWiOKWiOKWiOKWiOKWiOKWiCAg4paI4paI4paIICAgIOKWiOKWiFxyXG5cdOKWiOKWiCAgIOKWiOKWiCDilojilojilojiloggICDilojilogg4paI4paIICAgIOKWiOKWiCDilojilojilojiloggICDilojilohcclxuXHTilojilojilojilojilojilojilogg4paI4paIIOKWiOKWiCAg4paI4paIIOKWiOKWiCAgICDilojilogg4paI4paIIOKWiOKWiCAg4paI4paIXHJcblx04paI4paIICAg4paI4paIIOKWiOKWiCAg4paI4paIIOKWiOKWiCDilojiloggICAg4paI4paIIOKWiOKWiCAg4paI4paIIOKWiOKWiFxyXG5cdOKWiOKWiCAgIOKWiOKWiCDilojiloggICDilojilojilojiloggIOKWiOKWiOKWiOKWiOKWiOKWiCAg4paI4paIICAg4paI4paI4paI4paIXHJcblx0Ki9cclxuXHJcblx0ZnVuY3Rpb24gc29ydEtleXMoKSB7XHJcblx0XHQvLyBJbml0aWFsIENsZWFudXBcclxuXHRcdHZhciBrZXlzID0gZDMua2V5cyhvcmlnaW5hbERhdGFbMF0pO1xyXG5cclxuXHRcdC8vIFBvcHVsYXRlIHdoaWNoIGFyZSBpbnB1dCBhbmQgb3V0cHV0IGtleXNcclxuXHRcdGtleXMuZm9yRWFjaChmdW5jdGlvbiAoa2V5KSB7XHJcblx0XHRcdE9iamVjdC5rZXlzKERlc2lnbkV4cGxvcmVyLnR5cGVEaXNwbGF5RGljdGlvbmFyeSlcclxuXHRcdFx0XHQuZm9yRWFjaChmdW5jdGlvbiAoa2V5VHlwZSkge1xyXG5cdFx0XHRcdFx0dmFyIHR5cGUgPSBEZXNpZ25FeHBsb3Jlci50eXBlRGlzcGxheURpY3Rpb25hcnlba2V5VHlwZV07XHJcblx0XHRcdFx0XHR2YXIgc2lnbmlmaWVyID0gdHlwZS5zaWduaWZpZXI7XHJcblx0XHRcdFx0XHR2YXIga2V5T2JqO1xyXG5cdFx0XHRcdFx0aWYgKGtleS5zdGFydHNXaXRoKHNpZ25pZmllcikpIHtcclxuXHRcdFx0XHRcdFx0a2V5T2JqID0gbmV3IERlc2lnbkV4cGxvcmVyLlBhcmFtKGtleSwgdHlwZSk7XHJcblx0XHRcdFx0XHRcdGRlc2lnbkV4cGxvcmVyLnBhcmFtc0FsbC5wdXNoKGtleU9iaik7XHJcblx0XHRcdFx0XHRcdGRlc2lnbkV4cGxvcmVyLnBhcmFtc1trZXlUeXBlXSA9IGRlc2lnbkV4cGxvcmVyLnBhcmFtc1trZXlUeXBlXSB8fCBbXTtcclxuXHRcdFx0XHRcdFx0ZGVzaWduRXhwbG9yZXIucGFyYW1zW2tleVR5cGVdLnB1c2goa2V5T2JqKTtcclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHR9KTtcclxuXHRcdH0pO1xyXG5cdH1cclxuXHJcblx0ZnVuY3Rpb24gY2xlYW5EYXRhKCkge1xyXG5cdFx0Ly8gY2xlYW4gZGF0YVxyXG5cdFx0b3JpZ2luYWxEYXRhLmZvckVhY2goZnVuY3Rpb24gKGRhdHVtLCBpKSB7XHJcblx0XHRcdHZhciBjbGVhbmVkRGF0dW0gPSB7XHJcblx0XHRcdFx0X2lkOiBpXHJcblx0XHRcdH07XHJcblxyXG5cdFx0XHRPYmplY3Qua2V5cyhkYXR1bSlcclxuXHRcdFx0XHQuZm9yRWFjaChmdW5jdGlvbiAoa2V5KSB7XHJcblx0XHRcdFx0XHR2YXIga2V5T2JqID0gZGVzaWduRXhwbG9yZXIucGFyYW1zQWxsLnJlZHVjZShmdW5jdGlvbiAocHJldiwgY3VyKSB7XHJcblx0XHRcdFx0XHRcdHJldHVybiBjdXIub3JpZ2luYWwgPT09IGtleSA/IGN1ciA6IHByZXY7XHJcblx0XHRcdFx0XHR9LCBudWxsKTtcclxuXHRcdFx0XHRcdHZhciBmbG9hdFZlcnNpb24gPSBwYXJzZUZsb2F0KGRhdHVtW2tleV0pO1xyXG5cdFx0XHRcdFx0dmFyIGNsZWFuS2V5ID0ga2V5T2JqID8ga2V5T2JqW0Rlc2lnbkV4cGxvcmVyLmRhdGFLZXldIDoga2V5O1xyXG5cdFx0XHRcdFx0Y2xlYW5lZERhdHVtW2NsZWFuS2V5XSA9IGlzTmFOKGZsb2F0VmVyc2lvbikgPyBkYXR1bVtrZXldIDogZmxvYXRWZXJzaW9uO1xyXG5cdFx0XHRcdH0pO1xyXG5cclxuXHRcdFx0ZGF0YS5wdXNoKGNsZWFuZWREYXR1bSk7XHJcblx0XHR9KTtcclxuXHR9XHJcblxyXG59O1xyXG5cclxuRGVzaWduRXhwbG9yZXIuZGF0YUtleSA9ICdjbGVhbktleSc7XHJcbiIsIkRlc2lnbkV4cGxvcmVyLlBhcmFtID0gZnVuY3Rpb24gKGtleSwgdHlwZSkge1xyXG5cdHZhciBwYXJhbSA9IHRoaXM7XHJcblxyXG5cdHBhcmFtLm9yaWdpbmFsID0ga2V5O1xyXG5cclxuXHRwYXJhbS5kaXNwbGF5ID0ga2V5LnN1YnN0cmluZyh0eXBlLnNpZ25pZmllci5sZW5ndGgsIGtleS5sZW5ndGgpO1xyXG5cclxuXHRwYXJhbS50eXBlID0gdHlwZTtcclxuXHJcblx0cGFyYW0uY2xlYW5LZXkgPSBrZXkucmVwbGFjZSgnOicsICdfJylcclxuXHRcdC5yZXBsYWNlKCdbJywgJ18nKVxyXG5cdFx0LnJlcGxhY2UoJ10nLCAnXycpXHJcblx0XHQucmVwbGFjZSgnICcsICdfJylcclxuXHRcdC5yZXBsYWNlKCcgJywgJ18nKTtcclxuXHJcblx0Ly8gcGFyYW0uY2xlYW5LZXk9a2V5LnJlcGxhY2UoL1shXFxcIiMkJSYnXFwoXFwpXFwqXFwrLFxcLlxcLzo7PD0+XFw/XFxAXFxbXFxcXFxcXVxcXmBcXHtcXHxcXH1+XS9nLCAnXycpO1xyXG5cclxuXHQvLyBjb25zb2xlLmxvZyhrZXksIHBhcmFtLmNsZWFuS2V5KTtcclxuXHJcblx0cGFyYW0uc2hvd25JblBhcmNvb3JkcyA9IHRydWU7XHJcblxyXG5cdHJldHVybiB0aGlzO1xyXG59O1xyXG4iLCIoZnVuY3Rpb24gKCkge1xyXG5cclxuXHR2YXIgY3VzdG9tUGFyYW1Db3VudCA9IDA7XHJcblxyXG5cdERlc2lnbkV4cGxvcmVyLlBhcmFtQ3VzdG9tID0gZnVuY3Rpb24gKCkge1xyXG5cclxuXHRcdGN1c3RvbVBhcmFtQ291bnQgKz0gMTtcclxuXHJcblx0XHREZXNpZ25FeHBsb3Jlci5QYXJhbS5hcHBseSh0aGlzLCBbJ2N1c3RvbTonICsgY3VzdG9tUGFyYW1Db3VudCwgRGVzaWduRXhwbG9yZXIudHlwZURpc3BsYXlEaWN0aW9uYXJ5LmN1c3RvbV0pO1xyXG5cclxuXHRcdHZhciBjdXN0b21QYXJhbSA9IHRoaXM7XHJcblxyXG5cdH07XHJcblxyXG5cdERlc2lnbkV4cGxvcmVyLlBhcmFtQ3VzdG9tLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoRGVzaWduRXhwbG9yZXIuUGFyYW0ucHJvdG90eXBlKTtcclxuXHJcblxyXG59KSgpO1xyXG4iLCJcclxuXHJcblx0RGVzaWduRXhwbG9yZXIucHJvdG90eXBlLmFkZEN1c3RvbVBhcmFtID0gZnVuY3Rpb24gKCkge1xyXG5cdFx0dmFyIGRlc2lnbkV4cGxvcmVyID0gdGhpcztcclxuXHJcblx0XHRjcmVhdGVkQ3VzdG9tQ291bnQgKz0gMTtcclxuXHJcblx0XHR2YXIgcGFyYW0gPSBuZXcgRGVzaWduRXhwbG9yZXIuUGFyYW1DdXN0b20oKTtcclxuXHJcblx0XHRkZXNpZ25FeHBsb3Jlci5wYXJhbXMuY3VzdG9tLnB1c2gocGFyYW0pO1xyXG5cdFx0ZGVzaWduRXhwbG9yZXIucGFyYW1zQWxsLnB1c2goY3VzdG9tKTtcclxuXHJcblx0fTtcclxuIiwiRGVzaWduRXhwbG9yZXIucHJvdG90eXBlLnBvcHVsYXRlSXRlcmF0aW9uVGFibGUgPSBmdW5jdGlvbiAoanFFbGVtZW50LCBpdGVyYXRpb24pIHtcclxuXHR2YXIgZGVzaWduRXhwbG9yZXIgPSB0aGlzO1xyXG5cclxuXHR2YXIgcGFyYW1UeXBlcyA9IE9iamVjdC5rZXlzKGRlc2lnbkV4cGxvcmVyLnBhcmFtcyk7XHJcblxyXG5cdGpxRWxlbWVudC5odG1sKCcnKTtcclxuXHJcblx0cGFyYW1UeXBlcy5mb3JFYWNoKGZ1bmN0aW9uIChrZXkpIHtcclxuXHRcdHZhciB0eXBlID0gRGVzaWduRXhwbG9yZXIudHlwZURpc3BsYXlEaWN0aW9uYXJ5W2tleV07XHJcblx0XHR2YXIgdGFibGUgPSAkKCc8dGFibGUgY2xhc3M9XCJ0YWJsZSB0YWJsZS1jb25kZW5zZWRcIj48L3RhYmxlPicpO1xyXG5cdFx0dmFyIHBhcmFtcyA9IGRlc2lnbkV4cGxvcmVyLnBhcmFtc1trZXldO1xyXG5cdFx0cGFyYW1zLmZvckVhY2goZnVuY3Rpb24gKHBhcmFtKSB7XHJcblx0XHRcdGlmICghcGFyYW0uc2hvd25JblBhcmNvb3JkcykgcmV0dXJuO1xyXG5cdFx0XHR2YXIgcm93ID0gJCgnPHRyPjwvdHI+Jyk7XHJcblx0XHRcdHJvdy5hcHBlbmQoJzx0ZD4nICsgcGFyYW0uZGlzcGxheSArICc8L3RkPicpO1xyXG5cdFx0XHRyb3cuYXBwZW5kKCc8dGQ+JyArIGl0ZXJhdGlvbltwYXJhbVtEZXNpZ25FeHBsb3Jlci5kYXRhS2V5XV0gKyAnPC90ZD4nKTtcclxuXHRcdFx0dGFibGUuYXBwZW5kKHJvdyk7XHJcblxyXG5cdFx0XHRpZiAocGFyYW0gPT09IGRlc2lnbkV4cGxvcmVyLnNlbGVjdGVkUGFyYW0pIHJvdy5jc3MoJ2JvcmRlci1sZWZ0JywgJzVweCBzb2xpZCAnICsgZGVzaWduRXhwbG9yZXIuY29sb3JlcihpdGVyYXRpb24pKVxyXG5cdFx0XHRcdC5jc3MoJ2ZvbnQtd2VpZ2h0JywgJ2JvbGQnKTtcclxuXHRcdH0pO1xyXG5cdFx0anFFbGVtZW50LmFwcGVuZCgnPGg0PicgKyB0eXBlLmRpc3BsYXkgKyAnczwvaDQ+Jyk7XHJcblx0XHRqcUVsZW1lbnQuYXBwZW5kKHRhYmxlKTtcclxuXHR9KTtcclxuXHJcblxyXG59O1xyXG4iLCJEZXNpZ25FeHBsb3Jlci5wcm90b3R5cGUuZ2V0UGFyYW1Gcm9tRGF0YWtleSA9IGZ1bmN0aW9uIChkYXRhS2V5KSB7XHJcblx0dmFyIGRlc2lnbkV4cGxvcmVyID0gdGhpcztcclxuXHJcblx0cmV0dXJuIGRlc2lnbkV4cGxvcmVyLnBhcmFtc0FsbC5yZWR1Y2UoZnVuY3Rpb24gKHByZXYsIGN1cikge1xyXG5cdFx0cmV0dXJuIGN1cltEZXNpZ25FeHBsb3Jlci5kYXRhS2V5XSA9PT0gZGF0YUtleSA/IGN1ciA6IHByZXY7XHJcblx0fSwgbnVsbCk7XHJcbn07XHJcbiIsIkRlc2lnbkV4cGxvcmVyLnByb3RvdHlwZS5wYXJjb29yZHNfY3JlYXRlID0gZnVuY3Rpb24gKGRpdlNlbGVjdG9yKSB7XHJcblxyXG5cdHZhciBkZXNpZ25FeHBsb3JlciA9IHRoaXM7XHJcblxyXG5cdGRlc2lnbkV4cGxvcmVyLmdyYXBocy5fcGFyY29vcmRzRGl2U2VsZWN0b3IgPSBkaXZTZWxlY3RvcjtcclxuXHJcblx0dmFyIGRpdiA9ICQoZGl2U2VsZWN0b3IpO1xyXG5cclxuXHR2YXIgY29udGV4dE1lbnUgPSAkKCcjY29udGV4dC1tZW51Jyk7XHJcblxyXG5cdGRpdi5odG1sKCcnKTtcclxuXHJcblx0ZGl2LmFkZENsYXNzKCdwYXJjb29yZHMnKTtcclxuXHJcblx0dmFyIGRpbWVuc2lvbnMgPSBkZXNpZ25FeHBsb3Jlci5wYXJjb29yZHNfZ2V0Q3VyRGltcygpO1xyXG5cclxuXHRkZXNpZ25FeHBsb3Jlci5ncmFwaHMucGFyY29vcmRzID0gZDMucGFyY29vcmRzKCkoZGl2U2VsZWN0b3IpXHJcblx0XHQuZGF0YShkZXNpZ25FeHBsb3Jlci5nZXREYXRhKCkpXHJcblx0XHQuY29sb3IoZGVzaWduRXhwbG9yZXIuY29sb3JlcilcclxuXHRcdC5hbHBoYSgwLjIpXHJcblx0XHQuYWxwaGFPbkJydXNoZWQoMC4wNSlcclxuXHRcdC5tb2RlKFwicXVldWVcIilcclxuXHRcdC5yYXRlKDIwKVxyXG5cdFx0LmRpbWVuc2lvbnMoZGltZW5zaW9ucylcclxuXHRcdC5yZW5kZXIoKVxyXG5cdFx0LmJydXNoTW9kZShcIjFELWF4ZXNcIikgLy8gZW5hYmxlIGJydXNoaW5nXHJcblx0XHQuYXV0b3NjYWxlKClcclxuXHRcdC5pbnRlcmFjdGl2ZSgpXHJcblx0XHQucmVvcmRlcmFibGUoKTtcclxuXHJcblx0cG9zdFJlbmRlcigpO1xyXG5cclxuXHRkZXNpZ25FeHBsb3Jlci5ncmFwaHMucGFyY29vcmRzLm9uKCdyZW5kZXInLCBfLmRlYm91bmNlKHBvc3RSZW5kZXIsIDQwMCkpO1xyXG5cdGRlc2lnbkV4cGxvcmVyLmdyYXBocy5wYXJjb29yZHMub24oJ2RpbWVuc2lvbnMnLCBfLmRlYm91bmNlKHBvc3RSZW5kZXIsIDQwMCkpO1xyXG5cdC8vIGRlc2lnbkV4cGxvcmVyLmdyYXBocy5wYXJjb29yZHMub24oJ2JydXNoJywgXy5kZWJvdW5jZShwb3N0QnJ1c2gsIDQwMCkpO1xyXG5cclxuXHRmdW5jdGlvbiBwb3N0UmVuZGVyKCkge1xyXG5cclxuXHRcdHZhciBkb21haW5Db2xvcnMgPSBbXTtcclxuXHJcblx0XHRkMy5zZWxlY3RBbGwoZGl2U2VsZWN0b3IgKyAnIGcuZGltZW5zaW9uJylcclxuXHRcdFx0LmVhY2goZnVuY3Rpb24gKGQsIGkpIHtcclxuXHRcdFx0XHR2YXIgcGFyYW0gPSBkZXNpZ25FeHBsb3Jlci5nZXRQYXJhbUZyb21EYXRha2V5KGQpO1xyXG5cdFx0XHRcdHZhciBwYXJhbUNvbG9yID0gKHBhcmFtLnR5cGUua2V5ID09PSAnaW4nKSA/ICcjOTk5JyA6ICcjMDAwJztcclxuXHRcdFx0XHR2YXIgdGhpc0QzID0gZDMuc2VsZWN0KHRoaXMpO1xyXG5cclxuXHRcdFx0XHR0aGlzRDMuc2VsZWN0QWxsKCd0ZXh0LmxhYmVsJylcclxuXHRcdFx0XHRcdC50ZXh0KHBhcmFtLmRpc3BsYXkpXHJcblx0XHRcdFx0XHQuc3R5bGUoJ2ZpbGwnLCBwYXJhbUNvbG9yKTtcclxuXHJcblx0XHRcdFx0dGhpc0QzLnNlbGVjdEFsbCgncGF0aC5kb21haW4nKVxyXG5cdFx0XHRcdFx0LnN0eWxlKCdzdHJva2UnLCBwYXJhbUNvbG9yKTtcclxuXHJcblx0XHRcdFx0dGhpc0QzLnNlbGVjdEFsbCgnIGcudGljayB0ZXh0JylcclxuXHRcdFx0XHRcdC5zdHlsZSgnZm9udC1zaXplJywgJzlweCcpXHJcblx0XHRcdFx0XHQuc3R5bGUoJ2ZpbGwnLCBwYXJhbUNvbG9yKTtcclxuXHJcblx0XHRcdFx0dGhpc0QzLnNlbGVjdEFsbCgnIGcuYnJ1c2ggcmVjdC5leHRlbnQnKVxyXG5cdFx0XHRcdFx0LnN0eWxlKCdmaWxsJywgJ3JnYmEoMjU1LDI1NSwyNTUsMC41KScpXHJcblx0XHRcdFx0XHQub24oJ2NvbnRleHRtZW51JywgZnVuY3Rpb24gKGQsIGkpIHtcclxuXHRcdFx0XHRcdFx0dmFyIGpUaGlzID0gJCh0aGlzKTtcclxuXHJcblx0XHRcdFx0XHRcdGlmIChOdW1iZXIoalRoaXMuYXR0cignaGVpZ2h0JykpID09PSAwKSByZXR1cm47XHJcblxyXG5cdFx0XHRcdFx0XHRkMy5ldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xyXG5cclxuXHRcdFx0XHRcdFx0Y29udGV4dE1lbnUuaHRtbCgnJyk7XHJcblx0XHRcdFx0XHRcdGNvbnRleHRNZW51LmNzcygnbGVmdCcsIGQzLmV2ZW50LmNsaWVudFgpO1xyXG5cdFx0XHRcdFx0XHRjb250ZXh0TWVudS5jc3MoJ3RvcCcsIGQzLmV2ZW50LmNsaWVudFkpO1xyXG5cclxuXHRcdFx0XHRcdFx0dmFyIGxnID0gJCgnPHVsIGNsYXNzPVwibGlzdC1ncm91cFwiPjwvdWw+Jyk7XHJcblxyXG5cdFx0XHRcdFx0XHR2YXIgcmVzZXRCcnVzaCA9ICQoJzxhIGNsYXNzPVwibGlzdC1ncm91cC1pdGVtXCI+UmVzZXQgdGhlc2UgZXh0ZW50czwvYT4nKTtcclxuXHJcblx0XHRcdFx0XHRcdHJlc2V0QnJ1c2gub24oJ2NsaWNrJywgZnVuY3Rpb24gKCkge1xyXG5cdFx0XHRcdFx0XHRcdGRlc2lnbkV4cGxvcmVyLmdyYXBocy5wYXJjb29yZHMuYnJ1c2hSZXNldChkKTtcclxuXHRcdFx0XHRcdFx0fSk7XHJcblxyXG5cdFx0XHRcdFx0XHRsZy5hcHBlbmQocmVzZXRCcnVzaCk7XHJcblx0XHRcdFx0XHRcdGNvbnRleHRNZW51LmFwcGVuZChsZyk7XHJcblxyXG5cdFx0XHRcdFx0XHRjb250ZXh0TWVudS5zaG93KCk7XHJcblxyXG5cdFx0XHRcdFx0XHRsZy5vbignY2xpY2snLCBmdW5jdGlvbiAoKSB7XHJcblx0XHRcdFx0XHRcdFx0Y29udGV4dE1lbnUuaGlkZSgpO1xyXG5cdFx0XHRcdFx0XHR9KTtcclxuXHJcblx0XHRcdFx0XHR9KTtcclxuXHRcdFx0fSk7XHJcblxyXG5cdFx0ZGVzaWduRXhwbG9yZXIuYWJzdHJhY3RfcGFyY29vcmRzX3Bvc3RSZW5kZXIoKTtcclxuXHR9XHJcblxyXG5cdC8vIHJlc2l6ZSBvciByZS1yZW5kZXIgYnJlYWtzIHRoZSBicnVzaCBtb2RlXHJcblx0Ly8gJCh3aW5kb3cpXHJcblx0Ly8gXHQub24oJ3Jlc2l6ZScsIGZ1bmN0aW9uICgpIHtcclxuXHQvLyBcdFx0ZGVzaWduRXhwbG9yZXIuZ3JhcGhzLnBhcmNvb3Jkcy53aWR0aChkaXYud2lkdGgoKSk7XHJcblx0Ly8gXHR9KTtcclxufTtcclxuXHJcbi8qXHJcbiDilojilojilojilojiloggIOKWiOKWiOKWiOKWiOKWiOKWiCAg4paI4paI4paI4paI4paI4paI4paIIOKWiOKWiOKWiOKWiOKWiOKWiOKWiOKWiCDilojilojilojilojilojiloggICDilojilojilojilojiloggICDilojilojilojilojilojilogg4paI4paI4paI4paI4paI4paI4paI4paIIOKWiOKWiOKWiOKWiOKWiOKWiOKWiFxyXG7ilojiloggICDilojilogg4paI4paIICAg4paI4paIIOKWiOKWiCAgICAgICAgIOKWiOKWiCAgICDilojiloggICDilojilogg4paI4paIICAg4paI4paIIOKWiOKWiCAgICAgICAgIOKWiOKWiCAgICDilojilohcclxu4paI4paI4paI4paI4paI4paI4paIIOKWiOKWiOKWiOKWiOKWiOKWiCAg4paI4paI4paI4paI4paI4paI4paIICAgIOKWiOKWiCAgICDilojilojilojilojilojiloggIOKWiOKWiOKWiOKWiOKWiOKWiOKWiCDilojiloggICAgICAgICDilojiloggICAg4paI4paI4paI4paI4paI4paI4paIXHJcbuKWiOKWiCAgIOKWiOKWiCDilojiloggICDilojiloggICAgICDilojiloggICAg4paI4paIICAgIOKWiOKWiCAgIOKWiOKWiCDilojiloggICDilojilogg4paI4paIICAgICAgICAg4paI4paIICAgICAgICAg4paI4paIXHJcbuKWiOKWiCAgIOKWiOKWiCDilojilojilojilojilojiloggIOKWiOKWiOKWiOKWiOKWiOKWiOKWiCAgICDilojiloggICAg4paI4paIICAg4paI4paIIOKWiOKWiCAgIOKWiOKWiCAg4paI4paI4paI4paI4paI4paIICAgIOKWiOKWiCAgICDilojilojilojilojilojilojilohcclxuKi9cclxuXHJcbi8qKlxyXG4gKiBJbnRlbmRlZCBmb3Igb3ZlcndyaXRlLlxyXG4gKi9cclxuRGVzaWduRXhwbG9yZXIucHJvdG90eXBlLmFic3RyYWN0X3BhcmNvb3Jkc19wb3N0UmVuZGVyID0gZnVuY3Rpb24gKCkge307XHJcbiIsIkRlc2lnbkV4cGxvcmVyLnByb3RvdHlwZS5wYXJjb29yZHNfZ2V0Q3VyRGltcyA9IGZ1bmN0aW9uICgpIHtcclxuXHJcblx0dmFyIGRlc2lnbkV4cGxvcmVyID0gdGhpcztcclxuXHJcblx0dmFyIGRpbWVuc2lvbnMgPSBkZXNpZ25FeHBsb3Jlci5wYXJhbXNBbGwucmVkdWNlKGZ1bmN0aW9uIChwcmV2LCBjdXIpIHtcclxuXHRcdGlmIChjdXIuc2hvd25JblBhcmNvb3Jkcykge1xyXG5cdFx0XHRwcmV2W2N1cltEZXNpZ25FeHBsb3Jlci5kYXRhS2V5XV0gPSB7fTtcclxuXHRcdH1cclxuXHRcdHJldHVybiBwcmV2O1xyXG5cdH0sIHt9KTtcclxuXHJcblx0cmV0dXJuIGRpbWVuc2lvbnM7XHJcblxyXG59O1xyXG4iLCJEZXNpZ25FeHBsb3Jlci5wcm90b3R5cGUucGFyY29vcmRzX3JlZHJhdyA9IGZ1bmN0aW9uICgpIHtcclxuXHJcblx0dmFyIGRlc2lnbkV4cGxvcmVyID0gdGhpcztcclxuXHJcblx0aWYgKCFkZXNpZ25FeHBsb3Jlci5ncmFwaHMucGFyY29vcmRzKSByZXR1cm47XHJcblxyXG5cdGRlc2lnbkV4cGxvcmVyLmdyYXBocy5wYXJjb29yZHMuZGltZW5zaW9ucyhkZXNpZ25FeHBsb3Jlci5wYXJjb29yZHNfZ2V0Q3VyRGltcygpKTtcclxuXHJcbn07XHJcbiIsIi8qKlxyXG4gKiBUZWxsIHVzIHdoaWNoIHBhcmFtIHRvIGNvbG9yIGJ5XHJcbiAqIEBwYXJhbSB7b2JqZWN0fSBwYXJhbSAtIFBhcmFtZXRlclxyXG4gKi9cclxuRGVzaWduRXhwbG9yZXIucHJvdG90eXBlLnNldENvbG9yZXIgPSBmdW5jdGlvbiAocGFyYW0pIHtcclxuXHJcblx0dmFyIGRlc2lnbkV4cGxvcmVyID0gdGhpcztcclxuXHJcblx0ZGVzaWduRXhwbG9yZXIuc2VsZWN0ZWRQYXJhbSA9IHBhcmFtO1xyXG5cclxuXHR2YXIgZGF0YSA9IGRlc2lnbkV4cGxvcmVyLmdldERhdGEoKTtcclxuXHJcblx0dmFyIGV4dGVudHMgPSBkMy5leHRlbnQoZGF0YSwgZGF0YUFjY2Vzc29yKTtcclxuXHJcblx0dmFyIGNvbG9yU2NhbGUgPSBkMy5zY2FsZS5saW5lYXIoKVxyXG5cdFx0LmRvbWFpbihleHRlbnRzKVxyXG5cdFx0LnJhbmdlKFtcIiMzYjMxYjBcIiwgXCIjNjZDQ0REXCJdKTtcclxuXHJcblx0ZGVzaWduRXhwbG9yZXIuY29sb3JlciA9IGZ1bmN0aW9uIChkKSB7XHJcblx0XHRyZXR1cm4gY29sb3JTY2FsZShkYXRhQWNjZXNzb3IoZCkpO1xyXG5cdH07XHJcblxyXG5cdGlmKGRlc2lnbkV4cGxvcmVyLmdyYXBocy5wYXJjb29yZHMpIHtcclxuXHRcdGRlc2lnbkV4cGxvcmVyLmdyYXBocy5wYXJjb29yZHMuY29sb3IoZGVzaWduRXhwbG9yZXIuY29sb3JlcikucmVuZGVyKCk7XHJcblx0fVxyXG5cclxuXHRmdW5jdGlvbiBkYXRhQWNjZXNzb3IoZCkge1xyXG5cdFx0cmV0dXJuIGRbcGFyYW1bRGVzaWduRXhwbG9yZXIuZGF0YUtleV1dO1xyXG5cdH1cclxuXHJcbn07XHJcbiIsIkRlc2lnbkV4cGxvcmVyLnR5cGVEaXNwbGF5RGljdGlvbmFyeT17XHJcbiAgJ2luJzp7XHJcbiAgICAnc2lnbmlmaWVyJzogJ2luOicsXHJcbiAgICAna2V5JzogJ2luJyxcclxuICAgICdkaXNwbGF5JzonSW5wdXQnLFxyXG4gIH0sXHJcbiAgJ291dCc6e1xyXG4gICAgJ3NpZ25pZmllcic6ICdvdXQ6JyxcclxuICAgICdrZXknOiAnb3V0JyxcclxuICAgICdkaXNwbGF5JzonT3V0cHV0J1xyXG4gIH0sXHJcbiAgJ2N1c3RvbSc6e1xyXG4gICAgJ3NpZ25pZmllcic6ICdjdXN0b206JyxcclxuICAgICdrZXknOiAnY3VzdG9tJyxcclxuICAgICdkaXNwbGF5JzonQ3VzdG9tIE91dHB1dCdcclxuICB9LFxyXG59O1xyXG4iXX0=
