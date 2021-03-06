/**
 * Base state for all nested future states we may have
 */
app.config(function ($stateProvider) {
	$stateProvider.state('root', {
		name: 'root',
		// abstract: true,
		url: '/?set',
		templateUrl: 'js/src/main/states/root/root.html',
		controller: 'RootStateCtrl'
	});
});

app.controller('RootStateCtrl', function ($rootScope, $scope, $timeout, $stateParams) {

	var designExplorer;

	var spect;

	var isFullscreen = false;

	var setVars = $stateParams.set.split(",");

	var dataPrefix = 'data/' + setVars[0] + '/';

	var url = dataPrefix + 'options.json';

	$scope.devMode = setVars[1] || false;

	$.get(dataPrefix + 'options.json', function (options) {
		if (!options.dataUrl) options = JSON.parse(options);
		d3.csv(dataPrefix + options.dataUrl)
			.get(function (error, rows) {
				rows.forEach(function (row) {
					row.img = dataPrefix + row.img;
					row.threeD = dataPrefix + row.threeD;
				});
				$scope.designExplorer = new DesignExplorer(rows, options);
				drawDesignExplorer();
			});
	});

	$scope.viewMode = 'thumbnails';

	$scope.selectedIteration = null;

	$scope.DesignExplorer = {
		'typeDisplayDictionary': DesignExplorer.typeDisplayDictionary
	};

	$timeout(function () {
		spect = new SPECTACLES($('#spectacles-container'));
	});

	/*
	███████  ██████  ██████  ██████  ███████     ███████ ███    ██
	██      ██      ██    ██ ██   ██ ██          ██      ████   ██
	███████ ██      ██    ██ ██████  █████       █████   ██ ██  ██
	     ██ ██      ██    ██ ██      ██          ██      ██  ██ ██
	███████  ██████  ██████  ██      ███████     ██      ██   ████
	*/

	$scope.selectIteration = function (iteration) {
		$scope.resultMode = 'image';
		$scope.selectedIteration = iteration;
		$scope.resizeThumbnails();
		if (!iteration) return;
		$scope.designExplorer.populateIterationTable($('#selected-iteration-info'), iteration);
		$scope.highlightIteration(iteration);
	};

	$scope.unhighlightParcoords = function () {
		$scope.designExplorer.graphs.parcoords.unhighlight();
	};

	$scope.highlightIteration = function (iteration) {
		$scope.unhighlightParcoords();
		$timeout(function () {
			$scope.designExplorer.graphs.parcoords.highlight([iteration]);
		});
	};

	$scope.set2dMode = function () {
		$scope.resultMode = 'image';
	};

	$scope.set3dMode = function () {
		if (!$scope.selectedIteration) return;
		$scope.resultMode = '3d';
		d3.json($scope.selectedIteration.threeD, function (data) {
			spect.loadNewModel(data);
			spect.zoomExtents();
			spect.lightingRig.setAmbientLightColor('#888');
			spect.lightingRig.setPointLightsColor('#888');
		});
		$timeout(function () {
			$('#spectacles-container')
				.trigger('resize');
		});
	};

	$scope.toggleFullscreen = function (selector) {

		var div = $(selector);
		var otherDivs = $('.hide-in-fullscreen');

		if (!isFullscreen) {
			div.addClass('full-screen');
			otherDivs.hide();
		} else {
			div.removeClass('full-screen');
			otherDivs.show();
		}

		$('#spectacles-container')
			.trigger('resize');

		isFullscreen = !isFullscreen;
	};

	$scope.resizeThumbnails = function () {
		if (!$scope.filteredEntries) return;
		var flow = $('#main-content-flow');
		var ratio = Math.ceil(flow.width() / flow.height());

		// console.log('ratio', ratio);

		var colCount = getColumnCount(ratio, $scope.filteredEntries.length);

		var size = Math.floor(flow.width() / colCount);
		var paddingSize = 24;

		var resultThumbnails = $('.result-image .result-image-frame');

		if ($scope.selectedIteration) size = 0;
		resultThumbnails.css('width', size - paddingSize + 'px');

		function getColumnCount(ratio, numItems) {
			var maxCols = $scope.designExplorer.options.maxThumbCols + 1;
			var columns = 0;
			var itemCapacity = 0;

			while (itemCapacity < numItems && columns < maxCols) {
				itemCapacity = columns * ratio;
				columns += 1;
			}

			return Math.max(1, columns + 1);

		}
	};



	/*
	██     ██  █████  ████████  ██████ ██   ██
	██     ██ ██   ██    ██    ██      ██   ██
	██  █  ██ ███████    ██    ██      ███████
	██ ███ ██ ██   ██    ██    ██      ██   ██
	 ███ ███  ██   ██    ██     ██████ ██   ██
	*/

	$scope.$watch('designExplorer', drawDesignExplorer);



	/*
	 █████  ███    ██  ██████  ███    ██
	██   ██ ████   ██ ██    ██ ████   ██
	███████ ██ ██  ██ ██    ██ ██ ██  ██
	██   ██ ██  ██ ██ ██    ██ ██  ██ ██
	██   ██ ██   ████  ██████  ██   ████
	*/

	function drawDesignExplorer() {
		$timeout(function () {
			if ($scope.designExplorer) {
				if (!d3.select('#parallel-coords')[0][0]) return drawDesignExplorer();
				$scope.designExplorer.parcoords_create('#parallel-coords');
				setFilteredEntries();
				$scope.designExplorer.abstract_parcoords_postRender = setFilteredEntries;
			}
		});
	}

	function setFilteredEntries() {
		$scope.filteredEntries = $scope.designExplorer.graphs.parcoords.brushed() || $scope.designExplorer.getData();
		$scope.selectIteration(null);
		$timeout(function () {
			$scope.$apply();
			$scope.resizeThumbnails();
		});
	}

});
