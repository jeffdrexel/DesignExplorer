/**
 * Angular application. See Angular-specific documentation for anything inside
 * of app.something.
 * @type {object}
 * @global
 */
var app = angular.module('designexplorer.demo', ['ui.router']);

app.config(function($urlRouterProvider) {
  $urlRouterProvider.otherwise('/');
});

app.filter('typeof', function() {
  return function(obj) {
    return typeof obj;
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
		url: '/',
		templateUrl: 'js/src/main/states/root/root.html',
		controller: 'RootStateCtrl'
	});
});

app.controller('RootStateCtrl', function ($rootScope, $scope, $timeout) {

	var designExplorer;

	var spect;

	var isFullscreen = false;

	// d3.csv("design_explorer_data/kpf/20160811_DataTable_Formatted.csv")
	d3.csv("design_explorer_data/kpf/DataTable_0_413.csv")
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
				$scope.designExplorer.abstract_parcoords_postRender = setFilteredEntries;
			}
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

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImhlYWRlci5qcyIsInN0YXRlcy9kZWZhdWx0LmpzIiwiZmlsdGVycy90eXBlT2YuanMiLCJkaXJlY3RpdmVzL2FuaW1hdGVkUmVzdWx0cy9hbmltYXRlZFJlc3VsdHMuanMiLCJkaXJlY3RpdmVzL25hdmJhci9uYXZiYXIuanMiLCJkaXJlY3RpdmVzL3Jlc3VsdHNUaHVtYm5haWxzL3Jlc3VsdHNUaHVtYm5haWxzLmpzIiwiZGlyZWN0aXZlcy9ib3R0b21OYXYvYm90dG9tTmF2LmpzIiwiZGlyZWN0aXZlcy9zZWxlY3RlZEl0ZXJhdGlvbi9zZWxlY3RlZEl0ZXJhdGlvbi5qcyIsInN0YXRlcy9yb290L3Jvb3QuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ1BBO0FBQ0E7QUFDQTtBQUNBO0FDSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDbklBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNoQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ25CQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDdkRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNoQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6Im1haW4uanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcclxuICogQW5ndWxhciBhcHBsaWNhdGlvbi4gU2VlIEFuZ3VsYXItc3BlY2lmaWMgZG9jdW1lbnRhdGlvbiBmb3IgYW55dGhpbmcgaW5zaWRlXHJcbiAqIG9mIGFwcC5zb21ldGhpbmcuXHJcbiAqIEB0eXBlIHtvYmplY3R9XHJcbiAqIEBnbG9iYWxcclxuICovXHJcbnZhciBhcHAgPSBhbmd1bGFyLm1vZHVsZSgnZGVzaWduZXhwbG9yZXIuZGVtbycsIFsndWkucm91dGVyJ10pO1xyXG4iLCJhcHAuY29uZmlnKGZ1bmN0aW9uKCR1cmxSb3V0ZXJQcm92aWRlcikge1xyXG4gICR1cmxSb3V0ZXJQcm92aWRlci5vdGhlcndpc2UoJy8nKTtcclxufSk7XHJcbiIsImFwcC5maWx0ZXIoJ3R5cGVvZicsIGZ1bmN0aW9uKCkge1xyXG4gIHJldHVybiBmdW5jdGlvbihvYmopIHtcclxuICAgIHJldHVybiB0eXBlb2Ygb2JqO1xyXG4gIH07XHJcbn0pO1xyXG4iLCIvKipcclxuICogQG1lbWJlck9mIGFwcFxyXG4gKiBAbmdkb2MgZGlyZWN0aXZlXHJcbiAqIEBuYW1lIGFuaW1hdGVkUmVzdWx0c1xyXG4gKiBAcGFyYW0ge3NlcnZpY2V9XHJcbiAqIEBkZXNjcmlwdGlvblxyXG4gKiAgIEFuaW1hdGVkIHJlc3VsdHNcclxuICovXHJcbmFwcC5kaXJlY3RpdmUoJ2FuaW1hdGVkUmVzdWx0cycsIGZ1bmN0aW9uICgkdGltZW91dCkge1xyXG5cdHJldHVybiB7XHJcblx0XHRyZXN0cmljdDogJ0UnLFxyXG5cdFx0dGVtcGxhdGVVcmw6ICdqcy9zcmMvbWFpbi9kaXJlY3RpdmVzL2FuaW1hdGVkUmVzdWx0cy9hbmltYXRlZFJlc3VsdHMuaHRtbCcsXHJcblx0XHRsaW5rOiBmdW5jdGlvbiAoc2NvcGUpIHtcclxuXHJcblx0XHRcdHNjb3BlLmN1ckZyYW1lID0gMDtcclxuXHRcdFx0c2NvcGUuZnJhbWVzID0gMDtcclxuXHRcdFx0c2NvcGUuY3VyRnJhbWVJbmZvID0gbnVsbDtcclxuXHRcdFx0c2NvcGUuJHdhdGNoKCdmaWx0ZXJlZEVudHJpZXMnLCBjaGVja1doZXRoZXJUb0FuaW1hdGUpO1xyXG5cdFx0XHRzY29wZS4kd2F0Y2goJ3ZpZXdNb2RlJywgY2hlY2tXaGV0aGVyVG9BbmltYXRlKTtcclxuXHRcdFx0c2NvcGUuJHdhdGNoKCdzZWxlY3RlZEl0ZXJhdGlvbicsIGNoZWNrV2hldGhlclRvQW5pbWF0ZSk7XHJcblxyXG5cdFx0XHR2YXIgZGVib3VuY2VOZXh0O1xyXG5cdFx0XHR2YXIgYW5pbWF0ZVNwZWVkID0gMzAwO1xyXG5cdFx0XHR2YXIgaXNBbmltYXRpbmcgPSBmYWxzZTtcclxuXHJcblx0XHRcdC8qXHJcblx0XHRcdCDilojilojilojilojiloggIOKWiOKWiOKWiCAgICDilojiloggIOKWiOKWiOKWiOKWiOKWiOKWiCAg4paI4paI4paIICAgIOKWiOKWiFxyXG5cdFx0XHTilojiloggICDilojilogg4paI4paI4paI4paIICAg4paI4paIIOKWiOKWiCAgICDilojilogg4paI4paI4paI4paIICAg4paI4paIXHJcblx0XHRcdOKWiOKWiOKWiOKWiOKWiOKWiOKWiCDilojilogg4paI4paIICDilojilogg4paI4paIICAgIOKWiOKWiCDilojilogg4paI4paIICDilojilohcclxuXHRcdFx04paI4paIICAg4paI4paIIOKWiOKWiCAg4paI4paIIOKWiOKWiCDilojiloggICAg4paI4paIIOKWiOKWiCAg4paI4paIIOKWiOKWiFxyXG5cdFx0XHTilojiloggICDilojilogg4paI4paIICAg4paI4paI4paI4paIICDilojilojilojilojilojiloggIOKWiOKWiCAgIOKWiOKWiOKWiOKWiFxyXG5cdFx0XHQqL1xyXG5cclxuXHRcdFx0LyoqXHJcblx0XHRcdCAqIENoZWNrIHdoZXRoZXIgd2Ugc2hvdWxkIG1vdmUgZm9yd2FyZCB3aXRoIGFuaW1hdGluZyBvciB0ZXJtaW5hdGUgYSBwcmV2aW91cyBhbmltYXRpb25cclxuXHRcdFx0ICovXHJcblx0XHRcdGZ1bmN0aW9uIGNoZWNrV2hldGhlclRvQW5pbWF0ZSgpIHtcclxuXHRcdFx0XHRpZiAoIWlzQW5pbWF0ZU1vZGUoKSB8fCBzY29wZS5zZWxlY3RlZEl0ZXJhdGlvbikge1xyXG5cdFx0XHRcdFx0Y2xlYW5QcmV2aW91c0FuaW1hdGlvbigpO1xyXG5cdFx0XHRcdH0gZWxzZSB7XHJcblx0XHRcdFx0XHRzdGFydE5ld0FuaW1hdGlvbigpO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0LyoqXHJcblx0XHRcdCAqIFN0YXJ0cyBhIG5ldyBhbmltYXRpb25cclxuXHRcdFx0ICovXHJcblx0XHRcdGZ1bmN0aW9uIHN0YXJ0TmV3QW5pbWF0aW9uKCkge1xyXG5cdFx0XHRcdGlmICghc2NvcGUuZmlsdGVyZWRFbnRyaWVzIHx8ICFpc0FuaW1hdGVNb2RlKCkpIHJldHVybjtcclxuXHRcdFx0XHRpZiAoIXNjb3BlLmZpbHRlcmVkRW50cmllcy5sZW5ndGgpIHtcclxuXHRcdFx0XHRcdCQoJyNhbmltYXRlZC1yZXN1bHRzJylcclxuXHRcdFx0XHRcdFx0LmF0dHIoJ3NyYycsICcnKTtcclxuXHRcdFx0XHRcdCQoJyNjdXItZnJhbWUtaW5mbycpXHJcblx0XHRcdFx0XHRcdC5odG1sKCcnKTtcclxuXHRcdFx0XHR9XHJcblxyXG5cdFx0XHRcdHNjb3BlLmN1ckZyYW1lID0gMDtcclxuXHRcdFx0XHRzY29wZS5mcmFtZXMgPSBzY29wZS5maWx0ZXJlZEVudHJpZXMubGVuZ3RoO1xyXG5cclxuXHRcdFx0XHR2YXIgbmV3QW5pbWF0ZVNwZWVkID0gTWF0aC5tYXgoMTAwMDAwIC8gc2NvcGUuZnJhbWVzLCAzMDApOyAvLyBtaW4gZGVib3VuY2UgdGltZVxyXG5cdFx0XHRcdG5ld0FuaW1hdGVTcGVlZCA9IE1hdGgubWluKG5ld0FuaW1hdGVTcGVlZCwgMTUwMCk7IC8vIG1heCBkZWJvdW5jZSB0aW1lXHJcblx0XHRcdFx0YW5pbWF0ZVNwZWVkID0gbmV3QW5pbWF0ZVNwZWVkO1xyXG5cclxuXHRcdFx0XHRpZiAoIWlzQW5pbWF0aW5nKSBhbmltYXRlKCk7XHJcblx0XHRcdFx0aXNBbmltYXRpbmcgPSB0cnVlO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHQvKipcclxuXHRcdFx0ICogQW5pbWF0ZSBsb29wXHJcblx0XHRcdCAqL1xyXG5cdFx0XHRmdW5jdGlvbiBhbmltYXRlKCkge1xyXG5cdFx0XHRcdGlmICghaXNBbmltYXRlTW9kZSgpKSB7XHJcblx0XHRcdFx0XHRpc0FuaW1hdGluZyA9IGZhbHNlO1xyXG5cdFx0XHRcdFx0cmV0dXJuO1xyXG5cdFx0XHRcdH0gZWxzZSB7XHJcblx0XHRcdFx0XHRzaG93TmV4dEZyYW1lKCk7XHJcblx0XHRcdFx0XHRzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcclxuXHRcdFx0XHRcdFx0YW5pbWF0ZSgpO1xyXG5cdFx0XHRcdFx0fSwgYW5pbWF0ZVNwZWVkKTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdC8qKlxyXG5cdFx0XHQgKiBDb2RlIHRvIG1vdmUgZm9yd2FyZCBhIGZyYW1lLiBDYWxsZWQgZnJvbSB0aGUgYW5pbWF0ZSBsb29wLlxyXG5cdFx0XHQgKi9cclxuXHRcdFx0ZnVuY3Rpb24gc2hvd05leHRGcmFtZSgpIHtcclxuXHRcdFx0XHRpZiAoIWlzQW5pbWF0ZU1vZGUoKSkgcmV0dXJuO1xyXG5cdFx0XHRcdGNsZWFuUHJldmlvdXNBbmltYXRpb24oKTtcclxuXHJcblx0XHRcdFx0aWYgKCFzY29wZS5maWx0ZXJlZEVudHJpZXMgfHwgIXNjb3BlLmZpbHRlcmVkRW50cmllcy5sZW5ndGgpIHJldHVybjtcclxuXHRcdFx0XHRzY29wZS5jdXJGcmFtZUluZm8gPSBzY29wZS5maWx0ZXJlZEVudHJpZXNbc2NvcGUuY3VyRnJhbWVdO1xyXG5cclxuXHRcdFx0XHQkKCcjYW5pbWF0ZWQtcmVzdWx0cycpXHJcblx0XHRcdFx0XHQuYXR0cignc3JjJywgc2NvcGUuY3VyRnJhbWVJbmZvLmltZyk7XHJcblxyXG5cdFx0XHRcdCQoJyNhbmltYXRlZC1yZXN1bHRzJylcclxuXHRcdFx0XHRcdC5vbignY2xpY2snLCBmdW5jdGlvbiAoKSB7XHJcblx0XHRcdFx0XHRcdGNsZWFuUHJldmlvdXNBbmltYXRpb24oKTtcclxuXHRcdFx0XHRcdFx0c2NvcGUudmlld01vZGU9J3RodW1ibmFpbHMnO1xyXG5cdFx0XHRcdFx0XHQkdGltZW91dChmdW5jdGlvbigpe1xyXG5cdFx0XHRcdFx0XHRcdHNjb3BlLnNlbGVjdEl0ZXJhdGlvbihzY29wZS5jdXJGcmFtZUluZm8pO1xyXG5cdFx0XHRcdFx0XHR9KTtcclxuXHRcdFx0XHRcdH0pO1xyXG5cclxuXHRcdFx0XHR2YXIgaW5mb0JveCA9ICQoJyNjdXItZnJhbWUtaW5mbycpO1xyXG5cclxuXHRcdFx0XHRzY29wZS5kZXNpZ25FeHBsb3Jlci5wb3B1bGF0ZUl0ZXJhdGlvblRhYmxlKGluZm9Cb3gsIHNjb3BlLmN1ckZyYW1lSW5mbyk7XHJcblxyXG5cdFx0XHRcdHNjb3BlLmRlc2lnbkV4cGxvcmVyLmdyYXBocy5wYXJjb29yZHMuaGlnaGxpZ2h0KFtzY29wZS5jdXJGcmFtZUluZm9dKTtcclxuXHJcblx0XHRcdFx0c2NvcGUuY3VyRnJhbWUgKz0gMTtcclxuXHRcdFx0XHRpZiAoc2NvcGUuY3VyRnJhbWUgPj0gc2NvcGUuZnJhbWVzKSBzY29wZS5jdXJGcmFtZSA9IDA7XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdC8qKlxyXG5cdFx0XHQgKiBDbGVhbiBsZWZ0b3ZlciBzdHVmZiBmcm9tIGEgcHJldmlvdXMgYW5pbWF0aW9uXHJcblx0XHRcdCAqL1xyXG5cdFx0XHRmdW5jdGlvbiBjbGVhblByZXZpb3VzQW5pbWF0aW9uKCkge1xyXG5cdFx0XHRcdGlmIChzY29wZS5kZXNpZ25FeHBsb3JlciAmJiBzY29wZS5kZXNpZ25FeHBsb3Jlci5ncmFwaHMucGFyY29vcmRzKSBzY29wZS5kZXNpZ25FeHBsb3Jlci5ncmFwaHMucGFyY29vcmRzLnVuaGlnaGxpZ2h0KCk7XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdC8qKlxyXG5cdFx0XHQgKiBXaGV0aGVyIHdlJ3JlIGN1cnJlbnRseSBpbiBhbmltYXRpb24gbW9kZVxyXG5cdFx0XHQgKiBAcmV0dXJuIHtCb29sZWFufVxyXG5cdFx0XHQgKi9cclxuXHRcdFx0ZnVuY3Rpb24gaXNBbmltYXRlTW9kZSgpIHtcclxuXHRcdFx0XHRyZXR1cm4gc2NvcGUudmlld01vZGUgPT09ICdhbmltYXRpb24nO1xyXG5cdFx0XHR9XHJcblx0XHR9XHJcblx0fTtcclxufSk7XHJcbiIsIi8qKlxyXG4gKiBAbWVtYmVyT2YgYXBwXHJcbiAqIEBuZ2RvYyBkaXJlY3RpdmVcclxuICogQG5hbWUgbmF2YmFyXHJcbiAqIEBwYXJhbSB7c2VydmljZX1cclxuICogQGRlc2NyaXB0aW9uXHJcbiAqICAgTmF2YmFyLiBEb2Vzbid0IHJlYWxseSBkbyBhbnl0aGluZyBpbnRlcmVzdGluZyB5ZXQuXHJcbiAqL1xyXG5hcHAuZGlyZWN0aXZlKCduYXZiYXInLCBmdW5jdGlvbigpIHtcclxuXHRyZXR1cm4ge1xyXG5cdFx0cmVzdHJpY3Q6ICdFJyxcclxuXHRcdHRlbXBsYXRlVXJsOiAnanMvc3JjL21haW4vZGlyZWN0aXZlcy9uYXZiYXIvbmF2YmFyLmh0bWwnLFxyXG5cdFx0bGluazogZnVuY3Rpb24oc2NvcGUpIHtcclxuXHRcdH1cclxuXHR9O1xyXG59KTtcclxuIiwiLyoqXHJcbiAqIEBtZW1iZXJPZiBhcHBcclxuICogQG5nZG9jIGRpcmVjdGl2ZVxyXG4gKiBAbmFtZSByZXN1bHRzVGh1bWJuYWlsc1xyXG4gKiBAcGFyYW0ge3NlcnZpY2V9XHJcbiAqIEBkZXNjcmlwdGlvblxyXG4gKiAgIFRodW1ibmFpbHMgb2YgcmVzdWx0c1xyXG4gKi9cclxuYXBwLmRpcmVjdGl2ZSgncmVzdWx0c1RodW1ibmFpbHMnLCBmdW5jdGlvbiAoJHRpbWVvdXQpIHtcclxuXHRyZXR1cm4ge1xyXG5cdFx0cmVzdHJpY3Q6ICdFJyxcclxuXHRcdHRlbXBsYXRlVXJsOiAnanMvc3JjL21haW4vZGlyZWN0aXZlcy9yZXN1bHRzVGh1bWJuYWlscy9yZXN1bHRzVGh1bWJuYWlscy5odG1sJyxcclxuXHRcdGxpbms6IGZ1bmN0aW9uIChzY29wZSkge1xyXG5cdFx0XHRzY29wZS5nZXRPcmRlckJ5ID0gZnVuY3Rpb24gKCkge1xyXG5cdFx0XHRcdHJldHVybiAoc2NvcGUuZGVzaWduRXhwbG9yZXIgJiYgc2NvcGUuZGVzaWduRXhwbG9yZXIuc2VsZWN0ZWRQYXJhbSkgPyBzY29wZS5kZXNpZ25FeHBsb3Jlci5zZWxlY3RlZFBhcmFtW0Rlc2lnbkV4cGxvcmVyLmRhdGFLZXldIDogJyc7XHJcblx0XHRcdH07XHJcblx0XHR9XHJcblx0fTtcclxufSk7XHJcbiIsIi8qKlxyXG4gKiBAbWVtYmVyT2YgYXBwXHJcbiAqIEBuZ2RvYyBkaXJlY3RpdmVcclxuICogQG5hbWUgYm90dG9tTmF2XHJcbiAqIEBwYXJhbSB7c2VydmljZX1cclxuICogQGRlc2NyaXB0aW9uXHJcbiAqICAgUmVzaXphYmxlIGJvdHRvbSBuYXZpZ2F0aW9uXHJcbiAqL1xyXG5hcHAuZGlyZWN0aXZlKCdib3R0b21OYXYnLCBmdW5jdGlvbiAoJHRpbWVvdXQpIHtcclxuXHRyZXR1cm4ge1xyXG5cdFx0cmVzdHJpY3Q6ICdFJyxcclxuXHRcdHRlbXBsYXRlVXJsOiAnanMvc3JjL21haW4vZGlyZWN0aXZlcy9ib3R0b21OYXYvYm90dG9tTmF2Lmh0bWwnLFxyXG5cdFx0bGluazogZnVuY3Rpb24gKHNjb3BlKSB7XHJcblxyXG5cdFx0XHQkdGltZW91dChpbml0SnF1ZXJ5KTtcclxuXHJcblx0XHRcdGZ1bmN0aW9uIGluaXRKcXVlcnkoKSB7XHJcblxyXG5cdFx0XHRcdHZhciBib3R0b21iYXIgPSAkKCcuYm90dG9tLW5hdicpO1xyXG5cclxuXHRcdFx0XHQvLyBib3R0b21iYXIucmVzaXphYmxlKHtcclxuXHRcdFx0XHQvLyBcdGhhbmRsZXM6IHtcclxuXHRcdFx0XHQvLyBcdFx0J24nOiAnI2hhbmRsZSdcclxuXHRcdFx0XHQvLyBcdH1cclxuXHRcdFx0XHQvLyB9KTtcclxuXHRcdFx0XHQvL1xyXG5cdFx0XHRcdC8vIGJvdHRvbWJhci5vbigncmVzaXplJywgcmVzcG9uZFRvUmVzaXplKTtcclxuXHJcblx0XHRcdFx0JCh3aW5kb3cpXHJcblx0XHRcdFx0XHQub24oJ3Jlc2l6ZScsIHJlc3BvbmRUb1Jlc2l6ZSk7XHJcblxyXG5cdFx0XHRcdHJlc3BvbmRUb1Jlc2l6ZSgpO1xyXG5cclxuXHRcdFx0XHRmdW5jdGlvbiByZXNwb25kVG9SZXNpemUoKSB7XHJcblxyXG5cdFx0XHRcdFx0dmFyIHBhcmFsbGVsRGl2ID0gJCgnI3BhcmFsbGVsLWNvb3JkcycpO1xyXG5cclxuXHRcdFx0XHRcdC8vICQoJyNtYWluLWNvbnRlbnQtZmxvdycpXHJcblx0XHRcdFx0XHQvLyBcdC5jc3MoJ3BhZGRpbmctYm90dG9tJywgYm90dG9tYmFyLmhlaWdodCgpKzE1MCk7XHJcblxyXG5cdFx0XHRcdFx0JCgnI21haW4tY29udGVudC1mbG93JylcclxuXHRcdFx0XHRcdFx0LmNzcygnbWF4LWhlaWdodCcsICgkKHdpbmRvdy50b3ApXHJcblx0XHRcdFx0XHRcdFx0LmhlaWdodCgpIC0gYm90dG9tYmFyLm91dGVySGVpZ2h0KCkgLSAxMzApICsgJ3B4Jyk7XHJcblxyXG5cclxuXHRcdFx0XHRcdC8vIHBhcmFsbGVsRGl2LmNzcygnaGVpZ2h0JywgYm90dG9tYmFyLmhlaWdodCgpIC0gMzApO1xyXG5cdFx0XHRcdFx0Ly8gcGFyYWxsZWxEaXYuY3NzKCd3aWR0aCcsIGJvdHRvbWJhci53aWR0aCgpIC0gMzApO1xyXG5cdFx0XHRcdFx0Ly8gaWYgKHNjb3BlLmRlc2lnbkV4cGxvcmVyKSB7XHJcblx0XHRcdFx0XHQvLyBcdHNjb3BlLmRlc2lnbkV4cGxvcmVyLnJlbmRlclBhcmFsbGVsQ29vcmRpbmF0ZXMoKTtcclxuXHRcdFx0XHRcdC8vIH1cclxuXHRcdFx0XHR9XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHR9O1xyXG59KTtcclxuIiwiLyoqXHJcbiAqIEBtZW1iZXJPZiBhcHBcclxuICogQG5nZG9jIGRpcmVjdGl2ZVxyXG4gKiBAbmFtZSBzZWxlY3RlZEl0ZXJhdGlvblxyXG4gKiBAcGFyYW0ge3NlcnZpY2V9XHJcbiAqIEBkZXNjcmlwdGlvblxyXG4gKiAgIFRoZSBjdXJyZW50IHNlbGVjdGVkIGl0ZXJhdGlvbiBmb3IgaW5zcGVjdGlvblxyXG4gKi9cclxuYXBwLmRpcmVjdGl2ZSgnc2VsZWN0ZWRJdGVyYXRpb24nLCBmdW5jdGlvbiAoJHRpbWVvdXQpIHtcclxuXHRyZXR1cm4ge1xyXG5cdFx0cmVzdHJpY3Q6ICdFJyxcclxuXHRcdHRlbXBsYXRlVXJsOiAnanMvc3JjL21haW4vZGlyZWN0aXZlcy9zZWxlY3RlZEl0ZXJhdGlvbi9zZWxlY3RlZEl0ZXJhdGlvbi5odG1sJyxcclxuXHRcdGxpbms6IGZ1bmN0aW9uIChzY29wZSkge1xyXG5cdFx0fVxyXG5cdH07XHJcbn0pO1xyXG4iLCIvKipcclxuICogQmFzZSBzdGF0ZSBmb3IgYWxsIG5lc3RlZCBmdXR1cmUgc3RhdGVzIHdlIG1heSBoYXZlXHJcbiAqL1xyXG5hcHAuY29uZmlnKGZ1bmN0aW9uICgkc3RhdGVQcm92aWRlcikge1xyXG5cdCRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdyb290Jywge1xyXG5cdFx0bmFtZTogJ3Jvb3QnLFxyXG5cdFx0Ly8gYWJzdHJhY3Q6IHRydWUsXHJcblx0XHR1cmw6ICcvJyxcclxuXHRcdHRlbXBsYXRlVXJsOiAnanMvc3JjL21haW4vc3RhdGVzL3Jvb3Qvcm9vdC5odG1sJyxcclxuXHRcdGNvbnRyb2xsZXI6ICdSb290U3RhdGVDdHJsJ1xyXG5cdH0pO1xyXG59KTtcclxuXHJcbmFwcC5jb250cm9sbGVyKCdSb290U3RhdGVDdHJsJywgZnVuY3Rpb24gKCRyb290U2NvcGUsICRzY29wZSwgJHRpbWVvdXQpIHtcclxuXHJcblx0dmFyIGRlc2lnbkV4cGxvcmVyO1xyXG5cclxuXHR2YXIgc3BlY3Q7XHJcblxyXG5cdHZhciBpc0Z1bGxzY3JlZW4gPSBmYWxzZTtcclxuXHJcblx0Ly8gZDMuY3N2KFwiZGVzaWduX2V4cGxvcmVyX2RhdGEva3BmLzIwMTYwODExX0RhdGFUYWJsZV9Gb3JtYXR0ZWQuY3N2XCIpXHJcblx0ZDMuY3N2KFwiZGVzaWduX2V4cGxvcmVyX2RhdGEva3BmL0RhdGFUYWJsZV8wXzQxMy5jc3ZcIilcclxuXHRcdC5nZXQoZnVuY3Rpb24gKGVycm9yLCByb3dzKSB7XHJcblx0XHRcdCRzY29wZS5kZXNpZ25FeHBsb3JlciA9IG5ldyBEZXNpZ25FeHBsb3Jlcihyb3dzKTtcclxuXHRcdH0pO1xyXG5cclxuXHQkc2NvcGUudmlld01vZGUgPSAndGh1bWJuYWlscyc7XHJcblxyXG5cdCRzY29wZS5zZWxlY3RlZEl0ZXJhdGlvbiA9IG51bGw7XHJcblxyXG5cdCRzY29wZS5EZXNpZ25FeHBsb3JlciA9IHtcclxuXHRcdCd0eXBlRGlzcGxheURpY3Rpb25hcnknOiBEZXNpZ25FeHBsb3Jlci50eXBlRGlzcGxheURpY3Rpb25hcnlcclxuXHR9O1xyXG5cclxuXHQkdGltZW91dChmdW5jdGlvbiAoKSB7XHJcblx0XHRzcGVjdCA9IG5ldyBTUEVDVEFDTEVTKCQoJyNzcGVjdGFjbGVzLWNvbnRhaW5lcicpKTtcclxuXHR9KTtcclxuXHJcblx0LypcclxuXHTilojilojilojilojilojilojiloggIOKWiOKWiOKWiOKWiOKWiOKWiCAg4paI4paI4paI4paI4paI4paIICDilojilojilojilojilojiloggIOKWiOKWiOKWiOKWiOKWiOKWiOKWiCAgICAg4paI4paI4paI4paI4paI4paI4paIIOKWiOKWiOKWiCAgICDilojilohcclxuXHTilojiloggICAgICDilojiloggICAgICDilojiloggICAg4paI4paIIOKWiOKWiCAgIOKWiOKWiCDilojiloggICAgICAgICAg4paI4paIICAgICAg4paI4paI4paI4paIICAg4paI4paIXHJcblx04paI4paI4paI4paI4paI4paI4paIIOKWiOKWiCAgICAgIOKWiOKWiCAgICDilojilogg4paI4paI4paI4paI4paI4paIICDilojilojilojilojiloggICAgICAg4paI4paI4paI4paI4paIICAg4paI4paIIOKWiOKWiCAg4paI4paIXHJcblx0ICAgICDilojilogg4paI4paIICAgICAg4paI4paIICAgIOKWiOKWiCDilojiloggICAgICDilojiloggICAgICAgICAg4paI4paIICAgICAg4paI4paIICDilojilogg4paI4paIXHJcblx04paI4paI4paI4paI4paI4paI4paIICDilojilojilojilojilojiloggIOKWiOKWiOKWiOKWiOKWiOKWiCAg4paI4paIICAgICAg4paI4paI4paI4paI4paI4paI4paIICAgICDilojiloggICAgICDilojiloggICDilojilojilojilohcclxuXHQqL1xyXG5cclxuXHQkc2NvcGUuc2VsZWN0SXRlcmF0aW9uID0gZnVuY3Rpb24gKGl0ZXJhdGlvbikge1xyXG5cdFx0JHNjb3BlLnJlc3VsdE1vZGUgPSAnaW1hZ2UnO1xyXG5cdFx0JHNjb3BlLnNlbGVjdGVkSXRlcmF0aW9uID0gaXRlcmF0aW9uO1xyXG5cdFx0aWYgKCFpdGVyYXRpb24pIHJldHVybjtcclxuXHRcdCRzY29wZS5kZXNpZ25FeHBsb3Jlci5wb3B1bGF0ZUl0ZXJhdGlvblRhYmxlKCQoJyNzZWxlY3RlZC1pdGVyYXRpb24taW5mbycpLCBpdGVyYXRpb24pO1xyXG5cdFx0JHNjb3BlLmRlc2lnbkV4cGxvcmVyLmdyYXBocy5wYXJjb29yZHMuY2xlYXIoJ2hpZ2hsaWdodCcpO1xyXG5cdFx0JHRpbWVvdXQoZnVuY3Rpb24gKCkge1xyXG5cdFx0XHQkc2NvcGUuZGVzaWduRXhwbG9yZXIuZ3JhcGhzLnBhcmNvb3Jkcy5oaWdobGlnaHQoW2l0ZXJhdGlvbl0pO1xyXG5cdFx0fSk7XHJcblx0fTtcclxuXHJcblx0JHNjb3BlLnNldDJkTW9kZSA9IGZ1bmN0aW9uICgpIHtcclxuXHRcdCRzY29wZS5yZXN1bHRNb2RlID0gJ2ltYWdlJztcclxuXHR9O1xyXG5cclxuXHQkc2NvcGUuc2V0M2RNb2RlID0gZnVuY3Rpb24gKCkge1xyXG5cdFx0aWYgKCEkc2NvcGUuc2VsZWN0ZWRJdGVyYXRpb24pIHJldHVybjtcclxuXHRcdCRzY29wZS5yZXN1bHRNb2RlID0gJzNkJztcclxuXHRcdGQzLmpzb24oJHNjb3BlLnNlbGVjdGVkSXRlcmF0aW9uLnRocmVlRCwgZnVuY3Rpb24gKGRhdGEpIHtcclxuXHRcdFx0c3BlY3QubG9hZE5ld01vZGVsKGRhdGEpO1xyXG5cdFx0XHRzcGVjdC56b29tRXh0ZW50cygpO1xyXG5cdFx0XHRzcGVjdC5saWdodGluZ1JpZy5zZXRBbWJpZW50TGlnaHRDb2xvcignIzg4OCcpO1xyXG5cdFx0XHRzcGVjdC5saWdodGluZ1JpZy5zZXRQb2ludExpZ2h0c0NvbG9yKCcjODg4Jyk7XHJcblx0XHR9KTtcclxuXHRcdCR0aW1lb3V0KGZ1bmN0aW9uICgpIHtcclxuXHRcdFx0JCgnI3NwZWN0YWNsZXMtY29udGFpbmVyJylcclxuXHRcdFx0XHQudHJpZ2dlcigncmVzaXplJyk7XHJcblx0XHR9KTtcclxuXHR9O1xyXG5cclxuXHQkc2NvcGUudG9nZ2xlRnVsbHNjcmVlbiA9IGZ1bmN0aW9uICgpIHtcclxuXHJcblx0XHR2YXIgZGl2ID0gJCgnI3NlbGVjdGVkLXJlc3VsdCcpO1xyXG5cdFx0dmFyIG90aGVyRGl2cyA9ICQoJy5oaWRlLWluLWZ1bGxzY3JlZW4nKTtcclxuXHJcblx0XHRpZiAoIWlzRnVsbHNjcmVlbikge1xyXG5cdFx0XHRkaXYuYWRkQ2xhc3MoJ2Z1bGwtc2NyZWVuJyk7XHJcblx0XHRcdG90aGVyRGl2cy5oaWRlKCk7XHJcblx0XHR9IGVsc2Uge1xyXG5cdFx0XHRkaXYucmVtb3ZlQ2xhc3MoJ2Z1bGwtc2NyZWVuJyk7XHJcblx0XHRcdG90aGVyRGl2cy5zaG93KCk7XHJcblx0XHR9XHJcblxyXG5cdFx0JCgnI3NwZWN0YWNsZXMtY29udGFpbmVyJylcclxuXHRcdFx0LnRyaWdnZXIoJ3Jlc2l6ZScpO1xyXG5cclxuXHRcdGlzRnVsbHNjcmVlbiA9ICFpc0Z1bGxzY3JlZW47XHJcblx0fTtcclxuXHJcblxyXG5cclxuXHQvKlxyXG5cdOKWiOKWiCAgICAg4paI4paIICDilojilojilojilojiloggIOKWiOKWiOKWiOKWiOKWiOKWiOKWiOKWiCAg4paI4paI4paI4paI4paI4paIIOKWiOKWiCAgIOKWiOKWiFxyXG5cdOKWiOKWiCAgICAg4paI4paIIOKWiOKWiCAgIOKWiOKWiCAgICDilojiloggICAg4paI4paIICAgICAg4paI4paIICAg4paI4paIXHJcblx04paI4paIICDiloggIOKWiOKWiCDilojilojilojilojilojilojiloggICAg4paI4paIICAgIOKWiOKWiCAgICAgIOKWiOKWiOKWiOKWiOKWiOKWiOKWiFxyXG5cdOKWiOKWiCDilojilojilogg4paI4paIIOKWiOKWiCAgIOKWiOKWiCAgICDilojiloggICAg4paI4paIICAgICAg4paI4paIICAg4paI4paIXHJcblx0IOKWiOKWiOKWiCDilojilojiloggIOKWiOKWiCAgIOKWiOKWiCAgICDilojiloggICAgIOKWiOKWiOKWiOKWiOKWiOKWiCDilojiloggICDilojilohcclxuXHQqL1xyXG5cclxuXHQkc2NvcGUuJHdhdGNoKCdkZXNpZ25FeHBsb3JlcicsIGRyYXdEZXNpZ25FeHBsb3Jlcik7XHJcblxyXG5cclxuXHJcblx0LypcclxuXHQg4paI4paI4paI4paI4paIICDilojilojiloggICAg4paI4paIICDilojilojilojilojilojiloggIOKWiOKWiOKWiCAgICDilojilohcclxuXHTilojiloggICDilojilogg4paI4paI4paI4paIICAg4paI4paIIOKWiOKWiCAgICDilojilogg4paI4paI4paI4paIICAg4paI4paIXHJcblx04paI4paI4paI4paI4paI4paI4paIIOKWiOKWiCDilojiloggIOKWiOKWiCDilojiloggICAg4paI4paIIOKWiOKWiCDilojiloggIOKWiOKWiFxyXG5cdOKWiOKWiCAgIOKWiOKWiCDilojiloggIOKWiOKWiCDilojilogg4paI4paIICAgIOKWiOKWiCDilojiloggIOKWiOKWiCDilojilohcclxuXHTilojiloggICDilojilogg4paI4paIICAg4paI4paI4paI4paIICDilojilojilojilojilojiloggIOKWiOKWiCAgIOKWiOKWiOKWiOKWiFxyXG5cdCovXHJcblxyXG5cdGZ1bmN0aW9uIGRyYXdEZXNpZ25FeHBsb3JlcigpIHtcclxuXHRcdCR0aW1lb3V0KGZ1bmN0aW9uICgpIHtcclxuXHRcdFx0aWYgKCRzY29wZS5kZXNpZ25FeHBsb3Jlcikge1xyXG5cdFx0XHRcdCRzY29wZS5kZXNpZ25FeHBsb3Jlci5wYXJjb29yZHNfY3JlYXRlKCcjcGFyYWxsZWwtY29vcmRzJyk7XHJcblx0XHRcdFx0c2V0RmlsdGVyZWRFbnRyaWVzKCk7XHJcblx0XHRcdFx0JHNjb3BlLmRlc2lnbkV4cGxvcmVyLmFic3RyYWN0X3BhcmNvb3Jkc19wb3N0UmVuZGVyID0gc2V0RmlsdGVyZWRFbnRyaWVzO1xyXG5cdFx0XHR9XHJcblx0XHR9KTtcclxuXHR9XHJcblxyXG5cdGZ1bmN0aW9uIHNldEZpbHRlcmVkRW50cmllcygpIHtcclxuXHRcdCRzY29wZS5maWx0ZXJlZEVudHJpZXMgPSAkc2NvcGUuZGVzaWduRXhwbG9yZXIuZ3JhcGhzLnBhcmNvb3Jkcy5icnVzaGVkKCkgfHwgJHNjb3BlLmRlc2lnbkV4cGxvcmVyLmdldERhdGEoKTtcclxuXHRcdCRzY29wZS5zZWxlY3RJdGVyYXRpb24obnVsbCk7XHJcblx0XHQkdGltZW91dChmdW5jdGlvbiAoKSB7XHJcblx0XHRcdCRzY29wZS4kYXBwbHkoKTtcclxuXHRcdH0pO1xyXG5cdH1cclxuXHJcbn0pO1xyXG4iXX0=
