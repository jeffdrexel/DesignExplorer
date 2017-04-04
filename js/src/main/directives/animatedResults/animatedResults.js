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

			scope.animatedResults={
				curFrame:0,
				frames:0,
				curFrameInfo:null
			};

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

				scope.animatedResults.curFrame = 0;
				scope.animatedResults.frames = scope.filteredEntries.length;

				var newAnimateSpeed = Math.max(100000 / scope.animatedResults.frames, 300); // min debounce time
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
				scope.animatedResults.curFrameInfo = scope.filteredEntries[scope.animatedResults.curFrame];

				$('#animated-results')
					.attr('src', scope.animatedResults.curFrameInfo.img);

				$('#animated-results')
					.on('click', function () {
						cleanPreviousAnimation();
						scope.viewMode='thumbnails';
						$timeout(function(){
							scope.selectIteration(scope.animatedResults.curFrameInfo);
						});
					});

				var infoBox = $('#cur-frame-info');

				scope.designExplorer.populateIterationTable(infoBox, scope.animatedResults.curFrameInfo);

				scope.designExplorer.graphs.parcoords.highlight([scope.animatedResults.curFrameInfo]);

				scope.animatedResults.curFrame += 1;
				if (scope.animatedResults.curFrame >= scope.animatedResults.frames) scope.animatedResults.curFrame = 0;
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
