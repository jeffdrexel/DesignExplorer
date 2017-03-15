/**
 * @memberOf app
 * @ngdoc directive
 * @name resultsThumbnails
 * @param {service}
 * @description
 *   Navbar. Doesn't really do anything interesting yet.
 */
app.directive('resultsThumbnails', function ($timeout) {
	return {
		restrict: 'E',
		templateUrl: 'js/src/main/directives/resultsThumbnails/resultsThumbnails.html',
		link: function (scope) {
		}
	};
});
