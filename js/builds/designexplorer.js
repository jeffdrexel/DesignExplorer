/**
 * @constructor
 */
var DesignExplorer = function (originalData, options) {

	/**
	 * @lends DesignExplorer.prototype
	 */
	var designExplorer = this;

	var data = [];

	var options = options || {
		'hiddenKeys': []
	};

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
						if (options.hiddenKeys.indexOf(key) !== -1) keyObj.shownInParcoords = false;
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

			if (cleanedDatum.img) {
				cleanedDatum.imgThumb = cleanedDatum.img.replace(/.(png|gif|jpe?g)$/i, '_thumb.$1');
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

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImhlYWRlci5qcyIsImNvbnN0cnVjdG9ycy9QYXJhbS5qcyIsImNvbnN0cnVjdG9ycy9QYXJhbUN1c3RvbS5qcyIsInN0YXRpY3MvdHlwZURpc3BsYXlEaWN0aW9uYXJ5LmpzIiwicGFydGlhbHMvYWRkQ3VzdG9tUGFyYW0uanMiLCJwYXJ0aWFscy9nZXRJdGVyYXRpb25UYWJsZS5qcyIsInBhcnRpYWxzL2dldFBhcmFtRnJvbURhdGFrZXkuanMiLCJwYXJ0aWFscy9wYXJjb29yZHNfY3JlYXRlLmpzIiwicGFydGlhbHMvcGFyY29vcmRzX2dldEN1ckRpbXMuanMiLCJwYXJ0aWFscy9wYXJjb29yZHNfcmVkcmF3LmpzIiwicGFydGlhbHMvc2V0Q29sb3Jlci5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ25HQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNqQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNsQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDakJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNiQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQzNCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDUEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDNUlBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ2RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDVEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJkZXNpZ25leHBsb3Jlci5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxyXG4gKiBAY29uc3RydWN0b3JcclxuICovXHJcbnZhciBEZXNpZ25FeHBsb3JlciA9IGZ1bmN0aW9uIChvcmlnaW5hbERhdGEsIG9wdGlvbnMpIHtcclxuXHJcblx0LyoqXHJcblx0ICogQGxlbmRzIERlc2lnbkV4cGxvcmVyLnByb3RvdHlwZVxyXG5cdCAqL1xyXG5cdHZhciBkZXNpZ25FeHBsb3JlciA9IHRoaXM7XHJcblxyXG5cdHZhciBkYXRhID0gW107XHJcblxyXG5cdHZhciBvcHRpb25zID0gb3B0aW9ucyB8fCB7XHJcblx0XHQnaGlkZGVuS2V5cyc6IFtdXHJcblx0fTtcclxuXHJcblx0Ly8gRGljdGlvbmFyaWVkIHBhcmFtc1xyXG5cdGRlc2lnbkV4cGxvcmVyLnBhcmFtcyA9IHtcclxuXHRcdCdjdXN0b20nOiBbXVxyXG5cdH07XHJcblxyXG5cdC8vIEFsbCBwYXJhbXNcclxuXHRkZXNpZ25FeHBsb3Jlci5wYXJhbXNBbGwgPSBbXTtcclxuXHJcblx0Ly8gU2V0IGxhdGVyIGJ5IHNldENvbG9yZXJcclxuXHRkZXNpZ25FeHBsb3Jlci5zZWxlY3RlZFBhcmFtID0gbnVsbDtcclxuXHJcblx0Ly8gQWxsIGdyYXBocyBuYW1lc3BhY2VcclxuXHRkZXNpZ25FeHBsb3Jlci5ncmFwaHMgPSB7fTtcclxuXHJcblx0c29ydEtleXMoKTtcclxuXHRjbGVhbkRhdGEoKTtcclxuXHJcblx0Ly8gQWNjZXNzIHRoaXMgZGF0YSBsYXRlclxyXG5cdERlc2lnbkV4cGxvcmVyLnByb3RvdHlwZS5nZXREYXRhID0gZnVuY3Rpb24gKCkge1xyXG5cdFx0cmV0dXJuIGRhdGE7XHJcblx0fTtcclxuXHJcblx0Ly8gU2V0IGRlZmF1bHQgc29ydCBieSBrZXlcclxuXHRkZXNpZ25FeHBsb3Jlci5zZXRDb2xvcmVyKGRlc2lnbkV4cGxvcmVyLnBhcmFtcy5pblswXSk7XHJcblxyXG5cdC8qXHJcblx0IOKWiOKWiOKWiOKWiOKWiCAg4paI4paI4paIICAgIOKWiOKWiCAg4paI4paI4paI4paI4paI4paIICDilojilojiloggICAg4paI4paIXHJcblx04paI4paIICAg4paI4paIIOKWiOKWiOKWiOKWiCAgIOKWiOKWiCDilojiloggICAg4paI4paIIOKWiOKWiOKWiOKWiCAgIOKWiOKWiFxyXG5cdOKWiOKWiOKWiOKWiOKWiOKWiOKWiCDilojilogg4paI4paIICDilojilogg4paI4paIICAgIOKWiOKWiCDilojilogg4paI4paIICDilojilohcclxuXHTilojiloggICDilojilogg4paI4paIICDilojilogg4paI4paIIOKWiOKWiCAgICDilojilogg4paI4paIICDilojilogg4paI4paIXHJcblx04paI4paIICAg4paI4paIIOKWiOKWiCAgIOKWiOKWiOKWiOKWiCAg4paI4paI4paI4paI4paI4paIICDilojiloggICDilojilojilojilohcclxuXHQqL1xyXG5cclxuXHRmdW5jdGlvbiBzb3J0S2V5cygpIHtcclxuXHRcdC8vIEluaXRpYWwgQ2xlYW51cFxyXG5cdFx0dmFyIGtleXMgPSBkMy5rZXlzKG9yaWdpbmFsRGF0YVswXSk7XHJcblxyXG5cdFx0Ly8gUG9wdWxhdGUgd2hpY2ggYXJlIGlucHV0IGFuZCBvdXRwdXQga2V5c1xyXG5cdFx0a2V5cy5mb3JFYWNoKGZ1bmN0aW9uIChrZXkpIHtcclxuXHRcdFx0T2JqZWN0LmtleXMoRGVzaWduRXhwbG9yZXIudHlwZURpc3BsYXlEaWN0aW9uYXJ5KVxyXG5cdFx0XHRcdC5mb3JFYWNoKGZ1bmN0aW9uIChrZXlUeXBlKSB7XHJcblx0XHRcdFx0XHR2YXIgdHlwZSA9IERlc2lnbkV4cGxvcmVyLnR5cGVEaXNwbGF5RGljdGlvbmFyeVtrZXlUeXBlXTtcclxuXHRcdFx0XHRcdHZhciBzaWduaWZpZXIgPSB0eXBlLnNpZ25pZmllcjtcclxuXHRcdFx0XHRcdHZhciBrZXlPYmo7XHJcblx0XHRcdFx0XHRpZiAoa2V5LnN0YXJ0c1dpdGgoc2lnbmlmaWVyKSkge1xyXG5cdFx0XHRcdFx0XHRrZXlPYmogPSBuZXcgRGVzaWduRXhwbG9yZXIuUGFyYW0oa2V5LCB0eXBlKTtcclxuXHRcdFx0XHRcdFx0aWYgKG9wdGlvbnMuaGlkZGVuS2V5cy5pbmRleE9mKGtleSkgIT09IC0xKSBrZXlPYmouc2hvd25JblBhcmNvb3JkcyA9IGZhbHNlO1xyXG5cdFx0XHRcdFx0XHRkZXNpZ25FeHBsb3Jlci5wYXJhbXNBbGwucHVzaChrZXlPYmopO1xyXG5cdFx0XHRcdFx0XHRkZXNpZ25FeHBsb3Jlci5wYXJhbXNba2V5VHlwZV0gPSBkZXNpZ25FeHBsb3Jlci5wYXJhbXNba2V5VHlwZV0gfHwgW107XHJcblx0XHRcdFx0XHRcdGRlc2lnbkV4cGxvcmVyLnBhcmFtc1trZXlUeXBlXS5wdXNoKGtleU9iaik7XHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0fSk7XHJcblx0XHR9KTtcclxuXHR9XHJcblxyXG5cdGZ1bmN0aW9uIGNsZWFuRGF0YSgpIHtcclxuXHRcdC8vIGNsZWFuIGRhdGFcclxuXHRcdG9yaWdpbmFsRGF0YS5mb3JFYWNoKGZ1bmN0aW9uIChkYXR1bSwgaSkge1xyXG5cdFx0XHR2YXIgY2xlYW5lZERhdHVtID0ge1xyXG5cdFx0XHRcdF9pZDogaVxyXG5cdFx0XHR9O1xyXG5cclxuXHRcdFx0T2JqZWN0LmtleXMoZGF0dW0pXHJcblx0XHRcdFx0LmZvckVhY2goZnVuY3Rpb24gKGtleSkge1xyXG5cdFx0XHRcdFx0dmFyIGtleU9iaiA9IGRlc2lnbkV4cGxvcmVyLnBhcmFtc0FsbC5yZWR1Y2UoZnVuY3Rpb24gKHByZXYsIGN1cikge1xyXG5cdFx0XHRcdFx0XHRyZXR1cm4gY3VyLm9yaWdpbmFsID09PSBrZXkgPyBjdXIgOiBwcmV2O1xyXG5cdFx0XHRcdFx0fSwgbnVsbCk7XHJcblx0XHRcdFx0XHR2YXIgZmxvYXRWZXJzaW9uID0gcGFyc2VGbG9hdChkYXR1bVtrZXldKTtcclxuXHRcdFx0XHRcdHZhciBjbGVhbktleSA9IGtleU9iaiA/IGtleU9ialtEZXNpZ25FeHBsb3Jlci5kYXRhS2V5XSA6IGtleTtcclxuXHRcdFx0XHRcdGNsZWFuZWREYXR1bVtjbGVhbktleV0gPSBpc05hTihmbG9hdFZlcnNpb24pID8gZGF0dW1ba2V5XSA6IGZsb2F0VmVyc2lvbjtcclxuXHRcdFx0XHR9KTtcclxuXHJcblx0XHRcdGlmIChjbGVhbmVkRGF0dW0uaW1nKSB7XHJcblx0XHRcdFx0Y2xlYW5lZERhdHVtLmltZ1RodW1iID0gY2xlYW5lZERhdHVtLmltZy5yZXBsYWNlKC8uKHBuZ3xnaWZ8anBlP2cpJC9pLCAnX3RodW1iLiQxJyk7XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdGRhdGEucHVzaChjbGVhbmVkRGF0dW0pO1xyXG5cdFx0fSk7XHJcblx0fVxyXG5cclxufTtcclxuXHJcbkRlc2lnbkV4cGxvcmVyLmRhdGFLZXkgPSAnY2xlYW5LZXknO1xyXG4iLCJEZXNpZ25FeHBsb3Jlci5QYXJhbSA9IGZ1bmN0aW9uIChrZXksIHR5cGUpIHtcclxuXHR2YXIgcGFyYW0gPSB0aGlzO1xyXG5cclxuXHRwYXJhbS5vcmlnaW5hbCA9IGtleTtcclxuXHJcblx0cGFyYW0uZGlzcGxheSA9IGtleS5zdWJzdHJpbmcodHlwZS5zaWduaWZpZXIubGVuZ3RoLCBrZXkubGVuZ3RoKTtcclxuXHJcblx0cGFyYW0udHlwZSA9IHR5cGU7XHJcblxyXG5cdHBhcmFtLmNsZWFuS2V5ID0ga2V5LnJlcGxhY2UoL1tcXFddL2csICdfJyk7XHJcblxyXG5cdHBhcmFtLnNob3duSW5QYXJjb29yZHMgPSB0cnVlO1xyXG5cclxuXHRwYXJhbS5jdXJFeHRlbnRzID0gW107XHJcblxyXG5cdHJldHVybiB0aGlzO1xyXG59O1xyXG4iLCIoZnVuY3Rpb24gKCkge1xyXG5cclxuXHR2YXIgY3VzdG9tUGFyYW1Db3VudCA9IDA7XHJcblxyXG5cdERlc2lnbkV4cGxvcmVyLlBhcmFtQ3VzdG9tID0gZnVuY3Rpb24gKCkge1xyXG5cclxuXHRcdGN1c3RvbVBhcmFtQ291bnQgKz0gMTtcclxuXHJcblx0XHREZXNpZ25FeHBsb3Jlci5QYXJhbS5hcHBseSh0aGlzLCBbJ2N1c3RvbTonICsgY3VzdG9tUGFyYW1Db3VudCwgRGVzaWduRXhwbG9yZXIudHlwZURpc3BsYXlEaWN0aW9uYXJ5LmN1c3RvbV0pO1xyXG5cclxuXHRcdHZhciBjdXN0b21QYXJhbSA9IHRoaXM7XHJcblxyXG5cdH07XHJcblxyXG5cdERlc2lnbkV4cGxvcmVyLlBhcmFtQ3VzdG9tLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoRGVzaWduRXhwbG9yZXIuUGFyYW0ucHJvdG90eXBlKTtcclxuXHJcblxyXG59KSgpO1xyXG4iLCJEZXNpZ25FeHBsb3Jlci50eXBlRGlzcGxheURpY3Rpb25hcnk9e1xyXG4gICdpbic6e1xyXG4gICAgJ3NpZ25pZmllcic6ICdpbjonLFxyXG4gICAgJ2tleSc6ICdpbicsXHJcbiAgICAnZGlzcGxheSc6J0lucHV0JyxcclxuICB9LFxyXG4gICdvdXQnOntcclxuICAgICdzaWduaWZpZXInOiAnb3V0OicsXHJcbiAgICAna2V5JzogJ291dCcsXHJcbiAgICAnZGlzcGxheSc6J091dHB1dCdcclxuICB9LFxyXG4gICdjdXN0b20nOntcclxuICAgICdzaWduaWZpZXInOiAnY3VzdG9tOicsXHJcbiAgICAna2V5JzogJ2N1c3RvbScsXHJcbiAgICAnZGlzcGxheSc6J0N1c3RvbSBPdXRwdXQnXHJcbiAgfSxcclxufTtcclxuIiwiXHJcblxyXG5cdERlc2lnbkV4cGxvcmVyLnByb3RvdHlwZS5hZGRDdXN0b21QYXJhbSA9IGZ1bmN0aW9uICgpIHtcclxuXHRcdHZhciBkZXNpZ25FeHBsb3JlciA9IHRoaXM7XHJcblxyXG5cdFx0Y3JlYXRlZEN1c3RvbUNvdW50ICs9IDE7XHJcblxyXG5cdFx0dmFyIHBhcmFtID0gbmV3IERlc2lnbkV4cGxvcmVyLlBhcmFtQ3VzdG9tKCk7XHJcblxyXG5cdFx0ZGVzaWduRXhwbG9yZXIucGFyYW1zLmN1c3RvbS5wdXNoKHBhcmFtKTtcclxuXHRcdGRlc2lnbkV4cGxvcmVyLnBhcmFtc0FsbC5wdXNoKGN1c3RvbSk7XHJcblxyXG5cdH07XHJcbiIsIkRlc2lnbkV4cGxvcmVyLnByb3RvdHlwZS5wb3B1bGF0ZUl0ZXJhdGlvblRhYmxlID0gZnVuY3Rpb24gKGpxRWxlbWVudCwgaXRlcmF0aW9uKSB7XHJcblx0dmFyIGRlc2lnbkV4cGxvcmVyID0gdGhpcztcclxuXHJcblx0dmFyIHBhcmFtVHlwZXMgPSBPYmplY3Qua2V5cyhkZXNpZ25FeHBsb3Jlci5wYXJhbXMpO1xyXG5cclxuXHRqcUVsZW1lbnQuaHRtbCgnJyk7XHJcblxyXG5cdHBhcmFtVHlwZXMuZm9yRWFjaChmdW5jdGlvbiAoa2V5KSB7XHJcblx0XHR2YXIgdHlwZSA9IERlc2lnbkV4cGxvcmVyLnR5cGVEaXNwbGF5RGljdGlvbmFyeVtrZXldO1xyXG5cdFx0dmFyIHRhYmxlID0gJCgnPHRhYmxlIGNsYXNzPVwidGFibGUgdGFibGUtY29uZGVuc2VkXCI+PC90YWJsZT4nKTtcclxuXHRcdHZhciBwYXJhbXMgPSBkZXNpZ25FeHBsb3Jlci5wYXJhbXNba2V5XTtcclxuXHRcdHBhcmFtcy5mb3JFYWNoKGZ1bmN0aW9uIChwYXJhbSkge1xyXG5cdFx0XHQvLyBpZiAoIXBhcmFtLnNob3duSW5QYXJjb29yZHMpIHJldHVybjtcclxuXHRcdFx0dmFyIHJvdyA9ICQoJzx0cj48L3RyPicpO1xyXG5cdFx0XHRyb3cuYXBwZW5kKCc8dGQ+JyArIHBhcmFtLmRpc3BsYXkgKyAnPC90ZD4nKTtcclxuXHRcdFx0cm93LmFwcGVuZCgnPHRkPicgKyBpdGVyYXRpb25bcGFyYW1bRGVzaWduRXhwbG9yZXIuZGF0YUtleV1dICsgJzwvdGQ+Jyk7XHJcblx0XHRcdHRhYmxlLmFwcGVuZChyb3cpO1xyXG5cclxuXHRcdFx0aWYgKHBhcmFtID09PSBkZXNpZ25FeHBsb3Jlci5zZWxlY3RlZFBhcmFtKSByb3cuY3NzKCdib3JkZXItbGVmdCcsICc1cHggc29saWQgJyArIGRlc2lnbkV4cGxvcmVyLmNvbG9yZXIoaXRlcmF0aW9uKSlcclxuXHRcdFx0XHQuY3NzKCdmb250LXdlaWdodCcsICdib2xkJyk7XHJcblx0XHR9KTtcclxuXHRcdGpxRWxlbWVudC5hcHBlbmQoJzxoND4nICsgdHlwZS5kaXNwbGF5ICsgJ3M8L2g0PicpO1xyXG5cdFx0anFFbGVtZW50LmFwcGVuZCh0YWJsZSk7XHJcblx0fSk7XHJcblxyXG5cclxufTtcclxuIiwiRGVzaWduRXhwbG9yZXIucHJvdG90eXBlLmdldFBhcmFtRnJvbURhdGFrZXkgPSBmdW5jdGlvbiAoZGF0YUtleSkge1xyXG5cdHZhciBkZXNpZ25FeHBsb3JlciA9IHRoaXM7XHJcblxyXG5cdHJldHVybiBkZXNpZ25FeHBsb3Jlci5wYXJhbXNBbGwucmVkdWNlKGZ1bmN0aW9uIChwcmV2LCBjdXIpIHtcclxuXHRcdHJldHVybiBjdXJbRGVzaWduRXhwbG9yZXIuZGF0YUtleV0gPT09IGRhdGFLZXkgPyBjdXIgOiBwcmV2O1xyXG5cdH0sIG51bGwpO1xyXG59O1xyXG4iLCJEZXNpZ25FeHBsb3Jlci5wcm90b3R5cGUucGFyY29vcmRzX2NyZWF0ZSA9IGZ1bmN0aW9uIChkaXZTZWxlY3Rvcikge1xyXG5cclxuXHR2YXIgZGVzaWduRXhwbG9yZXIgPSB0aGlzO1xyXG5cclxuXHRkZXNpZ25FeHBsb3Jlci5ncmFwaHMuX3BhcmNvb3Jkc0RpdlNlbGVjdG9yID0gZGl2U2VsZWN0b3I7XHJcblxyXG5cdHZhciBkaXYgPSAkKGRpdlNlbGVjdG9yKTtcclxuXHJcblx0dmFyIGNvbnRleHRNZW51ID0gJCgnI2NvbnRleHQtbWVudScpO1xyXG5cclxuXHRkaXYuaHRtbCgnJyk7XHJcblxyXG5cdGRpdi5hZGRDbGFzcygncGFyY29vcmRzJyk7XHJcblxyXG5cdHZhciBkaW1lbnNpb25zID0gZGVzaWduRXhwbG9yZXIucGFyY29vcmRzX2dldEN1ckRpbXMoKTtcclxuXHJcblx0ZGVzaWduRXhwbG9yZXIuZ3JhcGhzLnBhcmNvb3JkcyA9IGQzLnBhcmNvb3JkcygpKGRpdlNlbGVjdG9yKVxyXG5cdFx0LmRhdGEoZGVzaWduRXhwbG9yZXIuZ2V0RGF0YSgpKVxyXG5cdFx0LmNvbG9yKGRlc2lnbkV4cGxvcmVyLmNvbG9yZXIpXHJcblx0XHQuYWxwaGEoMC4yKVxyXG5cdFx0LmFscGhhT25CcnVzaGVkKDAuMDUpXHJcblx0XHQubW9kZShcInF1ZXVlXCIpXHJcblx0XHQucmF0ZSgyMClcclxuXHRcdC5kaW1lbnNpb25zKGRpbWVuc2lvbnMpXHJcblx0XHQucmVuZGVyKClcclxuXHRcdC5icnVzaE1vZGUoXCIxRC1heGVzXCIpIC8vIGVuYWJsZSBicnVzaGluZ1xyXG5cdFx0LmF1dG9zY2FsZSgpXHJcblx0XHQuaW50ZXJhY3RpdmUoKVxyXG5cdFx0LnJlb3JkZXJhYmxlKCk7XHJcblxyXG5cdHBvc3RSZW5kZXIoKTtcclxuXHJcblx0ZGVzaWduRXhwbG9yZXIuZ3JhcGhzLnBhcmNvb3Jkcy5vbigncmVuZGVyJywgXy5kZWJvdW5jZShwb3N0UmVuZGVyLCA0MDApKTtcclxuXHRkZXNpZ25FeHBsb3Jlci5ncmFwaHMucGFyY29vcmRzLm9uKCdkaW1lbnNpb25zJywgXy5kZWJvdW5jZShwb3N0UmVuZGVyLCA0MDApKTtcclxuXHRkZXNpZ25FeHBsb3Jlci5ncmFwaHMucGFyY29vcmRzLm9uKCdicnVzaCcsIF8uZGVib3VuY2UocG9zdFJlbmRlciwgNDAwKSk7XHJcblx0Ly8gZGVzaWduRXhwbG9yZXIuZ3JhcGhzLnBhcmNvb3Jkcy5vbignYnJ1c2gnLCBfLmRlYm91bmNlKHBvc3RCcnVzaCwgNDAwKSk7XHJcblxyXG5cdGZ1bmN0aW9uIHBvc3RSZW5kZXIoKSB7XHJcblxyXG5cdFx0dmFyIGRvbWFpbkNvbG9ycyA9IFtdO1xyXG5cclxuXHRcdHZhciBjdXJEYXRhID0gZGVzaWduRXhwbG9yZXIuZ3JhcGhzLnBhcmNvb3Jkcy5icnVzaGVkKCk7XHJcblxyXG5cdFx0ZDMuc2VsZWN0QWxsKGRpdlNlbGVjdG9yICsgJyBnLmRpbWVuc2lvbicpXHJcblx0XHRcdC5lYWNoKGZ1bmN0aW9uIChkLCBpKSB7XHJcblx0XHRcdFx0dmFyIHBhcmFtID0gZGVzaWduRXhwbG9yZXIuZ2V0UGFyYW1Gcm9tRGF0YWtleShkKTtcclxuXHRcdFx0XHR2YXIgcGFyYW1Db2xvciA9IChwYXJhbS50eXBlLmtleSA9PT0gJ2luJykgPyAnIzk5OScgOiAnIzAwMCc7XHJcblx0XHRcdFx0dmFyIHRoaXNEMyA9IGQzLnNlbGVjdCh0aGlzKTtcclxuXHJcblx0XHRcdFx0dmFyIGN1ckV4dGVudHMgPSBkMy5leHRlbnQoY3VyRGF0YSwgZnVuY3Rpb24gKGQpIHtcclxuXHRcdFx0XHRcdHJldHVybiBkW3BhcmFtW0Rlc2lnbkV4cGxvcmVyLmRhdGFLZXldXTtcclxuXHRcdFx0XHR9KTtcclxuXHJcblx0XHRcdFx0cGFyYW0uY3VyRXh0ZW50c1swXSA9IGN1ckV4dGVudHNbMF07XHJcblx0XHRcdFx0cGFyYW0uY3VyRXh0ZW50c1sxXSA9IGN1ckV4dGVudHNbMV07XHJcblxyXG5cdFx0XHRcdHRoaXNEMy5zZWxlY3RBbGwoJ3RleHQubGFiZWwnKVxyXG5cdFx0XHRcdFx0LnRleHQocGFyYW0uZGlzcGxheSlcclxuXHRcdFx0XHRcdC5zdHlsZSgnZmlsbCcsIHBhcmFtQ29sb3IpO1xyXG5cclxuXHRcdFx0XHR0aGlzRDMuc2VsZWN0QWxsKCdwYXRoLmRvbWFpbicpXHJcblx0XHRcdFx0XHQuc3R5bGUoJ3N0cm9rZScsIHBhcmFtQ29sb3IpO1xyXG5cclxuXHRcdFx0XHR0aGlzRDMuc2VsZWN0QWxsKCcgZy50aWNrIHRleHQnKVxyXG5cdFx0XHRcdFx0LnN0eWxlKCdmb250LXNpemUnLCAnOXB4JylcclxuXHRcdFx0XHRcdC5zdHlsZSgnZmlsbCcsIHBhcmFtQ29sb3IpO1xyXG5cclxuXHRcdFx0XHR0aGlzRDMuc2VsZWN0QWxsKCcgZy5icnVzaCByZWN0LmV4dGVudCcpXHJcblx0XHRcdFx0XHQuc3R5bGUoJ2ZpbGwnLCAncmdiYSgyNTUsMjU1LDI1NSwwLjUpJylcclxuXHRcdFx0XHRcdC5vbignY29udGV4dG1lbnUnLCBmdW5jdGlvbiAoZCwgaSkge1xyXG5cclxuXHRcdFx0XHRcdFx0aWYgKCFzaG93QnJ1c2hNZW51KCkpIHJldHVybjtcclxuXHJcblx0XHRcdFx0XHRcdHZhciBsZyA9ICQoJzx1bCBjbGFzcz1cImxpc3QtZ3JvdXBcIj48L3VsPicpLFxyXG5cdFx0XHRcdFx0XHRcdHJlc2V0QnJ1c2ggPSAkKCc8YSBjbGFzcz1cImxpc3QtZ3JvdXAtaXRlbVwiPjxiPlJlc2V0IHRoZXNlIGV4dGVudHM8L2I+PC9hPicpO1xyXG5cclxuXHRcdFx0XHRcdFx0cmVzZXRCcnVzaC5vbignY2xpY2snLCBmdW5jdGlvbiAoKSB7XHJcblx0XHRcdFx0XHRcdFx0ZGVzaWduRXhwbG9yZXIuZ3JhcGhzLnBhcmNvb3Jkcy5icnVzaFJlc2V0KGQpO1xyXG5cdFx0XHRcdFx0XHR9KTtcclxuXHJcblx0XHRcdFx0XHRcdGxnLmFwcGVuZChyZXNldEJydXNoKTtcclxuXHRcdFx0XHRcdFx0Y29udGV4dE1lbnUuYXBwZW5kKGxnKTtcclxuXHJcblx0XHRcdFx0XHRcdGxnLm9uKCdjbGljaycsIGZ1bmN0aW9uICgpIHtcclxuXHRcdFx0XHRcdFx0XHRjb250ZXh0TWVudS5oaWRlKCk7XHJcblx0XHRcdFx0XHRcdH0pO1xyXG5cclxuXHRcdFx0XHRcdH0pXHJcblx0XHRcdFx0XHQub24oJ21vdXNlb3ZlcicsIGZ1bmN0aW9uIChkLCBpKSB7XHJcblxyXG5cdFx0XHRcdFx0XHRpZiAoIXNob3dCcnVzaE1lbnUoKSkgcmV0dXJuO1xyXG5cclxuXHRcdFx0XHRcdFx0dmFyIGZpbHRlck1lc3NhZ2UgPSAnPGEgY2xhc3M9XCJsaXN0LWdyb3VwLWl0ZW1cIj5GaWx0ZXJlZCAnICsgcGFyYW0uY3VyRXh0ZW50cy5qb2luKCcgdG8gJykgKyAnLjwvYT4nO1xyXG5cclxuXHRcdFx0XHRcdFx0Y29udGV4dE1lbnUuYXBwZW5kKGZpbHRlck1lc3NhZ2UpO1xyXG5cdFx0XHRcdFx0fSlcclxuXHRcdFx0XHRcdC5vbignbW91c2VvdXQnLCBmdW5jdGlvbiAoZCwgaSkge1xyXG5cclxuXHRcdFx0XHRcdFx0Y29udGV4dE1lbnUuaGlkZSgpO1xyXG5cclxuXHRcdFx0XHRcdH0pO1xyXG5cdFx0XHR9KTtcclxuXHJcblx0XHRmdW5jdGlvbiBzaG93QnJ1c2hNZW51KCkge1xyXG5cdFx0XHR2YXIgalRoaXMgPSAkKHRoaXMpO1xyXG5cclxuXHRcdFx0aWYgKE51bWJlcihqVGhpcy5hdHRyKCdoZWlnaHQnKSkgPT09IDApIHJldHVybjtcclxuXHJcblx0XHRcdGQzLmV2ZW50LnByZXZlbnREZWZhdWx0KCk7XHJcblxyXG5cdFx0XHRjb250ZXh0TWVudS5odG1sKCcnKTtcclxuXHRcdFx0Y29udGV4dE1lbnUuY3NzKCdsZWZ0JywgZDMuZXZlbnQuY2xpZW50WCk7XHJcblx0XHRcdGNvbnRleHRNZW51LmNzcygndG9wJywgZDMuZXZlbnQuY2xpZW50WSk7XHJcblx0XHRcdGNvbnRleHRNZW51LnNob3coKTtcclxuXHJcblx0XHRcdHJldHVybiBqVGhpcztcclxuXHRcdH1cclxuXHJcblx0XHRkZXNpZ25FeHBsb3Jlci5hYnN0cmFjdF9wYXJjb29yZHNfcG9zdFJlbmRlcigpO1xyXG5cdH1cclxuXHJcblx0Ly8gcmVzaXplIG9yIHJlLXJlbmRlciBicmVha3MgdGhlIGJydXNoIG1vZGVcclxuXHQvLyAkKHdpbmRvdylcclxuXHQvLyBcdC5vbigncmVzaXplJywgZnVuY3Rpb24gKCkge1xyXG5cdC8vIFx0XHRkZXNpZ25FeHBsb3Jlci5ncmFwaHMucGFyY29vcmRzLndpZHRoKGRpdi53aWR0aCgpKTtcclxuXHQvLyBcdH0pO1xyXG59O1xyXG5cclxuLypcclxuIOKWiOKWiOKWiOKWiOKWiCAg4paI4paI4paI4paI4paI4paIICDilojilojilojilojilojilojilogg4paI4paI4paI4paI4paI4paI4paI4paIIOKWiOKWiOKWiOKWiOKWiOKWiCAgIOKWiOKWiOKWiOKWiOKWiCAgIOKWiOKWiOKWiOKWiOKWiOKWiCDilojilojilojilojilojilojilojilogg4paI4paI4paI4paI4paI4paI4paIXHJcbuKWiOKWiCAgIOKWiOKWiCDilojiloggICDilojilogg4paI4paIICAgICAgICAg4paI4paIICAgIOKWiOKWiCAgIOKWiOKWiCDilojiloggICDilojilogg4paI4paIICAgICAgICAg4paI4paIICAgIOKWiOKWiFxyXG7ilojilojilojilojilojilojilogg4paI4paI4paI4paI4paI4paIICDilojilojilojilojilojilojiloggICAg4paI4paIICAgIOKWiOKWiOKWiOKWiOKWiOKWiCAg4paI4paI4paI4paI4paI4paI4paIIOKWiOKWiCAgICAgICAgIOKWiOKWiCAgICDilojilojilojilojilojilojilohcclxu4paI4paIICAg4paI4paIIOKWiOKWiCAgIOKWiOKWiCAgICAgIOKWiOKWiCAgICDilojiloggICAg4paI4paIICAg4paI4paIIOKWiOKWiCAgIOKWiOKWiCDilojiloggICAgICAgICDilojiloggICAgICAgICDilojilohcclxu4paI4paIICAg4paI4paIIOKWiOKWiOKWiOKWiOKWiOKWiCAg4paI4paI4paI4paI4paI4paI4paIICAgIOKWiOKWiCAgICDilojiloggICDilojilogg4paI4paIICAg4paI4paIICDilojilojilojilojilojiloggICAg4paI4paIICAgIOKWiOKWiOKWiOKWiOKWiOKWiOKWiFxyXG4qL1xyXG5cclxuLyoqXHJcbiAqIEludGVuZGVkIGZvciBvdmVyd3JpdGUuXHJcbiAqL1xyXG5EZXNpZ25FeHBsb3Jlci5wcm90b3R5cGUuYWJzdHJhY3RfcGFyY29vcmRzX3Bvc3RSZW5kZXIgPSBmdW5jdGlvbiAoKSB7fTtcclxuIiwiRGVzaWduRXhwbG9yZXIucHJvdG90eXBlLnBhcmNvb3Jkc19nZXRDdXJEaW1zID0gZnVuY3Rpb24gKCkge1xyXG5cclxuXHR2YXIgZGVzaWduRXhwbG9yZXIgPSB0aGlzO1xyXG5cclxuXHR2YXIgZGltZW5zaW9ucyA9IGRlc2lnbkV4cGxvcmVyLnBhcmFtc0FsbC5yZWR1Y2UoZnVuY3Rpb24gKHByZXYsIGN1cikge1xyXG5cdFx0aWYgKGN1ci5zaG93bkluUGFyY29vcmRzKSB7XHJcblx0XHRcdHByZXZbY3VyW0Rlc2lnbkV4cGxvcmVyLmRhdGFLZXldXSA9IHt9O1xyXG5cdFx0fVxyXG5cdFx0cmV0dXJuIHByZXY7XHJcblx0fSwge30pO1xyXG5cclxuXHRyZXR1cm4gZGltZW5zaW9ucztcclxuXHJcbn07XHJcbiIsIkRlc2lnbkV4cGxvcmVyLnByb3RvdHlwZS5wYXJjb29yZHNfcmVkcmF3ID0gZnVuY3Rpb24gKCkge1xyXG5cclxuXHR2YXIgZGVzaWduRXhwbG9yZXIgPSB0aGlzO1xyXG5cclxuXHRpZiAoIWRlc2lnbkV4cGxvcmVyLmdyYXBocy5wYXJjb29yZHMpIHJldHVybjtcclxuXHJcblx0ZGVzaWduRXhwbG9yZXIuZ3JhcGhzLnBhcmNvb3Jkcy5kaW1lbnNpb25zKGRlc2lnbkV4cGxvcmVyLnBhcmNvb3Jkc19nZXRDdXJEaW1zKCkpO1xyXG5cclxufTtcclxuIiwiLyoqXHJcbiAqIFRlbGwgdXMgd2hpY2ggcGFyYW0gdG8gY29sb3IgYnlcclxuICogQHBhcmFtIHtvYmplY3R9IHBhcmFtIC0gUGFyYW1ldGVyXHJcbiAqL1xyXG5EZXNpZ25FeHBsb3Jlci5wcm90b3R5cGUuc2V0Q29sb3JlciA9IGZ1bmN0aW9uIChwYXJhbSkge1xyXG5cclxuXHR2YXIgZGVzaWduRXhwbG9yZXIgPSB0aGlzO1xyXG5cclxuXHRkZXNpZ25FeHBsb3Jlci5zZWxlY3RlZFBhcmFtID0gcGFyYW07XHJcblxyXG5cdHZhciBkYXRhID0gZGVzaWduRXhwbG9yZXIuZ2V0RGF0YSgpO1xyXG5cclxuXHR2YXIgZXh0ZW50cyA9IGQzLmV4dGVudChkYXRhLCBkYXRhQWNjZXNzb3IpO1xyXG5cclxuXHR2YXIgY29sb3JTY2FsZSA9IGQzLnNjYWxlLmxpbmVhcigpXHJcblx0XHQuZG9tYWluKGV4dGVudHMpXHJcblx0XHQucmFuZ2UoW1wiIzNiMzFiMFwiLCBcIiM2NkNDRERcIl0pO1xyXG5cclxuXHRkZXNpZ25FeHBsb3Jlci5jb2xvcmVyID0gZnVuY3Rpb24gKGQpIHtcclxuXHRcdHJldHVybiBjb2xvclNjYWxlKGRhdGFBY2Nlc3NvcihkKSk7XHJcblx0fTtcclxuXHJcblx0aWYoZGVzaWduRXhwbG9yZXIuZ3JhcGhzLnBhcmNvb3Jkcykge1xyXG5cdFx0ZGVzaWduRXhwbG9yZXIuZ3JhcGhzLnBhcmNvb3Jkcy5jb2xvcihkZXNpZ25FeHBsb3Jlci5jb2xvcmVyKS5yZW5kZXIoKTtcclxuXHR9XHJcblxyXG5cdGZ1bmN0aW9uIGRhdGFBY2Nlc3NvcihkKSB7XHJcblx0XHRyZXR1cm4gZFtwYXJhbVtEZXNpZ25FeHBsb3Jlci5kYXRhS2V5XV07XHJcblx0fVxyXG5cclxufTtcclxuIl19
