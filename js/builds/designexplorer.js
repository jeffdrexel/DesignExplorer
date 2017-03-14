/**
 * @constructor
 */
var DesignExplorer = function (originalData) {

	/**
	 * @lends DesignExplorer.prototype
	 */
	var designExplorer = this;

	var data = [];

	designExplorer.params = {
		'in': [],
		'out': []
	};

	// Set later by setColorer
	designExplorer.selectedParam = null;

	// Parallel coordinate dimensions
	designExplorer.paramsPC = {};

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

	function sortKeys(){
		// Initial Cleanup
		var keys = d3.keys(originalData[0]);

		// Populate which are input and output keys
		keys.forEach(function (key) {
			Object.keys(designExplorer.params)
				.forEach(function (keyType) {
					var signifier = DesignExplorer.getKeyTypeSignifier(keyType);
					var keyObj;
					if (key.startsWith(signifier)) {
						keyObj = {
							'original': key,
							'display:': key.substring(signifier.length, key.length)
						};
						designExplorer.params[keyType].push(keyObj);
						designExplorer.paramsPC[key] = {};
					}
				});
		});
	}

	function cleanData(){
		// clean data
		originalData.forEach(function (datum, i) {
			var cleanedDatum = {
				_id: i
			};

			Object.keys(datum)
				.forEach(function (key) {
					var floatVersion = parseFloat(datum[key]);
					cleanedDatum[key] = isNaN(floatVersion) ? datum[key] : floatVersion;
				});

			data.push(cleanedDatum);
		});
	}

};

DesignExplorer.prototype.drawParallelCoordinates = function (divSelector) {

	var designExplorer = this;

	$(divSelector)
		.html('');

	$(divSelector)
		.addClass('parcoords');

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
		.interactive()
		.reorderable();
};

DesignExplorer.prototype.setColorer = function (param) {

	var designExplorer = this;

	designExplorer.selectedParam = param;

	var data = designExplorer.getData();

	var extents = d3.extent(data, dataAccessor);

	var colorScale = d3.scale.linear()
		.domain(extents)
		.range(["#3b31b0", "#66CCDD"])

	designExplorer.colorer = function (d) {
		return colorScale(dataAccessor(d));
	};

	function dataAccessor(d) {
		return d[param.original];
	};

};

