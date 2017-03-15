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
					$('#cur-frame-info')
						.html('');
				}

				scope.curFrame = 0;
				scope.frames = scope.filteredEntries.length;

				var newAnimateSpeed = Math.max(100000 / scope.frames, 300); // min debounce time
				newAnimateSpeed = Math.min(newAnimateSpeed, 1500); // max debounce time
				animateSpeed = newAnimateSpeed;
			}

			function showNextFrame() {
				if (!scope.filteredEntries || !scope.filteredEntries.length) return;
				scope.curFrameInfo = scope.filteredEntries[scope.curFrame];

				$('#animated-results')
					.attr('src', scope.curFrameInfo.img);

				var infoBox = $('#cur-frame-info');

				infoBox.html('');

				Object.keys(scope.designExplorer.params)
					.forEach(function (key) {
						var type = DesignExplorer.typeDisplayDictionary[key];
						var table = $('<table class="table table-condensed"></table>');
						var params = scope.designExplorer.params[key];
						params.forEach(function (param) {
							var row = $('<tr></tr>');
							row.append('<td>' + param.display + '</td>');
							row.append('<td>' + scope.curFrameInfo[param[DesignExplorer.dataKey]] + '</td>');
							table.append(row);

							if (param === scope.designExplorer.selectedParam) row.css('border-left', '10px solid ' + scope.designExplorer.colorer(scope.curFrameInfo))
								.css('font-weight', 'bold');
						});
						infoBox.append('<h4>' + type.display + 's</h4>');
						infoBox.append(table);
					});

				// $('#cur-frame-info')
				// 	.html(scope.curFrame);

				scope.curFrame += 1;
				if (scope.curFrame >= scope.frames) scope.curFrame = 0;
			}
		}
	};
});
