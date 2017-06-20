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
 * Base state for all nested future states we may have
 */
app.config(function ($stateProvider) {
	$stateProvider.state('root', {
		name: 'root',
		// abstract: true,
		url: '/?data_prefix',
		templateUrl: 'js/src/main/states/root/root.html',
		controller: 'RootStateCtrl'
	});
});

app.controller('RootStateCtrl', function ($rootScope, $scope, $timeout, $stateParams) {

	var designExplorer;

	var spect;

	var isFullscreen = false;

	var dataPrefix = $stateParams.data_prefix || 'design_explorer_data/';

	var url = dataPrefix + 'options.json';

	$.get(dataPrefix + 'options.json', function (options) {
		d3.csv(dataPrefix + options.dataUrl)
			.get(function (error, rows) {
				rows.forEach(function (row) {
					row.img = dataPrefix + row.img;
					row.threeD = dataPrefix + row.threeD;
				});
				$scope.designExplorer = new DesignExplorer(rows,options);
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
		if (!iteration) return;
		$scope.designExplorer.populateIterationTable($('#selected-iteration-info'), iteration);
		$scope.designExplorer.graphs.parcoords.clear('highlight');
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

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImhlYWRlci5qcyIsImZpbHRlcnMvdHlwZU9mLmpzIiwic3RhdGVzL2RlZmF1bHQuanMiLCJzdGF0ZXMvcm9vdC9yb290LmpzIiwiZGlyZWN0aXZlcy9ib3R0b21OYXYvYm90dG9tTmF2LmpzIiwiZGlyZWN0aXZlcy9yZXN1bHRzVGh1bWJuYWlscy9yZXN1bHRzVGh1bWJuYWlscy5qcyIsImRpcmVjdGl2ZXMvc2VsZWN0ZWRJdGVyYXRpb24vc2VsZWN0ZWRJdGVyYXRpb24uanMiLCJkaXJlY3RpdmVzL25hdmJhci9uYXZiYXIuanMiLCJkaXJlY3RpdmVzL2FuaW1hdGVkUmVzdWx0cy9hbmltYXRlZFJlc3VsdHMuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ1BBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ0xBO0FBQ0E7QUFDQTtBQUNBO0FDSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDbkxBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDekRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNuQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ2hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDaEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJtYWluLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXHJcbiAqIEFuZ3VsYXIgYXBwbGljYXRpb24uIFNlZSBBbmd1bGFyLXNwZWNpZmljIGRvY3VtZW50YXRpb24gZm9yIGFueXRoaW5nIGluc2lkZVxyXG4gKiBvZiBhcHAuc29tZXRoaW5nLlxyXG4gKiBAdHlwZSB7b2JqZWN0fVxyXG4gKiBAZ2xvYmFsXHJcbiAqL1xyXG52YXIgYXBwID0gYW5ndWxhci5tb2R1bGUoJ2Rlc2lnbmV4cGxvcmVyLmRlbW8nLCBbJ3VpLnJvdXRlciddKTtcclxuIiwiYXBwLmZpbHRlcigndHlwZW9mJywgZnVuY3Rpb24oKSB7XHJcbiAgcmV0dXJuIGZ1bmN0aW9uKG9iaikge1xyXG4gICAgcmV0dXJuIHR5cGVvZiBvYmo7XHJcbiAgfTtcclxufSk7XHJcbiIsImFwcC5jb25maWcoZnVuY3Rpb24oJHVybFJvdXRlclByb3ZpZGVyKSB7XHJcbiAgJHVybFJvdXRlclByb3ZpZGVyLm90aGVyd2lzZSgnLycpO1xyXG59KTtcclxuIiwiLyoqXHJcbiAqIEJhc2Ugc3RhdGUgZm9yIGFsbCBuZXN0ZWQgZnV0dXJlIHN0YXRlcyB3ZSBtYXkgaGF2ZVxyXG4gKi9cclxuYXBwLmNvbmZpZyhmdW5jdGlvbiAoJHN0YXRlUHJvdmlkZXIpIHtcclxuXHQkc3RhdGVQcm92aWRlci5zdGF0ZSgncm9vdCcsIHtcclxuXHRcdG5hbWU6ICdyb290JyxcclxuXHRcdC8vIGFic3RyYWN0OiB0cnVlLFxyXG5cdFx0dXJsOiAnLz9kYXRhX3ByZWZpeCcsXHJcblx0XHR0ZW1wbGF0ZVVybDogJ2pzL3NyYy9tYWluL3N0YXRlcy9yb290L3Jvb3QuaHRtbCcsXHJcblx0XHRjb250cm9sbGVyOiAnUm9vdFN0YXRlQ3RybCdcclxuXHR9KTtcclxufSk7XHJcblxyXG5hcHAuY29udHJvbGxlcignUm9vdFN0YXRlQ3RybCcsIGZ1bmN0aW9uICgkcm9vdFNjb3BlLCAkc2NvcGUsICR0aW1lb3V0LCAkc3RhdGVQYXJhbXMpIHtcclxuXHJcblx0dmFyIGRlc2lnbkV4cGxvcmVyO1xyXG5cclxuXHR2YXIgc3BlY3Q7XHJcblxyXG5cdHZhciBpc0Z1bGxzY3JlZW4gPSBmYWxzZTtcclxuXHJcblx0dmFyIGRhdGFQcmVmaXggPSAkc3RhdGVQYXJhbXMuZGF0YV9wcmVmaXggfHwgJ2Rlc2lnbl9leHBsb3Jlcl9kYXRhLyc7XHJcblxyXG5cdHZhciB1cmwgPSBkYXRhUHJlZml4ICsgJ29wdGlvbnMuanNvbic7XHJcblxyXG5cdCQuZ2V0KGRhdGFQcmVmaXggKyAnb3B0aW9ucy5qc29uJywgZnVuY3Rpb24gKG9wdGlvbnMpIHtcclxuXHRcdGQzLmNzdihkYXRhUHJlZml4ICsgb3B0aW9ucy5kYXRhVXJsKVxyXG5cdFx0XHQuZ2V0KGZ1bmN0aW9uIChlcnJvciwgcm93cykge1xyXG5cdFx0XHRcdHJvd3MuZm9yRWFjaChmdW5jdGlvbiAocm93KSB7XHJcblx0XHRcdFx0XHRyb3cuaW1nID0gZGF0YVByZWZpeCArIHJvdy5pbWc7XHJcblx0XHRcdFx0XHRyb3cudGhyZWVEID0gZGF0YVByZWZpeCArIHJvdy50aHJlZUQ7XHJcblx0XHRcdFx0fSk7XHJcblx0XHRcdFx0JHNjb3BlLmRlc2lnbkV4cGxvcmVyID0gbmV3IERlc2lnbkV4cGxvcmVyKHJvd3Msb3B0aW9ucyk7XHJcblx0XHRcdFx0ZHJhd0Rlc2lnbkV4cGxvcmVyKCk7XHJcblx0XHRcdH0pO1xyXG5cdH0pO1xyXG5cclxuXHQkc2NvcGUudmlld01vZGUgPSAndGh1bWJuYWlscyc7XHJcblxyXG5cdCRzY29wZS5zZWxlY3RlZEl0ZXJhdGlvbiA9IG51bGw7XHJcblxyXG5cdCRzY29wZS5EZXNpZ25FeHBsb3JlciA9IHtcclxuXHRcdCd0eXBlRGlzcGxheURpY3Rpb25hcnknOiBEZXNpZ25FeHBsb3Jlci50eXBlRGlzcGxheURpY3Rpb25hcnlcclxuXHR9O1xyXG5cclxuXHQkdGltZW91dChmdW5jdGlvbiAoKSB7XHJcblx0XHRzcGVjdCA9IG5ldyBTUEVDVEFDTEVTKCQoJyNzcGVjdGFjbGVzLWNvbnRhaW5lcicpKTtcclxuXHR9KTtcclxuXHJcblx0LypcclxuXHTilojilojilojilojilojilojiloggIOKWiOKWiOKWiOKWiOKWiOKWiCAg4paI4paI4paI4paI4paI4paIICDilojilojilojilojilojiloggIOKWiOKWiOKWiOKWiOKWiOKWiOKWiCAgICAg4paI4paI4paI4paI4paI4paI4paIIOKWiOKWiOKWiCAgICDilojilohcclxuXHTilojiloggICAgICDilojiloggICAgICDilojiloggICAg4paI4paIIOKWiOKWiCAgIOKWiOKWiCDilojiloggICAgICAgICAg4paI4paIICAgICAg4paI4paI4paI4paIICAg4paI4paIXHJcblx04paI4paI4paI4paI4paI4paI4paIIOKWiOKWiCAgICAgIOKWiOKWiCAgICDilojilogg4paI4paI4paI4paI4paI4paIICDilojilojilojilojiloggICAgICAg4paI4paI4paI4paI4paIICAg4paI4paIIOKWiOKWiCAg4paI4paIXHJcblx0ICAgICDilojilogg4paI4paIICAgICAg4paI4paIICAgIOKWiOKWiCDilojiloggICAgICDilojiloggICAgICAgICAg4paI4paIICAgICAg4paI4paIICDilojilogg4paI4paIXHJcblx04paI4paI4paI4paI4paI4paI4paIICDilojilojilojilojilojiloggIOKWiOKWiOKWiOKWiOKWiOKWiCAg4paI4paIICAgICAg4paI4paI4paI4paI4paI4paI4paIICAgICDilojiloggICAgICDilojiloggICDilojilojilojilohcclxuXHQqL1xyXG5cclxuXHQkc2NvcGUuc2VsZWN0SXRlcmF0aW9uID0gZnVuY3Rpb24gKGl0ZXJhdGlvbikge1xyXG5cdFx0JHNjb3BlLnJlc3VsdE1vZGUgPSAnaW1hZ2UnO1xyXG5cdFx0JHNjb3BlLnNlbGVjdGVkSXRlcmF0aW9uID0gaXRlcmF0aW9uO1xyXG5cdFx0aWYgKCFpdGVyYXRpb24pIHJldHVybjtcclxuXHRcdCRzY29wZS5kZXNpZ25FeHBsb3Jlci5wb3B1bGF0ZUl0ZXJhdGlvblRhYmxlKCQoJyNzZWxlY3RlZC1pdGVyYXRpb24taW5mbycpLCBpdGVyYXRpb24pO1xyXG5cdFx0JHNjb3BlLmRlc2lnbkV4cGxvcmVyLmdyYXBocy5wYXJjb29yZHMuY2xlYXIoJ2hpZ2hsaWdodCcpO1xyXG5cdFx0JHRpbWVvdXQoZnVuY3Rpb24gKCkge1xyXG5cdFx0XHQkc2NvcGUuZGVzaWduRXhwbG9yZXIuZ3JhcGhzLnBhcmNvb3Jkcy5oaWdobGlnaHQoW2l0ZXJhdGlvbl0pO1xyXG5cdFx0fSk7XHJcblx0fTtcclxuXHJcblx0JHNjb3BlLnNldDJkTW9kZSA9IGZ1bmN0aW9uICgpIHtcclxuXHRcdCRzY29wZS5yZXN1bHRNb2RlID0gJ2ltYWdlJztcclxuXHR9O1xyXG5cclxuXHQkc2NvcGUuc2V0M2RNb2RlID0gZnVuY3Rpb24gKCkge1xyXG5cdFx0aWYgKCEkc2NvcGUuc2VsZWN0ZWRJdGVyYXRpb24pIHJldHVybjtcclxuXHRcdCRzY29wZS5yZXN1bHRNb2RlID0gJzNkJztcclxuXHRcdGQzLmpzb24oJHNjb3BlLnNlbGVjdGVkSXRlcmF0aW9uLnRocmVlRCwgZnVuY3Rpb24gKGRhdGEpIHtcclxuXHRcdFx0c3BlY3QubG9hZE5ld01vZGVsKGRhdGEpO1xyXG5cdFx0XHRzcGVjdC56b29tRXh0ZW50cygpO1xyXG5cdFx0XHRzcGVjdC5saWdodGluZ1JpZy5zZXRBbWJpZW50TGlnaHRDb2xvcignIzg4OCcpO1xyXG5cdFx0XHRzcGVjdC5saWdodGluZ1JpZy5zZXRQb2ludExpZ2h0c0NvbG9yKCcjODg4Jyk7XHJcblx0XHR9KTtcclxuXHRcdCR0aW1lb3V0KGZ1bmN0aW9uICgpIHtcclxuXHRcdFx0JCgnI3NwZWN0YWNsZXMtY29udGFpbmVyJylcclxuXHRcdFx0XHQudHJpZ2dlcigncmVzaXplJyk7XHJcblx0XHR9KTtcclxuXHR9O1xyXG5cclxuXHQkc2NvcGUudG9nZ2xlRnVsbHNjcmVlbiA9IGZ1bmN0aW9uICgpIHtcclxuXHJcblx0XHR2YXIgZGl2ID0gJCgnI3NlbGVjdGVkLXJlc3VsdCcpO1xyXG5cdFx0dmFyIG90aGVyRGl2cyA9ICQoJy5oaWRlLWluLWZ1bGxzY3JlZW4nKTtcclxuXHJcblx0XHRpZiAoIWlzRnVsbHNjcmVlbikge1xyXG5cdFx0XHRkaXYuYWRkQ2xhc3MoJ2Z1bGwtc2NyZWVuJyk7XHJcblx0XHRcdG90aGVyRGl2cy5oaWRlKCk7XHJcblx0XHR9IGVsc2Uge1xyXG5cdFx0XHRkaXYucmVtb3ZlQ2xhc3MoJ2Z1bGwtc2NyZWVuJyk7XHJcblx0XHRcdG90aGVyRGl2cy5zaG93KCk7XHJcblx0XHR9XHJcblxyXG5cdFx0JCgnI3NwZWN0YWNsZXMtY29udGFpbmVyJylcclxuXHRcdFx0LnRyaWdnZXIoJ3Jlc2l6ZScpO1xyXG5cclxuXHRcdGlzRnVsbHNjcmVlbiA9ICFpc0Z1bGxzY3JlZW47XHJcblx0fTtcclxuXHJcblx0JHNjb3BlLnJlc2l6ZVRodW1ibmFpbHMgPSBmdW5jdGlvbiAoKSB7XHJcblx0XHRpZiAoISRzY29wZS5maWx0ZXJlZEVudHJpZXMpIHJldHVybjtcclxuXHRcdHZhciBmbG93ID0gJCgnI21haW4tY29udGVudC1mbG93Jyk7XHJcblx0XHR2YXIgcmF0aW8gPSBNYXRoLmNlaWwoZmxvdy53aWR0aCgpIC8gZmxvdy5oZWlnaHQoKSk7XHJcblxyXG5cdFx0Ly8gY29uc29sZS5sb2coJ3JhdGlvJywgcmF0aW8pO1xyXG5cclxuXHRcdHZhciBjb2xDb3VudCA9IGdldENvbHVtbkNvdW50KHJhdGlvLCAkc2NvcGUuZmlsdGVyZWRFbnRyaWVzLmxlbmd0aCk7XHJcblxyXG5cdFx0dmFyIHNpemUgPSBNYXRoLmZsb29yKGZsb3cud2lkdGgoKSAvIGNvbENvdW50KTtcclxuXHRcdHZhciBwYWRkaW5nU2l6ZSA9IDI0O1xyXG5cclxuXHRcdHZhciByZXN1bHRUaHVtYm5haWxzID0gJCgnLnJlc3VsdC1pbWFnZScpO1xyXG5cdFx0cmVzdWx0VGh1bWJuYWlscy5jc3MoJ3dpZHRoJywgc2l6ZSAtIHBhZGRpbmdTaXplICsgJ3B4Jyk7XHJcblxyXG5cdFx0ZnVuY3Rpb24gZ2V0Q29sdW1uQ291bnQocmF0aW8sIG51bUl0ZW1zKSB7XHJcblx0XHRcdHZhciBtYXhDb2xzID0gMTIgKyAxO1xyXG5cdFx0XHR2YXIgY29sdW1ucyA9IDA7XHJcblx0XHRcdHZhciBpdGVtQ2FwYWNpdHkgPSAwO1xyXG5cclxuXHRcdFx0d2hpbGUgKGl0ZW1DYXBhY2l0eSA8IG51bUl0ZW1zICYmIGNvbHVtbnMgPCBtYXhDb2xzKSB7XHJcblx0XHRcdFx0aXRlbUNhcGFjaXR5ID0gY29sdW1ucyAqIHJhdGlvO1xyXG5cdFx0XHRcdGNvbHVtbnMgKz0gMTtcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0cmV0dXJuIE1hdGgubWF4KDEsIGNvbHVtbnMgKyAxKTtcclxuXHJcblx0XHR9XHJcblx0fTtcclxuXHJcblxyXG5cclxuXHQvKlxyXG5cdOKWiOKWiCAgICAg4paI4paIICDilojilojilojilojiloggIOKWiOKWiOKWiOKWiOKWiOKWiOKWiOKWiCAg4paI4paI4paI4paI4paI4paIIOKWiOKWiCAgIOKWiOKWiFxyXG5cdOKWiOKWiCAgICAg4paI4paIIOKWiOKWiCAgIOKWiOKWiCAgICDilojiloggICAg4paI4paIICAgICAg4paI4paIICAg4paI4paIXHJcblx04paI4paIICDiloggIOKWiOKWiCDilojilojilojilojilojilojiloggICAg4paI4paIICAgIOKWiOKWiCAgICAgIOKWiOKWiOKWiOKWiOKWiOKWiOKWiFxyXG5cdOKWiOKWiCDilojilojilogg4paI4paIIOKWiOKWiCAgIOKWiOKWiCAgICDilojiloggICAg4paI4paIICAgICAg4paI4paIICAg4paI4paIXHJcblx0IOKWiOKWiOKWiCDilojilojiloggIOKWiOKWiCAgIOKWiOKWiCAgICDilojiloggICAgIOKWiOKWiOKWiOKWiOKWiOKWiCDilojiloggICDilojilohcclxuXHQqL1xyXG5cclxuXHQkc2NvcGUuJHdhdGNoKCdkZXNpZ25FeHBsb3JlcicsIGRyYXdEZXNpZ25FeHBsb3Jlcik7XHJcblxyXG5cclxuXHJcblx0LypcclxuXHQg4paI4paI4paI4paI4paIICDilojilojiloggICAg4paI4paIICDilojilojilojilojilojiloggIOKWiOKWiOKWiCAgICDilojilohcclxuXHTilojiloggICDilojilogg4paI4paI4paI4paIICAg4paI4paIIOKWiOKWiCAgICDilojilogg4paI4paI4paI4paIICAg4paI4paIXHJcblx04paI4paI4paI4paI4paI4paI4paIIOKWiOKWiCDilojiloggIOKWiOKWiCDilojiloggICAg4paI4paIIOKWiOKWiCDilojiloggIOKWiOKWiFxyXG5cdOKWiOKWiCAgIOKWiOKWiCDilojiloggIOKWiOKWiCDilojilogg4paI4paIICAgIOKWiOKWiCDilojiloggIOKWiOKWiCDilojilohcclxuXHTilojiloggICDilojilogg4paI4paIICAg4paI4paI4paI4paIICDilojilojilojilojilojiloggIOKWiOKWiCAgIOKWiOKWiOKWiOKWiFxyXG5cdCovXHJcblxyXG5cdGZ1bmN0aW9uIGRyYXdEZXNpZ25FeHBsb3JlcigpIHtcclxuXHRcdCR0aW1lb3V0KGZ1bmN0aW9uICgpIHtcclxuXHRcdFx0aWYgKCRzY29wZS5kZXNpZ25FeHBsb3Jlcikge1xyXG5cdFx0XHRcdGlmICghZDMuc2VsZWN0KCcjcGFyYWxsZWwtY29vcmRzJylbMF1bMF0pIHJldHVybiBkcmF3RGVzaWduRXhwbG9yZXIoKTtcclxuXHRcdFx0XHQkc2NvcGUuZGVzaWduRXhwbG9yZXIucGFyY29vcmRzX2NyZWF0ZSgnI3BhcmFsbGVsLWNvb3JkcycpO1xyXG5cdFx0XHRcdHNldEZpbHRlcmVkRW50cmllcygpO1xyXG5cdFx0XHRcdCRzY29wZS5kZXNpZ25FeHBsb3Jlci5hYnN0cmFjdF9wYXJjb29yZHNfcG9zdFJlbmRlciA9IHNldEZpbHRlcmVkRW50cmllcztcclxuXHRcdFx0fVxyXG5cdFx0fSk7XHJcblx0fVxyXG5cclxuXHRmdW5jdGlvbiBzZXRGaWx0ZXJlZEVudHJpZXMoKSB7XHJcblx0XHQkc2NvcGUuZmlsdGVyZWRFbnRyaWVzID0gJHNjb3BlLmRlc2lnbkV4cGxvcmVyLmdyYXBocy5wYXJjb29yZHMuYnJ1c2hlZCgpIHx8ICRzY29wZS5kZXNpZ25FeHBsb3Jlci5nZXREYXRhKCk7XHJcblx0XHQkc2NvcGUuc2VsZWN0SXRlcmF0aW9uKG51bGwpO1xyXG5cdFx0JHRpbWVvdXQoZnVuY3Rpb24gKCkge1xyXG5cdFx0XHQkc2NvcGUuJGFwcGx5KCk7XHJcblx0XHRcdCRzY29wZS5yZXNpemVUaHVtYm5haWxzKCk7XHJcblx0XHR9KTtcclxuXHR9XHJcblxyXG59KTtcclxuIiwiLyoqXHJcbiAqIEBtZW1iZXJPZiBhcHBcclxuICogQG5nZG9jIGRpcmVjdGl2ZVxyXG4gKiBAbmFtZSBib3R0b21OYXZcclxuICogQHBhcmFtIHtzZXJ2aWNlfVxyXG4gKiBAZGVzY3JpcHRpb25cclxuICogICBSZXNpemFibGUgYm90dG9tIG5hdmlnYXRpb25cclxuICovXHJcbmFwcC5kaXJlY3RpdmUoJ2JvdHRvbU5hdicsIGZ1bmN0aW9uICgkdGltZW91dCkge1xyXG5cdHJldHVybiB7XHJcblx0XHRyZXN0cmljdDogJ0UnLFxyXG5cdFx0dGVtcGxhdGVVcmw6ICdqcy9zcmMvbWFpbi9kaXJlY3RpdmVzL2JvdHRvbU5hdi9ib3R0b21OYXYuaHRtbCcsXHJcblx0XHRsaW5rOiBmdW5jdGlvbiAoc2NvcGUpIHtcclxuXHJcblx0XHRcdCR0aW1lb3V0KGluaXRKcXVlcnkpO1xyXG5cclxuXHRcdFx0ZnVuY3Rpb24gaW5pdEpxdWVyeSgpIHtcclxuXHJcblx0XHRcdFx0dmFyIGJvdHRvbWJhciA9ICQoJy5ib3R0b20tbmF2Jyk7XHJcblxyXG5cdFx0XHRcdC8vIGJvdHRvbWJhci5yZXNpemFibGUoe1xyXG5cdFx0XHRcdC8vIFx0aGFuZGxlczoge1xyXG5cdFx0XHRcdC8vIFx0XHQnbic6ICcjaGFuZGxlJ1xyXG5cdFx0XHRcdC8vIFx0fVxyXG5cdFx0XHRcdC8vIH0pO1xyXG5cdFx0XHRcdC8vXHJcblx0XHRcdFx0Ly8gYm90dG9tYmFyLm9uKCdyZXNpemUnLCByZXNwb25kVG9SZXNpemUpO1xyXG5cclxuXHRcdFx0XHQkKHdpbmRvdylcclxuXHRcdFx0XHRcdC5vbigncmVzaXplJywgcmVzcG9uZFRvUmVzaXplKTtcclxuXHJcblx0XHRcdFx0cmVzcG9uZFRvUmVzaXplKCk7XHJcblxyXG5cdFx0XHRcdGZ1bmN0aW9uIHJlc3BvbmRUb1Jlc2l6ZSgpIHtcclxuXHJcblx0XHRcdFx0XHR2YXIgcGFyYWxsZWxEaXYgPSAkKCcjcGFyYWxsZWwtY29vcmRzJyk7XHJcblxyXG5cdFx0XHRcdFx0Ly8gJCgnI21haW4tY29udGVudC1mbG93JylcclxuXHRcdFx0XHRcdC8vIFx0LmNzcygncGFkZGluZy1ib3R0b20nLCBib3R0b21iYXIuaGVpZ2h0KCkrMTUwKTtcclxuXHJcblx0XHRcdFx0XHQkKCcjbWFpbi1jb250ZW50LWZsb3cnKVxyXG5cdFx0XHRcdFx0XHQuY3NzKCdtYXgtaGVpZ2h0JywgKCQod2luZG93LnRvcClcclxuXHRcdFx0XHRcdFx0XHQuaGVpZ2h0KCkgLSBib3R0b21iYXIub3V0ZXJIZWlnaHQoKSAtIDEzMCkgKyAncHgnKTtcclxuXHJcblxyXG5cdFx0XHRcdFx0Ly8gcGFyYWxsZWxEaXYuY3NzKCdoZWlnaHQnLCBib3R0b21iYXIuaGVpZ2h0KCkgLSAzMCk7XHJcblx0XHRcdFx0XHQvLyBwYXJhbGxlbERpdi5jc3MoJ3dpZHRoJywgYm90dG9tYmFyLndpZHRoKCkgLSAzMCk7XHJcblx0XHRcdFx0XHQvLyBpZiAoc2NvcGUuZGVzaWduRXhwbG9yZXIpIHtcclxuXHRcdFx0XHRcdC8vIFx0c2NvcGUuZGVzaWduRXhwbG9yZXIucmVuZGVyUGFyYWxsZWxDb29yZGluYXRlcygpO1xyXG5cdFx0XHRcdFx0Ly8gfVxyXG5cclxuXHRcdFx0XHRcdHNjb3BlLnJlc2l6ZVRodW1ibmFpbHMoKTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHR9O1xyXG59KTtcclxuIiwiLyoqXHJcbiAqIEBtZW1iZXJPZiBhcHBcclxuICogQG5nZG9jIGRpcmVjdGl2ZVxyXG4gKiBAbmFtZSByZXN1bHRzVGh1bWJuYWlsc1xyXG4gKiBAcGFyYW0ge3NlcnZpY2V9XHJcbiAqIEBkZXNjcmlwdGlvblxyXG4gKiAgIFRodW1ibmFpbHMgb2YgcmVzdWx0c1xyXG4gKi9cclxuYXBwLmRpcmVjdGl2ZSgncmVzdWx0c1RodW1ibmFpbHMnLCBmdW5jdGlvbiAoJHRpbWVvdXQpIHtcclxuXHRyZXR1cm4ge1xyXG5cdFx0cmVzdHJpY3Q6ICdFJyxcclxuXHRcdHRlbXBsYXRlVXJsOiAnanMvc3JjL21haW4vZGlyZWN0aXZlcy9yZXN1bHRzVGh1bWJuYWlscy9yZXN1bHRzVGh1bWJuYWlscy5odG1sJyxcclxuXHRcdGxpbms6IGZ1bmN0aW9uIChzY29wZSkge1xyXG5cdFx0XHRzY29wZS5nZXRPcmRlckJ5ID0gZnVuY3Rpb24gKCkge1xyXG5cdFx0XHRcdHJldHVybiAoc2NvcGUuZGVzaWduRXhwbG9yZXIgJiYgc2NvcGUuZGVzaWduRXhwbG9yZXIuc2VsZWN0ZWRQYXJhbSkgPyBzY29wZS5kZXNpZ25FeHBsb3Jlci5zZWxlY3RlZFBhcmFtW0Rlc2lnbkV4cGxvcmVyLmRhdGFLZXldIDogJyc7XHJcblx0XHRcdH07XHJcblx0XHR9XHJcblx0fTtcclxufSk7XHJcbiIsIi8qKlxyXG4gKiBAbWVtYmVyT2YgYXBwXHJcbiAqIEBuZ2RvYyBkaXJlY3RpdmVcclxuICogQG5hbWUgc2VsZWN0ZWRJdGVyYXRpb25cclxuICogQHBhcmFtIHtzZXJ2aWNlfVxyXG4gKiBAZGVzY3JpcHRpb25cclxuICogICBUaGUgY3VycmVudCBzZWxlY3RlZCBpdGVyYXRpb24gZm9yIGluc3BlY3Rpb25cclxuICovXHJcbmFwcC5kaXJlY3RpdmUoJ3NlbGVjdGVkSXRlcmF0aW9uJywgZnVuY3Rpb24gKCR0aW1lb3V0KSB7XHJcblx0cmV0dXJuIHtcclxuXHRcdHJlc3RyaWN0OiAnRScsXHJcblx0XHR0ZW1wbGF0ZVVybDogJ2pzL3NyYy9tYWluL2RpcmVjdGl2ZXMvc2VsZWN0ZWRJdGVyYXRpb24vc2VsZWN0ZWRJdGVyYXRpb24uaHRtbCcsXHJcblx0XHRsaW5rOiBmdW5jdGlvbiAoc2NvcGUpIHtcclxuXHRcdH1cclxuXHR9O1xyXG59KTtcclxuIiwiLyoqXHJcbiAqIEBtZW1iZXJPZiBhcHBcclxuICogQG5nZG9jIGRpcmVjdGl2ZVxyXG4gKiBAbmFtZSBuYXZiYXJcclxuICogQHBhcmFtIHtzZXJ2aWNlfVxyXG4gKiBAZGVzY3JpcHRpb25cclxuICogICBOYXZiYXIuIERvZXNuJ3QgcmVhbGx5IGRvIGFueXRoaW5nIGludGVyZXN0aW5nIHlldC5cclxuICovXHJcbmFwcC5kaXJlY3RpdmUoJ25hdmJhcicsIGZ1bmN0aW9uKCkge1xyXG5cdHJldHVybiB7XHJcblx0XHRyZXN0cmljdDogJ0UnLFxyXG5cdFx0dGVtcGxhdGVVcmw6ICdqcy9zcmMvbWFpbi9kaXJlY3RpdmVzL25hdmJhci9uYXZiYXIuaHRtbCcsXHJcblx0XHRsaW5rOiBmdW5jdGlvbihzY29wZSkge1xyXG5cdFx0fVxyXG5cdH07XHJcbn0pO1xyXG4iLCIvKipcclxuICogQG1lbWJlck9mIGFwcFxyXG4gKiBAbmdkb2MgZGlyZWN0aXZlXHJcbiAqIEBuYW1lIGFuaW1hdGVkUmVzdWx0c1xyXG4gKiBAcGFyYW0ge3NlcnZpY2V9XHJcbiAqIEBkZXNjcmlwdGlvblxyXG4gKiAgIEFuaW1hdGVkIHJlc3VsdHNcclxuICovXHJcbmFwcC5kaXJlY3RpdmUoJ2FuaW1hdGVkUmVzdWx0cycsIGZ1bmN0aW9uICgkdGltZW91dCkge1xyXG5cdHJldHVybiB7XHJcblx0XHRyZXN0cmljdDogJ0UnLFxyXG5cdFx0dGVtcGxhdGVVcmw6ICdqcy9zcmMvbWFpbi9kaXJlY3RpdmVzL2FuaW1hdGVkUmVzdWx0cy9hbmltYXRlZFJlc3VsdHMuaHRtbCcsXHJcblx0XHRsaW5rOiBmdW5jdGlvbiAoc2NvcGUpIHtcclxuXHJcblx0XHRcdHNjb3BlLmFuaW1hdGVkUmVzdWx0cz17XHJcblx0XHRcdFx0Y3VyRnJhbWU6MCxcclxuXHRcdFx0XHRmcmFtZXM6MCxcclxuXHRcdFx0XHRjdXJGcmFtZUluZm86bnVsbFxyXG5cdFx0XHR9O1xyXG5cclxuXHRcdFx0c2NvcGUuJHdhdGNoKCdmaWx0ZXJlZEVudHJpZXMnLCBjaGVja1doZXRoZXJUb0FuaW1hdGUpO1xyXG5cdFx0XHRzY29wZS4kd2F0Y2goJ3ZpZXdNb2RlJywgY2hlY2tXaGV0aGVyVG9BbmltYXRlKTtcclxuXHRcdFx0c2NvcGUuJHdhdGNoKCdzZWxlY3RlZEl0ZXJhdGlvbicsIGNoZWNrV2hldGhlclRvQW5pbWF0ZSk7XHJcblxyXG5cdFx0XHR2YXIgZGVib3VuY2VOZXh0O1xyXG5cdFx0XHR2YXIgYW5pbWF0ZVNwZWVkID0gMzAwO1xyXG5cdFx0XHR2YXIgaXNBbmltYXRpbmcgPSBmYWxzZTtcclxuXHJcblx0XHRcdC8qXHJcblx0XHRcdCDilojilojilojilojiloggIOKWiOKWiOKWiCAgICDilojiloggIOKWiOKWiOKWiOKWiOKWiOKWiCAg4paI4paI4paIICAgIOKWiOKWiFxyXG5cdFx0XHTilojiloggICDilojilogg4paI4paI4paI4paIICAg4paI4paIIOKWiOKWiCAgICDilojilogg4paI4paI4paI4paIICAg4paI4paIXHJcblx0XHRcdOKWiOKWiOKWiOKWiOKWiOKWiOKWiCDilojilogg4paI4paIICDilojilogg4paI4paIICAgIOKWiOKWiCDilojilogg4paI4paIICDilojilohcclxuXHRcdFx04paI4paIICAg4paI4paIIOKWiOKWiCAg4paI4paIIOKWiOKWiCDilojiloggICAg4paI4paIIOKWiOKWiCAg4paI4paIIOKWiOKWiFxyXG5cdFx0XHTilojiloggICDilojilogg4paI4paIICAg4paI4paI4paI4paIICDilojilojilojilojilojiloggIOKWiOKWiCAgIOKWiOKWiOKWiOKWiFxyXG5cdFx0XHQqL1xyXG5cclxuXHRcdFx0LyoqXHJcblx0XHRcdCAqIENoZWNrIHdoZXRoZXIgd2Ugc2hvdWxkIG1vdmUgZm9yd2FyZCB3aXRoIGFuaW1hdGluZyBvciB0ZXJtaW5hdGUgYSBwcmV2aW91cyBhbmltYXRpb25cclxuXHRcdFx0ICovXHJcblx0XHRcdGZ1bmN0aW9uIGNoZWNrV2hldGhlclRvQW5pbWF0ZSgpIHtcclxuXHRcdFx0XHRpZiAoIWlzQW5pbWF0ZU1vZGUoKSB8fCBzY29wZS5zZWxlY3RlZEl0ZXJhdGlvbikge1xyXG5cdFx0XHRcdFx0Y2xlYW5QcmV2aW91c0FuaW1hdGlvbigpO1xyXG5cdFx0XHRcdH0gZWxzZSB7XHJcblx0XHRcdFx0XHRzdGFydE5ld0FuaW1hdGlvbigpO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0LyoqXHJcblx0XHRcdCAqIFN0YXJ0cyBhIG5ldyBhbmltYXRpb25cclxuXHRcdFx0ICovXHJcblx0XHRcdGZ1bmN0aW9uIHN0YXJ0TmV3QW5pbWF0aW9uKCkge1xyXG5cdFx0XHRcdGlmICghc2NvcGUuZmlsdGVyZWRFbnRyaWVzIHx8ICFpc0FuaW1hdGVNb2RlKCkpIHJldHVybjtcclxuXHRcdFx0XHRpZiAoIXNjb3BlLmZpbHRlcmVkRW50cmllcy5sZW5ndGgpIHtcclxuXHRcdFx0XHRcdCQoJyNhbmltYXRlZC1yZXN1bHRzJylcclxuXHRcdFx0XHRcdFx0LmF0dHIoJ3NyYycsICcnKTtcclxuXHRcdFx0XHRcdCQoJyNjdXItZnJhbWUtaW5mbycpXHJcblx0XHRcdFx0XHRcdC5odG1sKCcnKTtcclxuXHRcdFx0XHR9XHJcblxyXG5cdFx0XHRcdHNjb3BlLmFuaW1hdGVkUmVzdWx0cy5jdXJGcmFtZSA9IDA7XHJcblx0XHRcdFx0c2NvcGUuYW5pbWF0ZWRSZXN1bHRzLmZyYW1lcyA9IHNjb3BlLmZpbHRlcmVkRW50cmllcy5sZW5ndGg7XHJcblxyXG5cdFx0XHRcdHZhciBuZXdBbmltYXRlU3BlZWQgPSBNYXRoLm1heCgxMDAwMDAgLyBzY29wZS5hbmltYXRlZFJlc3VsdHMuZnJhbWVzLCAzMDApOyAvLyBtaW4gZGVib3VuY2UgdGltZVxyXG5cdFx0XHRcdG5ld0FuaW1hdGVTcGVlZCA9IE1hdGgubWluKG5ld0FuaW1hdGVTcGVlZCwgMTUwMCk7IC8vIG1heCBkZWJvdW5jZSB0aW1lXHJcblx0XHRcdFx0YW5pbWF0ZVNwZWVkID0gbmV3QW5pbWF0ZVNwZWVkO1xyXG5cclxuXHRcdFx0XHRpZiAoIWlzQW5pbWF0aW5nKSBhbmltYXRlKCk7XHJcblx0XHRcdFx0aXNBbmltYXRpbmcgPSB0cnVlO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHQvKipcclxuXHRcdFx0ICogQW5pbWF0ZSBsb29wXHJcblx0XHRcdCAqL1xyXG5cdFx0XHRmdW5jdGlvbiBhbmltYXRlKCkge1xyXG5cdFx0XHRcdGlmICghaXNBbmltYXRlTW9kZSgpKSB7XHJcblx0XHRcdFx0XHRpc0FuaW1hdGluZyA9IGZhbHNlO1xyXG5cdFx0XHRcdFx0cmV0dXJuO1xyXG5cdFx0XHRcdH0gZWxzZSB7XHJcblx0XHRcdFx0XHRzaG93TmV4dEZyYW1lKCk7XHJcblx0XHRcdFx0XHRzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcclxuXHRcdFx0XHRcdFx0YW5pbWF0ZSgpO1xyXG5cdFx0XHRcdFx0fSwgYW5pbWF0ZVNwZWVkKTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdC8qKlxyXG5cdFx0XHQgKiBDb2RlIHRvIG1vdmUgZm9yd2FyZCBhIGZyYW1lLiBDYWxsZWQgZnJvbSB0aGUgYW5pbWF0ZSBsb29wLlxyXG5cdFx0XHQgKi9cclxuXHRcdFx0ZnVuY3Rpb24gc2hvd05leHRGcmFtZSgpIHtcclxuXHRcdFx0XHRpZiAoIWlzQW5pbWF0ZU1vZGUoKSkgcmV0dXJuO1xyXG5cdFx0XHRcdGNsZWFuUHJldmlvdXNBbmltYXRpb24oKTtcclxuXHJcblx0XHRcdFx0aWYgKCFzY29wZS5maWx0ZXJlZEVudHJpZXMgfHwgIXNjb3BlLmZpbHRlcmVkRW50cmllcy5sZW5ndGgpIHJldHVybjtcclxuXHRcdFx0XHRzY29wZS5hbmltYXRlZFJlc3VsdHMuY3VyRnJhbWVJbmZvID0gc2NvcGUuZmlsdGVyZWRFbnRyaWVzW3Njb3BlLmFuaW1hdGVkUmVzdWx0cy5jdXJGcmFtZV07XHJcblxyXG5cdFx0XHRcdCQoJyNhbmltYXRlZC1yZXN1bHRzJylcclxuXHRcdFx0XHRcdC5hdHRyKCdzcmMnLCBzY29wZS5hbmltYXRlZFJlc3VsdHMuY3VyRnJhbWVJbmZvLmltZyk7XHJcblxyXG5cdFx0XHRcdCQoJyNhbmltYXRlZC1yZXN1bHRzJylcclxuXHRcdFx0XHRcdC5vbignY2xpY2snLCBmdW5jdGlvbiAoKSB7XHJcblx0XHRcdFx0XHRcdGNsZWFuUHJldmlvdXNBbmltYXRpb24oKTtcclxuXHRcdFx0XHRcdFx0c2NvcGUudmlld01vZGU9J3RodW1ibmFpbHMnO1xyXG5cdFx0XHRcdFx0XHQkdGltZW91dChmdW5jdGlvbigpe1xyXG5cdFx0XHRcdFx0XHRcdHNjb3BlLnNlbGVjdEl0ZXJhdGlvbihzY29wZS5hbmltYXRlZFJlc3VsdHMuY3VyRnJhbWVJbmZvKTtcclxuXHRcdFx0XHRcdFx0fSk7XHJcblx0XHRcdFx0XHR9KTtcclxuXHJcblx0XHRcdFx0dmFyIGluZm9Cb3ggPSAkKCcjY3VyLWZyYW1lLWluZm8nKTtcclxuXHJcblx0XHRcdFx0c2NvcGUuZGVzaWduRXhwbG9yZXIucG9wdWxhdGVJdGVyYXRpb25UYWJsZShpbmZvQm94LCBzY29wZS5hbmltYXRlZFJlc3VsdHMuY3VyRnJhbWVJbmZvKTtcclxuXHJcblx0XHRcdFx0c2NvcGUuZGVzaWduRXhwbG9yZXIuZ3JhcGhzLnBhcmNvb3Jkcy5oaWdobGlnaHQoW3Njb3BlLmFuaW1hdGVkUmVzdWx0cy5jdXJGcmFtZUluZm9dKTtcclxuXHJcblx0XHRcdFx0c2NvcGUuYW5pbWF0ZWRSZXN1bHRzLmN1ckZyYW1lICs9IDE7XHJcblx0XHRcdFx0aWYgKHNjb3BlLmFuaW1hdGVkUmVzdWx0cy5jdXJGcmFtZSA+PSBzY29wZS5hbmltYXRlZFJlc3VsdHMuZnJhbWVzKSBzY29wZS5hbmltYXRlZFJlc3VsdHMuY3VyRnJhbWUgPSAwO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHQvKipcclxuXHRcdFx0ICogQ2xlYW4gbGVmdG92ZXIgc3R1ZmYgZnJvbSBhIHByZXZpb3VzIGFuaW1hdGlvblxyXG5cdFx0XHQgKi9cclxuXHRcdFx0ZnVuY3Rpb24gY2xlYW5QcmV2aW91c0FuaW1hdGlvbigpIHtcclxuXHRcdFx0XHRpZiAoc2NvcGUuZGVzaWduRXhwbG9yZXIgJiYgc2NvcGUuZGVzaWduRXhwbG9yZXIuZ3JhcGhzLnBhcmNvb3Jkcykgc2NvcGUuZGVzaWduRXhwbG9yZXIuZ3JhcGhzLnBhcmNvb3Jkcy51bmhpZ2hsaWdodCgpO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHQvKipcclxuXHRcdFx0ICogV2hldGhlciB3ZSdyZSBjdXJyZW50bHkgaW4gYW5pbWF0aW9uIG1vZGVcclxuXHRcdFx0ICogQHJldHVybiB7Qm9vbGVhbn1cclxuXHRcdFx0ICovXHJcblx0XHRcdGZ1bmN0aW9uIGlzQW5pbWF0ZU1vZGUoKSB7XHJcblx0XHRcdFx0cmV0dXJuIHNjb3BlLnZpZXdNb2RlID09PSAnYW5pbWF0aW9uJztcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cdH07XHJcbn0pO1xyXG4iXX0=
