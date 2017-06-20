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
