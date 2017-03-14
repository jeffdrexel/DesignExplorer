

function unloadPageContent() {
	/*
		// This function removes current contents from the page
		// Only base HTML objects will remain in the page afterwards
		// Use this in case you want to load new data to the page
	*/
	overwriteInitialGlobalValues();

	d3.select("div.legend")
		.selectAll("*")
		.remove(); // remove legend

	d3.select("#inputSliders")
		.selectAll("*")
		.remove(); //remove sliders
	d3.select("#inputSliders")
		.append("form")
		.attr("class", "sliders"); // append a form

	d3.select("div#graph")
		.selectAll("*")
		.remove(); //remove left side parallel coord graph
	d3.select("div#radarChart")
		.selectAll("*")
		.remove(); //remove right side graph

	d3.select("div#thumbnails-btm_container")
		.select("div#sorting")
		.selectAll("*")
		.remove(); // remove sorting drop-down
	d3.select("div#thumbnails-btm_container")
		.select("div#sorting")
		.text("");
	d3.select("div#thumbnails-btm_container")
		.select("div#thumbnails-btm")
		.selectAll("*")
		.remove(); // remove thumbnail images

	d3.select("div#thumbnails-side_container")
		.select("div#sorting")
		.selectAll("*")
		.remove(); // remove thumbnail images
	d3.select("div#thumbnails-side_container")
		.select("div#sorting")
		.text("");
	d3.select("div#thumbnails-side_container")
		.select("div#thumbnails-side")
		.selectAll("*")
		.remove(); // remove thumbnail images

	d3.select("div#zoomed")
		.selectAll("*")
		.remove(); //remove zoomed image if any
	d3.select("div#viewer3d")
		.selectAll("*")
		.remove(); //remove any object inside 3D viewer

}



