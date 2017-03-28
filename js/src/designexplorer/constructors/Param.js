DesignExplorer.Param = function (key, type) {
	var param = this;

	param.original = key;

	param.display = key.substring(type.signifier.length, key.length);

	param.type = type;

	param.cleanKey = key.replace(/[^a-zA-Z0-9]/g, '_');

	param.shownInParcoords = true;

	return this;
};
