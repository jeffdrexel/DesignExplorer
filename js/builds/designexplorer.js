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

	console.log(key, param.cleanKey);

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

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImhlYWRlci5qcyIsImNvbnN0cnVjdG9ycy9QYXJhbS5qcyIsImNvbnN0cnVjdG9ycy9QYXJhbUN1c3RvbS5qcyIsInN0YXRpY3MvdHlwZURpc3BsYXlEaWN0aW9uYXJ5LmpzIiwicGFydGlhbHMvYWRkQ3VzdG9tUGFyYW0uanMiLCJwYXJ0aWFscy9nZXRJdGVyYXRpb25UYWJsZS5qcyIsInBhcnRpYWxzL2dldFBhcmFtRnJvbURhdGFrZXkuanMiLCJwYXJ0aWFscy9wYXJjb29yZHNfY3JlYXRlLmpzIiwicGFydGlhbHMvcGFyY29vcmRzX2dldEN1ckRpbXMuanMiLCJwYXJ0aWFscy9wYXJjb29yZHNfcmVkcmF3LmpzIiwicGFydGlhbHMvc2V0Q29sb3Jlci5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQzFGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUN2QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNsQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDakJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNiQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUMxQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ1BBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNoSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDZEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNUQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImRlc2lnbmV4cGxvcmVyLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXHJcbiAqIEBjb25zdHJ1Y3RvclxyXG4gKi9cclxudmFyIERlc2lnbkV4cGxvcmVyID0gZnVuY3Rpb24gKG9yaWdpbmFsRGF0YSkge1xyXG5cclxuXHQvKipcclxuXHQgKiBAbGVuZHMgRGVzaWduRXhwbG9yZXIucHJvdG90eXBlXHJcblx0ICovXHJcblx0dmFyIGRlc2lnbkV4cGxvcmVyID0gdGhpcztcclxuXHJcblx0dmFyIGRhdGEgPSBbXTtcclxuXHJcblx0Ly8gRGljdGlvbmFyaWVkIHBhcmFtc1xyXG5cdGRlc2lnbkV4cGxvcmVyLnBhcmFtcyA9IHtcclxuXHRcdCdjdXN0b20nOltdXHJcblx0fTtcclxuXHJcblx0Ly8gQWxsIHBhcmFtc1xyXG5cdGRlc2lnbkV4cGxvcmVyLnBhcmFtc0FsbCA9IFtdO1xyXG5cclxuXHQvLyBTZXQgbGF0ZXIgYnkgc2V0Q29sb3JlclxyXG5cdGRlc2lnbkV4cGxvcmVyLnNlbGVjdGVkUGFyYW0gPSBudWxsO1xyXG5cclxuXHQvLyBBbGwgZ3JhcGhzIG5hbWVzcGFjZVxyXG5cdGRlc2lnbkV4cGxvcmVyLmdyYXBocyA9IHt9O1xyXG5cclxuXHRzb3J0S2V5cygpO1xyXG5cdGNsZWFuRGF0YSgpO1xyXG5cclxuXHQvLyBBY2Nlc3MgdGhpcyBkYXRhIGxhdGVyXHJcblx0RGVzaWduRXhwbG9yZXIucHJvdG90eXBlLmdldERhdGEgPSBmdW5jdGlvbiAoKSB7XHJcblx0XHRyZXR1cm4gZGF0YTtcclxuXHR9O1xyXG5cclxuXHQvLyBTZXQgZGVmYXVsdCBzb3J0IGJ5IGtleVxyXG5cdGRlc2lnbkV4cGxvcmVyLnNldENvbG9yZXIoZGVzaWduRXhwbG9yZXIucGFyYW1zLmluWzBdKTtcclxuXHJcblx0LypcclxuXHQg4paI4paI4paI4paI4paIICDilojilojiloggICAg4paI4paIICDilojilojilojilojilojiloggIOKWiOKWiOKWiCAgICDilojilohcclxuXHTilojiloggICDilojilogg4paI4paI4paI4paIICAg4paI4paIIOKWiOKWiCAgICDilojilogg4paI4paI4paI4paIICAg4paI4paIXHJcblx04paI4paI4paI4paI4paI4paI4paIIOKWiOKWiCDilojiloggIOKWiOKWiCDilojiloggICAg4paI4paIIOKWiOKWiCDilojiloggIOKWiOKWiFxyXG5cdOKWiOKWiCAgIOKWiOKWiCDilojiloggIOKWiOKWiCDilojilogg4paI4paIICAgIOKWiOKWiCDilojiloggIOKWiOKWiCDilojilohcclxuXHTilojiloggICDilojilogg4paI4paIICAg4paI4paI4paI4paIICDilojilojilojilojilojiloggIOKWiOKWiCAgIOKWiOKWiOKWiOKWiFxyXG5cdCovXHJcblxyXG5cdGZ1bmN0aW9uIHNvcnRLZXlzKCkge1xyXG5cdFx0Ly8gSW5pdGlhbCBDbGVhbnVwXHJcblx0XHR2YXIga2V5cyA9IGQzLmtleXMob3JpZ2luYWxEYXRhWzBdKTtcclxuXHJcblx0XHQvLyBQb3B1bGF0ZSB3aGljaCBhcmUgaW5wdXQgYW5kIG91dHB1dCBrZXlzXHJcblx0XHRrZXlzLmZvckVhY2goZnVuY3Rpb24gKGtleSkge1xyXG5cdFx0XHRPYmplY3Qua2V5cyhEZXNpZ25FeHBsb3Jlci50eXBlRGlzcGxheURpY3Rpb25hcnkpXHJcblx0XHRcdFx0LmZvckVhY2goZnVuY3Rpb24gKGtleVR5cGUpIHtcclxuXHRcdFx0XHRcdHZhciB0eXBlID0gRGVzaWduRXhwbG9yZXIudHlwZURpc3BsYXlEaWN0aW9uYXJ5W2tleVR5cGVdO1xyXG5cdFx0XHRcdFx0dmFyIHNpZ25pZmllciA9IHR5cGUuc2lnbmlmaWVyO1xyXG5cdFx0XHRcdFx0dmFyIGtleU9iajtcclxuXHRcdFx0XHRcdGlmIChrZXkuc3RhcnRzV2l0aChzaWduaWZpZXIpKSB7XHJcblx0XHRcdFx0XHRcdGtleU9iaiA9IG5ldyBEZXNpZ25FeHBsb3Jlci5QYXJhbShrZXksIHR5cGUpO1xyXG5cdFx0XHRcdFx0XHRkZXNpZ25FeHBsb3Jlci5wYXJhbXNBbGwucHVzaChrZXlPYmopO1xyXG5cdFx0XHRcdFx0XHRkZXNpZ25FeHBsb3Jlci5wYXJhbXNba2V5VHlwZV0gPSBkZXNpZ25FeHBsb3Jlci5wYXJhbXNba2V5VHlwZV0gfHwgW107XHJcblx0XHRcdFx0XHRcdGRlc2lnbkV4cGxvcmVyLnBhcmFtc1trZXlUeXBlXS5wdXNoKGtleU9iaik7XHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0fSk7XHJcblx0XHR9KTtcclxuXHR9XHJcblxyXG5cdGZ1bmN0aW9uIGNsZWFuRGF0YSgpIHtcclxuXHRcdC8vIGNsZWFuIGRhdGFcclxuXHRcdG9yaWdpbmFsRGF0YS5mb3JFYWNoKGZ1bmN0aW9uIChkYXR1bSwgaSkge1xyXG5cdFx0XHR2YXIgY2xlYW5lZERhdHVtID0ge1xyXG5cdFx0XHRcdF9pZDogaVxyXG5cdFx0XHR9O1xyXG5cclxuXHRcdFx0T2JqZWN0LmtleXMoZGF0dW0pXHJcblx0XHRcdFx0LmZvckVhY2goZnVuY3Rpb24gKGtleSkge1xyXG5cdFx0XHRcdFx0dmFyIGtleU9iaiA9IGRlc2lnbkV4cGxvcmVyLnBhcmFtc0FsbC5yZWR1Y2UoZnVuY3Rpb24gKHByZXYsIGN1cikge1xyXG5cdFx0XHRcdFx0XHRyZXR1cm4gY3VyLm9yaWdpbmFsID09PSBrZXkgPyBjdXIgOiBwcmV2O1xyXG5cdFx0XHRcdFx0fSwgbnVsbCk7XHJcblx0XHRcdFx0XHR2YXIgZmxvYXRWZXJzaW9uID0gcGFyc2VGbG9hdChkYXR1bVtrZXldKTtcclxuXHRcdFx0XHRcdHZhciBjbGVhbktleSA9IGtleU9iaiA/IGtleU9ialtEZXNpZ25FeHBsb3Jlci5kYXRhS2V5XSA6IGtleTtcclxuXHRcdFx0XHRcdGNsZWFuZWREYXR1bVtjbGVhbktleV0gPSBpc05hTihmbG9hdFZlcnNpb24pID8gZGF0dW1ba2V5XSA6IGZsb2F0VmVyc2lvbjtcclxuXHRcdFx0XHR9KTtcclxuXHJcblx0XHRcdGRhdGEucHVzaChjbGVhbmVkRGF0dW0pO1xyXG5cdFx0fSk7XHJcblx0fVxyXG5cclxufTtcclxuXHJcbkRlc2lnbkV4cGxvcmVyLmRhdGFLZXkgPSAnY2xlYW5LZXknO1xyXG4iLCJEZXNpZ25FeHBsb3Jlci5QYXJhbSA9IGZ1bmN0aW9uIChrZXksIHR5cGUpIHtcclxuXHR2YXIgcGFyYW0gPSB0aGlzO1xyXG5cclxuXHRwYXJhbS5vcmlnaW5hbCA9IGtleTtcclxuXHJcblx0cGFyYW0uZGlzcGxheSA9IGtleS5zdWJzdHJpbmcodHlwZS5zaWduaWZpZXIubGVuZ3RoLCBrZXkubGVuZ3RoKTtcclxuXHJcblx0cGFyYW0udHlwZSA9IHR5cGU7XHJcblxyXG5cdHBhcmFtLmNsZWFuS2V5ID0ga2V5LnJlcGxhY2UoJzonLCAnXycpXHJcblx0XHQucmVwbGFjZSgnWycsICdfJylcclxuXHRcdC5yZXBsYWNlKCddJywgJ18nKVxyXG5cdFx0LnJlcGxhY2UoJyAnLCAnXycpXHJcblx0XHQucmVwbGFjZSgnICcsICdfJyk7XHJcblxyXG5cdC8vIHBhcmFtLmNsZWFuS2V5PWtleS5yZXBsYWNlKC9bIVxcXCIjJCUmJ1xcKFxcKVxcKlxcKyxcXC5cXC86Ozw9PlxcP1xcQFxcW1xcXFxcXF1cXF5gXFx7XFx8XFx9fl0vZywgJ18nKTtcclxuXHJcblx0Y29uc29sZS5sb2coa2V5LCBwYXJhbS5jbGVhbktleSk7XHJcblxyXG5cdHBhcmFtLnNob3duSW5QYXJjb29yZHMgPSB0cnVlO1xyXG5cclxuXHRyZXR1cm4gdGhpcztcclxufTtcclxuIiwiKGZ1bmN0aW9uICgpIHtcclxuXHJcblx0dmFyIGN1c3RvbVBhcmFtQ291bnQgPSAwO1xyXG5cclxuXHREZXNpZ25FeHBsb3Jlci5QYXJhbUN1c3RvbSA9IGZ1bmN0aW9uICgpIHtcclxuXHJcblx0XHRjdXN0b21QYXJhbUNvdW50ICs9IDE7XHJcblxyXG5cdFx0RGVzaWduRXhwbG9yZXIuUGFyYW0uYXBwbHkodGhpcywgWydjdXN0b206JyArIGN1c3RvbVBhcmFtQ291bnQsIERlc2lnbkV4cGxvcmVyLnR5cGVEaXNwbGF5RGljdGlvbmFyeS5jdXN0b21dKTtcclxuXHJcblx0XHR2YXIgY3VzdG9tUGFyYW0gPSB0aGlzO1xyXG5cclxuXHR9O1xyXG5cclxuXHREZXNpZ25FeHBsb3Jlci5QYXJhbUN1c3RvbS5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKERlc2lnbkV4cGxvcmVyLlBhcmFtLnByb3RvdHlwZSk7XHJcblxyXG5cclxufSkoKTtcclxuIiwiRGVzaWduRXhwbG9yZXIudHlwZURpc3BsYXlEaWN0aW9uYXJ5PXtcclxuICAnaW4nOntcclxuICAgICdzaWduaWZpZXInOiAnaW46JyxcclxuICAgICdrZXknOiAnaW4nLFxyXG4gICAgJ2Rpc3BsYXknOidJbnB1dCcsXHJcbiAgfSxcclxuICAnb3V0Jzp7XHJcbiAgICAnc2lnbmlmaWVyJzogJ291dDonLFxyXG4gICAgJ2tleSc6ICdvdXQnLFxyXG4gICAgJ2Rpc3BsYXknOidPdXRwdXQnXHJcbiAgfSxcclxuICAnY3VzdG9tJzp7XHJcbiAgICAnc2lnbmlmaWVyJzogJ2N1c3RvbTonLFxyXG4gICAgJ2tleSc6ICdjdXN0b20nLFxyXG4gICAgJ2Rpc3BsYXknOidDdXN0b20gT3V0cHV0J1xyXG4gIH0sXHJcbn07XHJcbiIsIlxyXG5cclxuXHREZXNpZ25FeHBsb3Jlci5wcm90b3R5cGUuYWRkQ3VzdG9tUGFyYW0gPSBmdW5jdGlvbiAoKSB7XHJcblx0XHR2YXIgZGVzaWduRXhwbG9yZXIgPSB0aGlzO1xyXG5cclxuXHRcdGNyZWF0ZWRDdXN0b21Db3VudCArPSAxO1xyXG5cclxuXHRcdHZhciBwYXJhbSA9IG5ldyBEZXNpZ25FeHBsb3Jlci5QYXJhbUN1c3RvbSgpO1xyXG5cclxuXHRcdGRlc2lnbkV4cGxvcmVyLnBhcmFtcy5jdXN0b20ucHVzaChwYXJhbSk7XHJcblx0XHRkZXNpZ25FeHBsb3Jlci5wYXJhbXNBbGwucHVzaChjdXN0b20pO1xyXG5cclxuXHR9O1xyXG4iLCJEZXNpZ25FeHBsb3Jlci5wcm90b3R5cGUucG9wdWxhdGVJdGVyYXRpb25UYWJsZT1mdW5jdGlvbihqcUVsZW1lbnQsaXRlcmF0aW9uKXtcclxuICB2YXIgZGVzaWduRXhwbG9yZXI9dGhpcztcclxuXHJcbiAgdmFyIHBhcmFtVHlwZXMgPSBPYmplY3Qua2V5cyhkZXNpZ25FeHBsb3Jlci5wYXJhbXMpO1xyXG5cclxuICBqcUVsZW1lbnQuaHRtbCgnJyk7XHJcblxyXG4gIHBhcmFtVHlwZXMuZm9yRWFjaChmdW5jdGlvbiAoa2V5KSB7XHJcbiAgICB2YXIgdHlwZSA9IERlc2lnbkV4cGxvcmVyLnR5cGVEaXNwbGF5RGljdGlvbmFyeVtrZXldO1xyXG4gICAgdmFyIHRhYmxlID0gJCgnPHRhYmxlIGNsYXNzPVwidGFibGUgdGFibGUtY29uZGVuc2VkXCI+PC90YWJsZT4nKTtcclxuICAgIHZhciBwYXJhbXMgPSBkZXNpZ25FeHBsb3Jlci5wYXJhbXNba2V5XTtcclxuICAgIHBhcmFtcy5mb3JFYWNoKGZ1bmN0aW9uIChwYXJhbSkge1xyXG4gICAgICB2YXIgcm93ID0gJCgnPHRyPjwvdHI+Jyk7XHJcbiAgICAgIHJvdy5hcHBlbmQoJzx0ZD4nICsgcGFyYW0uZGlzcGxheSArICc8L3RkPicpO1xyXG4gICAgICByb3cuYXBwZW5kKCc8dGQ+JyArIGl0ZXJhdGlvbltwYXJhbVtEZXNpZ25FeHBsb3Jlci5kYXRhS2V5XV0gKyAnPC90ZD4nKTtcclxuICAgICAgdGFibGUuYXBwZW5kKHJvdyk7XHJcblxyXG4gICAgICBpZiAocGFyYW0gPT09IGRlc2lnbkV4cGxvcmVyLnNlbGVjdGVkUGFyYW0pIHJvdy5jc3MoJ2JvcmRlci1sZWZ0JywgJzVweCBzb2xpZCAnICsgZGVzaWduRXhwbG9yZXIuY29sb3JlcihpdGVyYXRpb24pKVxyXG4gICAgICAgIC5jc3MoJ2ZvbnQtd2VpZ2h0JywgJ2JvbGQnKTtcclxuICAgIH0pO1xyXG4gICAganFFbGVtZW50LmFwcGVuZCgnPGg0PicgKyB0eXBlLmRpc3BsYXkgKyAnczwvaDQ+Jyk7XHJcbiAgICBqcUVsZW1lbnQuYXBwZW5kKHRhYmxlKTtcclxuICB9KTtcclxuXHJcblxyXG59O1xyXG4iLCJEZXNpZ25FeHBsb3Jlci5wcm90b3R5cGUuZ2V0UGFyYW1Gcm9tRGF0YWtleSA9IGZ1bmN0aW9uIChkYXRhS2V5KSB7XHJcblx0dmFyIGRlc2lnbkV4cGxvcmVyID0gdGhpcztcclxuXHJcblx0cmV0dXJuIGRlc2lnbkV4cGxvcmVyLnBhcmFtc0FsbC5yZWR1Y2UoZnVuY3Rpb24gKHByZXYsIGN1cikge1xyXG5cdFx0cmV0dXJuIGN1cltEZXNpZ25FeHBsb3Jlci5kYXRhS2V5XSA9PT0gZGF0YUtleSA/IGN1ciA6IHByZXY7XHJcblx0fSwgbnVsbCk7XHJcbn07XHJcbiIsIkRlc2lnbkV4cGxvcmVyLnByb3RvdHlwZS5wYXJjb29yZHNfY3JlYXRlID0gZnVuY3Rpb24gKGRpdlNlbGVjdG9yKSB7XHJcblxyXG5cdHZhciBkZXNpZ25FeHBsb3JlciA9IHRoaXM7XHJcblxyXG5cdGRlc2lnbkV4cGxvcmVyLmdyYXBocy5fcGFyY29vcmRzRGl2U2VsZWN0b3IgPSBkaXZTZWxlY3RvcjtcclxuXHJcblx0dmFyIGRpdiA9ICQoZGl2U2VsZWN0b3IpO1xyXG5cclxuXHR2YXIgY29udGV4dE1lbnUgPSAkKCcjY29udGV4dC1tZW51Jyk7XHJcblxyXG5cdGRpdi5odG1sKCcnKTtcclxuXHJcblx0ZGl2LmFkZENsYXNzKCdwYXJjb29yZHMnKTtcclxuXHJcblx0dmFyIGRpbWVuc2lvbnMgPSBkZXNpZ25FeHBsb3Jlci5wYXJjb29yZHNfZ2V0Q3VyRGltcygpO1xyXG5cclxuXHRkZXNpZ25FeHBsb3Jlci5ncmFwaHMucGFyY29vcmRzID0gZDMucGFyY29vcmRzKCkoZGl2U2VsZWN0b3IpXHJcblx0XHQuZGF0YShkZXNpZ25FeHBsb3Jlci5nZXREYXRhKCkpXHJcblx0XHQuY29sb3IoZGVzaWduRXhwbG9yZXIuY29sb3JlcilcclxuXHRcdC5hbHBoYSgwLjIpXHJcblx0XHQuYWxwaGFPbkJydXNoZWQoMC4wNSlcclxuXHRcdC5tb2RlKFwicXVldWVcIilcclxuXHRcdC5yYXRlKDIwKVxyXG5cdFx0LmRpbWVuc2lvbnMoZGltZW5zaW9ucylcclxuXHRcdC5yZW5kZXIoKVxyXG5cdFx0LmJydXNoTW9kZShcIjFELWF4ZXNcIikgLy8gZW5hYmxlIGJydXNoaW5nXHJcblx0XHQuYXV0b3NjYWxlKClcclxuXHRcdC5pbnRlcmFjdGl2ZSgpXHJcblx0XHQucmVvcmRlcmFibGUoKTtcclxuXHJcblx0cG9zdFJlbmRlcigpO1xyXG5cclxuXHRkZXNpZ25FeHBsb3Jlci5ncmFwaHMucGFyY29vcmRzLm9uKCdyZW5kZXInLCBfLmRlYm91bmNlKHBvc3RSZW5kZXIsIDQwMCkpO1xyXG5cdGRlc2lnbkV4cGxvcmVyLmdyYXBocy5wYXJjb29yZHMub24oJ2RpbWVuc2lvbnMnLCBfLmRlYm91bmNlKHBvc3RSZW5kZXIsIDQwMCkpO1xyXG5cdC8vIGRlc2lnbkV4cGxvcmVyLmdyYXBocy5wYXJjb29yZHMub24oJ2JydXNoJywgXy5kZWJvdW5jZShwb3N0QnJ1c2gsIDQwMCkpO1xyXG5cclxuXHRmdW5jdGlvbiBwb3N0UmVuZGVyKCkge1xyXG5cclxuXHRcdHZhciBkb21haW5Db2xvcnMgPSBbXTtcclxuXHJcblx0XHRkMy5zZWxlY3RBbGwoZGl2U2VsZWN0b3IgKyAnIGcuZGltZW5zaW9uJylcclxuXHRcdFx0LmVhY2goZnVuY3Rpb24gKGQsIGkpIHtcclxuXHRcdFx0XHR2YXIgcGFyYW0gPSBkZXNpZ25FeHBsb3Jlci5nZXRQYXJhbUZyb21EYXRha2V5KGQpO1xyXG5cdFx0XHRcdHZhciBwYXJhbUNvbG9yID0gKHBhcmFtLnR5cGUua2V5ID09PSAnaW4nKSA/ICcjOTk5JyA6ICcjMDAwJztcclxuXHRcdFx0XHR2YXIgdGhpc0QzID0gZDMuc2VsZWN0KHRoaXMpO1xyXG5cclxuXHRcdFx0XHR0aGlzRDMuc2VsZWN0QWxsKCd0ZXh0LmxhYmVsJylcclxuXHRcdFx0XHRcdC50ZXh0KHBhcmFtLmRpc3BsYXkpXHJcblx0XHRcdFx0XHQuc3R5bGUoJ2ZpbGwnLCBwYXJhbUNvbG9yKTtcclxuXHJcblx0XHRcdFx0dGhpc0QzLnNlbGVjdEFsbCgncGF0aC5kb21haW4nKVxyXG5cdFx0XHRcdFx0LnN0eWxlKCdzdHJva2UnLCBwYXJhbUNvbG9yKTtcclxuXHJcblx0XHRcdFx0dGhpc0QzLnNlbGVjdEFsbCgnIGcudGljayB0ZXh0JylcclxuXHRcdFx0XHRcdC5zdHlsZSgnZm9udC1zaXplJywgJzlweCcpXHJcblx0XHRcdFx0XHQuc3R5bGUoJ2ZpbGwnLCBwYXJhbUNvbG9yKTtcclxuXHJcblx0XHRcdFx0dGhpc0QzLnNlbGVjdEFsbCgnIGcuYnJ1c2ggcmVjdC5leHRlbnQnKVxyXG5cdFx0XHRcdFx0LnN0eWxlKCdmaWxsJywgJ3JnYmEoMjU1LDI1NSwyNTUsMC41KScpXHJcblx0XHRcdFx0XHQub24oJ2NvbnRleHRtZW51JywgZnVuY3Rpb24gKGQsIGkpIHtcclxuXHRcdFx0XHRcdFx0dmFyIGpUaGlzID0gJCh0aGlzKTtcclxuXHJcblx0XHRcdFx0XHRcdGlmIChOdW1iZXIoalRoaXMuYXR0cignaGVpZ2h0JykpID09PSAwKSByZXR1cm47XHJcblxyXG5cdFx0XHRcdFx0XHRkMy5ldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xyXG5cclxuXHRcdFx0XHRcdFx0Y29udGV4dE1lbnUuaHRtbCgnJyk7XHJcblx0XHRcdFx0XHRcdGNvbnRleHRNZW51LmNzcygnbGVmdCcsIGQzLmV2ZW50LmNsaWVudFgpO1xyXG5cdFx0XHRcdFx0XHRjb250ZXh0TWVudS5jc3MoJ3RvcCcsIGQzLmV2ZW50LmNsaWVudFkpO1xyXG5cclxuXHRcdFx0XHRcdFx0dmFyIGxnID0gJCgnPHVsIGNsYXNzPVwibGlzdC1ncm91cFwiPjwvdWw+Jyk7XHJcblxyXG5cdFx0XHRcdFx0XHR2YXIgcmVzZXRCcnVzaCA9ICQoJzxhIGNsYXNzPVwibGlzdC1ncm91cC1pdGVtXCI+UmVzZXQgdGhlc2UgZXh0ZW50czwvYT4nKTtcclxuXHJcblx0XHRcdFx0XHRcdHJlc2V0QnJ1c2gub24oJ2NsaWNrJywgZnVuY3Rpb24gKCkge1xyXG5cdFx0XHRcdFx0XHRcdGRlc2lnbkV4cGxvcmVyLmdyYXBocy5wYXJjb29yZHMuYnJ1c2hSZXNldChkKTtcclxuXHRcdFx0XHRcdFx0fSk7XHJcblxyXG5cdFx0XHRcdFx0XHRsZy5hcHBlbmQocmVzZXRCcnVzaCk7XHJcblx0XHRcdFx0XHRcdGNvbnRleHRNZW51LmFwcGVuZChsZyk7XHJcblxyXG5cdFx0XHRcdFx0XHRjb250ZXh0TWVudS5zaG93KCk7XHJcblxyXG5cdFx0XHRcdFx0XHRsZy5vbignY2xpY2snLCBmdW5jdGlvbiAoKSB7XHJcblx0XHRcdFx0XHRcdFx0Y29udGV4dE1lbnUuaGlkZSgpO1xyXG5cdFx0XHRcdFx0XHR9KTtcclxuXHJcblx0XHRcdFx0XHR9KTtcclxuXHRcdFx0fSk7XHJcblxyXG5cdFx0ZGVzaWduRXhwbG9yZXIuYWJzdHJhY3RfcGFyY29vcmRzX3Bvc3RSZW5kZXIoKTtcclxuXHR9XHJcblxyXG5cdC8vIHJlc2l6ZSBvciByZS1yZW5kZXIgYnJlYWtzIHRoZSBicnVzaCBtb2RlXHJcblx0Ly8gJCh3aW5kb3cpXHJcblx0Ly8gXHQub24oJ3Jlc2l6ZScsIGZ1bmN0aW9uICgpIHtcclxuXHQvLyBcdFx0ZGVzaWduRXhwbG9yZXIuZ3JhcGhzLnBhcmNvb3Jkcy53aWR0aChkaXYud2lkdGgoKSk7XHJcblx0Ly8gXHR9KTtcclxufTtcclxuXHJcbi8qXHJcbiDilojilojilojilojiloggIOKWiOKWiOKWiOKWiOKWiOKWiCAg4paI4paI4paI4paI4paI4paI4paIIOKWiOKWiOKWiOKWiOKWiOKWiOKWiOKWiCDilojilojilojilojilojiloggICDilojilojilojilojiloggICDilojilojilojilojilojilogg4paI4paI4paI4paI4paI4paI4paI4paIIOKWiOKWiOKWiOKWiOKWiOKWiOKWiFxyXG7ilojiloggICDilojilogg4paI4paIICAg4paI4paIIOKWiOKWiCAgICAgICAgIOKWiOKWiCAgICDilojiloggICDilojilogg4paI4paIICAg4paI4paIIOKWiOKWiCAgICAgICAgIOKWiOKWiCAgICDilojilohcclxu4paI4paI4paI4paI4paI4paI4paIIOKWiOKWiOKWiOKWiOKWiOKWiCAg4paI4paI4paI4paI4paI4paI4paIICAgIOKWiOKWiCAgICDilojilojilojilojilojiloggIOKWiOKWiOKWiOKWiOKWiOKWiOKWiCDilojiloggICAgICAgICDilojiloggICAg4paI4paI4paI4paI4paI4paI4paIXHJcbuKWiOKWiCAgIOKWiOKWiCDilojiloggICDilojiloggICAgICDilojiloggICAg4paI4paIICAgIOKWiOKWiCAgIOKWiOKWiCDilojiloggICDilojilogg4paI4paIICAgICAgICAg4paI4paIICAgICAgICAg4paI4paIXHJcbuKWiOKWiCAgIOKWiOKWiCDilojilojilojilojilojiloggIOKWiOKWiOKWiOKWiOKWiOKWiOKWiCAgICDilojiloggICAg4paI4paIICAg4paI4paIIOKWiOKWiCAgIOKWiOKWiCAg4paI4paI4paI4paI4paI4paIICAgIOKWiOKWiCAgICDilojilojilojilojilojilojilohcclxuKi9cclxuXHJcbi8qKlxyXG4gKiBJbnRlbmRlZCBmb3Igb3ZlcndyaXRlLlxyXG4gKi9cclxuRGVzaWduRXhwbG9yZXIucHJvdG90eXBlLmFic3RyYWN0X3BhcmNvb3Jkc19wb3N0UmVuZGVyID0gZnVuY3Rpb24gKCkge307XHJcbiIsIkRlc2lnbkV4cGxvcmVyLnByb3RvdHlwZS5wYXJjb29yZHNfZ2V0Q3VyRGltcyA9IGZ1bmN0aW9uICgpIHtcclxuXHJcblx0dmFyIGRlc2lnbkV4cGxvcmVyID0gdGhpcztcclxuXHJcblx0dmFyIGRpbWVuc2lvbnMgPSBkZXNpZ25FeHBsb3Jlci5wYXJhbXNBbGwucmVkdWNlKGZ1bmN0aW9uIChwcmV2LCBjdXIpIHtcclxuXHRcdGlmIChjdXIuc2hvd25JblBhcmNvb3Jkcykge1xyXG5cdFx0XHRwcmV2W2N1cltEZXNpZ25FeHBsb3Jlci5kYXRhS2V5XV0gPSB7fTtcclxuXHRcdH1cclxuXHRcdHJldHVybiBwcmV2O1xyXG5cdH0sIHt9KTtcclxuXHJcblx0cmV0dXJuIGRpbWVuc2lvbnM7XHJcblxyXG59O1xyXG4iLCJEZXNpZ25FeHBsb3Jlci5wcm90b3R5cGUucGFyY29vcmRzX3JlZHJhdyA9IGZ1bmN0aW9uICgpIHtcclxuXHJcblx0dmFyIGRlc2lnbkV4cGxvcmVyID0gdGhpcztcclxuXHJcblx0aWYgKCFkZXNpZ25FeHBsb3Jlci5ncmFwaHMucGFyY29vcmRzKSByZXR1cm47XHJcblxyXG5cdGRlc2lnbkV4cGxvcmVyLmdyYXBocy5wYXJjb29yZHMuZGltZW5zaW9ucyhkZXNpZ25FeHBsb3Jlci5wYXJjb29yZHNfZ2V0Q3VyRGltcygpKTtcclxuXHJcbn07XHJcbiIsIi8qKlxyXG4gKiBUZWxsIHVzIHdoaWNoIHBhcmFtIHRvIGNvbG9yIGJ5XHJcbiAqIEBwYXJhbSB7b2JqZWN0fSBwYXJhbSAtIFBhcmFtZXRlclxyXG4gKi9cclxuRGVzaWduRXhwbG9yZXIucHJvdG90eXBlLnNldENvbG9yZXIgPSBmdW5jdGlvbiAocGFyYW0pIHtcclxuXHJcblx0dmFyIGRlc2lnbkV4cGxvcmVyID0gdGhpcztcclxuXHJcblx0ZGVzaWduRXhwbG9yZXIuc2VsZWN0ZWRQYXJhbSA9IHBhcmFtO1xyXG5cclxuXHR2YXIgZGF0YSA9IGRlc2lnbkV4cGxvcmVyLmdldERhdGEoKTtcclxuXHJcblx0dmFyIGV4dGVudHMgPSBkMy5leHRlbnQoZGF0YSwgZGF0YUFjY2Vzc29yKTtcclxuXHJcblx0dmFyIGNvbG9yU2NhbGUgPSBkMy5zY2FsZS5saW5lYXIoKVxyXG5cdFx0LmRvbWFpbihleHRlbnRzKVxyXG5cdFx0LnJhbmdlKFtcIiMzYjMxYjBcIiwgXCIjNjZDQ0REXCJdKTtcclxuXHJcblx0ZGVzaWduRXhwbG9yZXIuY29sb3JlciA9IGZ1bmN0aW9uIChkKSB7XHJcblx0XHRyZXR1cm4gY29sb3JTY2FsZShkYXRhQWNjZXNzb3IoZCkpO1xyXG5cdH07XHJcblxyXG5cdGlmKGRlc2lnbkV4cGxvcmVyLmdyYXBocy5wYXJjb29yZHMpIHtcclxuXHRcdGRlc2lnbkV4cGxvcmVyLmdyYXBocy5wYXJjb29yZHMuY29sb3IoZGVzaWduRXhwbG9yZXIuY29sb3JlcikucmVuZGVyKCk7XHJcblx0fVxyXG5cclxuXHRmdW5jdGlvbiBkYXRhQWNjZXNzb3IoZCkge1xyXG5cdFx0cmV0dXJuIGRbcGFyYW1bRGVzaWduRXhwbG9yZXIuZGF0YUtleV1dO1xyXG5cdH1cclxuXHJcbn07XHJcbiJdfQ==
