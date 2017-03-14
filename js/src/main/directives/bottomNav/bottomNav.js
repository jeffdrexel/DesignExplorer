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
