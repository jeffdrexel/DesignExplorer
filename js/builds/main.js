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
			scope.$watch('filteredEntries', startNewAnimation);

			var debounceNext;
			var animateSpeed = 300;

			animate();

			function animate() {
				showNextFrame();
				setTimeout(function () {
					animate();
				}, animateSpeed);
			}

			function startNewAnimation() {
				if (!scope.filteredEntries) return;
				if (!scope.filteredEntries.length) {
					return $('#animated-results')
						.attr('src', '');
				}

				scope.curFrame = 0;
				scope.frames = scope.filteredEntries.length;

				var newAnimateSpeed = Math.max(100000 / scope.frames, 300); // min debounce time
				newAnimateSpeed = Math.min(newAnimateSpeed, 1500); // max debounce time
				animateSpeed = newAnimateSpeed;
			}

			function showNextFrame() {
				if (!scope.filteredEntries || !scope.filteredEntries.length) return;
				$('#animated-results')
					.attr('src', scope.filteredEntries[scope.curFrame].img);
				scope.curFrame += 1;
				if (scope.curFrame >= scope.frames) scope.curFrame = 0;
			}
		}
	};
});

/**
 * @memberOf app
 * @ngdoc directive
 * @name bottomNav
 * @param {service}
 * @description
 *   Navbar. Doesn't really do anything interesting yet.
 */
