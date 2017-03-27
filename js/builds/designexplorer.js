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
		.replace(']', '_');

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

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImhlYWRlci5qcyIsImNvbnN0cnVjdG9ycy9QYXJhbS5qcyIsImNvbnN0cnVjdG9ycy9QYXJhbUN1c3RvbS5qcyIsInN0YXRpY3MvdHlwZURpc3BsYXlEaWN0aW9uYXJ5LmpzIiwicGFydGlhbHMvYWRkQ3VzdG9tUGFyYW0uanMiLCJwYXJ0aWFscy9nZXRJdGVyYXRpb25UYWJsZS5qcyIsInBhcnRpYWxzL2dldFBhcmFtRnJvbURhdGFrZXkuanMiLCJwYXJ0aWFscy9wYXJjb29yZHNfY3JlYXRlLmpzIiwicGFydGlhbHMvcGFyY29vcmRzX2dldEN1ckRpbXMuanMiLCJwYXJ0aWFscy9wYXJjb29yZHNfcmVkcmF3LmpzIiwicGFydGlhbHMvc2V0Q29sb3Jlci5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQzFGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNqQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNsQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDakJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNiQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUMxQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ1BBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNoSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDZEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNUQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImRlc2lnbmV4cGxvcmVyLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXHJcbiAqIEBjb25zdHJ1Y3RvclxyXG4gKi9cclxudmFyIERlc2lnbkV4cGxvcmVyID0gZnVuY3Rpb24gKG9yaWdpbmFsRGF0YSkge1xyXG5cclxuXHQvKipcclxuXHQgKiBAbGVuZHMgRGVzaWduRXhwbG9yZXIucHJvdG90eXBlXHJcblx0ICovXHJcblx0dmFyIGRlc2lnbkV4cGxvcmVyID0gdGhpcztcclxuXHJcblx0dmFyIGRhdGEgPSBbXTtcclxuXHJcblx0Ly8gRGljdGlvbmFyaWVkIHBhcmFtc1xyXG5cdGRlc2lnbkV4cGxvcmVyLnBhcmFtcyA9IHtcclxuXHRcdCdjdXN0b20nOltdXHJcblx0fTtcclxuXHJcblx0Ly8gQWxsIHBhcmFtc1xyXG5cdGRlc2lnbkV4cGxvcmVyLnBhcmFtc0FsbCA9IFtdO1xyXG5cclxuXHQvLyBTZXQgbGF0ZXIgYnkgc2V0Q29sb3JlclxyXG5cdGRlc2lnbkV4cGxvcmVyLnNlbGVjdGVkUGFyYW0gPSBudWxsO1xyXG5cclxuXHQvLyBBbGwgZ3JhcGhzIG5hbWVzcGFjZVxyXG5cdGRlc2lnbkV4cGxvcmVyLmdyYXBocyA9IHt9O1xyXG5cclxuXHRzb3J0S2V5cygpO1xyXG5cdGNsZWFuRGF0YSgpO1xyXG5cclxuXHQvLyBBY2Nlc3MgdGhpcyBkYXRhIGxhdGVyXHJcblx0RGVzaWduRXhwbG9yZXIucHJvdG90eXBlLmdldERhdGEgPSBmdW5jdGlvbiAoKSB7XHJcblx0XHRyZXR1cm4gZGF0YTtcclxuXHR9O1xyXG5cclxuXHQvLyBTZXQgZGVmYXVsdCBzb3J0IGJ5IGtleVxyXG5cdGRlc2lnbkV4cGxvcmVyLnNldENvbG9yZXIoZGVzaWduRXhwbG9yZXIucGFyYW1zLmluWzBdKTtcclxuXHJcblx0LypcclxuXHQg4paI4paI4paI4paI4paIICDilojilojiloggICAg4paI4paIICDilojilojilojilojilojiloggIOKWiOKWiOKWiCAgICDilojilohcclxuXHTilojiloggICDilojilogg4paI4paI4paI4paIICAg4paI4paIIOKWiOKWiCAgICDilojilogg4paI4paI4paI4paIICAg4paI4paIXHJcblx04paI4paI4paI4paI4paI4paI4paIIOKWiOKWiCDilojiloggIOKWiOKWiCDilojiloggICAg4paI4paIIOKWiOKWiCDilojiloggIOKWiOKWiFxyXG5cdOKWiOKWiCAgIOKWiOKWiCDilojiloggIOKWiOKWiCDilojilogg4paI4paIICAgIOKWiOKWiCDilojiloggIOKWiOKWiCDilojilohcclxuXHTilojiloggICDilojilogg4paI4paIICAg4paI4paI4paI4paIICDilojilojilojilojilojiloggIOKWiOKWiCAgIOKWiOKWiOKWiOKWiFxyXG5cdCovXHJcblxyXG5cdGZ1bmN0aW9uIHNvcnRLZXlzKCkge1xyXG5cdFx0Ly8gSW5pdGlhbCBDbGVhbnVwXHJcblx0XHR2YXIga2V5cyA9IGQzLmtleXMob3JpZ2luYWxEYXRhWzBdKTtcclxuXHJcblx0XHQvLyBQb3B1bGF0ZSB3aGljaCBhcmUgaW5wdXQgYW5kIG91dHB1dCBrZXlzXHJcblx0XHRrZXlzLmZvckVhY2goZnVuY3Rpb24gKGtleSkge1xyXG5cdFx0XHRPYmplY3Qua2V5cyhEZXNpZ25FeHBsb3Jlci50eXBlRGlzcGxheURpY3Rpb25hcnkpXHJcblx0XHRcdFx0LmZvckVhY2goZnVuY3Rpb24gKGtleVR5cGUpIHtcclxuXHRcdFx0XHRcdHZhciB0eXBlID0gRGVzaWduRXhwbG9yZXIudHlwZURpc3BsYXlEaWN0aW9uYXJ5W2tleVR5cGVdO1xyXG5cdFx0XHRcdFx0dmFyIHNpZ25pZmllciA9IHR5cGUuc2lnbmlmaWVyO1xyXG5cdFx0XHRcdFx0dmFyIGtleU9iajtcclxuXHRcdFx0XHRcdGlmIChrZXkuc3RhcnRzV2l0aChzaWduaWZpZXIpKSB7XHJcblx0XHRcdFx0XHRcdGtleU9iaiA9IG5ldyBEZXNpZ25FeHBsb3Jlci5QYXJhbShrZXksIHR5cGUpO1xyXG5cdFx0XHRcdFx0XHRkZXNpZ25FeHBsb3Jlci5wYXJhbXNBbGwucHVzaChrZXlPYmopO1xyXG5cdFx0XHRcdFx0XHRkZXNpZ25FeHBsb3Jlci5wYXJhbXNba2V5VHlwZV0gPSBkZXNpZ25FeHBsb3Jlci5wYXJhbXNba2V5VHlwZV0gfHwgW107XHJcblx0XHRcdFx0XHRcdGRlc2lnbkV4cGxvcmVyLnBhcmFtc1trZXlUeXBlXS5wdXNoKGtleU9iaik7XHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0fSk7XHJcblx0XHR9KTtcclxuXHR9XHJcblxyXG5cdGZ1bmN0aW9uIGNsZWFuRGF0YSgpIHtcclxuXHRcdC8vIGNsZWFuIGRhdGFcclxuXHRcdG9yaWdpbmFsRGF0YS5mb3JFYWNoKGZ1bmN0aW9uIChkYXR1bSwgaSkge1xyXG5cdFx0XHR2YXIgY2xlYW5lZERhdHVtID0ge1xyXG5cdFx0XHRcdF9pZDogaVxyXG5cdFx0XHR9O1xyXG5cclxuXHRcdFx0T2JqZWN0LmtleXMoZGF0dW0pXHJcblx0XHRcdFx0LmZvckVhY2goZnVuY3Rpb24gKGtleSkge1xyXG5cdFx0XHRcdFx0dmFyIGtleU9iaiA9IGRlc2lnbkV4cGxvcmVyLnBhcmFtc0FsbC5yZWR1Y2UoZnVuY3Rpb24gKHByZXYsIGN1cikge1xyXG5cdFx0XHRcdFx0XHRyZXR1cm4gY3VyLm9yaWdpbmFsID09PSBrZXkgPyBjdXIgOiBwcmV2O1xyXG5cdFx0XHRcdFx0fSwgbnVsbCk7XHJcblx0XHRcdFx0XHR2YXIgZmxvYXRWZXJzaW9uID0gcGFyc2VGbG9hdChkYXR1bVtrZXldKTtcclxuXHRcdFx0XHRcdHZhciBjbGVhbktleSA9IGtleU9iaiA/IGtleU9ialtEZXNpZ25FeHBsb3Jlci5kYXRhS2V5XSA6IGtleTtcclxuXHRcdFx0XHRcdGNsZWFuZWREYXR1bVtjbGVhbktleV0gPSBpc05hTihmbG9hdFZlcnNpb24pID8gZGF0dW1ba2V5XSA6IGZsb2F0VmVyc2lvbjtcclxuXHRcdFx0XHR9KTtcclxuXHJcblx0XHRcdGRhdGEucHVzaChjbGVhbmVkRGF0dW0pO1xyXG5cdFx0fSk7XHJcblx0fVxyXG5cclxufTtcclxuXHJcbkRlc2lnbkV4cGxvcmVyLmRhdGFLZXkgPSAnY2xlYW5LZXknO1xyXG4iLCJEZXNpZ25FeHBsb3Jlci5QYXJhbSA9IGZ1bmN0aW9uIChrZXksIHR5cGUpIHtcclxuXHR2YXIgcGFyYW0gPSB0aGlzO1xyXG5cclxuXHRwYXJhbS5vcmlnaW5hbCA9IGtleTtcclxuXHJcblx0cGFyYW0uZGlzcGxheSA9IGtleS5zdWJzdHJpbmcodHlwZS5zaWduaWZpZXIubGVuZ3RoLCBrZXkubGVuZ3RoKTtcclxuXHJcblx0cGFyYW0udHlwZSA9IHR5cGU7XHJcblxyXG5cdHBhcmFtLmNsZWFuS2V5ID0ga2V5LnJlcGxhY2UoJzonLCAnXycpXHJcblx0XHQucmVwbGFjZSgnWycsICdfJylcclxuXHRcdC5yZXBsYWNlKCddJywgJ18nKTtcclxuXHJcblx0cGFyYW0uc2hvd25JblBhcmNvb3JkcyA9IHRydWU7XHJcblxyXG5cdHJldHVybiB0aGlzO1xyXG59O1xyXG4iLCIoZnVuY3Rpb24gKCkge1xyXG5cclxuXHR2YXIgY3VzdG9tUGFyYW1Db3VudCA9IDA7XHJcblxyXG5cdERlc2lnbkV4cGxvcmVyLlBhcmFtQ3VzdG9tID0gZnVuY3Rpb24gKCkge1xyXG5cclxuXHRcdGN1c3RvbVBhcmFtQ291bnQgKz0gMTtcclxuXHJcblx0XHREZXNpZ25FeHBsb3Jlci5QYXJhbS5hcHBseSh0aGlzLCBbJ2N1c3RvbTonICsgY3VzdG9tUGFyYW1Db3VudCwgRGVzaWduRXhwbG9yZXIudHlwZURpc3BsYXlEaWN0aW9uYXJ5LmN1c3RvbV0pO1xyXG5cclxuXHRcdHZhciBjdXN0b21QYXJhbSA9IHRoaXM7XHJcblxyXG5cdH07XHJcblxyXG5cdERlc2lnbkV4cGxvcmVyLlBhcmFtQ3VzdG9tLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoRGVzaWduRXhwbG9yZXIuUGFyYW0ucHJvdG90eXBlKTtcclxuXHJcblxyXG59KSgpO1xyXG4iLCJEZXNpZ25FeHBsb3Jlci50eXBlRGlzcGxheURpY3Rpb25hcnk9e1xyXG4gICdpbic6e1xyXG4gICAgJ3NpZ25pZmllcic6ICdpbjonLFxyXG4gICAgJ2tleSc6ICdpbicsXHJcbiAgICAnZGlzcGxheSc6J0lucHV0JyxcclxuICB9LFxyXG4gICdvdXQnOntcclxuICAgICdzaWduaWZpZXInOiAnb3V0OicsXHJcbiAgICAna2V5JzogJ291dCcsXHJcbiAgICAnZGlzcGxheSc6J091dHB1dCdcclxuICB9LFxyXG4gICdjdXN0b20nOntcclxuICAgICdzaWduaWZpZXInOiAnY3VzdG9tOicsXHJcbiAgICAna2V5JzogJ2N1c3RvbScsXHJcbiAgICAnZGlzcGxheSc6J0N1c3RvbSBPdXRwdXQnXHJcbiAgfSxcclxufTtcclxuIiwiXHJcblxyXG5cdERlc2lnbkV4cGxvcmVyLnByb3RvdHlwZS5hZGRDdXN0b21QYXJhbSA9IGZ1bmN0aW9uICgpIHtcclxuXHRcdHZhciBkZXNpZ25FeHBsb3JlciA9IHRoaXM7XHJcblxyXG5cdFx0Y3JlYXRlZEN1c3RvbUNvdW50ICs9IDE7XHJcblxyXG5cdFx0dmFyIHBhcmFtID0gbmV3IERlc2lnbkV4cGxvcmVyLlBhcmFtQ3VzdG9tKCk7XHJcblxyXG5cdFx0ZGVzaWduRXhwbG9yZXIucGFyYW1zLmN1c3RvbS5wdXNoKHBhcmFtKTtcclxuXHRcdGRlc2lnbkV4cGxvcmVyLnBhcmFtc0FsbC5wdXNoKGN1c3RvbSk7XHJcblxyXG5cdH07XHJcbiIsIkRlc2lnbkV4cGxvcmVyLnByb3RvdHlwZS5wb3B1bGF0ZUl0ZXJhdGlvblRhYmxlPWZ1bmN0aW9uKGpxRWxlbWVudCxpdGVyYXRpb24pe1xyXG4gIHZhciBkZXNpZ25FeHBsb3Jlcj10aGlzO1xyXG5cclxuICB2YXIgcGFyYW1UeXBlcyA9IE9iamVjdC5rZXlzKGRlc2lnbkV4cGxvcmVyLnBhcmFtcyk7XHJcblxyXG4gIGpxRWxlbWVudC5odG1sKCcnKTtcclxuXHJcbiAgcGFyYW1UeXBlcy5mb3JFYWNoKGZ1bmN0aW9uIChrZXkpIHtcclxuICAgIHZhciB0eXBlID0gRGVzaWduRXhwbG9yZXIudHlwZURpc3BsYXlEaWN0aW9uYXJ5W2tleV07XHJcbiAgICB2YXIgdGFibGUgPSAkKCc8dGFibGUgY2xhc3M9XCJ0YWJsZSB0YWJsZS1jb25kZW5zZWRcIj48L3RhYmxlPicpO1xyXG4gICAgdmFyIHBhcmFtcyA9IGRlc2lnbkV4cGxvcmVyLnBhcmFtc1trZXldO1xyXG4gICAgcGFyYW1zLmZvckVhY2goZnVuY3Rpb24gKHBhcmFtKSB7XHJcbiAgICAgIHZhciByb3cgPSAkKCc8dHI+PC90cj4nKTtcclxuICAgICAgcm93LmFwcGVuZCgnPHRkPicgKyBwYXJhbS5kaXNwbGF5ICsgJzwvdGQ+Jyk7XHJcbiAgICAgIHJvdy5hcHBlbmQoJzx0ZD4nICsgaXRlcmF0aW9uW3BhcmFtW0Rlc2lnbkV4cGxvcmVyLmRhdGFLZXldXSArICc8L3RkPicpO1xyXG4gICAgICB0YWJsZS5hcHBlbmQocm93KTtcclxuXHJcbiAgICAgIGlmIChwYXJhbSA9PT0gZGVzaWduRXhwbG9yZXIuc2VsZWN0ZWRQYXJhbSkgcm93LmNzcygnYm9yZGVyLWxlZnQnLCAnNXB4IHNvbGlkICcgKyBkZXNpZ25FeHBsb3Jlci5jb2xvcmVyKGl0ZXJhdGlvbikpXHJcbiAgICAgICAgLmNzcygnZm9udC13ZWlnaHQnLCAnYm9sZCcpO1xyXG4gICAgfSk7XHJcbiAgICBqcUVsZW1lbnQuYXBwZW5kKCc8aDQ+JyArIHR5cGUuZGlzcGxheSArICdzPC9oND4nKTtcclxuICAgIGpxRWxlbWVudC5hcHBlbmQodGFibGUpO1xyXG4gIH0pO1xyXG5cclxuXHJcbn07XHJcbiIsIkRlc2lnbkV4cGxvcmVyLnByb3RvdHlwZS5nZXRQYXJhbUZyb21EYXRha2V5ID0gZnVuY3Rpb24gKGRhdGFLZXkpIHtcclxuXHR2YXIgZGVzaWduRXhwbG9yZXIgPSB0aGlzO1xyXG5cclxuXHRyZXR1cm4gZGVzaWduRXhwbG9yZXIucGFyYW1zQWxsLnJlZHVjZShmdW5jdGlvbiAocHJldiwgY3VyKSB7XHJcblx0XHRyZXR1cm4gY3VyW0Rlc2lnbkV4cGxvcmVyLmRhdGFLZXldID09PSBkYXRhS2V5ID8gY3VyIDogcHJldjtcclxuXHR9LCBudWxsKTtcclxufTtcclxuIiwiRGVzaWduRXhwbG9yZXIucHJvdG90eXBlLnBhcmNvb3Jkc19jcmVhdGUgPSBmdW5jdGlvbiAoZGl2U2VsZWN0b3IpIHtcclxuXHJcblx0dmFyIGRlc2lnbkV4cGxvcmVyID0gdGhpcztcclxuXHJcblx0ZGVzaWduRXhwbG9yZXIuZ3JhcGhzLl9wYXJjb29yZHNEaXZTZWxlY3RvciA9IGRpdlNlbGVjdG9yO1xyXG5cclxuXHR2YXIgZGl2ID0gJChkaXZTZWxlY3Rvcik7XHJcblxyXG5cdHZhciBjb250ZXh0TWVudSA9ICQoJyNjb250ZXh0LW1lbnUnKTtcclxuXHJcblx0ZGl2Lmh0bWwoJycpO1xyXG5cclxuXHRkaXYuYWRkQ2xhc3MoJ3BhcmNvb3JkcycpO1xyXG5cclxuXHR2YXIgZGltZW5zaW9ucyA9IGRlc2lnbkV4cGxvcmVyLnBhcmNvb3Jkc19nZXRDdXJEaW1zKCk7XHJcblxyXG5cdGRlc2lnbkV4cGxvcmVyLmdyYXBocy5wYXJjb29yZHMgPSBkMy5wYXJjb29yZHMoKShkaXZTZWxlY3RvcilcclxuXHRcdC5kYXRhKGRlc2lnbkV4cGxvcmVyLmdldERhdGEoKSlcclxuXHRcdC5jb2xvcihkZXNpZ25FeHBsb3Jlci5jb2xvcmVyKVxyXG5cdFx0LmFscGhhKDAuMilcclxuXHRcdC5hbHBoYU9uQnJ1c2hlZCgwLjA1KVxyXG5cdFx0Lm1vZGUoXCJxdWV1ZVwiKVxyXG5cdFx0LnJhdGUoMjApXHJcblx0XHQuZGltZW5zaW9ucyhkaW1lbnNpb25zKVxyXG5cdFx0LnJlbmRlcigpXHJcblx0XHQuYnJ1c2hNb2RlKFwiMUQtYXhlc1wiKSAvLyBlbmFibGUgYnJ1c2hpbmdcclxuXHRcdC5hdXRvc2NhbGUoKVxyXG5cdFx0LmludGVyYWN0aXZlKClcclxuXHRcdC5yZW9yZGVyYWJsZSgpO1xyXG5cclxuXHRwb3N0UmVuZGVyKCk7XHJcblxyXG5cdGRlc2lnbkV4cGxvcmVyLmdyYXBocy5wYXJjb29yZHMub24oJ3JlbmRlcicsIF8uZGVib3VuY2UocG9zdFJlbmRlciwgNDAwKSk7XHJcblx0ZGVzaWduRXhwbG9yZXIuZ3JhcGhzLnBhcmNvb3Jkcy5vbignZGltZW5zaW9ucycsIF8uZGVib3VuY2UocG9zdFJlbmRlciwgNDAwKSk7XHJcblx0Ly8gZGVzaWduRXhwbG9yZXIuZ3JhcGhzLnBhcmNvb3Jkcy5vbignYnJ1c2gnLCBfLmRlYm91bmNlKHBvc3RCcnVzaCwgNDAwKSk7XHJcblxyXG5cdGZ1bmN0aW9uIHBvc3RSZW5kZXIoKSB7XHJcblxyXG5cdFx0dmFyIGRvbWFpbkNvbG9ycyA9IFtdO1xyXG5cclxuXHRcdGQzLnNlbGVjdEFsbChkaXZTZWxlY3RvciArICcgZy5kaW1lbnNpb24nKVxyXG5cdFx0XHQuZWFjaChmdW5jdGlvbiAoZCwgaSkge1xyXG5cdFx0XHRcdHZhciBwYXJhbSA9IGRlc2lnbkV4cGxvcmVyLmdldFBhcmFtRnJvbURhdGFrZXkoZCk7XHJcblx0XHRcdFx0dmFyIHBhcmFtQ29sb3IgPSAocGFyYW0udHlwZS5rZXkgPT09ICdpbicpID8gJyM5OTknIDogJyMwMDAnO1xyXG5cdFx0XHRcdHZhciB0aGlzRDMgPSBkMy5zZWxlY3QodGhpcyk7XHJcblxyXG5cdFx0XHRcdHRoaXNEMy5zZWxlY3RBbGwoJ3RleHQubGFiZWwnKVxyXG5cdFx0XHRcdFx0LnRleHQocGFyYW0uZGlzcGxheSlcclxuXHRcdFx0XHRcdC5zdHlsZSgnZmlsbCcsIHBhcmFtQ29sb3IpO1xyXG5cclxuXHRcdFx0XHR0aGlzRDMuc2VsZWN0QWxsKCdwYXRoLmRvbWFpbicpXHJcblx0XHRcdFx0XHQuc3R5bGUoJ3N0cm9rZScsIHBhcmFtQ29sb3IpO1xyXG5cclxuXHRcdFx0XHR0aGlzRDMuc2VsZWN0QWxsKCcgZy50aWNrIHRleHQnKVxyXG5cdFx0XHRcdFx0LnN0eWxlKCdmb250LXNpemUnLCAnOXB4JylcclxuXHRcdFx0XHRcdC5zdHlsZSgnZmlsbCcsIHBhcmFtQ29sb3IpO1xyXG5cclxuXHRcdFx0XHR0aGlzRDMuc2VsZWN0QWxsKCcgZy5icnVzaCByZWN0LmV4dGVudCcpXHJcblx0XHRcdFx0XHQuc3R5bGUoJ2ZpbGwnLCAncmdiYSgyNTUsMjU1LDI1NSwwLjUpJylcclxuXHRcdFx0XHRcdC5vbignY29udGV4dG1lbnUnLCBmdW5jdGlvbiAoZCwgaSkge1xyXG5cdFx0XHRcdFx0XHR2YXIgalRoaXMgPSAkKHRoaXMpO1xyXG5cclxuXHRcdFx0XHRcdFx0aWYgKE51bWJlcihqVGhpcy5hdHRyKCdoZWlnaHQnKSkgPT09IDApIHJldHVybjtcclxuXHJcblx0XHRcdFx0XHRcdGQzLmV2ZW50LnByZXZlbnREZWZhdWx0KCk7XHJcblxyXG5cdFx0XHRcdFx0XHRjb250ZXh0TWVudS5odG1sKCcnKTtcclxuXHRcdFx0XHRcdFx0Y29udGV4dE1lbnUuY3NzKCdsZWZ0JywgZDMuZXZlbnQuY2xpZW50WCk7XHJcblx0XHRcdFx0XHRcdGNvbnRleHRNZW51LmNzcygndG9wJywgZDMuZXZlbnQuY2xpZW50WSk7XHJcblxyXG5cdFx0XHRcdFx0XHR2YXIgbGcgPSAkKCc8dWwgY2xhc3M9XCJsaXN0LWdyb3VwXCI+PC91bD4nKTtcclxuXHJcblx0XHRcdFx0XHRcdHZhciByZXNldEJydXNoID0gJCgnPGEgY2xhc3M9XCJsaXN0LWdyb3VwLWl0ZW1cIj5SZXNldCB0aGVzZSBleHRlbnRzPC9hPicpO1xyXG5cclxuXHRcdFx0XHRcdFx0cmVzZXRCcnVzaC5vbignY2xpY2snLCBmdW5jdGlvbiAoKSB7XHJcblx0XHRcdFx0XHRcdFx0ZGVzaWduRXhwbG9yZXIuZ3JhcGhzLnBhcmNvb3Jkcy5icnVzaFJlc2V0KGQpO1xyXG5cdFx0XHRcdFx0XHR9KTtcclxuXHJcblx0XHRcdFx0XHRcdGxnLmFwcGVuZChyZXNldEJydXNoKTtcclxuXHRcdFx0XHRcdFx0Y29udGV4dE1lbnUuYXBwZW5kKGxnKTtcclxuXHJcblx0XHRcdFx0XHRcdGNvbnRleHRNZW51LnNob3coKTtcclxuXHJcblx0XHRcdFx0XHRcdGxnLm9uKCdjbGljaycsIGZ1bmN0aW9uICgpIHtcclxuXHRcdFx0XHRcdFx0XHRjb250ZXh0TWVudS5oaWRlKCk7XHJcblx0XHRcdFx0XHRcdH0pO1xyXG5cclxuXHRcdFx0XHRcdH0pO1xyXG5cdFx0XHR9KTtcclxuXHJcblx0XHRkZXNpZ25FeHBsb3Jlci5hYnN0cmFjdF9wYXJjb29yZHNfcG9zdFJlbmRlcigpO1xyXG5cdH1cclxuXHJcblx0Ly8gcmVzaXplIG9yIHJlLXJlbmRlciBicmVha3MgdGhlIGJydXNoIG1vZGVcclxuXHQvLyAkKHdpbmRvdylcclxuXHQvLyBcdC5vbigncmVzaXplJywgZnVuY3Rpb24gKCkge1xyXG5cdC8vIFx0XHRkZXNpZ25FeHBsb3Jlci5ncmFwaHMucGFyY29vcmRzLndpZHRoKGRpdi53aWR0aCgpKTtcclxuXHQvLyBcdH0pO1xyXG59O1xyXG5cclxuLypcclxuIOKWiOKWiOKWiOKWiOKWiCAg4paI4paI4paI4paI4paI4paIICDilojilojilojilojilojilojilogg4paI4paI4paI4paI4paI4paI4paI4paIIOKWiOKWiOKWiOKWiOKWiOKWiCAgIOKWiOKWiOKWiOKWiOKWiCAgIOKWiOKWiOKWiOKWiOKWiOKWiCDilojilojilojilojilojilojilojilogg4paI4paI4paI4paI4paI4paI4paIXHJcbuKWiOKWiCAgIOKWiOKWiCDilojiloggICDilojilogg4paI4paIICAgICAgICAg4paI4paIICAgIOKWiOKWiCAgIOKWiOKWiCDilojiloggICDilojilogg4paI4paIICAgICAgICAg4paI4paIICAgIOKWiOKWiFxyXG7ilojilojilojilojilojilojilogg4paI4paI4paI4paI4paI4paIICDilojilojilojilojilojilojiloggICAg4paI4paIICAgIOKWiOKWiOKWiOKWiOKWiOKWiCAg4paI4paI4paI4paI4paI4paI4paIIOKWiOKWiCAgICAgICAgIOKWiOKWiCAgICDilojilojilojilojilojilojilohcclxu4paI4paIICAg4paI4paIIOKWiOKWiCAgIOKWiOKWiCAgICAgIOKWiOKWiCAgICDilojiloggICAg4paI4paIICAg4paI4paIIOKWiOKWiCAgIOKWiOKWiCDilojiloggICAgICAgICDilojiloggICAgICAgICDilojilohcclxu4paI4paIICAg4paI4paIIOKWiOKWiOKWiOKWiOKWiOKWiCAg4paI4paI4paI4paI4paI4paI4paIICAgIOKWiOKWiCAgICDilojiloggICDilojilogg4paI4paIICAg4paI4paIICDilojilojilojilojilojiloggICAg4paI4paIICAgIOKWiOKWiOKWiOKWiOKWiOKWiOKWiFxyXG4qL1xyXG5cclxuLyoqXHJcbiAqIEludGVuZGVkIGZvciBvdmVyd3JpdGUuXHJcbiAqL1xyXG5EZXNpZ25FeHBsb3Jlci5wcm90b3R5cGUuYWJzdHJhY3RfcGFyY29vcmRzX3Bvc3RSZW5kZXIgPSBmdW5jdGlvbiAoKSB7fTtcclxuIiwiRGVzaWduRXhwbG9yZXIucHJvdG90eXBlLnBhcmNvb3Jkc19nZXRDdXJEaW1zID0gZnVuY3Rpb24gKCkge1xyXG5cclxuXHR2YXIgZGVzaWduRXhwbG9yZXIgPSB0aGlzO1xyXG5cclxuXHR2YXIgZGltZW5zaW9ucyA9IGRlc2lnbkV4cGxvcmVyLnBhcmFtc0FsbC5yZWR1Y2UoZnVuY3Rpb24gKHByZXYsIGN1cikge1xyXG5cdFx0aWYgKGN1ci5zaG93bkluUGFyY29vcmRzKSB7XHJcblx0XHRcdHByZXZbY3VyW0Rlc2lnbkV4cGxvcmVyLmRhdGFLZXldXSA9IHt9O1xyXG5cdFx0fVxyXG5cdFx0cmV0dXJuIHByZXY7XHJcblx0fSwge30pO1xyXG5cclxuXHRyZXR1cm4gZGltZW5zaW9ucztcclxuXHJcbn07XHJcbiIsIkRlc2lnbkV4cGxvcmVyLnByb3RvdHlwZS5wYXJjb29yZHNfcmVkcmF3ID0gZnVuY3Rpb24gKCkge1xyXG5cclxuXHR2YXIgZGVzaWduRXhwbG9yZXIgPSB0aGlzO1xyXG5cclxuXHRpZiAoIWRlc2lnbkV4cGxvcmVyLmdyYXBocy5wYXJjb29yZHMpIHJldHVybjtcclxuXHJcblx0ZGVzaWduRXhwbG9yZXIuZ3JhcGhzLnBhcmNvb3Jkcy5kaW1lbnNpb25zKGRlc2lnbkV4cGxvcmVyLnBhcmNvb3Jkc19nZXRDdXJEaW1zKCkpO1xyXG5cclxufTtcclxuIiwiLyoqXHJcbiAqIFRlbGwgdXMgd2hpY2ggcGFyYW0gdG8gY29sb3IgYnlcclxuICogQHBhcmFtIHtvYmplY3R9IHBhcmFtIC0gUGFyYW1ldGVyXHJcbiAqL1xyXG5EZXNpZ25FeHBsb3Jlci5wcm90b3R5cGUuc2V0Q29sb3JlciA9IGZ1bmN0aW9uIChwYXJhbSkge1xyXG5cclxuXHR2YXIgZGVzaWduRXhwbG9yZXIgPSB0aGlzO1xyXG5cclxuXHRkZXNpZ25FeHBsb3Jlci5zZWxlY3RlZFBhcmFtID0gcGFyYW07XHJcblxyXG5cdHZhciBkYXRhID0gZGVzaWduRXhwbG9yZXIuZ2V0RGF0YSgpO1xyXG5cclxuXHR2YXIgZXh0ZW50cyA9IGQzLmV4dGVudChkYXRhLCBkYXRhQWNjZXNzb3IpO1xyXG5cclxuXHR2YXIgY29sb3JTY2FsZSA9IGQzLnNjYWxlLmxpbmVhcigpXHJcblx0XHQuZG9tYWluKGV4dGVudHMpXHJcblx0XHQucmFuZ2UoW1wiIzNiMzFiMFwiLCBcIiM2NkNDRERcIl0pO1xyXG5cclxuXHRkZXNpZ25FeHBsb3Jlci5jb2xvcmVyID0gZnVuY3Rpb24gKGQpIHtcclxuXHRcdHJldHVybiBjb2xvclNjYWxlKGRhdGFBY2Nlc3NvcihkKSk7XHJcblx0fTtcclxuXHJcblx0aWYoZGVzaWduRXhwbG9yZXIuZ3JhcGhzLnBhcmNvb3Jkcykge1xyXG5cdFx0ZGVzaWduRXhwbG9yZXIuZ3JhcGhzLnBhcmNvb3Jkcy5jb2xvcihkZXNpZ25FeHBsb3Jlci5jb2xvcmVyKS5yZW5kZXIoKTtcclxuXHR9XHJcblxyXG5cdGZ1bmN0aW9uIGRhdGFBY2Nlc3NvcihkKSB7XHJcblx0XHRyZXR1cm4gZFtwYXJhbVtEZXNpZ25FeHBsb3Jlci5kYXRhS2V5XV07XHJcblx0fVxyXG5cclxufTtcclxuIl19
