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

			scope.curFrame = 0;
			scope.frames = 0;
			scope.curFrameInfo = null;
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

				scope.curFrame = 0;
				scope.frames = scope.filteredEntries.length;

				var newAnimateSpeed = Math.max(100000 / scope.frames, 300); // min debounce time
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
				scope.curFrameInfo = scope.filteredEntries[scope.curFrame];

				$('#animated-results')
					.attr('src', scope.curFrameInfo.img);

				$('#animated-results')
					.on('click', function () {
						cleanPreviousAnimation();
						scope.viewMode='thumbnails';
						$timeout(function(){
							scope.selectIteration(scope.curFrameInfo);
						});
					});

				var infoBox = $('#cur-frame-info');

				scope.designExplorer.populateIterationTable(infoBox, scope.curFrameInfo);

				scope.designExplorer.graphs.parcoords.highlight([scope.curFrameInfo]);

				scope.curFrame += 1;
				if (scope.curFrame >= scope.frames) scope.curFrame = 0;
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
 * Base state for all nested future states we may have
 */
app.config(function ($stateProvider) {
	$stateProvider.state('root', {
		name: 'root',
		// abstract: true,
		url: '/',
		templateUrl: 'js/src/main/states/root/root.html',
		controller: 'RootStateCtrl'
	});
});

