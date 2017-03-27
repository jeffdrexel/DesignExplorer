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

						var lg=$('<ul class="list-group"></ul>');

						var resetBrush=$('<a class="list-group-item">Reset extents</a>');

						resetBrush.on('click',function(){
							designExplorer.graphs.parcoords.brushReset(d);
						});

						lg.append(resetBrush);
						contextMenu.append(lg);

						contextMenu.show();

						lg.on('click',function(){
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

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImhlYWRlci5qcyIsImNvbnN0cnVjdG9ycy9QYXJhbS5qcyIsInN0YXRpY3MvdHlwZURpc3BsYXlEaWN0aW9uYXJ5LmpzIiwicGFydGlhbHMvZ2V0SXRlcmF0aW9uVGFibGUuanMiLCJwYXJ0aWFscy9nZXRQYXJhbUZyb21EYXRha2V5LmpzIiwicGFydGlhbHMvcGFyY29vcmRzX2NyZWF0ZS5qcyIsInBhcnRpYWxzL3BhcmNvb3Jkc19nZXRDdXJEaW1zLmpzIiwicGFydGlhbHMvcGFyY29vcmRzX3JlZHJhdy5qcyIsInBhcnRpYWxzL3NldENvbG9yZXIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3hGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ2ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDWkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDMUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNQQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUN2SEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDZEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNUQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImRlc2lnbmV4cGxvcmVyLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXHJcbiAqIEBjb25zdHJ1Y3RvclxyXG4gKi9cclxudmFyIERlc2lnbkV4cGxvcmVyID0gZnVuY3Rpb24gKG9yaWdpbmFsRGF0YSkge1xyXG5cclxuXHQvKipcclxuXHQgKiBAbGVuZHMgRGVzaWduRXhwbG9yZXIucHJvdG90eXBlXHJcblx0ICovXHJcblx0dmFyIGRlc2lnbkV4cGxvcmVyID0gdGhpcztcclxuXHJcblx0dmFyIGRhdGEgPSBbXTtcclxuXHJcblx0Ly8gRGljdGlvbmFyaWVkIHBhcmFtc1xyXG5cdGRlc2lnbkV4cGxvcmVyLnBhcmFtcyA9IHt9O1xyXG5cclxuXHQvLyBBbGwgcGFyYW1zXHJcblx0ZGVzaWduRXhwbG9yZXIucGFyYW1zQWxsID0gW107XHJcblxyXG5cdC8vIFNldCBsYXRlciBieSBzZXRDb2xvcmVyXHJcblx0ZGVzaWduRXhwbG9yZXIuc2VsZWN0ZWRQYXJhbSA9IG51bGw7XHJcblxyXG5cdC8vIEFsbCBncmFwaHMgbmFtZXNwYWNlXHJcblx0ZGVzaWduRXhwbG9yZXIuZ3JhcGhzID0ge307XHJcblxyXG5cdHNvcnRLZXlzKCk7XHJcblx0Y2xlYW5EYXRhKCk7XHJcblxyXG5cdC8vIEFjY2VzcyB0aGlzIGRhdGEgbGF0ZXJcclxuXHREZXNpZ25FeHBsb3Jlci5wcm90b3R5cGUuZ2V0RGF0YSA9IGZ1bmN0aW9uICgpIHtcclxuXHRcdHJldHVybiBkYXRhO1xyXG5cdH07XHJcblxyXG5cdC8vIFNldCBkZWZhdWx0IHNvcnQgYnkga2V5XHJcblx0ZGVzaWduRXhwbG9yZXIuc2V0Q29sb3JlcihkZXNpZ25FeHBsb3Jlci5wYXJhbXMuaW5bMF0pO1xyXG5cclxuXHQvKlxyXG5cdCDilojilojilojilojiloggIOKWiOKWiOKWiCAgICDilojiloggIOKWiOKWiOKWiOKWiOKWiOKWiCAg4paI4paI4paIICAgIOKWiOKWiFxyXG5cdOKWiOKWiCAgIOKWiOKWiCDilojilojilojiloggICDilojilogg4paI4paIICAgIOKWiOKWiCDilojilojilojiloggICDilojilohcclxuXHTilojilojilojilojilojilojilogg4paI4paIIOKWiOKWiCAg4paI4paIIOKWiOKWiCAgICDilojilogg4paI4paIIOKWiOKWiCAg4paI4paIXHJcblx04paI4paIICAg4paI4paIIOKWiOKWiCAg4paI4paIIOKWiOKWiCDilojiloggICAg4paI4paIIOKWiOKWiCAg4paI4paIIOKWiOKWiFxyXG5cdOKWiOKWiCAgIOKWiOKWiCDilojiloggICDilojilojilojiloggIOKWiOKWiOKWiOKWiOKWiOKWiCAg4paI4paIICAg4paI4paI4paI4paIXHJcblx0Ki9cclxuXHJcblx0ZnVuY3Rpb24gc29ydEtleXMoKSB7XHJcblx0XHQvLyBJbml0aWFsIENsZWFudXBcclxuXHRcdHZhciBrZXlzID0gZDMua2V5cyhvcmlnaW5hbERhdGFbMF0pO1xyXG5cclxuXHRcdC8vIFBvcHVsYXRlIHdoaWNoIGFyZSBpbnB1dCBhbmQgb3V0cHV0IGtleXNcclxuXHRcdGtleXMuZm9yRWFjaChmdW5jdGlvbiAoa2V5KSB7XHJcblx0XHRcdE9iamVjdC5rZXlzKERlc2lnbkV4cGxvcmVyLnR5cGVEaXNwbGF5RGljdGlvbmFyeSlcclxuXHRcdFx0XHQuZm9yRWFjaChmdW5jdGlvbiAoa2V5VHlwZSkge1xyXG5cdFx0XHRcdFx0dmFyIHR5cGUgPSBEZXNpZ25FeHBsb3Jlci50eXBlRGlzcGxheURpY3Rpb25hcnlba2V5VHlwZV07XHJcblx0XHRcdFx0XHR2YXIgc2lnbmlmaWVyID0gdHlwZS5zaWduaWZpZXI7XHJcblx0XHRcdFx0XHR2YXIga2V5T2JqO1xyXG5cdFx0XHRcdFx0aWYgKGtleS5zdGFydHNXaXRoKHNpZ25pZmllcikpIHtcclxuXHRcdFx0XHRcdFx0a2V5T2JqPW5ldyBEZXNpZ25FeHBsb3Jlci5QYXJhbShrZXksdHlwZSk7XHJcblx0XHRcdFx0XHRcdGRlc2lnbkV4cGxvcmVyLnBhcmFtc0FsbC5wdXNoKGtleU9iaik7XHJcblx0XHRcdFx0XHRcdGRlc2lnbkV4cGxvcmVyLnBhcmFtc1trZXlUeXBlXSA9IGRlc2lnbkV4cGxvcmVyLnBhcmFtc1trZXlUeXBlXSB8fCBbXTtcclxuXHRcdFx0XHRcdFx0ZGVzaWduRXhwbG9yZXIucGFyYW1zW2tleVR5cGVdLnB1c2goa2V5T2JqKTtcclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHR9KTtcclxuXHRcdH0pO1xyXG5cdH1cclxuXHJcblx0ZnVuY3Rpb24gY2xlYW5EYXRhKCkge1xyXG5cdFx0Ly8gY2xlYW4gZGF0YVxyXG5cdFx0b3JpZ2luYWxEYXRhLmZvckVhY2goZnVuY3Rpb24gKGRhdHVtLCBpKSB7XHJcblx0XHRcdHZhciBjbGVhbmVkRGF0dW0gPSB7XHJcblx0XHRcdFx0X2lkOiBpXHJcblx0XHRcdH07XHJcblxyXG5cdFx0XHRPYmplY3Qua2V5cyhkYXR1bSlcclxuXHRcdFx0XHQuZm9yRWFjaChmdW5jdGlvbiAoa2V5KSB7XHJcblx0XHRcdFx0XHR2YXIga2V5T2JqID0gZGVzaWduRXhwbG9yZXIucGFyYW1zQWxsLnJlZHVjZShmdW5jdGlvbiAocHJldiwgY3VyKSB7XHJcblx0XHRcdFx0XHRcdHJldHVybiBjdXIub3JpZ2luYWwgPT09IGtleSA/IGN1ciA6IHByZXY7XHJcblx0XHRcdFx0XHR9LCBudWxsKTtcclxuXHRcdFx0XHRcdHZhciBmbG9hdFZlcnNpb24gPSBwYXJzZUZsb2F0KGRhdHVtW2tleV0pO1xyXG5cdFx0XHRcdFx0dmFyIGNsZWFuS2V5ID0ga2V5T2JqID8ga2V5T2JqW0Rlc2lnbkV4cGxvcmVyLmRhdGFLZXldIDoga2V5O1xyXG5cdFx0XHRcdFx0Y2xlYW5lZERhdHVtW2NsZWFuS2V5XSA9IGlzTmFOKGZsb2F0VmVyc2lvbikgPyBkYXR1bVtrZXldIDogZmxvYXRWZXJzaW9uO1xyXG5cdFx0XHRcdH0pO1xyXG5cclxuXHRcdFx0ZGF0YS5wdXNoKGNsZWFuZWREYXR1bSk7XHJcblx0XHR9KTtcclxuXHR9XHJcblxyXG59O1xyXG5cclxuRGVzaWduRXhwbG9yZXIuZGF0YUtleT0nY2xlYW5LZXknO1xyXG4iLCJEZXNpZ25FeHBsb3Jlci5QYXJhbSA9IGZ1bmN0aW9uIChrZXksIHR5cGUpIHtcclxuXHR2YXIgcGFyYW0gPSB0aGlzO1xyXG5cclxuXHRwYXJhbS5vcmlnaW5hbCA9IGtleTtcclxuXHJcblx0cGFyYW0uZGlzcGxheSA9IGtleS5zdWJzdHJpbmcodHlwZS5zaWduaWZpZXIubGVuZ3RoLCBrZXkubGVuZ3RoKTtcclxuXHJcblx0cGFyYW0udHlwZSA9IHR5cGU7XHJcblxyXG5cdHBhcmFtLmNsZWFuS2V5ID0ga2V5LnJlcGxhY2UoJzonLCAnXycpXHJcblx0XHQucmVwbGFjZSgnWycsICdfJylcclxuXHRcdC5yZXBsYWNlKCddJywgJ18nKTtcclxuXHJcblx0cGFyYW0uc2hvd25JblBhcmNvb3JkcyA9IHRydWU7XHJcbn07XHJcbiIsIkRlc2lnbkV4cGxvcmVyLnR5cGVEaXNwbGF5RGljdGlvbmFyeT17XHJcbiAgJ2luJzp7XHJcbiAgICAnc2lnbmlmaWVyJzogJ2luOicsXHJcbiAgICAna2V5JzogJ2luJyxcclxuICAgICdkaXNwbGF5JzonSW5wdXQnLFxyXG4gIH0sXHJcbiAgJ291dCc6e1xyXG4gICAgJ3NpZ25pZmllcic6ICdvdXQ6JyxcclxuICAgICdrZXknOiAnb3V0JyxcclxuICAgICdkaXNwbGF5JzonT3V0cHV0J1xyXG4gIH1cclxufTtcclxuIiwiRGVzaWduRXhwbG9yZXIucHJvdG90eXBlLnBvcHVsYXRlSXRlcmF0aW9uVGFibGU9ZnVuY3Rpb24oanFFbGVtZW50LGl0ZXJhdGlvbil7XHJcbiAgdmFyIGRlc2lnbkV4cGxvcmVyPXRoaXM7XHJcblxyXG4gIHZhciBwYXJhbVR5cGVzID0gT2JqZWN0LmtleXMoZGVzaWduRXhwbG9yZXIucGFyYW1zKTtcclxuXHJcbiAganFFbGVtZW50Lmh0bWwoJycpO1xyXG5cclxuICBwYXJhbVR5cGVzLmZvckVhY2goZnVuY3Rpb24gKGtleSkge1xyXG4gICAgdmFyIHR5cGUgPSBEZXNpZ25FeHBsb3Jlci50eXBlRGlzcGxheURpY3Rpb25hcnlba2V5XTtcclxuICAgIHZhciB0YWJsZSA9ICQoJzx0YWJsZSBjbGFzcz1cInRhYmxlIHRhYmxlLWNvbmRlbnNlZFwiPjwvdGFibGU+Jyk7XHJcbiAgICB2YXIgcGFyYW1zID0gZGVzaWduRXhwbG9yZXIucGFyYW1zW2tleV07XHJcbiAgICBwYXJhbXMuZm9yRWFjaChmdW5jdGlvbiAocGFyYW0pIHtcclxuICAgICAgdmFyIHJvdyA9ICQoJzx0cj48L3RyPicpO1xyXG4gICAgICByb3cuYXBwZW5kKCc8dGQ+JyArIHBhcmFtLmRpc3BsYXkgKyAnPC90ZD4nKTtcclxuICAgICAgcm93LmFwcGVuZCgnPHRkPicgKyBpdGVyYXRpb25bcGFyYW1bRGVzaWduRXhwbG9yZXIuZGF0YUtleV1dICsgJzwvdGQ+Jyk7XHJcbiAgICAgIHRhYmxlLmFwcGVuZChyb3cpO1xyXG5cclxuICAgICAgaWYgKHBhcmFtID09PSBkZXNpZ25FeHBsb3Jlci5zZWxlY3RlZFBhcmFtKSByb3cuY3NzKCdib3JkZXItbGVmdCcsICc1cHggc29saWQgJyArIGRlc2lnbkV4cGxvcmVyLmNvbG9yZXIoaXRlcmF0aW9uKSlcclxuICAgICAgICAuY3NzKCdmb250LXdlaWdodCcsICdib2xkJyk7XHJcbiAgICB9KTtcclxuICAgIGpxRWxlbWVudC5hcHBlbmQoJzxoND4nICsgdHlwZS5kaXNwbGF5ICsgJ3M8L2g0PicpO1xyXG4gICAganFFbGVtZW50LmFwcGVuZCh0YWJsZSk7XHJcbiAgfSk7XHJcblxyXG5cclxufTtcclxuIiwiRGVzaWduRXhwbG9yZXIucHJvdG90eXBlLmdldFBhcmFtRnJvbURhdGFrZXkgPSBmdW5jdGlvbiAoZGF0YUtleSkge1xyXG5cdHZhciBkZXNpZ25FeHBsb3JlciA9IHRoaXM7XHJcblxyXG5cdHJldHVybiBkZXNpZ25FeHBsb3Jlci5wYXJhbXNBbGwucmVkdWNlKGZ1bmN0aW9uIChwcmV2LCBjdXIpIHtcclxuXHRcdHJldHVybiBjdXJbRGVzaWduRXhwbG9yZXIuZGF0YUtleV0gPT09IGRhdGFLZXkgPyBjdXIgOiBwcmV2O1xyXG5cdH0sIG51bGwpO1xyXG59O1xyXG4iLCJEZXNpZ25FeHBsb3Jlci5wcm90b3R5cGUucGFyY29vcmRzX2NyZWF0ZSA9IGZ1bmN0aW9uIChkaXZTZWxlY3Rvcikge1xyXG5cclxuXHR2YXIgZGVzaWduRXhwbG9yZXIgPSB0aGlzO1xyXG5cclxuXHRkZXNpZ25FeHBsb3Jlci5ncmFwaHMuX3BhcmNvb3Jkc0RpdlNlbGVjdG9yID0gZGl2U2VsZWN0b3I7XHJcblxyXG5cdHZhciBkaXYgPSAkKGRpdlNlbGVjdG9yKTtcclxuXHJcblx0dmFyIGNvbnRleHRNZW51ID0gJCgnI2NvbnRleHQtbWVudScpO1xyXG5cclxuXHRkaXYuaHRtbCgnJyk7XHJcblxyXG5cdGRpdi5hZGRDbGFzcygncGFyY29vcmRzJyk7XHJcblxyXG5cdHZhciBkaW1lbnNpb25zID0gZGVzaWduRXhwbG9yZXIucGFyY29vcmRzX2dldEN1ckRpbXMoKTtcclxuXHJcblx0ZGVzaWduRXhwbG9yZXIuZ3JhcGhzLnBhcmNvb3JkcyA9IGQzLnBhcmNvb3JkcygpKGRpdlNlbGVjdG9yKVxyXG5cdFx0LmRhdGEoZGVzaWduRXhwbG9yZXIuZ2V0RGF0YSgpKVxyXG5cdFx0Ly8gLm1hcmdpbih7XHJcblx0XHQvLyBcdHRvcDogNTAsXHJcblx0XHQvLyBcdGxlZnQ6IDIwLFxyXG5cdFx0Ly8gXHRib3R0b206IDEwLFxyXG5cdFx0Ly8gXHRyaWdodDogMjBcclxuXHRcdC8vIH0pXHJcblx0XHQvLyAuc21vb3RobmVzcygwLjIpXHJcblx0XHQuY29sb3IoZGVzaWduRXhwbG9yZXIuY29sb3JlcilcclxuXHRcdC5hbHBoYSgwLjIpXHJcblx0XHQuYWxwaGFPbkJydXNoZWQoMC4wNSlcclxuXHRcdC5tb2RlKFwicXVldWVcIilcclxuXHRcdC5yYXRlKDIwKVxyXG5cdFx0LmRpbWVuc2lvbnMoZGltZW5zaW9ucylcclxuXHRcdC5yZW5kZXIoKVxyXG5cdFx0LmJydXNoTW9kZShcIjFELWF4ZXNcIikgLy8gZW5hYmxlIGJydXNoaW5nXHJcblx0XHQuYXV0b3NjYWxlKClcclxuXHRcdC5pbnRlcmFjdGl2ZSgpXHJcblx0XHQucmVvcmRlcmFibGUoKTtcclxuXHJcblx0cG9zdFJlbmRlcigpO1xyXG5cclxuXHRkZXNpZ25FeHBsb3Jlci5ncmFwaHMucGFyY29vcmRzLm9uKCdyZW5kZXInLCBfLmRlYm91bmNlKHBvc3RSZW5kZXIsIDQwMCkpO1xyXG5cdGRlc2lnbkV4cGxvcmVyLmdyYXBocy5wYXJjb29yZHMub24oJ2RpbWVuc2lvbnMnLCBfLmRlYm91bmNlKHBvc3RSZW5kZXIsIDQwMCkpO1xyXG5cdC8vIGRlc2lnbkV4cGxvcmVyLmdyYXBocy5wYXJjb29yZHMub24oJ2JydXNoJywgXy5kZWJvdW5jZShwb3N0QnJ1c2gsIDQwMCkpO1xyXG5cclxuXHRmdW5jdGlvbiBwb3N0UmVuZGVyKCkge1xyXG5cclxuXHRcdHZhciBkb21haW5Db2xvcnMgPSBbXTtcclxuXHJcblx0XHRkMy5zZWxlY3RBbGwoZGl2U2VsZWN0b3IgKyAnIGcuZGltZW5zaW9uJylcclxuXHRcdFx0LmVhY2goZnVuY3Rpb24gKGQsIGkpIHtcclxuXHRcdFx0XHR2YXIgcGFyYW0gPSBkZXNpZ25FeHBsb3Jlci5nZXRQYXJhbUZyb21EYXRha2V5KGQpO1xyXG5cdFx0XHRcdHZhciBwYXJhbUNvbG9yID0gKHBhcmFtLnR5cGUua2V5ID09PSAnaW4nKSA/ICcjOTk5JyA6ICcjMDAwJztcclxuXHRcdFx0XHR2YXIgdGhpc0QzID0gZDMuc2VsZWN0KHRoaXMpO1xyXG5cclxuXHRcdFx0XHR0aGlzRDMuc2VsZWN0QWxsKCd0ZXh0LmxhYmVsJylcclxuXHRcdFx0XHRcdC50ZXh0KHBhcmFtLmRpc3BsYXkpXHJcblx0XHRcdFx0XHQuc3R5bGUoJ2ZpbGwnLCBwYXJhbUNvbG9yKTtcclxuXHJcblx0XHRcdFx0dGhpc0QzLnNlbGVjdEFsbCgncGF0aC5kb21haW4nKVxyXG5cdFx0XHRcdFx0LnN0eWxlKCdzdHJva2UnLCBwYXJhbUNvbG9yKTtcclxuXHJcblx0XHRcdFx0dGhpc0QzLnNlbGVjdEFsbCgnIGcudGljayB0ZXh0JylcclxuXHRcdFx0XHRcdC5zdHlsZSgnZm9udC1zaXplJywgJzlweCcpXHJcblx0XHRcdFx0XHQuc3R5bGUoJ2ZpbGwnLCBwYXJhbUNvbG9yKTtcclxuXHJcblx0XHRcdFx0dGhpc0QzLnNlbGVjdEFsbCgnIGcuYnJ1c2ggcmVjdC5leHRlbnQnKVxyXG5cdFx0XHRcdFx0LnN0eWxlKCdmaWxsJywgJ3JnYmEoMjU1LDI1NSwyNTUsMC41KScpXHJcblx0XHRcdFx0XHQub24oJ2NvbnRleHRtZW51JywgZnVuY3Rpb24gKGQsIGkpIHtcclxuXHRcdFx0XHRcdFx0dmFyIGpUaGlzID0gJCh0aGlzKTtcclxuXHJcblx0XHRcdFx0XHRcdGlmIChOdW1iZXIoalRoaXMuYXR0cignaGVpZ2h0JykpID09PSAwKSByZXR1cm47XHJcblxyXG5cdFx0XHRcdFx0XHRkMy5ldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xyXG5cclxuXHRcdFx0XHRcdFx0Y29udGV4dE1lbnUuaHRtbCgnJyk7XHJcblx0XHRcdFx0XHRcdGNvbnRleHRNZW51LmNzcygnbGVmdCcsIGQzLmV2ZW50LmNsaWVudFgpO1xyXG5cdFx0XHRcdFx0XHRjb250ZXh0TWVudS5jc3MoJ3RvcCcsIGQzLmV2ZW50LmNsaWVudFkpO1xyXG5cclxuXHRcdFx0XHRcdFx0dmFyIGxnPSQoJzx1bCBjbGFzcz1cImxpc3QtZ3JvdXBcIj48L3VsPicpO1xyXG5cclxuXHRcdFx0XHRcdFx0dmFyIHJlc2V0QnJ1c2g9JCgnPGEgY2xhc3M9XCJsaXN0LWdyb3VwLWl0ZW1cIj5SZXNldCBleHRlbnRzPC9hPicpO1xyXG5cclxuXHRcdFx0XHRcdFx0cmVzZXRCcnVzaC5vbignY2xpY2snLGZ1bmN0aW9uKCl7XHJcblx0XHRcdFx0XHRcdFx0ZGVzaWduRXhwbG9yZXIuZ3JhcGhzLnBhcmNvb3Jkcy5icnVzaFJlc2V0KGQpO1xyXG5cdFx0XHRcdFx0XHR9KTtcclxuXHJcblx0XHRcdFx0XHRcdGxnLmFwcGVuZChyZXNldEJydXNoKTtcclxuXHRcdFx0XHRcdFx0Y29udGV4dE1lbnUuYXBwZW5kKGxnKTtcclxuXHJcblx0XHRcdFx0XHRcdGNvbnRleHRNZW51LnNob3coKTtcclxuXHJcblx0XHRcdFx0XHRcdGxnLm9uKCdjbGljaycsZnVuY3Rpb24oKXtcclxuXHRcdFx0XHRcdFx0XHRjb250ZXh0TWVudS5oaWRlKCk7XHJcblx0XHRcdFx0XHRcdH0pO1xyXG5cclxuXHRcdFx0XHRcdH0pO1xyXG5cdFx0XHR9KTtcclxuXHJcblx0XHRkZXNpZ25FeHBsb3Jlci5hYnN0cmFjdF9wYXJjb29yZHNfcG9zdFJlbmRlcigpO1xyXG5cdH1cclxuXHJcblx0Ly8gcmVzaXplIG9yIHJlLXJlbmRlciBicmVha3MgdGhlIGJydXNoIG1vZGVcclxuXHQvLyAkKHdpbmRvdylcclxuXHQvLyBcdC5vbigncmVzaXplJywgZnVuY3Rpb24gKCkge1xyXG5cdC8vIFx0XHRkZXNpZ25FeHBsb3Jlci5ncmFwaHMucGFyY29vcmRzLndpZHRoKGRpdi53aWR0aCgpKTtcclxuXHQvLyBcdH0pO1xyXG59O1xyXG5cclxuLypcclxuIOKWiOKWiOKWiOKWiOKWiCAg4paI4paI4paI4paI4paI4paIICDilojilojilojilojilojilojilogg4paI4paI4paI4paI4paI4paI4paI4paIIOKWiOKWiOKWiOKWiOKWiOKWiCAgIOKWiOKWiOKWiOKWiOKWiCAgIOKWiOKWiOKWiOKWiOKWiOKWiCDilojilojilojilojilojilojilojilogg4paI4paI4paI4paI4paI4paI4paIXHJcbuKWiOKWiCAgIOKWiOKWiCDilojiloggICDilojilogg4paI4paIICAgICAgICAg4paI4paIICAgIOKWiOKWiCAgIOKWiOKWiCDilojiloggICDilojilogg4paI4paIICAgICAgICAg4paI4paIICAgIOKWiOKWiFxyXG7ilojilojilojilojilojilojilogg4paI4paI4paI4paI4paI4paIICDilojilojilojilojilojilojiloggICAg4paI4paIICAgIOKWiOKWiOKWiOKWiOKWiOKWiCAg4paI4paI4paI4paI4paI4paI4paIIOKWiOKWiCAgICAgICAgIOKWiOKWiCAgICDilojilojilojilojilojilojilohcclxu4paI4paIICAg4paI4paIIOKWiOKWiCAgIOKWiOKWiCAgICAgIOKWiOKWiCAgICDilojiloggICAg4paI4paIICAg4paI4paIIOKWiOKWiCAgIOKWiOKWiCDilojiloggICAgICAgICDilojiloggICAgICAgICDilojilohcclxu4paI4paIICAg4paI4paIIOKWiOKWiOKWiOKWiOKWiOKWiCAg4paI4paI4paI4paI4paI4paI4paIICAgIOKWiOKWiCAgICDilojiloggICDilojilogg4paI4paIICAg4paI4paIICDilojilojilojilojilojiloggICAg4paI4paIICAgIOKWiOKWiOKWiOKWiOKWiOKWiOKWiFxyXG4qL1xyXG5cclxuLyoqXHJcbiAqIEludGVuZGVkIGZvciBvdmVyd3JpdGUuXHJcbiAqL1xyXG5EZXNpZ25FeHBsb3Jlci5wcm90b3R5cGUuYWJzdHJhY3RfcGFyY29vcmRzX3Bvc3RSZW5kZXIgPSBmdW5jdGlvbiAoKSB7fTtcclxuIiwiRGVzaWduRXhwbG9yZXIucHJvdG90eXBlLnBhcmNvb3Jkc19nZXRDdXJEaW1zID0gZnVuY3Rpb24gKCkge1xyXG5cclxuXHR2YXIgZGVzaWduRXhwbG9yZXIgPSB0aGlzO1xyXG5cclxuXHR2YXIgZGltZW5zaW9ucyA9IGRlc2lnbkV4cGxvcmVyLnBhcmFtc0FsbC5yZWR1Y2UoZnVuY3Rpb24gKHByZXYsIGN1cikge1xyXG5cdFx0aWYgKGN1ci5zaG93bkluUGFyY29vcmRzKSB7XHJcblx0XHRcdHByZXZbY3VyW0Rlc2lnbkV4cGxvcmVyLmRhdGFLZXldXSA9IHt9O1xyXG5cdFx0fVxyXG5cdFx0cmV0dXJuIHByZXY7XHJcblx0fSwge30pO1xyXG5cclxuXHRyZXR1cm4gZGltZW5zaW9ucztcclxuXHJcbn07XHJcbiIsIkRlc2lnbkV4cGxvcmVyLnByb3RvdHlwZS5wYXJjb29yZHNfcmVkcmF3ID0gZnVuY3Rpb24gKCkge1xyXG5cclxuXHR2YXIgZGVzaWduRXhwbG9yZXIgPSB0aGlzO1xyXG5cclxuXHRpZiAoIWRlc2lnbkV4cGxvcmVyLmdyYXBocy5wYXJjb29yZHMpIHJldHVybjtcclxuXHJcblx0ZGVzaWduRXhwbG9yZXIuZ3JhcGhzLnBhcmNvb3Jkcy5kaW1lbnNpb25zKGRlc2lnbkV4cGxvcmVyLnBhcmNvb3Jkc19nZXRDdXJEaW1zKCkpO1xyXG5cclxufTtcclxuIiwiLyoqXHJcbiAqIFRlbGwgdXMgd2hpY2ggcGFyYW0gdG8gY29sb3IgYnlcclxuICogQHBhcmFtIHtvYmplY3R9IHBhcmFtIC0gUGFyYW1ldGVyXHJcbiAqL1xyXG5EZXNpZ25FeHBsb3Jlci5wcm90b3R5cGUuc2V0Q29sb3JlciA9IGZ1bmN0aW9uIChwYXJhbSkge1xyXG5cclxuXHR2YXIgZGVzaWduRXhwbG9yZXIgPSB0aGlzO1xyXG5cclxuXHRkZXNpZ25FeHBsb3Jlci5zZWxlY3RlZFBhcmFtID0gcGFyYW07XHJcblxyXG5cdHZhciBkYXRhID0gZGVzaWduRXhwbG9yZXIuZ2V0RGF0YSgpO1xyXG5cclxuXHR2YXIgZXh0ZW50cyA9IGQzLmV4dGVudChkYXRhLCBkYXRhQWNjZXNzb3IpO1xyXG5cclxuXHR2YXIgY29sb3JTY2FsZSA9IGQzLnNjYWxlLmxpbmVhcigpXHJcblx0XHQuZG9tYWluKGV4dGVudHMpXHJcblx0XHQucmFuZ2UoW1wiIzNiMzFiMFwiLCBcIiM2NkNDRERcIl0pO1xyXG5cclxuXHRkZXNpZ25FeHBsb3Jlci5jb2xvcmVyID0gZnVuY3Rpb24gKGQpIHtcclxuXHRcdHJldHVybiBjb2xvclNjYWxlKGRhdGFBY2Nlc3NvcihkKSk7XHJcblx0fTtcclxuXHJcblx0aWYoZGVzaWduRXhwbG9yZXIuZ3JhcGhzLnBhcmNvb3Jkcykge1xyXG5cdFx0ZGVzaWduRXhwbG9yZXIuZ3JhcGhzLnBhcmNvb3Jkcy5jb2xvcihkZXNpZ25FeHBsb3Jlci5jb2xvcmVyKS5yZW5kZXIoKTtcclxuXHR9XHJcblxyXG5cdGZ1bmN0aW9uIGRhdGFBY2Nlc3NvcihkKSB7XHJcblx0XHRyZXR1cm4gZFtwYXJhbVtEZXNpZ25FeHBsb3Jlci5kYXRhS2V5XV07XHJcblx0fVxyXG5cclxufTtcclxuIl19
