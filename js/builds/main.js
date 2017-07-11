/**
 * Angular application. See Angular-specific documentation for anything inside
 * of app.something.
 * @type {object}
 * @global
 */
var app = angular.module('designexplorer.demo', ['ui.router']);

app.filter('typeof', function() {
  return function(obj) {
    return typeof obj;
  };
});

app.config(function($urlRouterProvider) {
  $urlRouterProvider.otherwise('/');
});

/**
 * @memberOf app
 * @ngdoc directive
 * @name navbar
 * @param {service}
 * @description
 *   Navbar. Doesn't really do anything interesting yet.
 */
app.directive('navbar', function() {
	return {
		restrict: 'E',
		templateUrl: 'js/src/main/directives/navbar/navbar.html',
		link: function(scope) {
		}
	};
});

/**
 * @memberOf app
 * @ngdoc directive
 * @name bottomNav
 * @param {service}
 * @description
 *   Resizable bottom navigation
 */
app.directive('bottomNav', function ($timeout) {
	return {
		restrict: 'E',
		templateUrl: 'js/src/main/directives/bottomNav/bottomNav.html',
		link: function (scope) {

			$timeout(initJquery);

			function initJquery() {

				var bottombar = $('.bottom-nav');

				// bottombar.resizable({
				// 	handles: {
				// 		'n': '#handle'
				// 	}
				// });
				//
				// bottombar.on('resize', respondToResize);

				$(window)
					.on('resize', respondToResize);

				respondToResize();

				function respondToResize() {

					var parallelDiv = $('#parallel-coords');

					// $('#main-content-flow')
					// 	.css('padding-bottom', bottombar.height()+150);

					$('#main-content-flow')
						.css('max-height', ($(window.top)
							.height() - bottombar.outerHeight() - 130) + 'px');


					// parallelDiv.css('height', bottombar.height() - 30);
					// parallelDiv.css('width', bottombar.width() - 30);
					// if (scope.designExplorer) {
					// 	scope.designExplorer.renderParallelCoordinates();
					// }

					scope.resizeThumbnails();
				}
			}
		}
	};
});

/**
 * @memberOf app
 * @ngdoc directive
 * @name animatedResults
 * @param {service}
 * @description
 *   Animated results
 */
app.directive('animatedResults', function ($timeout) {
	return {
		restrict: 'E',
		templateUrl: 'js/src/main/directives/animatedResults/animatedResults.html',
		link: function (scope) {

			scope.animatedResults={
				curFrame:0,
				frames:0,
				curFrameInfo:null
			};

			scope.$watch('filteredEntries', checkWhetherToAnimate);
			scope.$watch('viewMode', checkWhetherToAnimate);
			scope.$watch('selectedIteration', checkWhetherToAnimate);

			var debounceNext;
			var animateSpeed = 300;
			var isAnimating = false;

			/*
			 █████  ███    ██  ██████  ███    ██
			██   ██ ████   ██ ██    ██ ████   ██
			███████ ██ ██  ██ ██    ██ ██ ██  ██
			██   ██ ██  ██ ██ ██    ██ ██  ██ ██
			██   ██ ██   ████  ██████  ██   ████
			*/

			/**
			 * Check whether we should move forward with animating or terminate a previous animation
			 */
			function checkWhetherToAnimate() {
				if (!isAnimateMode() || scope.selectedIteration) {
					cleanPreviousAnimation();
				} else {
					startNewAnimation();
				}
			}

			/**
			 * Starts a new animation
			 */
			function startNewAnimation() {
				if (!scope.filteredEntries || !isAnimateMode()) return;
				if (!scope.filteredEntries.length) {
					$('#animated-results')
						.attr('src', '');
					$('#cur-frame-info')
						.html('');
				}

				scope.animatedResults.curFrame = 0;
				scope.animatedResults.frames = scope.filteredEntries.length;

				var newAnimateSpeed = Math.max(100000 / scope.animatedResults.frames, 300); // min debounce time
				newAnimateSpeed = Math.min(newAnimateSpeed, 1500); // max debounce time
				animateSpeed = newAnimateSpeed;

				if (!isAnimating) animate();
				isAnimating = true;
			}

			/**
			 * Animate loop
			 */
			function animate() {
				if (!isAnimateMode()) {
					isAnimating = false;
					return;
				} else {
					showNextFrame();
					setTimeout(function () {
						animate();
					}, animateSpeed);
				}
			}

			/**
			 * Code to move forward a frame. Called from the animate loop.
			 */
			function showNextFrame() {
				if (!isAnimateMode()) return;
				cleanPreviousAnimation();

				if (!scope.filteredEntries || !scope.filteredEntries.length) return;
				scope.animatedResults.curFrameInfo = scope.filteredEntries[scope.animatedResults.curFrame];

				$('#animated-results')
					.attr('src', scope.animatedResults.curFrameInfo.img);

				$('#animated-results')
					.on('click', function () {
						cleanPreviousAnimation();
						scope.viewMode='thumbnails';
						$timeout(function(){
							scope.selectIteration(scope.animatedResults.curFrameInfo);
						});
					});

				var infoBox = $('#cur-frame-info');

				scope.designExplorer.populateIterationTable(infoBox, scope.animatedResults.curFrameInfo);

				scope.designExplorer.graphs.parcoords.highlight([scope.animatedResults.curFrameInfo]);

				scope.animatedResults.curFrame += 1;
				if (scope.animatedResults.curFrame >= scope.animatedResults.frames) scope.animatedResults.curFrame = 0;
			}

			/**
			 * Clean leftover stuff from a previous animation
			 */
			function cleanPreviousAnimation() {
				if (scope.designExplorer && scope.designExplorer.graphs.parcoords) scope.designExplorer.graphs.parcoords.unhighlight();
			}

			/**
			 * Whether we're currently in animation mode
			 * @return {Boolean}
			 */
			function isAnimateMode() {
				return scope.viewMode === 'animation';
			}
		}
	};
});

/**
 * @memberOf app
 * @ngdoc directive
 * @name selectedIteration
 * @param {service}
 * @description
 *   The current selected iteration for inspection
 */
