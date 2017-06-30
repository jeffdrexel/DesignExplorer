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
			scope.getOrderBy = function () {
				return (scope.designExplorer && scope.designExplorer.selectedParam) ? scope.designExplorer.selectedParam[DesignExplorer.dataKey] : '';
			};

			scope.resultUnhighlight=function(){
				if(scope.selectedIteration){
					scope.highlightIteration(scope.selectedIteration);
				} else{
					scope.unhighlightParcoords();
				}
			};

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

	var dataPrefix = 'data/' + $stateParams.set + '/';

	var url = dataPrefix + 'options.json';

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

		var resultThumbnails = $('.result-image');

		if ($scope.selectedIteration) size=0;
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

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImhlYWRlci5qcyIsImZpbHRlcnMvdHlwZU9mLmpzIiwic3RhdGVzL2RlZmF1bHQuanMiLCJkaXJlY3RpdmVzL2FuaW1hdGVkUmVzdWx0cy9hbmltYXRlZFJlc3VsdHMuanMiLCJkaXJlY3RpdmVzL3Jlc3VsdHNUaHVtYm5haWxzL3Jlc3VsdHNUaHVtYm5haWxzLmpzIiwiZGlyZWN0aXZlcy9ib3R0b21OYXYvYm90dG9tTmF2LmpzIiwiZGlyZWN0aXZlcy9zZWxlY3RlZEl0ZXJhdGlvbi9zZWxlY3RlZEl0ZXJhdGlvbi5qcyIsImRpcmVjdGl2ZXMvbmF2YmFyL25hdmJhci5qcyIsInN0YXRlcy9yb290L3Jvb3QuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ1BBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ0xBO0FBQ0E7QUFDQTtBQUNBO0FDSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDdElBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUM1QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUN6REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ2hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDaEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJtYWluLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXHJcbiAqIEFuZ3VsYXIgYXBwbGljYXRpb24uIFNlZSBBbmd1bGFyLXNwZWNpZmljIGRvY3VtZW50YXRpb24gZm9yIGFueXRoaW5nIGluc2lkZVxyXG4gKiBvZiBhcHAuc29tZXRoaW5nLlxyXG4gKiBAdHlwZSB7b2JqZWN0fVxyXG4gKiBAZ2xvYmFsXHJcbiAqL1xyXG52YXIgYXBwID0gYW5ndWxhci5tb2R1bGUoJ2Rlc2lnbmV4cGxvcmVyLmRlbW8nLCBbJ3VpLnJvdXRlciddKTtcclxuIiwiYXBwLmZpbHRlcigndHlwZW9mJywgZnVuY3Rpb24oKSB7XHJcbiAgcmV0dXJuIGZ1bmN0aW9uKG9iaikge1xyXG4gICAgcmV0dXJuIHR5cGVvZiBvYmo7XHJcbiAgfTtcclxufSk7XHJcbiIsImFwcC5jb25maWcoZnVuY3Rpb24oJHVybFJvdXRlclByb3ZpZGVyKSB7XHJcbiAgJHVybFJvdXRlclByb3ZpZGVyLm90aGVyd2lzZSgnLycpO1xyXG59KTtcclxuIiwiLyoqXHJcbiAqIEBtZW1iZXJPZiBhcHBcclxuICogQG5nZG9jIGRpcmVjdGl2ZVxyXG4gKiBAbmFtZSBhbmltYXRlZFJlc3VsdHNcclxuICogQHBhcmFtIHtzZXJ2aWNlfVxyXG4gKiBAZGVzY3JpcHRpb25cclxuICogICBBbmltYXRlZCByZXN1bHRzXHJcbiAqL1xyXG5hcHAuZGlyZWN0aXZlKCdhbmltYXRlZFJlc3VsdHMnLCBmdW5jdGlvbiAoJHRpbWVvdXQpIHtcclxuXHRyZXR1cm4ge1xyXG5cdFx0cmVzdHJpY3Q6ICdFJyxcclxuXHRcdHRlbXBsYXRlVXJsOiAnanMvc3JjL21haW4vZGlyZWN0aXZlcy9hbmltYXRlZFJlc3VsdHMvYW5pbWF0ZWRSZXN1bHRzLmh0bWwnLFxyXG5cdFx0bGluazogZnVuY3Rpb24gKHNjb3BlKSB7XHJcblxyXG5cdFx0XHRzY29wZS5hbmltYXRlZFJlc3VsdHM9e1xyXG5cdFx0XHRcdGN1ckZyYW1lOjAsXHJcblx0XHRcdFx0ZnJhbWVzOjAsXHJcblx0XHRcdFx0Y3VyRnJhbWVJbmZvOm51bGxcclxuXHRcdFx0fTtcclxuXHJcblx0XHRcdHNjb3BlLiR3YXRjaCgnZmlsdGVyZWRFbnRyaWVzJywgY2hlY2tXaGV0aGVyVG9BbmltYXRlKTtcclxuXHRcdFx0c2NvcGUuJHdhdGNoKCd2aWV3TW9kZScsIGNoZWNrV2hldGhlclRvQW5pbWF0ZSk7XHJcblx0XHRcdHNjb3BlLiR3YXRjaCgnc2VsZWN0ZWRJdGVyYXRpb24nLCBjaGVja1doZXRoZXJUb0FuaW1hdGUpO1xyXG5cclxuXHRcdFx0dmFyIGRlYm91bmNlTmV4dDtcclxuXHRcdFx0dmFyIGFuaW1hdGVTcGVlZCA9IDMwMDtcclxuXHRcdFx0dmFyIGlzQW5pbWF0aW5nID0gZmFsc2U7XHJcblxyXG5cdFx0XHQvKlxyXG5cdFx0XHQg4paI4paI4paI4paI4paIICDilojilojiloggICAg4paI4paIICDilojilojilojilojilojiloggIOKWiOKWiOKWiCAgICDilojilohcclxuXHRcdFx04paI4paIICAg4paI4paIIOKWiOKWiOKWiOKWiCAgIOKWiOKWiCDilojiloggICAg4paI4paIIOKWiOKWiOKWiOKWiCAgIOKWiOKWiFxyXG5cdFx0XHTilojilojilojilojilojilojilogg4paI4paIIOKWiOKWiCAg4paI4paIIOKWiOKWiCAgICDilojilogg4paI4paIIOKWiOKWiCAg4paI4paIXHJcblx0XHRcdOKWiOKWiCAgIOKWiOKWiCDilojiloggIOKWiOKWiCDilojilogg4paI4paIICAgIOKWiOKWiCDilojiloggIOKWiOKWiCDilojilohcclxuXHRcdFx04paI4paIICAg4paI4paIIOKWiOKWiCAgIOKWiOKWiOKWiOKWiCAg4paI4paI4paI4paI4paI4paIICDilojiloggICDilojilojilojilohcclxuXHRcdFx0Ki9cclxuXHJcblx0XHRcdC8qKlxyXG5cdFx0XHQgKiBDaGVjayB3aGV0aGVyIHdlIHNob3VsZCBtb3ZlIGZvcndhcmQgd2l0aCBhbmltYXRpbmcgb3IgdGVybWluYXRlIGEgcHJldmlvdXMgYW5pbWF0aW9uXHJcblx0XHRcdCAqL1xyXG5cdFx0XHRmdW5jdGlvbiBjaGVja1doZXRoZXJUb0FuaW1hdGUoKSB7XHJcblx0XHRcdFx0aWYgKCFpc0FuaW1hdGVNb2RlKCkgfHwgc2NvcGUuc2VsZWN0ZWRJdGVyYXRpb24pIHtcclxuXHRcdFx0XHRcdGNsZWFuUHJldmlvdXNBbmltYXRpb24oKTtcclxuXHRcdFx0XHR9IGVsc2Uge1xyXG5cdFx0XHRcdFx0c3RhcnROZXdBbmltYXRpb24oKTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdC8qKlxyXG5cdFx0XHQgKiBTdGFydHMgYSBuZXcgYW5pbWF0aW9uXHJcblx0XHRcdCAqL1xyXG5cdFx0XHRmdW5jdGlvbiBzdGFydE5ld0FuaW1hdGlvbigpIHtcclxuXHRcdFx0XHRpZiAoIXNjb3BlLmZpbHRlcmVkRW50cmllcyB8fCAhaXNBbmltYXRlTW9kZSgpKSByZXR1cm47XHJcblx0XHRcdFx0aWYgKCFzY29wZS5maWx0ZXJlZEVudHJpZXMubGVuZ3RoKSB7XHJcblx0XHRcdFx0XHQkKCcjYW5pbWF0ZWQtcmVzdWx0cycpXHJcblx0XHRcdFx0XHRcdC5hdHRyKCdzcmMnLCAnJyk7XHJcblx0XHRcdFx0XHQkKCcjY3VyLWZyYW1lLWluZm8nKVxyXG5cdFx0XHRcdFx0XHQuaHRtbCgnJyk7XHJcblx0XHRcdFx0fVxyXG5cclxuXHRcdFx0XHRzY29wZS5hbmltYXRlZFJlc3VsdHMuY3VyRnJhbWUgPSAwO1xyXG5cdFx0XHRcdHNjb3BlLmFuaW1hdGVkUmVzdWx0cy5mcmFtZXMgPSBzY29wZS5maWx0ZXJlZEVudHJpZXMubGVuZ3RoO1xyXG5cclxuXHRcdFx0XHR2YXIgbmV3QW5pbWF0ZVNwZWVkID0gTWF0aC5tYXgoMTAwMDAwIC8gc2NvcGUuYW5pbWF0ZWRSZXN1bHRzLmZyYW1lcywgMzAwKTsgLy8gbWluIGRlYm91bmNlIHRpbWVcclxuXHRcdFx0XHRuZXdBbmltYXRlU3BlZWQgPSBNYXRoLm1pbihuZXdBbmltYXRlU3BlZWQsIDE1MDApOyAvLyBtYXggZGVib3VuY2UgdGltZVxyXG5cdFx0XHRcdGFuaW1hdGVTcGVlZCA9IG5ld0FuaW1hdGVTcGVlZDtcclxuXHJcblx0XHRcdFx0aWYgKCFpc0FuaW1hdGluZykgYW5pbWF0ZSgpO1xyXG5cdFx0XHRcdGlzQW5pbWF0aW5nID0gdHJ1ZTtcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0LyoqXHJcblx0XHRcdCAqIEFuaW1hdGUgbG9vcFxyXG5cdFx0XHQgKi9cclxuXHRcdFx0ZnVuY3Rpb24gYW5pbWF0ZSgpIHtcclxuXHRcdFx0XHRpZiAoIWlzQW5pbWF0ZU1vZGUoKSkge1xyXG5cdFx0XHRcdFx0aXNBbmltYXRpbmcgPSBmYWxzZTtcclxuXHRcdFx0XHRcdHJldHVybjtcclxuXHRcdFx0XHR9IGVsc2Uge1xyXG5cdFx0XHRcdFx0c2hvd05leHRGcmFtZSgpO1xyXG5cdFx0XHRcdFx0c2V0VGltZW91dChmdW5jdGlvbiAoKSB7XHJcblx0XHRcdFx0XHRcdGFuaW1hdGUoKTtcclxuXHRcdFx0XHRcdH0sIGFuaW1hdGVTcGVlZCk7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHQvKipcclxuXHRcdFx0ICogQ29kZSB0byBtb3ZlIGZvcndhcmQgYSBmcmFtZS4gQ2FsbGVkIGZyb20gdGhlIGFuaW1hdGUgbG9vcC5cclxuXHRcdFx0ICovXHJcblx0XHRcdGZ1bmN0aW9uIHNob3dOZXh0RnJhbWUoKSB7XHJcblx0XHRcdFx0aWYgKCFpc0FuaW1hdGVNb2RlKCkpIHJldHVybjtcclxuXHRcdFx0XHRjbGVhblByZXZpb3VzQW5pbWF0aW9uKCk7XHJcblxyXG5cdFx0XHRcdGlmICghc2NvcGUuZmlsdGVyZWRFbnRyaWVzIHx8ICFzY29wZS5maWx0ZXJlZEVudHJpZXMubGVuZ3RoKSByZXR1cm47XHJcblx0XHRcdFx0c2NvcGUuYW5pbWF0ZWRSZXN1bHRzLmN1ckZyYW1lSW5mbyA9IHNjb3BlLmZpbHRlcmVkRW50cmllc1tzY29wZS5hbmltYXRlZFJlc3VsdHMuY3VyRnJhbWVdO1xyXG5cclxuXHRcdFx0XHQkKCcjYW5pbWF0ZWQtcmVzdWx0cycpXHJcblx0XHRcdFx0XHQuYXR0cignc3JjJywgc2NvcGUuYW5pbWF0ZWRSZXN1bHRzLmN1ckZyYW1lSW5mby5pbWcpO1xyXG5cclxuXHRcdFx0XHQkKCcjYW5pbWF0ZWQtcmVzdWx0cycpXHJcblx0XHRcdFx0XHQub24oJ2NsaWNrJywgZnVuY3Rpb24gKCkge1xyXG5cdFx0XHRcdFx0XHRjbGVhblByZXZpb3VzQW5pbWF0aW9uKCk7XHJcblx0XHRcdFx0XHRcdHNjb3BlLnZpZXdNb2RlPSd0aHVtYm5haWxzJztcclxuXHRcdFx0XHRcdFx0JHRpbWVvdXQoZnVuY3Rpb24oKXtcclxuXHRcdFx0XHRcdFx0XHRzY29wZS5zZWxlY3RJdGVyYXRpb24oc2NvcGUuYW5pbWF0ZWRSZXN1bHRzLmN1ckZyYW1lSW5mbyk7XHJcblx0XHRcdFx0XHRcdH0pO1xyXG5cdFx0XHRcdFx0fSk7XHJcblxyXG5cdFx0XHRcdHZhciBpbmZvQm94ID0gJCgnI2N1ci1mcmFtZS1pbmZvJyk7XHJcblxyXG5cdFx0XHRcdHNjb3BlLmRlc2lnbkV4cGxvcmVyLnBvcHVsYXRlSXRlcmF0aW9uVGFibGUoaW5mb0JveCwgc2NvcGUuYW5pbWF0ZWRSZXN1bHRzLmN1ckZyYW1lSW5mbyk7XHJcblxyXG5cdFx0XHRcdHNjb3BlLmRlc2lnbkV4cGxvcmVyLmdyYXBocy5wYXJjb29yZHMuaGlnaGxpZ2h0KFtzY29wZS5hbmltYXRlZFJlc3VsdHMuY3VyRnJhbWVJbmZvXSk7XHJcblxyXG5cdFx0XHRcdHNjb3BlLmFuaW1hdGVkUmVzdWx0cy5jdXJGcmFtZSArPSAxO1xyXG5cdFx0XHRcdGlmIChzY29wZS5hbmltYXRlZFJlc3VsdHMuY3VyRnJhbWUgPj0gc2NvcGUuYW5pbWF0ZWRSZXN1bHRzLmZyYW1lcykgc2NvcGUuYW5pbWF0ZWRSZXN1bHRzLmN1ckZyYW1lID0gMDtcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0LyoqXHJcblx0XHRcdCAqIENsZWFuIGxlZnRvdmVyIHN0dWZmIGZyb20gYSBwcmV2aW91cyBhbmltYXRpb25cclxuXHRcdFx0ICovXHJcblx0XHRcdGZ1bmN0aW9uIGNsZWFuUHJldmlvdXNBbmltYXRpb24oKSB7XHJcblx0XHRcdFx0aWYgKHNjb3BlLmRlc2lnbkV4cGxvcmVyICYmIHNjb3BlLmRlc2lnbkV4cGxvcmVyLmdyYXBocy5wYXJjb29yZHMpIHNjb3BlLmRlc2lnbkV4cGxvcmVyLmdyYXBocy5wYXJjb29yZHMudW5oaWdobGlnaHQoKTtcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0LyoqXHJcblx0XHRcdCAqIFdoZXRoZXIgd2UncmUgY3VycmVudGx5IGluIGFuaW1hdGlvbiBtb2RlXHJcblx0XHRcdCAqIEByZXR1cm4ge0Jvb2xlYW59XHJcblx0XHRcdCAqL1xyXG5cdFx0XHRmdW5jdGlvbiBpc0FuaW1hdGVNb2RlKCkge1xyXG5cdFx0XHRcdHJldHVybiBzY29wZS52aWV3TW9kZSA9PT0gJ2FuaW1hdGlvbic7XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHR9O1xyXG59KTtcclxuIiwiLyoqXHJcbiAqIEBtZW1iZXJPZiBhcHBcclxuICogQG5nZG9jIGRpcmVjdGl2ZVxyXG4gKiBAbmFtZSByZXN1bHRzVGh1bWJuYWlsc1xyXG4gKiBAcGFyYW0ge3NlcnZpY2V9XHJcbiAqIEBkZXNjcmlwdGlvblxyXG4gKiAgIFRodW1ibmFpbHMgb2YgcmVzdWx0c1xyXG4gKi9cclxuYXBwLmRpcmVjdGl2ZSgncmVzdWx0c1RodW1ibmFpbHMnLCBmdW5jdGlvbiAoJHRpbWVvdXQpIHtcclxuXHRyZXR1cm4ge1xyXG5cdFx0cmVzdHJpY3Q6ICdFJyxcclxuXHRcdHRlbXBsYXRlVXJsOiAnanMvc3JjL21haW4vZGlyZWN0aXZlcy9yZXN1bHRzVGh1bWJuYWlscy9yZXN1bHRzVGh1bWJuYWlscy5odG1sJyxcclxuXHRcdGxpbms6IGZ1bmN0aW9uIChzY29wZSkge1xyXG5cdFx0XHRzY29wZS5nZXRPcmRlckJ5ID0gZnVuY3Rpb24gKCkge1xyXG5cdFx0XHRcdHJldHVybiAoc2NvcGUuZGVzaWduRXhwbG9yZXIgJiYgc2NvcGUuZGVzaWduRXhwbG9yZXIuc2VsZWN0ZWRQYXJhbSkgPyBzY29wZS5kZXNpZ25FeHBsb3Jlci5zZWxlY3RlZFBhcmFtW0Rlc2lnbkV4cGxvcmVyLmRhdGFLZXldIDogJyc7XHJcblx0XHRcdH07XHJcblxyXG5cdFx0XHRzY29wZS5yZXN1bHRVbmhpZ2hsaWdodD1mdW5jdGlvbigpe1xyXG5cdFx0XHRcdGlmKHNjb3BlLnNlbGVjdGVkSXRlcmF0aW9uKXtcclxuXHRcdFx0XHRcdHNjb3BlLmhpZ2hsaWdodEl0ZXJhdGlvbihzY29wZS5zZWxlY3RlZEl0ZXJhdGlvbik7XHJcblx0XHRcdFx0fSBlbHNle1xyXG5cdFx0XHRcdFx0c2NvcGUudW5oaWdobGlnaHRQYXJjb29yZHMoKTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdH07XHJcblxyXG5cdFx0fVxyXG5cdH07XHJcbn0pO1xyXG4iLCIvKipcclxuICogQG1lbWJlck9mIGFwcFxyXG4gKiBAbmdkb2MgZGlyZWN0aXZlXHJcbiAqIEBuYW1lIGJvdHRvbU5hdlxyXG4gKiBAcGFyYW0ge3NlcnZpY2V9XHJcbiAqIEBkZXNjcmlwdGlvblxyXG4gKiAgIFJlc2l6YWJsZSBib3R0b20gbmF2aWdhdGlvblxyXG4gKi9cclxuYXBwLmRpcmVjdGl2ZSgnYm90dG9tTmF2JywgZnVuY3Rpb24gKCR0aW1lb3V0KSB7XHJcblx0cmV0dXJuIHtcclxuXHRcdHJlc3RyaWN0OiAnRScsXHJcblx0XHR0ZW1wbGF0ZVVybDogJ2pzL3NyYy9tYWluL2RpcmVjdGl2ZXMvYm90dG9tTmF2L2JvdHRvbU5hdi5odG1sJyxcclxuXHRcdGxpbms6IGZ1bmN0aW9uIChzY29wZSkge1xyXG5cclxuXHRcdFx0JHRpbWVvdXQoaW5pdEpxdWVyeSk7XHJcblxyXG5cdFx0XHRmdW5jdGlvbiBpbml0SnF1ZXJ5KCkge1xyXG5cclxuXHRcdFx0XHR2YXIgYm90dG9tYmFyID0gJCgnLmJvdHRvbS1uYXYnKTtcclxuXHJcblx0XHRcdFx0Ly8gYm90dG9tYmFyLnJlc2l6YWJsZSh7XHJcblx0XHRcdFx0Ly8gXHRoYW5kbGVzOiB7XHJcblx0XHRcdFx0Ly8gXHRcdCduJzogJyNoYW5kbGUnXHJcblx0XHRcdFx0Ly8gXHR9XHJcblx0XHRcdFx0Ly8gfSk7XHJcblx0XHRcdFx0Ly9cclxuXHRcdFx0XHQvLyBib3R0b21iYXIub24oJ3Jlc2l6ZScsIHJlc3BvbmRUb1Jlc2l6ZSk7XHJcblxyXG5cdFx0XHRcdCQod2luZG93KVxyXG5cdFx0XHRcdFx0Lm9uKCdyZXNpemUnLCByZXNwb25kVG9SZXNpemUpO1xyXG5cclxuXHRcdFx0XHRyZXNwb25kVG9SZXNpemUoKTtcclxuXHJcblx0XHRcdFx0ZnVuY3Rpb24gcmVzcG9uZFRvUmVzaXplKCkge1xyXG5cclxuXHRcdFx0XHRcdHZhciBwYXJhbGxlbERpdiA9ICQoJyNwYXJhbGxlbC1jb29yZHMnKTtcclxuXHJcblx0XHRcdFx0XHQvLyAkKCcjbWFpbi1jb250ZW50LWZsb3cnKVxyXG5cdFx0XHRcdFx0Ly8gXHQuY3NzKCdwYWRkaW5nLWJvdHRvbScsIGJvdHRvbWJhci5oZWlnaHQoKSsxNTApO1xyXG5cclxuXHRcdFx0XHRcdCQoJyNtYWluLWNvbnRlbnQtZmxvdycpXHJcblx0XHRcdFx0XHRcdC5jc3MoJ21heC1oZWlnaHQnLCAoJCh3aW5kb3cudG9wKVxyXG5cdFx0XHRcdFx0XHRcdC5oZWlnaHQoKSAtIGJvdHRvbWJhci5vdXRlckhlaWdodCgpIC0gMTMwKSArICdweCcpO1xyXG5cclxuXHJcblx0XHRcdFx0XHQvLyBwYXJhbGxlbERpdi5jc3MoJ2hlaWdodCcsIGJvdHRvbWJhci5oZWlnaHQoKSAtIDMwKTtcclxuXHRcdFx0XHRcdC8vIHBhcmFsbGVsRGl2LmNzcygnd2lkdGgnLCBib3R0b21iYXIud2lkdGgoKSAtIDMwKTtcclxuXHRcdFx0XHRcdC8vIGlmIChzY29wZS5kZXNpZ25FeHBsb3Jlcikge1xyXG5cdFx0XHRcdFx0Ly8gXHRzY29wZS5kZXNpZ25FeHBsb3Jlci5yZW5kZXJQYXJhbGxlbENvb3JkaW5hdGVzKCk7XHJcblx0XHRcdFx0XHQvLyB9XHJcblxyXG5cdFx0XHRcdFx0c2NvcGUucmVzaXplVGh1bWJuYWlscygpO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cdH07XHJcbn0pO1xyXG4iLCIvKipcclxuICogQG1lbWJlck9mIGFwcFxyXG4gKiBAbmdkb2MgZGlyZWN0aXZlXHJcbiAqIEBuYW1lIHNlbGVjdGVkSXRlcmF0aW9uXHJcbiAqIEBwYXJhbSB7c2VydmljZX1cclxuICogQGRlc2NyaXB0aW9uXHJcbiAqICAgVGhlIGN1cnJlbnQgc2VsZWN0ZWQgaXRlcmF0aW9uIGZvciBpbnNwZWN0aW9uXHJcbiAqL1xyXG5hcHAuZGlyZWN0aXZlKCdzZWxlY3RlZEl0ZXJhdGlvbicsIGZ1bmN0aW9uICgkdGltZW91dCkge1xyXG5cdHJldHVybiB7XHJcblx0XHRyZXN0cmljdDogJ0UnLFxyXG5cdFx0dGVtcGxhdGVVcmw6ICdqcy9zcmMvbWFpbi9kaXJlY3RpdmVzL3NlbGVjdGVkSXRlcmF0aW9uL3NlbGVjdGVkSXRlcmF0aW9uLmh0bWwnLFxyXG5cdFx0bGluazogZnVuY3Rpb24gKHNjb3BlKSB7XHJcblx0XHR9XHJcblx0fTtcclxufSk7XHJcbiIsIi8qKlxyXG4gKiBAbWVtYmVyT2YgYXBwXHJcbiAqIEBuZ2RvYyBkaXJlY3RpdmVcclxuICogQG5hbWUgbmF2YmFyXHJcbiAqIEBwYXJhbSB7c2VydmljZX1cclxuICogQGRlc2NyaXB0aW9uXHJcbiAqICAgTmF2YmFyLiBEb2Vzbid0IHJlYWxseSBkbyBhbnl0aGluZyBpbnRlcmVzdGluZyB5ZXQuXHJcbiAqL1xyXG5hcHAuZGlyZWN0aXZlKCduYXZiYXInLCBmdW5jdGlvbigpIHtcclxuXHRyZXR1cm4ge1xyXG5cdFx0cmVzdHJpY3Q6ICdFJyxcclxuXHRcdHRlbXBsYXRlVXJsOiAnanMvc3JjL21haW4vZGlyZWN0aXZlcy9uYXZiYXIvbmF2YmFyLmh0bWwnLFxyXG5cdFx0bGluazogZnVuY3Rpb24oc2NvcGUpIHtcclxuXHRcdH1cclxuXHR9O1xyXG59KTtcclxuIiwiLyoqXHJcbiAqIEJhc2Ugc3RhdGUgZm9yIGFsbCBuZXN0ZWQgZnV0dXJlIHN0YXRlcyB3ZSBtYXkgaGF2ZVxyXG4gKi9cclxuYXBwLmNvbmZpZyhmdW5jdGlvbiAoJHN0YXRlUHJvdmlkZXIpIHtcclxuXHQkc3RhdGVQcm92aWRlci5zdGF0ZSgncm9vdCcsIHtcclxuXHRcdG5hbWU6ICdyb290JyxcclxuXHRcdC8vIGFic3RyYWN0OiB0cnVlLFxyXG5cdFx0dXJsOiAnLz9zZXQnLFxyXG5cdFx0dGVtcGxhdGVVcmw6ICdqcy9zcmMvbWFpbi9zdGF0ZXMvcm9vdC9yb290Lmh0bWwnLFxyXG5cdFx0Y29udHJvbGxlcjogJ1Jvb3RTdGF0ZUN0cmwnXHJcblx0fSk7XHJcbn0pO1xyXG5cclxuYXBwLmNvbnRyb2xsZXIoJ1Jvb3RTdGF0ZUN0cmwnLCBmdW5jdGlvbiAoJHJvb3RTY29wZSwgJHNjb3BlLCAkdGltZW91dCwgJHN0YXRlUGFyYW1zKSB7XHJcblxyXG5cdHZhciBkZXNpZ25FeHBsb3JlcjtcclxuXHJcblx0dmFyIHNwZWN0O1xyXG5cclxuXHR2YXIgaXNGdWxsc2NyZWVuID0gZmFsc2U7XHJcblxyXG5cdHZhciBkYXRhUHJlZml4ID0gJ2RhdGEvJyArICRzdGF0ZVBhcmFtcy5zZXQgKyAnLyc7XHJcblxyXG5cdHZhciB1cmwgPSBkYXRhUHJlZml4ICsgJ29wdGlvbnMuanNvbic7XHJcblxyXG5cdCQuZ2V0KGRhdGFQcmVmaXggKyAnb3B0aW9ucy5qc29uJywgZnVuY3Rpb24gKG9wdGlvbnMpIHtcclxuXHRcdGlmICghb3B0aW9ucy5kYXRhVXJsKSBvcHRpb25zID0gSlNPTi5wYXJzZShvcHRpb25zKTtcclxuXHRcdGQzLmNzdihkYXRhUHJlZml4ICsgb3B0aW9ucy5kYXRhVXJsKVxyXG5cdFx0XHQuZ2V0KGZ1bmN0aW9uIChlcnJvciwgcm93cykge1xyXG5cdFx0XHRcdHJvd3MuZm9yRWFjaChmdW5jdGlvbiAocm93KSB7XHJcblx0XHRcdFx0XHRyb3cuaW1nID0gZGF0YVByZWZpeCArIHJvdy5pbWc7XHJcblx0XHRcdFx0XHRyb3cudGhyZWVEID0gZGF0YVByZWZpeCArIHJvdy50aHJlZUQ7XHJcblx0XHRcdFx0fSk7XHJcblx0XHRcdFx0JHNjb3BlLmRlc2lnbkV4cGxvcmVyID0gbmV3IERlc2lnbkV4cGxvcmVyKHJvd3MsIG9wdGlvbnMpO1xyXG5cdFx0XHRcdGRyYXdEZXNpZ25FeHBsb3JlcigpO1xyXG5cdFx0XHR9KTtcclxuXHR9KTtcclxuXHJcblx0JHNjb3BlLnZpZXdNb2RlID0gJ3RodW1ibmFpbHMnO1xyXG5cclxuXHQkc2NvcGUuc2VsZWN0ZWRJdGVyYXRpb24gPSBudWxsO1xyXG5cclxuXHQkc2NvcGUuRGVzaWduRXhwbG9yZXIgPSB7XHJcblx0XHQndHlwZURpc3BsYXlEaWN0aW9uYXJ5JzogRGVzaWduRXhwbG9yZXIudHlwZURpc3BsYXlEaWN0aW9uYXJ5XHJcblx0fTtcclxuXHJcblx0JHRpbWVvdXQoZnVuY3Rpb24gKCkge1xyXG5cdFx0c3BlY3QgPSBuZXcgU1BFQ1RBQ0xFUygkKCcjc3BlY3RhY2xlcy1jb250YWluZXInKSk7XHJcblx0fSk7XHJcblxyXG5cdC8qXHJcblx04paI4paI4paI4paI4paI4paI4paIICDilojilojilojilojilojiloggIOKWiOKWiOKWiOKWiOKWiOKWiCAg4paI4paI4paI4paI4paI4paIICDilojilojilojilojilojilojiloggICAgIOKWiOKWiOKWiOKWiOKWiOKWiOKWiCDilojilojiloggICAg4paI4paIXHJcblx04paI4paIICAgICAg4paI4paIICAgICAg4paI4paIICAgIOKWiOKWiCDilojiloggICDilojilogg4paI4paIICAgICAgICAgIOKWiOKWiCAgICAgIOKWiOKWiOKWiOKWiCAgIOKWiOKWiFxyXG5cdOKWiOKWiOKWiOKWiOKWiOKWiOKWiCDilojiloggICAgICDilojiloggICAg4paI4paIIOKWiOKWiOKWiOKWiOKWiOKWiCAg4paI4paI4paI4paI4paIICAgICAgIOKWiOKWiOKWiOKWiOKWiCAgIOKWiOKWiCDilojiloggIOKWiOKWiFxyXG5cdCAgICAg4paI4paIIOKWiOKWiCAgICAgIOKWiOKWiCAgICDilojilogg4paI4paIICAgICAg4paI4paIICAgICAgICAgIOKWiOKWiCAgICAgIOKWiOKWiCAg4paI4paIIOKWiOKWiFxyXG5cdOKWiOKWiOKWiOKWiOKWiOKWiOKWiCAg4paI4paI4paI4paI4paI4paIICDilojilojilojilojilojiloggIOKWiOKWiCAgICAgIOKWiOKWiOKWiOKWiOKWiOKWiOKWiCAgICAg4paI4paIICAgICAg4paI4paIICAg4paI4paI4paI4paIXHJcblx0Ki9cclxuXHJcblx0JHNjb3BlLnNlbGVjdEl0ZXJhdGlvbiA9IGZ1bmN0aW9uIChpdGVyYXRpb24pIHtcclxuXHRcdCRzY29wZS5yZXN1bHRNb2RlID0gJ2ltYWdlJztcclxuXHRcdCRzY29wZS5zZWxlY3RlZEl0ZXJhdGlvbiA9IGl0ZXJhdGlvbjtcclxuXHRcdCRzY29wZS5yZXNpemVUaHVtYm5haWxzKCk7XHJcblx0XHRpZiAoIWl0ZXJhdGlvbikgcmV0dXJuO1xyXG5cdFx0JHNjb3BlLmRlc2lnbkV4cGxvcmVyLnBvcHVsYXRlSXRlcmF0aW9uVGFibGUoJCgnI3NlbGVjdGVkLWl0ZXJhdGlvbi1pbmZvJyksIGl0ZXJhdGlvbik7XHJcblx0XHQkc2NvcGUuaGlnaGxpZ2h0SXRlcmF0aW9uKGl0ZXJhdGlvbik7XHJcblx0fTtcclxuXHJcblx0JHNjb3BlLnVuaGlnaGxpZ2h0UGFyY29vcmRzID0gZnVuY3Rpb24gKCkge1xyXG5cdFx0JHNjb3BlLmRlc2lnbkV4cGxvcmVyLmdyYXBocy5wYXJjb29yZHMudW5oaWdobGlnaHQoKTtcclxuXHR9O1xyXG5cclxuXHQkc2NvcGUuaGlnaGxpZ2h0SXRlcmF0aW9uID0gZnVuY3Rpb24gKGl0ZXJhdGlvbikge1xyXG5cdFx0JHNjb3BlLnVuaGlnaGxpZ2h0UGFyY29vcmRzKCk7XHJcblx0XHQkdGltZW91dChmdW5jdGlvbiAoKSB7XHJcblx0XHRcdCRzY29wZS5kZXNpZ25FeHBsb3Jlci5ncmFwaHMucGFyY29vcmRzLmhpZ2hsaWdodChbaXRlcmF0aW9uXSk7XHJcblx0XHR9KTtcclxuXHR9O1xyXG5cclxuXHQkc2NvcGUuc2V0MmRNb2RlID0gZnVuY3Rpb24gKCkge1xyXG5cdFx0JHNjb3BlLnJlc3VsdE1vZGUgPSAnaW1hZ2UnO1xyXG5cdH07XHJcblxyXG5cdCRzY29wZS5zZXQzZE1vZGUgPSBmdW5jdGlvbiAoKSB7XHJcblx0XHRpZiAoISRzY29wZS5zZWxlY3RlZEl0ZXJhdGlvbikgcmV0dXJuO1xyXG5cdFx0JHNjb3BlLnJlc3VsdE1vZGUgPSAnM2QnO1xyXG5cdFx0ZDMuanNvbigkc2NvcGUuc2VsZWN0ZWRJdGVyYXRpb24udGhyZWVELCBmdW5jdGlvbiAoZGF0YSkge1xyXG5cdFx0XHRzcGVjdC5sb2FkTmV3TW9kZWwoZGF0YSk7XHJcblx0XHRcdHNwZWN0Lnpvb21FeHRlbnRzKCk7XHJcblx0XHRcdHNwZWN0LmxpZ2h0aW5nUmlnLnNldEFtYmllbnRMaWdodENvbG9yKCcjODg4Jyk7XHJcblx0XHRcdHNwZWN0LmxpZ2h0aW5nUmlnLnNldFBvaW50TGlnaHRzQ29sb3IoJyM4ODgnKTtcclxuXHRcdH0pO1xyXG5cdFx0JHRpbWVvdXQoZnVuY3Rpb24gKCkge1xyXG5cdFx0XHQkKCcjc3BlY3RhY2xlcy1jb250YWluZXInKVxyXG5cdFx0XHRcdC50cmlnZ2VyKCdyZXNpemUnKTtcclxuXHRcdH0pO1xyXG5cdH07XHJcblxyXG5cdCRzY29wZS50b2dnbGVGdWxsc2NyZWVuID0gZnVuY3Rpb24gKCkge1xyXG5cclxuXHRcdHZhciBkaXYgPSAkKCcjc2VsZWN0ZWQtcmVzdWx0Jyk7XHJcblx0XHR2YXIgb3RoZXJEaXZzID0gJCgnLmhpZGUtaW4tZnVsbHNjcmVlbicpO1xyXG5cclxuXHRcdGlmICghaXNGdWxsc2NyZWVuKSB7XHJcblx0XHRcdGRpdi5hZGRDbGFzcygnZnVsbC1zY3JlZW4nKTtcclxuXHRcdFx0b3RoZXJEaXZzLmhpZGUoKTtcclxuXHRcdH0gZWxzZSB7XHJcblx0XHRcdGRpdi5yZW1vdmVDbGFzcygnZnVsbC1zY3JlZW4nKTtcclxuXHRcdFx0b3RoZXJEaXZzLnNob3coKTtcclxuXHRcdH1cclxuXHJcblx0XHQkKCcjc3BlY3RhY2xlcy1jb250YWluZXInKVxyXG5cdFx0XHQudHJpZ2dlcigncmVzaXplJyk7XHJcblxyXG5cdFx0aXNGdWxsc2NyZWVuID0gIWlzRnVsbHNjcmVlbjtcclxuXHR9O1xyXG5cclxuXHQkc2NvcGUucmVzaXplVGh1bWJuYWlscyA9IGZ1bmN0aW9uICgpIHtcclxuXHRcdGlmICghJHNjb3BlLmZpbHRlcmVkRW50cmllcykgcmV0dXJuO1xyXG5cdFx0dmFyIGZsb3cgPSAkKCcjbWFpbi1jb250ZW50LWZsb3cnKTtcclxuXHRcdHZhciByYXRpbyA9IE1hdGguY2VpbChmbG93LndpZHRoKCkgLyBmbG93LmhlaWdodCgpKTtcclxuXHJcblx0XHQvLyBjb25zb2xlLmxvZygncmF0aW8nLCByYXRpbyk7XHJcblxyXG5cdFx0dmFyIGNvbENvdW50ID0gZ2V0Q29sdW1uQ291bnQocmF0aW8sICRzY29wZS5maWx0ZXJlZEVudHJpZXMubGVuZ3RoKTtcclxuXHJcblx0XHR2YXIgc2l6ZSA9IE1hdGguZmxvb3IoZmxvdy53aWR0aCgpIC8gY29sQ291bnQpO1xyXG5cdFx0dmFyIHBhZGRpbmdTaXplID0gMjQ7XHJcblxyXG5cdFx0dmFyIHJlc3VsdFRodW1ibmFpbHMgPSAkKCcucmVzdWx0LWltYWdlJyk7XHJcblxyXG5cdFx0aWYgKCRzY29wZS5zZWxlY3RlZEl0ZXJhdGlvbikgc2l6ZT0wO1xyXG5cdFx0cmVzdWx0VGh1bWJuYWlscy5jc3MoJ3dpZHRoJywgc2l6ZSAtIHBhZGRpbmdTaXplICsgJ3B4Jyk7XHJcblxyXG5cdFx0ZnVuY3Rpb24gZ2V0Q29sdW1uQ291bnQocmF0aW8sIG51bUl0ZW1zKSB7XHJcblx0XHRcdHZhciBtYXhDb2xzID0gMTIgKyAxO1xyXG5cdFx0XHR2YXIgY29sdW1ucyA9IDA7XHJcblx0XHRcdHZhciBpdGVtQ2FwYWNpdHkgPSAwO1xyXG5cclxuXHRcdFx0d2hpbGUgKGl0ZW1DYXBhY2l0eSA8IG51bUl0ZW1zICYmIGNvbHVtbnMgPCBtYXhDb2xzKSB7XHJcblx0XHRcdFx0aXRlbUNhcGFjaXR5ID0gY29sdW1ucyAqIHJhdGlvO1xyXG5cdFx0XHRcdGNvbHVtbnMgKz0gMTtcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0cmV0dXJuIE1hdGgubWF4KDEsIGNvbHVtbnMgKyAxKTtcclxuXHJcblx0XHR9XHJcblx0fTtcclxuXHJcblxyXG5cclxuXHQvKlxyXG5cdOKWiOKWiCAgICAg4paI4paIICDilojilojilojilojiloggIOKWiOKWiOKWiOKWiOKWiOKWiOKWiOKWiCAg4paI4paI4paI4paI4paI4paIIOKWiOKWiCAgIOKWiOKWiFxyXG5cdOKWiOKWiCAgICAg4paI4paIIOKWiOKWiCAgIOKWiOKWiCAgICDilojiloggICAg4paI4paIICAgICAg4paI4paIICAg4paI4paIXHJcblx04paI4paIICDiloggIOKWiOKWiCDilojilojilojilojilojilojiloggICAg4paI4paIICAgIOKWiOKWiCAgICAgIOKWiOKWiOKWiOKWiOKWiOKWiOKWiFxyXG5cdOKWiOKWiCDilojilojilogg4paI4paIIOKWiOKWiCAgIOKWiOKWiCAgICDilojiloggICAg4paI4paIICAgICAg4paI4paIICAg4paI4paIXHJcblx0IOKWiOKWiOKWiCDilojilojiloggIOKWiOKWiCAgIOKWiOKWiCAgICDilojiloggICAgIOKWiOKWiOKWiOKWiOKWiOKWiCDilojiloggICDilojilohcclxuXHQqL1xyXG5cclxuXHQkc2NvcGUuJHdhdGNoKCdkZXNpZ25FeHBsb3JlcicsIGRyYXdEZXNpZ25FeHBsb3Jlcik7XHJcblxyXG5cclxuXHJcblx0LypcclxuXHQg4paI4paI4paI4paI4paIICDilojilojiloggICAg4paI4paIICDilojilojilojilojilojiloggIOKWiOKWiOKWiCAgICDilojilohcclxuXHTilojiloggICDilojilogg4paI4paI4paI4paIICAg4paI4paIIOKWiOKWiCAgICDilojilogg4paI4paI4paI4paIICAg4paI4paIXHJcblx04paI4paI4paI4paI4paI4paI4paIIOKWiOKWiCDilojiloggIOKWiOKWiCDilojiloggICAg4paI4paIIOKWiOKWiCDilojiloggIOKWiOKWiFxyXG5cdOKWiOKWiCAgIOKWiOKWiCDilojiloggIOKWiOKWiCDilojilogg4paI4paIICAgIOKWiOKWiCDilojiloggIOKWiOKWiCDilojilohcclxuXHTilojiloggICDilojilogg4paI4paIICAg4paI4paI4paI4paIICDilojilojilojilojilojiloggIOKWiOKWiCAgIOKWiOKWiOKWiOKWiFxyXG5cdCovXHJcblxyXG5cdGZ1bmN0aW9uIGRyYXdEZXNpZ25FeHBsb3JlcigpIHtcclxuXHRcdCR0aW1lb3V0KGZ1bmN0aW9uICgpIHtcclxuXHRcdFx0aWYgKCRzY29wZS5kZXNpZ25FeHBsb3Jlcikge1xyXG5cdFx0XHRcdGlmICghZDMuc2VsZWN0KCcjcGFyYWxsZWwtY29vcmRzJylbMF1bMF0pIHJldHVybiBkcmF3RGVzaWduRXhwbG9yZXIoKTtcclxuXHRcdFx0XHQkc2NvcGUuZGVzaWduRXhwbG9yZXIucGFyY29vcmRzX2NyZWF0ZSgnI3BhcmFsbGVsLWNvb3JkcycpO1xyXG5cdFx0XHRcdHNldEZpbHRlcmVkRW50cmllcygpO1xyXG5cdFx0XHRcdCRzY29wZS5kZXNpZ25FeHBsb3Jlci5hYnN0cmFjdF9wYXJjb29yZHNfcG9zdFJlbmRlciA9IHNldEZpbHRlcmVkRW50cmllcztcclxuXHRcdFx0fVxyXG5cdFx0fSk7XHJcblx0fVxyXG5cclxuXHRmdW5jdGlvbiBzZXRGaWx0ZXJlZEVudHJpZXMoKSB7XHJcblx0XHQkc2NvcGUuZmlsdGVyZWRFbnRyaWVzID0gJHNjb3BlLmRlc2lnbkV4cGxvcmVyLmdyYXBocy5wYXJjb29yZHMuYnJ1c2hlZCgpIHx8ICRzY29wZS5kZXNpZ25FeHBsb3Jlci5nZXREYXRhKCk7XHJcblx0XHQkc2NvcGUuc2VsZWN0SXRlcmF0aW9uKG51bGwpO1xyXG5cdFx0JHRpbWVvdXQoZnVuY3Rpb24gKCkge1xyXG5cdFx0XHQkc2NvcGUuJGFwcGx5KCk7XHJcblx0XHRcdCRzY29wZS5yZXNpemVUaHVtYm5haWxzKCk7XHJcblx0XHR9KTtcclxuXHR9XHJcblxyXG59KTtcclxuIl19
