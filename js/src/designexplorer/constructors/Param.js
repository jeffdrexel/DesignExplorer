DesignExplorer.Param = function (key, type) {
	var param = this;

	param.original = key;

	param.display = key.substring(type.signifier.length, key.length);

	param.type = type;

	param.cleanKey = key.replace(':', '_')
		.replace('[', '_')
		.replace(']', '_')
		.replace(' ', '_')
		.replace(' ', '_');

	// param.cleanKey=key.replace(/[!\"#$%&'\(\)\*\+,\.\/:;<=>\?\@\[\\\]\^`\{\|\}~]/g, '_');

	// console.log(key, param.cleanKey);

	param.shownInParcoords = true;

	return this;
};
