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

			$timeout(function () {

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
						.css('max-height', ($(window.top).height()-bottombar.outerHeight()-130)+'px');


					// parallelDiv.css('height', bottombar.height() - 30);
					// parallelDiv.css('width', bottombar.width() - 30);
					// if (scope.designExplorer) {
					// 	scope.designExplorer.renderParallelCoordinates();
					// }
				}
			});
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

				var infoBox = $('#cur-frame-info');

				scope.designExplorer.populateIterationTable(infoBox,scope.curFrameInfo);

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
		$scope.designExplorer.populateIterationTable($('#selected-iteration-info'),iteration);
		$scope.designExplorer.graphs.parcoords.highlight([iteration]);
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
				$scope.designExplorer.drawParallelCoordinates('#parallel-coords');
				$scope.designExplorer.graphs.parcoords.on('brush', setFilteredEntries);
				setFilteredEntries();
			}
		});
	}

	function setFilteredEntries(entries) {
		$scope.filteredEntries = entries || $scope.designExplorer.getData();
		$timeout(function () {
			$scope.$apply();
		});
	}

});

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImhlYWRlci5qcyIsImZpbHRlcnMvdHlwZU9mLmpzIiwic3RhdGVzL2RlZmF1bHQuanMiLCJkaXJlY3RpdmVzL2JvdHRvbU5hdi9ib3R0b21OYXYuanMiLCJkaXJlY3RpdmVzL25hdmJhci9uYXZiYXIuanMiLCJkaXJlY3RpdmVzL2FuaW1hdGVkUmVzdWx0cy9hbmltYXRlZFJlc3VsdHMuanMiLCJkaXJlY3RpdmVzL3Jlc3VsdHNUaHVtYm5haWxzL3Jlc3VsdHNUaHVtYm5haWxzLmpzIiwiZGlyZWN0aXZlcy9zZWxlY3RlZEl0ZXJhdGlvbi9zZWxlY3RlZEl0ZXJhdGlvbi5qcyIsInN0YXRlcy9yb290L3Jvb3QuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ1BBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ0xBO0FBQ0E7QUFDQTtBQUNBO0FDSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3BEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDaEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQzFIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDbkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNoQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJtYWluLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXHJcbiAqIEFuZ3VsYXIgYXBwbGljYXRpb24uIFNlZSBBbmd1bGFyLXNwZWNpZmljIGRvY3VtZW50YXRpb24gZm9yIGFueXRoaW5nIGluc2lkZVxyXG4gKiBvZiBhcHAuc29tZXRoaW5nLlxyXG4gKiBAdHlwZSB7b2JqZWN0fVxyXG4gKiBAZ2xvYmFsXHJcbiAqL1xyXG52YXIgYXBwID0gYW5ndWxhci5tb2R1bGUoJ2Rlc2lnbmV4cGxvcmVyLmRlbW8nLCBbJ3VpLnJvdXRlciddKTtcclxuIiwiYXBwLmZpbHRlcigndHlwZW9mJywgZnVuY3Rpb24oKSB7XHJcbiAgcmV0dXJuIGZ1bmN0aW9uKG9iaikge1xyXG4gICAgcmV0dXJuIHR5cGVvZiBvYmo7XHJcbiAgfTtcclxufSk7XHJcbiIsImFwcC5jb25maWcoZnVuY3Rpb24oJHVybFJvdXRlclByb3ZpZGVyKSB7XHJcbiAgJHVybFJvdXRlclByb3ZpZGVyLm90aGVyd2lzZSgnLycpO1xyXG59KTtcclxuIiwiLyoqXHJcbiAqIEBtZW1iZXJPZiBhcHBcclxuICogQG5nZG9jIGRpcmVjdGl2ZVxyXG4gKiBAbmFtZSBib3R0b21OYXZcclxuICogQHBhcmFtIHtzZXJ2aWNlfVxyXG4gKiBAZGVzY3JpcHRpb25cclxuICogICBSZXNpemFibGUgYm90dG9tIG5hdmlnYXRpb25cclxuICovXHJcbmFwcC5kaXJlY3RpdmUoJ2JvdHRvbU5hdicsIGZ1bmN0aW9uICgkdGltZW91dCkge1xyXG5cdHJldHVybiB7XHJcblx0XHRyZXN0cmljdDogJ0UnLFxyXG5cdFx0dGVtcGxhdGVVcmw6ICdqcy9zcmMvbWFpbi9kaXJlY3RpdmVzL2JvdHRvbU5hdi9ib3R0b21OYXYuaHRtbCcsXHJcblx0XHRsaW5rOiBmdW5jdGlvbiAoc2NvcGUpIHtcclxuXHJcblx0XHRcdCR0aW1lb3V0KGZ1bmN0aW9uICgpIHtcclxuXHJcblx0XHRcdFx0dmFyIGJvdHRvbWJhciA9ICQoJy5ib3R0b20tbmF2Jyk7XHJcblxyXG5cdFx0XHRcdC8vIGJvdHRvbWJhci5yZXNpemFibGUoe1xyXG5cdFx0XHRcdC8vIFx0aGFuZGxlczoge1xyXG5cdFx0XHRcdC8vIFx0XHQnbic6ICcjaGFuZGxlJ1xyXG5cdFx0XHRcdC8vIFx0fVxyXG5cdFx0XHRcdC8vIH0pO1xyXG5cdFx0XHRcdC8vXHJcblx0XHRcdFx0Ly8gYm90dG9tYmFyLm9uKCdyZXNpemUnLCByZXNwb25kVG9SZXNpemUpO1xyXG5cclxuXHRcdFx0XHQkKHdpbmRvdylcclxuXHRcdFx0XHRcdC5vbigncmVzaXplJywgcmVzcG9uZFRvUmVzaXplKTtcclxuXHJcblx0XHRcdFx0cmVzcG9uZFRvUmVzaXplKCk7XHJcblxyXG5cdFx0XHRcdGZ1bmN0aW9uIHJlc3BvbmRUb1Jlc2l6ZSgpIHtcclxuXHJcblx0XHRcdFx0XHR2YXIgcGFyYWxsZWxEaXYgPSAkKCcjcGFyYWxsZWwtY29vcmRzJyk7XHJcblxyXG5cdFx0XHRcdFx0Ly8gJCgnI21haW4tY29udGVudC1mbG93JylcclxuXHRcdFx0XHRcdC8vIFx0LmNzcygncGFkZGluZy1ib3R0b20nLCBib3R0b21iYXIuaGVpZ2h0KCkrMTUwKTtcclxuXHJcblx0XHRcdFx0XHQkKCcjbWFpbi1jb250ZW50LWZsb3cnKVxyXG5cdFx0XHRcdFx0XHQuY3NzKCdtYXgtaGVpZ2h0JywgKCQod2luZG93LnRvcCkuaGVpZ2h0KCktYm90dG9tYmFyLm91dGVySGVpZ2h0KCktMTMwKSsncHgnKTtcclxuXHJcblxyXG5cdFx0XHRcdFx0Ly8gcGFyYWxsZWxEaXYuY3NzKCdoZWlnaHQnLCBib3R0b21iYXIuaGVpZ2h0KCkgLSAzMCk7XHJcblx0XHRcdFx0XHQvLyBwYXJhbGxlbERpdi5jc3MoJ3dpZHRoJywgYm90dG9tYmFyLndpZHRoKCkgLSAzMCk7XHJcblx0XHRcdFx0XHQvLyBpZiAoc2NvcGUuZGVzaWduRXhwbG9yZXIpIHtcclxuXHRcdFx0XHRcdC8vIFx0c2NvcGUuZGVzaWduRXhwbG9yZXIucmVuZGVyUGFyYWxsZWxDb29yZGluYXRlcygpO1xyXG5cdFx0XHRcdFx0Ly8gfVxyXG5cdFx0XHRcdH1cclxuXHRcdFx0fSk7XHJcblx0XHR9XHJcblx0fTtcclxufSk7XHJcbiIsIi8qKlxyXG4gKiBAbWVtYmVyT2YgYXBwXHJcbiAqIEBuZ2RvYyBkaXJlY3RpdmVcclxuICogQG5hbWUgbmF2YmFyXHJcbiAqIEBwYXJhbSB7c2VydmljZX1cclxuICogQGRlc2NyaXB0aW9uXHJcbiAqICAgTmF2YmFyLiBEb2Vzbid0IHJlYWxseSBkbyBhbnl0aGluZyBpbnRlcmVzdGluZyB5ZXQuXHJcbiAqL1xyXG5hcHAuZGlyZWN0aXZlKCduYXZiYXInLCBmdW5jdGlvbigpIHtcclxuXHRyZXR1cm4ge1xyXG5cdFx0cmVzdHJpY3Q6ICdFJyxcclxuXHRcdHRlbXBsYXRlVXJsOiAnanMvc3JjL21haW4vZGlyZWN0aXZlcy9uYXZiYXIvbmF2YmFyLmh0bWwnLFxyXG5cdFx0bGluazogZnVuY3Rpb24oc2NvcGUpIHtcclxuXHRcdH1cclxuXHR9O1xyXG59KTtcclxuIiwiLyoqXHJcbiAqIEBtZW1iZXJPZiBhcHBcclxuICogQG5nZG9jIGRpcmVjdGl2ZVxyXG4gKiBAbmFtZSBhbmltYXRlZFJlc3VsdHNcclxuICogQHBhcmFtIHtzZXJ2aWNlfVxyXG4gKiBAZGVzY3JpcHRpb25cclxuICogICBBbmltYXRlZCByZXN1bHRzXHJcbiAqL1xyXG5hcHAuZGlyZWN0aXZlKCdhbmltYXRlZFJlc3VsdHMnLCBmdW5jdGlvbiAoJHRpbWVvdXQpIHtcclxuXHRyZXR1cm4ge1xyXG5cdFx0cmVzdHJpY3Q6ICdFJyxcclxuXHRcdHRlbXBsYXRlVXJsOiAnanMvc3JjL21haW4vZGlyZWN0aXZlcy9hbmltYXRlZFJlc3VsdHMvYW5pbWF0ZWRSZXN1bHRzLmh0bWwnLFxyXG5cdFx0bGluazogZnVuY3Rpb24gKHNjb3BlKSB7XHJcblxyXG5cdFx0XHRzY29wZS5jdXJGcmFtZSA9IDA7XHJcblx0XHRcdHNjb3BlLmZyYW1lcyA9IDA7XHJcblx0XHRcdHNjb3BlLmN1ckZyYW1lSW5mbyA9IG51bGw7XHJcblx0XHRcdHNjb3BlLiR3YXRjaCgnZmlsdGVyZWRFbnRyaWVzJywgY2hlY2tXaGV0aGVyVG9BbmltYXRlKTtcclxuXHRcdFx0c2NvcGUuJHdhdGNoKCd2aWV3TW9kZScsIGNoZWNrV2hldGhlclRvQW5pbWF0ZSk7XHJcblx0XHRcdHNjb3BlLiR3YXRjaCgnc2VsZWN0ZWRJdGVyYXRpb24nLCBjaGVja1doZXRoZXJUb0FuaW1hdGUpO1xyXG5cclxuXHRcdFx0dmFyIGRlYm91bmNlTmV4dDtcclxuXHRcdFx0dmFyIGFuaW1hdGVTcGVlZCA9IDMwMDtcclxuXHRcdFx0dmFyIGlzQW5pbWF0aW5nID0gZmFsc2U7XHJcblxyXG5cdFx0XHQvKlxyXG5cdFx0XHQg4paI4paI4paI4paI4paIICDilojilojiloggICAg4paI4paIICDilojilojilojilojilojiloggIOKWiOKWiOKWiCAgICDilojilohcclxuXHRcdFx04paI4paIICAg4paI4paIIOKWiOKWiOKWiOKWiCAgIOKWiOKWiCDilojiloggICAg4paI4paIIOKWiOKWiOKWiOKWiCAgIOKWiOKWiFxyXG5cdFx0XHTilojilojilojilojilojilojilogg4paI4paIIOKWiOKWiCAg4paI4paIIOKWiOKWiCAgICDilojilogg4paI4paIIOKWiOKWiCAg4paI4paIXHJcblx0XHRcdOKWiOKWiCAgIOKWiOKWiCDilojiloggIOKWiOKWiCDilojilogg4paI4paIICAgIOKWiOKWiCDilojiloggIOKWiOKWiCDilojilohcclxuXHRcdFx04paI4paIICAg4paI4paIIOKWiOKWiCAgIOKWiOKWiOKWiOKWiCAg4paI4paI4paI4paI4paI4paIICDilojiloggICDilojilojilojilohcclxuXHRcdFx0Ki9cclxuXHJcblx0XHRcdC8qKlxyXG5cdFx0XHQgKiBDaGVjayB3aGV0aGVyIHdlIHNob3VsZCBtb3ZlIGZvcndhcmQgd2l0aCBhbmltYXRpbmcgb3IgdGVybWluYXRlIGEgcHJldmlvdXMgYW5pbWF0aW9uXHJcblx0XHRcdCAqL1xyXG5cdFx0XHRmdW5jdGlvbiBjaGVja1doZXRoZXJUb0FuaW1hdGUoKSB7XHJcblx0XHRcdFx0aWYgKCFpc0FuaW1hdGVNb2RlKCkgfHwgc2NvcGUuc2VsZWN0ZWRJdGVyYXRpb24pIHtcclxuXHRcdFx0XHRcdGNsZWFuUHJldmlvdXNBbmltYXRpb24oKTtcclxuXHRcdFx0XHR9IGVsc2Uge1xyXG5cdFx0XHRcdFx0c3RhcnROZXdBbmltYXRpb24oKTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdC8qKlxyXG5cdFx0XHQgKiBTdGFydHMgYSBuZXcgYW5pbWF0aW9uXHJcblx0XHRcdCAqL1xyXG5cdFx0XHRmdW5jdGlvbiBzdGFydE5ld0FuaW1hdGlvbigpIHtcclxuXHRcdFx0XHRpZiAoIXNjb3BlLmZpbHRlcmVkRW50cmllcyB8fCAhaXNBbmltYXRlTW9kZSgpKSByZXR1cm47XHJcblx0XHRcdFx0aWYgKCFzY29wZS5maWx0ZXJlZEVudHJpZXMubGVuZ3RoKSB7XHJcblx0XHRcdFx0XHQkKCcjYW5pbWF0ZWQtcmVzdWx0cycpXHJcblx0XHRcdFx0XHRcdC5hdHRyKCdzcmMnLCAnJyk7XHJcblx0XHRcdFx0XHQkKCcjY3VyLWZyYW1lLWluZm8nKVxyXG5cdFx0XHRcdFx0XHQuaHRtbCgnJyk7XHJcblx0XHRcdFx0fVxyXG5cclxuXHRcdFx0XHRzY29wZS5jdXJGcmFtZSA9IDA7XHJcblx0XHRcdFx0c2NvcGUuZnJhbWVzID0gc2NvcGUuZmlsdGVyZWRFbnRyaWVzLmxlbmd0aDtcclxuXHJcblx0XHRcdFx0dmFyIG5ld0FuaW1hdGVTcGVlZCA9IE1hdGgubWF4KDEwMDAwMCAvIHNjb3BlLmZyYW1lcywgMzAwKTsgLy8gbWluIGRlYm91bmNlIHRpbWVcclxuXHRcdFx0XHRuZXdBbmltYXRlU3BlZWQgPSBNYXRoLm1pbihuZXdBbmltYXRlU3BlZWQsIDE1MDApOyAvLyBtYXggZGVib3VuY2UgdGltZVxyXG5cdFx0XHRcdGFuaW1hdGVTcGVlZCA9IG5ld0FuaW1hdGVTcGVlZDtcclxuXHJcblx0XHRcdFx0aWYgKCFpc0FuaW1hdGluZykgYW5pbWF0ZSgpO1xyXG5cdFx0XHRcdGlzQW5pbWF0aW5nID0gdHJ1ZTtcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0LyoqXHJcblx0XHRcdCAqIEFuaW1hdGUgbG9vcFxyXG5cdFx0XHQgKi9cclxuXHRcdFx0ZnVuY3Rpb24gYW5pbWF0ZSgpIHtcclxuXHRcdFx0XHRpZiAoIWlzQW5pbWF0ZU1vZGUoKSkge1xyXG5cdFx0XHRcdFx0aXNBbmltYXRpbmcgPSBmYWxzZTtcclxuXHRcdFx0XHRcdHJldHVybjtcclxuXHRcdFx0XHR9IGVsc2Uge1xyXG5cdFx0XHRcdFx0c2hvd05leHRGcmFtZSgpO1xyXG5cdFx0XHRcdFx0c2V0VGltZW91dChmdW5jdGlvbiAoKSB7XHJcblx0XHRcdFx0XHRcdGFuaW1hdGUoKTtcclxuXHRcdFx0XHRcdH0sIGFuaW1hdGVTcGVlZCk7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHQvKipcclxuXHRcdFx0ICogQ29kZSB0byBtb3ZlIGZvcndhcmQgYSBmcmFtZS4gQ2FsbGVkIGZyb20gdGhlIGFuaW1hdGUgbG9vcC5cclxuXHRcdFx0ICovXHJcblx0XHRcdGZ1bmN0aW9uIHNob3dOZXh0RnJhbWUoKSB7XHJcblx0XHRcdFx0aWYgKCFpc0FuaW1hdGVNb2RlKCkpIHJldHVybjtcclxuXHRcdFx0XHRjbGVhblByZXZpb3VzQW5pbWF0aW9uKCk7XHJcblxyXG5cdFx0XHRcdGlmICghc2NvcGUuZmlsdGVyZWRFbnRyaWVzIHx8ICFzY29wZS5maWx0ZXJlZEVudHJpZXMubGVuZ3RoKSByZXR1cm47XHJcblx0XHRcdFx0c2NvcGUuY3VyRnJhbWVJbmZvID0gc2NvcGUuZmlsdGVyZWRFbnRyaWVzW3Njb3BlLmN1ckZyYW1lXTtcclxuXHJcblx0XHRcdFx0JCgnI2FuaW1hdGVkLXJlc3VsdHMnKVxyXG5cdFx0XHRcdFx0LmF0dHIoJ3NyYycsIHNjb3BlLmN1ckZyYW1lSW5mby5pbWcpO1xyXG5cclxuXHRcdFx0XHR2YXIgaW5mb0JveCA9ICQoJyNjdXItZnJhbWUtaW5mbycpO1xyXG5cclxuXHRcdFx0XHRzY29wZS5kZXNpZ25FeHBsb3Jlci5wb3B1bGF0ZUl0ZXJhdGlvblRhYmxlKGluZm9Cb3gsc2NvcGUuY3VyRnJhbWVJbmZvKTtcclxuXHJcblx0XHRcdFx0c2NvcGUuZGVzaWduRXhwbG9yZXIuZ3JhcGhzLnBhcmNvb3Jkcy5oaWdobGlnaHQoW3Njb3BlLmN1ckZyYW1lSW5mb10pO1xyXG5cclxuXHRcdFx0XHRzY29wZS5jdXJGcmFtZSArPSAxO1xyXG5cdFx0XHRcdGlmIChzY29wZS5jdXJGcmFtZSA+PSBzY29wZS5mcmFtZXMpIHNjb3BlLmN1ckZyYW1lID0gMDtcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0LyoqXHJcblx0XHRcdCAqIENsZWFuIGxlZnRvdmVyIHN0dWZmIGZyb20gYSBwcmV2aW91cyBhbmltYXRpb25cclxuXHRcdFx0ICovXHJcblx0XHRcdGZ1bmN0aW9uIGNsZWFuUHJldmlvdXNBbmltYXRpb24oKSB7XHJcblx0XHRcdFx0aWYgKHNjb3BlLmRlc2lnbkV4cGxvcmVyICYmIHNjb3BlLmRlc2lnbkV4cGxvcmVyLmdyYXBocy5wYXJjb29yZHMpIHNjb3BlLmRlc2lnbkV4cGxvcmVyLmdyYXBocy5wYXJjb29yZHMudW5oaWdobGlnaHQoKTtcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0LyoqXHJcblx0XHRcdCAqIFdoZXRoZXIgd2UncmUgY3VycmVudGx5IGluIGFuaW1hdGlvbiBtb2RlXHJcblx0XHRcdCAqIEByZXR1cm4ge0Jvb2xlYW59XHJcblx0XHRcdCAqL1xyXG5cdFx0XHRmdW5jdGlvbiBpc0FuaW1hdGVNb2RlKCkge1xyXG5cdFx0XHRcdHJldHVybiBzY29wZS52aWV3TW9kZSA9PT0gJ2FuaW1hdGlvbic7XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHR9O1xyXG59KTtcclxuIiwiLyoqXHJcbiAqIEBtZW1iZXJPZiBhcHBcclxuICogQG5nZG9jIGRpcmVjdGl2ZVxyXG4gKiBAbmFtZSByZXN1bHRzVGh1bWJuYWlsc1xyXG4gKiBAcGFyYW0ge3NlcnZpY2V9XHJcbiAqIEBkZXNjcmlwdGlvblxyXG4gKiAgIFRodW1ibmFpbHMgb2YgcmVzdWx0c1xyXG4gKi9cclxuYXBwLmRpcmVjdGl2ZSgncmVzdWx0c1RodW1ibmFpbHMnLCBmdW5jdGlvbiAoJHRpbWVvdXQpIHtcclxuXHRyZXR1cm4ge1xyXG5cdFx0cmVzdHJpY3Q6ICdFJyxcclxuXHRcdHRlbXBsYXRlVXJsOiAnanMvc3JjL21haW4vZGlyZWN0aXZlcy9yZXN1bHRzVGh1bWJuYWlscy9yZXN1bHRzVGh1bWJuYWlscy5odG1sJyxcclxuXHRcdGxpbms6IGZ1bmN0aW9uIChzY29wZSkge1xyXG5cdFx0XHRzY29wZS5nZXRPcmRlckJ5ID0gZnVuY3Rpb24gKCkge1xyXG5cdFx0XHRcdHJldHVybiAoc2NvcGUuZGVzaWduRXhwbG9yZXIgJiYgc2NvcGUuZGVzaWduRXhwbG9yZXIuc2VsZWN0ZWRQYXJhbSkgPyBzY29wZS5kZXNpZ25FeHBsb3Jlci5zZWxlY3RlZFBhcmFtW0Rlc2lnbkV4cGxvcmVyLmRhdGFLZXldIDogJyc7XHJcblx0XHRcdH07XHJcblx0XHR9XHJcblx0fTtcclxufSk7XHJcbiIsIi8qKlxyXG4gKiBAbWVtYmVyT2YgYXBwXHJcbiAqIEBuZ2RvYyBkaXJlY3RpdmVcclxuICogQG5hbWUgc2VsZWN0ZWRJdGVyYXRpb25cclxuICogQHBhcmFtIHtzZXJ2aWNlfVxyXG4gKiBAZGVzY3JpcHRpb25cclxuICogICBUaGUgY3VycmVudCBzZWxlY3RlZCBpdGVyYXRpb24gZm9yIGluc3BlY3Rpb25cclxuICovXHJcbmFwcC5kaXJlY3RpdmUoJ3NlbGVjdGVkSXRlcmF0aW9uJywgZnVuY3Rpb24gKCR0aW1lb3V0KSB7XHJcblx0cmV0dXJuIHtcclxuXHRcdHJlc3RyaWN0OiAnRScsXHJcblx0XHR0ZW1wbGF0ZVVybDogJ2pzL3NyYy9tYWluL2RpcmVjdGl2ZXMvc2VsZWN0ZWRJdGVyYXRpb24vc2VsZWN0ZWRJdGVyYXRpb24uaHRtbCcsXHJcblx0XHRsaW5rOiBmdW5jdGlvbiAoc2NvcGUpIHtcclxuXHRcdH1cclxuXHR9O1xyXG59KTtcclxuIiwiLyoqXHJcbiAqIEJhc2Ugc3RhdGUgZm9yIGFsbCBuZXN0ZWQgZnV0dXJlIHN0YXRlcyB3ZSBtYXkgaGF2ZVxyXG4gKi9cclxuYXBwLmNvbmZpZyhmdW5jdGlvbiAoJHN0YXRlUHJvdmlkZXIpIHtcclxuXHQkc3RhdGVQcm92aWRlci5zdGF0ZSgncm9vdCcsIHtcclxuXHRcdG5hbWU6ICdyb290JyxcclxuXHRcdC8vIGFic3RyYWN0OiB0cnVlLFxyXG5cdFx0dXJsOiAnLycsXHJcblx0XHR0ZW1wbGF0ZVVybDogJ2pzL3NyYy9tYWluL3N0YXRlcy9yb290L3Jvb3QuaHRtbCcsXHJcblx0XHRjb250cm9sbGVyOiAnUm9vdFN0YXRlQ3RybCdcclxuXHR9KTtcclxufSk7XHJcblxyXG5hcHAuY29udHJvbGxlcignUm9vdFN0YXRlQ3RybCcsIGZ1bmN0aW9uICgkcm9vdFNjb3BlLCAkc2NvcGUsICR0aW1lb3V0KSB7XHJcblxyXG5cdHZhciBkZXNpZ25FeHBsb3JlcjtcclxuXHJcblx0dmFyIHNwZWN0O1xyXG5cclxuXHRkMy5jc3YoXCJkZXNpZ25fZXhwbG9yZXJfZGF0YS9rcGYvMjAxNjA4MTFfRGF0YVRhYmxlX0Zvcm1hdHRlZC5jc3ZcIilcclxuXHRcdC5nZXQoZnVuY3Rpb24gKGVycm9yLCByb3dzKSB7XHJcblx0XHRcdCRzY29wZS5kZXNpZ25FeHBsb3JlciA9IG5ldyBEZXNpZ25FeHBsb3Jlcihyb3dzKTtcclxuXHRcdH0pO1xyXG5cclxuXHQkc2NvcGUudmlld01vZGUgPSAndGh1bWJuYWlscyc7XHJcblxyXG5cdCRzY29wZS5zZWxlY3RlZEl0ZXJhdGlvbiA9IG51bGw7XHJcblxyXG5cdCRzY29wZS5EZXNpZ25FeHBsb3JlciA9IHtcclxuXHRcdCd0eXBlRGlzcGxheURpY3Rpb25hcnknOiBEZXNpZ25FeHBsb3Jlci50eXBlRGlzcGxheURpY3Rpb25hcnlcclxuXHR9O1xyXG5cclxuXHQkdGltZW91dChmdW5jdGlvbiAoKSB7XHJcblx0XHRzcGVjdCA9IG5ldyBTUEVDVEFDTEVTKCQoJyNzcGVjdGFjbGVzLWNvbnRhaW5lcicpKTtcclxuXHR9KTtcclxuXHJcblx0LypcclxuXHTilojilojilojilojilojilojiloggIOKWiOKWiOKWiOKWiOKWiOKWiCAg4paI4paI4paI4paI4paI4paIICDilojilojilojilojilojiloggIOKWiOKWiOKWiOKWiOKWiOKWiOKWiCAgICAg4paI4paI4paI4paI4paI4paI4paIIOKWiOKWiOKWiCAgICDilojilohcclxuXHTilojiloggICAgICDilojiloggICAgICDilojiloggICAg4paI4paIIOKWiOKWiCAgIOKWiOKWiCDilojiloggICAgICAgICAg4paI4paIICAgICAg4paI4paI4paI4paIICAg4paI4paIXHJcblx04paI4paI4paI4paI4paI4paI4paIIOKWiOKWiCAgICAgIOKWiOKWiCAgICDilojilogg4paI4paI4paI4paI4paI4paIICDilojilojilojilojiloggICAgICAg4paI4paI4paI4paI4paIICAg4paI4paIIOKWiOKWiCAg4paI4paIXHJcblx0ICAgICDilojilogg4paI4paIICAgICAg4paI4paIICAgIOKWiOKWiCDilojiloggICAgICDilojiloggICAgICAgICAg4paI4paIICAgICAg4paI4paIICDilojilogg4paI4paIXHJcblx04paI4paI4paI4paI4paI4paI4paIICDilojilojilojilojilojiloggIOKWiOKWiOKWiOKWiOKWiOKWiCAg4paI4paIICAgICAg4paI4paI4paI4paI4paI4paI4paIICAgICDilojiloggICAgICDilojiloggICDilojilojilojilohcclxuXHQqL1xyXG5cclxuXHQkc2NvcGUuc2VsZWN0SXRlcmF0aW9uID0gZnVuY3Rpb24gKGl0ZXJhdGlvbikge1xyXG5cdFx0JHNjb3BlLnJlc3VsdE1vZGUgPSAnaW1hZ2UnO1xyXG5cdFx0JHNjb3BlLnNlbGVjdGVkSXRlcmF0aW9uID0gaXRlcmF0aW9uO1xyXG5cdFx0JHNjb3BlLmRlc2lnbkV4cGxvcmVyLnBvcHVsYXRlSXRlcmF0aW9uVGFibGUoJCgnI3NlbGVjdGVkLWl0ZXJhdGlvbi1pbmZvJyksaXRlcmF0aW9uKTtcclxuXHRcdCRzY29wZS5kZXNpZ25FeHBsb3Jlci5ncmFwaHMucGFyY29vcmRzLmhpZ2hsaWdodChbaXRlcmF0aW9uXSk7XHJcblx0fTtcclxuXHJcblx0JHNjb3BlLnNldDJkTW9kZSA9IGZ1bmN0aW9uICgpIHtcclxuXHRcdCRzY29wZS5yZXN1bHRNb2RlID0gJ2ltYWdlJztcclxuXHR9O1xyXG5cclxuXHQkc2NvcGUuc2V0M2RNb2RlID0gZnVuY3Rpb24gKCkge1xyXG5cdFx0aWYgKCEkc2NvcGUuc2VsZWN0ZWRJdGVyYXRpb24pIHJldHVybjtcclxuXHRcdCRzY29wZS5yZXN1bHRNb2RlID0gJzNkJztcclxuXHRcdGQzLmpzb24oJHNjb3BlLnNlbGVjdGVkSXRlcmF0aW9uLnRocmVlRCwgZnVuY3Rpb24gKGRhdGEpIHtcclxuXHRcdFx0c3BlY3QubG9hZE5ld01vZGVsKGRhdGEpO1xyXG5cdFx0fSk7XHJcblx0XHQkdGltZW91dChmdW5jdGlvbiAoKSB7XHJcblx0XHRcdCQoJyNzcGVjdGFjbGVzLWNvbnRhaW5lcicpXHJcblx0XHRcdFx0LnRyaWdnZXIoJ3Jlc2l6ZScpO1xyXG5cdFx0fSk7XHJcblx0fTtcclxuXHJcblxyXG5cclxuXHQvKlxyXG5cdOKWiOKWiCAgICAg4paI4paIICDilojilojilojilojiloggIOKWiOKWiOKWiOKWiOKWiOKWiOKWiOKWiCAg4paI4paI4paI4paI4paI4paIIOKWiOKWiCAgIOKWiOKWiFxyXG5cdOKWiOKWiCAgICAg4paI4paIIOKWiOKWiCAgIOKWiOKWiCAgICDilojiloggICAg4paI4paIICAgICAg4paI4paIICAg4paI4paIXHJcblx04paI4paIICDiloggIOKWiOKWiCDilojilojilojilojilojilojiloggICAg4paI4paIICAgIOKWiOKWiCAgICAgIOKWiOKWiOKWiOKWiOKWiOKWiOKWiFxyXG5cdOKWiOKWiCDilojilojilogg4paI4paIIOKWiOKWiCAgIOKWiOKWiCAgICDilojiloggICAg4paI4paIICAgICAg4paI4paIICAg4paI4paIXHJcblx0IOKWiOKWiOKWiCDilojilojiloggIOKWiOKWiCAgIOKWiOKWiCAgICDilojiloggICAgIOKWiOKWiOKWiOKWiOKWiOKWiCDilojiloggICDilojilohcclxuXHQqL1xyXG5cclxuXHQkc2NvcGUuJHdhdGNoKCdkZXNpZ25FeHBsb3JlcicsIGRyYXdEZXNpZ25FeHBsb3Jlcik7XHJcblxyXG5cclxuXHQvKlxyXG5cdCDilojilojilojilojiloggIOKWiOKWiOKWiCAgICDilojiloggIOKWiOKWiOKWiOKWiOKWiOKWiCAg4paI4paI4paIICAgIOKWiOKWiFxyXG5cdOKWiOKWiCAgIOKWiOKWiCDilojilojilojiloggICDilojilogg4paI4paIICAgIOKWiOKWiCDilojilojilojiloggICDilojilohcclxuXHTilojilojilojilojilojilojilogg4paI4paIIOKWiOKWiCAg4paI4paIIOKWiOKWiCAgICDilojilogg4paI4paIIOKWiOKWiCAg4paI4paIXHJcblx04paI4paIICAg4paI4paIIOKWiOKWiCAg4paI4paIIOKWiOKWiCDilojiloggICAg4paI4paIIOKWiOKWiCAg4paI4paIIOKWiOKWiFxyXG5cdOKWiOKWiCAgIOKWiOKWiCDilojiloggICDilojilojilojiloggIOKWiOKWiOKWiOKWiOKWiOKWiCAg4paI4paIICAg4paI4paI4paI4paIXHJcblx0Ki9cclxuXHJcblx0ZnVuY3Rpb24gZHJhd0Rlc2lnbkV4cGxvcmVyKCkge1xyXG5cdFx0JHRpbWVvdXQoZnVuY3Rpb24gKCkge1xyXG5cdFx0XHRpZiAoJHNjb3BlLmRlc2lnbkV4cGxvcmVyKSB7XHJcblx0XHRcdFx0JHNjb3BlLmRlc2lnbkV4cGxvcmVyLmRyYXdQYXJhbGxlbENvb3JkaW5hdGVzKCcjcGFyYWxsZWwtY29vcmRzJyk7XHJcblx0XHRcdFx0JHNjb3BlLmRlc2lnbkV4cGxvcmVyLmdyYXBocy5wYXJjb29yZHMub24oJ2JydXNoJywgc2V0RmlsdGVyZWRFbnRyaWVzKTtcclxuXHRcdFx0XHRzZXRGaWx0ZXJlZEVudHJpZXMoKTtcclxuXHRcdFx0fVxyXG5cdFx0fSk7XHJcblx0fVxyXG5cclxuXHRmdW5jdGlvbiBzZXRGaWx0ZXJlZEVudHJpZXMoZW50cmllcykge1xyXG5cdFx0JHNjb3BlLmZpbHRlcmVkRW50cmllcyA9IGVudHJpZXMgfHwgJHNjb3BlLmRlc2lnbkV4cGxvcmVyLmdldERhdGEoKTtcclxuXHRcdCR0aW1lb3V0KGZ1bmN0aW9uICgpIHtcclxuXHRcdFx0JHNjb3BlLiRhcHBseSgpO1xyXG5cdFx0fSk7XHJcblx0fVxyXG5cclxufSk7XHJcbiJdfQ==