app.directive('bottomNav', function ($timeout) {
	return {
		restrict: 'E',
		templateUrl: 'js/src/main/directives/bottomNav/bottomNav.html',
		link: function (scope) {

			$timeout(function () {

				var bottombar = $('.bottom-nav');

				bottombar.resizable({
					handles: {
						'n': '#handle'
					}
				});

				bottombar.on('resize', resizeMainContent);

				resizeMainContent();

				function resizeMainContent(){
					$('#main-content-flow').css('padding-bottom',bottombar.height());
				}
			});
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

	d3.csv("design_explorer_data/default_onload.csv")
		.get(function (error, rows) {
			$scope.designExplorer = new DesignExplorer(rows);
		});



	/*
	██     ██  █████  ████████  ██████ ██   ██
	██     ██ ██   ██    ██    ██      ██   ██
	██  █  ██ ███████    ██    ██      ███████
	██ ███ ██ ██   ██    ██    ██      ██   ██
	 ███ ███  ██   ██    ██     ██████ ██   ██
	*/

	$scope.$watch('designExplorer', drawDesignExplorer);

	$(window)
		.on('resize', function () {
			// change height and stuff?
			if ($scope.designExplorer && $scope.designExplorer.graphs.parcoords) $scope.designExplorer.graphs.parcoords.render();
		});


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

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImhlYWRlci5qcyIsInN0YXRlcy9kZWZhdWx0LmpzIiwiZGlyZWN0aXZlcy9hbmltYXRlZFJlc3VsdHMvYW5pbWF0ZWRSZXN1bHRzLmpzIiwiZGlyZWN0aXZlcy9ib3R0b21OYXYvYm90dG9tTmF2LmpzIiwic3RhdGVzL3Jvb3Qvcm9vdC5qcyIsImRpcmVjdGl2ZXMvbmF2YmFyL25hdmJhci5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDUEE7QUFDQTtBQUNBO0FBQ0E7QUNIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDdkRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ25DQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDbkVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxyXG4gKiBBbmd1bGFyIGFwcGxpY2F0aW9uLiBTZWUgQW5ndWxhci1zcGVjaWZpYyBkb2N1bWVudGF0aW9uIGZvciBhbnl0aGluZyBpbnNpZGVcclxuICogb2YgYXBwLnNvbWV0aGluZy5cclxuICogQHR5cGUge29iamVjdH1cclxuICogQGdsb2JhbFxyXG4gKi9cclxudmFyIGFwcCA9IGFuZ3VsYXIubW9kdWxlKCdkZXNpZ25leHBsb3Jlci5kZW1vJywgWyd1aS5yb3V0ZXInXSk7XHJcbiIsImFwcC5jb25maWcoZnVuY3Rpb24oJHVybFJvdXRlclByb3ZpZGVyKSB7XHJcbiAgJHVybFJvdXRlclByb3ZpZGVyLm90aGVyd2lzZSgnLycpO1xyXG59KTtcclxuIiwiLyoqXHJcbiAqIEBtZW1iZXJPZiBhcHBcclxuICogQG5nZG9jIGRpcmVjdGl2ZVxyXG4gKiBAbmFtZSBhbmltYXRlZFJlc3VsdHNcclxuICogQHBhcmFtIHtzZXJ2aWNlfVxyXG4gKiBAZGVzY3JpcHRpb25cclxuICogICBBbmltYXRlZCByZXN1bHRzXHJcbiAqL1xyXG5hcHAuZGlyZWN0aXZlKCdhbmltYXRlZFJlc3VsdHMnLCBmdW5jdGlvbiAoJHRpbWVvdXQpIHtcclxuXHRyZXR1cm4ge1xyXG5cdFx0cmVzdHJpY3Q6ICdFJyxcclxuXHRcdHRlbXBsYXRlVXJsOiAnanMvc3JjL21haW4vZGlyZWN0aXZlcy9hbmltYXRlZFJlc3VsdHMvYW5pbWF0ZWRSZXN1bHRzLmh0bWwnLFxyXG5cdFx0bGluazogZnVuY3Rpb24gKHNjb3BlKSB7XHJcblxyXG5cdFx0XHRzY29wZS5jdXJGcmFtZSA9IDA7XHJcblx0XHRcdHNjb3BlLmZyYW1lcyA9IDA7XHJcblx0XHRcdHNjb3BlLiR3YXRjaCgnZmlsdGVyZWRFbnRyaWVzJywgc3RhcnROZXdBbmltYXRpb24pO1xyXG5cclxuXHRcdFx0dmFyIGRlYm91bmNlTmV4dDtcclxuXHRcdFx0dmFyIGFuaW1hdGVTcGVlZCA9IDMwMDtcclxuXHJcblx0XHRcdGFuaW1hdGUoKTtcclxuXHJcblx0XHRcdGZ1bmN0aW9uIGFuaW1hdGUoKSB7XHJcblx0XHRcdFx0c2hvd05leHRGcmFtZSgpO1xyXG5cdFx0XHRcdHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xyXG5cdFx0XHRcdFx0YW5pbWF0ZSgpO1xyXG5cdFx0XHRcdH0sIGFuaW1hdGVTcGVlZCk7XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdGZ1bmN0aW9uIHN0YXJ0TmV3QW5pbWF0aW9uKCkge1xyXG5cdFx0XHRcdGlmICghc2NvcGUuZmlsdGVyZWRFbnRyaWVzKSByZXR1cm47XHJcblx0XHRcdFx0aWYgKCFzY29wZS5maWx0ZXJlZEVudHJpZXMubGVuZ3RoKSB7XHJcblx0XHRcdFx0XHRyZXR1cm4gJCgnI2FuaW1hdGVkLXJlc3VsdHMnKVxyXG5cdFx0XHRcdFx0XHQuYXR0cignc3JjJywgJycpO1xyXG5cdFx0XHRcdH1cclxuXHJcblx0XHRcdFx0c2NvcGUuY3VyRnJhbWUgPSAwO1xyXG5cdFx0XHRcdHNjb3BlLmZyYW1lcyA9IHNjb3BlLmZpbHRlcmVkRW50cmllcy5sZW5ndGg7XHJcblxyXG5cdFx0XHRcdHZhciBuZXdBbmltYXRlU3BlZWQgPSBNYXRoLm1heCgxMDAwMDAgLyBzY29wZS5mcmFtZXMsIDMwMCk7IC8vIG1pbiBkZWJvdW5jZSB0aW1lXHJcblx0XHRcdFx0bmV3QW5pbWF0ZVNwZWVkID0gTWF0aC5taW4obmV3QW5pbWF0ZVNwZWVkLCAxNTAwKTsgLy8gbWF4IGRlYm91bmNlIHRpbWVcclxuXHRcdFx0XHRhbmltYXRlU3BlZWQgPSBuZXdBbmltYXRlU3BlZWQ7XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdGZ1bmN0aW9uIHNob3dOZXh0RnJhbWUoKSB7XHJcblx0XHRcdFx0aWYgKCFzY29wZS5maWx0ZXJlZEVudHJpZXMgfHwgIXNjb3BlLmZpbHRlcmVkRW50cmllcy5sZW5ndGgpIHJldHVybjtcclxuXHRcdFx0XHQkKCcjYW5pbWF0ZWQtcmVzdWx0cycpXHJcblx0XHRcdFx0XHQuYXR0cignc3JjJywgc2NvcGUuZmlsdGVyZWRFbnRyaWVzW3Njb3BlLmN1ckZyYW1lXS5pbWcpO1xyXG5cdFx0XHRcdHNjb3BlLmN1ckZyYW1lICs9IDE7XHJcblx0XHRcdFx0aWYgKHNjb3BlLmN1ckZyYW1lID49IHNjb3BlLmZyYW1lcykgc2NvcGUuY3VyRnJhbWUgPSAwO1xyXG5cdFx0XHR9XHJcblx0XHR9XHJcblx0fTtcclxufSk7XHJcbiIsIi8qKlxyXG4gKiBAbWVtYmVyT2YgYXBwXHJcbiAqIEBuZ2RvYyBkaXJlY3RpdmVcclxuICogQG5hbWUgYm90dG9tTmF2XHJcbiAqIEBwYXJhbSB7c2VydmljZX1cclxuICogQGRlc2NyaXB0aW9uXHJcbiAqICAgTmF2YmFyLiBEb2Vzbid0IHJlYWxseSBkbyBhbnl0aGluZyBpbnRlcmVzdGluZyB5ZXQuXHJcbiAqL1xyXG5hcHAuZGlyZWN0aXZlKCdib3R0b21OYXYnLCBmdW5jdGlvbiAoJHRpbWVvdXQpIHtcclxuXHRyZXR1cm4ge1xyXG5cdFx0cmVzdHJpY3Q6ICdFJyxcclxuXHRcdHRlbXBsYXRlVXJsOiAnanMvc3JjL21haW4vZGlyZWN0aXZlcy9ib3R0b21OYXYvYm90dG9tTmF2Lmh0bWwnLFxyXG5cdFx0bGluazogZnVuY3Rpb24gKHNjb3BlKSB7XHJcblxyXG5cdFx0XHQkdGltZW91dChmdW5jdGlvbiAoKSB7XHJcblxyXG5cdFx0XHRcdHZhciBib3R0b21iYXIgPSAkKCcuYm90dG9tLW5hdicpO1xyXG5cclxuXHRcdFx0XHRib3R0b21iYXIucmVzaXphYmxlKHtcclxuXHRcdFx0XHRcdGhhbmRsZXM6IHtcclxuXHRcdFx0XHRcdFx0J24nOiAnI2hhbmRsZSdcclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHR9KTtcclxuXHJcblx0XHRcdFx0Ym90dG9tYmFyLm9uKCdyZXNpemUnLCByZXNpemVNYWluQ29udGVudCk7XHJcblxyXG5cdFx0XHRcdHJlc2l6ZU1haW5Db250ZW50KCk7XHJcblxyXG5cdFx0XHRcdGZ1bmN0aW9uIHJlc2l6ZU1haW5Db250ZW50KCl7XHJcblx0XHRcdFx0XHQkKCcjbWFpbi1jb250ZW50LWZsb3cnKS5jc3MoJ3BhZGRpbmctYm90dG9tJyxib3R0b21iYXIuaGVpZ2h0KCkpO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0fSk7XHJcblx0XHR9XHJcblx0fTtcclxufSk7XHJcbiIsIi8qKlxyXG4gKiBCYXNlIHN0YXRlIGZvciBhbGwgbmVzdGVkIGZ1dHVyZSBzdGF0ZXMgd2UgbWF5IGhhdmVcclxuICovXHJcbmFwcC5jb25maWcoZnVuY3Rpb24gKCRzdGF0ZVByb3ZpZGVyKSB7XHJcblx0JHN0YXRlUHJvdmlkZXIuc3RhdGUoJ3Jvb3QnLCB7XHJcblx0XHRuYW1lOiAncm9vdCcsXHJcblx0XHQvLyBhYnN0cmFjdDogdHJ1ZSxcclxuXHRcdHVybDogJy8nLFxyXG5cdFx0dGVtcGxhdGVVcmw6ICdqcy9zcmMvbWFpbi9zdGF0ZXMvcm9vdC9yb290Lmh0bWwnLFxyXG5cdFx0Y29udHJvbGxlcjogJ1Jvb3RTdGF0ZUN0cmwnXHJcblx0fSk7XHJcbn0pO1xyXG5cclxuYXBwLmNvbnRyb2xsZXIoJ1Jvb3RTdGF0ZUN0cmwnLCBmdW5jdGlvbiAoJHJvb3RTY29wZSwgJHNjb3BlLCAkdGltZW91dCkge1xyXG5cclxuXHR2YXIgZGVzaWduRXhwbG9yZXI7XHJcblxyXG5cdGQzLmNzdihcImRlc2lnbl9leHBsb3Jlcl9kYXRhL2RlZmF1bHRfb25sb2FkLmNzdlwiKVxyXG5cdFx0LmdldChmdW5jdGlvbiAoZXJyb3IsIHJvd3MpIHtcclxuXHRcdFx0JHNjb3BlLmRlc2lnbkV4cGxvcmVyID0gbmV3IERlc2lnbkV4cGxvcmVyKHJvd3MpO1xyXG5cdFx0fSk7XHJcblxyXG5cclxuXHJcblx0LypcclxuXHTilojiloggICAgIOKWiOKWiCAg4paI4paI4paI4paI4paIICDilojilojilojilojilojilojilojiloggIOKWiOKWiOKWiOKWiOKWiOKWiCDilojiloggICDilojilohcclxuXHTilojiloggICAgIOKWiOKWiCDilojiloggICDilojiloggICAg4paI4paIICAgIOKWiOKWiCAgICAgIOKWiOKWiCAgIOKWiOKWiFxyXG5cdOKWiOKWiCAg4paIICDilojilogg4paI4paI4paI4paI4paI4paI4paIICAgIOKWiOKWiCAgICDilojiloggICAgICDilojilojilojilojilojilojilohcclxuXHTilojilogg4paI4paI4paIIOKWiOKWiCDilojiloggICDilojiloggICAg4paI4paIICAgIOKWiOKWiCAgICAgIOKWiOKWiCAgIOKWiOKWiFxyXG5cdCDilojilojilogg4paI4paI4paIICDilojiloggICDilojiloggICAg4paI4paIICAgICDilojilojilojilojilojilogg4paI4paIICAg4paI4paIXHJcblx0Ki9cclxuXHJcblx0JHNjb3BlLiR3YXRjaCgnZGVzaWduRXhwbG9yZXInLCBkcmF3RGVzaWduRXhwbG9yZXIpO1xyXG5cclxuXHQkKHdpbmRvdylcclxuXHRcdC5vbigncmVzaXplJywgZnVuY3Rpb24gKCkge1xyXG5cdFx0XHQvLyBjaGFuZ2UgaGVpZ2h0IGFuZCBzdHVmZj9cclxuXHRcdFx0aWYgKCRzY29wZS5kZXNpZ25FeHBsb3JlciAmJiAkc2NvcGUuZGVzaWduRXhwbG9yZXIuZ3JhcGhzLnBhcmNvb3JkcykgJHNjb3BlLmRlc2lnbkV4cGxvcmVyLmdyYXBocy5wYXJjb29yZHMucmVuZGVyKCk7XHJcblx0XHR9KTtcclxuXHJcblxyXG5cdC8qXHJcblx0IOKWiOKWiOKWiOKWiOKWiCAg4paI4paI4paIICAgIOKWiOKWiCAg4paI4paI4paI4paI4paI4paIICDilojilojiloggICAg4paI4paIXHJcblx04paI4paIICAg4paI4paIIOKWiOKWiOKWiOKWiCAgIOKWiOKWiCDilojiloggICAg4paI4paIIOKWiOKWiOKWiOKWiCAgIOKWiOKWiFxyXG5cdOKWiOKWiOKWiOKWiOKWiOKWiOKWiCDilojilogg4paI4paIICDilojilogg4paI4paIICAgIOKWiOKWiCDilojilogg4paI4paIICDilojilohcclxuXHTilojiloggICDilojilogg4paI4paIICDilojilogg4paI4paIIOKWiOKWiCAgICDilojilogg4paI4paIICDilojilogg4paI4paIXHJcblx04paI4paIICAg4paI4paIIOKWiOKWiCAgIOKWiOKWiOKWiOKWiCAg4paI4paI4paI4paI4paI4paIICDilojiloggICDilojilojilojilohcclxuXHQqL1xyXG5cclxuXHRmdW5jdGlvbiBkcmF3RGVzaWduRXhwbG9yZXIoKSB7XHJcblx0XHQkdGltZW91dChmdW5jdGlvbiAoKSB7XHJcblx0XHRcdGlmICgkc2NvcGUuZGVzaWduRXhwbG9yZXIpIHtcclxuXHRcdFx0XHQkc2NvcGUuZGVzaWduRXhwbG9yZXIuZHJhd1BhcmFsbGVsQ29vcmRpbmF0ZXMoJyNwYXJhbGxlbC1jb29yZHMnKTtcclxuXHRcdFx0XHQkc2NvcGUuZGVzaWduRXhwbG9yZXIuZ3JhcGhzLnBhcmNvb3Jkcy5vbignYnJ1c2gnLCBzZXRGaWx0ZXJlZEVudHJpZXMpO1xyXG5cdFx0XHRcdHNldEZpbHRlcmVkRW50cmllcygpO1xyXG5cdFx0XHR9XHJcblx0XHR9KTtcclxuXHR9XHJcblxyXG5cdGZ1bmN0aW9uIHNldEZpbHRlcmVkRW50cmllcyhlbnRyaWVzKSB7XHJcblx0XHQkc2NvcGUuZmlsdGVyZWRFbnRyaWVzID0gZW50cmllcyB8fCAkc2NvcGUuZGVzaWduRXhwbG9yZXIuZ2V0RGF0YSgpO1xyXG5cdFx0JHRpbWVvdXQoZnVuY3Rpb24gKCkge1xyXG5cdFx0XHQkc2NvcGUuJGFwcGx5KCk7XHJcblx0XHR9KTtcclxuXHR9XHJcblxyXG59KTtcclxuIiwiLyoqXHJcbiAqIEBtZW1iZXJPZiBhcHBcclxuICogQG5nZG9jIGRpcmVjdGl2ZVxyXG4gKiBAbmFtZSBuYXZiYXJcclxuICogQHBhcmFtIHtzZXJ2aWNlfVxyXG4gKiBAZGVzY3JpcHRpb25cclxuICogICBOYXZiYXIuIERvZXNuJ3QgcmVhbGx5IGRvIGFueXRoaW5nIGludGVyZXN0aW5nIHlldC5cclxuICovXHJcbmFwcC5kaXJlY3RpdmUoJ25hdmJhcicsIGZ1bmN0aW9uKCkge1xyXG5cdHJldHVybiB7XHJcblx0XHRyZXN0cmljdDogJ0UnLFxyXG5cdFx0dGVtcGxhdGVVcmw6ICdqcy9zcmMvbWFpbi9kaXJlY3RpdmVzL25hdmJhci9uYXZiYXIuaHRtbCcsXHJcblx0XHRsaW5rOiBmdW5jdGlvbihzY29wZSkge1xyXG5cdFx0fVxyXG5cdH07XHJcbn0pO1xyXG4iXX0=
