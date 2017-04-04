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

				if(cleanedDatum.img){
					cleanedDatum.imgThumb=cleanedDatum.img.replace(/.(png|gif|jpe?g)$/i, '_thumb.$1');
				}

			data.push(cleanedDatum);
		});
	}

};

DesignExplorer.dataKey = 'cleanKey';
