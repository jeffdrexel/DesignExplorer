DesignExplorer.prototype.populateIterationTable = function (jqElement, iteration) {
	var designExplorer = this;

	var paramTypes = Object.keys(designExplorer.params);

	jqElement.html('');

	if (iteration.name) {
		jqElement.append('<h3>Name: ' + iteration.name+'</h3>');
		jqElement.append('<br />');
	}

	paramTypes.forEach(function (key) {
		var type = DesignExplorer.typeDisplayDictionary[key];
		var table = $('<table class="table table-condensed"></table>');
		var params = designExplorer.params[key];
		params.forEach(function (param) {
			// if (!param.shownInParcoords) return;
			var row = $('<tr></tr>');
			row.append('<td>' + param.display + '</td>');
			row.append('<td>' + iteration[param[DesignExplorer.dataKey]] + '</td>');
			table.append(row);

			if (param === designExplorer.selectedParam) row.css('border-left', '5px solid ' + designExplorer.colorer(iteration))
				.css('font-weight', 'bold');
		});

		if(params.length){
			jqElement.append('<h4>' + type.display + 's</h4>');
			jqElement.append(table);
		}

	});


};
