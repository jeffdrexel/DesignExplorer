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
