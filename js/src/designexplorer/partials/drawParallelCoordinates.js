DesignExplorer.prototype.drawParallelCoordinates = function (divSelector) {

	var designExplorer = this;

	designExplorer.graphs._parcoordsDivSelector = divSelector;

	var div = $(divSelector);

	div.html('');

	div.addClass('parcoords');

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
		.dimensions(designExplorer.paramsPC)
		.render()
		.brushMode("1D-axes") // enable brushing
		.autoscale()
		.interactive()
		.reorderable();

		// resize or re-render breaks the brush mode
	// $(window)
	// 	.on('resize', function () {
	// 		designExplorer.graphs.parcoords.width(div.width());
	// 	});
};
