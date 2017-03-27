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
  }
};

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImhlYWRlci5qcyIsImNvbnN0cnVjdG9ycy9QYXJhbS5qcyIsInBhcnRpYWxzL2dldEl0ZXJhdGlvblRhYmxlLmpzIiwicGFydGlhbHMvZ2V0UGFyYW1Gcm9tRGF0YWtleS5qcyIsInBhcnRpYWxzL3BhcmNvb3Jkc19jcmVhdGUuanMiLCJwYXJ0aWFscy9wYXJjb29yZHNfZ2V0Q3VyRGltcy5qcyIsInBhcnRpYWxzL3BhcmNvb3Jkc19yZWRyYXcuanMiLCJwYXJ0aWFscy9zZXRDb2xvcmVyLmpzIiwic3RhdGljcy90eXBlRGlzcGxheURpY3Rpb25hcnkuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3hGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ2ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQzFCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDUEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ2hIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNkQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ1RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUMvQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZGVzaWduZXhwbG9yZXIuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcclxuICogQGNvbnN0cnVjdG9yXHJcbiAqL1xyXG52YXIgRGVzaWduRXhwbG9yZXIgPSBmdW5jdGlvbiAob3JpZ2luYWxEYXRhKSB7XHJcblxyXG5cdC8qKlxyXG5cdCAqIEBsZW5kcyBEZXNpZ25FeHBsb3Jlci5wcm90b3R5cGVcclxuXHQgKi9cclxuXHR2YXIgZGVzaWduRXhwbG9yZXIgPSB0aGlzO1xyXG5cclxuXHR2YXIgZGF0YSA9IFtdO1xyXG5cclxuXHQvLyBEaWN0aW9uYXJpZWQgcGFyYW1zXHJcblx0ZGVzaWduRXhwbG9yZXIucGFyYW1zID0ge307XHJcblxyXG5cdC8vIEFsbCBwYXJhbXNcclxuXHRkZXNpZ25FeHBsb3Jlci5wYXJhbXNBbGwgPSBbXTtcclxuXHJcblx0Ly8gU2V0IGxhdGVyIGJ5IHNldENvbG9yZXJcclxuXHRkZXNpZ25FeHBsb3Jlci5zZWxlY3RlZFBhcmFtID0gbnVsbDtcclxuXHJcblx0Ly8gQWxsIGdyYXBocyBuYW1lc3BhY2VcclxuXHRkZXNpZ25FeHBsb3Jlci5ncmFwaHMgPSB7fTtcclxuXHJcblx0c29ydEtleXMoKTtcclxuXHRjbGVhbkRhdGEoKTtcclxuXHJcblx0Ly8gQWNjZXNzIHRoaXMgZGF0YSBsYXRlclxyXG5cdERlc2lnbkV4cGxvcmVyLnByb3RvdHlwZS5nZXREYXRhID0gZnVuY3Rpb24gKCkge1xyXG5cdFx0cmV0dXJuIGRhdGE7XHJcblx0fTtcclxuXHJcblx0Ly8gU2V0IGRlZmF1bHQgc29ydCBieSBrZXlcclxuXHRkZXNpZ25FeHBsb3Jlci5zZXRDb2xvcmVyKGRlc2lnbkV4cGxvcmVyLnBhcmFtcy5pblswXSk7XHJcblxyXG5cdC8qXHJcblx0IOKWiOKWiOKWiOKWiOKWiCAg4paI4paI4paIICAgIOKWiOKWiCAg4paI4paI4paI4paI4paI4paIICDilojilojiloggICAg4paI4paIXHJcblx04paI4paIICAg4paI4paIIOKWiOKWiOKWiOKWiCAgIOKWiOKWiCDilojiloggICAg4paI4paIIOKWiOKWiOKWiOKWiCAgIOKWiOKWiFxyXG5cdOKWiOKWiOKWiOKWiOKWiOKWiOKWiCDilojilogg4paI4paIICDilojilogg4paI4paIICAgIOKWiOKWiCDilojilogg4paI4paIICDilojilohcclxuXHTilojiloggICDilojilogg4paI4paIICDilojilogg4paI4paIIOKWiOKWiCAgICDilojilogg4paI4paIICDilojilogg4paI4paIXHJcblx04paI4paIICAg4paI4paIIOKWiOKWiCAgIOKWiOKWiOKWiOKWiCAg4paI4paI4paI4paI4paI4paIICDilojiloggICDilojilojilojilohcclxuXHQqL1xyXG5cclxuXHRmdW5jdGlvbiBzb3J0S2V5cygpIHtcclxuXHRcdC8vIEluaXRpYWwgQ2xlYW51cFxyXG5cdFx0dmFyIGtleXMgPSBkMy5rZXlzKG9yaWdpbmFsRGF0YVswXSk7XHJcblxyXG5cdFx0Ly8gUG9wdWxhdGUgd2hpY2ggYXJlIGlucHV0IGFuZCBvdXRwdXQga2V5c1xyXG5cdFx0a2V5cy5mb3JFYWNoKGZ1bmN0aW9uIChrZXkpIHtcclxuXHRcdFx0T2JqZWN0LmtleXMoRGVzaWduRXhwbG9yZXIudHlwZURpc3BsYXlEaWN0aW9uYXJ5KVxyXG5cdFx0XHRcdC5mb3JFYWNoKGZ1bmN0aW9uIChrZXlUeXBlKSB7XHJcblx0XHRcdFx0XHR2YXIgdHlwZSA9IERlc2lnbkV4cGxvcmVyLnR5cGVEaXNwbGF5RGljdGlvbmFyeVtrZXlUeXBlXTtcclxuXHRcdFx0XHRcdHZhciBzaWduaWZpZXIgPSB0eXBlLnNpZ25pZmllcjtcclxuXHRcdFx0XHRcdHZhciBrZXlPYmo7XHJcblx0XHRcdFx0XHRpZiAoa2V5LnN0YXJ0c1dpdGgoc2lnbmlmaWVyKSkge1xyXG5cdFx0XHRcdFx0XHRrZXlPYmo9bmV3IERlc2lnbkV4cGxvcmVyLlBhcmFtKGtleSx0eXBlKTtcclxuXHRcdFx0XHRcdFx0ZGVzaWduRXhwbG9yZXIucGFyYW1zQWxsLnB1c2goa2V5T2JqKTtcclxuXHRcdFx0XHRcdFx0ZGVzaWduRXhwbG9yZXIucGFyYW1zW2tleVR5cGVdID0gZGVzaWduRXhwbG9yZXIucGFyYW1zW2tleVR5cGVdIHx8IFtdO1xyXG5cdFx0XHRcdFx0XHRkZXNpZ25FeHBsb3Jlci5wYXJhbXNba2V5VHlwZV0ucHVzaChrZXlPYmopO1xyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdH0pO1xyXG5cdFx0fSk7XHJcblx0fVxyXG5cclxuXHRmdW5jdGlvbiBjbGVhbkRhdGEoKSB7XHJcblx0XHQvLyBjbGVhbiBkYXRhXHJcblx0XHRvcmlnaW5hbERhdGEuZm9yRWFjaChmdW5jdGlvbiAoZGF0dW0sIGkpIHtcclxuXHRcdFx0dmFyIGNsZWFuZWREYXR1bSA9IHtcclxuXHRcdFx0XHRfaWQ6IGlcclxuXHRcdFx0fTtcclxuXHJcblx0XHRcdE9iamVjdC5rZXlzKGRhdHVtKVxyXG5cdFx0XHRcdC5mb3JFYWNoKGZ1bmN0aW9uIChrZXkpIHtcclxuXHRcdFx0XHRcdHZhciBrZXlPYmogPSBkZXNpZ25FeHBsb3Jlci5wYXJhbXNBbGwucmVkdWNlKGZ1bmN0aW9uIChwcmV2LCBjdXIpIHtcclxuXHRcdFx0XHRcdFx0cmV0dXJuIGN1ci5vcmlnaW5hbCA9PT0ga2V5ID8gY3VyIDogcHJldjtcclxuXHRcdFx0XHRcdH0sIG51bGwpO1xyXG5cdFx0XHRcdFx0dmFyIGZsb2F0VmVyc2lvbiA9IHBhcnNlRmxvYXQoZGF0dW1ba2V5XSk7XHJcblx0XHRcdFx0XHR2YXIgY2xlYW5LZXkgPSBrZXlPYmogPyBrZXlPYmpbRGVzaWduRXhwbG9yZXIuZGF0YUtleV0gOiBrZXk7XHJcblx0XHRcdFx0XHRjbGVhbmVkRGF0dW1bY2xlYW5LZXldID0gaXNOYU4oZmxvYXRWZXJzaW9uKSA/IGRhdHVtW2tleV0gOiBmbG9hdFZlcnNpb247XHJcblx0XHRcdFx0fSk7XHJcblxyXG5cdFx0XHRkYXRhLnB1c2goY2xlYW5lZERhdHVtKTtcclxuXHRcdH0pO1xyXG5cdH1cclxuXHJcbn07XHJcblxyXG5EZXNpZ25FeHBsb3Jlci5kYXRhS2V5PSdjbGVhbktleSc7XHJcbiIsIkRlc2lnbkV4cGxvcmVyLlBhcmFtID0gZnVuY3Rpb24gKGtleSwgdHlwZSkge1xyXG5cdHZhciBwYXJhbSA9IHRoaXM7XHJcblxyXG5cdHBhcmFtLm9yaWdpbmFsID0ga2V5O1xyXG5cclxuXHRwYXJhbS5kaXNwbGF5ID0ga2V5LnN1YnN0cmluZyh0eXBlLnNpZ25pZmllci5sZW5ndGgsIGtleS5sZW5ndGgpO1xyXG5cclxuXHRwYXJhbS50eXBlID0gdHlwZTtcclxuXHJcblx0cGFyYW0uY2xlYW5LZXkgPSBrZXkucmVwbGFjZSgnOicsICdfJylcclxuXHRcdC5yZXBsYWNlKCdbJywgJ18nKVxyXG5cdFx0LnJlcGxhY2UoJ10nLCAnXycpO1xyXG5cclxuXHRwYXJhbS5zaG93bkluUGFyY29vcmRzID0gdHJ1ZTtcclxufTtcclxuIiwiRGVzaWduRXhwbG9yZXIucHJvdG90eXBlLnBvcHVsYXRlSXRlcmF0aW9uVGFibGU9ZnVuY3Rpb24oanFFbGVtZW50LGl0ZXJhdGlvbil7XHJcbiAgdmFyIGRlc2lnbkV4cGxvcmVyPXRoaXM7XHJcblxyXG4gIHZhciBwYXJhbVR5cGVzID0gT2JqZWN0LmtleXMoZGVzaWduRXhwbG9yZXIucGFyYW1zKTtcclxuXHJcbiAganFFbGVtZW50Lmh0bWwoJycpO1xyXG5cclxuICBwYXJhbVR5cGVzLmZvckVhY2goZnVuY3Rpb24gKGtleSkge1xyXG4gICAgdmFyIHR5cGUgPSBEZXNpZ25FeHBsb3Jlci50eXBlRGlzcGxheURpY3Rpb25hcnlba2V5XTtcclxuICAgIHZhciB0YWJsZSA9ICQoJzx0YWJsZSBjbGFzcz1cInRhYmxlIHRhYmxlLWNvbmRlbnNlZFwiPjwvdGFibGU+Jyk7XHJcbiAgICB2YXIgcGFyYW1zID0gZGVzaWduRXhwbG9yZXIucGFyYW1zW2tleV07XHJcbiAgICBwYXJhbXMuZm9yRWFjaChmdW5jdGlvbiAocGFyYW0pIHtcclxuICAgICAgdmFyIHJvdyA9ICQoJzx0cj48L3RyPicpO1xyXG4gICAgICByb3cuYXBwZW5kKCc8dGQ+JyArIHBhcmFtLmRpc3BsYXkgKyAnPC90ZD4nKTtcclxuICAgICAgcm93LmFwcGVuZCgnPHRkPicgKyBpdGVyYXRpb25bcGFyYW1bRGVzaWduRXhwbG9yZXIuZGF0YUtleV1dICsgJzwvdGQ+Jyk7XHJcbiAgICAgIHRhYmxlLmFwcGVuZChyb3cpO1xyXG5cclxuICAgICAgaWYgKHBhcmFtID09PSBkZXNpZ25FeHBsb3Jlci5zZWxlY3RlZFBhcmFtKSByb3cuY3NzKCdib3JkZXItbGVmdCcsICc1cHggc29saWQgJyArIGRlc2lnbkV4cGxvcmVyLmNvbG9yZXIoaXRlcmF0aW9uKSlcclxuICAgICAgICAuY3NzKCdmb250LXdlaWdodCcsICdib2xkJyk7XHJcbiAgICB9KTtcclxuICAgIGpxRWxlbWVudC5hcHBlbmQoJzxoND4nICsgdHlwZS5kaXNwbGF5ICsgJ3M8L2g0PicpO1xyXG4gICAganFFbGVtZW50LmFwcGVuZCh0YWJsZSk7XHJcbiAgfSk7XHJcblxyXG5cclxufTtcclxuIiwiRGVzaWduRXhwbG9yZXIucHJvdG90eXBlLmdldFBhcmFtRnJvbURhdGFrZXkgPSBmdW5jdGlvbiAoZGF0YUtleSkge1xyXG5cdHZhciBkZXNpZ25FeHBsb3JlciA9IHRoaXM7XHJcblxyXG5cdHJldHVybiBkZXNpZ25FeHBsb3Jlci5wYXJhbXNBbGwucmVkdWNlKGZ1bmN0aW9uIChwcmV2LCBjdXIpIHtcclxuXHRcdHJldHVybiBjdXJbRGVzaWduRXhwbG9yZXIuZGF0YUtleV0gPT09IGRhdGFLZXkgPyBjdXIgOiBwcmV2O1xyXG5cdH0sIG51bGwpO1xyXG59O1xyXG4iLCJEZXNpZ25FeHBsb3Jlci5wcm90b3R5cGUucGFyY29vcmRzX2NyZWF0ZSA9IGZ1bmN0aW9uIChkaXZTZWxlY3Rvcikge1xyXG5cclxuXHR2YXIgZGVzaWduRXhwbG9yZXIgPSB0aGlzO1xyXG5cclxuXHRkZXNpZ25FeHBsb3Jlci5ncmFwaHMuX3BhcmNvb3Jkc0RpdlNlbGVjdG9yID0gZGl2U2VsZWN0b3I7XHJcblxyXG5cdHZhciBkaXYgPSAkKGRpdlNlbGVjdG9yKTtcclxuXHJcblx0dmFyIGNvbnRleHRNZW51ID0gJCgnI2NvbnRleHQtbWVudScpO1xyXG5cclxuXHRkaXYuaHRtbCgnJyk7XHJcblxyXG5cdGRpdi5hZGRDbGFzcygncGFyY29vcmRzJyk7XHJcblxyXG5cdHZhciBkaW1lbnNpb25zID0gZGVzaWduRXhwbG9yZXIucGFyY29vcmRzX2dldEN1ckRpbXMoKTtcclxuXHJcblx0ZGVzaWduRXhwbG9yZXIuZ3JhcGhzLnBhcmNvb3JkcyA9IGQzLnBhcmNvb3JkcygpKGRpdlNlbGVjdG9yKVxyXG5cdFx0LmRhdGEoZGVzaWduRXhwbG9yZXIuZ2V0RGF0YSgpKVxyXG5cdFx0LmNvbG9yKGRlc2lnbkV4cGxvcmVyLmNvbG9yZXIpXHJcblx0XHQuYWxwaGEoMC4yKVxyXG5cdFx0LmFscGhhT25CcnVzaGVkKDAuMDUpXHJcblx0XHQubW9kZShcInF1ZXVlXCIpXHJcblx0XHQucmF0ZSgyMClcclxuXHRcdC5kaW1lbnNpb25zKGRpbWVuc2lvbnMpXHJcblx0XHQucmVuZGVyKClcclxuXHRcdC5icnVzaE1vZGUoXCIxRC1heGVzXCIpIC8vIGVuYWJsZSBicnVzaGluZ1xyXG5cdFx0LmF1dG9zY2FsZSgpXHJcblx0XHQuaW50ZXJhY3RpdmUoKVxyXG5cdFx0LnJlb3JkZXJhYmxlKCk7XHJcblxyXG5cdHBvc3RSZW5kZXIoKTtcclxuXHJcblx0ZGVzaWduRXhwbG9yZXIuZ3JhcGhzLnBhcmNvb3Jkcy5vbigncmVuZGVyJywgXy5kZWJvdW5jZShwb3N0UmVuZGVyLCA0MDApKTtcclxuXHRkZXNpZ25FeHBsb3Jlci5ncmFwaHMucGFyY29vcmRzLm9uKCdkaW1lbnNpb25zJywgXy5kZWJvdW5jZShwb3N0UmVuZGVyLCA0MDApKTtcclxuXHQvLyBkZXNpZ25FeHBsb3Jlci5ncmFwaHMucGFyY29vcmRzLm9uKCdicnVzaCcsIF8uZGVib3VuY2UocG9zdEJydXNoLCA0MDApKTtcclxuXHJcblx0ZnVuY3Rpb24gcG9zdFJlbmRlcigpIHtcclxuXHJcblx0XHR2YXIgZG9tYWluQ29sb3JzID0gW107XHJcblxyXG5cdFx0ZDMuc2VsZWN0QWxsKGRpdlNlbGVjdG9yICsgJyBnLmRpbWVuc2lvbicpXHJcblx0XHRcdC5lYWNoKGZ1bmN0aW9uIChkLCBpKSB7XHJcblx0XHRcdFx0dmFyIHBhcmFtID0gZGVzaWduRXhwbG9yZXIuZ2V0UGFyYW1Gcm9tRGF0YWtleShkKTtcclxuXHRcdFx0XHR2YXIgcGFyYW1Db2xvciA9IChwYXJhbS50eXBlLmtleSA9PT0gJ2luJykgPyAnIzk5OScgOiAnIzAwMCc7XHJcblx0XHRcdFx0dmFyIHRoaXNEMyA9IGQzLnNlbGVjdCh0aGlzKTtcclxuXHJcblx0XHRcdFx0dGhpc0QzLnNlbGVjdEFsbCgndGV4dC5sYWJlbCcpXHJcblx0XHRcdFx0XHQudGV4dChwYXJhbS5kaXNwbGF5KVxyXG5cdFx0XHRcdFx0LnN0eWxlKCdmaWxsJywgcGFyYW1Db2xvcik7XHJcblxyXG5cdFx0XHRcdHRoaXNEMy5zZWxlY3RBbGwoJ3BhdGguZG9tYWluJylcclxuXHRcdFx0XHRcdC5zdHlsZSgnc3Ryb2tlJywgcGFyYW1Db2xvcik7XHJcblxyXG5cdFx0XHRcdHRoaXNEMy5zZWxlY3RBbGwoJyBnLnRpY2sgdGV4dCcpXHJcblx0XHRcdFx0XHQuc3R5bGUoJ2ZvbnQtc2l6ZScsICc5cHgnKVxyXG5cdFx0XHRcdFx0LnN0eWxlKCdmaWxsJywgcGFyYW1Db2xvcik7XHJcblxyXG5cdFx0XHRcdHRoaXNEMy5zZWxlY3RBbGwoJyBnLmJydXNoIHJlY3QuZXh0ZW50JylcclxuXHRcdFx0XHRcdC5zdHlsZSgnZmlsbCcsICdyZ2JhKDI1NSwyNTUsMjU1LDAuNSknKVxyXG5cdFx0XHRcdFx0Lm9uKCdjb250ZXh0bWVudScsIGZ1bmN0aW9uIChkLCBpKSB7XHJcblx0XHRcdFx0XHRcdHZhciBqVGhpcyA9ICQodGhpcyk7XHJcblxyXG5cdFx0XHRcdFx0XHRpZiAoTnVtYmVyKGpUaGlzLmF0dHIoJ2hlaWdodCcpKSA9PT0gMCkgcmV0dXJuO1xyXG5cclxuXHRcdFx0XHRcdFx0ZDMuZXZlbnQucHJldmVudERlZmF1bHQoKTtcclxuXHJcblx0XHRcdFx0XHRcdGNvbnRleHRNZW51Lmh0bWwoJycpO1xyXG5cdFx0XHRcdFx0XHRjb250ZXh0TWVudS5jc3MoJ2xlZnQnLCBkMy5ldmVudC5jbGllbnRYKTtcclxuXHRcdFx0XHRcdFx0Y29udGV4dE1lbnUuY3NzKCd0b3AnLCBkMy5ldmVudC5jbGllbnRZKTtcclxuXHJcblx0XHRcdFx0XHRcdHZhciBsZyA9ICQoJzx1bCBjbGFzcz1cImxpc3QtZ3JvdXBcIj48L3VsPicpO1xyXG5cclxuXHRcdFx0XHRcdFx0dmFyIHJlc2V0QnJ1c2ggPSAkKCc8YSBjbGFzcz1cImxpc3QtZ3JvdXAtaXRlbVwiPlJlc2V0IHRoZXNlIGV4dGVudHM8L2E+Jyk7XHJcblxyXG5cdFx0XHRcdFx0XHRyZXNldEJydXNoLm9uKCdjbGljaycsIGZ1bmN0aW9uICgpIHtcclxuXHRcdFx0XHRcdFx0XHRkZXNpZ25FeHBsb3Jlci5ncmFwaHMucGFyY29vcmRzLmJydXNoUmVzZXQoZCk7XHJcblx0XHRcdFx0XHRcdH0pO1xyXG5cclxuXHRcdFx0XHRcdFx0bGcuYXBwZW5kKHJlc2V0QnJ1c2gpO1xyXG5cdFx0XHRcdFx0XHRjb250ZXh0TWVudS5hcHBlbmQobGcpO1xyXG5cclxuXHRcdFx0XHRcdFx0Y29udGV4dE1lbnUuc2hvdygpO1xyXG5cclxuXHRcdFx0XHRcdFx0bGcub24oJ2NsaWNrJywgZnVuY3Rpb24gKCkge1xyXG5cdFx0XHRcdFx0XHRcdGNvbnRleHRNZW51LmhpZGUoKTtcclxuXHRcdFx0XHRcdFx0fSk7XHJcblxyXG5cdFx0XHRcdFx0fSk7XHJcblx0XHRcdH0pO1xyXG5cclxuXHRcdGRlc2lnbkV4cGxvcmVyLmFic3RyYWN0X3BhcmNvb3Jkc19wb3N0UmVuZGVyKCk7XHJcblx0fVxyXG5cclxuXHQvLyByZXNpemUgb3IgcmUtcmVuZGVyIGJyZWFrcyB0aGUgYnJ1c2ggbW9kZVxyXG5cdC8vICQod2luZG93KVxyXG5cdC8vIFx0Lm9uKCdyZXNpemUnLCBmdW5jdGlvbiAoKSB7XHJcblx0Ly8gXHRcdGRlc2lnbkV4cGxvcmVyLmdyYXBocy5wYXJjb29yZHMud2lkdGgoZGl2LndpZHRoKCkpO1xyXG5cdC8vIFx0fSk7XHJcbn07XHJcblxyXG4vKlxyXG4g4paI4paI4paI4paI4paIICDilojilojilojilojilojiloggIOKWiOKWiOKWiOKWiOKWiOKWiOKWiCDilojilojilojilojilojilojilojilogg4paI4paI4paI4paI4paI4paIICAg4paI4paI4paI4paI4paIICAg4paI4paI4paI4paI4paI4paIIOKWiOKWiOKWiOKWiOKWiOKWiOKWiOKWiCDilojilojilojilojilojilojilohcclxu4paI4paIICAg4paI4paIIOKWiOKWiCAgIOKWiOKWiCDilojiloggICAgICAgICDilojiloggICAg4paI4paIICAg4paI4paIIOKWiOKWiCAgIOKWiOKWiCDilojiloggICAgICAgICDilojiloggICAg4paI4paIXHJcbuKWiOKWiOKWiOKWiOKWiOKWiOKWiCDilojilojilojilojilojiloggIOKWiOKWiOKWiOKWiOKWiOKWiOKWiCAgICDilojiloggICAg4paI4paI4paI4paI4paI4paIICDilojilojilojilojilojilojilogg4paI4paIICAgICAgICAg4paI4paIICAgIOKWiOKWiOKWiOKWiOKWiOKWiOKWiFxyXG7ilojiloggICDilojilogg4paI4paIICAg4paI4paIICAgICAg4paI4paIICAgIOKWiOKWiCAgICDilojiloggICDilojilogg4paI4paIICAg4paI4paIIOKWiOKWiCAgICAgICAgIOKWiOKWiCAgICAgICAgIOKWiOKWiFxyXG7ilojiloggICDilojilogg4paI4paI4paI4paI4paI4paIICDilojilojilojilojilojilojiloggICAg4paI4paIICAgIOKWiOKWiCAgIOKWiOKWiCDilojiloggICDilojiloggIOKWiOKWiOKWiOKWiOKWiOKWiCAgICDilojiloggICAg4paI4paI4paI4paI4paI4paI4paIXHJcbiovXHJcblxyXG4vKipcclxuICogSW50ZW5kZWQgZm9yIG92ZXJ3cml0ZS5cclxuICovXHJcbkRlc2lnbkV4cGxvcmVyLnByb3RvdHlwZS5hYnN0cmFjdF9wYXJjb29yZHNfcG9zdFJlbmRlciA9IGZ1bmN0aW9uICgpIHt9O1xyXG4iLCJEZXNpZ25FeHBsb3Jlci5wcm90b3R5cGUucGFyY29vcmRzX2dldEN1ckRpbXMgPSBmdW5jdGlvbiAoKSB7XHJcblxyXG5cdHZhciBkZXNpZ25FeHBsb3JlciA9IHRoaXM7XHJcblxyXG5cdHZhciBkaW1lbnNpb25zID0gZGVzaWduRXhwbG9yZXIucGFyYW1zQWxsLnJlZHVjZShmdW5jdGlvbiAocHJldiwgY3VyKSB7XHJcblx0XHRpZiAoY3VyLnNob3duSW5QYXJjb29yZHMpIHtcclxuXHRcdFx0cHJldltjdXJbRGVzaWduRXhwbG9yZXIuZGF0YUtleV1dID0ge307XHJcblx0XHR9XHJcblx0XHRyZXR1cm4gcHJldjtcclxuXHR9LCB7fSk7XHJcblxyXG5cdHJldHVybiBkaW1lbnNpb25zO1xyXG5cclxufTtcclxuIiwiRGVzaWduRXhwbG9yZXIucHJvdG90eXBlLnBhcmNvb3Jkc19yZWRyYXcgPSBmdW5jdGlvbiAoKSB7XHJcblxyXG5cdHZhciBkZXNpZ25FeHBsb3JlciA9IHRoaXM7XHJcblxyXG5cdGlmICghZGVzaWduRXhwbG9yZXIuZ3JhcGhzLnBhcmNvb3JkcykgcmV0dXJuO1xyXG5cclxuXHRkZXNpZ25FeHBsb3Jlci5ncmFwaHMucGFyY29vcmRzLmRpbWVuc2lvbnMoZGVzaWduRXhwbG9yZXIucGFyY29vcmRzX2dldEN1ckRpbXMoKSk7XHJcblxyXG59O1xyXG4iLCIvKipcclxuICogVGVsbCB1cyB3aGljaCBwYXJhbSB0byBjb2xvciBieVxyXG4gKiBAcGFyYW0ge29iamVjdH0gcGFyYW0gLSBQYXJhbWV0ZXJcclxuICovXHJcbkRlc2lnbkV4cGxvcmVyLnByb3RvdHlwZS5zZXRDb2xvcmVyID0gZnVuY3Rpb24gKHBhcmFtKSB7XHJcblxyXG5cdHZhciBkZXNpZ25FeHBsb3JlciA9IHRoaXM7XHJcblxyXG5cdGRlc2lnbkV4cGxvcmVyLnNlbGVjdGVkUGFyYW0gPSBwYXJhbTtcclxuXHJcblx0dmFyIGRhdGEgPSBkZXNpZ25FeHBsb3Jlci5nZXREYXRhKCk7XHJcblxyXG5cdHZhciBleHRlbnRzID0gZDMuZXh0ZW50KGRhdGEsIGRhdGFBY2Nlc3Nvcik7XHJcblxyXG5cdHZhciBjb2xvclNjYWxlID0gZDMuc2NhbGUubGluZWFyKClcclxuXHRcdC5kb21haW4oZXh0ZW50cylcclxuXHRcdC5yYW5nZShbXCIjM2IzMWIwXCIsIFwiIzY2Q0NERFwiXSk7XHJcblxyXG5cdGRlc2lnbkV4cGxvcmVyLmNvbG9yZXIgPSBmdW5jdGlvbiAoZCkge1xyXG5cdFx0cmV0dXJuIGNvbG9yU2NhbGUoZGF0YUFjY2Vzc29yKGQpKTtcclxuXHR9O1xyXG5cclxuXHRpZihkZXNpZ25FeHBsb3Jlci5ncmFwaHMucGFyY29vcmRzKSB7XHJcblx0XHRkZXNpZ25FeHBsb3Jlci5ncmFwaHMucGFyY29vcmRzLmNvbG9yKGRlc2lnbkV4cGxvcmVyLmNvbG9yZXIpLnJlbmRlcigpO1xyXG5cdH1cclxuXHJcblx0ZnVuY3Rpb24gZGF0YUFjY2Vzc29yKGQpIHtcclxuXHRcdHJldHVybiBkW3BhcmFtW0Rlc2lnbkV4cGxvcmVyLmRhdGFLZXldXTtcclxuXHR9XHJcblxyXG59O1xyXG4iLCJEZXNpZ25FeHBsb3Jlci50eXBlRGlzcGxheURpY3Rpb25hcnk9e1xyXG4gICdpbic6e1xyXG4gICAgJ3NpZ25pZmllcic6ICdpbjonLFxyXG4gICAgJ2tleSc6ICdpbicsXHJcbiAgICAnZGlzcGxheSc6J0lucHV0JyxcclxuICB9LFxyXG4gICdvdXQnOntcclxuICAgICdzaWduaWZpZXInOiAnb3V0OicsXHJcbiAgICAna2V5JzogJ291dCcsXHJcbiAgICAnZGlzcGxheSc6J091dHB1dCdcclxuICB9XHJcbn07XHJcbiJdfQ==
