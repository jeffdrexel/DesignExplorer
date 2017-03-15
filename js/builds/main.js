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
		url: '/',
		templateUrl: 'js/src/main/states/root/root.html',
		controller: 'RootStateCtrl'
	});
});

app.controller('RootStateCtrl', function ($rootScope, $scope, $timeout) {

	var designExplorer;

	d3.csv("design_explorer_data/kpf/20160811_DataTable_Formatted.csv")
		.get(function (error, rows) {
			$scope.designExplorer = new DesignExplorer(rows);
		});

	$scope.viewMode = 'thumbnails';

	$scope.selectedIteration = null;

	$scope.DesignExplorer = {
		'typeDisplayDictionary': DesignExplorer.typeDisplayDictionary
	};

	/*
	███████  ██████  ██████  ██████  ███████     ███████ ███    ██
	██      ██      ██    ██ ██   ██ ██          ██      ████   ██
	███████ ██      ██    ██ ██████  █████       █████   ██ ██  ██
	     ██ ██      ██    ██ ██      ██          ██      ██  ██ ██
	███████  ██████  ██████  ██      ███████     ██      ██   ████
	*/

	$scope.selectIteration = function (iteration) {
		$scope.selectedIteration = iteration;
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
				var paramTypes = Object.keys(scope.designExplorer.params);

				infoBox.html('');

				paramTypes.forEach(function (key) {
					var type = DesignExplorer.typeDisplayDictionary[key];
					var table = $('<table class="table table-condensed"></table>');
					var params = scope.designExplorer.params[key];
					params.forEach(function (param) {
						var row = $('<tr></tr>');
						row.append('<td>' + param.display + '</td>');
						row.append('<td>' + scope.curFrameInfo[param[DesignExplorer.dataKey]] + '</td>');
						table.append(row);

						if (param === scope.designExplorer.selectedParam) row.css('border-left', '5px solid ' + scope.designExplorer.colorer(scope.curFrameInfo))
							.css('font-weight', 'bold');
					});
					infoBox.append('<h4>' + type.display + 's</h4>');
					infoBox.append(table);
				});

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

					$('#main-content-flow')
						.css('padding-bottom', bottombar.height()+150);


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

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImhlYWRlci5qcyIsImZpbHRlcnMvdHlwZU9mLmpzIiwic3RhdGVzL2RlZmF1bHQuanMiLCJzdGF0ZXMvcm9vdC9yb290LmpzIiwiZGlyZWN0aXZlcy9hbmltYXRlZFJlc3VsdHMvYW5pbWF0ZWRSZXN1bHRzLmpzIiwiZGlyZWN0aXZlcy9uYXZiYXIvbmF2YmFyLmpzIiwiZGlyZWN0aXZlcy9ib3R0b21OYXYvYm90dG9tTmF2LmpzIiwiZGlyZWN0aXZlcy9yZXN1bHRzVGh1bWJuYWlscy9yZXN1bHRzVGh1bWJuYWlscy5qcyIsImRpcmVjdGl2ZXMvc2VsZWN0ZWRJdGVyYXRpb24vc2VsZWN0ZWRJdGVyYXRpb24uanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ1BBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ0xBO0FBQ0E7QUFDQTtBQUNBO0FDSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNqRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDNUlBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNoQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ2pEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDbkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxyXG4gKiBBbmd1bGFyIGFwcGxpY2F0aW9uLiBTZWUgQW5ndWxhci1zcGVjaWZpYyBkb2N1bWVudGF0aW9uIGZvciBhbnl0aGluZyBpbnNpZGVcclxuICogb2YgYXBwLnNvbWV0aGluZy5cclxuICogQHR5cGUge29iamVjdH1cclxuICogQGdsb2JhbFxyXG4gKi9cclxudmFyIGFwcCA9IGFuZ3VsYXIubW9kdWxlKCdkZXNpZ25leHBsb3Jlci5kZW1vJywgWyd1aS5yb3V0ZXInXSk7XHJcbiIsImFwcC5maWx0ZXIoJ3R5cGVvZicsIGZ1bmN0aW9uKCkge1xyXG4gIHJldHVybiBmdW5jdGlvbihvYmopIHtcclxuICAgIHJldHVybiB0eXBlb2Ygb2JqO1xyXG4gIH07XHJcbn0pO1xyXG4iLCJhcHAuY29uZmlnKGZ1bmN0aW9uKCR1cmxSb3V0ZXJQcm92aWRlcikge1xyXG4gICR1cmxSb3V0ZXJQcm92aWRlci5vdGhlcndpc2UoJy8nKTtcclxufSk7XHJcbiIsIi8qKlxyXG4gKiBCYXNlIHN0YXRlIGZvciBhbGwgbmVzdGVkIGZ1dHVyZSBzdGF0ZXMgd2UgbWF5IGhhdmVcclxuICovXHJcbmFwcC5jb25maWcoZnVuY3Rpb24gKCRzdGF0ZVByb3ZpZGVyKSB7XHJcblx0JHN0YXRlUHJvdmlkZXIuc3RhdGUoJ3Jvb3QnLCB7XHJcblx0XHRuYW1lOiAncm9vdCcsXHJcblx0XHQvLyBhYnN0cmFjdDogdHJ1ZSxcclxuXHRcdHVybDogJy8nLFxyXG5cdFx0dGVtcGxhdGVVcmw6ICdqcy9zcmMvbWFpbi9zdGF0ZXMvcm9vdC9yb290Lmh0bWwnLFxyXG5cdFx0Y29udHJvbGxlcjogJ1Jvb3RTdGF0ZUN0cmwnXHJcblx0fSk7XHJcbn0pO1xyXG5cclxuYXBwLmNvbnRyb2xsZXIoJ1Jvb3RTdGF0ZUN0cmwnLCBmdW5jdGlvbiAoJHJvb3RTY29wZSwgJHNjb3BlLCAkdGltZW91dCkge1xyXG5cclxuXHR2YXIgZGVzaWduRXhwbG9yZXI7XHJcblxyXG5cdGQzLmNzdihcImRlc2lnbl9leHBsb3Jlcl9kYXRhL2twZi8yMDE2MDgxMV9EYXRhVGFibGVfRm9ybWF0dGVkLmNzdlwiKVxyXG5cdFx0LmdldChmdW5jdGlvbiAoZXJyb3IsIHJvd3MpIHtcclxuXHRcdFx0JHNjb3BlLmRlc2lnbkV4cGxvcmVyID0gbmV3IERlc2lnbkV4cGxvcmVyKHJvd3MpO1xyXG5cdFx0fSk7XHJcblxyXG5cdCRzY29wZS52aWV3TW9kZSA9ICd0aHVtYm5haWxzJztcclxuXHJcblx0JHNjb3BlLnNlbGVjdGVkSXRlcmF0aW9uID0gbnVsbDtcclxuXHJcblx0JHNjb3BlLkRlc2lnbkV4cGxvcmVyID0ge1xyXG5cdFx0J3R5cGVEaXNwbGF5RGljdGlvbmFyeSc6IERlc2lnbkV4cGxvcmVyLnR5cGVEaXNwbGF5RGljdGlvbmFyeVxyXG5cdH07XHJcblxyXG5cdC8qXHJcblx04paI4paI4paI4paI4paI4paI4paIICDilojilojilojilojilojiloggIOKWiOKWiOKWiOKWiOKWiOKWiCAg4paI4paI4paI4paI4paI4paIICDilojilojilojilojilojilojiloggICAgIOKWiOKWiOKWiOKWiOKWiOKWiOKWiCDilojilojiloggICAg4paI4paIXHJcblx04paI4paIICAgICAg4paI4paIICAgICAg4paI4paIICAgIOKWiOKWiCDilojiloggICDilojilogg4paI4paIICAgICAgICAgIOKWiOKWiCAgICAgIOKWiOKWiOKWiOKWiCAgIOKWiOKWiFxyXG5cdOKWiOKWiOKWiOKWiOKWiOKWiOKWiCDilojiloggICAgICDilojiloggICAg4paI4paIIOKWiOKWiOKWiOKWiOKWiOKWiCAg4paI4paI4paI4paI4paIICAgICAgIOKWiOKWiOKWiOKWiOKWiCAgIOKWiOKWiCDilojiloggIOKWiOKWiFxyXG5cdCAgICAg4paI4paIIOKWiOKWiCAgICAgIOKWiOKWiCAgICDilojilogg4paI4paIICAgICAg4paI4paIICAgICAgICAgIOKWiOKWiCAgICAgIOKWiOKWiCAg4paI4paIIOKWiOKWiFxyXG5cdOKWiOKWiOKWiOKWiOKWiOKWiOKWiCAg4paI4paI4paI4paI4paI4paIICDilojilojilojilojilojiloggIOKWiOKWiCAgICAgIOKWiOKWiOKWiOKWiOKWiOKWiOKWiCAgICAg4paI4paIICAgICAg4paI4paIICAg4paI4paI4paI4paIXHJcblx0Ki9cclxuXHJcblx0JHNjb3BlLnNlbGVjdEl0ZXJhdGlvbiA9IGZ1bmN0aW9uIChpdGVyYXRpb24pIHtcclxuXHRcdCRzY29wZS5zZWxlY3RlZEl0ZXJhdGlvbiA9IGl0ZXJhdGlvbjtcclxuXHR9O1xyXG5cclxuXHJcblxyXG5cdC8qXHJcblx04paI4paIICAgICDilojiloggIOKWiOKWiOKWiOKWiOKWiCAg4paI4paI4paI4paI4paI4paI4paI4paIICDilojilojilojilojilojilogg4paI4paIICAg4paI4paIXHJcblx04paI4paIICAgICDilojilogg4paI4paIICAg4paI4paIICAgIOKWiOKWiCAgICDilojiloggICAgICDilojiloggICDilojilohcclxuXHTilojiloggIOKWiCAg4paI4paIIOKWiOKWiOKWiOKWiOKWiOKWiOKWiCAgICDilojiloggICAg4paI4paIICAgICAg4paI4paI4paI4paI4paI4paI4paIXHJcblx04paI4paIIOKWiOKWiOKWiCDilojilogg4paI4paIICAg4paI4paIICAgIOKWiOKWiCAgICDilojiloggICAgICDilojiloggICDilojilohcclxuXHQg4paI4paI4paIIOKWiOKWiOKWiCAg4paI4paIICAg4paI4paIICAgIOKWiOKWiCAgICAg4paI4paI4paI4paI4paI4paIIOKWiOKWiCAgIOKWiOKWiFxyXG5cdCovXHJcblxyXG5cdCRzY29wZS4kd2F0Y2goJ2Rlc2lnbkV4cGxvcmVyJywgZHJhd0Rlc2lnbkV4cGxvcmVyKTtcclxuXHJcblxyXG5cdC8qXHJcblx0IOKWiOKWiOKWiOKWiOKWiCAg4paI4paI4paIICAgIOKWiOKWiCAg4paI4paI4paI4paI4paI4paIICDilojilojiloggICAg4paI4paIXHJcblx04paI4paIICAg4paI4paIIOKWiOKWiOKWiOKWiCAgIOKWiOKWiCDilojiloggICAg4paI4paIIOKWiOKWiOKWiOKWiCAgIOKWiOKWiFxyXG5cdOKWiOKWiOKWiOKWiOKWiOKWiOKWiCDilojilogg4paI4paIICDilojilogg4paI4paIICAgIOKWiOKWiCDilojilogg4paI4paIICDilojilohcclxuXHTilojiloggICDilojilogg4paI4paIICDilojilogg4paI4paIIOKWiOKWiCAgICDilojilogg4paI4paIICDilojilogg4paI4paIXHJcblx04paI4paIICAg4paI4paIIOKWiOKWiCAgIOKWiOKWiOKWiOKWiCAg4paI4paI4paI4paI4paI4paIICDilojiloggICDilojilojilojilohcclxuXHQqL1xyXG5cclxuXHRmdW5jdGlvbiBkcmF3RGVzaWduRXhwbG9yZXIoKSB7XHJcblx0XHQkdGltZW91dChmdW5jdGlvbiAoKSB7XHJcblx0XHRcdGlmICgkc2NvcGUuZGVzaWduRXhwbG9yZXIpIHtcclxuXHRcdFx0XHQkc2NvcGUuZGVzaWduRXhwbG9yZXIuZHJhd1BhcmFsbGVsQ29vcmRpbmF0ZXMoJyNwYXJhbGxlbC1jb29yZHMnKTtcclxuXHRcdFx0XHQkc2NvcGUuZGVzaWduRXhwbG9yZXIuZ3JhcGhzLnBhcmNvb3Jkcy5vbignYnJ1c2gnLCBzZXRGaWx0ZXJlZEVudHJpZXMpO1xyXG5cdFx0XHRcdHNldEZpbHRlcmVkRW50cmllcygpO1xyXG5cdFx0XHR9XHJcblx0XHR9KTtcclxuXHR9XHJcblxyXG5cdGZ1bmN0aW9uIHNldEZpbHRlcmVkRW50cmllcyhlbnRyaWVzKSB7XHJcblx0XHQkc2NvcGUuZmlsdGVyZWRFbnRyaWVzID0gZW50cmllcyB8fCAkc2NvcGUuZGVzaWduRXhwbG9yZXIuZ2V0RGF0YSgpO1xyXG5cdFx0JHRpbWVvdXQoZnVuY3Rpb24gKCkge1xyXG5cdFx0XHQkc2NvcGUuJGFwcGx5KCk7XHJcblx0XHR9KTtcclxuXHR9XHJcblxyXG59KTtcclxuIiwiLyoqXHJcbiAqIEBtZW1iZXJPZiBhcHBcclxuICogQG5nZG9jIGRpcmVjdGl2ZVxyXG4gKiBAbmFtZSBhbmltYXRlZFJlc3VsdHNcclxuICogQHBhcmFtIHtzZXJ2aWNlfVxyXG4gKiBAZGVzY3JpcHRpb25cclxuICogICBBbmltYXRlZCByZXN1bHRzXHJcbiAqL1xyXG5hcHAuZGlyZWN0aXZlKCdhbmltYXRlZFJlc3VsdHMnLCBmdW5jdGlvbiAoJHRpbWVvdXQpIHtcclxuXHRyZXR1cm4ge1xyXG5cdFx0cmVzdHJpY3Q6ICdFJyxcclxuXHRcdHRlbXBsYXRlVXJsOiAnanMvc3JjL21haW4vZGlyZWN0aXZlcy9hbmltYXRlZFJlc3VsdHMvYW5pbWF0ZWRSZXN1bHRzLmh0bWwnLFxyXG5cdFx0bGluazogZnVuY3Rpb24gKHNjb3BlKSB7XHJcblxyXG5cdFx0XHRzY29wZS5jdXJGcmFtZSA9IDA7XHJcblx0XHRcdHNjb3BlLmZyYW1lcyA9IDA7XHJcblx0XHRcdHNjb3BlLmN1ckZyYW1lSW5mbyA9IG51bGw7XHJcblx0XHRcdHNjb3BlLiR3YXRjaCgnZmlsdGVyZWRFbnRyaWVzJywgY2hlY2tXaGV0aGVyVG9BbmltYXRlKTtcclxuXHRcdFx0c2NvcGUuJHdhdGNoKCd2aWV3TW9kZScsIGNoZWNrV2hldGhlclRvQW5pbWF0ZSk7XHJcblx0XHRcdHNjb3BlLiR3YXRjaCgnc2VsZWN0ZWRJdGVyYXRpb24nLCBjaGVja1doZXRoZXJUb0FuaW1hdGUpO1xyXG5cclxuXHRcdFx0dmFyIGRlYm91bmNlTmV4dDtcclxuXHRcdFx0dmFyIGFuaW1hdGVTcGVlZCA9IDMwMDtcclxuXHRcdFx0dmFyIGlzQW5pbWF0aW5nID0gZmFsc2U7XHJcblxyXG5cdFx0XHQvKlxyXG5cdFx0XHQg4paI4paI4paI4paI4paIICDilojilojiloggICAg4paI4paIICDilojilojilojilojilojiloggIOKWiOKWiOKWiCAgICDilojilohcclxuXHRcdFx04paI4paIICAg4paI4paIIOKWiOKWiOKWiOKWiCAgIOKWiOKWiCDilojiloggICAg4paI4paIIOKWiOKWiOKWiOKWiCAgIOKWiOKWiFxyXG5cdFx0XHTilojilojilojilojilojilojilogg4paI4paIIOKWiOKWiCAg4paI4paIIOKWiOKWiCAgICDilojilogg4paI4paIIOKWiOKWiCAg4paI4paIXHJcblx0XHRcdOKWiOKWiCAgIOKWiOKWiCDilojiloggIOKWiOKWiCDilojilogg4paI4paIICAgIOKWiOKWiCDilojiloggIOKWiOKWiCDilojilohcclxuXHRcdFx04paI4paIICAg4paI4paIIOKWiOKWiCAgIOKWiOKWiOKWiOKWiCAg4paI4paI4paI4paI4paI4paIICDilojiloggICDilojilojilojilohcclxuXHRcdFx0Ki9cclxuXHJcblx0XHRcdC8qKlxyXG5cdFx0XHQgKiBDaGVjayB3aGV0aGVyIHdlIHNob3VsZCBtb3ZlIGZvcndhcmQgd2l0aCBhbmltYXRpbmcgb3IgdGVybWluYXRlIGEgcHJldmlvdXMgYW5pbWF0aW9uXHJcblx0XHRcdCAqL1xyXG5cdFx0XHRmdW5jdGlvbiBjaGVja1doZXRoZXJUb0FuaW1hdGUoKSB7XHJcblx0XHRcdFx0aWYgKCFpc0FuaW1hdGVNb2RlKCkgfHwgc2NvcGUuc2VsZWN0ZWRJdGVyYXRpb24pIHtcclxuXHRcdFx0XHRcdGNsZWFuUHJldmlvdXNBbmltYXRpb24oKTtcclxuXHRcdFx0XHR9IGVsc2Uge1xyXG5cdFx0XHRcdFx0c3RhcnROZXdBbmltYXRpb24oKTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdC8qKlxyXG5cdFx0XHQgKiBTdGFydHMgYSBuZXcgYW5pbWF0aW9uXHJcblx0XHRcdCAqL1xyXG5cdFx0XHRmdW5jdGlvbiBzdGFydE5ld0FuaW1hdGlvbigpIHtcclxuXHRcdFx0XHRpZiAoIXNjb3BlLmZpbHRlcmVkRW50cmllcyB8fCAhaXNBbmltYXRlTW9kZSgpKSByZXR1cm47XHJcblx0XHRcdFx0aWYgKCFzY29wZS5maWx0ZXJlZEVudHJpZXMubGVuZ3RoKSB7XHJcblx0XHRcdFx0XHQkKCcjYW5pbWF0ZWQtcmVzdWx0cycpXHJcblx0XHRcdFx0XHRcdC5hdHRyKCdzcmMnLCAnJyk7XHJcblx0XHRcdFx0XHQkKCcjY3VyLWZyYW1lLWluZm8nKVxyXG5cdFx0XHRcdFx0XHQuaHRtbCgnJyk7XHJcblx0XHRcdFx0fVxyXG5cclxuXHRcdFx0XHRzY29wZS5jdXJGcmFtZSA9IDA7XHJcblx0XHRcdFx0c2NvcGUuZnJhbWVzID0gc2NvcGUuZmlsdGVyZWRFbnRyaWVzLmxlbmd0aDtcclxuXHJcblx0XHRcdFx0dmFyIG5ld0FuaW1hdGVTcGVlZCA9IE1hdGgubWF4KDEwMDAwMCAvIHNjb3BlLmZyYW1lcywgMzAwKTsgLy8gbWluIGRlYm91bmNlIHRpbWVcclxuXHRcdFx0XHRuZXdBbmltYXRlU3BlZWQgPSBNYXRoLm1pbihuZXdBbmltYXRlU3BlZWQsIDE1MDApOyAvLyBtYXggZGVib3VuY2UgdGltZVxyXG5cdFx0XHRcdGFuaW1hdGVTcGVlZCA9IG5ld0FuaW1hdGVTcGVlZDtcclxuXHJcblx0XHRcdFx0aWYgKCFpc0FuaW1hdGluZykgYW5pbWF0ZSgpO1xyXG5cdFx0XHRcdGlzQW5pbWF0aW5nID0gdHJ1ZTtcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0LyoqXHJcblx0XHRcdCAqIEFuaW1hdGUgbG9vcFxyXG5cdFx0XHQgKi9cclxuXHRcdFx0ZnVuY3Rpb24gYW5pbWF0ZSgpIHtcclxuXHRcdFx0XHRpZiAoIWlzQW5pbWF0ZU1vZGUoKSkge1xyXG5cdFx0XHRcdFx0aXNBbmltYXRpbmcgPSBmYWxzZTtcclxuXHRcdFx0XHRcdHJldHVybjtcclxuXHRcdFx0XHR9IGVsc2Uge1xyXG5cdFx0XHRcdFx0c2hvd05leHRGcmFtZSgpO1xyXG5cdFx0XHRcdFx0c2V0VGltZW91dChmdW5jdGlvbiAoKSB7XHJcblx0XHRcdFx0XHRcdGFuaW1hdGUoKTtcclxuXHRcdFx0XHRcdH0sIGFuaW1hdGVTcGVlZCk7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHQvKipcclxuXHRcdFx0ICogQ29kZSB0byBtb3ZlIGZvcndhcmQgYSBmcmFtZS4gQ2FsbGVkIGZyb20gdGhlIGFuaW1hdGUgbG9vcC5cclxuXHRcdFx0ICovXHJcblx0XHRcdGZ1bmN0aW9uIHNob3dOZXh0RnJhbWUoKSB7XHJcblx0XHRcdFx0aWYgKCFpc0FuaW1hdGVNb2RlKCkpIHJldHVybjtcclxuXHRcdFx0XHRjbGVhblByZXZpb3VzQW5pbWF0aW9uKCk7XHJcblxyXG5cdFx0XHRcdGlmICghc2NvcGUuZmlsdGVyZWRFbnRyaWVzIHx8ICFzY29wZS5maWx0ZXJlZEVudHJpZXMubGVuZ3RoKSByZXR1cm47XHJcblx0XHRcdFx0c2NvcGUuY3VyRnJhbWVJbmZvID0gc2NvcGUuZmlsdGVyZWRFbnRyaWVzW3Njb3BlLmN1ckZyYW1lXTtcclxuXHJcblx0XHRcdFx0JCgnI2FuaW1hdGVkLXJlc3VsdHMnKVxyXG5cdFx0XHRcdFx0LmF0dHIoJ3NyYycsIHNjb3BlLmN1ckZyYW1lSW5mby5pbWcpO1xyXG5cclxuXHRcdFx0XHR2YXIgaW5mb0JveCA9ICQoJyNjdXItZnJhbWUtaW5mbycpO1xyXG5cdFx0XHRcdHZhciBwYXJhbVR5cGVzID0gT2JqZWN0LmtleXMoc2NvcGUuZGVzaWduRXhwbG9yZXIucGFyYW1zKTtcclxuXHJcblx0XHRcdFx0aW5mb0JveC5odG1sKCcnKTtcclxuXHJcblx0XHRcdFx0cGFyYW1UeXBlcy5mb3JFYWNoKGZ1bmN0aW9uIChrZXkpIHtcclxuXHRcdFx0XHRcdHZhciB0eXBlID0gRGVzaWduRXhwbG9yZXIudHlwZURpc3BsYXlEaWN0aW9uYXJ5W2tleV07XHJcblx0XHRcdFx0XHR2YXIgdGFibGUgPSAkKCc8dGFibGUgY2xhc3M9XCJ0YWJsZSB0YWJsZS1jb25kZW5zZWRcIj48L3RhYmxlPicpO1xyXG5cdFx0XHRcdFx0dmFyIHBhcmFtcyA9IHNjb3BlLmRlc2lnbkV4cGxvcmVyLnBhcmFtc1trZXldO1xyXG5cdFx0XHRcdFx0cGFyYW1zLmZvckVhY2goZnVuY3Rpb24gKHBhcmFtKSB7XHJcblx0XHRcdFx0XHRcdHZhciByb3cgPSAkKCc8dHI+PC90cj4nKTtcclxuXHRcdFx0XHRcdFx0cm93LmFwcGVuZCgnPHRkPicgKyBwYXJhbS5kaXNwbGF5ICsgJzwvdGQ+Jyk7XHJcblx0XHRcdFx0XHRcdHJvdy5hcHBlbmQoJzx0ZD4nICsgc2NvcGUuY3VyRnJhbWVJbmZvW3BhcmFtW0Rlc2lnbkV4cGxvcmVyLmRhdGFLZXldXSArICc8L3RkPicpO1xyXG5cdFx0XHRcdFx0XHR0YWJsZS5hcHBlbmQocm93KTtcclxuXHJcblx0XHRcdFx0XHRcdGlmIChwYXJhbSA9PT0gc2NvcGUuZGVzaWduRXhwbG9yZXIuc2VsZWN0ZWRQYXJhbSkgcm93LmNzcygnYm9yZGVyLWxlZnQnLCAnNXB4IHNvbGlkICcgKyBzY29wZS5kZXNpZ25FeHBsb3Jlci5jb2xvcmVyKHNjb3BlLmN1ckZyYW1lSW5mbykpXHJcblx0XHRcdFx0XHRcdFx0LmNzcygnZm9udC13ZWlnaHQnLCAnYm9sZCcpO1xyXG5cdFx0XHRcdFx0fSk7XHJcblx0XHRcdFx0XHRpbmZvQm94LmFwcGVuZCgnPGg0PicgKyB0eXBlLmRpc3BsYXkgKyAnczwvaDQ+Jyk7XHJcblx0XHRcdFx0XHRpbmZvQm94LmFwcGVuZCh0YWJsZSk7XHJcblx0XHRcdFx0fSk7XHJcblxyXG5cdFx0XHRcdHNjb3BlLmRlc2lnbkV4cGxvcmVyLmdyYXBocy5wYXJjb29yZHMuaGlnaGxpZ2h0KFtzY29wZS5jdXJGcmFtZUluZm9dKTtcclxuXHJcblx0XHRcdFx0c2NvcGUuY3VyRnJhbWUgKz0gMTtcclxuXHRcdFx0XHRpZiAoc2NvcGUuY3VyRnJhbWUgPj0gc2NvcGUuZnJhbWVzKSBzY29wZS5jdXJGcmFtZSA9IDA7XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdC8qKlxyXG5cdFx0XHQgKiBDbGVhbiBsZWZ0b3ZlciBzdHVmZiBmcm9tIGEgcHJldmlvdXMgYW5pbWF0aW9uXHJcblx0XHRcdCAqL1xyXG5cdFx0XHRmdW5jdGlvbiBjbGVhblByZXZpb3VzQW5pbWF0aW9uKCkge1xyXG5cdFx0XHRcdGlmIChzY29wZS5kZXNpZ25FeHBsb3JlciAmJiBzY29wZS5kZXNpZ25FeHBsb3Jlci5ncmFwaHMucGFyY29vcmRzKSBzY29wZS5kZXNpZ25FeHBsb3Jlci5ncmFwaHMucGFyY29vcmRzLnVuaGlnaGxpZ2h0KCk7XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdC8qKlxyXG5cdFx0XHQgKiBXaGV0aGVyIHdlJ3JlIGN1cnJlbnRseSBpbiBhbmltYXRpb24gbW9kZVxyXG5cdFx0XHQgKiBAcmV0dXJuIHtCb29sZWFufVxyXG5cdFx0XHQgKi9cclxuXHRcdFx0ZnVuY3Rpb24gaXNBbmltYXRlTW9kZSgpIHtcclxuXHRcdFx0XHRyZXR1cm4gc2NvcGUudmlld01vZGUgPT09ICdhbmltYXRpb24nO1xyXG5cdFx0XHR9XHJcblx0XHR9XHJcblx0fTtcclxufSk7XHJcbiIsIi8qKlxyXG4gKiBAbWVtYmVyT2YgYXBwXHJcbiAqIEBuZ2RvYyBkaXJlY3RpdmVcclxuICogQG5hbWUgbmF2YmFyXHJcbiAqIEBwYXJhbSB7c2VydmljZX1cclxuICogQGRlc2NyaXB0aW9uXHJcbiAqICAgTmF2YmFyLiBEb2Vzbid0IHJlYWxseSBkbyBhbnl0aGluZyBpbnRlcmVzdGluZyB5ZXQuXHJcbiAqL1xyXG5hcHAuZGlyZWN0aXZlKCduYXZiYXInLCBmdW5jdGlvbigpIHtcclxuXHRyZXR1cm4ge1xyXG5cdFx0cmVzdHJpY3Q6ICdFJyxcclxuXHRcdHRlbXBsYXRlVXJsOiAnanMvc3JjL21haW4vZGlyZWN0aXZlcy9uYXZiYXIvbmF2YmFyLmh0bWwnLFxyXG5cdFx0bGluazogZnVuY3Rpb24oc2NvcGUpIHtcclxuXHRcdH1cclxuXHR9O1xyXG59KTtcclxuIiwiLyoqXHJcbiAqIEBtZW1iZXJPZiBhcHBcclxuICogQG5nZG9jIGRpcmVjdGl2ZVxyXG4gKiBAbmFtZSBib3R0b21OYXZcclxuICogQHBhcmFtIHtzZXJ2aWNlfVxyXG4gKiBAZGVzY3JpcHRpb25cclxuICogICBSZXNpemFibGUgYm90dG9tIG5hdmlnYXRpb25cclxuICovXHJcbmFwcC5kaXJlY3RpdmUoJ2JvdHRvbU5hdicsIGZ1bmN0aW9uICgkdGltZW91dCkge1xyXG5cdHJldHVybiB7XHJcblx0XHRyZXN0cmljdDogJ0UnLFxyXG5cdFx0dGVtcGxhdGVVcmw6ICdqcy9zcmMvbWFpbi9kaXJlY3RpdmVzL2JvdHRvbU5hdi9ib3R0b21OYXYuaHRtbCcsXHJcblx0XHRsaW5rOiBmdW5jdGlvbiAoc2NvcGUpIHtcclxuXHJcblx0XHRcdCR0aW1lb3V0KGZ1bmN0aW9uICgpIHtcclxuXHJcblx0XHRcdFx0dmFyIGJvdHRvbWJhciA9ICQoJy5ib3R0b20tbmF2Jyk7XHJcblxyXG5cdFx0XHRcdC8vIGJvdHRvbWJhci5yZXNpemFibGUoe1xyXG5cdFx0XHRcdC8vIFx0aGFuZGxlczoge1xyXG5cdFx0XHRcdC8vIFx0XHQnbic6ICcjaGFuZGxlJ1xyXG5cdFx0XHRcdC8vIFx0fVxyXG5cdFx0XHRcdC8vIH0pO1xyXG5cdFx0XHRcdC8vXHJcblx0XHRcdFx0Ly8gYm90dG9tYmFyLm9uKCdyZXNpemUnLCByZXNwb25kVG9SZXNpemUpO1xyXG5cclxuXHRcdFx0XHQkKHdpbmRvdylcclxuXHRcdFx0XHRcdC5vbigncmVzaXplJywgcmVzcG9uZFRvUmVzaXplKTtcclxuXHJcblx0XHRcdFx0cmVzcG9uZFRvUmVzaXplKCk7XHJcblxyXG5cdFx0XHRcdGZ1bmN0aW9uIHJlc3BvbmRUb1Jlc2l6ZSgpIHtcclxuXHJcblx0XHRcdFx0XHR2YXIgcGFyYWxsZWxEaXYgPSAkKCcjcGFyYWxsZWwtY29vcmRzJyk7XHJcblxyXG5cdFx0XHRcdFx0JCgnI21haW4tY29udGVudC1mbG93JylcclxuXHRcdFx0XHRcdFx0LmNzcygncGFkZGluZy1ib3R0b20nLCBib3R0b21iYXIuaGVpZ2h0KCkrMTUwKTtcclxuXHJcblxyXG5cdFx0XHRcdFx0Ly8gcGFyYWxsZWxEaXYuY3NzKCdoZWlnaHQnLCBib3R0b21iYXIuaGVpZ2h0KCkgLSAzMCk7XHJcblx0XHRcdFx0XHQvLyBwYXJhbGxlbERpdi5jc3MoJ3dpZHRoJywgYm90dG9tYmFyLndpZHRoKCkgLSAzMCk7XHJcblx0XHRcdFx0XHQvLyBpZiAoc2NvcGUuZGVzaWduRXhwbG9yZXIpIHtcclxuXHRcdFx0XHRcdC8vIFx0c2NvcGUuZGVzaWduRXhwbG9yZXIucmVuZGVyUGFyYWxsZWxDb29yZGluYXRlcygpO1xyXG5cdFx0XHRcdFx0Ly8gfVxyXG5cdFx0XHRcdH1cclxuXHRcdFx0fSk7XHJcblx0XHR9XHJcblx0fTtcclxufSk7XHJcbiIsIi8qKlxyXG4gKiBAbWVtYmVyT2YgYXBwXHJcbiAqIEBuZ2RvYyBkaXJlY3RpdmVcclxuICogQG5hbWUgcmVzdWx0c1RodW1ibmFpbHNcclxuICogQHBhcmFtIHtzZXJ2aWNlfVxyXG4gKiBAZGVzY3JpcHRpb25cclxuICogICBUaHVtYm5haWxzIG9mIHJlc3VsdHNcclxuICovXHJcbmFwcC5kaXJlY3RpdmUoJ3Jlc3VsdHNUaHVtYm5haWxzJywgZnVuY3Rpb24gKCR0aW1lb3V0KSB7XHJcblx0cmV0dXJuIHtcclxuXHRcdHJlc3RyaWN0OiAnRScsXHJcblx0XHR0ZW1wbGF0ZVVybDogJ2pzL3NyYy9tYWluL2RpcmVjdGl2ZXMvcmVzdWx0c1RodW1ibmFpbHMvcmVzdWx0c1RodW1ibmFpbHMuaHRtbCcsXHJcblx0XHRsaW5rOiBmdW5jdGlvbiAoc2NvcGUpIHtcclxuXHRcdFx0c2NvcGUuZ2V0T3JkZXJCeSA9IGZ1bmN0aW9uICgpIHtcclxuXHRcdFx0XHRyZXR1cm4gKHNjb3BlLmRlc2lnbkV4cGxvcmVyICYmIHNjb3BlLmRlc2lnbkV4cGxvcmVyLnNlbGVjdGVkUGFyYW0pID8gc2NvcGUuZGVzaWduRXhwbG9yZXIuc2VsZWN0ZWRQYXJhbVtEZXNpZ25FeHBsb3Jlci5kYXRhS2V5XSA6ICcnO1xyXG5cdFx0XHR9O1xyXG5cdFx0fVxyXG5cdH07XHJcbn0pO1xyXG4iLCIvKipcclxuICogQG1lbWJlck9mIGFwcFxyXG4gKiBAbmdkb2MgZGlyZWN0aXZlXHJcbiAqIEBuYW1lIHNlbGVjdGVkSXRlcmF0aW9uXHJcbiAqIEBwYXJhbSB7c2VydmljZX1cclxuICogQGRlc2NyaXB0aW9uXHJcbiAqICAgVGhlIGN1cnJlbnQgc2VsZWN0ZWQgaXRlcmF0aW9uIGZvciBpbnNwZWN0aW9uXHJcbiAqL1xyXG5hcHAuZGlyZWN0aXZlKCdzZWxlY3RlZEl0ZXJhdGlvbicsIGZ1bmN0aW9uICgkdGltZW91dCkge1xyXG5cdHJldHVybiB7XHJcblx0XHRyZXN0cmljdDogJ0UnLFxyXG5cdFx0dGVtcGxhdGVVcmw6ICdqcy9zcmMvbWFpbi9kaXJlY3RpdmVzL3NlbGVjdGVkSXRlcmF0aW9uL3NlbGVjdGVkSXRlcmF0aW9uLmh0bWwnLFxyXG5cdFx0bGluazogZnVuY3Rpb24gKHNjb3BlKSB7XHJcblx0XHR9XHJcblx0fTtcclxufSk7XHJcbiJdfQ==
