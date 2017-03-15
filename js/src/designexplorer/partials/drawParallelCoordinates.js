DesignExplorer.prototype.drawParallelCoordinates = function (divSelector) {

	var designExplorer = this;

	designExplorer.graphs._parcoordsDivSelector = divSelector;

	var div = $(divSelector);

	div.html('');

	div.addClass('parcoords');

	var dimensions = designExplorer.paramsAll.reduce(function (prev, cur) {
		prev[cur[DesignExplorer.dataKey]] = {};
		return prev;
	}, {});

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
