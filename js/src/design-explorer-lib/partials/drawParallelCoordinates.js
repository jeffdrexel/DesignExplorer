DesignExplorer.prototype.drawParallelCoordinates = function (divSelector) {

	// console.log('drawing');

	var designExplorer = this;

	$(divSelector)
		.html('');

	$(divSelector)
		.addClass('parcoords');

	// console.log(designExplorer.paramsPC);

	var graph = d3.parcoords()(divSelector)
		.data(designExplorer.getData())
		// .margin({
		// 	top: 50,
		// 	left: 20,
		// 	bottom: 10,
		// 	right: 20
		// })
		.alpha(0.2)
		.alphaOnBrushed(0.05)
		.mode("queue")
		.rate(20)
		.dimensions(designExplorer.paramsPC)
		.render()
		.brushMode("1D-axes") // enable brushing
		.interactive()
		.reorderable();
};
