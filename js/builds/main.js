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
			$scope.selectedSortBy = $scope.designExplorer.params.in[0];
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

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImhlYWRlci5qcyIsInN0YXRlcy9kZWZhdWx0LmpzIiwic3RhdGVzL3Jvb3Qvcm9vdC5qcyIsImRpcmVjdGl2ZXMvYm90dG9tTmF2L2JvdHRvbU5hdi5qcyIsImRpcmVjdGl2ZXMvbmF2YmFyL25hdmJhci5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDUEE7QUFDQTtBQUNBO0FBQ0E7QUNIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNwRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDbkNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxyXG4gKiBBbmd1bGFyIGFwcGxpY2F0aW9uLiBTZWUgQW5ndWxhci1zcGVjaWZpYyBkb2N1bWVudGF0aW9uIGZvciBhbnl0aGluZyBpbnNpZGVcclxuICogb2YgYXBwLnNvbWV0aGluZy5cclxuICogQHR5cGUge29iamVjdH1cclxuICogQGdsb2JhbFxyXG4gKi9cclxudmFyIGFwcCA9IGFuZ3VsYXIubW9kdWxlKCdkZXNpZ25leHBsb3Jlci5kZW1vJywgWyd1aS5yb3V0ZXInXSk7XHJcbiIsImFwcC5jb25maWcoZnVuY3Rpb24oJHVybFJvdXRlclByb3ZpZGVyKSB7XHJcbiAgJHVybFJvdXRlclByb3ZpZGVyLm90aGVyd2lzZSgnLycpO1xyXG59KTtcclxuIiwiLyoqXHJcbiAqIEJhc2Ugc3RhdGUgZm9yIGFsbCBuZXN0ZWQgZnV0dXJlIHN0YXRlcyB3ZSBtYXkgaGF2ZVxyXG4gKi9cclxuYXBwLmNvbmZpZyhmdW5jdGlvbiAoJHN0YXRlUHJvdmlkZXIpIHtcclxuXHQkc3RhdGVQcm92aWRlci5zdGF0ZSgncm9vdCcsIHtcclxuXHRcdG5hbWU6ICdyb290JyxcclxuXHRcdC8vIGFic3RyYWN0OiB0cnVlLFxyXG5cdFx0dXJsOiAnLycsXHJcblx0XHR0ZW1wbGF0ZVVybDogJ2pzL3NyYy9tYWluL3N0YXRlcy9yb290L3Jvb3QuaHRtbCcsXHJcblx0XHRjb250cm9sbGVyOiAnUm9vdFN0YXRlQ3RybCdcclxuXHR9KTtcclxufSk7XHJcblxyXG5hcHAuY29udHJvbGxlcignUm9vdFN0YXRlQ3RybCcsIGZ1bmN0aW9uICgkcm9vdFNjb3BlLCAkc2NvcGUsICR0aW1lb3V0KSB7XHJcblxyXG5cdHZhciBkZXNpZ25FeHBsb3JlcjtcclxuXHJcblx0ZDMuY3N2KFwiZGVzaWduX2V4cGxvcmVyX2RhdGEvZGVmYXVsdF9vbmxvYWQuY3N2XCIpXHJcblx0XHQuZ2V0KGZ1bmN0aW9uIChlcnJvciwgcm93cykge1xyXG5cdFx0XHQkc2NvcGUuZGVzaWduRXhwbG9yZXIgPSBuZXcgRGVzaWduRXhwbG9yZXIocm93cyk7XHJcblx0XHRcdCRzY29wZS5zZWxlY3RlZFNvcnRCeSA9ICRzY29wZS5kZXNpZ25FeHBsb3Jlci5wYXJhbXMuaW5bMF07XHJcblx0XHR9KTtcclxuXHJcblxyXG5cclxuXHQvKlxyXG5cdOKWiOKWiCAgICAg4paI4paIICDilojilojilojilojiloggIOKWiOKWiOKWiOKWiOKWiOKWiOKWiOKWiCAg4paI4paI4paI4paI4paI4paIIOKWiOKWiCAgIOKWiOKWiFxyXG5cdOKWiOKWiCAgICAg4paI4paIIOKWiOKWiCAgIOKWiOKWiCAgICDilojiloggICAg4paI4paIICAgICAg4paI4paIICAg4paI4paIXHJcblx04paI4paIICDiloggIOKWiOKWiCDilojilojilojilojilojilojiloggICAg4paI4paIICAgIOKWiOKWiCAgICAgIOKWiOKWiOKWiOKWiOKWiOKWiOKWiFxyXG5cdOKWiOKWiCDilojilojilogg4paI4paIIOKWiOKWiCAgIOKWiOKWiCAgICDilojiloggICAg4paI4paIICAgICAg4paI4paIICAg4paI4paIXHJcblx0IOKWiOKWiOKWiCDilojilojiloggIOKWiOKWiCAgIOKWiOKWiCAgICDilojiloggICAgIOKWiOKWiOKWiOKWiOKWiOKWiCDilojiloggICDilojilohcclxuXHQqL1xyXG5cclxuXHQkc2NvcGUuJHdhdGNoKCdkZXNpZ25FeHBsb3JlcicsIGRyYXdEZXNpZ25FeHBsb3Jlcik7XHJcblxyXG5cdCQod2luZG93KVxyXG5cdFx0Lm9uKCdyZXNpemUnLCBmdW5jdGlvbiAoKSB7XHJcblx0XHRcdC8vIGNoYW5nZSBoZWlnaHQgYW5kIHN0dWZmP1xyXG5cdFx0XHRpZiAoJHNjb3BlLmRlc2lnbkV4cGxvcmVyICYmICRzY29wZS5kZXNpZ25FeHBsb3Jlci5ncmFwaHMucGFyY29vcmRzKSAkc2NvcGUuZGVzaWduRXhwbG9yZXIuZ3JhcGhzLnBhcmNvb3Jkcy5yZW5kZXIoKTtcclxuXHRcdH0pO1xyXG5cclxuXHJcblx0LypcclxuXHQg4paI4paI4paI4paI4paIICDilojilojiloggICAg4paI4paIICDilojilojilojilojilojiloggIOKWiOKWiOKWiCAgICDilojilohcclxuXHTilojiloggICDilojilogg4paI4paI4paI4paIICAg4paI4paIIOKWiOKWiCAgICDilojilogg4paI4paI4paI4paIICAg4paI4paIXHJcblx04paI4paI4paI4paI4paI4paI4paIIOKWiOKWiCDilojiloggIOKWiOKWiCDilojiloggICAg4paI4paIIOKWiOKWiCDilojiloggIOKWiOKWiFxyXG5cdOKWiOKWiCAgIOKWiOKWiCDilojiloggIOKWiOKWiCDilojilogg4paI4paIICAgIOKWiOKWiCDilojiloggIOKWiOKWiCDilojilohcclxuXHTilojiloggICDilojilogg4paI4paIICAg4paI4paI4paI4paIICDilojilojilojilojilojiloggIOKWiOKWiCAgIOKWiOKWiOKWiOKWiFxyXG5cdCovXHJcblxyXG5cdGZ1bmN0aW9uIGRyYXdEZXNpZ25FeHBsb3JlcigpIHtcclxuXHRcdCR0aW1lb3V0KGZ1bmN0aW9uICgpIHtcclxuXHRcdFx0aWYgKCRzY29wZS5kZXNpZ25FeHBsb3Jlcikge1xyXG5cdFx0XHRcdCRzY29wZS5kZXNpZ25FeHBsb3Jlci5kcmF3UGFyYWxsZWxDb29yZGluYXRlcygnI3BhcmFsbGVsLWNvb3JkcycpO1xyXG5cdFx0XHRcdCRzY29wZS5kZXNpZ25FeHBsb3Jlci5ncmFwaHMucGFyY29vcmRzLm9uKCdicnVzaCcsIHNldEZpbHRlcmVkRW50cmllcyk7XHJcblx0XHRcdFx0c2V0RmlsdGVyZWRFbnRyaWVzKCk7XHJcblx0XHRcdH1cclxuXHRcdH0pO1xyXG5cdH1cclxuXHJcblx0ZnVuY3Rpb24gc2V0RmlsdGVyZWRFbnRyaWVzKGVudHJpZXMpIHtcclxuXHRcdCRzY29wZS5maWx0ZXJlZEVudHJpZXMgPSBlbnRyaWVzIHx8ICRzY29wZS5kZXNpZ25FeHBsb3Jlci5nZXREYXRhKCk7XHJcblx0XHQkdGltZW91dChmdW5jdGlvbiAoKSB7XHJcblx0XHRcdCRzY29wZS4kYXBwbHkoKTtcclxuXHRcdH0pO1xyXG5cdH1cclxuXHJcbn0pO1xyXG4iLCIvKipcclxuICogQG1lbWJlck9mIGFwcFxyXG4gKiBAbmdkb2MgZGlyZWN0aXZlXHJcbiAqIEBuYW1lIGJvdHRvbU5hdlxyXG4gKiBAcGFyYW0ge3NlcnZpY2V9XHJcbiAqIEBkZXNjcmlwdGlvblxyXG4gKiAgIE5hdmJhci4gRG9lc24ndCByZWFsbHkgZG8gYW55dGhpbmcgaW50ZXJlc3RpbmcgeWV0LlxyXG4gKi9cclxuYXBwLmRpcmVjdGl2ZSgnYm90dG9tTmF2JywgZnVuY3Rpb24gKCR0aW1lb3V0KSB7XHJcblx0cmV0dXJuIHtcclxuXHRcdHJlc3RyaWN0OiAnRScsXHJcblx0XHR0ZW1wbGF0ZVVybDogJ2pzL3NyYy9tYWluL2RpcmVjdGl2ZXMvYm90dG9tTmF2L2JvdHRvbU5hdi5odG1sJyxcclxuXHRcdGxpbms6IGZ1bmN0aW9uIChzY29wZSkge1xyXG5cclxuXHRcdFx0JHRpbWVvdXQoZnVuY3Rpb24gKCkge1xyXG5cclxuXHRcdFx0XHR2YXIgYm90dG9tYmFyID0gJCgnLmJvdHRvbS1uYXYnKTtcclxuXHJcblx0XHRcdFx0Ym90dG9tYmFyLnJlc2l6YWJsZSh7XHJcblx0XHRcdFx0XHRoYW5kbGVzOiB7XHJcblx0XHRcdFx0XHRcdCduJzogJyNoYW5kbGUnXHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0fSk7XHJcblxyXG5cdFx0XHRcdGJvdHRvbWJhci5vbigncmVzaXplJywgcmVzaXplTWFpbkNvbnRlbnQpO1xyXG5cclxuXHRcdFx0XHRyZXNpemVNYWluQ29udGVudCgpO1xyXG5cclxuXHRcdFx0XHRmdW5jdGlvbiByZXNpemVNYWluQ29udGVudCgpe1xyXG5cdFx0XHRcdFx0JCgnI21haW4tY29udGVudC1mbG93JykuY3NzKCdwYWRkaW5nLWJvdHRvbScsYm90dG9tYmFyLmhlaWdodCgpKTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdH0pO1xyXG5cdFx0fVxyXG5cdH07XHJcbn0pO1xyXG4iLCIvKipcclxuICogQG1lbWJlck9mIGFwcFxyXG4gKiBAbmdkb2MgZGlyZWN0aXZlXHJcbiAqIEBuYW1lIG5hdmJhclxyXG4gKiBAcGFyYW0ge3NlcnZpY2V9XHJcbiAqIEBkZXNjcmlwdGlvblxyXG4gKiAgIE5hdmJhci4gRG9lc24ndCByZWFsbHkgZG8gYW55dGhpbmcgaW50ZXJlc3RpbmcgeWV0LlxyXG4gKi9cclxuYXBwLmRpcmVjdGl2ZSgnbmF2YmFyJywgZnVuY3Rpb24oKSB7XHJcblx0cmV0dXJuIHtcclxuXHRcdHJlc3RyaWN0OiAnRScsXHJcblx0XHR0ZW1wbGF0ZVVybDogJ2pzL3NyYy9tYWluL2RpcmVjdGl2ZXMvbmF2YmFyL25hdmJhci5odG1sJyxcclxuXHRcdGxpbms6IGZ1bmN0aW9uKHNjb3BlKSB7XHJcblx0XHR9XHJcblx0fTtcclxufSk7XHJcbiJdfQ==
