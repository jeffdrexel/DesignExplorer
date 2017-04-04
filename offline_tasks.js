var fs = require('fs');
var fileNames = [];
var i = 0;
while (i < 756) {
	fileNames.push(pad(i, 4) + '.json')
	i += 1;
}

processFile(0);

function pad(num, size) {
	var s = num + '';
	while (s.length < size) s = '0' + s;
	return s;
}

function processFile(i) {

	var name = fileNames[i];

	if(!name) return;
	
	fs.readFile('design_explorer_data/kpf/Json/' + name, function (err, data) {
		var jsonData = JSON.parse(data);
		console.log(err, Object.keys(jsonData));

		var excludedLayers = ['Context', 'Pavement', 'OpenSpace'];
		var excludedObjects = [];

		jsonData.object.children = jsonData.object.children.filter(function (child) {
			var isExcluded = excludedLayers.indexOf(child.userData.layer) !== -1;
			if (isExcluded) excludedObjects.push(child.geometry);
			return !isExcluded;
		});

		jsonData.geometries = jsonData.geometries.filter(function (geometry, i) {
			return excludedObjects.indexOf(geometry.uuid) === -1;
		});

		finalDataStr = JSON.stringify(jsonData);
		fs.writeFile('design_explorer_data/kpf/Json2/' + name, finalDataStr, function (err) {
			if (err) return console.log(err);
			console.log('Written > ' + name);
			processFile(i+1);
		});

	});
}
