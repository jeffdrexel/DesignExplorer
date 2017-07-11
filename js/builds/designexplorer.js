/**
 * @constructor
 */
var DesignExplorer = function (originalData, incomingOptions) {

	/**
	 * @lends DesignExplorer.prototype
	 */
	var designExplorer = this;

	var data = [];

	var options = incomingOptions || {
		'useThumbUrls': true
	};

	options.hiddenKeys = options.hiddenKeys || [];
	options.resultIconLimit = options.resultIconLimit || Infinity;
	options.thumbKeys = options.thumbKeys || [];
	options.thumbParams = [];

	designExplorer.options = options;

	// Dictionaried params
	designExplorer.params = {
		'custom': []
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
	designExplorer.setColorer(options.defaultSortParam || designExplorer.params.in[0]);

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
						if (options.hiddenKeys.indexOf(key) !== -1) keyObj.shownInParcoords = false;
						designExplorer.paramsAll.push(keyObj);
						designExplorer.params[keyType] = designExplorer.params[keyType] || [];
						designExplorer.params[keyType].push(keyObj);

						// Add to thumbnail params to show via options
						if (options.thumbKeys.indexOf(key) !== -1) {
							options.thumbParams.push(keyObj);
						}

						// Set default sort key from options if existing
						if (options.defaultSortKey && key === options.defaultSortKey) {
							options.defaultSortParam = keyObj;
						}

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

			if (cleanedDatum.img) {
				cleanedDatum.imgThumb = options.useThumbUrls ? cleanedDatum.img.replace(/.(png|gif|jpe?g)$/i, '_thumb.$1') : cleanedDatum.img;
				cleanedDatum.imgName = cleanedDatum.img.split('/')
					.pop();
			}

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

	param.cleanKey = key.replace(/[\W]/g, '_');

	param.shownInParcoords = true;

	param.curExtents = [];

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

	if (iteration.name) {
		jqElement.append('<h3>Name: ' + iteration.name+'</h3>');
		jqElement.append('<br />');
	}

	paramTypes.forEach(function (key) {
		var type = DesignExplorer.typeDisplayDictionary[key];
		var table = $('<table class="table table-condensed"></table>');
		var params = designExplorer.params[key];
		params.forEach(function (param) {
			// if (!param.shownInParcoords) return;
			var row = $('<tr></tr>');
			row.append('<td>' + param.display + '</td>');
			row.append('<td>' + iteration[param[DesignExplorer.dataKey]] + '</td>');
			table.append(row);

			if (param === designExplorer.selectedParam) row.css('border-left', '5px solid ' + designExplorer.colorer(iteration))
				.css('font-weight', 'bold');
		});

		if(params.length){
			jqElement.append('<h4>' + type.display + 's</h4>');
			jqElement.append(table);
		}

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
		.alphaOnBrushed(0.2)
		.shadows()
		// .brushedColor("#000")
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
	designExplorer.graphs.parcoords.on('brush', _.debounce(postRender, 400));
	// designExplorer.graphs.parcoords.on('brush', _.debounce(postBrush, 400));

	function postRender() {

		var domainColors = [];

		var curData = designExplorer.graphs.parcoords.brushed();

		d3.selectAll(divSelector + ' g.dimension')
			.each(function (d, i) {
				var param = designExplorer.getParamFromDatakey(d);
				var paramColor = (param.type.key === 'in') ? '#999' : '#000';
				var thisD3 = d3.select(this);

				var curExtents = d3.extent(curData, function (d) {
					return d[param[DesignExplorer.dataKey]];
				});

				param.curExtents[0] = curExtents[0];
				param.curExtents[1] = curExtents[1];

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

						if (!showBrushMenu()) return;

						var lg = $('<ul class="list-group"></ul>'),
							resetBrush = $('<a class="list-group-item"><b>Reset these extents</b></a>');

						resetBrush.on('click', function () {
							designExplorer.graphs.parcoords.brushReset(d);
						});

						lg.append(resetBrush);
						contextMenu.append(lg);

						lg.on('click', function () {
							contextMenu.hide();
						});

					})
					.on('mouseover', function (d, i) {

						if (!showBrushMenu()) return;

						var filterMessage = '<a class="list-group-item">Filtered ' + param.curExtents.join(' to ') + '.</a>';

						contextMenu.append(filterMessage);
					})
					.on('mouseout', function (d, i) {

						contextMenu.hide();

					});
			});

		function showBrushMenu() {
			var jThis = $(this);

			if (Number(jThis.attr('height')) === 0) return;

			d3.event.preventDefault();

			contextMenu.html('');
			contextMenu.css('left', d3.event.clientX);
			contextMenu.css('top', d3.event.clientY);
			contextMenu.show();

			return jThis;
		}

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

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImhlYWRlci5qcyIsImNvbnN0cnVjdG9ycy9QYXJhbS5qcyIsImNvbnN0cnVjdG9ycy9QYXJhbUN1c3RvbS5qcyIsInBhcnRpYWxzL2FkZEN1c3RvbVBhcmFtLmpzIiwicGFydGlhbHMvZ2V0SXRlcmF0aW9uVGFibGUuanMiLCJwYXJ0aWFscy9nZXRQYXJhbUZyb21EYXRha2V5LmpzIiwicGFydGlhbHMvcGFyY29vcmRzX2NyZWF0ZS5qcyIsInBhcnRpYWxzL3BhcmNvb3Jkc19nZXRDdXJEaW1zLmpzIiwicGFydGlhbHMvcGFyY29vcmRzX3JlZHJhdy5qcyIsInBhcnRpYWxzL3NldENvbG9yZXIuanMiLCJzdGF0aWNzL3R5cGVEaXNwbGF5RGljdGlvbmFyeS5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUN2SEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDakJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDbEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNiQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3BDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDUEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQzlJQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNkQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ1RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUMvQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImRlc2lnbmV4cGxvcmVyLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXHJcbiAqIEBjb25zdHJ1Y3RvclxyXG4gKi9cclxudmFyIERlc2lnbkV4cGxvcmVyID0gZnVuY3Rpb24gKG9yaWdpbmFsRGF0YSwgaW5jb21pbmdPcHRpb25zKSB7XHJcblxyXG5cdC8qKlxyXG5cdCAqIEBsZW5kcyBEZXNpZ25FeHBsb3Jlci5wcm90b3R5cGVcclxuXHQgKi9cclxuXHR2YXIgZGVzaWduRXhwbG9yZXIgPSB0aGlzO1xyXG5cclxuXHR2YXIgZGF0YSA9IFtdO1xyXG5cclxuXHR2YXIgb3B0aW9ucyA9IGluY29taW5nT3B0aW9ucyB8fCB7XHJcblx0XHQndXNlVGh1bWJVcmxzJzogdHJ1ZVxyXG5cdH07XHJcblxyXG5cdG9wdGlvbnMuaGlkZGVuS2V5cyA9IG9wdGlvbnMuaGlkZGVuS2V5cyB8fCBbXTtcclxuXHRvcHRpb25zLnJlc3VsdEljb25MaW1pdCA9IG9wdGlvbnMucmVzdWx0SWNvbkxpbWl0IHx8IEluZmluaXR5O1xyXG5cdG9wdGlvbnMudGh1bWJLZXlzID0gb3B0aW9ucy50aHVtYktleXMgfHwgW107XHJcblx0b3B0aW9ucy50aHVtYlBhcmFtcyA9IFtdO1xyXG5cclxuXHRkZXNpZ25FeHBsb3Jlci5vcHRpb25zID0gb3B0aW9ucztcclxuXHJcblx0Ly8gRGljdGlvbmFyaWVkIHBhcmFtc1xyXG5cdGRlc2lnbkV4cGxvcmVyLnBhcmFtcyA9IHtcclxuXHRcdCdjdXN0b20nOiBbXVxyXG5cdH07XHJcblxyXG5cdC8vIEFsbCBwYXJhbXNcclxuXHRkZXNpZ25FeHBsb3Jlci5wYXJhbXNBbGwgPSBbXTtcclxuXHJcblx0Ly8gU2V0IGxhdGVyIGJ5IHNldENvbG9yZXJcclxuXHRkZXNpZ25FeHBsb3Jlci5zZWxlY3RlZFBhcmFtID0gbnVsbDtcclxuXHJcblx0Ly8gQWxsIGdyYXBocyBuYW1lc3BhY2VcclxuXHRkZXNpZ25FeHBsb3Jlci5ncmFwaHMgPSB7fTtcclxuXHJcblx0c29ydEtleXMoKTtcclxuXHRjbGVhbkRhdGEoKTtcclxuXHJcblx0Ly8gQWNjZXNzIHRoaXMgZGF0YSBsYXRlclxyXG5cdERlc2lnbkV4cGxvcmVyLnByb3RvdHlwZS5nZXREYXRhID0gZnVuY3Rpb24gKCkge1xyXG5cdFx0cmV0dXJuIGRhdGE7XHJcblx0fTtcclxuXHJcblx0Ly8gU2V0IGRlZmF1bHQgc29ydCBieSBrZXlcclxuXHRkZXNpZ25FeHBsb3Jlci5zZXRDb2xvcmVyKG9wdGlvbnMuZGVmYXVsdFNvcnRQYXJhbSB8fCBkZXNpZ25FeHBsb3Jlci5wYXJhbXMuaW5bMF0pO1xyXG5cclxuXHQvKlxyXG5cdCDilojilojilojilojiloggIOKWiOKWiOKWiCAgICDilojiloggIOKWiOKWiOKWiOKWiOKWiOKWiCAg4paI4paI4paIICAgIOKWiOKWiFxyXG5cdOKWiOKWiCAgIOKWiOKWiCDilojilojilojiloggICDilojilogg4paI4paIICAgIOKWiOKWiCDilojilojilojiloggICDilojilohcclxuXHTilojilojilojilojilojilojilogg4paI4paIIOKWiOKWiCAg4paI4paIIOKWiOKWiCAgICDilojilogg4paI4paIIOKWiOKWiCAg4paI4paIXHJcblx04paI4paIICAg4paI4paIIOKWiOKWiCAg4paI4paIIOKWiOKWiCDilojiloggICAg4paI4paIIOKWiOKWiCAg4paI4paIIOKWiOKWiFxyXG5cdOKWiOKWiCAgIOKWiOKWiCDilojiloggICDilojilojilojiloggIOKWiOKWiOKWiOKWiOKWiOKWiCAg4paI4paIICAg4paI4paI4paI4paIXHJcblx0Ki9cclxuXHJcblx0ZnVuY3Rpb24gc29ydEtleXMoKSB7XHJcblx0XHQvLyBJbml0aWFsIENsZWFudXBcclxuXHRcdHZhciBrZXlzID0gZDMua2V5cyhvcmlnaW5hbERhdGFbMF0pO1xyXG5cclxuXHRcdC8vIFBvcHVsYXRlIHdoaWNoIGFyZSBpbnB1dCBhbmQgb3V0cHV0IGtleXNcclxuXHRcdGtleXMuZm9yRWFjaChmdW5jdGlvbiAoa2V5KSB7XHJcblx0XHRcdE9iamVjdC5rZXlzKERlc2lnbkV4cGxvcmVyLnR5cGVEaXNwbGF5RGljdGlvbmFyeSlcclxuXHRcdFx0XHQuZm9yRWFjaChmdW5jdGlvbiAoa2V5VHlwZSkge1xyXG5cdFx0XHRcdFx0dmFyIHR5cGUgPSBEZXNpZ25FeHBsb3Jlci50eXBlRGlzcGxheURpY3Rpb25hcnlba2V5VHlwZV07XHJcblx0XHRcdFx0XHR2YXIgc2lnbmlmaWVyID0gdHlwZS5zaWduaWZpZXI7XHJcblx0XHRcdFx0XHR2YXIga2V5T2JqO1xyXG5cdFx0XHRcdFx0aWYgKGtleS5zdGFydHNXaXRoKHNpZ25pZmllcikpIHtcclxuXHRcdFx0XHRcdFx0a2V5T2JqID0gbmV3IERlc2lnbkV4cGxvcmVyLlBhcmFtKGtleSwgdHlwZSk7XHJcblx0XHRcdFx0XHRcdGlmIChvcHRpb25zLmhpZGRlbktleXMuaW5kZXhPZihrZXkpICE9PSAtMSkga2V5T2JqLnNob3duSW5QYXJjb29yZHMgPSBmYWxzZTtcclxuXHRcdFx0XHRcdFx0ZGVzaWduRXhwbG9yZXIucGFyYW1zQWxsLnB1c2goa2V5T2JqKTtcclxuXHRcdFx0XHRcdFx0ZGVzaWduRXhwbG9yZXIucGFyYW1zW2tleVR5cGVdID0gZGVzaWduRXhwbG9yZXIucGFyYW1zW2tleVR5cGVdIHx8IFtdO1xyXG5cdFx0XHRcdFx0XHRkZXNpZ25FeHBsb3Jlci5wYXJhbXNba2V5VHlwZV0ucHVzaChrZXlPYmopO1xyXG5cclxuXHRcdFx0XHRcdFx0Ly8gQWRkIHRvIHRodW1ibmFpbCBwYXJhbXMgdG8gc2hvdyB2aWEgb3B0aW9uc1xyXG5cdFx0XHRcdFx0XHRpZiAob3B0aW9ucy50aHVtYktleXMuaW5kZXhPZihrZXkpICE9PSAtMSkge1xyXG5cdFx0XHRcdFx0XHRcdG9wdGlvbnMudGh1bWJQYXJhbXMucHVzaChrZXlPYmopO1xyXG5cdFx0XHRcdFx0XHR9XHJcblxyXG5cdFx0XHRcdFx0XHQvLyBTZXQgZGVmYXVsdCBzb3J0IGtleSBmcm9tIG9wdGlvbnMgaWYgZXhpc3RpbmdcclxuXHRcdFx0XHRcdFx0aWYgKG9wdGlvbnMuZGVmYXVsdFNvcnRLZXkgJiYga2V5ID09PSBvcHRpb25zLmRlZmF1bHRTb3J0S2V5KSB7XHJcblx0XHRcdFx0XHRcdFx0b3B0aW9ucy5kZWZhdWx0U29ydFBhcmFtID0ga2V5T2JqO1xyXG5cdFx0XHRcdFx0XHR9XHJcblxyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdH0pO1xyXG5cdFx0fSk7XHJcblx0fVxyXG5cclxuXHRmdW5jdGlvbiBjbGVhbkRhdGEoKSB7XHJcblx0XHQvLyBjbGVhbiBkYXRhXHJcblx0XHRvcmlnaW5hbERhdGEuZm9yRWFjaChmdW5jdGlvbiAoZGF0dW0sIGkpIHtcclxuXHRcdFx0dmFyIGNsZWFuZWREYXR1bSA9IHtcclxuXHRcdFx0XHRfaWQ6IGlcclxuXHRcdFx0fTtcclxuXHJcblx0XHRcdE9iamVjdC5rZXlzKGRhdHVtKVxyXG5cdFx0XHRcdC5mb3JFYWNoKGZ1bmN0aW9uIChrZXkpIHtcclxuXHRcdFx0XHRcdHZhciBrZXlPYmogPSBkZXNpZ25FeHBsb3Jlci5wYXJhbXNBbGwucmVkdWNlKGZ1bmN0aW9uIChwcmV2LCBjdXIpIHtcclxuXHRcdFx0XHRcdFx0cmV0dXJuIGN1ci5vcmlnaW5hbCA9PT0ga2V5ID8gY3VyIDogcHJldjtcclxuXHRcdFx0XHRcdH0sIG51bGwpO1xyXG5cdFx0XHRcdFx0dmFyIGZsb2F0VmVyc2lvbiA9IHBhcnNlRmxvYXQoZGF0dW1ba2V5XSk7XHJcblx0XHRcdFx0XHR2YXIgY2xlYW5LZXkgPSBrZXlPYmogPyBrZXlPYmpbRGVzaWduRXhwbG9yZXIuZGF0YUtleV0gOiBrZXk7XHJcblx0XHRcdFx0XHRjbGVhbmVkRGF0dW1bY2xlYW5LZXldID0gaXNOYU4oZmxvYXRWZXJzaW9uKSA/IGRhdHVtW2tleV0gOiBmbG9hdFZlcnNpb247XHJcblx0XHRcdFx0fSk7XHJcblxyXG5cdFx0XHRpZiAoY2xlYW5lZERhdHVtLmltZykge1xyXG5cdFx0XHRcdGNsZWFuZWREYXR1bS5pbWdUaHVtYiA9IG9wdGlvbnMudXNlVGh1bWJVcmxzID8gY2xlYW5lZERhdHVtLmltZy5yZXBsYWNlKC8uKHBuZ3xnaWZ8anBlP2cpJC9pLCAnX3RodW1iLiQxJykgOiBjbGVhbmVkRGF0dW0uaW1nO1xyXG5cdFx0XHRcdGNsZWFuZWREYXR1bS5pbWdOYW1lID0gY2xlYW5lZERhdHVtLmltZy5zcGxpdCgnLycpXHJcblx0XHRcdFx0XHQucG9wKCk7XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdGRhdGEucHVzaChjbGVhbmVkRGF0dW0pO1xyXG5cdFx0fSk7XHJcblx0fVxyXG5cclxufTtcclxuXHJcbkRlc2lnbkV4cGxvcmVyLmRhdGFLZXkgPSAnY2xlYW5LZXknO1xyXG4iLCJEZXNpZ25FeHBsb3Jlci5QYXJhbSA9IGZ1bmN0aW9uIChrZXksIHR5cGUpIHtcclxuXHR2YXIgcGFyYW0gPSB0aGlzO1xyXG5cclxuXHRwYXJhbS5vcmlnaW5hbCA9IGtleTtcclxuXHJcblx0cGFyYW0uZGlzcGxheSA9IGtleS5zdWJzdHJpbmcodHlwZS5zaWduaWZpZXIubGVuZ3RoLCBrZXkubGVuZ3RoKTtcclxuXHJcblx0cGFyYW0udHlwZSA9IHR5cGU7XHJcblxyXG5cdHBhcmFtLmNsZWFuS2V5ID0ga2V5LnJlcGxhY2UoL1tcXFddL2csICdfJyk7XHJcblxyXG5cdHBhcmFtLnNob3duSW5QYXJjb29yZHMgPSB0cnVlO1xyXG5cclxuXHRwYXJhbS5jdXJFeHRlbnRzID0gW107XHJcblxyXG5cdHJldHVybiB0aGlzO1xyXG59O1xyXG4iLCIoZnVuY3Rpb24gKCkge1xyXG5cclxuXHR2YXIgY3VzdG9tUGFyYW1Db3VudCA9IDA7XHJcblxyXG5cdERlc2lnbkV4cGxvcmVyLlBhcmFtQ3VzdG9tID0gZnVuY3Rpb24gKCkge1xyXG5cclxuXHRcdGN1c3RvbVBhcmFtQ291bnQgKz0gMTtcclxuXHJcblx0XHREZXNpZ25FeHBsb3Jlci5QYXJhbS5hcHBseSh0aGlzLCBbJ2N1c3RvbTonICsgY3VzdG9tUGFyYW1Db3VudCwgRGVzaWduRXhwbG9yZXIudHlwZURpc3BsYXlEaWN0aW9uYXJ5LmN1c3RvbV0pO1xyXG5cclxuXHRcdHZhciBjdXN0b21QYXJhbSA9IHRoaXM7XHJcblxyXG5cdH07XHJcblxyXG5cdERlc2lnbkV4cGxvcmVyLlBhcmFtQ3VzdG9tLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoRGVzaWduRXhwbG9yZXIuUGFyYW0ucHJvdG90eXBlKTtcclxuXHJcblxyXG59KSgpO1xyXG4iLCJcclxuXHJcblx0RGVzaWduRXhwbG9yZXIucHJvdG90eXBlLmFkZEN1c3RvbVBhcmFtID0gZnVuY3Rpb24gKCkge1xyXG5cdFx0dmFyIGRlc2lnbkV4cGxvcmVyID0gdGhpcztcclxuXHJcblx0XHRjcmVhdGVkQ3VzdG9tQ291bnQgKz0gMTtcclxuXHJcblx0XHR2YXIgcGFyYW0gPSBuZXcgRGVzaWduRXhwbG9yZXIuUGFyYW1DdXN0b20oKTtcclxuXHJcblx0XHRkZXNpZ25FeHBsb3Jlci5wYXJhbXMuY3VzdG9tLnB1c2gocGFyYW0pO1xyXG5cdFx0ZGVzaWduRXhwbG9yZXIucGFyYW1zQWxsLnB1c2goY3VzdG9tKTtcclxuXHJcblx0fTtcclxuIiwiRGVzaWduRXhwbG9yZXIucHJvdG90eXBlLnBvcHVsYXRlSXRlcmF0aW9uVGFibGUgPSBmdW5jdGlvbiAoanFFbGVtZW50LCBpdGVyYXRpb24pIHtcclxuXHR2YXIgZGVzaWduRXhwbG9yZXIgPSB0aGlzO1xyXG5cclxuXHR2YXIgcGFyYW1UeXBlcyA9IE9iamVjdC5rZXlzKGRlc2lnbkV4cGxvcmVyLnBhcmFtcyk7XHJcblxyXG5cdGpxRWxlbWVudC5odG1sKCcnKTtcclxuXHJcblx0aWYgKGl0ZXJhdGlvbi5uYW1lKSB7XHJcblx0XHRqcUVsZW1lbnQuYXBwZW5kKCc8aDM+TmFtZTogJyArIGl0ZXJhdGlvbi5uYW1lKyc8L2gzPicpO1xyXG5cdFx0anFFbGVtZW50LmFwcGVuZCgnPGJyIC8+Jyk7XHJcblx0fVxyXG5cclxuXHRwYXJhbVR5cGVzLmZvckVhY2goZnVuY3Rpb24gKGtleSkge1xyXG5cdFx0dmFyIHR5cGUgPSBEZXNpZ25FeHBsb3Jlci50eXBlRGlzcGxheURpY3Rpb25hcnlba2V5XTtcclxuXHRcdHZhciB0YWJsZSA9ICQoJzx0YWJsZSBjbGFzcz1cInRhYmxlIHRhYmxlLWNvbmRlbnNlZFwiPjwvdGFibGU+Jyk7XHJcblx0XHR2YXIgcGFyYW1zID0gZGVzaWduRXhwbG9yZXIucGFyYW1zW2tleV07XHJcblx0XHRwYXJhbXMuZm9yRWFjaChmdW5jdGlvbiAocGFyYW0pIHtcclxuXHRcdFx0Ly8gaWYgKCFwYXJhbS5zaG93bkluUGFyY29vcmRzKSByZXR1cm47XHJcblx0XHRcdHZhciByb3cgPSAkKCc8dHI+PC90cj4nKTtcclxuXHRcdFx0cm93LmFwcGVuZCgnPHRkPicgKyBwYXJhbS5kaXNwbGF5ICsgJzwvdGQ+Jyk7XHJcblx0XHRcdHJvdy5hcHBlbmQoJzx0ZD4nICsgaXRlcmF0aW9uW3BhcmFtW0Rlc2lnbkV4cGxvcmVyLmRhdGFLZXldXSArICc8L3RkPicpO1xyXG5cdFx0XHR0YWJsZS5hcHBlbmQocm93KTtcclxuXHJcblx0XHRcdGlmIChwYXJhbSA9PT0gZGVzaWduRXhwbG9yZXIuc2VsZWN0ZWRQYXJhbSkgcm93LmNzcygnYm9yZGVyLWxlZnQnLCAnNXB4IHNvbGlkICcgKyBkZXNpZ25FeHBsb3Jlci5jb2xvcmVyKGl0ZXJhdGlvbikpXHJcblx0XHRcdFx0LmNzcygnZm9udC13ZWlnaHQnLCAnYm9sZCcpO1xyXG5cdFx0fSk7XHJcblxyXG5cdFx0aWYocGFyYW1zLmxlbmd0aCl7XHJcblx0XHRcdGpxRWxlbWVudC5hcHBlbmQoJzxoND4nICsgdHlwZS5kaXNwbGF5ICsgJ3M8L2g0PicpO1xyXG5cdFx0XHRqcUVsZW1lbnQuYXBwZW5kKHRhYmxlKTtcclxuXHRcdH1cclxuXHJcblx0fSk7XHJcblxyXG5cclxufTtcclxuIiwiRGVzaWduRXhwbG9yZXIucHJvdG90eXBlLmdldFBhcmFtRnJvbURhdGFrZXkgPSBmdW5jdGlvbiAoZGF0YUtleSkge1xyXG5cdHZhciBkZXNpZ25FeHBsb3JlciA9IHRoaXM7XHJcblxyXG5cdHJldHVybiBkZXNpZ25FeHBsb3Jlci5wYXJhbXNBbGwucmVkdWNlKGZ1bmN0aW9uIChwcmV2LCBjdXIpIHtcclxuXHRcdHJldHVybiBjdXJbRGVzaWduRXhwbG9yZXIuZGF0YUtleV0gPT09IGRhdGFLZXkgPyBjdXIgOiBwcmV2O1xyXG5cdH0sIG51bGwpO1xyXG59O1xyXG4iLCJEZXNpZ25FeHBsb3Jlci5wcm90b3R5cGUucGFyY29vcmRzX2NyZWF0ZSA9IGZ1bmN0aW9uIChkaXZTZWxlY3Rvcikge1xyXG5cclxuXHR2YXIgZGVzaWduRXhwbG9yZXIgPSB0aGlzO1xyXG5cclxuXHRkZXNpZ25FeHBsb3Jlci5ncmFwaHMuX3BhcmNvb3Jkc0RpdlNlbGVjdG9yID0gZGl2U2VsZWN0b3I7XHJcblxyXG5cdHZhciBkaXYgPSAkKGRpdlNlbGVjdG9yKTtcclxuXHJcblx0dmFyIGNvbnRleHRNZW51ID0gJCgnI2NvbnRleHQtbWVudScpO1xyXG5cclxuXHRkaXYuaHRtbCgnJyk7XHJcblxyXG5cdGRpdi5hZGRDbGFzcygncGFyY29vcmRzJyk7XHJcblxyXG5cdHZhciBkaW1lbnNpb25zID0gZGVzaWduRXhwbG9yZXIucGFyY29vcmRzX2dldEN1ckRpbXMoKTtcclxuXHJcblx0ZGVzaWduRXhwbG9yZXIuZ3JhcGhzLnBhcmNvb3JkcyA9IGQzLnBhcmNvb3JkcygpKGRpdlNlbGVjdG9yKVxyXG5cdFx0LmRhdGEoZGVzaWduRXhwbG9yZXIuZ2V0RGF0YSgpKVxyXG5cdFx0LmNvbG9yKGRlc2lnbkV4cGxvcmVyLmNvbG9yZXIpXHJcblx0XHQuYWxwaGEoMC4yKVxyXG5cdFx0LmFscGhhT25CcnVzaGVkKDAuMilcclxuXHRcdC5zaGFkb3dzKClcclxuXHRcdC8vIC5icnVzaGVkQ29sb3IoXCIjMDAwXCIpXHJcblx0XHQubW9kZShcInF1ZXVlXCIpXHJcblx0XHQucmF0ZSgyMClcclxuXHRcdC5kaW1lbnNpb25zKGRpbWVuc2lvbnMpXHJcblx0XHQucmVuZGVyKClcclxuXHRcdC5icnVzaE1vZGUoXCIxRC1heGVzXCIpIC8vIGVuYWJsZSBicnVzaGluZ1xyXG5cdFx0LmF1dG9zY2FsZSgpXHJcblx0XHQuaW50ZXJhY3RpdmUoKVxyXG5cdFx0LnJlb3JkZXJhYmxlKCk7XHJcblxyXG5cdHBvc3RSZW5kZXIoKTtcclxuXHJcblx0ZGVzaWduRXhwbG9yZXIuZ3JhcGhzLnBhcmNvb3Jkcy5vbigncmVuZGVyJywgXy5kZWJvdW5jZShwb3N0UmVuZGVyLCA0MDApKTtcclxuXHRkZXNpZ25FeHBsb3Jlci5ncmFwaHMucGFyY29vcmRzLm9uKCdkaW1lbnNpb25zJywgXy5kZWJvdW5jZShwb3N0UmVuZGVyLCA0MDApKTtcclxuXHRkZXNpZ25FeHBsb3Jlci5ncmFwaHMucGFyY29vcmRzLm9uKCdicnVzaCcsIF8uZGVib3VuY2UocG9zdFJlbmRlciwgNDAwKSk7XHJcblx0Ly8gZGVzaWduRXhwbG9yZXIuZ3JhcGhzLnBhcmNvb3Jkcy5vbignYnJ1c2gnLCBfLmRlYm91bmNlKHBvc3RCcnVzaCwgNDAwKSk7XHJcblxyXG5cdGZ1bmN0aW9uIHBvc3RSZW5kZXIoKSB7XHJcblxyXG5cdFx0dmFyIGRvbWFpbkNvbG9ycyA9IFtdO1xyXG5cclxuXHRcdHZhciBjdXJEYXRhID0gZGVzaWduRXhwbG9yZXIuZ3JhcGhzLnBhcmNvb3Jkcy5icnVzaGVkKCk7XHJcblxyXG5cdFx0ZDMuc2VsZWN0QWxsKGRpdlNlbGVjdG9yICsgJyBnLmRpbWVuc2lvbicpXHJcblx0XHRcdC5lYWNoKGZ1bmN0aW9uIChkLCBpKSB7XHJcblx0XHRcdFx0dmFyIHBhcmFtID0gZGVzaWduRXhwbG9yZXIuZ2V0UGFyYW1Gcm9tRGF0YWtleShkKTtcclxuXHRcdFx0XHR2YXIgcGFyYW1Db2xvciA9IChwYXJhbS50eXBlLmtleSA9PT0gJ2luJykgPyAnIzk5OScgOiAnIzAwMCc7XHJcblx0XHRcdFx0dmFyIHRoaXNEMyA9IGQzLnNlbGVjdCh0aGlzKTtcclxuXHJcblx0XHRcdFx0dmFyIGN1ckV4dGVudHMgPSBkMy5leHRlbnQoY3VyRGF0YSwgZnVuY3Rpb24gKGQpIHtcclxuXHRcdFx0XHRcdHJldHVybiBkW3BhcmFtW0Rlc2lnbkV4cGxvcmVyLmRhdGFLZXldXTtcclxuXHRcdFx0XHR9KTtcclxuXHJcblx0XHRcdFx0cGFyYW0uY3VyRXh0ZW50c1swXSA9IGN1ckV4dGVudHNbMF07XHJcblx0XHRcdFx0cGFyYW0uY3VyRXh0ZW50c1sxXSA9IGN1ckV4dGVudHNbMV07XHJcblxyXG5cdFx0XHRcdHRoaXNEMy5zZWxlY3RBbGwoJ3RleHQubGFiZWwnKVxyXG5cdFx0XHRcdFx0LnRleHQocGFyYW0uZGlzcGxheSlcclxuXHRcdFx0XHRcdC5zdHlsZSgnZmlsbCcsIHBhcmFtQ29sb3IpO1xyXG5cclxuXHRcdFx0XHR0aGlzRDMuc2VsZWN0QWxsKCdwYXRoLmRvbWFpbicpXHJcblx0XHRcdFx0XHQuc3R5bGUoJ3N0cm9rZScsIHBhcmFtQ29sb3IpO1xyXG5cclxuXHRcdFx0XHR0aGlzRDMuc2VsZWN0QWxsKCcgZy50aWNrIHRleHQnKVxyXG5cdFx0XHRcdFx0LnN0eWxlKCdmb250LXNpemUnLCAnOXB4JylcclxuXHRcdFx0XHRcdC5zdHlsZSgnZmlsbCcsIHBhcmFtQ29sb3IpO1xyXG5cclxuXHRcdFx0XHR0aGlzRDMuc2VsZWN0QWxsKCcgZy5icnVzaCByZWN0LmV4dGVudCcpXHJcblx0XHRcdFx0XHQuc3R5bGUoJ2ZpbGwnLCAncmdiYSgyNTUsMjU1LDI1NSwwLjUpJylcclxuXHRcdFx0XHRcdC5vbignY29udGV4dG1lbnUnLCBmdW5jdGlvbiAoZCwgaSkge1xyXG5cclxuXHRcdFx0XHRcdFx0aWYgKCFzaG93QnJ1c2hNZW51KCkpIHJldHVybjtcclxuXHJcblx0XHRcdFx0XHRcdHZhciBsZyA9ICQoJzx1bCBjbGFzcz1cImxpc3QtZ3JvdXBcIj48L3VsPicpLFxyXG5cdFx0XHRcdFx0XHRcdHJlc2V0QnJ1c2ggPSAkKCc8YSBjbGFzcz1cImxpc3QtZ3JvdXAtaXRlbVwiPjxiPlJlc2V0IHRoZXNlIGV4dGVudHM8L2I+PC9hPicpO1xyXG5cclxuXHRcdFx0XHRcdFx0cmVzZXRCcnVzaC5vbignY2xpY2snLCBmdW5jdGlvbiAoKSB7XHJcblx0XHRcdFx0XHRcdFx0ZGVzaWduRXhwbG9yZXIuZ3JhcGhzLnBhcmNvb3Jkcy5icnVzaFJlc2V0KGQpO1xyXG5cdFx0XHRcdFx0XHR9KTtcclxuXHJcblx0XHRcdFx0XHRcdGxnLmFwcGVuZChyZXNldEJydXNoKTtcclxuXHRcdFx0XHRcdFx0Y29udGV4dE1lbnUuYXBwZW5kKGxnKTtcclxuXHJcblx0XHRcdFx0XHRcdGxnLm9uKCdjbGljaycsIGZ1bmN0aW9uICgpIHtcclxuXHRcdFx0XHRcdFx0XHRjb250ZXh0TWVudS5oaWRlKCk7XHJcblx0XHRcdFx0XHRcdH0pO1xyXG5cclxuXHRcdFx0XHRcdH0pXHJcblx0XHRcdFx0XHQub24oJ21vdXNlb3ZlcicsIGZ1bmN0aW9uIChkLCBpKSB7XHJcblxyXG5cdFx0XHRcdFx0XHRpZiAoIXNob3dCcnVzaE1lbnUoKSkgcmV0dXJuO1xyXG5cclxuXHRcdFx0XHRcdFx0dmFyIGZpbHRlck1lc3NhZ2UgPSAnPGEgY2xhc3M9XCJsaXN0LWdyb3VwLWl0ZW1cIj5GaWx0ZXJlZCAnICsgcGFyYW0uY3VyRXh0ZW50cy5qb2luKCcgdG8gJykgKyAnLjwvYT4nO1xyXG5cclxuXHRcdFx0XHRcdFx0Y29udGV4dE1lbnUuYXBwZW5kKGZpbHRlck1lc3NhZ2UpO1xyXG5cdFx0XHRcdFx0fSlcclxuXHRcdFx0XHRcdC5vbignbW91c2VvdXQnLCBmdW5jdGlvbiAoZCwgaSkge1xyXG5cclxuXHRcdFx0XHRcdFx0Y29udGV4dE1lbnUuaGlkZSgpO1xyXG5cclxuXHRcdFx0XHRcdH0pO1xyXG5cdFx0XHR9KTtcclxuXHJcblx0XHRmdW5jdGlvbiBzaG93QnJ1c2hNZW51KCkge1xyXG5cdFx0XHR2YXIgalRoaXMgPSAkKHRoaXMpO1xyXG5cclxuXHRcdFx0aWYgKE51bWJlcihqVGhpcy5hdHRyKCdoZWlnaHQnKSkgPT09IDApIHJldHVybjtcclxuXHJcblx0XHRcdGQzLmV2ZW50LnByZXZlbnREZWZhdWx0KCk7XHJcblxyXG5cdFx0XHRjb250ZXh0TWVudS5odG1sKCcnKTtcclxuXHRcdFx0Y29udGV4dE1lbnUuY3NzKCdsZWZ0JywgZDMuZXZlbnQuY2xpZW50WCk7XHJcblx0XHRcdGNvbnRleHRNZW51LmNzcygndG9wJywgZDMuZXZlbnQuY2xpZW50WSk7XHJcblx0XHRcdGNvbnRleHRNZW51LnNob3coKTtcclxuXHJcblx0XHRcdHJldHVybiBqVGhpcztcclxuXHRcdH1cclxuXHJcblx0XHRkZXNpZ25FeHBsb3Jlci5hYnN0cmFjdF9wYXJjb29yZHNfcG9zdFJlbmRlcigpO1xyXG5cdH1cclxuXHJcblx0Ly8gcmVzaXplIG9yIHJlLXJlbmRlciBicmVha3MgdGhlIGJydXNoIG1vZGVcclxuXHQvLyAkKHdpbmRvdylcclxuXHQvLyBcdC5vbigncmVzaXplJywgZnVuY3Rpb24gKCkge1xyXG5cdC8vIFx0XHRkZXNpZ25FeHBsb3Jlci5ncmFwaHMucGFyY29vcmRzLndpZHRoKGRpdi53aWR0aCgpKTtcclxuXHQvLyBcdH0pO1xyXG59O1xyXG5cclxuLypcclxuIOKWiOKWiOKWiOKWiOKWiCAg4paI4paI4paI4paI4paI4paIICDilojilojilojilojilojilojilogg4paI4paI4paI4paI4paI4paI4paI4paIIOKWiOKWiOKWiOKWiOKWiOKWiCAgIOKWiOKWiOKWiOKWiOKWiCAgIOKWiOKWiOKWiOKWiOKWiOKWiCDilojilojilojilojilojilojilojilogg4paI4paI4paI4paI4paI4paI4paIXHJcbuKWiOKWiCAgIOKWiOKWiCDilojiloggICDilojilogg4paI4paIICAgICAgICAg4paI4paIICAgIOKWiOKWiCAgIOKWiOKWiCDilojiloggICDilojilogg4paI4paIICAgICAgICAg4paI4paIICAgIOKWiOKWiFxyXG7ilojilojilojilojilojilojilogg4paI4paI4paI4paI4paI4paIICDilojilojilojilojilojilojiloggICAg4paI4paIICAgIOKWiOKWiOKWiOKWiOKWiOKWiCAg4paI4paI4paI4paI4paI4paI4paIIOKWiOKWiCAgICAgICAgIOKWiOKWiCAgICDilojilojilojilojilojilojilohcclxu4paI4paIICAg4paI4paIIOKWiOKWiCAgIOKWiOKWiCAgICAgIOKWiOKWiCAgICDilojiloggICAg4paI4paIICAg4paI4paIIOKWiOKWiCAgIOKWiOKWiCDilojiloggICAgICAgICDilojiloggICAgICAgICDilojilohcclxu4paI4paIICAg4paI4paIIOKWiOKWiOKWiOKWiOKWiOKWiCAg4paI4paI4paI4paI4paI4paI4paIICAgIOKWiOKWiCAgICDilojiloggICDilojilogg4paI4paIICAg4paI4paIICDilojilojilojilojilojiloggICAg4paI4paIICAgIOKWiOKWiOKWiOKWiOKWiOKWiOKWiFxyXG4qL1xyXG5cclxuLyoqXHJcbiAqIEludGVuZGVkIGZvciBvdmVyd3JpdGUuXHJcbiAqL1xyXG5EZXNpZ25FeHBsb3Jlci5wcm90b3R5cGUuYWJzdHJhY3RfcGFyY29vcmRzX3Bvc3RSZW5kZXIgPSBmdW5jdGlvbiAoKSB7fTtcclxuIiwiRGVzaWduRXhwbG9yZXIucHJvdG90eXBlLnBhcmNvb3Jkc19nZXRDdXJEaW1zID0gZnVuY3Rpb24gKCkge1xyXG5cclxuXHR2YXIgZGVzaWduRXhwbG9yZXIgPSB0aGlzO1xyXG5cclxuXHR2YXIgZGltZW5zaW9ucyA9IGRlc2lnbkV4cGxvcmVyLnBhcmFtc0FsbC5yZWR1Y2UoZnVuY3Rpb24gKHByZXYsIGN1cikge1xyXG5cdFx0aWYgKGN1ci5zaG93bkluUGFyY29vcmRzKSB7XHJcblx0XHRcdHByZXZbY3VyW0Rlc2lnbkV4cGxvcmVyLmRhdGFLZXldXSA9IHt9O1xyXG5cdFx0fVxyXG5cdFx0cmV0dXJuIHByZXY7XHJcblx0fSwge30pO1xyXG5cclxuXHRyZXR1cm4gZGltZW5zaW9ucztcclxuXHJcbn07XHJcbiIsIkRlc2lnbkV4cGxvcmVyLnByb3RvdHlwZS5wYXJjb29yZHNfcmVkcmF3ID0gZnVuY3Rpb24gKCkge1xyXG5cclxuXHR2YXIgZGVzaWduRXhwbG9yZXIgPSB0aGlzO1xyXG5cclxuXHRpZiAoIWRlc2lnbkV4cGxvcmVyLmdyYXBocy5wYXJjb29yZHMpIHJldHVybjtcclxuXHJcblx0ZGVzaWduRXhwbG9yZXIuZ3JhcGhzLnBhcmNvb3Jkcy5kaW1lbnNpb25zKGRlc2lnbkV4cGxvcmVyLnBhcmNvb3Jkc19nZXRDdXJEaW1zKCkpO1xyXG5cclxufTtcclxuIiwiLyoqXHJcbiAqIFRlbGwgdXMgd2hpY2ggcGFyYW0gdG8gY29sb3IgYnlcclxuICogQHBhcmFtIHtvYmplY3R9IHBhcmFtIC0gUGFyYW1ldGVyXHJcbiAqL1xyXG5EZXNpZ25FeHBsb3Jlci5wcm90b3R5cGUuc2V0Q29sb3JlciA9IGZ1bmN0aW9uIChwYXJhbSkge1xyXG5cclxuXHR2YXIgZGVzaWduRXhwbG9yZXIgPSB0aGlzO1xyXG5cclxuXHRkZXNpZ25FeHBsb3Jlci5zZWxlY3RlZFBhcmFtID0gcGFyYW07XHJcblxyXG5cdHZhciBkYXRhID0gZGVzaWduRXhwbG9yZXIuZ2V0RGF0YSgpO1xyXG5cclxuXHR2YXIgZXh0ZW50cyA9IGQzLmV4dGVudChkYXRhLCBkYXRhQWNjZXNzb3IpO1xyXG5cclxuXHR2YXIgY29sb3JTY2FsZSA9IGQzLnNjYWxlLmxpbmVhcigpXHJcblx0XHQuZG9tYWluKGV4dGVudHMpXHJcblx0XHQucmFuZ2UoW1wiIzNiMzFiMFwiLCBcIiM2NkNDRERcIl0pO1xyXG5cclxuXHRkZXNpZ25FeHBsb3Jlci5jb2xvcmVyID0gZnVuY3Rpb24gKGQpIHtcclxuXHRcdHJldHVybiBjb2xvclNjYWxlKGRhdGFBY2Nlc3NvcihkKSk7XHJcblx0fTtcclxuXHJcblx0aWYoZGVzaWduRXhwbG9yZXIuZ3JhcGhzLnBhcmNvb3Jkcykge1xyXG5cdFx0ZGVzaWduRXhwbG9yZXIuZ3JhcGhzLnBhcmNvb3Jkcy5jb2xvcihkZXNpZ25FeHBsb3Jlci5jb2xvcmVyKS5yZW5kZXIoKTtcclxuXHR9XHJcblxyXG5cdGZ1bmN0aW9uIGRhdGFBY2Nlc3NvcihkKSB7XHJcblx0XHRyZXR1cm4gZFtwYXJhbVtEZXNpZ25FeHBsb3Jlci5kYXRhS2V5XV07XHJcblx0fVxyXG5cclxufTtcclxuIiwiRGVzaWduRXhwbG9yZXIudHlwZURpc3BsYXlEaWN0aW9uYXJ5PXtcclxuICAnaW4nOntcclxuICAgICdzaWduaWZpZXInOiAnaW46JyxcclxuICAgICdrZXknOiAnaW4nLFxyXG4gICAgJ2Rpc3BsYXknOidJbnB1dCcsXHJcbiAgfSxcclxuICAnb3V0Jzp7XHJcbiAgICAnc2lnbmlmaWVyJzogJ291dDonLFxyXG4gICAgJ2tleSc6ICdvdXQnLFxyXG4gICAgJ2Rpc3BsYXknOidPdXRwdXQnXHJcbiAgfSxcclxuICAnY3VzdG9tJzp7XHJcbiAgICAnc2lnbmlmaWVyJzogJ2N1c3RvbTonLFxyXG4gICAgJ2tleSc6ICdjdXN0b20nLFxyXG4gICAgJ2Rpc3BsYXknOidDdXN0b20gT3V0cHV0J1xyXG4gIH0sXHJcbn07XHJcbiJdfQ==