app.directive('selectedIteration', function ($timeout) {
	return {
		restrict: 'E',
		templateUrl: 'js/src/main/directives/selectedIteration/selectedIteration.html',
		link: function (scope) {
		}
	};
});

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

	$scope.toggleFullscreen = function () {

		var div = $('#selected-result');
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
			var maxCols = 12 + 1;
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

/**
 * @memberOf app
 * @ngdoc directive
 * @name resultsThumbnails
 * @param {service}
 * @description
 *   Thumbnails of results
 */
app.directive('resultsThumbnails', function ($timeout) {
	return {
		restrict: 'E',
		templateUrl: 'js/src/main/directives/resultsThumbnails/resultsThumbnails.html',
		link: function (scope) {

			scope.DesignExplorer = DesignExplorer;

			scope.getOrderBy = function () {
				return (scope.designExplorer && scope.designExplorer.selectedParam) ? scope.designExplorer.selectedParam[DesignExplorer.dataKey] : '';
			};

			scope.resultUnhighlight = function () {
				if (scope.selectedIteration) {
					scope.highlightIteration(scope.selectedIteration);
				} else {
					scope.unhighlightParcoords();
				}
			};

		}
	};
});

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImhlYWRlci5qcyIsImZpbHRlcnMvdHlwZU9mLmpzIiwic3RhdGVzL2RlZmF1bHQuanMiLCJkaXJlY3RpdmVzL25hdmJhci9uYXZiYXIuanMiLCJkaXJlY3RpdmVzL2JvdHRvbU5hdi9ib3R0b21OYXYuanMiLCJkaXJlY3RpdmVzL2FuaW1hdGVkUmVzdWx0cy9hbmltYXRlZFJlc3VsdHMuanMiLCJkaXJlY3RpdmVzL3NlbGVjdGVkSXRlcmF0aW9uL3NlbGVjdGVkSXRlcmF0aW9uLmpzIiwic3RhdGVzL3Jvb3Qvcm9vdC5qcyIsImRpcmVjdGl2ZXMvcmVzdWx0c1RodW1ibmFpbHMvcmVzdWx0c1RodW1ibmFpbHMuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ1BBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ0xBO0FBQ0E7QUFDQTtBQUNBO0FDSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ2hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3pEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUN0SUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ2hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ25NQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6Im1haW4uanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcclxuICogQW5ndWxhciBhcHBsaWNhdGlvbi4gU2VlIEFuZ3VsYXItc3BlY2lmaWMgZG9jdW1lbnRhdGlvbiBmb3IgYW55dGhpbmcgaW5zaWRlXHJcbiAqIG9mIGFwcC5zb21ldGhpbmcuXHJcbiAqIEB0eXBlIHtvYmplY3R9XHJcbiAqIEBnbG9iYWxcclxuICovXHJcbnZhciBhcHAgPSBhbmd1bGFyLm1vZHVsZSgnZGVzaWduZXhwbG9yZXIuZGVtbycsIFsndWkucm91dGVyJ10pO1xyXG4iLCJhcHAuZmlsdGVyKCd0eXBlb2YnLCBmdW5jdGlvbigpIHtcclxuICByZXR1cm4gZnVuY3Rpb24ob2JqKSB7XHJcbiAgICByZXR1cm4gdHlwZW9mIG9iajtcclxuICB9O1xyXG59KTtcclxuIiwiYXBwLmNvbmZpZyhmdW5jdGlvbigkdXJsUm91dGVyUHJvdmlkZXIpIHtcclxuICAkdXJsUm91dGVyUHJvdmlkZXIub3RoZXJ3aXNlKCcvJyk7XHJcbn0pO1xyXG4iLCIvKipcclxuICogQG1lbWJlck9mIGFwcFxyXG4gKiBAbmdkb2MgZGlyZWN0aXZlXHJcbiAqIEBuYW1lIG5hdmJhclxyXG4gKiBAcGFyYW0ge3NlcnZpY2V9XHJcbiAqIEBkZXNjcmlwdGlvblxyXG4gKiAgIE5hdmJhci4gRG9lc24ndCByZWFsbHkgZG8gYW55dGhpbmcgaW50ZXJlc3RpbmcgeWV0LlxyXG4gKi9cclxuYXBwLmRpcmVjdGl2ZSgnbmF2YmFyJywgZnVuY3Rpb24oKSB7XHJcblx0cmV0dXJuIHtcclxuXHRcdHJlc3RyaWN0OiAnRScsXHJcblx0XHR0ZW1wbGF0ZVVybDogJ2pzL3NyYy9tYWluL2RpcmVjdGl2ZXMvbmF2YmFyL25hdmJhci5odG1sJyxcclxuXHRcdGxpbms6IGZ1bmN0aW9uKHNjb3BlKSB7XHJcblx0XHR9XHJcblx0fTtcclxufSk7XHJcbiIsIi8qKlxyXG4gKiBAbWVtYmVyT2YgYXBwXHJcbiAqIEBuZ2RvYyBkaXJlY3RpdmVcclxuICogQG5hbWUgYm90dG9tTmF2XHJcbiAqIEBwYXJhbSB7c2VydmljZX1cclxuICogQGRlc2NyaXB0aW9uXHJcbiAqICAgUmVzaXphYmxlIGJvdHRvbSBuYXZpZ2F0aW9uXHJcbiAqL1xyXG5hcHAuZGlyZWN0aXZlKCdib3R0b21OYXYnLCBmdW5jdGlvbiAoJHRpbWVvdXQpIHtcclxuXHRyZXR1cm4ge1xyXG5cdFx0cmVzdHJpY3Q6ICdFJyxcclxuXHRcdHRlbXBsYXRlVXJsOiAnanMvc3JjL21haW4vZGlyZWN0aXZlcy9ib3R0b21OYXYvYm90dG9tTmF2Lmh0bWwnLFxyXG5cdFx0bGluazogZnVuY3Rpb24gKHNjb3BlKSB7XHJcblxyXG5cdFx0XHQkdGltZW91dChpbml0SnF1ZXJ5KTtcclxuXHJcblx0XHRcdGZ1bmN0aW9uIGluaXRKcXVlcnkoKSB7XHJcblxyXG5cdFx0XHRcdHZhciBib3R0b21iYXIgPSAkKCcuYm90dG9tLW5hdicpO1xyXG5cclxuXHRcdFx0XHQvLyBib3R0b21iYXIucmVzaXphYmxlKHtcclxuXHRcdFx0XHQvLyBcdGhhbmRsZXM6IHtcclxuXHRcdFx0XHQvLyBcdFx0J24nOiAnI2hhbmRsZSdcclxuXHRcdFx0XHQvLyBcdH1cclxuXHRcdFx0XHQvLyB9KTtcclxuXHRcdFx0XHQvL1xyXG5cdFx0XHRcdC8vIGJvdHRvbWJhci5vbigncmVzaXplJywgcmVzcG9uZFRvUmVzaXplKTtcclxuXHJcblx0XHRcdFx0JCh3aW5kb3cpXHJcblx0XHRcdFx0XHQub24oJ3Jlc2l6ZScsIHJlc3BvbmRUb1Jlc2l6ZSk7XHJcblxyXG5cdFx0XHRcdHJlc3BvbmRUb1Jlc2l6ZSgpO1xyXG5cclxuXHRcdFx0XHRmdW5jdGlvbiByZXNwb25kVG9SZXNpemUoKSB7XHJcblxyXG5cdFx0XHRcdFx0dmFyIHBhcmFsbGVsRGl2ID0gJCgnI3BhcmFsbGVsLWNvb3JkcycpO1xyXG5cclxuXHRcdFx0XHRcdC8vICQoJyNtYWluLWNvbnRlbnQtZmxvdycpXHJcblx0XHRcdFx0XHQvLyBcdC5jc3MoJ3BhZGRpbmctYm90dG9tJywgYm90dG9tYmFyLmhlaWdodCgpKzE1MCk7XHJcblxyXG5cdFx0XHRcdFx0JCgnI21haW4tY29udGVudC1mbG93JylcclxuXHRcdFx0XHRcdFx0LmNzcygnbWF4LWhlaWdodCcsICgkKHdpbmRvdy50b3ApXHJcblx0XHRcdFx0XHRcdFx0LmhlaWdodCgpIC0gYm90dG9tYmFyLm91dGVySGVpZ2h0KCkgLSAxMzApICsgJ3B4Jyk7XHJcblxyXG5cclxuXHRcdFx0XHRcdC8vIHBhcmFsbGVsRGl2LmNzcygnaGVpZ2h0JywgYm90dG9tYmFyLmhlaWdodCgpIC0gMzApO1xyXG5cdFx0XHRcdFx0Ly8gcGFyYWxsZWxEaXYuY3NzKCd3aWR0aCcsIGJvdHRvbWJhci53aWR0aCgpIC0gMzApO1xyXG5cdFx0XHRcdFx0Ly8gaWYgKHNjb3BlLmRlc2lnbkV4cGxvcmVyKSB7XHJcblx0XHRcdFx0XHQvLyBcdHNjb3BlLmRlc2lnbkV4cGxvcmVyLnJlbmRlclBhcmFsbGVsQ29vcmRpbmF0ZXMoKTtcclxuXHRcdFx0XHRcdC8vIH1cclxuXHJcblx0XHRcdFx0XHRzY29wZS5yZXNpemVUaHVtYm5haWxzKCk7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9XHJcblx0XHR9XHJcblx0fTtcclxufSk7XHJcbiIsIi8qKlxyXG4gKiBAbWVtYmVyT2YgYXBwXHJcbiAqIEBuZ2RvYyBkaXJlY3RpdmVcclxuICogQG5hbWUgYW5pbWF0ZWRSZXN1bHRzXHJcbiAqIEBwYXJhbSB7c2VydmljZX1cclxuICogQGRlc2NyaXB0aW9uXHJcbiAqICAgQW5pbWF0ZWQgcmVzdWx0c1xyXG4gKi9cclxuYXBwLmRpcmVjdGl2ZSgnYW5pbWF0ZWRSZXN1bHRzJywgZnVuY3Rpb24gKCR0aW1lb3V0KSB7XHJcblx0cmV0dXJuIHtcclxuXHRcdHJlc3RyaWN0OiAnRScsXHJcblx0XHR0ZW1wbGF0ZVVybDogJ2pzL3NyYy9tYWluL2RpcmVjdGl2ZXMvYW5pbWF0ZWRSZXN1bHRzL2FuaW1hdGVkUmVzdWx0cy5odG1sJyxcclxuXHRcdGxpbms6IGZ1bmN0aW9uIChzY29wZSkge1xyXG5cclxuXHRcdFx0c2NvcGUuYW5pbWF0ZWRSZXN1bHRzPXtcclxuXHRcdFx0XHRjdXJGcmFtZTowLFxyXG5cdFx0XHRcdGZyYW1lczowLFxyXG5cdFx0XHRcdGN1ckZyYW1lSW5mbzpudWxsXHJcblx0XHRcdH07XHJcblxyXG5cdFx0XHRzY29wZS4kd2F0Y2goJ2ZpbHRlcmVkRW50cmllcycsIGNoZWNrV2hldGhlclRvQW5pbWF0ZSk7XHJcblx0XHRcdHNjb3BlLiR3YXRjaCgndmlld01vZGUnLCBjaGVja1doZXRoZXJUb0FuaW1hdGUpO1xyXG5cdFx0XHRzY29wZS4kd2F0Y2goJ3NlbGVjdGVkSXRlcmF0aW9uJywgY2hlY2tXaGV0aGVyVG9BbmltYXRlKTtcclxuXHJcblx0XHRcdHZhciBkZWJvdW5jZU5leHQ7XHJcblx0XHRcdHZhciBhbmltYXRlU3BlZWQgPSAzMDA7XHJcblx0XHRcdHZhciBpc0FuaW1hdGluZyA9IGZhbHNlO1xyXG5cclxuXHRcdFx0LypcclxuXHRcdFx0IOKWiOKWiOKWiOKWiOKWiCAg4paI4paI4paIICAgIOKWiOKWiCAg4paI4paI4paI4paI4paI4paIICDilojilojiloggICAg4paI4paIXHJcblx0XHRcdOKWiOKWiCAgIOKWiOKWiCDilojilojilojiloggICDilojilogg4paI4paIICAgIOKWiOKWiCDilojilojilojiloggICDilojilohcclxuXHRcdFx04paI4paI4paI4paI4paI4paI4paIIOKWiOKWiCDilojiloggIOKWiOKWiCDilojiloggICAg4paI4paIIOKWiOKWiCDilojiloggIOKWiOKWiFxyXG5cdFx0XHTilojiloggICDilojilogg4paI4paIICDilojilogg4paI4paIIOKWiOKWiCAgICDilojilogg4paI4paIICDilojilogg4paI4paIXHJcblx0XHRcdOKWiOKWiCAgIOKWiOKWiCDilojiloggICDilojilojilojiloggIOKWiOKWiOKWiOKWiOKWiOKWiCAg4paI4paIICAg4paI4paI4paI4paIXHJcblx0XHRcdCovXHJcblxyXG5cdFx0XHQvKipcclxuXHRcdFx0ICogQ2hlY2sgd2hldGhlciB3ZSBzaG91bGQgbW92ZSBmb3J3YXJkIHdpdGggYW5pbWF0aW5nIG9yIHRlcm1pbmF0ZSBhIHByZXZpb3VzIGFuaW1hdGlvblxyXG5cdFx0XHQgKi9cclxuXHRcdFx0ZnVuY3Rpb24gY2hlY2tXaGV0aGVyVG9BbmltYXRlKCkge1xyXG5cdFx0XHRcdGlmICghaXNBbmltYXRlTW9kZSgpIHx8IHNjb3BlLnNlbGVjdGVkSXRlcmF0aW9uKSB7XHJcblx0XHRcdFx0XHRjbGVhblByZXZpb3VzQW5pbWF0aW9uKCk7XHJcblx0XHRcdFx0fSBlbHNlIHtcclxuXHRcdFx0XHRcdHN0YXJ0TmV3QW5pbWF0aW9uKCk7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHQvKipcclxuXHRcdFx0ICogU3RhcnRzIGEgbmV3IGFuaW1hdGlvblxyXG5cdFx0XHQgKi9cclxuXHRcdFx0ZnVuY3Rpb24gc3RhcnROZXdBbmltYXRpb24oKSB7XHJcblx0XHRcdFx0aWYgKCFzY29wZS5maWx0ZXJlZEVudHJpZXMgfHwgIWlzQW5pbWF0ZU1vZGUoKSkgcmV0dXJuO1xyXG5cdFx0XHRcdGlmICghc2NvcGUuZmlsdGVyZWRFbnRyaWVzLmxlbmd0aCkge1xyXG5cdFx0XHRcdFx0JCgnI2FuaW1hdGVkLXJlc3VsdHMnKVxyXG5cdFx0XHRcdFx0XHQuYXR0cignc3JjJywgJycpO1xyXG5cdFx0XHRcdFx0JCgnI2N1ci1mcmFtZS1pbmZvJylcclxuXHRcdFx0XHRcdFx0Lmh0bWwoJycpO1xyXG5cdFx0XHRcdH1cclxuXHJcblx0XHRcdFx0c2NvcGUuYW5pbWF0ZWRSZXN1bHRzLmN1ckZyYW1lID0gMDtcclxuXHRcdFx0XHRzY29wZS5hbmltYXRlZFJlc3VsdHMuZnJhbWVzID0gc2NvcGUuZmlsdGVyZWRFbnRyaWVzLmxlbmd0aDtcclxuXHJcblx0XHRcdFx0dmFyIG5ld0FuaW1hdGVTcGVlZCA9IE1hdGgubWF4KDEwMDAwMCAvIHNjb3BlLmFuaW1hdGVkUmVzdWx0cy5mcmFtZXMsIDMwMCk7IC8vIG1pbiBkZWJvdW5jZSB0aW1lXHJcblx0XHRcdFx0bmV3QW5pbWF0ZVNwZWVkID0gTWF0aC5taW4obmV3QW5pbWF0ZVNwZWVkLCAxNTAwKTsgLy8gbWF4IGRlYm91bmNlIHRpbWVcclxuXHRcdFx0XHRhbmltYXRlU3BlZWQgPSBuZXdBbmltYXRlU3BlZWQ7XHJcblxyXG5cdFx0XHRcdGlmICghaXNBbmltYXRpbmcpIGFuaW1hdGUoKTtcclxuXHRcdFx0XHRpc0FuaW1hdGluZyA9IHRydWU7XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdC8qKlxyXG5cdFx0XHQgKiBBbmltYXRlIGxvb3BcclxuXHRcdFx0ICovXHJcblx0XHRcdGZ1bmN0aW9uIGFuaW1hdGUoKSB7XHJcblx0XHRcdFx0aWYgKCFpc0FuaW1hdGVNb2RlKCkpIHtcclxuXHRcdFx0XHRcdGlzQW5pbWF0aW5nID0gZmFsc2U7XHJcblx0XHRcdFx0XHRyZXR1cm47XHJcblx0XHRcdFx0fSBlbHNlIHtcclxuXHRcdFx0XHRcdHNob3dOZXh0RnJhbWUoKTtcclxuXHRcdFx0XHRcdHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xyXG5cdFx0XHRcdFx0XHRhbmltYXRlKCk7XHJcblx0XHRcdFx0XHR9LCBhbmltYXRlU3BlZWQpO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0LyoqXHJcblx0XHRcdCAqIENvZGUgdG8gbW92ZSBmb3J3YXJkIGEgZnJhbWUuIENhbGxlZCBmcm9tIHRoZSBhbmltYXRlIGxvb3AuXHJcblx0XHRcdCAqL1xyXG5cdFx0XHRmdW5jdGlvbiBzaG93TmV4dEZyYW1lKCkge1xyXG5cdFx0XHRcdGlmICghaXNBbmltYXRlTW9kZSgpKSByZXR1cm47XHJcblx0XHRcdFx0Y2xlYW5QcmV2aW91c0FuaW1hdGlvbigpO1xyXG5cclxuXHRcdFx0XHRpZiAoIXNjb3BlLmZpbHRlcmVkRW50cmllcyB8fCAhc2NvcGUuZmlsdGVyZWRFbnRyaWVzLmxlbmd0aCkgcmV0dXJuO1xyXG5cdFx0XHRcdHNjb3BlLmFuaW1hdGVkUmVzdWx0cy5jdXJGcmFtZUluZm8gPSBzY29wZS5maWx0ZXJlZEVudHJpZXNbc2NvcGUuYW5pbWF0ZWRSZXN1bHRzLmN1ckZyYW1lXTtcclxuXHJcblx0XHRcdFx0JCgnI2FuaW1hdGVkLXJlc3VsdHMnKVxyXG5cdFx0XHRcdFx0LmF0dHIoJ3NyYycsIHNjb3BlLmFuaW1hdGVkUmVzdWx0cy5jdXJGcmFtZUluZm8uaW1nKTtcclxuXHJcblx0XHRcdFx0JCgnI2FuaW1hdGVkLXJlc3VsdHMnKVxyXG5cdFx0XHRcdFx0Lm9uKCdjbGljaycsIGZ1bmN0aW9uICgpIHtcclxuXHRcdFx0XHRcdFx0Y2xlYW5QcmV2aW91c0FuaW1hdGlvbigpO1xyXG5cdFx0XHRcdFx0XHRzY29wZS52aWV3TW9kZT0ndGh1bWJuYWlscyc7XHJcblx0XHRcdFx0XHRcdCR0aW1lb3V0KGZ1bmN0aW9uKCl7XHJcblx0XHRcdFx0XHRcdFx0c2NvcGUuc2VsZWN0SXRlcmF0aW9uKHNjb3BlLmFuaW1hdGVkUmVzdWx0cy5jdXJGcmFtZUluZm8pO1xyXG5cdFx0XHRcdFx0XHR9KTtcclxuXHRcdFx0XHRcdH0pO1xyXG5cclxuXHRcdFx0XHR2YXIgaW5mb0JveCA9ICQoJyNjdXItZnJhbWUtaW5mbycpO1xyXG5cclxuXHRcdFx0XHRzY29wZS5kZXNpZ25FeHBsb3Jlci5wb3B1bGF0ZUl0ZXJhdGlvblRhYmxlKGluZm9Cb3gsIHNjb3BlLmFuaW1hdGVkUmVzdWx0cy5jdXJGcmFtZUluZm8pO1xyXG5cclxuXHRcdFx0XHRzY29wZS5kZXNpZ25FeHBsb3Jlci5ncmFwaHMucGFyY29vcmRzLmhpZ2hsaWdodChbc2NvcGUuYW5pbWF0ZWRSZXN1bHRzLmN1ckZyYW1lSW5mb10pO1xyXG5cclxuXHRcdFx0XHRzY29wZS5hbmltYXRlZFJlc3VsdHMuY3VyRnJhbWUgKz0gMTtcclxuXHRcdFx0XHRpZiAoc2NvcGUuYW5pbWF0ZWRSZXN1bHRzLmN1ckZyYW1lID49IHNjb3BlLmFuaW1hdGVkUmVzdWx0cy5mcmFtZXMpIHNjb3BlLmFuaW1hdGVkUmVzdWx0cy5jdXJGcmFtZSA9IDA7XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdC8qKlxyXG5cdFx0XHQgKiBDbGVhbiBsZWZ0b3ZlciBzdHVmZiBmcm9tIGEgcHJldmlvdXMgYW5pbWF0aW9uXHJcblx0XHRcdCAqL1xyXG5cdFx0XHRmdW5jdGlvbiBjbGVhblByZXZpb3VzQW5pbWF0aW9uKCkge1xyXG5cdFx0XHRcdGlmIChzY29wZS5kZXNpZ25FeHBsb3JlciAmJiBzY29wZS5kZXNpZ25FeHBsb3Jlci5ncmFwaHMucGFyY29vcmRzKSBzY29wZS5kZXNpZ25FeHBsb3Jlci5ncmFwaHMucGFyY29vcmRzLnVuaGlnaGxpZ2h0KCk7XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdC8qKlxyXG5cdFx0XHQgKiBXaGV0aGVyIHdlJ3JlIGN1cnJlbnRseSBpbiBhbmltYXRpb24gbW9kZVxyXG5cdFx0XHQgKiBAcmV0dXJuIHtCb29sZWFufVxyXG5cdFx0XHQgKi9cclxuXHRcdFx0ZnVuY3Rpb24gaXNBbmltYXRlTW9kZSgpIHtcclxuXHRcdFx0XHRyZXR1cm4gc2NvcGUudmlld01vZGUgPT09ICdhbmltYXRpb24nO1xyXG5cdFx0XHR9XHJcblx0XHR9XHJcblx0fTtcclxufSk7XHJcbiIsIi8qKlxyXG4gKiBAbWVtYmVyT2YgYXBwXHJcbiAqIEBuZ2RvYyBkaXJlY3RpdmVcclxuICogQG5hbWUgc2VsZWN0ZWRJdGVyYXRpb25cclxuICogQHBhcmFtIHtzZXJ2aWNlfVxyXG4gKiBAZGVzY3JpcHRpb25cclxuICogICBUaGUgY3VycmVudCBzZWxlY3RlZCBpdGVyYXRpb24gZm9yIGluc3BlY3Rpb25cclxuICovXHJcbmFwcC5kaXJlY3RpdmUoJ3NlbGVjdGVkSXRlcmF0aW9uJywgZnVuY3Rpb24gKCR0aW1lb3V0KSB7XHJcblx0cmV0dXJuIHtcclxuXHRcdHJlc3RyaWN0OiAnRScsXHJcblx0XHR0ZW1wbGF0ZVVybDogJ2pzL3NyYy9tYWluL2RpcmVjdGl2ZXMvc2VsZWN0ZWRJdGVyYXRpb24vc2VsZWN0ZWRJdGVyYXRpb24uaHRtbCcsXHJcblx0XHRsaW5rOiBmdW5jdGlvbiAoc2NvcGUpIHtcclxuXHRcdH1cclxuXHR9O1xyXG59KTtcclxuIiwiLyoqXHJcbiAqIEJhc2Ugc3RhdGUgZm9yIGFsbCBuZXN0ZWQgZnV0dXJlIHN0YXRlcyB3ZSBtYXkgaGF2ZVxyXG4gKi9cclxuYXBwLmNvbmZpZyhmdW5jdGlvbiAoJHN0YXRlUHJvdmlkZXIpIHtcclxuXHQkc3RhdGVQcm92aWRlci5zdGF0ZSgncm9vdCcsIHtcclxuXHRcdG5hbWU6ICdyb290JyxcclxuXHRcdC8vIGFic3RyYWN0OiB0cnVlLFxyXG5cdFx0dXJsOiAnLz9zZXQnLFxyXG5cdFx0dGVtcGxhdGVVcmw6ICdqcy9zcmMvbWFpbi9zdGF0ZXMvcm9vdC9yb290Lmh0bWwnLFxyXG5cdFx0Y29udHJvbGxlcjogJ1Jvb3RTdGF0ZUN0cmwnXHJcblx0fSk7XHJcbn0pO1xyXG5cclxuYXBwLmNvbnRyb2xsZXIoJ1Jvb3RTdGF0ZUN0cmwnLCBmdW5jdGlvbiAoJHJvb3RTY29wZSwgJHNjb3BlLCAkdGltZW91dCwgJHN0YXRlUGFyYW1zKSB7XHJcblxyXG5cdHZhciBkZXNpZ25FeHBsb3JlcjtcclxuXHJcblx0dmFyIHNwZWN0O1xyXG5cclxuXHR2YXIgaXNGdWxsc2NyZWVuID0gZmFsc2U7XHJcblxyXG5cdHZhciBzZXRWYXJzID0gJHN0YXRlUGFyYW1zLnNldC5zcGxpdChcIixcIik7XHJcblxyXG5cdHZhciBkYXRhUHJlZml4ID0gJ2RhdGEvJyArIHNldFZhcnNbMF0gKyAnLyc7XHJcblxyXG5cdHZhciB1cmwgPSBkYXRhUHJlZml4ICsgJ29wdGlvbnMuanNvbic7XHJcblxyXG5cdCRzY29wZS5kZXZNb2RlID0gc2V0VmFyc1sxXSB8fCBmYWxzZTtcclxuXHJcblx0JC5nZXQoZGF0YVByZWZpeCArICdvcHRpb25zLmpzb24nLCBmdW5jdGlvbiAob3B0aW9ucykge1xyXG5cdFx0aWYgKCFvcHRpb25zLmRhdGFVcmwpIG9wdGlvbnMgPSBKU09OLnBhcnNlKG9wdGlvbnMpO1xyXG5cdFx0ZDMuY3N2KGRhdGFQcmVmaXggKyBvcHRpb25zLmRhdGFVcmwpXHJcblx0XHRcdC5nZXQoZnVuY3Rpb24gKGVycm9yLCByb3dzKSB7XHJcblx0XHRcdFx0cm93cy5mb3JFYWNoKGZ1bmN0aW9uIChyb3cpIHtcclxuXHRcdFx0XHRcdHJvdy5pbWcgPSBkYXRhUHJlZml4ICsgcm93LmltZztcclxuXHRcdFx0XHRcdHJvdy50aHJlZUQgPSBkYXRhUHJlZml4ICsgcm93LnRocmVlRDtcclxuXHRcdFx0XHR9KTtcclxuXHRcdFx0XHQkc2NvcGUuZGVzaWduRXhwbG9yZXIgPSBuZXcgRGVzaWduRXhwbG9yZXIocm93cywgb3B0aW9ucyk7XHJcblx0XHRcdFx0ZHJhd0Rlc2lnbkV4cGxvcmVyKCk7XHJcblx0XHRcdH0pO1xyXG5cdH0pO1xyXG5cclxuXHQkc2NvcGUudmlld01vZGUgPSAndGh1bWJuYWlscyc7XHJcblxyXG5cdCRzY29wZS5zZWxlY3RlZEl0ZXJhdGlvbiA9IG51bGw7XHJcblxyXG5cdCRzY29wZS5EZXNpZ25FeHBsb3JlciA9IHtcclxuXHRcdCd0eXBlRGlzcGxheURpY3Rpb25hcnknOiBEZXNpZ25FeHBsb3Jlci50eXBlRGlzcGxheURpY3Rpb25hcnlcclxuXHR9O1xyXG5cclxuXHQkdGltZW91dChmdW5jdGlvbiAoKSB7XHJcblx0XHRzcGVjdCA9IG5ldyBTUEVDVEFDTEVTKCQoJyNzcGVjdGFjbGVzLWNvbnRhaW5lcicpKTtcclxuXHR9KTtcclxuXHJcblx0LypcclxuXHTilojilojilojilojilojilojiloggIOKWiOKWiOKWiOKWiOKWiOKWiCAg4paI4paI4paI4paI4paI4paIICDilojilojilojilojilojiloggIOKWiOKWiOKWiOKWiOKWiOKWiOKWiCAgICAg4paI4paI4paI4paI4paI4paI4paIIOKWiOKWiOKWiCAgICDilojilohcclxuXHTilojiloggICAgICDilojiloggICAgICDilojiloggICAg4paI4paIIOKWiOKWiCAgIOKWiOKWiCDilojiloggICAgICAgICAg4paI4paIICAgICAg4paI4paI4paI4paIICAg4paI4paIXHJcblx04paI4paI4paI4paI4paI4paI4paIIOKWiOKWiCAgICAgIOKWiOKWiCAgICDilojilogg4paI4paI4paI4paI4paI4paIICDilojilojilojilojiloggICAgICAg4paI4paI4paI4paI4paIICAg4paI4paIIOKWiOKWiCAg4paI4paIXHJcblx0ICAgICDilojilogg4paI4paIICAgICAg4paI4paIICAgIOKWiOKWiCDilojiloggICAgICDilojiloggICAgICAgICAg4paI4paIICAgICAg4paI4paIICDilojilogg4paI4paIXHJcblx04paI4paI4paI4paI4paI4paI4paIICDilojilojilojilojilojiloggIOKWiOKWiOKWiOKWiOKWiOKWiCAg4paI4paIICAgICAg4paI4paI4paI4paI4paI4paI4paIICAgICDilojiloggICAgICDilojiloggICDilojilojilojilohcclxuXHQqL1xyXG5cclxuXHQkc2NvcGUuc2VsZWN0SXRlcmF0aW9uID0gZnVuY3Rpb24gKGl0ZXJhdGlvbikge1xyXG5cdFx0JHNjb3BlLnJlc3VsdE1vZGUgPSAnaW1hZ2UnO1xyXG5cdFx0JHNjb3BlLnNlbGVjdGVkSXRlcmF0aW9uID0gaXRlcmF0aW9uO1xyXG5cdFx0JHNjb3BlLnJlc2l6ZVRodW1ibmFpbHMoKTtcclxuXHRcdGlmICghaXRlcmF0aW9uKSByZXR1cm47XHJcblx0XHQkc2NvcGUuZGVzaWduRXhwbG9yZXIucG9wdWxhdGVJdGVyYXRpb25UYWJsZSgkKCcjc2VsZWN0ZWQtaXRlcmF0aW9uLWluZm8nKSwgaXRlcmF0aW9uKTtcclxuXHRcdCRzY29wZS5oaWdobGlnaHRJdGVyYXRpb24oaXRlcmF0aW9uKTtcclxuXHR9O1xyXG5cclxuXHQkc2NvcGUudW5oaWdobGlnaHRQYXJjb29yZHMgPSBmdW5jdGlvbiAoKSB7XHJcblx0XHQkc2NvcGUuZGVzaWduRXhwbG9yZXIuZ3JhcGhzLnBhcmNvb3Jkcy51bmhpZ2hsaWdodCgpO1xyXG5cdH07XHJcblxyXG5cdCRzY29wZS5oaWdobGlnaHRJdGVyYXRpb24gPSBmdW5jdGlvbiAoaXRlcmF0aW9uKSB7XHJcblx0XHQkc2NvcGUudW5oaWdobGlnaHRQYXJjb29yZHMoKTtcclxuXHRcdCR0aW1lb3V0KGZ1bmN0aW9uICgpIHtcclxuXHRcdFx0JHNjb3BlLmRlc2lnbkV4cGxvcmVyLmdyYXBocy5wYXJjb29yZHMuaGlnaGxpZ2h0KFtpdGVyYXRpb25dKTtcclxuXHRcdH0pO1xyXG5cdH07XHJcblxyXG5cdCRzY29wZS5zZXQyZE1vZGUgPSBmdW5jdGlvbiAoKSB7XHJcblx0XHQkc2NvcGUucmVzdWx0TW9kZSA9ICdpbWFnZSc7XHJcblx0fTtcclxuXHJcblx0JHNjb3BlLnNldDNkTW9kZSA9IGZ1bmN0aW9uICgpIHtcclxuXHRcdGlmICghJHNjb3BlLnNlbGVjdGVkSXRlcmF0aW9uKSByZXR1cm47XHJcblx0XHQkc2NvcGUucmVzdWx0TW9kZSA9ICczZCc7XHJcblx0XHRkMy5qc29uKCRzY29wZS5zZWxlY3RlZEl0ZXJhdGlvbi50aHJlZUQsIGZ1bmN0aW9uIChkYXRhKSB7XHJcblx0XHRcdHNwZWN0LmxvYWROZXdNb2RlbChkYXRhKTtcclxuXHRcdFx0c3BlY3Quem9vbUV4dGVudHMoKTtcclxuXHRcdFx0c3BlY3QubGlnaHRpbmdSaWcuc2V0QW1iaWVudExpZ2h0Q29sb3IoJyM4ODgnKTtcclxuXHRcdFx0c3BlY3QubGlnaHRpbmdSaWcuc2V0UG9pbnRMaWdodHNDb2xvcignIzg4OCcpO1xyXG5cdFx0fSk7XHJcblx0XHQkdGltZW91dChmdW5jdGlvbiAoKSB7XHJcblx0XHRcdCQoJyNzcGVjdGFjbGVzLWNvbnRhaW5lcicpXHJcblx0XHRcdFx0LnRyaWdnZXIoJ3Jlc2l6ZScpO1xyXG5cdFx0fSk7XHJcblx0fTtcclxuXHJcblx0JHNjb3BlLnRvZ2dsZUZ1bGxzY3JlZW4gPSBmdW5jdGlvbiAoKSB7XHJcblxyXG5cdFx0dmFyIGRpdiA9ICQoJyNzZWxlY3RlZC1yZXN1bHQnKTtcclxuXHRcdHZhciBvdGhlckRpdnMgPSAkKCcuaGlkZS1pbi1mdWxsc2NyZWVuJyk7XHJcblxyXG5cdFx0aWYgKCFpc0Z1bGxzY3JlZW4pIHtcclxuXHRcdFx0ZGl2LmFkZENsYXNzKCdmdWxsLXNjcmVlbicpO1xyXG5cdFx0XHRvdGhlckRpdnMuaGlkZSgpO1xyXG5cdFx0fSBlbHNlIHtcclxuXHRcdFx0ZGl2LnJlbW92ZUNsYXNzKCdmdWxsLXNjcmVlbicpO1xyXG5cdFx0XHRvdGhlckRpdnMuc2hvdygpO1xyXG5cdFx0fVxyXG5cclxuXHRcdCQoJyNzcGVjdGFjbGVzLWNvbnRhaW5lcicpXHJcblx0XHRcdC50cmlnZ2VyKCdyZXNpemUnKTtcclxuXHJcblx0XHRpc0Z1bGxzY3JlZW4gPSAhaXNGdWxsc2NyZWVuO1xyXG5cdH07XHJcblxyXG5cdCRzY29wZS5yZXNpemVUaHVtYm5haWxzID0gZnVuY3Rpb24gKCkge1xyXG5cdFx0aWYgKCEkc2NvcGUuZmlsdGVyZWRFbnRyaWVzKSByZXR1cm47XHJcblx0XHR2YXIgZmxvdyA9ICQoJyNtYWluLWNvbnRlbnQtZmxvdycpO1xyXG5cdFx0dmFyIHJhdGlvID0gTWF0aC5jZWlsKGZsb3cud2lkdGgoKSAvIGZsb3cuaGVpZ2h0KCkpO1xyXG5cclxuXHRcdC8vIGNvbnNvbGUubG9nKCdyYXRpbycsIHJhdGlvKTtcclxuXHJcblx0XHR2YXIgY29sQ291bnQgPSBnZXRDb2x1bW5Db3VudChyYXRpbywgJHNjb3BlLmZpbHRlcmVkRW50cmllcy5sZW5ndGgpO1xyXG5cclxuXHRcdHZhciBzaXplID0gTWF0aC5mbG9vcihmbG93LndpZHRoKCkgLyBjb2xDb3VudCk7XHJcblx0XHR2YXIgcGFkZGluZ1NpemUgPSAyNDtcclxuXHJcblx0XHR2YXIgcmVzdWx0VGh1bWJuYWlscyA9ICQoJy5yZXN1bHQtaW1hZ2UgLnJlc3VsdC1pbWFnZS1mcmFtZScpO1xyXG5cclxuXHRcdGlmICgkc2NvcGUuc2VsZWN0ZWRJdGVyYXRpb24pIHNpemUgPSAwO1xyXG5cdFx0cmVzdWx0VGh1bWJuYWlscy5jc3MoJ3dpZHRoJywgc2l6ZSAtIHBhZGRpbmdTaXplICsgJ3B4Jyk7XHJcblxyXG5cdFx0ZnVuY3Rpb24gZ2V0Q29sdW1uQ291bnQocmF0aW8sIG51bUl0ZW1zKSB7XHJcblx0XHRcdHZhciBtYXhDb2xzID0gMTIgKyAxO1xyXG5cdFx0XHR2YXIgY29sdW1ucyA9IDA7XHJcblx0XHRcdHZhciBpdGVtQ2FwYWNpdHkgPSAwO1xyXG5cclxuXHRcdFx0d2hpbGUgKGl0ZW1DYXBhY2l0eSA8IG51bUl0ZW1zICYmIGNvbHVtbnMgPCBtYXhDb2xzKSB7XHJcblx0XHRcdFx0aXRlbUNhcGFjaXR5ID0gY29sdW1ucyAqIHJhdGlvO1xyXG5cdFx0XHRcdGNvbHVtbnMgKz0gMTtcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0cmV0dXJuIE1hdGgubWF4KDEsIGNvbHVtbnMgKyAxKTtcclxuXHJcblx0XHR9XHJcblx0fTtcclxuXHJcblxyXG5cclxuXHQvKlxyXG5cdOKWiOKWiCAgICAg4paI4paIICDilojilojilojilojiloggIOKWiOKWiOKWiOKWiOKWiOKWiOKWiOKWiCAg4paI4paI4paI4paI4paI4paIIOKWiOKWiCAgIOKWiOKWiFxyXG5cdOKWiOKWiCAgICAg4paI4paIIOKWiOKWiCAgIOKWiOKWiCAgICDilojiloggICAg4paI4paIICAgICAg4paI4paIICAg4paI4paIXHJcblx04paI4paIICDiloggIOKWiOKWiCDilojilojilojilojilojilojiloggICAg4paI4paIICAgIOKWiOKWiCAgICAgIOKWiOKWiOKWiOKWiOKWiOKWiOKWiFxyXG5cdOKWiOKWiCDilojilojilogg4paI4paIIOKWiOKWiCAgIOKWiOKWiCAgICDilojiloggICAg4paI4paIICAgICAg4paI4paIICAg4paI4paIXHJcblx0IOKWiOKWiOKWiCDilojilojiloggIOKWiOKWiCAgIOKWiOKWiCAgICDilojiloggICAgIOKWiOKWiOKWiOKWiOKWiOKWiCDilojiloggICDilojilohcclxuXHQqL1xyXG5cclxuXHQkc2NvcGUuJHdhdGNoKCdkZXNpZ25FeHBsb3JlcicsIGRyYXdEZXNpZ25FeHBsb3Jlcik7XHJcblxyXG5cclxuXHJcblx0LypcclxuXHQg4paI4paI4paI4paI4paIICDilojilojiloggICAg4paI4paIICDilojilojilojilojilojiloggIOKWiOKWiOKWiCAgICDilojilohcclxuXHTilojiloggICDilojilogg4paI4paI4paI4paIICAg4paI4paIIOKWiOKWiCAgICDilojilogg4paI4paI4paI4paIICAg4paI4paIXHJcblx04paI4paI4paI4paI4paI4paI4paIIOKWiOKWiCDilojiloggIOKWiOKWiCDilojiloggICAg4paI4paIIOKWiOKWiCDilojiloggIOKWiOKWiFxyXG5cdOKWiOKWiCAgIOKWiOKWiCDilojiloggIOKWiOKWiCDilojilogg4paI4paIICAgIOKWiOKWiCDilojiloggIOKWiOKWiCDilojilohcclxuXHTilojiloggICDilojilogg4paI4paIICAg4paI4paI4paI4paIICDilojilojilojilojilojiloggIOKWiOKWiCAgIOKWiOKWiOKWiOKWiFxyXG5cdCovXHJcblxyXG5cdGZ1bmN0aW9uIGRyYXdEZXNpZ25FeHBsb3JlcigpIHtcclxuXHRcdCR0aW1lb3V0KGZ1bmN0aW9uICgpIHtcclxuXHRcdFx0aWYgKCRzY29wZS5kZXNpZ25FeHBsb3Jlcikge1xyXG5cdFx0XHRcdGlmICghZDMuc2VsZWN0KCcjcGFyYWxsZWwtY29vcmRzJylbMF1bMF0pIHJldHVybiBkcmF3RGVzaWduRXhwbG9yZXIoKTtcclxuXHRcdFx0XHQkc2NvcGUuZGVzaWduRXhwbG9yZXIucGFyY29vcmRzX2NyZWF0ZSgnI3BhcmFsbGVsLWNvb3JkcycpO1xyXG5cdFx0XHRcdHNldEZpbHRlcmVkRW50cmllcygpO1xyXG5cdFx0XHRcdCRzY29wZS5kZXNpZ25FeHBsb3Jlci5hYnN0cmFjdF9wYXJjb29yZHNfcG9zdFJlbmRlciA9IHNldEZpbHRlcmVkRW50cmllcztcclxuXHRcdFx0fVxyXG5cdFx0fSk7XHJcblx0fVxyXG5cclxuXHRmdW5jdGlvbiBzZXRGaWx0ZXJlZEVudHJpZXMoKSB7XHJcblx0XHQkc2NvcGUuZmlsdGVyZWRFbnRyaWVzID0gJHNjb3BlLmRlc2lnbkV4cGxvcmVyLmdyYXBocy5wYXJjb29yZHMuYnJ1c2hlZCgpIHx8ICRzY29wZS5kZXNpZ25FeHBsb3Jlci5nZXREYXRhKCk7XHJcblx0XHQkc2NvcGUuc2VsZWN0SXRlcmF0aW9uKG51bGwpO1xyXG5cdFx0JHRpbWVvdXQoZnVuY3Rpb24gKCkge1xyXG5cdFx0XHQkc2NvcGUuJGFwcGx5KCk7XHJcblx0XHRcdCRzY29wZS5yZXNpemVUaHVtYm5haWxzKCk7XHJcblx0XHR9KTtcclxuXHR9XHJcblxyXG59KTtcclxuIiwiLyoqXHJcbiAqIEBtZW1iZXJPZiBhcHBcclxuICogQG5nZG9jIGRpcmVjdGl2ZVxyXG4gKiBAbmFtZSByZXN1bHRzVGh1bWJuYWlsc1xyXG4gKiBAcGFyYW0ge3NlcnZpY2V9XHJcbiAqIEBkZXNjcmlwdGlvblxyXG4gKiAgIFRodW1ibmFpbHMgb2YgcmVzdWx0c1xyXG4gKi9cclxuYXBwLmRpcmVjdGl2ZSgncmVzdWx0c1RodW1ibmFpbHMnLCBmdW5jdGlvbiAoJHRpbWVvdXQpIHtcclxuXHRyZXR1cm4ge1xyXG5cdFx0cmVzdHJpY3Q6ICdFJyxcclxuXHRcdHRlbXBsYXRlVXJsOiAnanMvc3JjL21haW4vZGlyZWN0aXZlcy9yZXN1bHRzVGh1bWJuYWlscy9yZXN1bHRzVGh1bWJuYWlscy5odG1sJyxcclxuXHRcdGxpbms6IGZ1bmN0aW9uIChzY29wZSkge1xyXG5cclxuXHRcdFx0c2NvcGUuRGVzaWduRXhwbG9yZXIgPSBEZXNpZ25FeHBsb3JlcjtcclxuXHJcblx0XHRcdHNjb3BlLmdldE9yZGVyQnkgPSBmdW5jdGlvbiAoKSB7XHJcblx0XHRcdFx0cmV0dXJuIChzY29wZS5kZXNpZ25FeHBsb3JlciAmJiBzY29wZS5kZXNpZ25FeHBsb3Jlci5zZWxlY3RlZFBhcmFtKSA/IHNjb3BlLmRlc2lnbkV4cGxvcmVyLnNlbGVjdGVkUGFyYW1bRGVzaWduRXhwbG9yZXIuZGF0YUtleV0gOiAnJztcclxuXHRcdFx0fTtcclxuXHJcblx0XHRcdHNjb3BlLnJlc3VsdFVuaGlnaGxpZ2h0ID0gZnVuY3Rpb24gKCkge1xyXG5cdFx0XHRcdGlmIChzY29wZS5zZWxlY3RlZEl0ZXJhdGlvbikge1xyXG5cdFx0XHRcdFx0c2NvcGUuaGlnaGxpZ2h0SXRlcmF0aW9uKHNjb3BlLnNlbGVjdGVkSXRlcmF0aW9uKTtcclxuXHRcdFx0XHR9IGVsc2Uge1xyXG5cdFx0XHRcdFx0c2NvcGUudW5oaWdobGlnaHRQYXJjb29yZHMoKTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdH07XHJcblxyXG5cdFx0fVxyXG5cdH07XHJcbn0pO1xyXG4iXX0=