app.controller('RootStateCtrl', function ($rootScope, $scope, $timeout) {

	var designExplorer;

	var spect;

	d3.csv("design_explorer_data/kpf/20160811_DataTable_Formatted.csv")
		.get(function (error, rows) {
			$scope.designExplorer = new DesignExplorer(rows);
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
		});
		$timeout(function () {
			$('#spectacles-container')
				.trigger('resize');
		});
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
				$scope.designExplorer.parcoords_create('#parallel-coords');
				setFilteredEntries();
			}

			$scope.designExplorer.abstract_parcoords_postRender = setFilteredEntries;
		});
	}

	function setFilteredEntries() {
		$scope.filteredEntries = $scope.designExplorer.graphs.parcoords.brushed() || $scope.designExplorer.getData();
		$scope.selectIteration(null);
		$timeout(function () {
			$scope.$apply();
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
				}
			}
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

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImhlYWRlci5qcyIsImZpbHRlcnMvdHlwZU9mLmpzIiwic3RhdGVzL2RlZmF1bHQuanMiLCJkaXJlY3RpdmVzL2FuaW1hdGVkUmVzdWx0cy9hbmltYXRlZFJlc3VsdHMuanMiLCJzdGF0ZXMvcm9vdC9yb290LmpzIiwiZGlyZWN0aXZlcy9ib3R0b21OYXYvYm90dG9tTmF2LmpzIiwiZGlyZWN0aXZlcy9uYXZiYXIvbmF2YmFyLmpzIiwiZGlyZWN0aXZlcy9yZXN1bHRzVGh1bWJuYWlscy9yZXN1bHRzVGh1bWJuYWlscy5qcyIsImRpcmVjdGl2ZXMvc2VsZWN0ZWRJdGVyYXRpb24vc2VsZWN0ZWRJdGVyYXRpb24uanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ1BBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ0xBO0FBQ0E7QUFDQTtBQUNBO0FDSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDbklBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ2pIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDdkRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNoQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ25CQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6Im1haW4uanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcclxuICogQW5ndWxhciBhcHBsaWNhdGlvbi4gU2VlIEFuZ3VsYXItc3BlY2lmaWMgZG9jdW1lbnRhdGlvbiBmb3IgYW55dGhpbmcgaW5zaWRlXHJcbiAqIG9mIGFwcC5zb21ldGhpbmcuXHJcbiAqIEB0eXBlIHtvYmplY3R9XHJcbiAqIEBnbG9iYWxcclxuICovXHJcbnZhciBhcHAgPSBhbmd1bGFyLm1vZHVsZSgnZGVzaWduZXhwbG9yZXIuZGVtbycsIFsndWkucm91dGVyJ10pO1xyXG4iLCJhcHAuZmlsdGVyKCd0eXBlb2YnLCBmdW5jdGlvbigpIHtcclxuICByZXR1cm4gZnVuY3Rpb24ob2JqKSB7XHJcbiAgICByZXR1cm4gdHlwZW9mIG9iajtcclxuICB9O1xyXG59KTtcclxuIiwiYXBwLmNvbmZpZyhmdW5jdGlvbigkdXJsUm91dGVyUHJvdmlkZXIpIHtcclxuICAkdXJsUm91dGVyUHJvdmlkZXIub3RoZXJ3aXNlKCcvJyk7XHJcbn0pO1xyXG4iLCIvKipcclxuICogQG1lbWJlck9mIGFwcFxyXG4gKiBAbmdkb2MgZGlyZWN0aXZlXHJcbiAqIEBuYW1lIGFuaW1hdGVkUmVzdWx0c1xyXG4gKiBAcGFyYW0ge3NlcnZpY2V9XHJcbiAqIEBkZXNjcmlwdGlvblxyXG4gKiAgIEFuaW1hdGVkIHJlc3VsdHNcclxuICovXHJcbmFwcC5kaXJlY3RpdmUoJ2FuaW1hdGVkUmVzdWx0cycsIGZ1bmN0aW9uICgkdGltZW91dCkge1xyXG5cdHJldHVybiB7XHJcblx0XHRyZXN0cmljdDogJ0UnLFxyXG5cdFx0dGVtcGxhdGVVcmw6ICdqcy9zcmMvbWFpbi9kaXJlY3RpdmVzL2FuaW1hdGVkUmVzdWx0cy9hbmltYXRlZFJlc3VsdHMuaHRtbCcsXHJcblx0XHRsaW5rOiBmdW5jdGlvbiAoc2NvcGUpIHtcclxuXHJcblx0XHRcdHNjb3BlLmN1ckZyYW1lID0gMDtcclxuXHRcdFx0c2NvcGUuZnJhbWVzID0gMDtcclxuXHRcdFx0c2NvcGUuY3VyRnJhbWVJbmZvID0gbnVsbDtcclxuXHRcdFx0c2NvcGUuJHdhdGNoKCdmaWx0ZXJlZEVudHJpZXMnLCBjaGVja1doZXRoZXJUb0FuaW1hdGUpO1xyXG5cdFx0XHRzY29wZS4kd2F0Y2goJ3ZpZXdNb2RlJywgY2hlY2tXaGV0aGVyVG9BbmltYXRlKTtcclxuXHRcdFx0c2NvcGUuJHdhdGNoKCdzZWxlY3RlZEl0ZXJhdGlvbicsIGNoZWNrV2hldGhlclRvQW5pbWF0ZSk7XHJcblxyXG5cdFx0XHR2YXIgZGVib3VuY2VOZXh0O1xyXG5cdFx0XHR2YXIgYW5pbWF0ZVNwZWVkID0gMzAwO1xyXG5cdFx0XHR2YXIgaXNBbmltYXRpbmcgPSBmYWxzZTtcclxuXHJcblx0XHRcdC8qXHJcblx0XHRcdCDilojilojilojilojiloggIOKWiOKWiOKWiCAgICDilojiloggIOKWiOKWiOKWiOKWiOKWiOKWiCAg4paI4paI4paIICAgIOKWiOKWiFxyXG5cdFx0XHTilojiloggICDilojilogg4paI4paI4paI4paIICAg4paI4paIIOKWiOKWiCAgICDilojilogg4paI4paI4paI4paIICAg4paI4paIXHJcblx0XHRcdOKWiOKWiOKWiOKWiOKWiOKWiOKWiCDilojilogg4paI4paIICDilojilogg4paI4paIICAgIOKWiOKWiCDilojilogg4paI4paIICDilojilohcclxuXHRcdFx04paI4paIICAg4paI4paIIOKWiOKWiCAg4paI4paIIOKWiOKWiCDilojiloggICAg4paI4paIIOKWiOKWiCAg4paI4paIIOKWiOKWiFxyXG5cdFx0XHTilojiloggICDilojilogg4paI4paIICAg4paI4paI4paI4paIICDilojilojilojilojilojiloggIOKWiOKWiCAgIOKWiOKWiOKWiOKWiFxyXG5cdFx0XHQqL1xyXG5cclxuXHRcdFx0LyoqXHJcblx0XHRcdCAqIENoZWNrIHdoZXRoZXIgd2Ugc2hvdWxkIG1vdmUgZm9yd2FyZCB3aXRoIGFuaW1hdGluZyBvciB0ZXJtaW5hdGUgYSBwcmV2aW91cyBhbmltYXRpb25cclxuXHRcdFx0ICovXHJcblx0XHRcdGZ1bmN0aW9uIGNoZWNrV2hldGhlclRvQW5pbWF0ZSgpIHtcclxuXHRcdFx0XHRpZiAoIWlzQW5pbWF0ZU1vZGUoKSB8fCBzY29wZS5zZWxlY3RlZEl0ZXJhdGlvbikge1xyXG5cdFx0XHRcdFx0Y2xlYW5QcmV2aW91c0FuaW1hdGlvbigpO1xyXG5cdFx0XHRcdH0gZWxzZSB7XHJcblx0XHRcdFx0XHRzdGFydE5ld0FuaW1hdGlvbigpO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0LyoqXHJcblx0XHRcdCAqIFN0YXJ0cyBhIG5ldyBhbmltYXRpb25cclxuXHRcdFx0ICovXHJcblx0XHRcdGZ1bmN0aW9uIHN0YXJ0TmV3QW5pbWF0aW9uKCkge1xyXG5cdFx0XHRcdGlmICghc2NvcGUuZmlsdGVyZWRFbnRyaWVzIHx8ICFpc0FuaW1hdGVNb2RlKCkpIHJldHVybjtcclxuXHRcdFx0XHRpZiAoIXNjb3BlLmZpbHRlcmVkRW50cmllcy5sZW5ndGgpIHtcclxuXHRcdFx0XHRcdCQoJyNhbmltYXRlZC1yZXN1bHRzJylcclxuXHRcdFx0XHRcdFx0LmF0dHIoJ3NyYycsICcnKTtcclxuXHRcdFx0XHRcdCQoJyNjdXItZnJhbWUtaW5mbycpXHJcblx0XHRcdFx0XHRcdC5odG1sKCcnKTtcclxuXHRcdFx0XHR9XHJcblxyXG5cdFx0XHRcdHNjb3BlLmN1ckZyYW1lID0gMDtcclxuXHRcdFx0XHRzY29wZS5mcmFtZXMgPSBzY29wZS5maWx0ZXJlZEVudHJpZXMubGVuZ3RoO1xyXG5cclxuXHRcdFx0XHR2YXIgbmV3QW5pbWF0ZVNwZWVkID0gTWF0aC5tYXgoMTAwMDAwIC8gc2NvcGUuZnJhbWVzLCAzMDApOyAvLyBtaW4gZGVib3VuY2UgdGltZVxyXG5cdFx0XHRcdG5ld0FuaW1hdGVTcGVlZCA9IE1hdGgubWluKG5ld0FuaW1hdGVTcGVlZCwgMTUwMCk7IC8vIG1heCBkZWJvdW5jZSB0aW1lXHJcblx0XHRcdFx0YW5pbWF0ZVNwZWVkID0gbmV3QW5pbWF0ZVNwZWVkO1xyXG5cclxuXHRcdFx0XHRpZiAoIWlzQW5pbWF0aW5nKSBhbmltYXRlKCk7XHJcblx0XHRcdFx0aXNBbmltYXRpbmcgPSB0cnVlO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHQvKipcclxuXHRcdFx0ICogQW5pbWF0ZSBsb29wXHJcblx0XHRcdCAqL1xyXG5cdFx0XHRmdW5jdGlvbiBhbmltYXRlKCkge1xyXG5cdFx0XHRcdGlmICghaXNBbmltYXRlTW9kZSgpKSB7XHJcblx0XHRcdFx0XHRpc0FuaW1hdGluZyA9IGZhbHNlO1xyXG5cdFx0XHRcdFx0cmV0dXJuO1xyXG5cdFx0XHRcdH0gZWxzZSB7XHJcblx0XHRcdFx0XHRzaG93TmV4dEZyYW1lKCk7XHJcblx0XHRcdFx0XHRzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcclxuXHRcdFx0XHRcdFx0YW5pbWF0ZSgpO1xyXG5cdFx0XHRcdFx0fSwgYW5pbWF0ZVNwZWVkKTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdC8qKlxyXG5cdFx0XHQgKiBDb2RlIHRvIG1vdmUgZm9yd2FyZCBhIGZyYW1lLiBDYWxsZWQgZnJvbSB0aGUgYW5pbWF0ZSBsb29wLlxyXG5cdFx0XHQgKi9cclxuXHRcdFx0ZnVuY3Rpb24gc2hvd05leHRGcmFtZSgpIHtcclxuXHRcdFx0XHRpZiAoIWlzQW5pbWF0ZU1vZGUoKSkgcmV0dXJuO1xyXG5cdFx0XHRcdGNsZWFuUHJldmlvdXNBbmltYXRpb24oKTtcclxuXHJcblx0XHRcdFx0aWYgKCFzY29wZS5maWx0ZXJlZEVudHJpZXMgfHwgIXNjb3BlLmZpbHRlcmVkRW50cmllcy5sZW5ndGgpIHJldHVybjtcclxuXHRcdFx0XHRzY29wZS5jdXJGcmFtZUluZm8gPSBzY29wZS5maWx0ZXJlZEVudHJpZXNbc2NvcGUuY3VyRnJhbWVdO1xyXG5cclxuXHRcdFx0XHQkKCcjYW5pbWF0ZWQtcmVzdWx0cycpXHJcblx0XHRcdFx0XHQuYXR0cignc3JjJywgc2NvcGUuY3VyRnJhbWVJbmZvLmltZyk7XHJcblxyXG5cdFx0XHRcdCQoJyNhbmltYXRlZC1yZXN1bHRzJylcclxuXHRcdFx0XHRcdC5vbignY2xpY2snLCBmdW5jdGlvbiAoKSB7XHJcblx0XHRcdFx0XHRcdGNsZWFuUHJldmlvdXNBbmltYXRpb24oKTtcclxuXHRcdFx0XHRcdFx0c2NvcGUudmlld01vZGU9J3RodW1ibmFpbHMnO1xyXG5cdFx0XHRcdFx0XHQkdGltZW91dChmdW5jdGlvbigpe1xyXG5cdFx0XHRcdFx0XHRcdHNjb3BlLnNlbGVjdEl0ZXJhdGlvbihzY29wZS5jdXJGcmFtZUluZm8pO1xyXG5cdFx0XHRcdFx0XHR9KTtcclxuXHRcdFx0XHRcdH0pO1xyXG5cclxuXHRcdFx0XHR2YXIgaW5mb0JveCA9ICQoJyNjdXItZnJhbWUtaW5mbycpO1xyXG5cclxuXHRcdFx0XHRzY29wZS5kZXNpZ25FeHBsb3Jlci5wb3B1bGF0ZUl0ZXJhdGlvblRhYmxlKGluZm9Cb3gsIHNjb3BlLmN1ckZyYW1lSW5mbyk7XHJcblxyXG5cdFx0XHRcdHNjb3BlLmRlc2lnbkV4cGxvcmVyLmdyYXBocy5wYXJjb29yZHMuaGlnaGxpZ2h0KFtzY29wZS5jdXJGcmFtZUluZm9dKTtcclxuXHJcblx0XHRcdFx0c2NvcGUuY3VyRnJhbWUgKz0gMTtcclxuXHRcdFx0XHRpZiAoc2NvcGUuY3VyRnJhbWUgPj0gc2NvcGUuZnJhbWVzKSBzY29wZS5jdXJGcmFtZSA9IDA7XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdC8qKlxyXG5cdFx0XHQgKiBDbGVhbiBsZWZ0b3ZlciBzdHVmZiBmcm9tIGEgcHJldmlvdXMgYW5pbWF0aW9uXHJcblx0XHRcdCAqL1xyXG5cdFx0XHRmdW5jdGlvbiBjbGVhblByZXZpb3VzQW5pbWF0aW9uKCkge1xyXG5cdFx0XHRcdGlmIChzY29wZS5kZXNpZ25FeHBsb3JlciAmJiBzY29wZS5kZXNpZ25FeHBsb3Jlci5ncmFwaHMucGFyY29vcmRzKSBzY29wZS5kZXNpZ25FeHBsb3Jlci5ncmFwaHMucGFyY29vcmRzLnVuaGlnaGxpZ2h0KCk7XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdC8qKlxyXG5cdFx0XHQgKiBXaGV0aGVyIHdlJ3JlIGN1cnJlbnRseSBpbiBhbmltYXRpb24gbW9kZVxyXG5cdFx0XHQgKiBAcmV0dXJuIHtCb29sZWFufVxyXG5cdFx0XHQgKi9cclxuXHRcdFx0ZnVuY3Rpb24gaXNBbmltYXRlTW9kZSgpIHtcclxuXHRcdFx0XHRyZXR1cm4gc2NvcGUudmlld01vZGUgPT09ICdhbmltYXRpb24nO1xyXG5cdFx0XHR9XHJcblx0XHR9XHJcblx0fTtcclxufSk7XHJcbiIsIi8qKlxyXG4gKiBCYXNlIHN0YXRlIGZvciBhbGwgbmVzdGVkIGZ1dHVyZSBzdGF0ZXMgd2UgbWF5IGhhdmVcclxuICovXHJcbmFwcC5jb25maWcoZnVuY3Rpb24gKCRzdGF0ZVByb3ZpZGVyKSB7XHJcblx0JHN0YXRlUHJvdmlkZXIuc3RhdGUoJ3Jvb3QnLCB7XHJcblx0XHRuYW1lOiAncm9vdCcsXHJcblx0XHQvLyBhYnN0cmFjdDogdHJ1ZSxcclxuXHRcdHVybDogJy8nLFxyXG5cdFx0dGVtcGxhdGVVcmw6ICdqcy9zcmMvbWFpbi9zdGF0ZXMvcm9vdC9yb290Lmh0bWwnLFxyXG5cdFx0Y29udHJvbGxlcjogJ1Jvb3RTdGF0ZUN0cmwnXHJcblx0fSk7XHJcbn0pO1xyXG5cclxuYXBwLmNvbnRyb2xsZXIoJ1Jvb3RTdGF0ZUN0cmwnLCBmdW5jdGlvbiAoJHJvb3RTY29wZSwgJHNjb3BlLCAkdGltZW91dCkge1xyXG5cclxuXHR2YXIgZGVzaWduRXhwbG9yZXI7XHJcblxyXG5cdHZhciBzcGVjdDtcclxuXHJcblx0ZDMuY3N2KFwiZGVzaWduX2V4cGxvcmVyX2RhdGEva3BmLzIwMTYwODExX0RhdGFUYWJsZV9Gb3JtYXR0ZWQuY3N2XCIpXHJcblx0XHQuZ2V0KGZ1bmN0aW9uIChlcnJvciwgcm93cykge1xyXG5cdFx0XHQkc2NvcGUuZGVzaWduRXhwbG9yZXIgPSBuZXcgRGVzaWduRXhwbG9yZXIocm93cyk7XHJcblx0XHR9KTtcclxuXHJcblx0JHNjb3BlLnZpZXdNb2RlID0gJ3RodW1ibmFpbHMnO1xyXG5cclxuXHQkc2NvcGUuc2VsZWN0ZWRJdGVyYXRpb24gPSBudWxsO1xyXG5cclxuXHQkc2NvcGUuRGVzaWduRXhwbG9yZXIgPSB7XHJcblx0XHQndHlwZURpc3BsYXlEaWN0aW9uYXJ5JzogRGVzaWduRXhwbG9yZXIudHlwZURpc3BsYXlEaWN0aW9uYXJ5XHJcblx0fTtcclxuXHJcblx0JHRpbWVvdXQoZnVuY3Rpb24gKCkge1xyXG5cdFx0c3BlY3QgPSBuZXcgU1BFQ1RBQ0xFUygkKCcjc3BlY3RhY2xlcy1jb250YWluZXInKSk7XHJcblx0fSk7XHJcblxyXG5cdC8qXHJcblx04paI4paI4paI4paI4paI4paI4paIICDilojilojilojilojilojiloggIOKWiOKWiOKWiOKWiOKWiOKWiCAg4paI4paI4paI4paI4paI4paIICDilojilojilojilojilojilojiloggICAgIOKWiOKWiOKWiOKWiOKWiOKWiOKWiCDilojilojiloggICAg4paI4paIXHJcblx04paI4paIICAgICAg4paI4paIICAgICAg4paI4paIICAgIOKWiOKWiCDilojiloggICDilojilogg4paI4paIICAgICAgICAgIOKWiOKWiCAgICAgIOKWiOKWiOKWiOKWiCAgIOKWiOKWiFxyXG5cdOKWiOKWiOKWiOKWiOKWiOKWiOKWiCDilojiloggICAgICDilojiloggICAg4paI4paIIOKWiOKWiOKWiOKWiOKWiOKWiCAg4paI4paI4paI4paI4paIICAgICAgIOKWiOKWiOKWiOKWiOKWiCAgIOKWiOKWiCDilojiloggIOKWiOKWiFxyXG5cdCAgICAg4paI4paIIOKWiOKWiCAgICAgIOKWiOKWiCAgICDilojilogg4paI4paIICAgICAg4paI4paIICAgICAgICAgIOKWiOKWiCAgICAgIOKWiOKWiCAg4paI4paIIOKWiOKWiFxyXG5cdOKWiOKWiOKWiOKWiOKWiOKWiOKWiCAg4paI4paI4paI4paI4paI4paIICDilojilojilojilojilojiloggIOKWiOKWiCAgICAgIOKWiOKWiOKWiOKWiOKWiOKWiOKWiCAgICAg4paI4paIICAgICAg4paI4paIICAg4paI4paI4paI4paIXHJcblx0Ki9cclxuXHJcblx0JHNjb3BlLnNlbGVjdEl0ZXJhdGlvbiA9IGZ1bmN0aW9uIChpdGVyYXRpb24pIHtcclxuXHRcdCRzY29wZS5yZXN1bHRNb2RlID0gJ2ltYWdlJztcclxuXHRcdCRzY29wZS5zZWxlY3RlZEl0ZXJhdGlvbiA9IGl0ZXJhdGlvbjtcclxuXHRcdGlmICghaXRlcmF0aW9uKSByZXR1cm47XHJcblx0XHQkc2NvcGUuZGVzaWduRXhwbG9yZXIucG9wdWxhdGVJdGVyYXRpb25UYWJsZSgkKCcjc2VsZWN0ZWQtaXRlcmF0aW9uLWluZm8nKSwgaXRlcmF0aW9uKTtcclxuXHRcdCRzY29wZS5kZXNpZ25FeHBsb3Jlci5ncmFwaHMucGFyY29vcmRzLmNsZWFyKCdoaWdobGlnaHQnKTtcclxuXHRcdCR0aW1lb3V0KGZ1bmN0aW9uICgpIHtcclxuXHRcdFx0JHNjb3BlLmRlc2lnbkV4cGxvcmVyLmdyYXBocy5wYXJjb29yZHMuaGlnaGxpZ2h0KFtpdGVyYXRpb25dKTtcclxuXHRcdH0pO1xyXG5cdH07XHJcblxyXG5cdCRzY29wZS5zZXQyZE1vZGUgPSBmdW5jdGlvbiAoKSB7XHJcblx0XHQkc2NvcGUucmVzdWx0TW9kZSA9ICdpbWFnZSc7XHJcblx0fTtcclxuXHJcblx0JHNjb3BlLnNldDNkTW9kZSA9IGZ1bmN0aW9uICgpIHtcclxuXHRcdGlmICghJHNjb3BlLnNlbGVjdGVkSXRlcmF0aW9uKSByZXR1cm47XHJcblx0XHQkc2NvcGUucmVzdWx0TW9kZSA9ICczZCc7XHJcblx0XHRkMy5qc29uKCRzY29wZS5zZWxlY3RlZEl0ZXJhdGlvbi50aHJlZUQsIGZ1bmN0aW9uIChkYXRhKSB7XHJcblx0XHRcdHNwZWN0LmxvYWROZXdNb2RlbChkYXRhKTtcclxuXHRcdH0pO1xyXG5cdFx0JHRpbWVvdXQoZnVuY3Rpb24gKCkge1xyXG5cdFx0XHQkKCcjc3BlY3RhY2xlcy1jb250YWluZXInKVxyXG5cdFx0XHRcdC50cmlnZ2VyKCdyZXNpemUnKTtcclxuXHRcdH0pO1xyXG5cdH07XHJcblxyXG5cclxuXHJcblx0LypcclxuXHTilojiloggICAgIOKWiOKWiCAg4paI4paI4paI4paI4paIICDilojilojilojilojilojilojilojiloggIOKWiOKWiOKWiOKWiOKWiOKWiCDilojiloggICDilojilohcclxuXHTilojiloggICAgIOKWiOKWiCDilojiloggICDilojiloggICAg4paI4paIICAgIOKWiOKWiCAgICAgIOKWiOKWiCAgIOKWiOKWiFxyXG5cdOKWiOKWiCAg4paIICDilojilogg4paI4paI4paI4paI4paI4paI4paIICAgIOKWiOKWiCAgICDilojiloggICAgICDilojilojilojilojilojilojilohcclxuXHTilojilogg4paI4paI4paIIOKWiOKWiCDilojiloggICDilojiloggICAg4paI4paIICAgIOKWiOKWiCAgICAgIOKWiOKWiCAgIOKWiOKWiFxyXG5cdCDilojilojilogg4paI4paI4paIICDilojiloggICDilojiloggICAg4paI4paIICAgICDilojilojilojilojilojilogg4paI4paIICAg4paI4paIXHJcblx0Ki9cclxuXHJcblx0JHNjb3BlLiR3YXRjaCgnZGVzaWduRXhwbG9yZXInLCBkcmF3RGVzaWduRXhwbG9yZXIpO1xyXG5cclxuXHJcblxyXG5cdC8qXHJcblx0IOKWiOKWiOKWiOKWiOKWiCAg4paI4paI4paIICAgIOKWiOKWiCAg4paI4paI4paI4paI4paI4paIICDilojilojiloggICAg4paI4paIXHJcblx04paI4paIICAg4paI4paIIOKWiOKWiOKWiOKWiCAgIOKWiOKWiCDilojiloggICAg4paI4paIIOKWiOKWiOKWiOKWiCAgIOKWiOKWiFxyXG5cdOKWiOKWiOKWiOKWiOKWiOKWiOKWiCDilojilogg4paI4paIICDilojilogg4paI4paIICAgIOKWiOKWiCDilojilogg4paI4paIICDilojilohcclxuXHTilojiloggICDilojilogg4paI4paIICDilojilogg4paI4paIIOKWiOKWiCAgICDilojilogg4paI4paIICDilojilogg4paI4paIXHJcblx04paI4paIICAg4paI4paIIOKWiOKWiCAgIOKWiOKWiOKWiOKWiCAg4paI4paI4paI4paI4paI4paIICDilojiloggICDilojilojilojilohcclxuXHQqL1xyXG5cclxuXHRmdW5jdGlvbiBkcmF3RGVzaWduRXhwbG9yZXIoKSB7XHJcblx0XHQkdGltZW91dChmdW5jdGlvbiAoKSB7XHJcblx0XHRcdGlmICgkc2NvcGUuZGVzaWduRXhwbG9yZXIpIHtcclxuXHRcdFx0XHQkc2NvcGUuZGVzaWduRXhwbG9yZXIucGFyY29vcmRzX2NyZWF0ZSgnI3BhcmFsbGVsLWNvb3JkcycpO1xyXG5cdFx0XHRcdHNldEZpbHRlcmVkRW50cmllcygpO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHQkc2NvcGUuZGVzaWduRXhwbG9yZXIuYWJzdHJhY3RfcGFyY29vcmRzX3Bvc3RSZW5kZXIgPSBzZXRGaWx0ZXJlZEVudHJpZXM7XHJcblx0XHR9KTtcclxuXHR9XHJcblxyXG5cdGZ1bmN0aW9uIHNldEZpbHRlcmVkRW50cmllcygpIHtcclxuXHRcdCRzY29wZS5maWx0ZXJlZEVudHJpZXMgPSAkc2NvcGUuZGVzaWduRXhwbG9yZXIuZ3JhcGhzLnBhcmNvb3Jkcy5icnVzaGVkKCkgfHwgJHNjb3BlLmRlc2lnbkV4cGxvcmVyLmdldERhdGEoKTtcclxuXHRcdCRzY29wZS5zZWxlY3RJdGVyYXRpb24obnVsbCk7XHJcblx0XHQkdGltZW91dChmdW5jdGlvbiAoKSB7XHJcblx0XHRcdCRzY29wZS4kYXBwbHkoKTtcclxuXHRcdH0pO1xyXG5cdH1cclxuXHJcbn0pO1xyXG4iLCIvKipcclxuICogQG1lbWJlck9mIGFwcFxyXG4gKiBAbmdkb2MgZGlyZWN0aXZlXHJcbiAqIEBuYW1lIGJvdHRvbU5hdlxyXG4gKiBAcGFyYW0ge3NlcnZpY2V9XHJcbiAqIEBkZXNjcmlwdGlvblxyXG4gKiAgIFJlc2l6YWJsZSBib3R0b20gbmF2aWdhdGlvblxyXG4gKi9cclxuYXBwLmRpcmVjdGl2ZSgnYm90dG9tTmF2JywgZnVuY3Rpb24gKCR0aW1lb3V0KSB7XHJcblx0cmV0dXJuIHtcclxuXHRcdHJlc3RyaWN0OiAnRScsXHJcblx0XHR0ZW1wbGF0ZVVybDogJ2pzL3NyYy9tYWluL2RpcmVjdGl2ZXMvYm90dG9tTmF2L2JvdHRvbU5hdi5odG1sJyxcclxuXHRcdGxpbms6IGZ1bmN0aW9uIChzY29wZSkge1xyXG5cclxuXHRcdFx0JHRpbWVvdXQoaW5pdEpxdWVyeSk7XHJcblxyXG5cdFx0XHRmdW5jdGlvbiBpbml0SnF1ZXJ5KCkge1xyXG5cclxuXHRcdFx0XHR2YXIgYm90dG9tYmFyID0gJCgnLmJvdHRvbS1uYXYnKTtcclxuXHJcblx0XHRcdFx0Ly8gYm90dG9tYmFyLnJlc2l6YWJsZSh7XHJcblx0XHRcdFx0Ly8gXHRoYW5kbGVzOiB7XHJcblx0XHRcdFx0Ly8gXHRcdCduJzogJyNoYW5kbGUnXHJcblx0XHRcdFx0Ly8gXHR9XHJcblx0XHRcdFx0Ly8gfSk7XHJcblx0XHRcdFx0Ly9cclxuXHRcdFx0XHQvLyBib3R0b21iYXIub24oJ3Jlc2l6ZScsIHJlc3BvbmRUb1Jlc2l6ZSk7XHJcblxyXG5cdFx0XHRcdCQod2luZG93KVxyXG5cdFx0XHRcdFx0Lm9uKCdyZXNpemUnLCByZXNwb25kVG9SZXNpemUpO1xyXG5cclxuXHRcdFx0XHRyZXNwb25kVG9SZXNpemUoKTtcclxuXHJcblx0XHRcdFx0ZnVuY3Rpb24gcmVzcG9uZFRvUmVzaXplKCkge1xyXG5cclxuXHRcdFx0XHRcdHZhciBwYXJhbGxlbERpdiA9ICQoJyNwYXJhbGxlbC1jb29yZHMnKTtcclxuXHJcblx0XHRcdFx0XHQvLyAkKCcjbWFpbi1jb250ZW50LWZsb3cnKVxyXG5cdFx0XHRcdFx0Ly8gXHQuY3NzKCdwYWRkaW5nLWJvdHRvbScsIGJvdHRvbWJhci5oZWlnaHQoKSsxNTApO1xyXG5cclxuXHRcdFx0XHRcdCQoJyNtYWluLWNvbnRlbnQtZmxvdycpXHJcblx0XHRcdFx0XHRcdC5jc3MoJ21heC1oZWlnaHQnLCAoJCh3aW5kb3cudG9wKVxyXG5cdFx0XHRcdFx0XHRcdC5oZWlnaHQoKSAtIGJvdHRvbWJhci5vdXRlckhlaWdodCgpIC0gMTMwKSArICdweCcpO1xyXG5cclxuXHJcblx0XHRcdFx0XHQvLyBwYXJhbGxlbERpdi5jc3MoJ2hlaWdodCcsIGJvdHRvbWJhci5oZWlnaHQoKSAtIDMwKTtcclxuXHRcdFx0XHRcdC8vIHBhcmFsbGVsRGl2LmNzcygnd2lkdGgnLCBib3R0b21iYXIud2lkdGgoKSAtIDMwKTtcclxuXHRcdFx0XHRcdC8vIGlmIChzY29wZS5kZXNpZ25FeHBsb3Jlcikge1xyXG5cdFx0XHRcdFx0Ly8gXHRzY29wZS5kZXNpZ25FeHBsb3Jlci5yZW5kZXJQYXJhbGxlbENvb3JkaW5hdGVzKCk7XHJcblx0XHRcdFx0XHQvLyB9XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9XHJcblx0XHR9XHJcblx0fTtcclxufSk7XHJcbiIsIi8qKlxyXG4gKiBAbWVtYmVyT2YgYXBwXHJcbiAqIEBuZ2RvYyBkaXJlY3RpdmVcclxuICogQG5hbWUgbmF2YmFyXHJcbiAqIEBwYXJhbSB7c2VydmljZX1cclxuICogQGRlc2NyaXB0aW9uXHJcbiAqICAgTmF2YmFyLiBEb2Vzbid0IHJlYWxseSBkbyBhbnl0aGluZyBpbnRlcmVzdGluZyB5ZXQuXHJcbiAqL1xyXG5hcHAuZGlyZWN0aXZlKCduYXZiYXInLCBmdW5jdGlvbigpIHtcclxuXHRyZXR1cm4ge1xyXG5cdFx0cmVzdHJpY3Q6ICdFJyxcclxuXHRcdHRlbXBsYXRlVXJsOiAnanMvc3JjL21haW4vZGlyZWN0aXZlcy9uYXZiYXIvbmF2YmFyLmh0bWwnLFxyXG5cdFx0bGluazogZnVuY3Rpb24oc2NvcGUpIHtcclxuXHRcdH1cclxuXHR9O1xyXG59KTtcclxuIiwiLyoqXHJcbiAqIEBtZW1iZXJPZiBhcHBcclxuICogQG5nZG9jIGRpcmVjdGl2ZVxyXG4gKiBAbmFtZSByZXN1bHRzVGh1bWJuYWlsc1xyXG4gKiBAcGFyYW0ge3NlcnZpY2V9XHJcbiAqIEBkZXNjcmlwdGlvblxyXG4gKiAgIFRodW1ibmFpbHMgb2YgcmVzdWx0c1xyXG4gKi9cclxuYXBwLmRpcmVjdGl2ZSgncmVzdWx0c1RodW1ibmFpbHMnLCBmdW5jdGlvbiAoJHRpbWVvdXQpIHtcclxuXHRyZXR1cm4ge1xyXG5cdFx0cmVzdHJpY3Q6ICdFJyxcclxuXHRcdHRlbXBsYXRlVXJsOiAnanMvc3JjL21haW4vZGlyZWN0aXZlcy9yZXN1bHRzVGh1bWJuYWlscy9yZXN1bHRzVGh1bWJuYWlscy5odG1sJyxcclxuXHRcdGxpbms6IGZ1bmN0aW9uIChzY29wZSkge1xyXG5cdFx0XHRzY29wZS5nZXRPcmRlckJ5ID0gZnVuY3Rpb24gKCkge1xyXG5cdFx0XHRcdHJldHVybiAoc2NvcGUuZGVzaWduRXhwbG9yZXIgJiYgc2NvcGUuZGVzaWduRXhwbG9yZXIuc2VsZWN0ZWRQYXJhbSkgPyBzY29wZS5kZXNpZ25FeHBsb3Jlci5zZWxlY3RlZFBhcmFtW0Rlc2lnbkV4cGxvcmVyLmRhdGFLZXldIDogJyc7XHJcblx0XHRcdH07XHJcblx0XHR9XHJcblx0fTtcclxufSk7XHJcbiIsIi8qKlxyXG4gKiBAbWVtYmVyT2YgYXBwXHJcbiAqIEBuZ2RvYyBkaXJlY3RpdmVcclxuICogQG5hbWUgc2VsZWN0ZWRJdGVyYXRpb25cclxuICogQHBhcmFtIHtzZXJ2aWNlfVxyXG4gKiBAZGVzY3JpcHRpb25cclxuICogICBUaGUgY3VycmVudCBzZWxlY3RlZCBpdGVyYXRpb24gZm9yIGluc3BlY3Rpb25cclxuICovXHJcbmFwcC5kaXJlY3RpdmUoJ3NlbGVjdGVkSXRlcmF0aW9uJywgZnVuY3Rpb24gKCR0aW1lb3V0KSB7XHJcblx0cmV0dXJuIHtcclxuXHRcdHJlc3RyaWN0OiAnRScsXHJcblx0XHR0ZW1wbGF0ZVVybDogJ2pzL3NyYy9tYWluL2RpcmVjdGl2ZXMvc2VsZWN0ZWRJdGVyYXRpb24vc2VsZWN0ZWRJdGVyYXRpb24uaHRtbCcsXHJcblx0XHRsaW5rOiBmdW5jdGlvbiAoc2NvcGUpIHtcclxuXHRcdH1cclxuXHR9O1xyXG59KTtcclxuIl19
