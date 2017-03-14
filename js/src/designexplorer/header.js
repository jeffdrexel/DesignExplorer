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