DesignExplorer.getKeyTypeSignifier = function (str) {
	return str + ":";
};

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImhlYWRlci5qcyIsInBhcnRpYWxzL2RyYXdQYXJhbGxlbENvb3JkaW5hdGVzLmpzIiwicGFydGlhbHMvc2V0Q29sb3Jlci5qcyIsInN0YXRpY3MvZ2V0S2V5VHlwZVNpZ25pZmllci5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDckZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDOUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3ZCQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJkZXNpZ25leHBsb3Jlci5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxyXG4gKiBAY29uc3RydWN0b3JcclxuICovXHJcbnZhciBEZXNpZ25FeHBsb3JlciA9IGZ1bmN0aW9uIChvcmlnaW5hbERhdGEpIHtcclxuXHJcblx0LyoqXHJcblx0ICogQGxlbmRzIERlc2lnbkV4cGxvcmVyLnByb3RvdHlwZVxyXG5cdCAqL1xyXG5cdHZhciBkZXNpZ25FeHBsb3JlciA9IHRoaXM7XHJcblxyXG5cdHZhciBkYXRhID0gW107XHJcblxyXG5cdGRlc2lnbkV4cGxvcmVyLnBhcmFtcyA9IHtcclxuXHRcdCdpbic6IFtdLFxyXG5cdFx0J291dCc6IFtdXHJcblx0fTtcclxuXHJcblx0Ly8gU2V0IGxhdGVyIGJ5IHNldENvbG9yZXJcclxuXHRkZXNpZ25FeHBsb3Jlci5zZWxlY3RlZFBhcmFtID0gbnVsbDtcclxuXHJcblx0Ly8gUGFyYWxsZWwgY29vcmRpbmF0ZSBkaW1lbnNpb25zXHJcblx0ZGVzaWduRXhwbG9yZXIucGFyYW1zUEMgPSB7fTtcclxuXHJcblx0Ly8gQWxsIGdyYXBocyBuYW1lc3BhY2VcclxuXHRkZXNpZ25FeHBsb3Jlci5ncmFwaHMgPSB7fTtcclxuXHJcblx0c29ydEtleXMoKTtcclxuXHRjbGVhbkRhdGEoKTtcclxuXHJcblx0Ly8gQWNjZXNzIHRoaXMgZGF0YSBsYXRlclxyXG5cdERlc2lnbkV4cGxvcmVyLnByb3RvdHlwZS5nZXREYXRhID0gZnVuY3Rpb24gKCkge1xyXG5cdFx0cmV0dXJuIGRhdGE7XHJcblx0fTtcclxuXHJcblx0Ly8gU2V0IGRlZmF1bHQgc29ydCBieSBrZXlcclxuXHRkZXNpZ25FeHBsb3Jlci5zZXRDb2xvcmVyKGRlc2lnbkV4cGxvcmVyLnBhcmFtcy5pblswXSk7XHJcblxyXG5cdC8qXHJcblx0IOKWiOKWiOKWiOKWiOKWiCAg4paI4paI4paIICAgIOKWiOKWiCAg4paI4paI4paI4paI4paI4paIICDilojilojiloggICAg4paI4paIXHJcblx04paI4paIICAg4paI4paIIOKWiOKWiOKWiOKWiCAgIOKWiOKWiCDilojiloggICAg4paI4paIIOKWiOKWiOKWiOKWiCAgIOKWiOKWiFxyXG5cdOKWiOKWiOKWiOKWiOKWiOKWiOKWiCDilojilogg4paI4paIICDilojilogg4paI4paIICAgIOKWiOKWiCDilojilogg4paI4paIICDilojilohcclxuXHTilojiloggICDilojilogg4paI4paIICDilojilogg4paI4paIIOKWiOKWiCAgICDilojilogg4paI4paIICDilojilogg4paI4paIXHJcblx04paI4paIICAg4paI4paIIOKWiOKWiCAgIOKWiOKWiOKWiOKWiCAg4paI4paI4paI4paI4paI4paIICDilojiloggICDilojilojilojilohcclxuXHQqL1xyXG5cclxuXHRmdW5jdGlvbiBzb3J0S2V5cygpe1xyXG5cdFx0Ly8gSW5pdGlhbCBDbGVhbnVwXHJcblx0XHR2YXIga2V5cyA9IGQzLmtleXMob3JpZ2luYWxEYXRhWzBdKTtcclxuXHJcblx0XHQvLyBQb3B1bGF0ZSB3aGljaCBhcmUgaW5wdXQgYW5kIG91dHB1dCBrZXlzXHJcblx0XHRrZXlzLmZvckVhY2goZnVuY3Rpb24gKGtleSkge1xyXG5cdFx0XHRPYmplY3Qua2V5cyhkZXNpZ25FeHBsb3Jlci5wYXJhbXMpXHJcblx0XHRcdFx0LmZvckVhY2goZnVuY3Rpb24gKGtleVR5cGUpIHtcclxuXHRcdFx0XHRcdHZhciBzaWduaWZpZXIgPSBEZXNpZ25FeHBsb3Jlci5nZXRLZXlUeXBlU2lnbmlmaWVyKGtleVR5cGUpO1xyXG5cdFx0XHRcdFx0dmFyIGtleU9iajtcclxuXHRcdFx0XHRcdGlmIChrZXkuc3RhcnRzV2l0aChzaWduaWZpZXIpKSB7XHJcblx0XHRcdFx0XHRcdGtleU9iaiA9IHtcclxuXHRcdFx0XHRcdFx0XHQnb3JpZ2luYWwnOiBrZXksXHJcblx0XHRcdFx0XHRcdFx0J2Rpc3BsYXk6Jzoga2V5LnN1YnN0cmluZyhzaWduaWZpZXIubGVuZ3RoLCBrZXkubGVuZ3RoKVxyXG5cdFx0XHRcdFx0XHR9O1xyXG5cdFx0XHRcdFx0XHRkZXNpZ25FeHBsb3Jlci5wYXJhbXNba2V5VHlwZV0ucHVzaChrZXlPYmopO1xyXG5cdFx0XHRcdFx0XHRkZXNpZ25FeHBsb3Jlci5wYXJhbXNQQ1trZXldID0ge307XHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0fSk7XHJcblx0XHR9KTtcclxuXHR9XHJcblxyXG5cdGZ1bmN0aW9uIGNsZWFuRGF0YSgpe1xyXG5cdFx0Ly8gY2xlYW4gZGF0YVxyXG5cdFx0b3JpZ2luYWxEYXRhLmZvckVhY2goZnVuY3Rpb24gKGRhdHVtLCBpKSB7XHJcblx0XHRcdHZhciBjbGVhbmVkRGF0dW0gPSB7XHJcblx0XHRcdFx0X2lkOiBpXHJcblx0XHRcdH07XHJcblxyXG5cdFx0XHRPYmplY3Qua2V5cyhkYXR1bSlcclxuXHRcdFx0XHQuZm9yRWFjaChmdW5jdGlvbiAoa2V5KSB7XHJcblx0XHRcdFx0XHR2YXIgZmxvYXRWZXJzaW9uID0gcGFyc2VGbG9hdChkYXR1bVtrZXldKTtcclxuXHRcdFx0XHRcdGNsZWFuZWREYXR1bVtrZXldID0gaXNOYU4oZmxvYXRWZXJzaW9uKSA/IGRhdHVtW2tleV0gOiBmbG9hdFZlcnNpb247XHJcblx0XHRcdFx0fSk7XHJcblxyXG5cdFx0XHRkYXRhLnB1c2goY2xlYW5lZERhdHVtKTtcclxuXHRcdH0pO1xyXG5cdH1cclxuXHJcbn07XHJcbiIsIkRlc2lnbkV4cGxvcmVyLnByb3RvdHlwZS5kcmF3UGFyYWxsZWxDb29yZGluYXRlcyA9IGZ1bmN0aW9uIChkaXZTZWxlY3Rvcikge1xyXG5cclxuXHR2YXIgZGVzaWduRXhwbG9yZXIgPSB0aGlzO1xyXG5cclxuXHQkKGRpdlNlbGVjdG9yKVxyXG5cdFx0Lmh0bWwoJycpO1xyXG5cclxuXHQkKGRpdlNlbGVjdG9yKVxyXG5cdFx0LmFkZENsYXNzKCdwYXJjb29yZHMnKTtcclxuXHJcblx0ZGVzaWduRXhwbG9yZXIuZ3JhcGhzLnBhcmNvb3JkcyA9IGQzLnBhcmNvb3JkcygpKGRpdlNlbGVjdG9yKVxyXG5cdFx0LmRhdGEoZGVzaWduRXhwbG9yZXIuZ2V0RGF0YSgpKVxyXG5cdFx0Ly8gLm1hcmdpbih7XHJcblx0XHQvLyBcdHRvcDogNTAsXHJcblx0XHQvLyBcdGxlZnQ6IDIwLFxyXG5cdFx0Ly8gXHRib3R0b206IDEwLFxyXG5cdFx0Ly8gXHRyaWdodDogMjBcclxuXHRcdC8vIH0pXHJcblx0XHQvLyAuc21vb3RobmVzcygwLjIpXHJcblx0XHQuY29sb3IoZGVzaWduRXhwbG9yZXIuY29sb3JlcilcclxuXHRcdC5hbHBoYSgwLjIpXHJcblx0XHQuYWxwaGFPbkJydXNoZWQoMC4wNSlcclxuXHRcdC5tb2RlKFwicXVldWVcIilcclxuXHRcdC5yYXRlKDIwKVxyXG5cdFx0LmRpbWVuc2lvbnMoZGVzaWduRXhwbG9yZXIucGFyYW1zUEMpXHJcblx0XHQucmVuZGVyKClcclxuXHRcdC5icnVzaE1vZGUoXCIxRC1heGVzXCIpIC8vIGVuYWJsZSBicnVzaGluZ1xyXG5cdFx0LmludGVyYWN0aXZlKClcclxuXHRcdC5yZW9yZGVyYWJsZSgpO1xyXG59O1xyXG4iLCJEZXNpZ25FeHBsb3Jlci5wcm90b3R5cGUuc2V0Q29sb3JlciA9IGZ1bmN0aW9uIChwYXJhbSkge1xyXG5cclxuXHR2YXIgZGVzaWduRXhwbG9yZXIgPSB0aGlzO1xyXG5cclxuXHRkZXNpZ25FeHBsb3Jlci5zZWxlY3RlZFBhcmFtID0gcGFyYW07XHJcblxyXG5cdHZhciBkYXRhID0gZGVzaWduRXhwbG9yZXIuZ2V0RGF0YSgpO1xyXG5cclxuXHR2YXIgZXh0ZW50cyA9IGQzLmV4dGVudChkYXRhLCBkYXRhQWNjZXNzb3IpO1xyXG5cclxuXHR2YXIgY29sb3JTY2FsZSA9IGQzLnNjYWxlLmxpbmVhcigpXHJcblx0XHQuZG9tYWluKGV4dGVudHMpXHJcblx0XHQucmFuZ2UoW1wiIzNiMzFiMFwiLCBcIiM2NkNDRERcIl0pXHJcblxyXG5cdGRlc2lnbkV4cGxvcmVyLmNvbG9yZXIgPSBmdW5jdGlvbiAoZCkge1xyXG5cdFx0cmV0dXJuIGNvbG9yU2NhbGUoZGF0YUFjY2Vzc29yKGQpKTtcclxuXHR9O1xyXG5cclxuXHRmdW5jdGlvbiBkYXRhQWNjZXNzb3IoZCkge1xyXG5cdFx0cmV0dXJuIGRbcGFyYW0ub3JpZ2luYWxdO1xyXG5cdH07XHJcblxyXG59O1xyXG4iLCJEZXNpZ25FeHBsb3Jlci5nZXRLZXlUeXBlU2lnbmlmaWVyID0gZnVuY3Rpb24gKHN0cikge1xyXG5cdHJldHVybiBzdHIgKyBcIjpcIjtcclxufTtcclxuIl19
