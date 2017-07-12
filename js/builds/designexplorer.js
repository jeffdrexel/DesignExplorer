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
	options.maxThumbCols = options.maxThumbCols || 12;
	options.showThumbValueLabels = options.showThumbValueLabels || false;

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

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImhlYWRlci5qcyIsImNvbnN0cnVjdG9ycy9QYXJhbS5qcyIsImNvbnN0cnVjdG9ycy9QYXJhbUN1c3RvbS5qcyIsInN0YXRpY3MvdHlwZURpc3BsYXlEaWN0aW9uYXJ5LmpzIiwicGFydGlhbHMvYWRkQ3VzdG9tUGFyYW0uanMiLCJwYXJ0aWFscy9nZXRJdGVyYXRpb25UYWJsZS5qcyIsInBhcnRpYWxzL2dldFBhcmFtRnJvbURhdGFrZXkuanMiLCJwYXJ0aWFscy9wYXJjb29yZHNfY3JlYXRlLmpzIiwicGFydGlhbHMvcGFyY29vcmRzX2dldEN1ckRpbXMuanMiLCJwYXJ0aWFscy9wYXJjb29yZHNfcmVkcmF3LmpzIiwicGFydGlhbHMvc2V0Q29sb3Jlci5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDekhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ2pCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ2xCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNqQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ2JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDcENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNQQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDOUlBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ2RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDVEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJkZXNpZ25leHBsb3Jlci5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxyXG4gKiBAY29uc3RydWN0b3JcclxuICovXHJcbnZhciBEZXNpZ25FeHBsb3JlciA9IGZ1bmN0aW9uIChvcmlnaW5hbERhdGEsIGluY29taW5nT3B0aW9ucykge1xyXG5cclxuXHQvKipcclxuXHQgKiBAbGVuZHMgRGVzaWduRXhwbG9yZXIucHJvdG90eXBlXHJcblx0ICovXHJcblx0dmFyIGRlc2lnbkV4cGxvcmVyID0gdGhpcztcclxuXHJcblx0dmFyIGRhdGEgPSBbXTtcclxuXHJcblx0dmFyIG9wdGlvbnMgPSBpbmNvbWluZ09wdGlvbnMgfHwge1xyXG5cdFx0J3VzZVRodW1iVXJscyc6IHRydWVcclxuXHR9O1xyXG5cclxuXHRvcHRpb25zLmhpZGRlbktleXMgPSBvcHRpb25zLmhpZGRlbktleXMgfHwgW107XHJcblx0b3B0aW9ucy5yZXN1bHRJY29uTGltaXQgPSBvcHRpb25zLnJlc3VsdEljb25MaW1pdCB8fCBJbmZpbml0eTtcclxuXHRvcHRpb25zLnRodW1iS2V5cyA9IG9wdGlvbnMudGh1bWJLZXlzIHx8IFtdO1xyXG5cdG9wdGlvbnMudGh1bWJQYXJhbXMgPSBbXTtcclxuXHRvcHRpb25zLm1heFRodW1iQ29scyA9IG9wdGlvbnMubWF4VGh1bWJDb2xzIHx8IDEyO1xyXG5cdG9wdGlvbnMuc2hvd1RodW1iVmFsdWVMYWJlbHMgPSBvcHRpb25zLnNob3dUaHVtYlZhbHVlTGFiZWxzIHx8IGZhbHNlO1xyXG5cclxuXHRkZXNpZ25FeHBsb3Jlci5vcHRpb25zID0gb3B0aW9ucztcclxuXHJcblx0Ly8gRGljdGlvbmFyaWVkIHBhcmFtc1xyXG5cdGRlc2lnbkV4cGxvcmVyLnBhcmFtcyA9IHtcclxuXHRcdCdjdXN0b20nOiBbXVxyXG5cdH07XHJcblxyXG5cdC8vIEFsbCBwYXJhbXNcclxuXHRkZXNpZ25FeHBsb3Jlci5wYXJhbXNBbGwgPSBbXTtcclxuXHJcblx0Ly8gU2V0IGxhdGVyIGJ5IHNldENvbG9yZXJcclxuXHRkZXNpZ25FeHBsb3Jlci5zZWxlY3RlZFBhcmFtID0gbnVsbDtcclxuXHJcblx0Ly8gQWxsIGdyYXBocyBuYW1lc3BhY2VcclxuXHRkZXNpZ25FeHBsb3Jlci5ncmFwaHMgPSB7fTtcclxuXHJcblx0c29ydEtleXMoKTtcclxuXHRjbGVhbkRhdGEoKTtcclxuXHJcblx0Ly8gQWNjZXNzIHRoaXMgZGF0YSBsYXRlclxyXG5cdERlc2lnbkV4cGxvcmVyLnByb3RvdHlwZS5nZXREYXRhID0gZnVuY3Rpb24gKCkge1xyXG5cdFx0cmV0dXJuIGRhdGE7XHJcblx0fTtcclxuXHJcblx0Ly8gU2V0IGRlZmF1bHQgc29ydCBieSBrZXlcclxuXHRkZXNpZ25FeHBsb3Jlci5zZXRDb2xvcmVyKG9wdGlvbnMuZGVmYXVsdFNvcnRQYXJhbSB8fCBkZXNpZ25FeHBsb3Jlci5wYXJhbXMuaW5bMF0pO1xyXG5cclxuXHQvKlxyXG5cdCDilojilojilojilojiloggIOKWiOKWiOKWiCAgICDilojiloggIOKWiOKWiOKWiOKWiOKWiOKWiCAg4paI4paI4paIICAgIOKWiOKWiFxyXG5cdOKWiOKWiCAgIOKWiOKWiCDilojilojilojiloggICDilojilogg4paI4paIICAgIOKWiOKWiCDilojilojilojiloggICDilojilohcclxuXHTilojilojilojilojilojilojilogg4paI4paIIOKWiOKWiCAg4paI4paIIOKWiOKWiCAgICDilojilogg4paI4paIIOKWiOKWiCAg4paI4paIXHJcblx04paI4paIICAg4paI4paIIOKWiOKWiCAg4paI4paIIOKWiOKWiCDilojiloggICAg4paI4paIIOKWiOKWiCAg4paI4paIIOKWiOKWiFxyXG5cdOKWiOKWiCAgIOKWiOKWiCDilojiloggICDilojilojilojiloggIOKWiOKWiOKWiOKWiOKWiOKWiCAg4paI4paIICAg4paI4paI4paI4paIXHJcblx0Ki9cclxuXHJcblx0ZnVuY3Rpb24gc29ydEtleXMoKSB7XHJcblx0XHQvLyBJbml0aWFsIENsZWFudXBcclxuXHRcdHZhciBrZXlzID0gZDMua2V5cyhvcmlnaW5hbERhdGFbMF0pO1xyXG5cclxuXHRcdC8vIFBvcHVsYXRlIHdoaWNoIGFyZSBpbnB1dCBhbmQgb3V0cHV0IGtleXNcclxuXHRcdGtleXMuZm9yRWFjaChmdW5jdGlvbiAoa2V5KSB7XHJcblx0XHRcdE9iamVjdC5rZXlzKERlc2lnbkV4cGxvcmVyLnR5cGVEaXNwbGF5RGljdGlvbmFyeSlcclxuXHRcdFx0XHQuZm9yRWFjaChmdW5jdGlvbiAoa2V5VHlwZSkge1xyXG5cdFx0XHRcdFx0dmFyIHR5cGUgPSBEZXNpZ25FeHBsb3Jlci50eXBlRGlzcGxheURpY3Rpb25hcnlba2V5VHlwZV07XHJcblx0XHRcdFx0XHR2YXIgc2lnbmlmaWVyID0gdHlwZS5zaWduaWZpZXI7XHJcblx0XHRcdFx0XHR2YXIga2V5T2JqO1xyXG5cdFx0XHRcdFx0aWYgKGtleS5zdGFydHNXaXRoKHNpZ25pZmllcikpIHtcclxuXHRcdFx0XHRcdFx0a2V5T2JqID0gbmV3IERlc2lnbkV4cGxvcmVyLlBhcmFtKGtleSwgdHlwZSk7XHJcblx0XHRcdFx0XHRcdGlmIChvcHRpb25zLmhpZGRlbktleXMuaW5kZXhPZihrZXkpICE9PSAtMSkga2V5T2JqLnNob3duSW5QYXJjb29yZHMgPSBmYWxzZTtcclxuXHRcdFx0XHRcdFx0ZGVzaWduRXhwbG9yZXIucGFyYW1zQWxsLnB1c2goa2V5T2JqKTtcclxuXHRcdFx0XHRcdFx0ZGVzaWduRXhwbG9yZXIucGFyYW1zW2tleVR5cGVdID0gZGVzaWduRXhwbG9yZXIucGFyYW1zW2tleVR5cGVdIHx8IFtdO1xyXG5cdFx0XHRcdFx0XHRkZXNpZ25FeHBsb3Jlci5wYXJhbXNba2V5VHlwZV0ucHVzaChrZXlPYmopO1xyXG5cclxuXHRcdFx0XHRcdFx0Ly8gQWRkIHRvIHRodW1ibmFpbCBwYXJhbXMgdG8gc2hvdyB2aWEgb3B0aW9uc1xyXG5cdFx0XHRcdFx0XHRpZiAob3B0aW9ucy50aHVtYktleXMuaW5kZXhPZihrZXkpICE9PSAtMSkge1xyXG5cdFx0XHRcdFx0XHRcdG9wdGlvbnMudGh1bWJQYXJhbXMucHVzaChrZXlPYmopO1xyXG5cdFx0XHRcdFx0XHR9XHJcblxyXG5cdFx0XHRcdFx0XHQvLyBTZXQgZGVmYXVsdCBzb3J0IGtleSBmcm9tIG9wdGlvbnMgaWYgZXhpc3RpbmdcclxuXHRcdFx0XHRcdFx0aWYgKG9wdGlvbnMuZGVmYXVsdFNvcnRLZXkgJiYga2V5ID09PSBvcHRpb25zLmRlZmF1bHRTb3J0S2V5KSB7XHJcblx0XHRcdFx0XHRcdFx0b3B0aW9ucy5kZWZhdWx0U29ydFBhcmFtID0ga2V5T2JqO1xyXG5cdFx0XHRcdFx0XHR9XHJcblxyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdH0pO1xyXG5cdFx0fSk7XHJcblx0fVxyXG5cclxuXHRmdW5jdGlvbiBjbGVhbkRhdGEoKSB7XHJcblx0XHQvLyBjbGVhbiBkYXRhXHJcblx0XHRvcmlnaW5hbERhdGEuZm9yRWFjaChmdW5jdGlvbiAoZGF0dW0sIGkpIHtcclxuXHRcdFx0dmFyIGNsZWFuZWREYXR1bSA9IHtcclxuXHRcdFx0XHRfaWQ6IGlcclxuXHRcdFx0fTtcclxuXHJcblx0XHRcdE9iamVjdC5rZXlzKGRhdHVtKVxyXG5cdFx0XHRcdC5mb3JFYWNoKGZ1bmN0aW9uIChrZXkpIHtcclxuXHRcdFx0XHRcdHZhciBrZXlPYmogPSBkZXNpZ25FeHBsb3Jlci5wYXJhbXNBbGwucmVkdWNlKGZ1bmN0aW9uIChwcmV2LCBjdXIpIHtcclxuXHRcdFx0XHRcdFx0cmV0dXJuIGN1ci5vcmlnaW5hbCA9PT0ga2V5ID8gY3VyIDogcHJldjtcclxuXHRcdFx0XHRcdH0sIG51bGwpO1xyXG5cdFx0XHRcdFx0dmFyIGZsb2F0VmVyc2lvbiA9IHBhcnNlRmxvYXQoZGF0dW1ba2V5XSk7XHJcblx0XHRcdFx0XHR2YXIgY2xlYW5LZXkgPSBrZXlPYmogPyBrZXlPYmpbRGVzaWduRXhwbG9yZXIuZGF0YUtleV0gOiBrZXk7XHJcblx0XHRcdFx0XHRjbGVhbmVkRGF0dW1bY2xlYW5LZXldID0gaXNOYU4oZmxvYXRWZXJzaW9uKSA/IGRhdHVtW2tleV0gOiBmbG9hdFZlcnNpb247XHJcblx0XHRcdFx0fSk7XHJcblxyXG5cdFx0XHRpZiAoY2xlYW5lZERhdHVtLmltZykge1xyXG5cdFx0XHRcdGNsZWFuZWREYXR1bS5pbWdUaHVtYiA9IG9wdGlvbnMudXNlVGh1bWJVcmxzID8gY2xlYW5lZERhdHVtLmltZy5yZXBsYWNlKC8uKHBuZ3xnaWZ8anBlP2cpJC9pLCAnX3RodW1iLiQxJykgOiBjbGVhbmVkRGF0dW0uaW1nO1xyXG5cdFx0XHRcdGNsZWFuZWREYXR1bS5pbWdOYW1lID0gY2xlYW5lZERhdHVtLmltZy5zcGxpdCgnLycpXHJcblx0XHRcdFx0XHQucG9wKCk7XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdGRhdGEucHVzaChjbGVhbmVkRGF0dW0pO1xyXG5cdFx0fSk7XHJcblx0fVxyXG5cclxufTtcclxuXHJcbkRlc2lnbkV4cGxvcmVyLmRhdGFLZXkgPSAnY2xlYW5LZXknO1xyXG4iLCJEZXNpZ25FeHBsb3Jlci5QYXJhbSA9IGZ1bmN0aW9uIChrZXksIHR5cGUpIHtcclxuXHR2YXIgcGFyYW0gPSB0aGlzO1xyXG5cclxuXHRwYXJhbS5vcmlnaW5hbCA9IGtleTtcclxuXHJcblx0cGFyYW0uZGlzcGxheSA9IGtleS5zdWJzdHJpbmcodHlwZS5zaWduaWZpZXIubGVuZ3RoLCBrZXkubGVuZ3RoKTtcclxuXHJcblx0cGFyYW0udHlwZSA9IHR5cGU7XHJcblxyXG5cdHBhcmFtLmNsZWFuS2V5ID0ga2V5LnJlcGxhY2UoL1tcXFddL2csICdfJyk7XHJcblxyXG5cdHBhcmFtLnNob3duSW5QYXJjb29yZHMgPSB0cnVlO1xyXG5cclxuXHRwYXJhbS5jdXJFeHRlbnRzID0gW107XHJcblxyXG5cdHJldHVybiB0aGlzO1xyXG59O1xyXG4iLCIoZnVuY3Rpb24gKCkge1xyXG5cclxuXHR2YXIgY3VzdG9tUGFyYW1Db3VudCA9IDA7XHJcblxyXG5cdERlc2lnbkV4cGxvcmVyLlBhcmFtQ3VzdG9tID0gZnVuY3Rpb24gKCkge1xyXG5cclxuXHRcdGN1c3RvbVBhcmFtQ291bnQgKz0gMTtcclxuXHJcblx0XHREZXNpZ25FeHBsb3Jlci5QYXJhbS5hcHBseSh0aGlzLCBbJ2N1c3RvbTonICsgY3VzdG9tUGFyYW1Db3VudCwgRGVzaWduRXhwbG9yZXIudHlwZURpc3BsYXlEaWN0aW9uYXJ5LmN1c3RvbV0pO1xyXG5cclxuXHRcdHZhciBjdXN0b21QYXJhbSA9IHRoaXM7XHJcblxyXG5cdH07XHJcblxyXG5cdERlc2lnbkV4cGxvcmVyLlBhcmFtQ3VzdG9tLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoRGVzaWduRXhwbG9yZXIuUGFyYW0ucHJvdG90eXBlKTtcclxuXHJcblxyXG59KSgpO1xyXG4iLCJEZXNpZ25FeHBsb3Jlci50eXBlRGlzcGxheURpY3Rpb25hcnk9e1xyXG4gICdpbic6e1xyXG4gICAgJ3NpZ25pZmllcic6ICdpbjonLFxyXG4gICAgJ2tleSc6ICdpbicsXHJcbiAgICAnZGlzcGxheSc6J0lucHV0JyxcclxuICB9LFxyXG4gICdvdXQnOntcclxuICAgICdzaWduaWZpZXInOiAnb3V0OicsXHJcbiAgICAna2V5JzogJ291dCcsXHJcbiAgICAnZGlzcGxheSc6J091dHB1dCdcclxuICB9LFxyXG4gICdjdXN0b20nOntcclxuICAgICdzaWduaWZpZXInOiAnY3VzdG9tOicsXHJcbiAgICAna2V5JzogJ2N1c3RvbScsXHJcbiAgICAnZGlzcGxheSc6J0N1c3RvbSBPdXRwdXQnXHJcbiAgfSxcclxufTtcclxuIiwiXHJcblxyXG5cdERlc2lnbkV4cGxvcmVyLnByb3RvdHlwZS5hZGRDdXN0b21QYXJhbSA9IGZ1bmN0aW9uICgpIHtcclxuXHRcdHZhciBkZXNpZ25FeHBsb3JlciA9IHRoaXM7XHJcblxyXG5cdFx0Y3JlYXRlZEN1c3RvbUNvdW50ICs9IDE7XHJcblxyXG5cdFx0dmFyIHBhcmFtID0gbmV3IERlc2lnbkV4cGxvcmVyLlBhcmFtQ3VzdG9tKCk7XHJcblxyXG5cdFx0ZGVzaWduRXhwbG9yZXIucGFyYW1zLmN1c3RvbS5wdXNoKHBhcmFtKTtcclxuXHRcdGRlc2lnbkV4cGxvcmVyLnBhcmFtc0FsbC5wdXNoKGN1c3RvbSk7XHJcblxyXG5cdH07XHJcbiIsIkRlc2lnbkV4cGxvcmVyLnByb3RvdHlwZS5wb3B1bGF0ZUl0ZXJhdGlvblRhYmxlID0gZnVuY3Rpb24gKGpxRWxlbWVudCwgaXRlcmF0aW9uKSB7XHJcblx0dmFyIGRlc2lnbkV4cGxvcmVyID0gdGhpcztcclxuXHJcblx0dmFyIHBhcmFtVHlwZXMgPSBPYmplY3Qua2V5cyhkZXNpZ25FeHBsb3Jlci5wYXJhbXMpO1xyXG5cclxuXHRqcUVsZW1lbnQuaHRtbCgnJyk7XHJcblxyXG5cdGlmIChpdGVyYXRpb24ubmFtZSkge1xyXG5cdFx0anFFbGVtZW50LmFwcGVuZCgnPGgzPk5hbWU6ICcgKyBpdGVyYXRpb24ubmFtZSsnPC9oMz4nKTtcclxuXHRcdGpxRWxlbWVudC5hcHBlbmQoJzxiciAvPicpO1xyXG5cdH1cclxuXHJcblx0cGFyYW1UeXBlcy5mb3JFYWNoKGZ1bmN0aW9uIChrZXkpIHtcclxuXHRcdHZhciB0eXBlID0gRGVzaWduRXhwbG9yZXIudHlwZURpc3BsYXlEaWN0aW9uYXJ5W2tleV07XHJcblx0XHR2YXIgdGFibGUgPSAkKCc8dGFibGUgY2xhc3M9XCJ0YWJsZSB0YWJsZS1jb25kZW5zZWRcIj48L3RhYmxlPicpO1xyXG5cdFx0dmFyIHBhcmFtcyA9IGRlc2lnbkV4cGxvcmVyLnBhcmFtc1trZXldO1xyXG5cdFx0cGFyYW1zLmZvckVhY2goZnVuY3Rpb24gKHBhcmFtKSB7XHJcblx0XHRcdC8vIGlmICghcGFyYW0uc2hvd25JblBhcmNvb3JkcykgcmV0dXJuO1xyXG5cdFx0XHR2YXIgcm93ID0gJCgnPHRyPjwvdHI+Jyk7XHJcblx0XHRcdHJvdy5hcHBlbmQoJzx0ZD4nICsgcGFyYW0uZGlzcGxheSArICc8L3RkPicpO1xyXG5cdFx0XHRyb3cuYXBwZW5kKCc8dGQ+JyArIGl0ZXJhdGlvbltwYXJhbVtEZXNpZ25FeHBsb3Jlci5kYXRhS2V5XV0gKyAnPC90ZD4nKTtcclxuXHRcdFx0dGFibGUuYXBwZW5kKHJvdyk7XHJcblxyXG5cdFx0XHRpZiAocGFyYW0gPT09IGRlc2lnbkV4cGxvcmVyLnNlbGVjdGVkUGFyYW0pIHJvdy5jc3MoJ2JvcmRlci1sZWZ0JywgJzVweCBzb2xpZCAnICsgZGVzaWduRXhwbG9yZXIuY29sb3JlcihpdGVyYXRpb24pKVxyXG5cdFx0XHRcdC5jc3MoJ2ZvbnQtd2VpZ2h0JywgJ2JvbGQnKTtcclxuXHRcdH0pO1xyXG5cclxuXHRcdGlmKHBhcmFtcy5sZW5ndGgpe1xyXG5cdFx0XHRqcUVsZW1lbnQuYXBwZW5kKCc8aDQ+JyArIHR5cGUuZGlzcGxheSArICdzPC9oND4nKTtcclxuXHRcdFx0anFFbGVtZW50LmFwcGVuZCh0YWJsZSk7XHJcblx0XHR9XHJcblxyXG5cdH0pO1xyXG5cclxuXHJcbn07XHJcbiIsIkRlc2lnbkV4cGxvcmVyLnByb3RvdHlwZS5nZXRQYXJhbUZyb21EYXRha2V5ID0gZnVuY3Rpb24gKGRhdGFLZXkpIHtcclxuXHR2YXIgZGVzaWduRXhwbG9yZXIgPSB0aGlzO1xyXG5cclxuXHRyZXR1cm4gZGVzaWduRXhwbG9yZXIucGFyYW1zQWxsLnJlZHVjZShmdW5jdGlvbiAocHJldiwgY3VyKSB7XHJcblx0XHRyZXR1cm4gY3VyW0Rlc2lnbkV4cGxvcmVyLmRhdGFLZXldID09PSBkYXRhS2V5ID8gY3VyIDogcHJldjtcclxuXHR9LCBudWxsKTtcclxufTtcclxuIiwiRGVzaWduRXhwbG9yZXIucHJvdG90eXBlLnBhcmNvb3Jkc19jcmVhdGUgPSBmdW5jdGlvbiAoZGl2U2VsZWN0b3IpIHtcclxuXHJcblx0dmFyIGRlc2lnbkV4cGxvcmVyID0gdGhpcztcclxuXHJcblx0ZGVzaWduRXhwbG9yZXIuZ3JhcGhzLl9wYXJjb29yZHNEaXZTZWxlY3RvciA9IGRpdlNlbGVjdG9yO1xyXG5cclxuXHR2YXIgZGl2ID0gJChkaXZTZWxlY3Rvcik7XHJcblxyXG5cdHZhciBjb250ZXh0TWVudSA9ICQoJyNjb250ZXh0LW1lbnUnKTtcclxuXHJcblx0ZGl2Lmh0bWwoJycpO1xyXG5cclxuXHRkaXYuYWRkQ2xhc3MoJ3BhcmNvb3JkcycpO1xyXG5cclxuXHR2YXIgZGltZW5zaW9ucyA9IGRlc2lnbkV4cGxvcmVyLnBhcmNvb3Jkc19nZXRDdXJEaW1zKCk7XHJcblxyXG5cdGRlc2lnbkV4cGxvcmVyLmdyYXBocy5wYXJjb29yZHMgPSBkMy5wYXJjb29yZHMoKShkaXZTZWxlY3RvcilcclxuXHRcdC5kYXRhKGRlc2lnbkV4cGxvcmVyLmdldERhdGEoKSlcclxuXHRcdC5jb2xvcihkZXNpZ25FeHBsb3Jlci5jb2xvcmVyKVxyXG5cdFx0LmFscGhhKDAuMilcclxuXHRcdC5hbHBoYU9uQnJ1c2hlZCgwLjIpXHJcblx0XHQuc2hhZG93cygpXHJcblx0XHQvLyAuYnJ1c2hlZENvbG9yKFwiIzAwMFwiKVxyXG5cdFx0Lm1vZGUoXCJxdWV1ZVwiKVxyXG5cdFx0LnJhdGUoMjApXHJcblx0XHQuZGltZW5zaW9ucyhkaW1lbnNpb25zKVxyXG5cdFx0LnJlbmRlcigpXHJcblx0XHQuYnJ1c2hNb2RlKFwiMUQtYXhlc1wiKSAvLyBlbmFibGUgYnJ1c2hpbmdcclxuXHRcdC5hdXRvc2NhbGUoKVxyXG5cdFx0LmludGVyYWN0aXZlKClcclxuXHRcdC5yZW9yZGVyYWJsZSgpO1xyXG5cclxuXHRwb3N0UmVuZGVyKCk7XHJcblxyXG5cdGRlc2lnbkV4cGxvcmVyLmdyYXBocy5wYXJjb29yZHMub24oJ3JlbmRlcicsIF8uZGVib3VuY2UocG9zdFJlbmRlciwgNDAwKSk7XHJcblx0ZGVzaWduRXhwbG9yZXIuZ3JhcGhzLnBhcmNvb3Jkcy5vbignZGltZW5zaW9ucycsIF8uZGVib3VuY2UocG9zdFJlbmRlciwgNDAwKSk7XHJcblx0ZGVzaWduRXhwbG9yZXIuZ3JhcGhzLnBhcmNvb3Jkcy5vbignYnJ1c2gnLCBfLmRlYm91bmNlKHBvc3RSZW5kZXIsIDQwMCkpO1xyXG5cdC8vIGRlc2lnbkV4cGxvcmVyLmdyYXBocy5wYXJjb29yZHMub24oJ2JydXNoJywgXy5kZWJvdW5jZShwb3N0QnJ1c2gsIDQwMCkpO1xyXG5cclxuXHRmdW5jdGlvbiBwb3N0UmVuZGVyKCkge1xyXG5cclxuXHRcdHZhciBkb21haW5Db2xvcnMgPSBbXTtcclxuXHJcblx0XHR2YXIgY3VyRGF0YSA9IGRlc2lnbkV4cGxvcmVyLmdyYXBocy5wYXJjb29yZHMuYnJ1c2hlZCgpO1xyXG5cclxuXHRcdGQzLnNlbGVjdEFsbChkaXZTZWxlY3RvciArICcgZy5kaW1lbnNpb24nKVxyXG5cdFx0XHQuZWFjaChmdW5jdGlvbiAoZCwgaSkge1xyXG5cdFx0XHRcdHZhciBwYXJhbSA9IGRlc2lnbkV4cGxvcmVyLmdldFBhcmFtRnJvbURhdGFrZXkoZCk7XHJcblx0XHRcdFx0dmFyIHBhcmFtQ29sb3IgPSAocGFyYW0udHlwZS5rZXkgPT09ICdpbicpID8gJyM5OTknIDogJyMwMDAnO1xyXG5cdFx0XHRcdHZhciB0aGlzRDMgPSBkMy5zZWxlY3QodGhpcyk7XHJcblxyXG5cdFx0XHRcdHZhciBjdXJFeHRlbnRzID0gZDMuZXh0ZW50KGN1ckRhdGEsIGZ1bmN0aW9uIChkKSB7XHJcblx0XHRcdFx0XHRyZXR1cm4gZFtwYXJhbVtEZXNpZ25FeHBsb3Jlci5kYXRhS2V5XV07XHJcblx0XHRcdFx0fSk7XHJcblxyXG5cdFx0XHRcdHBhcmFtLmN1ckV4dGVudHNbMF0gPSBjdXJFeHRlbnRzWzBdO1xyXG5cdFx0XHRcdHBhcmFtLmN1ckV4dGVudHNbMV0gPSBjdXJFeHRlbnRzWzFdO1xyXG5cclxuXHRcdFx0XHR0aGlzRDMuc2VsZWN0QWxsKCd0ZXh0LmxhYmVsJylcclxuXHRcdFx0XHRcdC50ZXh0KHBhcmFtLmRpc3BsYXkpXHJcblx0XHRcdFx0XHQuc3R5bGUoJ2ZpbGwnLCBwYXJhbUNvbG9yKTtcclxuXHJcblx0XHRcdFx0dGhpc0QzLnNlbGVjdEFsbCgncGF0aC5kb21haW4nKVxyXG5cdFx0XHRcdFx0LnN0eWxlKCdzdHJva2UnLCBwYXJhbUNvbG9yKTtcclxuXHJcblx0XHRcdFx0dGhpc0QzLnNlbGVjdEFsbCgnIGcudGljayB0ZXh0JylcclxuXHRcdFx0XHRcdC5zdHlsZSgnZm9udC1zaXplJywgJzlweCcpXHJcblx0XHRcdFx0XHQuc3R5bGUoJ2ZpbGwnLCBwYXJhbUNvbG9yKTtcclxuXHJcblx0XHRcdFx0dGhpc0QzLnNlbGVjdEFsbCgnIGcuYnJ1c2ggcmVjdC5leHRlbnQnKVxyXG5cdFx0XHRcdFx0LnN0eWxlKCdmaWxsJywgJ3JnYmEoMjU1LDI1NSwyNTUsMC41KScpXHJcblx0XHRcdFx0XHQub24oJ2NvbnRleHRtZW51JywgZnVuY3Rpb24gKGQsIGkpIHtcclxuXHJcblx0XHRcdFx0XHRcdGlmICghc2hvd0JydXNoTWVudSgpKSByZXR1cm47XHJcblxyXG5cdFx0XHRcdFx0XHR2YXIgbGcgPSAkKCc8dWwgY2xhc3M9XCJsaXN0LWdyb3VwXCI+PC91bD4nKSxcclxuXHRcdFx0XHRcdFx0XHRyZXNldEJydXNoID0gJCgnPGEgY2xhc3M9XCJsaXN0LWdyb3VwLWl0ZW1cIj48Yj5SZXNldCB0aGVzZSBleHRlbnRzPC9iPjwvYT4nKTtcclxuXHJcblx0XHRcdFx0XHRcdHJlc2V0QnJ1c2gub24oJ2NsaWNrJywgZnVuY3Rpb24gKCkge1xyXG5cdFx0XHRcdFx0XHRcdGRlc2lnbkV4cGxvcmVyLmdyYXBocy5wYXJjb29yZHMuYnJ1c2hSZXNldChkKTtcclxuXHRcdFx0XHRcdFx0fSk7XHJcblxyXG5cdFx0XHRcdFx0XHRsZy5hcHBlbmQocmVzZXRCcnVzaCk7XHJcblx0XHRcdFx0XHRcdGNvbnRleHRNZW51LmFwcGVuZChsZyk7XHJcblxyXG5cdFx0XHRcdFx0XHRsZy5vbignY2xpY2snLCBmdW5jdGlvbiAoKSB7XHJcblx0XHRcdFx0XHRcdFx0Y29udGV4dE1lbnUuaGlkZSgpO1xyXG5cdFx0XHRcdFx0XHR9KTtcclxuXHJcblx0XHRcdFx0XHR9KVxyXG5cdFx0XHRcdFx0Lm9uKCdtb3VzZW92ZXInLCBmdW5jdGlvbiAoZCwgaSkge1xyXG5cclxuXHRcdFx0XHRcdFx0aWYgKCFzaG93QnJ1c2hNZW51KCkpIHJldHVybjtcclxuXHJcblx0XHRcdFx0XHRcdHZhciBmaWx0ZXJNZXNzYWdlID0gJzxhIGNsYXNzPVwibGlzdC1ncm91cC1pdGVtXCI+RmlsdGVyZWQgJyArIHBhcmFtLmN1ckV4dGVudHMuam9pbignIHRvICcpICsgJy48L2E+JztcclxuXHJcblx0XHRcdFx0XHRcdGNvbnRleHRNZW51LmFwcGVuZChmaWx0ZXJNZXNzYWdlKTtcclxuXHRcdFx0XHRcdH0pXHJcblx0XHRcdFx0XHQub24oJ21vdXNlb3V0JywgZnVuY3Rpb24gKGQsIGkpIHtcclxuXHJcblx0XHRcdFx0XHRcdGNvbnRleHRNZW51LmhpZGUoKTtcclxuXHJcblx0XHRcdFx0XHR9KTtcclxuXHRcdFx0fSk7XHJcblxyXG5cdFx0ZnVuY3Rpb24gc2hvd0JydXNoTWVudSgpIHtcclxuXHRcdFx0dmFyIGpUaGlzID0gJCh0aGlzKTtcclxuXHJcblx0XHRcdGlmIChOdW1iZXIoalRoaXMuYXR0cignaGVpZ2h0JykpID09PSAwKSByZXR1cm47XHJcblxyXG5cdFx0XHRkMy5ldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xyXG5cclxuXHRcdFx0Y29udGV4dE1lbnUuaHRtbCgnJyk7XHJcblx0XHRcdGNvbnRleHRNZW51LmNzcygnbGVmdCcsIGQzLmV2ZW50LmNsaWVudFgpO1xyXG5cdFx0XHRjb250ZXh0TWVudS5jc3MoJ3RvcCcsIGQzLmV2ZW50LmNsaWVudFkpO1xyXG5cdFx0XHRjb250ZXh0TWVudS5zaG93KCk7XHJcblxyXG5cdFx0XHRyZXR1cm4galRoaXM7XHJcblx0XHR9XHJcblxyXG5cdFx0ZGVzaWduRXhwbG9yZXIuYWJzdHJhY3RfcGFyY29vcmRzX3Bvc3RSZW5kZXIoKTtcclxuXHR9XHJcblxyXG5cdC8vIHJlc2l6ZSBvciByZS1yZW5kZXIgYnJlYWtzIHRoZSBicnVzaCBtb2RlXHJcblx0Ly8gJCh3aW5kb3cpXHJcblx0Ly8gXHQub24oJ3Jlc2l6ZScsIGZ1bmN0aW9uICgpIHtcclxuXHQvLyBcdFx0ZGVzaWduRXhwbG9yZXIuZ3JhcGhzLnBhcmNvb3Jkcy53aWR0aChkaXYud2lkdGgoKSk7XHJcblx0Ly8gXHR9KTtcclxufTtcclxuXHJcbi8qXHJcbiDilojilojilojilojiloggIOKWiOKWiOKWiOKWiOKWiOKWiCAg4paI4paI4paI4paI4paI4paI4paIIOKWiOKWiOKWiOKWiOKWiOKWiOKWiOKWiCDilojilojilojilojilojiloggICDilojilojilojilojiloggICDilojilojilojilojilojilogg4paI4paI4paI4paI4paI4paI4paI4paIIOKWiOKWiOKWiOKWiOKWiOKWiOKWiFxyXG7ilojiloggICDilojilogg4paI4paIICAg4paI4paIIOKWiOKWiCAgICAgICAgIOKWiOKWiCAgICDilojiloggICDilojilogg4paI4paIICAg4paI4paIIOKWiOKWiCAgICAgICAgIOKWiOKWiCAgICDilojilohcclxu4paI4paI4paI4paI4paI4paI4paIIOKWiOKWiOKWiOKWiOKWiOKWiCAg4paI4paI4paI4paI4paI4paI4paIICAgIOKWiOKWiCAgICDilojilojilojilojilojiloggIOKWiOKWiOKWiOKWiOKWiOKWiOKWiCDilojiloggICAgICAgICDilojiloggICAg4paI4paI4paI4paI4paI4paI4paIXHJcbuKWiOKWiCAgIOKWiOKWiCDilojiloggICDilojiloggICAgICDilojiloggICAg4paI4paIICAgIOKWiOKWiCAgIOKWiOKWiCDilojiloggICDilojilogg4paI4paIICAgICAgICAg4paI4paIICAgICAgICAg4paI4paIXHJcbuKWiOKWiCAgIOKWiOKWiCDilojilojilojilojilojiloggIOKWiOKWiOKWiOKWiOKWiOKWiOKWiCAgICDilojiloggICAg4paI4paIICAg4paI4paIIOKWiOKWiCAgIOKWiOKWiCAg4paI4paI4paI4paI4paI4paIICAgIOKWiOKWiCAgICDilojilojilojilojilojilojilohcclxuKi9cclxuXHJcbi8qKlxyXG4gKiBJbnRlbmRlZCBmb3Igb3ZlcndyaXRlLlxyXG4gKi9cclxuRGVzaWduRXhwbG9yZXIucHJvdG90eXBlLmFic3RyYWN0X3BhcmNvb3Jkc19wb3N0UmVuZGVyID0gZnVuY3Rpb24gKCkge307XHJcbiIsIkRlc2lnbkV4cGxvcmVyLnByb3RvdHlwZS5wYXJjb29yZHNfZ2V0Q3VyRGltcyA9IGZ1bmN0aW9uICgpIHtcclxuXHJcblx0dmFyIGRlc2lnbkV4cGxvcmVyID0gdGhpcztcclxuXHJcblx0dmFyIGRpbWVuc2lvbnMgPSBkZXNpZ25FeHBsb3Jlci5wYXJhbXNBbGwucmVkdWNlKGZ1bmN0aW9uIChwcmV2LCBjdXIpIHtcclxuXHRcdGlmIChjdXIuc2hvd25JblBhcmNvb3Jkcykge1xyXG5cdFx0XHRwcmV2W2N1cltEZXNpZ25FeHBsb3Jlci5kYXRhS2V5XV0gPSB7fTtcclxuXHRcdH1cclxuXHRcdHJldHVybiBwcmV2O1xyXG5cdH0sIHt9KTtcclxuXHJcblx0cmV0dXJuIGRpbWVuc2lvbnM7XHJcblxyXG59O1xyXG4iLCJEZXNpZ25FeHBsb3Jlci5wcm90b3R5cGUucGFyY29vcmRzX3JlZHJhdyA9IGZ1bmN0aW9uICgpIHtcclxuXHJcblx0dmFyIGRlc2lnbkV4cGxvcmVyID0gdGhpcztcclxuXHJcblx0aWYgKCFkZXNpZ25FeHBsb3Jlci5ncmFwaHMucGFyY29vcmRzKSByZXR1cm47XHJcblxyXG5cdGRlc2lnbkV4cGxvcmVyLmdyYXBocy5wYXJjb29yZHMuZGltZW5zaW9ucyhkZXNpZ25FeHBsb3Jlci5wYXJjb29yZHNfZ2V0Q3VyRGltcygpKTtcclxuXHJcbn07XHJcbiIsIi8qKlxyXG4gKiBUZWxsIHVzIHdoaWNoIHBhcmFtIHRvIGNvbG9yIGJ5XHJcbiAqIEBwYXJhbSB7b2JqZWN0fSBwYXJhbSAtIFBhcmFtZXRlclxyXG4gKi9cclxuRGVzaWduRXhwbG9yZXIucHJvdG90eXBlLnNldENvbG9yZXIgPSBmdW5jdGlvbiAocGFyYW0pIHtcclxuXHJcblx0dmFyIGRlc2lnbkV4cGxvcmVyID0gdGhpcztcclxuXHJcblx0ZGVzaWduRXhwbG9yZXIuc2VsZWN0ZWRQYXJhbSA9IHBhcmFtO1xyXG5cclxuXHR2YXIgZGF0YSA9IGRlc2lnbkV4cGxvcmVyLmdldERhdGEoKTtcclxuXHJcblx0dmFyIGV4dGVudHMgPSBkMy5leHRlbnQoZGF0YSwgZGF0YUFjY2Vzc29yKTtcclxuXHJcblx0dmFyIGNvbG9yU2NhbGUgPSBkMy5zY2FsZS5saW5lYXIoKVxyXG5cdFx0LmRvbWFpbihleHRlbnRzKVxyXG5cdFx0LnJhbmdlKFtcIiMzYjMxYjBcIiwgXCIjNjZDQ0REXCJdKTtcclxuXHJcblx0ZGVzaWduRXhwbG9yZXIuY29sb3JlciA9IGZ1bmN0aW9uIChkKSB7XHJcblx0XHRyZXR1cm4gY29sb3JTY2FsZShkYXRhQWNjZXNzb3IoZCkpO1xyXG5cdH07XHJcblxyXG5cdGlmKGRlc2lnbkV4cGxvcmVyLmdyYXBocy5wYXJjb29yZHMpIHtcclxuXHRcdGRlc2lnbkV4cGxvcmVyLmdyYXBocy5wYXJjb29yZHMuY29sb3IoZGVzaWduRXhwbG9yZXIuY29sb3JlcikucmVuZGVyKCk7XHJcblx0fVxyXG5cclxuXHRmdW5jdGlvbiBkYXRhQWNjZXNzb3IoZCkge1xyXG5cdFx0cmV0dXJuIGRbcGFyYW1bRGVzaWduRXhwbG9yZXIuZGF0YUtleV1dO1xyXG5cdH1cclxuXHJcbn07XHJcbiJdfQ==
