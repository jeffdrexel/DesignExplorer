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

	var isFullscreen = false;

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

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImhlYWRlci5qcyIsInN0YXRlcy9kZWZhdWx0LmpzIiwiZmlsdGVycy90eXBlT2YuanMiLCJkaXJlY3RpdmVzL2JvdHRvbU5hdi9ib3R0b21OYXYuanMiLCJkaXJlY3RpdmVzL25hdmJhci9uYXZiYXIuanMiLCJkaXJlY3RpdmVzL2FuaW1hdGVkUmVzdWx0cy9hbmltYXRlZFJlc3VsdHMuanMiLCJkaXJlY3RpdmVzL3Jlc3VsdHNUaHVtYm5haWxzL3Jlc3VsdHNUaHVtYm5haWxzLmpzIiwiZGlyZWN0aXZlcy9zZWxlY3RlZEl0ZXJhdGlvbi9zZWxlY3RlZEl0ZXJhdGlvbi5qcyIsInN0YXRlcy9yb290L3Jvb3QuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ1BBO0FBQ0E7QUFDQTtBQUNBO0FDSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3ZEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDaEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ25JQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDbkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNoQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6Im1haW4uanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcclxuICogQW5ndWxhciBhcHBsaWNhdGlvbi4gU2VlIEFuZ3VsYXItc3BlY2lmaWMgZG9jdW1lbnRhdGlvbiBmb3IgYW55dGhpbmcgaW5zaWRlXHJcbiAqIG9mIGFwcC5zb21ldGhpbmcuXHJcbiAqIEB0eXBlIHtvYmplY3R9XHJcbiAqIEBnbG9iYWxcclxuICovXHJcbnZhciBhcHAgPSBhbmd1bGFyLm1vZHVsZSgnZGVzaWduZXhwbG9yZXIuZGVtbycsIFsndWkucm91dGVyJ10pO1xyXG4iLCJhcHAuY29uZmlnKGZ1bmN0aW9uKCR1cmxSb3V0ZXJQcm92aWRlcikge1xyXG4gICR1cmxSb3V0ZXJQcm92aWRlci5vdGhlcndpc2UoJy8nKTtcclxufSk7XHJcbiIsImFwcC5maWx0ZXIoJ3R5cGVvZicsIGZ1bmN0aW9uKCkge1xyXG4gIHJldHVybiBmdW5jdGlvbihvYmopIHtcclxuICAgIHJldHVybiB0eXBlb2Ygb2JqO1xyXG4gIH07XHJcbn0pO1xyXG4iLCIvKipcclxuICogQG1lbWJlck9mIGFwcFxyXG4gKiBAbmdkb2MgZGlyZWN0aXZlXHJcbiAqIEBuYW1lIGJvdHRvbU5hdlxyXG4gKiBAcGFyYW0ge3NlcnZpY2V9XHJcbiAqIEBkZXNjcmlwdGlvblxyXG4gKiAgIFJlc2l6YWJsZSBib3R0b20gbmF2aWdhdGlvblxyXG4gKi9cclxuYXBwLmRpcmVjdGl2ZSgnYm90dG9tTmF2JywgZnVuY3Rpb24gKCR0aW1lb3V0KSB7XHJcblx0cmV0dXJuIHtcclxuXHRcdHJlc3RyaWN0OiAnRScsXHJcblx0XHR0ZW1wbGF0ZVVybDogJ2pzL3NyYy9tYWluL2RpcmVjdGl2ZXMvYm90dG9tTmF2L2JvdHRvbU5hdi5odG1sJyxcclxuXHRcdGxpbms6IGZ1bmN0aW9uIChzY29wZSkge1xyXG5cclxuXHRcdFx0JHRpbWVvdXQoaW5pdEpxdWVyeSk7XHJcblxyXG5cdFx0XHRmdW5jdGlvbiBpbml0SnF1ZXJ5KCkge1xyXG5cclxuXHRcdFx0XHR2YXIgYm90dG9tYmFyID0gJCgnLmJvdHRvbS1uYXYnKTtcclxuXHJcblx0XHRcdFx0Ly8gYm90dG9tYmFyLnJlc2l6YWJsZSh7XHJcblx0XHRcdFx0Ly8gXHRoYW5kbGVzOiB7XHJcblx0XHRcdFx0Ly8gXHRcdCduJzogJyNoYW5kbGUnXHJcblx0XHRcdFx0Ly8gXHR9XHJcblx0XHRcdFx0Ly8gfSk7XHJcblx0XHRcdFx0Ly9cclxuXHRcdFx0XHQvLyBib3R0b21iYXIub24oJ3Jlc2l6ZScsIHJlc3BvbmRUb1Jlc2l6ZSk7XHJcblxyXG5cdFx0XHRcdCQod2luZG93KVxyXG5cdFx0XHRcdFx0Lm9uKCdyZXNpemUnLCByZXNwb25kVG9SZXNpemUpO1xyXG5cclxuXHRcdFx0XHRyZXNwb25kVG9SZXNpemUoKTtcclxuXHJcblx0XHRcdFx0ZnVuY3Rpb24gcmVzcG9uZFRvUmVzaXplKCkge1xyXG5cclxuXHRcdFx0XHRcdHZhciBwYXJhbGxlbERpdiA9ICQoJyNwYXJhbGxlbC1jb29yZHMnKTtcclxuXHJcblx0XHRcdFx0XHQvLyAkKCcjbWFpbi1jb250ZW50LWZsb3cnKVxyXG5cdFx0XHRcdFx0Ly8gXHQuY3NzKCdwYWRkaW5nLWJvdHRvbScsIGJvdHRvbWJhci5oZWlnaHQoKSsxNTApO1xyXG5cclxuXHRcdFx0XHRcdCQoJyNtYWluLWNvbnRlbnQtZmxvdycpXHJcblx0XHRcdFx0XHRcdC5jc3MoJ21heC1oZWlnaHQnLCAoJCh3aW5kb3cudG9wKVxyXG5cdFx0XHRcdFx0XHRcdC5oZWlnaHQoKSAtIGJvdHRvbWJhci5vdXRlckhlaWdodCgpIC0gMTMwKSArICdweCcpO1xyXG5cclxuXHJcblx0XHRcdFx0XHQvLyBwYXJhbGxlbERpdi5jc3MoJ2hlaWdodCcsIGJvdHRvbWJhci5oZWlnaHQoKSAtIDMwKTtcclxuXHRcdFx0XHRcdC8vIHBhcmFsbGVsRGl2LmNzcygnd2lkdGgnLCBib3R0b21iYXIud2lkdGgoKSAtIDMwKTtcclxuXHRcdFx0XHRcdC8vIGlmIChzY29wZS5kZXNpZ25FeHBsb3Jlcikge1xyXG5cdFx0XHRcdFx0Ly8gXHRzY29wZS5kZXNpZ25FeHBsb3Jlci5yZW5kZXJQYXJhbGxlbENvb3JkaW5hdGVzKCk7XHJcblx0XHRcdFx0XHQvLyB9XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9XHJcblx0XHR9XHJcblx0fTtcclxufSk7XHJcbiIsIi8qKlxyXG4gKiBAbWVtYmVyT2YgYXBwXHJcbiAqIEBuZ2RvYyBkaXJlY3RpdmVcclxuICogQG5hbWUgbmF2YmFyXHJcbiAqIEBwYXJhbSB7c2VydmljZX1cclxuICogQGRlc2NyaXB0aW9uXHJcbiAqICAgTmF2YmFyLiBEb2Vzbid0IHJlYWxseSBkbyBhbnl0aGluZyBpbnRlcmVzdGluZyB5ZXQuXHJcbiAqL1xyXG5hcHAuZGlyZWN0aXZlKCduYXZiYXInLCBmdW5jdGlvbigpIHtcclxuXHRyZXR1cm4ge1xyXG5cdFx0cmVzdHJpY3Q6ICdFJyxcclxuXHRcdHRlbXBsYXRlVXJsOiAnanMvc3JjL21haW4vZGlyZWN0aXZlcy9uYXZiYXIvbmF2YmFyLmh0bWwnLFxyXG5cdFx0bGluazogZnVuY3Rpb24oc2NvcGUpIHtcclxuXHRcdH1cclxuXHR9O1xyXG59KTtcclxuIiwiLyoqXHJcbiAqIEBtZW1iZXJPZiBhcHBcclxuICogQG5nZG9jIGRpcmVjdGl2ZVxyXG4gKiBAbmFtZSBhbmltYXRlZFJlc3VsdHNcclxuICogQHBhcmFtIHtzZXJ2aWNlfVxyXG4gKiBAZGVzY3JpcHRpb25cclxuICogICBBbmltYXRlZCByZXN1bHRzXHJcbiAqL1xyXG5hcHAuZGlyZWN0aXZlKCdhbmltYXRlZFJlc3VsdHMnLCBmdW5jdGlvbiAoJHRpbWVvdXQpIHtcclxuXHRyZXR1cm4ge1xyXG5cdFx0cmVzdHJpY3Q6ICdFJyxcclxuXHRcdHRlbXBsYXRlVXJsOiAnanMvc3JjL21haW4vZGlyZWN0aXZlcy9hbmltYXRlZFJlc3VsdHMvYW5pbWF0ZWRSZXN1bHRzLmh0bWwnLFxyXG5cdFx0bGluazogZnVuY3Rpb24gKHNjb3BlKSB7XHJcblxyXG5cdFx0XHRzY29wZS5jdXJGcmFtZSA9IDA7XHJcblx0XHRcdHNjb3BlLmZyYW1lcyA9IDA7XHJcblx0XHRcdHNjb3BlLmN1ckZyYW1lSW5mbyA9IG51bGw7XHJcblx0XHRcdHNjb3BlLiR3YXRjaCgnZmlsdGVyZWRFbnRyaWVzJywgY2hlY2tXaGV0aGVyVG9BbmltYXRlKTtcclxuXHRcdFx0c2NvcGUuJHdhdGNoKCd2aWV3TW9kZScsIGNoZWNrV2hldGhlclRvQW5pbWF0ZSk7XHJcblx0XHRcdHNjb3BlLiR3YXRjaCgnc2VsZWN0ZWRJdGVyYXRpb24nLCBjaGVja1doZXRoZXJUb0FuaW1hdGUpO1xyXG5cclxuXHRcdFx0dmFyIGRlYm91bmNlTmV4dDtcclxuXHRcdFx0dmFyIGFuaW1hdGVTcGVlZCA9IDMwMDtcclxuXHRcdFx0dmFyIGlzQW5pbWF0aW5nID0gZmFsc2U7XHJcblxyXG5cdFx0XHQvKlxyXG5cdFx0XHQg4paI4paI4paI4paI4paIICDilojilojiloggICAg4paI4paIICDilojilojilojilojilojiloggIOKWiOKWiOKWiCAgICDilojilohcclxuXHRcdFx04paI4paIICAg4paI4paIIOKWiOKWiOKWiOKWiCAgIOKWiOKWiCDilojiloggICAg4paI4paIIOKWiOKWiOKWiOKWiCAgIOKWiOKWiFxyXG5cdFx0XHTilojilojilojilojilojilojilogg4paI4paIIOKWiOKWiCAg4paI4paIIOKWiOKWiCAgICDilojilogg4paI4paIIOKWiOKWiCAg4paI4paIXHJcblx0XHRcdOKWiOKWiCAgIOKWiOKWiCDilojiloggIOKWiOKWiCDilojilogg4paI4paIICAgIOKWiOKWiCDilojiloggIOKWiOKWiCDilojilohcclxuXHRcdFx04paI4paIICAg4paI4paIIOKWiOKWiCAgIOKWiOKWiOKWiOKWiCAg4paI4paI4paI4paI4paI4paIICDilojiloggICDilojilojilojilohcclxuXHRcdFx0Ki9cclxuXHJcblx0XHRcdC8qKlxyXG5cdFx0XHQgKiBDaGVjayB3aGV0aGVyIHdlIHNob3VsZCBtb3ZlIGZvcndhcmQgd2l0aCBhbmltYXRpbmcgb3IgdGVybWluYXRlIGEgcHJldmlvdXMgYW5pbWF0aW9uXHJcblx0XHRcdCAqL1xyXG5cdFx0XHRmdW5jdGlvbiBjaGVja1doZXRoZXJUb0FuaW1hdGUoKSB7XHJcblx0XHRcdFx0aWYgKCFpc0FuaW1hdGVNb2RlKCkgfHwgc2NvcGUuc2VsZWN0ZWRJdGVyYXRpb24pIHtcclxuXHRcdFx0XHRcdGNsZWFuUHJldmlvdXNBbmltYXRpb24oKTtcclxuXHRcdFx0XHR9IGVsc2Uge1xyXG5cdFx0XHRcdFx0c3RhcnROZXdBbmltYXRpb24oKTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdC8qKlxyXG5cdFx0XHQgKiBTdGFydHMgYSBuZXcgYW5pbWF0aW9uXHJcblx0XHRcdCAqL1xyXG5cdFx0XHRmdW5jdGlvbiBzdGFydE5ld0FuaW1hdGlvbigpIHtcclxuXHRcdFx0XHRpZiAoIXNjb3BlLmZpbHRlcmVkRW50cmllcyB8fCAhaXNBbmltYXRlTW9kZSgpKSByZXR1cm47XHJcblx0XHRcdFx0aWYgKCFzY29wZS5maWx0ZXJlZEVudHJpZXMubGVuZ3RoKSB7XHJcblx0XHRcdFx0XHQkKCcjYW5pbWF0ZWQtcmVzdWx0cycpXHJcblx0XHRcdFx0XHRcdC5hdHRyKCdzcmMnLCAnJyk7XHJcblx0XHRcdFx0XHQkKCcjY3VyLWZyYW1lLWluZm8nKVxyXG5cdFx0XHRcdFx0XHQuaHRtbCgnJyk7XHJcblx0XHRcdFx0fVxyXG5cclxuXHRcdFx0XHRzY29wZS5jdXJGcmFtZSA9IDA7XHJcblx0XHRcdFx0c2NvcGUuZnJhbWVzID0gc2NvcGUuZmlsdGVyZWRFbnRyaWVzLmxlbmd0aDtcclxuXHJcblx0XHRcdFx0dmFyIG5ld0FuaW1hdGVTcGVlZCA9IE1hdGgubWF4KDEwMDAwMCAvIHNjb3BlLmZyYW1lcywgMzAwKTsgLy8gbWluIGRlYm91bmNlIHRpbWVcclxuXHRcdFx0XHRuZXdBbmltYXRlU3BlZWQgPSBNYXRoLm1pbihuZXdBbmltYXRlU3BlZWQsIDE1MDApOyAvLyBtYXggZGVib3VuY2UgdGltZVxyXG5cdFx0XHRcdGFuaW1hdGVTcGVlZCA9IG5ld0FuaW1hdGVTcGVlZDtcclxuXHJcblx0XHRcdFx0aWYgKCFpc0FuaW1hdGluZykgYW5pbWF0ZSgpO1xyXG5cdFx0XHRcdGlzQW5pbWF0aW5nID0gdHJ1ZTtcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0LyoqXHJcblx0XHRcdCAqIEFuaW1hdGUgbG9vcFxyXG5cdFx0XHQgKi9cclxuXHRcdFx0ZnVuY3Rpb24gYW5pbWF0ZSgpIHtcclxuXHRcdFx0XHRpZiAoIWlzQW5pbWF0ZU1vZGUoKSkge1xyXG5cdFx0XHRcdFx0aXNBbmltYXRpbmcgPSBmYWxzZTtcclxuXHRcdFx0XHRcdHJldHVybjtcclxuXHRcdFx0XHR9IGVsc2Uge1xyXG5cdFx0XHRcdFx0c2hvd05leHRGcmFtZSgpO1xyXG5cdFx0XHRcdFx0c2V0VGltZW91dChmdW5jdGlvbiAoKSB7XHJcblx0XHRcdFx0XHRcdGFuaW1hdGUoKTtcclxuXHRcdFx0XHRcdH0sIGFuaW1hdGVTcGVlZCk7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHQvKipcclxuXHRcdFx0ICogQ29kZSB0byBtb3ZlIGZvcndhcmQgYSBmcmFtZS4gQ2FsbGVkIGZyb20gdGhlIGFuaW1hdGUgbG9vcC5cclxuXHRcdFx0ICovXHJcblx0XHRcdGZ1bmN0aW9uIHNob3dOZXh0RnJhbWUoKSB7XHJcblx0XHRcdFx0aWYgKCFpc0FuaW1hdGVNb2RlKCkpIHJldHVybjtcclxuXHRcdFx0XHRjbGVhblByZXZpb3VzQW5pbWF0aW9uKCk7XHJcblxyXG5cdFx0XHRcdGlmICghc2NvcGUuZmlsdGVyZWRFbnRyaWVzIHx8ICFzY29wZS5maWx0ZXJlZEVudHJpZXMubGVuZ3RoKSByZXR1cm47XHJcblx0XHRcdFx0c2NvcGUuY3VyRnJhbWVJbmZvID0gc2NvcGUuZmlsdGVyZWRFbnRyaWVzW3Njb3BlLmN1ckZyYW1lXTtcclxuXHJcblx0XHRcdFx0JCgnI2FuaW1hdGVkLXJlc3VsdHMnKVxyXG5cdFx0XHRcdFx0LmF0dHIoJ3NyYycsIHNjb3BlLmN1ckZyYW1lSW5mby5pbWcpO1xyXG5cclxuXHRcdFx0XHQkKCcjYW5pbWF0ZWQtcmVzdWx0cycpXHJcblx0XHRcdFx0XHQub24oJ2NsaWNrJywgZnVuY3Rpb24gKCkge1xyXG5cdFx0XHRcdFx0XHRjbGVhblByZXZpb3VzQW5pbWF0aW9uKCk7XHJcblx0XHRcdFx0XHRcdHNjb3BlLnZpZXdNb2RlPSd0aHVtYm5haWxzJztcclxuXHRcdFx0XHRcdFx0JHRpbWVvdXQoZnVuY3Rpb24oKXtcclxuXHRcdFx0XHRcdFx0XHRzY29wZS5zZWxlY3RJdGVyYXRpb24oc2NvcGUuY3VyRnJhbWVJbmZvKTtcclxuXHRcdFx0XHRcdFx0fSk7XHJcblx0XHRcdFx0XHR9KTtcclxuXHJcblx0XHRcdFx0dmFyIGluZm9Cb3ggPSAkKCcjY3VyLWZyYW1lLWluZm8nKTtcclxuXHJcblx0XHRcdFx0c2NvcGUuZGVzaWduRXhwbG9yZXIucG9wdWxhdGVJdGVyYXRpb25UYWJsZShpbmZvQm94LCBzY29wZS5jdXJGcmFtZUluZm8pO1xyXG5cclxuXHRcdFx0XHRzY29wZS5kZXNpZ25FeHBsb3Jlci5ncmFwaHMucGFyY29vcmRzLmhpZ2hsaWdodChbc2NvcGUuY3VyRnJhbWVJbmZvXSk7XHJcblxyXG5cdFx0XHRcdHNjb3BlLmN1ckZyYW1lICs9IDE7XHJcblx0XHRcdFx0aWYgKHNjb3BlLmN1ckZyYW1lID49IHNjb3BlLmZyYW1lcykgc2NvcGUuY3VyRnJhbWUgPSAwO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHQvKipcclxuXHRcdFx0ICogQ2xlYW4gbGVmdG92ZXIgc3R1ZmYgZnJvbSBhIHByZXZpb3VzIGFuaW1hdGlvblxyXG5cdFx0XHQgKi9cclxuXHRcdFx0ZnVuY3Rpb24gY2xlYW5QcmV2aW91c0FuaW1hdGlvbigpIHtcclxuXHRcdFx0XHRpZiAoc2NvcGUuZGVzaWduRXhwbG9yZXIgJiYgc2NvcGUuZGVzaWduRXhwbG9yZXIuZ3JhcGhzLnBhcmNvb3Jkcykgc2NvcGUuZGVzaWduRXhwbG9yZXIuZ3JhcGhzLnBhcmNvb3Jkcy51bmhpZ2hsaWdodCgpO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHQvKipcclxuXHRcdFx0ICogV2hldGhlciB3ZSdyZSBjdXJyZW50bHkgaW4gYW5pbWF0aW9uIG1vZGVcclxuXHRcdFx0ICogQHJldHVybiB7Qm9vbGVhbn1cclxuXHRcdFx0ICovXHJcblx0XHRcdGZ1bmN0aW9uIGlzQW5pbWF0ZU1vZGUoKSB7XHJcblx0XHRcdFx0cmV0dXJuIHNjb3BlLnZpZXdNb2RlID09PSAnYW5pbWF0aW9uJztcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cdH07XHJcbn0pO1xyXG4iLCIvKipcclxuICogQG1lbWJlck9mIGFwcFxyXG4gKiBAbmdkb2MgZGlyZWN0aXZlXHJcbiAqIEBuYW1lIHJlc3VsdHNUaHVtYm5haWxzXHJcbiAqIEBwYXJhbSB7c2VydmljZX1cclxuICogQGRlc2NyaXB0aW9uXHJcbiAqICAgVGh1bWJuYWlscyBvZiByZXN1bHRzXHJcbiAqL1xyXG5hcHAuZGlyZWN0aXZlKCdyZXN1bHRzVGh1bWJuYWlscycsIGZ1bmN0aW9uICgkdGltZW91dCkge1xyXG5cdHJldHVybiB7XHJcblx0XHRyZXN0cmljdDogJ0UnLFxyXG5cdFx0dGVtcGxhdGVVcmw6ICdqcy9zcmMvbWFpbi9kaXJlY3RpdmVzL3Jlc3VsdHNUaHVtYm5haWxzL3Jlc3VsdHNUaHVtYm5haWxzLmh0bWwnLFxyXG5cdFx0bGluazogZnVuY3Rpb24gKHNjb3BlKSB7XHJcblx0XHRcdHNjb3BlLmdldE9yZGVyQnkgPSBmdW5jdGlvbiAoKSB7XHJcblx0XHRcdFx0cmV0dXJuIChzY29wZS5kZXNpZ25FeHBsb3JlciAmJiBzY29wZS5kZXNpZ25FeHBsb3Jlci5zZWxlY3RlZFBhcmFtKSA/IHNjb3BlLmRlc2lnbkV4cGxvcmVyLnNlbGVjdGVkUGFyYW1bRGVzaWduRXhwbG9yZXIuZGF0YUtleV0gOiAnJztcclxuXHRcdFx0fTtcclxuXHRcdH1cclxuXHR9O1xyXG59KTtcclxuIiwiLyoqXHJcbiAqIEBtZW1iZXJPZiBhcHBcclxuICogQG5nZG9jIGRpcmVjdGl2ZVxyXG4gKiBAbmFtZSBzZWxlY3RlZEl0ZXJhdGlvblxyXG4gKiBAcGFyYW0ge3NlcnZpY2V9XHJcbiAqIEBkZXNjcmlwdGlvblxyXG4gKiAgIFRoZSBjdXJyZW50IHNlbGVjdGVkIGl0ZXJhdGlvbiBmb3IgaW5zcGVjdGlvblxyXG4gKi9cclxuYXBwLmRpcmVjdGl2ZSgnc2VsZWN0ZWRJdGVyYXRpb24nLCBmdW5jdGlvbiAoJHRpbWVvdXQpIHtcclxuXHRyZXR1cm4ge1xyXG5cdFx0cmVzdHJpY3Q6ICdFJyxcclxuXHRcdHRlbXBsYXRlVXJsOiAnanMvc3JjL21haW4vZGlyZWN0aXZlcy9zZWxlY3RlZEl0ZXJhdGlvbi9zZWxlY3RlZEl0ZXJhdGlvbi5odG1sJyxcclxuXHRcdGxpbms6IGZ1bmN0aW9uIChzY29wZSkge1xyXG5cdFx0fVxyXG5cdH07XHJcbn0pO1xyXG4iLCIvKipcclxuICogQmFzZSBzdGF0ZSBmb3IgYWxsIG5lc3RlZCBmdXR1cmUgc3RhdGVzIHdlIG1heSBoYXZlXHJcbiAqL1xyXG5hcHAuY29uZmlnKGZ1bmN0aW9uICgkc3RhdGVQcm92aWRlcikge1xyXG5cdCRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdyb290Jywge1xyXG5cdFx0bmFtZTogJ3Jvb3QnLFxyXG5cdFx0Ly8gYWJzdHJhY3Q6IHRydWUsXHJcblx0XHR1cmw6ICcvJyxcclxuXHRcdHRlbXBsYXRlVXJsOiAnanMvc3JjL21haW4vc3RhdGVzL3Jvb3Qvcm9vdC5odG1sJyxcclxuXHRcdGNvbnRyb2xsZXI6ICdSb290U3RhdGVDdHJsJ1xyXG5cdH0pO1xyXG59KTtcclxuXHJcbmFwcC5jb250cm9sbGVyKCdSb290U3RhdGVDdHJsJywgZnVuY3Rpb24gKCRyb290U2NvcGUsICRzY29wZSwgJHRpbWVvdXQpIHtcclxuXHJcblx0dmFyIGRlc2lnbkV4cGxvcmVyO1xyXG5cclxuXHR2YXIgc3BlY3Q7XHJcblxyXG5cdHZhciBpc0Z1bGxzY3JlZW4gPSBmYWxzZTtcclxuXHJcblx0ZDMuY3N2KFwiZGVzaWduX2V4cGxvcmVyX2RhdGEva3BmLzIwMTYwODExX0RhdGFUYWJsZV9Gb3JtYXR0ZWQuY3N2XCIpXHJcblx0XHQuZ2V0KGZ1bmN0aW9uIChlcnJvciwgcm93cykge1xyXG5cdFx0XHQkc2NvcGUuZGVzaWduRXhwbG9yZXIgPSBuZXcgRGVzaWduRXhwbG9yZXIocm93cyk7XHJcblx0XHR9KTtcclxuXHJcblx0JHNjb3BlLnZpZXdNb2RlID0gJ3RodW1ibmFpbHMnO1xyXG5cclxuXHQkc2NvcGUuc2VsZWN0ZWRJdGVyYXRpb24gPSBudWxsO1xyXG5cclxuXHQkc2NvcGUuRGVzaWduRXhwbG9yZXIgPSB7XHJcblx0XHQndHlwZURpc3BsYXlEaWN0aW9uYXJ5JzogRGVzaWduRXhwbG9yZXIudHlwZURpc3BsYXlEaWN0aW9uYXJ5XHJcblx0fTtcclxuXHJcblx0JHRpbWVvdXQoZnVuY3Rpb24gKCkge1xyXG5cdFx0c3BlY3QgPSBuZXcgU1BFQ1RBQ0xFUygkKCcjc3BlY3RhY2xlcy1jb250YWluZXInKSk7XHJcblx0fSk7XHJcblxyXG5cdC8qXHJcblx04paI4paI4paI4paI4paI4paI4paIICDilojilojilojilojilojiloggIOKWiOKWiOKWiOKWiOKWiOKWiCAg4paI4paI4paI4paI4paI4paIICDilojilojilojilojilojilojiloggICAgIOKWiOKWiOKWiOKWiOKWiOKWiOKWiCDilojilojiloggICAg4paI4paIXHJcblx04paI4paIICAgICAg4paI4paIICAgICAg4paI4paIICAgIOKWiOKWiCDilojiloggICDilojilogg4paI4paIICAgICAgICAgIOKWiOKWiCAgICAgIOKWiOKWiOKWiOKWiCAgIOKWiOKWiFxyXG5cdOKWiOKWiOKWiOKWiOKWiOKWiOKWiCDilojiloggICAgICDilojiloggICAg4paI4paIIOKWiOKWiOKWiOKWiOKWiOKWiCAg4paI4paI4paI4paI4paIICAgICAgIOKWiOKWiOKWiOKWiOKWiCAgIOKWiOKWiCDilojiloggIOKWiOKWiFxyXG5cdCAgICAg4paI4paIIOKWiOKWiCAgICAgIOKWiOKWiCAgICDilojilogg4paI4paIICAgICAg4paI4paIICAgICAgICAgIOKWiOKWiCAgICAgIOKWiOKWiCAg4paI4paIIOKWiOKWiFxyXG5cdOKWiOKWiOKWiOKWiOKWiOKWiOKWiCAg4paI4paI4paI4paI4paI4paIICDilojilojilojilojilojiloggIOKWiOKWiCAgICAgIOKWiOKWiOKWiOKWiOKWiOKWiOKWiCAgICAg4paI4paIICAgICAg4paI4paIICAg4paI4paI4paI4paIXHJcblx0Ki9cclxuXHJcblx0JHNjb3BlLnNlbGVjdEl0ZXJhdGlvbiA9IGZ1bmN0aW9uIChpdGVyYXRpb24pIHtcclxuXHRcdCRzY29wZS5yZXN1bHRNb2RlID0gJ2ltYWdlJztcclxuXHRcdCRzY29wZS5zZWxlY3RlZEl0ZXJhdGlvbiA9IGl0ZXJhdGlvbjtcclxuXHRcdGlmICghaXRlcmF0aW9uKSByZXR1cm47XHJcblx0XHQkc2NvcGUuZGVzaWduRXhwbG9yZXIucG9wdWxhdGVJdGVyYXRpb25UYWJsZSgkKCcjc2VsZWN0ZWQtaXRlcmF0aW9uLWluZm8nKSwgaXRlcmF0aW9uKTtcclxuXHRcdCRzY29wZS5kZXNpZ25FeHBsb3Jlci5ncmFwaHMucGFyY29vcmRzLmNsZWFyKCdoaWdobGlnaHQnKTtcclxuXHRcdCR0aW1lb3V0KGZ1bmN0aW9uICgpIHtcclxuXHRcdFx0JHNjb3BlLmRlc2lnbkV4cGxvcmVyLmdyYXBocy5wYXJjb29yZHMuaGlnaGxpZ2h0KFtpdGVyYXRpb25dKTtcclxuXHRcdH0pO1xyXG5cdH07XHJcblxyXG5cdCRzY29wZS5zZXQyZE1vZGUgPSBmdW5jdGlvbiAoKSB7XHJcblx0XHQkc2NvcGUucmVzdWx0TW9kZSA9ICdpbWFnZSc7XHJcblx0fTtcclxuXHJcblx0JHNjb3BlLnNldDNkTW9kZSA9IGZ1bmN0aW9uICgpIHtcclxuXHRcdGlmICghJHNjb3BlLnNlbGVjdGVkSXRlcmF0aW9uKSByZXR1cm47XHJcblx0XHQkc2NvcGUucmVzdWx0TW9kZSA9ICczZCc7XHJcblx0XHRkMy5qc29uKCRzY29wZS5zZWxlY3RlZEl0ZXJhdGlvbi50aHJlZUQsIGZ1bmN0aW9uIChkYXRhKSB7XHJcblx0XHRcdHNwZWN0LmxvYWROZXdNb2RlbChkYXRhKTtcclxuXHRcdH0pO1xyXG5cdFx0JHRpbWVvdXQoZnVuY3Rpb24gKCkge1xyXG5cdFx0XHQkKCcjc3BlY3RhY2xlcy1jb250YWluZXInKVxyXG5cdFx0XHRcdC50cmlnZ2VyKCdyZXNpemUnKTtcclxuXHRcdH0pO1xyXG5cdH07XHJcblxyXG5cdCRzY29wZS50b2dnbGVGdWxsc2NyZWVuID0gZnVuY3Rpb24gKCkge1xyXG5cclxuXHRcdHZhciBkaXYgPSAkKCcjc2VsZWN0ZWQtcmVzdWx0Jyk7XHJcblx0XHR2YXIgb3RoZXJEaXZzID0gJCgnLmhpZGUtaW4tZnVsbHNjcmVlbicpO1xyXG5cclxuXHRcdGlmICghaXNGdWxsc2NyZWVuKSB7XHJcblx0XHRcdGRpdi5hZGRDbGFzcygnZnVsbC1zY3JlZW4nKTtcclxuXHRcdFx0b3RoZXJEaXZzLmhpZGUoKTtcclxuXHRcdH0gZWxzZSB7XHJcblx0XHRcdGRpdi5yZW1vdmVDbGFzcygnZnVsbC1zY3JlZW4nKTtcclxuXHRcdFx0b3RoZXJEaXZzLnNob3coKTtcclxuXHRcdH1cclxuXHJcblx0XHQkKCcjc3BlY3RhY2xlcy1jb250YWluZXInKVxyXG5cdFx0XHQudHJpZ2dlcigncmVzaXplJyk7XHJcblxyXG5cdFx0aXNGdWxsc2NyZWVuID0gIWlzRnVsbHNjcmVlbjtcclxuXHR9O1xyXG5cclxuXHJcblxyXG5cdC8qXHJcblx04paI4paIICAgICDilojiloggIOKWiOKWiOKWiOKWiOKWiCAg4paI4paI4paI4paI4paI4paI4paI4paIICDilojilojilojilojilojilogg4paI4paIICAg4paI4paIXHJcblx04paI4paIICAgICDilojilogg4paI4paIICAg4paI4paIICAgIOKWiOKWiCAgICDilojiloggICAgICDilojiloggICDilojilohcclxuXHTilojiloggIOKWiCAg4paI4paIIOKWiOKWiOKWiOKWiOKWiOKWiOKWiCAgICDilojiloggICAg4paI4paIICAgICAg4paI4paI4paI4paI4paI4paI4paIXHJcblx04paI4paIIOKWiOKWiOKWiCDilojilogg4paI4paIICAg4paI4paIICAgIOKWiOKWiCAgICDilojiloggICAgICDilojiloggICDilojilohcclxuXHQg4paI4paI4paIIOKWiOKWiOKWiCAg4paI4paIICAg4paI4paIICAgIOKWiOKWiCAgICAg4paI4paI4paI4paI4paI4paIIOKWiOKWiCAgIOKWiOKWiFxyXG5cdCovXHJcblxyXG5cdCRzY29wZS4kd2F0Y2goJ2Rlc2lnbkV4cGxvcmVyJywgZHJhd0Rlc2lnbkV4cGxvcmVyKTtcclxuXHJcblxyXG5cclxuXHQvKlxyXG5cdCDilojilojilojilojiloggIOKWiOKWiOKWiCAgICDilojiloggIOKWiOKWiOKWiOKWiOKWiOKWiCAg4paI4paI4paIICAgIOKWiOKWiFxyXG5cdOKWiOKWiCAgIOKWiOKWiCDilojilojilojiloggICDilojilogg4paI4paIICAgIOKWiOKWiCDilojilojilojiloggICDilojilohcclxuXHTilojilojilojilojilojilojilogg4paI4paIIOKWiOKWiCAg4paI4paIIOKWiOKWiCAgICDilojilogg4paI4paIIOKWiOKWiCAg4paI4paIXHJcblx04paI4paIICAg4paI4paIIOKWiOKWiCAg4paI4paIIOKWiOKWiCDilojiloggICAg4paI4paIIOKWiOKWiCAg4paI4paIIOKWiOKWiFxyXG5cdOKWiOKWiCAgIOKWiOKWiCDilojiloggICDilojilojilojiloggIOKWiOKWiOKWiOKWiOKWiOKWiCAg4paI4paIICAg4paI4paI4paI4paIXHJcblx0Ki9cclxuXHJcblx0ZnVuY3Rpb24gZHJhd0Rlc2lnbkV4cGxvcmVyKCkge1xyXG5cdFx0JHRpbWVvdXQoZnVuY3Rpb24gKCkge1xyXG5cdFx0XHRpZiAoJHNjb3BlLmRlc2lnbkV4cGxvcmVyKSB7XHJcblx0XHRcdFx0JHNjb3BlLmRlc2lnbkV4cGxvcmVyLnBhcmNvb3Jkc19jcmVhdGUoJyNwYXJhbGxlbC1jb29yZHMnKTtcclxuXHRcdFx0XHRzZXRGaWx0ZXJlZEVudHJpZXMoKTtcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0JHNjb3BlLmRlc2lnbkV4cGxvcmVyLmFic3RyYWN0X3BhcmNvb3Jkc19wb3N0UmVuZGVyID0gc2V0RmlsdGVyZWRFbnRyaWVzO1xyXG5cdFx0fSk7XHJcblx0fVxyXG5cclxuXHRmdW5jdGlvbiBzZXRGaWx0ZXJlZEVudHJpZXMoKSB7XHJcblx0XHQkc2NvcGUuZmlsdGVyZWRFbnRyaWVzID0gJHNjb3BlLmRlc2lnbkV4cGxvcmVyLmdyYXBocy5wYXJjb29yZHMuYnJ1c2hlZCgpIHx8ICRzY29wZS5kZXNpZ25FeHBsb3Jlci5nZXREYXRhKCk7XHJcblx0XHQkc2NvcGUuc2VsZWN0SXRlcmF0aW9uKG51bGwpO1xyXG5cdFx0JHRpbWVvdXQoZnVuY3Rpb24gKCkge1xyXG5cdFx0XHQkc2NvcGUuJGFwcGx5KCk7XHJcblx0XHR9KTtcclxuXHR9XHJcblxyXG59KTtcclxuIl19
