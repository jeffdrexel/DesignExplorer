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
			scope.curFrameInfo=null;
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
					$('#animated-results')
						.attr('src', '');
						$('#cur-frame-info').html('');
				}

				scope.curFrame = 0;
				scope.frames = scope.filteredEntries.length;

				var newAnimateSpeed = Math.max(100000 / scope.frames, 300); // min debounce time
				newAnimateSpeed = Math.min(newAnimateSpeed, 1500); // max debounce time
				animateSpeed = newAnimateSpeed;
			}

			function showNextFrame() {
				if (!scope.filteredEntries || !scope.filteredEntries.length) return;
				scope.curFrameInfo=scope.filteredEntries[scope.curFrame];
				$('#animated-results')
					.attr('src', scope.curFrameInfo.img);
					$('#cur-frame-info').html(scope.curFrame);
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

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImhlYWRlci5qcyIsInN0YXRlcy9kZWZhdWx0LmpzIiwic3RhdGVzL3Jvb3Qvcm9vdC5qcyIsImRpcmVjdGl2ZXMvYW5pbWF0ZWRSZXN1bHRzL2FuaW1hdGVkUmVzdWx0cy5qcyIsImRpcmVjdGl2ZXMvYm90dG9tTmF2L2JvdHRvbU5hdi5qcyIsImRpcmVjdGl2ZXMvbmF2YmFyL25hdmJhci5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDUEE7QUFDQTtBQUNBO0FBQ0E7QUNIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDbkVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQzNEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNuQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJtYWluLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXHJcbiAqIEFuZ3VsYXIgYXBwbGljYXRpb24uIFNlZSBBbmd1bGFyLXNwZWNpZmljIGRvY3VtZW50YXRpb24gZm9yIGFueXRoaW5nIGluc2lkZVxyXG4gKiBvZiBhcHAuc29tZXRoaW5nLlxyXG4gKiBAdHlwZSB7b2JqZWN0fVxyXG4gKiBAZ2xvYmFsXHJcbiAqL1xyXG52YXIgYXBwID0gYW5ndWxhci5tb2R1bGUoJ2Rlc2lnbmV4cGxvcmVyLmRlbW8nLCBbJ3VpLnJvdXRlciddKTtcclxuIiwiYXBwLmNvbmZpZyhmdW5jdGlvbigkdXJsUm91dGVyUHJvdmlkZXIpIHtcclxuICAkdXJsUm91dGVyUHJvdmlkZXIub3RoZXJ3aXNlKCcvJyk7XHJcbn0pO1xyXG4iLCIvKipcclxuICogQmFzZSBzdGF0ZSBmb3IgYWxsIG5lc3RlZCBmdXR1cmUgc3RhdGVzIHdlIG1heSBoYXZlXHJcbiAqL1xyXG5hcHAuY29uZmlnKGZ1bmN0aW9uICgkc3RhdGVQcm92aWRlcikge1xyXG5cdCRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdyb290Jywge1xyXG5cdFx0bmFtZTogJ3Jvb3QnLFxyXG5cdFx0Ly8gYWJzdHJhY3Q6IHRydWUsXHJcblx0XHR1cmw6ICcvJyxcclxuXHRcdHRlbXBsYXRlVXJsOiAnanMvc3JjL21haW4vc3RhdGVzL3Jvb3Qvcm9vdC5odG1sJyxcclxuXHRcdGNvbnRyb2xsZXI6ICdSb290U3RhdGVDdHJsJ1xyXG5cdH0pO1xyXG59KTtcclxuXHJcbmFwcC5jb250cm9sbGVyKCdSb290U3RhdGVDdHJsJywgZnVuY3Rpb24gKCRyb290U2NvcGUsICRzY29wZSwgJHRpbWVvdXQpIHtcclxuXHJcblx0dmFyIGRlc2lnbkV4cGxvcmVyO1xyXG5cclxuXHRkMy5jc3YoXCJkZXNpZ25fZXhwbG9yZXJfZGF0YS9kZWZhdWx0X29ubG9hZC5jc3ZcIilcclxuXHRcdC5nZXQoZnVuY3Rpb24gKGVycm9yLCByb3dzKSB7XHJcblx0XHRcdCRzY29wZS5kZXNpZ25FeHBsb3JlciA9IG5ldyBEZXNpZ25FeHBsb3Jlcihyb3dzKTtcclxuXHRcdH0pO1xyXG5cclxuXHJcblxyXG5cdC8qXHJcblx04paI4paIICAgICDilojiloggIOKWiOKWiOKWiOKWiOKWiCAg4paI4paI4paI4paI4paI4paI4paI4paIICDilojilojilojilojilojilogg4paI4paIICAg4paI4paIXHJcblx04paI4paIICAgICDilojilogg4paI4paIICAg4paI4paIICAgIOKWiOKWiCAgICDilojiloggICAgICDilojiloggICDilojilohcclxuXHTilojiloggIOKWiCAg4paI4paIIOKWiOKWiOKWiOKWiOKWiOKWiOKWiCAgICDilojiloggICAg4paI4paIICAgICAg4paI4paI4paI4paI4paI4paI4paIXHJcblx04paI4paIIOKWiOKWiOKWiCDilojilogg4paI4paIICAg4paI4paIICAgIOKWiOKWiCAgICDilojiloggICAgICDilojiloggICDilojilohcclxuXHQg4paI4paI4paIIOKWiOKWiOKWiCAg4paI4paIICAg4paI4paIICAgIOKWiOKWiCAgICAg4paI4paI4paI4paI4paI4paIIOKWiOKWiCAgIOKWiOKWiFxyXG5cdCovXHJcblxyXG5cdCRzY29wZS4kd2F0Y2goJ2Rlc2lnbkV4cGxvcmVyJywgZHJhd0Rlc2lnbkV4cGxvcmVyKTtcclxuXHJcblx0JCh3aW5kb3cpXHJcblx0XHQub24oJ3Jlc2l6ZScsIGZ1bmN0aW9uICgpIHtcclxuXHRcdFx0Ly8gY2hhbmdlIGhlaWdodCBhbmQgc3R1ZmY/XHJcblx0XHRcdGlmICgkc2NvcGUuZGVzaWduRXhwbG9yZXIgJiYgJHNjb3BlLmRlc2lnbkV4cGxvcmVyLmdyYXBocy5wYXJjb29yZHMpICRzY29wZS5kZXNpZ25FeHBsb3Jlci5ncmFwaHMucGFyY29vcmRzLnJlbmRlcigpO1xyXG5cdFx0fSk7XHJcblxyXG5cclxuXHQvKlxyXG5cdCDilojilojilojilojiloggIOKWiOKWiOKWiCAgICDilojiloggIOKWiOKWiOKWiOKWiOKWiOKWiCAg4paI4paI4paIICAgIOKWiOKWiFxyXG5cdOKWiOKWiCAgIOKWiOKWiCDilojilojilojiloggICDilojilogg4paI4paIICAgIOKWiOKWiCDilojilojilojiloggICDilojilohcclxuXHTilojilojilojilojilojilojilogg4paI4paIIOKWiOKWiCAg4paI4paIIOKWiOKWiCAgICDilojilogg4paI4paIIOKWiOKWiCAg4paI4paIXHJcblx04paI4paIICAg4paI4paIIOKWiOKWiCAg4paI4paIIOKWiOKWiCDilojiloggICAg4paI4paIIOKWiOKWiCAg4paI4paIIOKWiOKWiFxyXG5cdOKWiOKWiCAgIOKWiOKWiCDilojiloggICDilojilojilojiloggIOKWiOKWiOKWiOKWiOKWiOKWiCAg4paI4paIICAg4paI4paI4paI4paIXHJcblx0Ki9cclxuXHJcblx0ZnVuY3Rpb24gZHJhd0Rlc2lnbkV4cGxvcmVyKCkge1xyXG5cdFx0JHRpbWVvdXQoZnVuY3Rpb24gKCkge1xyXG5cdFx0XHRpZiAoJHNjb3BlLmRlc2lnbkV4cGxvcmVyKSB7XHJcblx0XHRcdFx0JHNjb3BlLmRlc2lnbkV4cGxvcmVyLmRyYXdQYXJhbGxlbENvb3JkaW5hdGVzKCcjcGFyYWxsZWwtY29vcmRzJyk7XHJcblx0XHRcdFx0JHNjb3BlLmRlc2lnbkV4cGxvcmVyLmdyYXBocy5wYXJjb29yZHMub24oJ2JydXNoJywgc2V0RmlsdGVyZWRFbnRyaWVzKTtcclxuXHRcdFx0XHRzZXRGaWx0ZXJlZEVudHJpZXMoKTtcclxuXHRcdFx0fVxyXG5cdFx0fSk7XHJcblx0fVxyXG5cclxuXHRmdW5jdGlvbiBzZXRGaWx0ZXJlZEVudHJpZXMoZW50cmllcykge1xyXG5cdFx0JHNjb3BlLmZpbHRlcmVkRW50cmllcyA9IGVudHJpZXMgfHwgJHNjb3BlLmRlc2lnbkV4cGxvcmVyLmdldERhdGEoKTtcclxuXHRcdCR0aW1lb3V0KGZ1bmN0aW9uICgpIHtcclxuXHRcdFx0JHNjb3BlLiRhcHBseSgpO1xyXG5cdFx0fSk7XHJcblx0fVxyXG5cclxufSk7XHJcbiIsIi8qKlxyXG4gKiBAbWVtYmVyT2YgYXBwXHJcbiAqIEBuZ2RvYyBkaXJlY3RpdmVcclxuICogQG5hbWUgYW5pbWF0ZWRSZXN1bHRzXHJcbiAqIEBwYXJhbSB7c2VydmljZX1cclxuICogQGRlc2NyaXB0aW9uXHJcbiAqICAgQW5pbWF0ZWQgcmVzdWx0c1xyXG4gKi9cclxuYXBwLmRpcmVjdGl2ZSgnYW5pbWF0ZWRSZXN1bHRzJywgZnVuY3Rpb24gKCR0aW1lb3V0KSB7XHJcblx0cmV0dXJuIHtcclxuXHRcdHJlc3RyaWN0OiAnRScsXHJcblx0XHR0ZW1wbGF0ZVVybDogJ2pzL3NyYy9tYWluL2RpcmVjdGl2ZXMvYW5pbWF0ZWRSZXN1bHRzL2FuaW1hdGVkUmVzdWx0cy5odG1sJyxcclxuXHRcdGxpbms6IGZ1bmN0aW9uIChzY29wZSkge1xyXG5cclxuXHRcdFx0c2NvcGUuY3VyRnJhbWUgPSAwO1xyXG5cdFx0XHRzY29wZS5mcmFtZXMgPSAwO1xyXG5cdFx0XHRzY29wZS5jdXJGcmFtZUluZm89bnVsbDtcclxuXHRcdFx0c2NvcGUuJHdhdGNoKCdmaWx0ZXJlZEVudHJpZXMnLCBzdGFydE5ld0FuaW1hdGlvbik7XHJcblxyXG5cdFx0XHR2YXIgZGVib3VuY2VOZXh0O1xyXG5cdFx0XHR2YXIgYW5pbWF0ZVNwZWVkID0gMzAwO1xyXG5cclxuXHRcdFx0YW5pbWF0ZSgpO1xyXG5cclxuXHRcdFx0ZnVuY3Rpb24gYW5pbWF0ZSgpIHtcclxuXHRcdFx0XHRzaG93TmV4dEZyYW1lKCk7XHJcblx0XHRcdFx0c2V0VGltZW91dChmdW5jdGlvbiAoKSB7XHJcblx0XHRcdFx0XHRhbmltYXRlKCk7XHJcblx0XHRcdFx0fSwgYW5pbWF0ZVNwZWVkKTtcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0ZnVuY3Rpb24gc3RhcnROZXdBbmltYXRpb24oKSB7XHJcblx0XHRcdFx0aWYgKCFzY29wZS5maWx0ZXJlZEVudHJpZXMpIHJldHVybjtcclxuXHRcdFx0XHRpZiAoIXNjb3BlLmZpbHRlcmVkRW50cmllcy5sZW5ndGgpIHtcclxuXHRcdFx0XHRcdCQoJyNhbmltYXRlZC1yZXN1bHRzJylcclxuXHRcdFx0XHRcdFx0LmF0dHIoJ3NyYycsICcnKTtcclxuXHRcdFx0XHRcdFx0JCgnI2N1ci1mcmFtZS1pbmZvJykuaHRtbCgnJyk7XHJcblx0XHRcdFx0fVxyXG5cclxuXHRcdFx0XHRzY29wZS5jdXJGcmFtZSA9IDA7XHJcblx0XHRcdFx0c2NvcGUuZnJhbWVzID0gc2NvcGUuZmlsdGVyZWRFbnRyaWVzLmxlbmd0aDtcclxuXHJcblx0XHRcdFx0dmFyIG5ld0FuaW1hdGVTcGVlZCA9IE1hdGgubWF4KDEwMDAwMCAvIHNjb3BlLmZyYW1lcywgMzAwKTsgLy8gbWluIGRlYm91bmNlIHRpbWVcclxuXHRcdFx0XHRuZXdBbmltYXRlU3BlZWQgPSBNYXRoLm1pbihuZXdBbmltYXRlU3BlZWQsIDE1MDApOyAvLyBtYXggZGVib3VuY2UgdGltZVxyXG5cdFx0XHRcdGFuaW1hdGVTcGVlZCA9IG5ld0FuaW1hdGVTcGVlZDtcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0ZnVuY3Rpb24gc2hvd05leHRGcmFtZSgpIHtcclxuXHRcdFx0XHRpZiAoIXNjb3BlLmZpbHRlcmVkRW50cmllcyB8fCAhc2NvcGUuZmlsdGVyZWRFbnRyaWVzLmxlbmd0aCkgcmV0dXJuO1xyXG5cdFx0XHRcdHNjb3BlLmN1ckZyYW1lSW5mbz1zY29wZS5maWx0ZXJlZEVudHJpZXNbc2NvcGUuY3VyRnJhbWVdO1xyXG5cdFx0XHRcdCQoJyNhbmltYXRlZC1yZXN1bHRzJylcclxuXHRcdFx0XHRcdC5hdHRyKCdzcmMnLCBzY29wZS5jdXJGcmFtZUluZm8uaW1nKTtcclxuXHRcdFx0XHRcdCQoJyNjdXItZnJhbWUtaW5mbycpLmh0bWwoc2NvcGUuY3VyRnJhbWUpO1xyXG5cdFx0XHRcdHNjb3BlLmN1ckZyYW1lICs9IDE7XHJcblx0XHRcdFx0aWYgKHNjb3BlLmN1ckZyYW1lID49IHNjb3BlLmZyYW1lcykgc2NvcGUuY3VyRnJhbWUgPSAwO1xyXG5cdFx0XHR9XHJcblx0XHR9XHJcblx0fTtcclxufSk7XHJcbiIsIi8qKlxyXG4gKiBAbWVtYmVyT2YgYXBwXHJcbiAqIEBuZ2RvYyBkaXJlY3RpdmVcclxuICogQG5hbWUgYm90dG9tTmF2XHJcbiAqIEBwYXJhbSB7c2VydmljZX1cclxuICogQGRlc2NyaXB0aW9uXHJcbiAqICAgTmF2YmFyLiBEb2Vzbid0IHJlYWxseSBkbyBhbnl0aGluZyBpbnRlcmVzdGluZyB5ZXQuXHJcbiAqL1xyXG5hcHAuZGlyZWN0aXZlKCdib3R0b21OYXYnLCBmdW5jdGlvbiAoJHRpbWVvdXQpIHtcclxuXHRyZXR1cm4ge1xyXG5cdFx0cmVzdHJpY3Q6ICdFJyxcclxuXHRcdHRlbXBsYXRlVXJsOiAnanMvc3JjL21haW4vZGlyZWN0aXZlcy9ib3R0b21OYXYvYm90dG9tTmF2Lmh0bWwnLFxyXG5cdFx0bGluazogZnVuY3Rpb24gKHNjb3BlKSB7XHJcblxyXG5cdFx0XHQkdGltZW91dChmdW5jdGlvbiAoKSB7XHJcblxyXG5cdFx0XHRcdHZhciBib3R0b21iYXIgPSAkKCcuYm90dG9tLW5hdicpO1xyXG5cclxuXHRcdFx0XHRib3R0b21iYXIucmVzaXphYmxlKHtcclxuXHRcdFx0XHRcdGhhbmRsZXM6IHtcclxuXHRcdFx0XHRcdFx0J24nOiAnI2hhbmRsZSdcclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHR9KTtcclxuXHJcblx0XHRcdFx0Ym90dG9tYmFyLm9uKCdyZXNpemUnLCByZXNpemVNYWluQ29udGVudCk7XHJcblxyXG5cdFx0XHRcdHJlc2l6ZU1haW5Db250ZW50KCk7XHJcblxyXG5cdFx0XHRcdGZ1bmN0aW9uIHJlc2l6ZU1haW5Db250ZW50KCl7XHJcblx0XHRcdFx0XHQkKCcjbWFpbi1jb250ZW50LWZsb3cnKS5jc3MoJ3BhZGRpbmctYm90dG9tJyxib3R0b21iYXIuaGVpZ2h0KCkpO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0fSk7XHJcblx0XHR9XHJcblx0fTtcclxufSk7XHJcbiIsIi8qKlxyXG4gKiBAbWVtYmVyT2YgYXBwXHJcbiAqIEBuZ2RvYyBkaXJlY3RpdmVcclxuICogQG5hbWUgbmF2YmFyXHJcbiAqIEBwYXJhbSB7c2VydmljZX1cclxuICogQGRlc2NyaXB0aW9uXHJcbiAqICAgTmF2YmFyLiBEb2Vzbid0IHJlYWxseSBkbyBhbnl0aGluZyBpbnRlcmVzdGluZyB5ZXQuXHJcbiAqL1xyXG5hcHAuZGlyZWN0aXZlKCduYXZiYXInLCBmdW5jdGlvbigpIHtcclxuXHRyZXR1cm4ge1xyXG5cdFx0cmVzdHJpY3Q6ICdFJyxcclxuXHRcdHRlbXBsYXRlVXJsOiAnanMvc3JjL21haW4vZGlyZWN0aXZlcy9uYXZiYXIvbmF2YmFyLmh0bWwnLFxyXG5cdFx0bGluazogZnVuY3Rpb24oc2NvcGUpIHtcclxuXHRcdH1cclxuXHR9O1xyXG59KTtcclxuIl19