function overwriteInitialGlobalValues() {
	/*
		// This function initiates all the global values for the page
		// I'm not sure if this is the best practice in javascript (probably it's not)
		// Let me (github.com/mostaphaRoudsari) know if you know a better solution
	*/

	originalData = ""; //csv as it is imported
	cleanedData = []; //all the columns to be used for parallel coordinates
	inputData = []; // columns with input values - to be used for sliders
	outputData = []; // columns with output values - to be used for radar graph
	slidersInfo = []; // {name:'inputName', tickValues : [sorted set of values]},
	currentSliderValues = {}; // collector for values
	allDataCollector = {};
	slidersMapping = {}; // I collect the data for all the input sliders here so I can use it to remap the sliders later
	ids = []; // Here I collect all data based on a unique ID from inputs
	cleanedParams4pc = {};
	googleFolderLink = "";

	rcheight = height = d3.select("#graph")
		.style("height")
		.replace("px", "");

	selectedDataFormatted = [];

	firstRating = true; // variable for star rating

	//set up heights of divs ro default
	windowWidth = window.innerWidth;
	windowHeight = window.innerHeight;
	cleanHeight = windowHeight - 85 - 24; // 2
	cleanWidth = windowWidth - 100;
	graphHeight = cleanHeight / 3;
	zoomedHeight = cleanHeight - graphHeight;

	pcHeight = d3.select("#graph")
		.style("height")
		.replace("px", "");
	// hide zoomed area
	d3.selectAll(".zoomed")
		.transition()
		.duration(1500)
		.style("height", "0px");
	// show btm thumbnail
	d3.select("#thumbnails-btm_container")
		.transition()
		.duration(1000)
		.style("height", (cleanHeight - pcHeight) + "px");
	// hide side thumbnail
	d3.select("#thumbnails-side_container")
		.transition()
		.duration(1500)
		.style("height", "0px");


	// re-set the viewer to 2D
	currentView = "2D";
	// set view toggle to 2D
	d3.select("input#toggleView")
		.property("checked", "true");

	initit3DViewer = true;
	d3.select("#zoomed")
		.attr("class", "zoomed");
	d3.select("#viewer3d")
		.attr("class", "zoomed hidden");
}

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImRlc2lnbkV4cGxvcmVyLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZGVzaWduLWV4cGxvcmVyLWxpYi5qcyIsInNvdXJjZXNDb250ZW50IjpbIlxyXG5cclxuZnVuY3Rpb24gdW5sb2FkUGFnZUNvbnRlbnQoKSB7XHJcblx0LypcclxuXHRcdC8vIFRoaXMgZnVuY3Rpb24gcmVtb3ZlcyBjdXJyZW50IGNvbnRlbnRzIGZyb20gdGhlIHBhZ2VcclxuXHRcdC8vIE9ubHkgYmFzZSBIVE1MIG9iamVjdHMgd2lsbCByZW1haW4gaW4gdGhlIHBhZ2UgYWZ0ZXJ3YXJkc1xyXG5cdFx0Ly8gVXNlIHRoaXMgaW4gY2FzZSB5b3Ugd2FudCB0byBsb2FkIG5ldyBkYXRhIHRvIHRoZSBwYWdlXHJcblx0Ki9cclxuXHRvdmVyd3JpdGVJbml0aWFsR2xvYmFsVmFsdWVzKCk7XHJcblxyXG5cdGQzLnNlbGVjdChcImRpdi5sZWdlbmRcIilcclxuXHRcdC5zZWxlY3RBbGwoXCIqXCIpXHJcblx0XHQucmVtb3ZlKCk7IC8vIHJlbW92ZSBsZWdlbmRcclxuXHJcblx0ZDMuc2VsZWN0KFwiI2lucHV0U2xpZGVyc1wiKVxyXG5cdFx0LnNlbGVjdEFsbChcIipcIilcclxuXHRcdC5yZW1vdmUoKTsgLy9yZW1vdmUgc2xpZGVyc1xyXG5cdGQzLnNlbGVjdChcIiNpbnB1dFNsaWRlcnNcIilcclxuXHRcdC5hcHBlbmQoXCJmb3JtXCIpXHJcblx0XHQuYXR0cihcImNsYXNzXCIsIFwic2xpZGVyc1wiKTsgLy8gYXBwZW5kIGEgZm9ybVxyXG5cclxuXHRkMy5zZWxlY3QoXCJkaXYjZ3JhcGhcIilcclxuXHRcdC5zZWxlY3RBbGwoXCIqXCIpXHJcblx0XHQucmVtb3ZlKCk7IC8vcmVtb3ZlIGxlZnQgc2lkZSBwYXJhbGxlbCBjb29yZCBncmFwaFxyXG5cdGQzLnNlbGVjdChcImRpdiNyYWRhckNoYXJ0XCIpXHJcblx0XHQuc2VsZWN0QWxsKFwiKlwiKVxyXG5cdFx0LnJlbW92ZSgpOyAvL3JlbW92ZSByaWdodCBzaWRlIGdyYXBoXHJcblxyXG5cdGQzLnNlbGVjdChcImRpdiN0aHVtYm5haWxzLWJ0bV9jb250YWluZXJcIilcclxuXHRcdC5zZWxlY3QoXCJkaXYjc29ydGluZ1wiKVxyXG5cdFx0LnNlbGVjdEFsbChcIipcIilcclxuXHRcdC5yZW1vdmUoKTsgLy8gcmVtb3ZlIHNvcnRpbmcgZHJvcC1kb3duXHJcblx0ZDMuc2VsZWN0KFwiZGl2I3RodW1ibmFpbHMtYnRtX2NvbnRhaW5lclwiKVxyXG5cdFx0LnNlbGVjdChcImRpdiNzb3J0aW5nXCIpXHJcblx0XHQudGV4dChcIlwiKTtcclxuXHRkMy5zZWxlY3QoXCJkaXYjdGh1bWJuYWlscy1idG1fY29udGFpbmVyXCIpXHJcblx0XHQuc2VsZWN0KFwiZGl2I3RodW1ibmFpbHMtYnRtXCIpXHJcblx0XHQuc2VsZWN0QWxsKFwiKlwiKVxyXG5cdFx0LnJlbW92ZSgpOyAvLyByZW1vdmUgdGh1bWJuYWlsIGltYWdlc1xyXG5cclxuXHRkMy5zZWxlY3QoXCJkaXYjdGh1bWJuYWlscy1zaWRlX2NvbnRhaW5lclwiKVxyXG5cdFx0LnNlbGVjdChcImRpdiNzb3J0aW5nXCIpXHJcblx0XHQuc2VsZWN0QWxsKFwiKlwiKVxyXG5cdFx0LnJlbW92ZSgpOyAvLyByZW1vdmUgdGh1bWJuYWlsIGltYWdlc1xyXG5cdGQzLnNlbGVjdChcImRpdiN0aHVtYm5haWxzLXNpZGVfY29udGFpbmVyXCIpXHJcblx0XHQuc2VsZWN0KFwiZGl2I3NvcnRpbmdcIilcclxuXHRcdC50ZXh0KFwiXCIpO1xyXG5cdGQzLnNlbGVjdChcImRpdiN0aHVtYm5haWxzLXNpZGVfY29udGFpbmVyXCIpXHJcblx0XHQuc2VsZWN0KFwiZGl2I3RodW1ibmFpbHMtc2lkZVwiKVxyXG5cdFx0LnNlbGVjdEFsbChcIipcIilcclxuXHRcdC5yZW1vdmUoKTsgLy8gcmVtb3ZlIHRodW1ibmFpbCBpbWFnZXNcclxuXHJcblx0ZDMuc2VsZWN0KFwiZGl2I3pvb21lZFwiKVxyXG5cdFx0LnNlbGVjdEFsbChcIipcIilcclxuXHRcdC5yZW1vdmUoKTsgLy9yZW1vdmUgem9vbWVkIGltYWdlIGlmIGFueVxyXG5cdGQzLnNlbGVjdChcImRpdiN2aWV3ZXIzZFwiKVxyXG5cdFx0LnNlbGVjdEFsbChcIipcIilcclxuXHRcdC5yZW1vdmUoKTsgLy9yZW1vdmUgYW55IG9iamVjdCBpbnNpZGUgM0Qgdmlld2VyXHJcblxyXG59XHJcblxyXG5cclxuXHJcbmZ1bmN0aW9uIG92ZXJ3cml0ZUluaXRpYWxHbG9iYWxWYWx1ZXMoKSB7XHJcblx0LypcclxuXHRcdC8vIFRoaXMgZnVuY3Rpb24gaW5pdGlhdGVzIGFsbCB0aGUgZ2xvYmFsIHZhbHVlcyBmb3IgdGhlIHBhZ2VcclxuXHRcdC8vIEknbSBub3Qgc3VyZSBpZiB0aGlzIGlzIHRoZSBiZXN0IHByYWN0aWNlIGluIGphdmFzY3JpcHQgKHByb2JhYmx5IGl0J3Mgbm90KVxyXG5cdFx0Ly8gTGV0IG1lIChnaXRodWIuY29tL21vc3RhcGhhUm91ZHNhcmkpIGtub3cgaWYgeW91IGtub3cgYSBiZXR0ZXIgc29sdXRpb25cclxuXHQqL1xyXG5cclxuXHRvcmlnaW5hbERhdGEgPSBcIlwiOyAvL2NzdiBhcyBpdCBpcyBpbXBvcnRlZFxyXG5cdGNsZWFuZWREYXRhID0gW107IC8vYWxsIHRoZSBjb2x1bW5zIHRvIGJlIHVzZWQgZm9yIHBhcmFsbGVsIGNvb3JkaW5hdGVzXHJcblx0aW5wdXREYXRhID0gW107IC8vIGNvbHVtbnMgd2l0aCBpbnB1dCB2YWx1ZXMgLSB0byBiZSB1c2VkIGZvciBzbGlkZXJzXHJcblx0b3V0cHV0RGF0YSA9IFtdOyAvLyBjb2x1bW5zIHdpdGggb3V0cHV0IHZhbHVlcyAtIHRvIGJlIHVzZWQgZm9yIHJhZGFyIGdyYXBoXHJcblx0c2xpZGVyc0luZm8gPSBbXTsgLy8ge25hbWU6J2lucHV0TmFtZScsIHRpY2tWYWx1ZXMgOiBbc29ydGVkIHNldCBvZiB2YWx1ZXNdfSxcclxuXHRjdXJyZW50U2xpZGVyVmFsdWVzID0ge307IC8vIGNvbGxlY3RvciBmb3IgdmFsdWVzXHJcblx0YWxsRGF0YUNvbGxlY3RvciA9IHt9O1xyXG5cdHNsaWRlcnNNYXBwaW5nID0ge307IC8vIEkgY29sbGVjdCB0aGUgZGF0YSBmb3IgYWxsIHRoZSBpbnB1dCBzbGlkZXJzIGhlcmUgc28gSSBjYW4gdXNlIGl0IHRvIHJlbWFwIHRoZSBzbGlkZXJzIGxhdGVyXHJcblx0aWRzID0gW107IC8vIEhlcmUgSSBjb2xsZWN0IGFsbCBkYXRhIGJhc2VkIG9uIGEgdW5pcXVlIElEIGZyb20gaW5wdXRzXHJcblx0Y2xlYW5lZFBhcmFtczRwYyA9IHt9O1xyXG5cdGdvb2dsZUZvbGRlckxpbmsgPSBcIlwiO1xyXG5cclxuXHRyY2hlaWdodCA9IGhlaWdodCA9IGQzLnNlbGVjdChcIiNncmFwaFwiKVxyXG5cdFx0LnN0eWxlKFwiaGVpZ2h0XCIpXHJcblx0XHQucmVwbGFjZShcInB4XCIsIFwiXCIpO1xyXG5cclxuXHRzZWxlY3RlZERhdGFGb3JtYXR0ZWQgPSBbXTtcclxuXHJcblx0Zmlyc3RSYXRpbmcgPSB0cnVlOyAvLyB2YXJpYWJsZSBmb3Igc3RhciByYXRpbmdcclxuXHJcblx0Ly9zZXQgdXAgaGVpZ2h0cyBvZiBkaXZzIHJvIGRlZmF1bHRcclxuXHR3aW5kb3dXaWR0aCA9IHdpbmRvdy5pbm5lcldpZHRoO1xyXG5cdHdpbmRvd0hlaWdodCA9IHdpbmRvdy5pbm5lckhlaWdodDtcclxuXHRjbGVhbkhlaWdodCA9IHdpbmRvd0hlaWdodCAtIDg1IC0gMjQ7IC8vIDJcclxuXHRjbGVhbldpZHRoID0gd2luZG93V2lkdGggLSAxMDA7XHJcblx0Z3JhcGhIZWlnaHQgPSBjbGVhbkhlaWdodCAvIDM7XHJcblx0em9vbWVkSGVpZ2h0ID0gY2xlYW5IZWlnaHQgLSBncmFwaEhlaWdodDtcclxuXHJcblx0cGNIZWlnaHQgPSBkMy5zZWxlY3QoXCIjZ3JhcGhcIilcclxuXHRcdC5zdHlsZShcImhlaWdodFwiKVxyXG5cdFx0LnJlcGxhY2UoXCJweFwiLCBcIlwiKTtcclxuXHQvLyBoaWRlIHpvb21lZCBhcmVhXHJcblx0ZDMuc2VsZWN0QWxsKFwiLnpvb21lZFwiKVxyXG5cdFx0LnRyYW5zaXRpb24oKVxyXG5cdFx0LmR1cmF0aW9uKDE1MDApXHJcblx0XHQuc3R5bGUoXCJoZWlnaHRcIiwgXCIwcHhcIik7XHJcblx0Ly8gc2hvdyBidG0gdGh1bWJuYWlsXHJcblx0ZDMuc2VsZWN0KFwiI3RodW1ibmFpbHMtYnRtX2NvbnRhaW5lclwiKVxyXG5cdFx0LnRyYW5zaXRpb24oKVxyXG5cdFx0LmR1cmF0aW9uKDEwMDApXHJcblx0XHQuc3R5bGUoXCJoZWlnaHRcIiwgKGNsZWFuSGVpZ2h0IC0gcGNIZWlnaHQpICsgXCJweFwiKTtcclxuXHQvLyBoaWRlIHNpZGUgdGh1bWJuYWlsXHJcblx0ZDMuc2VsZWN0KFwiI3RodW1ibmFpbHMtc2lkZV9jb250YWluZXJcIilcclxuXHRcdC50cmFuc2l0aW9uKClcclxuXHRcdC5kdXJhdGlvbigxNTAwKVxyXG5cdFx0LnN0eWxlKFwiaGVpZ2h0XCIsIFwiMHB4XCIpO1xyXG5cclxuXHJcblx0Ly8gcmUtc2V0IHRoZSB2aWV3ZXIgdG8gMkRcclxuXHRjdXJyZW50VmlldyA9IFwiMkRcIjtcclxuXHQvLyBzZXQgdmlldyB0b2dnbGUgdG8gMkRcclxuXHRkMy5zZWxlY3QoXCJpbnB1dCN0b2dnbGVWaWV3XCIpXHJcblx0XHQucHJvcGVydHkoXCJjaGVja2VkXCIsIFwidHJ1ZVwiKTtcclxuXHJcblx0aW5pdGl0M0RWaWV3ZXIgPSB0cnVlO1xyXG5cdGQzLnNlbGVjdChcIiN6b29tZWRcIilcclxuXHRcdC5hdHRyKFwiY2xhc3NcIiwgXCJ6b29tZWRcIik7XHJcblx0ZDMuc2VsZWN0KFwiI3ZpZXdlcjNkXCIpXHJcblx0XHQuYXR0cihcImNsYXNzXCIsIFwiem9vbWVkIGhpZGRlblwiKTtcclxufVxyXG4iXX0=
