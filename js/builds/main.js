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
		if(!iteration) return;
		$scope.designExplorer.populateIterationTable($('#selected-iteration-info'),iteration);
		$scope.designExplorer.graphs.parcoords.clear('highlight');
		$timeout(function(){
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
				$scope.designExplorer.graphs.parcoords.on('brush', setFilteredEntries);
				setFilteredEntries();
			}
		});
	}

	function setFilteredEntries(entries) {
		$scope.filteredEntries = entries || $scope.designExplorer.getData();
		$scope.selectIteration(null);
		$timeout(function () {
			$scope.$apply();
		});
	}

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

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImhlYWRlci5qcyIsInN0YXRlcy9kZWZhdWx0LmpzIiwiZmlsdGVycy90eXBlT2YuanMiLCJkaXJlY3RpdmVzL2FuaW1hdGVkUmVzdWx0cy9hbmltYXRlZFJlc3VsdHMuanMiLCJkaXJlY3RpdmVzL25hdmJhci9uYXZiYXIuanMiLCJkaXJlY3RpdmVzL2JvdHRvbU5hdi9ib3R0b21OYXYuanMiLCJkaXJlY3RpdmVzL3Jlc3VsdHNUaHVtYm5haWxzL3Jlc3VsdHNUaHVtYm5haWxzLmpzIiwic3RhdGVzL3Jvb3Qvcm9vdC5qcyIsImRpcmVjdGl2ZXMvc2VsZWN0ZWRJdGVyYXRpb24vc2VsZWN0ZWRJdGVyYXRpb24uanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ1BBO0FBQ0E7QUFDQTtBQUNBO0FDSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDbklBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNoQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3ZEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDbkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDL0dBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxyXG4gKiBBbmd1bGFyIGFwcGxpY2F0aW9uLiBTZWUgQW5ndWxhci1zcGVjaWZpYyBkb2N1bWVudGF0aW9uIGZvciBhbnl0aGluZyBpbnNpZGVcclxuICogb2YgYXBwLnNvbWV0aGluZy5cclxuICogQHR5cGUge29iamVjdH1cclxuICogQGdsb2JhbFxyXG4gKi9cclxudmFyIGFwcCA9IGFuZ3VsYXIubW9kdWxlKCdkZXNpZ25leHBsb3Jlci5kZW1vJywgWyd1aS5yb3V0ZXInXSk7XHJcbiIsImFwcC5jb25maWcoZnVuY3Rpb24oJHVybFJvdXRlclByb3ZpZGVyKSB7XHJcbiAgJHVybFJvdXRlclByb3ZpZGVyLm90aGVyd2lzZSgnLycpO1xyXG59KTtcclxuIiwiYXBwLmZpbHRlcigndHlwZW9mJywgZnVuY3Rpb24oKSB7XHJcbiAgcmV0dXJuIGZ1bmN0aW9uKG9iaikge1xyXG4gICAgcmV0dXJuIHR5cGVvZiBvYmo7XHJcbiAgfTtcclxufSk7XHJcbiIsIi8qKlxyXG4gKiBAbWVtYmVyT2YgYXBwXHJcbiAqIEBuZ2RvYyBkaXJlY3RpdmVcclxuICogQG5hbWUgYW5pbWF0ZWRSZXN1bHRzXHJcbiAqIEBwYXJhbSB7c2VydmljZX1cclxuICogQGRlc2NyaXB0aW9uXHJcbiAqICAgQW5pbWF0ZWQgcmVzdWx0c1xyXG4gKi9cclxuYXBwLmRpcmVjdGl2ZSgnYW5pbWF0ZWRSZXN1bHRzJywgZnVuY3Rpb24gKCR0aW1lb3V0KSB7XHJcblx0cmV0dXJuIHtcclxuXHRcdHJlc3RyaWN0OiAnRScsXHJcblx0XHR0ZW1wbGF0ZVVybDogJ2pzL3NyYy9tYWluL2RpcmVjdGl2ZXMvYW5pbWF0ZWRSZXN1bHRzL2FuaW1hdGVkUmVzdWx0cy5odG1sJyxcclxuXHRcdGxpbms6IGZ1bmN0aW9uIChzY29wZSkge1xyXG5cclxuXHRcdFx0c2NvcGUuY3VyRnJhbWUgPSAwO1xyXG5cdFx0XHRzY29wZS5mcmFtZXMgPSAwO1xyXG5cdFx0XHRzY29wZS5jdXJGcmFtZUluZm8gPSBudWxsO1xyXG5cdFx0XHRzY29wZS4kd2F0Y2goJ2ZpbHRlcmVkRW50cmllcycsIGNoZWNrV2hldGhlclRvQW5pbWF0ZSk7XHJcblx0XHRcdHNjb3BlLiR3YXRjaCgndmlld01vZGUnLCBjaGVja1doZXRoZXJUb0FuaW1hdGUpO1xyXG5cdFx0XHRzY29wZS4kd2F0Y2goJ3NlbGVjdGVkSXRlcmF0aW9uJywgY2hlY2tXaGV0aGVyVG9BbmltYXRlKTtcclxuXHJcblx0XHRcdHZhciBkZWJvdW5jZU5leHQ7XHJcblx0XHRcdHZhciBhbmltYXRlU3BlZWQgPSAzMDA7XHJcblx0XHRcdHZhciBpc0FuaW1hdGluZyA9IGZhbHNlO1xyXG5cclxuXHRcdFx0LypcclxuXHRcdFx0IOKWiOKWiOKWiOKWiOKWiCAg4paI4paI4paIICAgIOKWiOKWiCAg4paI4paI4paI4paI4paI4paIICDilojilojiloggICAg4paI4paIXHJcblx0XHRcdOKWiOKWiCAgIOKWiOKWiCDilojilojilojiloggICDilojilogg4paI4paIICAgIOKWiOKWiCDilojilojilojiloggICDilojilohcclxuXHRcdFx04paI4paI4paI4paI4paI4paI4paIIOKWiOKWiCDilojiloggIOKWiOKWiCDilojiloggICAg4paI4paIIOKWiOKWiCDilojiloggIOKWiOKWiFxyXG5cdFx0XHTilojiloggICDilojilogg4paI4paIICDilojilogg4paI4paIIOKWiOKWiCAgICDilojilogg4paI4paIICDilojilogg4paI4paIXHJcblx0XHRcdOKWiOKWiCAgIOKWiOKWiCDilojiloggICDilojilojilojiloggIOKWiOKWiOKWiOKWiOKWiOKWiCAg4paI4paIICAg4paI4paI4paI4paIXHJcblx0XHRcdCovXHJcblxyXG5cdFx0XHQvKipcclxuXHRcdFx0ICogQ2hlY2sgd2hldGhlciB3ZSBzaG91bGQgbW92ZSBmb3J3YXJkIHdpdGggYW5pbWF0aW5nIG9yIHRlcm1pbmF0ZSBhIHByZXZpb3VzIGFuaW1hdGlvblxyXG5cdFx0XHQgKi9cclxuXHRcdFx0ZnVuY3Rpb24gY2hlY2tXaGV0aGVyVG9BbmltYXRlKCkge1xyXG5cdFx0XHRcdGlmICghaXNBbmltYXRlTW9kZSgpIHx8IHNjb3BlLnNlbGVjdGVkSXRlcmF0aW9uKSB7XHJcblx0XHRcdFx0XHRjbGVhblByZXZpb3VzQW5pbWF0aW9uKCk7XHJcblx0XHRcdFx0fSBlbHNlIHtcclxuXHRcdFx0XHRcdHN0YXJ0TmV3QW5pbWF0aW9uKCk7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHQvKipcclxuXHRcdFx0ICogU3RhcnRzIGEgbmV3IGFuaW1hdGlvblxyXG5cdFx0XHQgKi9cclxuXHRcdFx0ZnVuY3Rpb24gc3RhcnROZXdBbmltYXRpb24oKSB7XHJcblx0XHRcdFx0aWYgKCFzY29wZS5maWx0ZXJlZEVudHJpZXMgfHwgIWlzQW5pbWF0ZU1vZGUoKSkgcmV0dXJuO1xyXG5cdFx0XHRcdGlmICghc2NvcGUuZmlsdGVyZWRFbnRyaWVzLmxlbmd0aCkge1xyXG5cdFx0XHRcdFx0JCgnI2FuaW1hdGVkLXJlc3VsdHMnKVxyXG5cdFx0XHRcdFx0XHQuYXR0cignc3JjJywgJycpO1xyXG5cdFx0XHRcdFx0JCgnI2N1ci1mcmFtZS1pbmZvJylcclxuXHRcdFx0XHRcdFx0Lmh0bWwoJycpO1xyXG5cdFx0XHRcdH1cclxuXHJcblx0XHRcdFx0c2NvcGUuY3VyRnJhbWUgPSAwO1xyXG5cdFx0XHRcdHNjb3BlLmZyYW1lcyA9IHNjb3BlLmZpbHRlcmVkRW50cmllcy5sZW5ndGg7XHJcblxyXG5cdFx0XHRcdHZhciBuZXdBbmltYXRlU3BlZWQgPSBNYXRoLm1heCgxMDAwMDAgLyBzY29wZS5mcmFtZXMsIDMwMCk7IC8vIG1pbiBkZWJvdW5jZSB0aW1lXHJcblx0XHRcdFx0bmV3QW5pbWF0ZVNwZWVkID0gTWF0aC5taW4obmV3QW5pbWF0ZVNwZWVkLCAxNTAwKTsgLy8gbWF4IGRlYm91bmNlIHRpbWVcclxuXHRcdFx0XHRhbmltYXRlU3BlZWQgPSBuZXdBbmltYXRlU3BlZWQ7XHJcblxyXG5cdFx0XHRcdGlmICghaXNBbmltYXRpbmcpIGFuaW1hdGUoKTtcclxuXHRcdFx0XHRpc0FuaW1hdGluZyA9IHRydWU7XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdC8qKlxyXG5cdFx0XHQgKiBBbmltYXRlIGxvb3BcclxuXHRcdFx0ICovXHJcblx0XHRcdGZ1bmN0aW9uIGFuaW1hdGUoKSB7XHJcblx0XHRcdFx0aWYgKCFpc0FuaW1hdGVNb2RlKCkpIHtcclxuXHRcdFx0XHRcdGlzQW5pbWF0aW5nID0gZmFsc2U7XHJcblx0XHRcdFx0XHRyZXR1cm47XHJcblx0XHRcdFx0fSBlbHNlIHtcclxuXHRcdFx0XHRcdHNob3dOZXh0RnJhbWUoKTtcclxuXHRcdFx0XHRcdHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xyXG5cdFx0XHRcdFx0XHRhbmltYXRlKCk7XHJcblx0XHRcdFx0XHR9LCBhbmltYXRlU3BlZWQpO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0LyoqXHJcblx0XHRcdCAqIENvZGUgdG8gbW92ZSBmb3J3YXJkIGEgZnJhbWUuIENhbGxlZCBmcm9tIHRoZSBhbmltYXRlIGxvb3AuXHJcblx0XHRcdCAqL1xyXG5cdFx0XHRmdW5jdGlvbiBzaG93TmV4dEZyYW1lKCkge1xyXG5cdFx0XHRcdGlmICghaXNBbmltYXRlTW9kZSgpKSByZXR1cm47XHJcblx0XHRcdFx0Y2xlYW5QcmV2aW91c0FuaW1hdGlvbigpO1xyXG5cclxuXHRcdFx0XHRpZiAoIXNjb3BlLmZpbHRlcmVkRW50cmllcyB8fCAhc2NvcGUuZmlsdGVyZWRFbnRyaWVzLmxlbmd0aCkgcmV0dXJuO1xyXG5cdFx0XHRcdHNjb3BlLmN1ckZyYW1lSW5mbyA9IHNjb3BlLmZpbHRlcmVkRW50cmllc1tzY29wZS5jdXJGcmFtZV07XHJcblxyXG5cdFx0XHRcdCQoJyNhbmltYXRlZC1yZXN1bHRzJylcclxuXHRcdFx0XHRcdC5hdHRyKCdzcmMnLCBzY29wZS5jdXJGcmFtZUluZm8uaW1nKTtcclxuXHJcblx0XHRcdFx0JCgnI2FuaW1hdGVkLXJlc3VsdHMnKVxyXG5cdFx0XHRcdFx0Lm9uKCdjbGljaycsIGZ1bmN0aW9uICgpIHtcclxuXHRcdFx0XHRcdFx0Y2xlYW5QcmV2aW91c0FuaW1hdGlvbigpO1xyXG5cdFx0XHRcdFx0XHRzY29wZS52aWV3TW9kZT0ndGh1bWJuYWlscyc7XHJcblx0XHRcdFx0XHRcdCR0aW1lb3V0KGZ1bmN0aW9uKCl7XHJcblx0XHRcdFx0XHRcdFx0c2NvcGUuc2VsZWN0SXRlcmF0aW9uKHNjb3BlLmN1ckZyYW1lSW5mbyk7XHJcblx0XHRcdFx0XHRcdH0pO1xyXG5cdFx0XHRcdFx0fSk7XHJcblxyXG5cdFx0XHRcdHZhciBpbmZvQm94ID0gJCgnI2N1ci1mcmFtZS1pbmZvJyk7XHJcblxyXG5cdFx0XHRcdHNjb3BlLmRlc2lnbkV4cGxvcmVyLnBvcHVsYXRlSXRlcmF0aW9uVGFibGUoaW5mb0JveCwgc2NvcGUuY3VyRnJhbWVJbmZvKTtcclxuXHJcblx0XHRcdFx0c2NvcGUuZGVzaWduRXhwbG9yZXIuZ3JhcGhzLnBhcmNvb3Jkcy5oaWdobGlnaHQoW3Njb3BlLmN1ckZyYW1lSW5mb10pO1xyXG5cclxuXHRcdFx0XHRzY29wZS5jdXJGcmFtZSArPSAxO1xyXG5cdFx0XHRcdGlmIChzY29wZS5jdXJGcmFtZSA+PSBzY29wZS5mcmFtZXMpIHNjb3BlLmN1ckZyYW1lID0gMDtcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0LyoqXHJcblx0XHRcdCAqIENsZWFuIGxlZnRvdmVyIHN0dWZmIGZyb20gYSBwcmV2aW91cyBhbmltYXRpb25cclxuXHRcdFx0ICovXHJcblx0XHRcdGZ1bmN0aW9uIGNsZWFuUHJldmlvdXNBbmltYXRpb24oKSB7XHJcblx0XHRcdFx0aWYgKHNjb3BlLmRlc2lnbkV4cGxvcmVyICYmIHNjb3BlLmRlc2lnbkV4cGxvcmVyLmdyYXBocy5wYXJjb29yZHMpIHNjb3BlLmRlc2lnbkV4cGxvcmVyLmdyYXBocy5wYXJjb29yZHMudW5oaWdobGlnaHQoKTtcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0LyoqXHJcblx0XHRcdCAqIFdoZXRoZXIgd2UncmUgY3VycmVudGx5IGluIGFuaW1hdGlvbiBtb2RlXHJcblx0XHRcdCAqIEByZXR1cm4ge0Jvb2xlYW59XHJcblx0XHRcdCAqL1xyXG5cdFx0XHRmdW5jdGlvbiBpc0FuaW1hdGVNb2RlKCkge1xyXG5cdFx0XHRcdHJldHVybiBzY29wZS52aWV3TW9kZSA9PT0gJ2FuaW1hdGlvbic7XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHR9O1xyXG59KTtcclxuIiwiLyoqXHJcbiAqIEBtZW1iZXJPZiBhcHBcclxuICogQG5nZG9jIGRpcmVjdGl2ZVxyXG4gKiBAbmFtZSBuYXZiYXJcclxuICogQHBhcmFtIHtzZXJ2aWNlfVxyXG4gKiBAZGVzY3JpcHRpb25cclxuICogICBOYXZiYXIuIERvZXNuJ3QgcmVhbGx5IGRvIGFueXRoaW5nIGludGVyZXN0aW5nIHlldC5cclxuICovXHJcbmFwcC5kaXJlY3RpdmUoJ25hdmJhcicsIGZ1bmN0aW9uKCkge1xyXG5cdHJldHVybiB7XHJcblx0XHRyZXN0cmljdDogJ0UnLFxyXG5cdFx0dGVtcGxhdGVVcmw6ICdqcy9zcmMvbWFpbi9kaXJlY3RpdmVzL25hdmJhci9uYXZiYXIuaHRtbCcsXHJcblx0XHRsaW5rOiBmdW5jdGlvbihzY29wZSkge1xyXG5cdFx0fVxyXG5cdH07XHJcbn0pO1xyXG4iLCIvKipcclxuICogQG1lbWJlck9mIGFwcFxyXG4gKiBAbmdkb2MgZGlyZWN0aXZlXHJcbiAqIEBuYW1lIGJvdHRvbU5hdlxyXG4gKiBAcGFyYW0ge3NlcnZpY2V9XHJcbiAqIEBkZXNjcmlwdGlvblxyXG4gKiAgIFJlc2l6YWJsZSBib3R0b20gbmF2aWdhdGlvblxyXG4gKi9cclxuYXBwLmRpcmVjdGl2ZSgnYm90dG9tTmF2JywgZnVuY3Rpb24gKCR0aW1lb3V0KSB7XHJcblx0cmV0dXJuIHtcclxuXHRcdHJlc3RyaWN0OiAnRScsXHJcblx0XHR0ZW1wbGF0ZVVybDogJ2pzL3NyYy9tYWluL2RpcmVjdGl2ZXMvYm90dG9tTmF2L2JvdHRvbU5hdi5odG1sJyxcclxuXHRcdGxpbms6IGZ1bmN0aW9uIChzY29wZSkge1xyXG5cclxuXHRcdFx0JHRpbWVvdXQoaW5pdEpxdWVyeSk7XHJcblxyXG5cdFx0XHRmdW5jdGlvbiBpbml0SnF1ZXJ5KCkge1xyXG5cclxuXHRcdFx0XHR2YXIgYm90dG9tYmFyID0gJCgnLmJvdHRvbS1uYXYnKTtcclxuXHJcblx0XHRcdFx0Ly8gYm90dG9tYmFyLnJlc2l6YWJsZSh7XHJcblx0XHRcdFx0Ly8gXHRoYW5kbGVzOiB7XHJcblx0XHRcdFx0Ly8gXHRcdCduJzogJyNoYW5kbGUnXHJcblx0XHRcdFx0Ly8gXHR9XHJcblx0XHRcdFx0Ly8gfSk7XHJcblx0XHRcdFx0Ly9cclxuXHRcdFx0XHQvLyBib3R0b21iYXIub24oJ3Jlc2l6ZScsIHJlc3BvbmRUb1Jlc2l6ZSk7XHJcblxyXG5cdFx0XHRcdCQod2luZG93KVxyXG5cdFx0XHRcdFx0Lm9uKCdyZXNpemUnLCByZXNwb25kVG9SZXNpemUpO1xyXG5cclxuXHRcdFx0XHRyZXNwb25kVG9SZXNpemUoKTtcclxuXHJcblx0XHRcdFx0ZnVuY3Rpb24gcmVzcG9uZFRvUmVzaXplKCkge1xyXG5cclxuXHRcdFx0XHRcdHZhciBwYXJhbGxlbERpdiA9ICQoJyNwYXJhbGxlbC1jb29yZHMnKTtcclxuXHJcblx0XHRcdFx0XHQvLyAkKCcjbWFpbi1jb250ZW50LWZsb3cnKVxyXG5cdFx0XHRcdFx0Ly8gXHQuY3NzKCdwYWRkaW5nLWJvdHRvbScsIGJvdHRvbWJhci5oZWlnaHQoKSsxNTApO1xyXG5cclxuXHRcdFx0XHRcdCQoJyNtYWluLWNvbnRlbnQtZmxvdycpXHJcblx0XHRcdFx0XHRcdC5jc3MoJ21heC1oZWlnaHQnLCAoJCh3aW5kb3cudG9wKVxyXG5cdFx0XHRcdFx0XHRcdC5oZWlnaHQoKSAtIGJvdHRvbWJhci5vdXRlckhlaWdodCgpIC0gMTMwKSArICdweCcpO1xyXG5cclxuXHJcblx0XHRcdFx0XHQvLyBwYXJhbGxlbERpdi5jc3MoJ2hlaWdodCcsIGJvdHRvbWJhci5oZWlnaHQoKSAtIDMwKTtcclxuXHRcdFx0XHRcdC8vIHBhcmFsbGVsRGl2LmNzcygnd2lkdGgnLCBib3R0b21iYXIud2lkdGgoKSAtIDMwKTtcclxuXHRcdFx0XHRcdC8vIGlmIChzY29wZS5kZXNpZ25FeHBsb3Jlcikge1xyXG5cdFx0XHRcdFx0Ly8gXHRzY29wZS5kZXNpZ25FeHBsb3Jlci5yZW5kZXJQYXJhbGxlbENvb3JkaW5hdGVzKCk7XHJcblx0XHRcdFx0XHQvLyB9XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9XHJcblx0XHR9XHJcblx0fTtcclxufSk7XHJcbiIsIi8qKlxyXG4gKiBAbWVtYmVyT2YgYXBwXHJcbiAqIEBuZ2RvYyBkaXJlY3RpdmVcclxuICogQG5hbWUgcmVzdWx0c1RodW1ibmFpbHNcclxuICogQHBhcmFtIHtzZXJ2aWNlfVxyXG4gKiBAZGVzY3JpcHRpb25cclxuICogICBUaHVtYm5haWxzIG9mIHJlc3VsdHNcclxuICovXHJcbmFwcC5kaXJlY3RpdmUoJ3Jlc3VsdHNUaHVtYm5haWxzJywgZnVuY3Rpb24gKCR0aW1lb3V0KSB7XHJcblx0cmV0dXJuIHtcclxuXHRcdHJlc3RyaWN0OiAnRScsXHJcblx0XHR0ZW1wbGF0ZVVybDogJ2pzL3NyYy9tYWluL2RpcmVjdGl2ZXMvcmVzdWx0c1RodW1ibmFpbHMvcmVzdWx0c1RodW1ibmFpbHMuaHRtbCcsXHJcblx0XHRsaW5rOiBmdW5jdGlvbiAoc2NvcGUpIHtcclxuXHRcdFx0c2NvcGUuZ2V0T3JkZXJCeSA9IGZ1bmN0aW9uICgpIHtcclxuXHRcdFx0XHRyZXR1cm4gKHNjb3BlLmRlc2lnbkV4cGxvcmVyICYmIHNjb3BlLmRlc2lnbkV4cGxvcmVyLnNlbGVjdGVkUGFyYW0pID8gc2NvcGUuZGVzaWduRXhwbG9yZXIuc2VsZWN0ZWRQYXJhbVtEZXNpZ25FeHBsb3Jlci5kYXRhS2V5XSA6ICcnO1xyXG5cdFx0XHR9O1xyXG5cdFx0fVxyXG5cdH07XHJcbn0pO1xyXG4iLCIvKipcclxuICogQmFzZSBzdGF0ZSBmb3IgYWxsIG5lc3RlZCBmdXR1cmUgc3RhdGVzIHdlIG1heSBoYXZlXHJcbiAqL1xyXG5hcHAuY29uZmlnKGZ1bmN0aW9uICgkc3RhdGVQcm92aWRlcikge1xyXG5cdCRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdyb290Jywge1xyXG5cdFx0bmFtZTogJ3Jvb3QnLFxyXG5cdFx0Ly8gYWJzdHJhY3Q6IHRydWUsXHJcblx0XHR1cmw6ICcvJyxcclxuXHRcdHRlbXBsYXRlVXJsOiAnanMvc3JjL21haW4vc3RhdGVzL3Jvb3Qvcm9vdC5odG1sJyxcclxuXHRcdGNvbnRyb2xsZXI6ICdSb290U3RhdGVDdHJsJ1xyXG5cdH0pO1xyXG59KTtcclxuXHJcbmFwcC5jb250cm9sbGVyKCdSb290U3RhdGVDdHJsJywgZnVuY3Rpb24gKCRyb290U2NvcGUsICRzY29wZSwgJHRpbWVvdXQpIHtcclxuXHJcblx0dmFyIGRlc2lnbkV4cGxvcmVyO1xyXG5cclxuXHR2YXIgc3BlY3Q7XHJcblxyXG5cdGQzLmNzdihcImRlc2lnbl9leHBsb3Jlcl9kYXRhL2twZi8yMDE2MDgxMV9EYXRhVGFibGVfRm9ybWF0dGVkLmNzdlwiKVxyXG5cdFx0LmdldChmdW5jdGlvbiAoZXJyb3IsIHJvd3MpIHtcclxuXHRcdFx0JHNjb3BlLmRlc2lnbkV4cGxvcmVyID0gbmV3IERlc2lnbkV4cGxvcmVyKHJvd3MpO1xyXG5cdFx0fSk7XHJcblxyXG5cdCRzY29wZS52aWV3TW9kZSA9ICd0aHVtYm5haWxzJztcclxuXHJcblx0JHNjb3BlLnNlbGVjdGVkSXRlcmF0aW9uID0gbnVsbDtcclxuXHJcblx0JHNjb3BlLkRlc2lnbkV4cGxvcmVyID0ge1xyXG5cdFx0J3R5cGVEaXNwbGF5RGljdGlvbmFyeSc6IERlc2lnbkV4cGxvcmVyLnR5cGVEaXNwbGF5RGljdGlvbmFyeVxyXG5cdH07XHJcblxyXG5cdCR0aW1lb3V0KGZ1bmN0aW9uICgpIHtcclxuXHRcdHNwZWN0ID0gbmV3IFNQRUNUQUNMRVMoJCgnI3NwZWN0YWNsZXMtY29udGFpbmVyJykpO1xyXG5cdH0pO1xyXG5cclxuXHQvKlxyXG5cdOKWiOKWiOKWiOKWiOKWiOKWiOKWiCAg4paI4paI4paI4paI4paI4paIICDilojilojilojilojilojiloggIOKWiOKWiOKWiOKWiOKWiOKWiCAg4paI4paI4paI4paI4paI4paI4paIICAgICDilojilojilojilojilojilojilogg4paI4paI4paIICAgIOKWiOKWiFxyXG5cdOKWiOKWiCAgICAgIOKWiOKWiCAgICAgIOKWiOKWiCAgICDilojilogg4paI4paIICAg4paI4paIIOKWiOKWiCAgICAgICAgICDilojiloggICAgICDilojilojilojiloggICDilojilohcclxuXHTilojilojilojilojilojilojilogg4paI4paIICAgICAg4paI4paIICAgIOKWiOKWiCDilojilojilojilojilojiloggIOKWiOKWiOKWiOKWiOKWiCAgICAgICDilojilojilojilojiloggICDilojilogg4paI4paIICDilojilohcclxuXHQgICAgIOKWiOKWiCDilojiloggICAgICDilojiloggICAg4paI4paIIOKWiOKWiCAgICAgIOKWiOKWiCAgICAgICAgICDilojiloggICAgICDilojiloggIOKWiOKWiCDilojilohcclxuXHTilojilojilojilojilojilojiloggIOKWiOKWiOKWiOKWiOKWiOKWiCAg4paI4paI4paI4paI4paI4paIICDilojiloggICAgICDilojilojilojilojilojilojiloggICAgIOKWiOKWiCAgICAgIOKWiOKWiCAgIOKWiOKWiOKWiOKWiFxyXG5cdCovXHJcblxyXG5cdCRzY29wZS5zZWxlY3RJdGVyYXRpb24gPSBmdW5jdGlvbiAoaXRlcmF0aW9uKSB7XHJcblx0XHQkc2NvcGUucmVzdWx0TW9kZSA9ICdpbWFnZSc7XHJcblx0XHQkc2NvcGUuc2VsZWN0ZWRJdGVyYXRpb24gPSBpdGVyYXRpb247XHJcblx0XHRpZighaXRlcmF0aW9uKSByZXR1cm47XHJcblx0XHQkc2NvcGUuZGVzaWduRXhwbG9yZXIucG9wdWxhdGVJdGVyYXRpb25UYWJsZSgkKCcjc2VsZWN0ZWQtaXRlcmF0aW9uLWluZm8nKSxpdGVyYXRpb24pO1xyXG5cdFx0JHNjb3BlLmRlc2lnbkV4cGxvcmVyLmdyYXBocy5wYXJjb29yZHMuY2xlYXIoJ2hpZ2hsaWdodCcpO1xyXG5cdFx0JHRpbWVvdXQoZnVuY3Rpb24oKXtcclxuXHRcdFx0JHNjb3BlLmRlc2lnbkV4cGxvcmVyLmdyYXBocy5wYXJjb29yZHMuaGlnaGxpZ2h0KFtpdGVyYXRpb25dKTtcclxuXHRcdH0pO1x0XHRcclxuXHR9O1xyXG5cclxuXHQkc2NvcGUuc2V0MmRNb2RlID0gZnVuY3Rpb24gKCkge1xyXG5cdFx0JHNjb3BlLnJlc3VsdE1vZGUgPSAnaW1hZ2UnO1xyXG5cdH07XHJcblxyXG5cdCRzY29wZS5zZXQzZE1vZGUgPSBmdW5jdGlvbiAoKSB7XHJcblx0XHRpZiAoISRzY29wZS5zZWxlY3RlZEl0ZXJhdGlvbikgcmV0dXJuO1xyXG5cdFx0JHNjb3BlLnJlc3VsdE1vZGUgPSAnM2QnO1xyXG5cdFx0ZDMuanNvbigkc2NvcGUuc2VsZWN0ZWRJdGVyYXRpb24udGhyZWVELCBmdW5jdGlvbiAoZGF0YSkge1xyXG5cdFx0XHRzcGVjdC5sb2FkTmV3TW9kZWwoZGF0YSk7XHJcblx0XHR9KTtcclxuXHRcdCR0aW1lb3V0KGZ1bmN0aW9uICgpIHtcclxuXHRcdFx0JCgnI3NwZWN0YWNsZXMtY29udGFpbmVyJylcclxuXHRcdFx0XHQudHJpZ2dlcigncmVzaXplJyk7XHJcblx0XHR9KTtcclxuXHR9O1xyXG5cclxuXHJcblxyXG5cdC8qXHJcblx04paI4paIICAgICDilojiloggIOKWiOKWiOKWiOKWiOKWiCAg4paI4paI4paI4paI4paI4paI4paI4paIICDilojilojilojilojilojilogg4paI4paIICAg4paI4paIXHJcblx04paI4paIICAgICDilojilogg4paI4paIICAg4paI4paIICAgIOKWiOKWiCAgICDilojiloggICAgICDilojiloggICDilojilohcclxuXHTilojiloggIOKWiCAg4paI4paIIOKWiOKWiOKWiOKWiOKWiOKWiOKWiCAgICDilojiloggICAg4paI4paIICAgICAg4paI4paI4paI4paI4paI4paI4paIXHJcblx04paI4paIIOKWiOKWiOKWiCDilojilogg4paI4paIICAg4paI4paIICAgIOKWiOKWiCAgICDilojiloggICAgICDilojiloggICDilojilohcclxuXHQg4paI4paI4paIIOKWiOKWiOKWiCAg4paI4paIICAg4paI4paIICAgIOKWiOKWiCAgICAg4paI4paI4paI4paI4paI4paIIOKWiOKWiCAgIOKWiOKWiFxyXG5cdCovXHJcblxyXG5cdCRzY29wZS4kd2F0Y2goJ2Rlc2lnbkV4cGxvcmVyJywgZHJhd0Rlc2lnbkV4cGxvcmVyKTtcclxuXHJcblxyXG5cdC8qXHJcblx0IOKWiOKWiOKWiOKWiOKWiCAg4paI4paI4paIICAgIOKWiOKWiCAg4paI4paI4paI4paI4paI4paIICDilojilojiloggICAg4paI4paIXHJcblx04paI4paIICAg4paI4paIIOKWiOKWiOKWiOKWiCAgIOKWiOKWiCDilojiloggICAg4paI4paIIOKWiOKWiOKWiOKWiCAgIOKWiOKWiFxyXG5cdOKWiOKWiOKWiOKWiOKWiOKWiOKWiCDilojilogg4paI4paIICDilojilogg4paI4paIICAgIOKWiOKWiCDilojilogg4paI4paIICDilojilohcclxuXHTilojiloggICDilojilogg4paI4paIICDilojilogg4paI4paIIOKWiOKWiCAgICDilojilogg4paI4paIICDilojilogg4paI4paIXHJcblx04paI4paIICAg4paI4paIIOKWiOKWiCAgIOKWiOKWiOKWiOKWiCAg4paI4paI4paI4paI4paI4paIICDilojiloggICDilojilojilojilohcclxuXHQqL1xyXG5cclxuXHRmdW5jdGlvbiBkcmF3RGVzaWduRXhwbG9yZXIoKSB7XHJcblx0XHQkdGltZW91dChmdW5jdGlvbiAoKSB7XHJcblx0XHRcdGlmICgkc2NvcGUuZGVzaWduRXhwbG9yZXIpIHtcclxuXHRcdFx0XHQkc2NvcGUuZGVzaWduRXhwbG9yZXIucGFyY29vcmRzX2NyZWF0ZSgnI3BhcmFsbGVsLWNvb3JkcycpO1xyXG5cdFx0XHRcdCRzY29wZS5kZXNpZ25FeHBsb3Jlci5ncmFwaHMucGFyY29vcmRzLm9uKCdicnVzaCcsIHNldEZpbHRlcmVkRW50cmllcyk7XHJcblx0XHRcdFx0c2V0RmlsdGVyZWRFbnRyaWVzKCk7XHJcblx0XHRcdH1cclxuXHRcdH0pO1xyXG5cdH1cclxuXHJcblx0ZnVuY3Rpb24gc2V0RmlsdGVyZWRFbnRyaWVzKGVudHJpZXMpIHtcclxuXHRcdCRzY29wZS5maWx0ZXJlZEVudHJpZXMgPSBlbnRyaWVzIHx8ICRzY29wZS5kZXNpZ25FeHBsb3Jlci5nZXREYXRhKCk7XHJcblx0XHQkc2NvcGUuc2VsZWN0SXRlcmF0aW9uKG51bGwpO1xyXG5cdFx0JHRpbWVvdXQoZnVuY3Rpb24gKCkge1xyXG5cdFx0XHQkc2NvcGUuJGFwcGx5KCk7XHJcblx0XHR9KTtcclxuXHR9XHJcblxyXG59KTtcclxuIiwiLyoqXHJcbiAqIEBtZW1iZXJPZiBhcHBcclxuICogQG5nZG9jIGRpcmVjdGl2ZVxyXG4gKiBAbmFtZSBzZWxlY3RlZEl0ZXJhdGlvblxyXG4gKiBAcGFyYW0ge3NlcnZpY2V9XHJcbiAqIEBkZXNjcmlwdGlvblxyXG4gKiAgIFRoZSBjdXJyZW50IHNlbGVjdGVkIGl0ZXJhdGlvbiBmb3IgaW5zcGVjdGlvblxyXG4gKi9cclxuYXBwLmRpcmVjdGl2ZSgnc2VsZWN0ZWRJdGVyYXRpb24nLCBmdW5jdGlvbiAoJHRpbWVvdXQpIHtcclxuXHRyZXR1cm4ge1xyXG5cdFx0cmVzdHJpY3Q6ICdFJyxcclxuXHRcdHRlbXBsYXRlVXJsOiAnanMvc3JjL21haW4vZGlyZWN0aXZlcy9zZWxlY3RlZEl0ZXJhdGlvbi9zZWxlY3RlZEl0ZXJhdGlvbi5odG1sJyxcclxuXHRcdGxpbms6IGZ1bmN0aW9uIChzY29wZSkge1xyXG5cdFx0fVxyXG5cdH07XHJcbn0pO1xyXG4iXX0=
