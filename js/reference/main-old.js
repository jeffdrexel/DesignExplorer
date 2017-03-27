var isRightChartFullScreenToggled = false;
var updateScatterChart;
var highlightScatterDot;
var update_sc_colorsOnly;

(function oldDesignExplorer(){
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
})();

(function () {
	//load FolderInfo ,Json data_ Mingbo Peng Modified--------------------------------------------------------------------

	var GID = [];
	var GName = [];
	var csvID = "";
	var key = "AIzaSyCSrF08UMawxKIb0m4JsA1mYE5NMmP36bY";

	function prepareGFolder(GFolderLink) {

		d3.json(GFolderLink, function (data) {
			data.files.forEach(function (item) {
				GID.push(item.id);
				GName.push(item.name);
			});
			if (data.nextPageToken) {
				if (GFolderLink.search("&pageToken=") > 0) {
					GFolderLink = GFolderLink.split("&pageToken=", 1)[0];
				}
				prepareGFolder(GFolderLink + "&pageToken=" + data.nextPageToken);

			} else {
				csvID = GID[GName.findIndex(function (d) {
					return d === "data.csv";
				})];
				if (csvID === undefined) {
					alert("Could not find the data.csv file in this folder, please double check!");
				} else {
					readyToLoad("https://www.googleapis.com/drive/v3/files/" + csvID + "?alt=media&key=" + key);
				}
			}

		});
	}

	function MP_getGoogleIDandLoad(dataMethod) {
		var serverFolderLink;
		// if(isGoodForLoading ==0) return;
		document.getElementById('csv-file')
			.value = "";

		if (dataMethod === "URL") {
			var GfolderORUrl = getUrlVars()
				.GFOLDER;
			document.getElementById("folderLink")
				.value = "";
			if (GfolderORUrl.search("/") == -1) {
				//GfolderORUrl is google folder ID
				serverFolderLink = "https://drive.google.com/drive/folders/" + GfolderORUrl;
			} else {
				serverFolderLink = GfolderORUrl;
			}

		} else {
			serverFolderLink = document.getElementById("folderLink")
				.value;
		}

		var GFolderID = getGFolderID(serverFolderLink);

		if (GFolderID.length == 28) {
			GID = [];
			GName = [];
			csvID = "";
			//GFolderID  = getGFolderID(serverFolderLink);
			//GFolderID = GFolderID[GFolderID.length - 1];
			serverFolderLink = "https://www.googleapis.com/drive/v3/files?q=%27" + GFolderID + "%27+in+parents&key=" + key;
			document.getElementById("folderLinkID")
				.value = GFolderID;

			prepareGFolder(serverFolderLink);
		} else {
			document.getElementById("folderLinkID")
				.value = serverFolderLink;
			readyToLoad(serverFolderLink + "/data.csv");
		}

	}

	function getGFolderID(link) {
		var GoogleID;

		var isGoogleFolderLink;
		if (link.includes("google.com")) {
			isGoogleFolderLink = true;
		}

		if (isGoogleFolderLink) {
			if (link.includes("?usp=sharing")) {
				GoogleID = link.replace("?usp=sharing", "");
			} else if (link.includes("open?id=")) {
				GoogleID = link.replace("open?id=", "");
			} else {
				GoogleID = link;
			}

			GoogleID = GoogleID.split("/");
			GoogleID = GoogleID[GoogleID.length - 1];

		} else {
			//server link
			GoogleID = link;
		}




		return GoogleID;
	}

	function readyToLoad(csvFilePathLink) {
		if (document.getElementById("folderLinkID")
			.value.length > 0) {
			// remove the current selection
			unloadPageContent();
			d3.csv(csvFilePathLink, loadDataToDesignExplorer);
			//window.prompt only if user input data, not from URL
			if (document.getElementById("folderLink")
				.value) {
				getStillLink();
			}

			d3.select("#welcome")
				.style("display", "none");
		} else {
			alert("You have to put Google Drive Folder information first!");
		}

	}

	function getUrlVars() {
		var vars = {};
		var parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function (m, key, value) {
			vars[key] = value;
		});
		return vars;
	}

	function makeUrl(file) {
		var link;
		var folderLinkID = document.getElementById("folderLinkID")
			.value;

		if (folderLinkID.length > 0) {
			//loadImgfrom inputs
			if (folderLinkID.search("/") > 0) {
				//folderUrl is server link
				link = folderLinkID + "/" + file;
			} else {
				//folderUrl is google folder ID
				var nameIndex = GName.findIndex(function (d) {
					return d === file;
				});
				if (file.search(".json") > 0) {
					link = "https://www.googleapis.com/drive/v3/files/" + GID[nameIndex] + "?alt=media&key=" + key;
				} else {
					link = "https://docs.google.com/uc?id=" + GID[nameIndex] + "&export=download";
				}


			}
		} else {
			// file is the valid Url path
			link = file;
		}

		return link;
	}

	function getStillLink() {
		if (document.getElementById("folderLinkID")
			.value.length > 0) {
			var msg;
			if (window.location.href.includes("GFOLDER")) {
				msg = window.location.href;
			} else {
				msg = window.location.href + "?GFOLDER=" + document.getElementById("folderLinkID")
					.value;
			}
			window.prompt("This is the link that you can access next time without loading!", msg);
		} else {
			alert("You have to put online folder information first!");
		}
	}

	function changeLabelSize(size) {
		if (size == "largeLabel") {
			d3.selectAll(".label")
				.style("font-size", "95%");
		} else if (size == "mediumLabel") {
			d3.selectAll(".label")
				.style("font-size", "85%");
		} else if (size == "smallLabel") {
			d3.selectAll(".label")
				.style("font-size", "75%");
		}
	}




	// <!-- Hide sliders if user asked for a stripped down version -->
	// A dictionary to carry users input to customize the interface
	var inputParameters = {
		"min": false
	}; // currently only a single item, other options to be added later

	// get url parameters
	// current valid key is on "min" for minimum interface
	function parseUri() {
		var pars = window.location.search.replace("?", "")
			.split("&");
		if (pars[0] === "") return null;
		pars.forEach(function (d) {
			keyValue = d.split("=");
			inputParameters[keyValue[0].toLowerCase()] = keyValue[1].toLowerCase();
		});
	}

	// read optional url parameters
	parseUri();

	if (inputParameters.min == 'true') {
		// remove the button so sliders are hidden
		d3.selectAll("button#menu-toggle")
			.remove();
	}


	// <!-- welcome div  -->
	sampleFiles = {
		1: "design_explorer_data/LittleRedBox.csv",
		2: "design_explorer_data/default_onload.csv",
		3: "design_explorer_data/AIA building.csv"
	};

	d3.selectAll(".sampleImage")
		.on("click", function () {
			var selSample = d3.select(this);
			var id = selSample[0][0].id.replace("sample", "");

			var filePath = sampleFiles[id];

			// remove the current selection
			unloadPageContent();

			d3.select("div#welcome")
				.style("display", "none");

			// load the new file
			d3.csv(filePath, loadDataToDesignExplorer);
		});


	// <!-- right side chart -->
	// update radar chart
	function updateRadarChart() {
		//format data for radar chart
		var selectedData;
		var outputKeys = d3.keys(outputData[0]);
		if (graph.brushed()
			.length > 0) {
			selectedData = graph.brushed();
		} else {
			selectedData = graph.data();

		}

		//var selectedData = graph.brushed();
		selectedDataFormatted = [];
		radarChartColors = [];

		selectedData.forEach(function (d) {
			selectedDataFormatted.push(formatData(d));
			radarChartColors.push(color(d[pcIsColoredBy]));

		});


		//get height, width for radar chart
		//we want the graph to be centered above the thumbnails
		//65px is to fit text
		var divWidth = d3.select("#thumbnails-side")
			.style("width")
			.replace("px", "");
		var pcHeight = d3.select("#graph")
			.style("height")
			.replace("px", "");
		var rcDimension = Math.min(pcHeight, divWidth) - 65;

		radarGrey = "rgb(160,160,160)";

		//configure radar chart
		cfg = ({
			w: rcDimension,
			h: rcDimension,
			color: function () {
				return radarGrey;
			},
			radius: 4,
			maxValue: 100,
			extraWidthX: divWidth - rcDimension,
			extraWidthY: 65,
			translateX: (divWidth - rcDimension) / 2,
			translateY: 65 / 2,
			levels: 5,
		});

		RadarChart.draw("#radarChart", selectedDataFormatted, cfg);

		//move lines to back
		d3.selectAll(".area")
			.moveToBack();

		//did not work using CSS
		d3.selectAll(".rclegend")
			.style("fill", "steelblue")
			.style("font-size", 9);
	}

	// clean radar chart
	function cleanRadarChart() {
		d3.selectAll(".radar-chart")
			.remove();
	}

	// add scatter chart
	function addScatterChart() {
		var pcHeight = d3.select("#graph")
			.style("height")
			.replace("px", "");
		var rightChartWidth = d3.select("#radarChart")
			.style("width")
			.replace("px", "");
		var selectedData;
		if (graph.brushed()
			.length > 0) {
			selectedData = graph.brushed();
		} else {
			selectedData = graph.data();

		}
		var sm = new ScatterMatrix("", selectedData, '#radarChart');
		sm.cellSize((pcHeight - 60) / 2);
		sm.render();

		// adjust the chart style
		//var chartWidth = d3.select(".scatter-matrix-svg svg").style("width").replace("px", "");
		d3.select(".scatter-matrix-svg")
			.style("width", pcHeight - 10 + "px");

		d3.select(".scatter-matrix-control")
			.style("height", pcHeight - 30 + "px");

		//return sm;

	}

	// //unique id for each Circle
	// function getCircleID(d) {
	//     var id;
	//     var keys = d3.keys(graph.data()[0]);
	//
	//     keys.forEach(function(key) {
	//         id = "scatter_" + cleanString(d[key].toString());
	//     });
	//
	//     return id;
	// }

	updateScatterChart = function() {
		var data = graph.brushed()
			.length > 0 ? graph.brushed() : graph.data();

		d3.selectAll(".cell circle")
			.classed("faded", false)
			.attr("visibility", "hidden");

		data.forEach(function (d) {
			d3.selectAll("#" + getCircleID(d))
				.attr("visibility", "shown");
		});

	}

	highlightScatterDot=function() {
		var data = graph.highlighted();
		if (data.length > 0) {

			d3.selectAll(".cell circle")
				.classed("faded", true);

			unlighlightScatter();

			data.forEach(function (d) {
				d3.selectAll("#" + getCircleID(d))
					.classed("highlighted", true);
			});

		}

	}

	function unlighlightScatter() {
		d3.selectAll(".cell circle")
			.classed("highlighted", false);

	}


	// <!-- Dynamic Divs script -->
	var isAnyItemSelected = false;
	var isToggled = true;
	var isScatterToggled = true;
	var isLeftChartFullScreenToggled = false;
	// var isRightChartFullScreenToggled = false;
	var windowWidth = window.innerWidth,
		windowHeight = window.innerHeight;

	// side bar for sliders
	$("#menu-toggle")
		.click(function (e) {
			e.preventDefault();

			//$("#wrapper").toggleClass("toggled");
			isToggled = !isToggled;
			d3.select("#wrapper")
				.classed("toggled", isToggled)
				.transition()
				.duration(500); //length of toggle animation
			//.each("end", resizeRadarChart())
		});


	$("#scatter-menu-toggle, .scatter-matrix-control")
		.click(function (e) {

			isScatterToggled = !isScatterToggled;
			d3.select(".scatter-matrix-control")
				.classed("toggled", isScatterToggled);
		});


	//--------------------------------------------------set right side chart full screen -----------------------------------//

	var divWidth = d3.select(".col-lg-3")
		.style("width")
		.replace("px", "");

	$("#scatter-fullscreen-toggle")
		.click(function (e) {
			isRightChartFullScreenToggled = !isRightChartFullScreenToggled;

			d3.selectAll(".col-lg-3,.chartSide,.col-lg-3 .row-fluid,.thumbnailSide,#copyRightButton, .scatter-matrix-container circle")
				.classed("rightChartFullScreenToggled", isRightChartFullScreenToggled);
			// .transition().duration(100);

			d3.select("#thumbnails-side_container")
				// .transition().duration(100)
				.style("height", function () {
					if (isRightChartFullScreenToggled) {
						return windowHeight - 220 + "px";
					} else {
						return d3.select("#zoomedArea")
							.style("height")
							.replace("px", "");
					}
				});

			// d3.selectAll(".col-lg-3 .row, #rightTopButtonGroup")
			//     .transition().delay(100)
			//     .transition().duration(1000)
			//     .style("width", function() {
			//         if (isRightChartFullScreenToggled) {
			//             return windowWidth - 50 + "px";
			//         } else {
			//             return;
			//         }
			//     });

			d3.selectAll(".col-lg-9,#thumbnails-btm_container") // hide left side
				.transition()
				.delay(200)
				.style("display", function () {
					if (isRightChartFullScreenToggled) {
						return "none";
					} else {
						return "block";
					}
				});


			d3.select(".scatter-matrix-svg") // for centering the chart
				.style("width", function () {
					if (isRightChartFullScreenToggled) {
						return windowHeight - 200 + "px";
					} else {
						return d3.select("#graph")
							.style("height")
							.replace("px", "") - 20 + "px";
					}
				});

			d3.select(".scatter-matrix-control")
				.style("height", function () {
					if (isRightChartFullScreenToggled) {
						return windowHeight - 200 + "px";
					} else {
						return d3.select("#graph")
							.style("height")
							.replace("px", "") - 20 + "px";
					}
				});

		});



	// update layout on select
	function updateLayoutOnSelect() {

		var selectedImage = d3.select(this);

		// highlight the line graph
		graph.highlight(selectedImage.data());


		// update rating based
		setStarValue(selectedImage.data()[0].Rating);

		// find height of parallel coordinate
		// to find the height for zoomed div
		var pcHeight = d3.select("#graph")
			.style("height")
			.replace("px", "");

		// show zoomed area
		d3.selectAll(".zoomed")
			.transition()
			.duration(1500)
			.style("height", (cleanHeight - pcHeight) + "px");

		// hide btm thumbnail
		d3.select("#thumbnails-btm_container")
			.transition()
			.duration(1000)
			.style("height", function () {

				return isLeftChartFullScreenToggled ? "auto" : "0px";
			});

		// push the image to zoomed area


		d3.selectAll(".zoomed")
			.select("img")
			.data(selectedImage.data())
			.attr("src", makeUrl(selectedImage.datum()
				.img))
			.attr("title", getTitle);

		// load 3d geometry if the view is set to 3D
		if (currentView == "3D") loadNew3DModel();

		if (!isAnyItemSelected) {
			// if there is a brushed selection
			// update the range of the sliders
			updateSlidersTickValues();
		}

		// update the values for slider
		updateSlidersValue(graph.highlight()[0]);

		// enable sliders
		enableAllSliders();

		//highlight the radar chart  //-----TODO:here needs a switch for different charts-------
		//rc.highlight(selectedImage.data());
		highlightScatterDot();


		// var radarHeight = d3.select("#radarChart")
		//     .style("height").replace("px", "");

		// let's side thumbnail show up
		d3.select("#thumbnails-side_container")
			.transition()
			.duration(1500)
			.style("height", function () {

				if (isRightChartFullScreenToggled) {
					return d3.select(".scatter-matrix-svg")
						.style("width")
						.replace("px", "") - 20 + "px";
				} else {
					return (cleanHeight - pcHeight) + "px";
				}
				//console.log(isRightChartFullScreenToggled);

			});

		isAnyItemSelected = true;

	}


	// update layout on select
	function updateLayoutOnDeselect() {

		// find height of parallel coordinate
		// to find the height for thumbnail div
		var pcHeight = d3.select("#graph")
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

		// unhighlight the line graph
		graph.unhighlight();

		// enable sliders
		disableAllSliders();

		// unhighlight the radar chart        //-----TODO:here needs a switch for different charts-------//
		//rc.unhighlight();
		unlighlightScatter();

		//show radar chart
		$("#radarChart")
			.collapse("show");

		isAnyItemSelected = false;
	}

	// hide/show parallel coordinates
	d3.select("#pcgraph")
		.on("click", function () {
			if (cleanedData.length === 0) return; // don't let the user change the size before loading the file

			var height = d3.select("#graph")
				.style("height")
				.replace("px", "");

			if (height > 1) { //for some reasons, height ! == 0 doesn't work at here
				// collapse
				d3.select("#graph")
					.attr("class", "parcoords collapse 2s")
					.transition()
					.duration(200)
					.style("height", "0px");

				//disable buttons
				d3.select("#reset")
					.classed("disabled", true);
				d3.select("#remove")
					.classed("disabled", true);
				d3.select("#keep")
					.classed("disabled", true);


				if (graph.highlight()
					.length !== 0) {

					d3.selectAll(".zoomed")
						.transition()
						.duration(1)
						.style("height", cleanHeight + "px")
						.each("end", function () {
							// resize view
							if (currentView == "3D") {
								va3cViewer.viewerDiv.resize();
							}
						});

				} else {

					//mirror collapse behavior with radar chart
					$("#radarChart")
						.collapse("hide");

					d3.select("#thumbnails-btm_container")
						.transition()
						.duration(1000)
						.style("height", cleanHeight + "px");
				}

			} else {
				// collapse in
				d3.select("#graph")
					.transition("ease out")
					.attr("class", "parcoords collapse in")
					.transition()
					.duration(350)
					//.transition().duration(2000)
					.style("height", graphHeight + "px");

				//enable buttons
				d3.select("#reset")
					.classed("disabled", false);
				d3.select("#remove")
					.classed("disabled", false);
				d3.select("#keep")
					.classed("disabled", false);

				// if there is a selecion let it in
				if (graph.highlight()
					.length !== 0) {
					d3.selectAll(".zoomed")
						.transition()
						.duration(2000)
						.style("height", zoomedHeight + "px");
				} else {

					//mirror collapse behavior with radar chart
					$("#radarChart")
						.collapse("show");

					d3.select("#thumbnails-btm_container")
						.transition()
						.duration(1000)
						.style("height", zoomedHeight + "px");
				}
			}
		});

	//hide/show radar chart
	d3.select("#rcgraph")
		.on("click", function () {

			if (cleanedData.length === 0) return; // don't let the user change the size before loading the file

			var height = d3.select("#radarChart")
				.style("height")
				.replace("px", "");

			if (height > 1) {

				if (!isAnyItemSelected) {
					//collapse parcoords if there is nothing selected
					d3.select("#graph")
						.attr("class", "parcoords collapse 2s")
						.transition()
						.duration(200)
						.style("height", "0px");

					//disable buttons
					d3.select("#reset")
						.classed("disabled", true);
					d3.select("#remove")
						.classed("disabled", true);
					d3.select("#keep")
						.classed("disabled", true);

					d3.select("#thumbnails-btm_container")
						.transition()
						.duration(1000)
						.style("height", cleanHeight + "px");
				}

				//collapse radar chart
				$("#radarChart")
					.collapse("hide");

				// set height for thumbnails-side_container
				d3.select("#thumbnails-side_container")
					.transition()
					.duration(1500)
					.style("height", cleanHeight + "px");

			} else {
				if (!isAnyItemSelected) {
					//expand parcoords
					d3.select("#graph")
						.transition("ease out")
						.attr("class", "parcoords collapse in")
						.transition()
						.duration(350)
						//.transition().duration(2000)
						.style("height", graphHeight + "px");

					//enable buttons
					d3.select("#reset")
						.classed("disabled", false);
					d3.select("#remove")
						.classed("disabled", false);
					d3.select("#keep")
						.classed("disabled", false);

					d3.select("#thumbnails-btm_container")
						.transition()
						.duration(1000)
						.style("height", zoomedHeight + "px");
				}

				//expand radar chart
				$("#radarChart")
					.collapse("show");

				// not the best practice - I should get it to work in a cleaner way
				setTimeout(function () {

					var rcheight = d3.select("#radarChart")
						.style("height")
						.replace("px", "");

					// set height for thumbnails-side_container
					d3.select("#thumbnails-side_container")
						.transition()
						.duration(1000)
						.style("height", (cleanHeight - rcheight) + "px");
				}, 500);

			}
		});


	// <!-- process input data -->
	// this script imports the csv file and does the initial data processing
	// such as separating inputs, outputs, images, etc.
	var originalData, //csv as it is imported
		cleanedData = [], //all the columns to be used for parallel coordinates
		inputData = [], // columns with input values - to be used for sliders
		outputData = [], // columns with output values - to be used for radar graph
		slidersInfo = [], // {name:'inputName', tickValues : [sorted set of values]},
		currentSliderValues = {}, // collector for values
		allDataCollector = {},
		slidersMapping = {}, // I collect the data for all the input sliders here so I can use it to remap the sliders later
		ids = [], // Here I collect all data based on a unique ID from inputs
		cleanedParams4pc = {};


	function analyzeInputData(originalData) {
		var keys = d3.keys(originalData[0]);
		// var id = 0;

		originalData.forEach(function (row, rowCount) {

			var inputParams = {},
				outputParams = {},
				cleanedParams = {};

			keys.forEach(function (key, i) {

				// if (key.trim().startsWith("in:") !== true) {console.log("there is no inputs");}
				if (key.trim()
					.startsWith("in:")) {

					inputParams[key.replace("in:", "")
						.trim()] = row[key];
					cleanedParams[key.replace("in:", "")
						.trim()] = row[key];
					cleanedParams4pc[key.replace("in:", "")
						.trim()] = {};


				} else if (key.trim()
					.startsWith("out:")) {

					outputParams[key.replace("out:", "")
						.trim()] = row[key];
					cleanedParams[key.replace("out:", "")
						.trim()] = row[key];
					cleanedParams4pc[key.replace("out:", "")
						.trim()] = {};

				} else {
					cleanedParams[key.trim()] = row[key]; // I need to add case for image and 3D here later
					if (key.trim() != "img" && key.trim() != "threeD") {
						cleanedParams4pc[key.trim()] = {};
					}
				}
			});

			// var id = getCaseId(inputParams);
			// id += 1;
			// ids.push(id);
			var id = getCaseId(inputParams);
			ids.push(id);


			allDataCollector[id] = {};
			//allDataCollector[id]["inputData"] = inputParams; //don't need them for now
			//allDataCollector[id]["outputParams"] = outputParams;
			allDataCollector[id].cleanedParams = cleanedParams;

			inputData.push(inputParams);
			outputData.push(outputParams);
			cleanedData.push(cleanedParams);


		});


		// add rating of 0 to all the options if not already there
		if (keys.indexOf("Rating") == -1) {
			cleanedParams4pc.Rating = {};
			cleanedData.forEach(function (d) {
				d.Rating = 0;
			});
		}

		console.log(inputData,outputData,cleanedData);

	}


	function getCaseId(inputParams) {
		// create the id based on inputs
		var params = [];
		d3.keys(inputParams)
			.forEach(function (key) {
				// remove spaces
				//var k = key.replace(/\s/g, '');
				// convert to numbers and back to string
				// so zeros doesn't make inconsistency
				var value;
				if (isNaN(inputParams[key])) {
					value = inputParams[key];
				} else {
					value = parseFloat(inputParams[key]);
				}

				// add them to params
				//params.push(k);
				params.push(value);
			});

		// join all of them together
		var id = params.join("");
		return id;
	}

	function prepareSlidersInfo() { // modified 6/7/2016 by Mingbo, this is only for input information.
		var sliderNames = d3.keys(inputData[0]);
		var tickValues = {};
		var originalTickValues = {}; // keep track of original values

		// create an object with place holder for tickValues
		sliderNames.forEach(function (name) {
			originalTickValues[name] = [];
			tickValues[name] = [];
			slidersMapping[name] = {};
		});

		// find tick values
		inputData.forEach(function (d, i) {
			sliderNames.forEach(function (name) {
				// check if the value is already in list - add it to the list if not
				if (tickValues[name].indexOf(d[name]) == -1) {
					slidersMapping[name][d[name]] = []; // create an empty list for this value
					tickValues[name].push(d[name]);
					originalTickValues[name].push(d[name]);
				}

				//add the new combination to the list
				slidersMapping[name][d[name]].push(cleanedData[i]);
			});
		});


		// sort values and collect them
		sliderNames.forEach(function (name) {
			//var tValues = tickValues[name].sort();
			var tValues = Object.keys(slidersMapping[name]);
			var oValues = tValues; //it is equal at the beginning
			slidersInfo.push({
				name: name,
				originalTickValues: oValues,
				tickValues: tValues
			});

		});

		// take care of whitespace in slider names! oh people...
		slidersInfo.forEach(function (d) {
			d.namewithnospace = d.name.replace(/\s/g, '');
		});
	}


	// <!-- NOTE:  draw parallel coordinates graph -->
	var graph;

	//set up heights of divs
	var windowWidth = window.innerWidth,
		windowHeight = window.innerHeight,
		cleanHeight = windowHeight - 85 - 24, // 2
		cleanWidth = windowWidth - 100,
		graphHeight = cleanHeight / 3,
		zoomedHeight = cleanHeight - graphHeight,
		opacity = 0.7;

	var pcIsColoredBy;

	var color = d3.scale.linear()
		.range(["#3182bd", "#f33"]);

	function drawParallelCoordinates() {
		// set the height for graph div - this is critical otherwise
		// parallel coordinates graph will be drawn by height of 0px
		d3.select("#graph")
			.style("height", graphHeight + "px");

		// draw parallel coordiantes chart
		// click event should highlight the image in thumbnails and show it in zoomed
		// brush should filter thumbnails
		// get parallel coordinates

		console.log(cleanedParams4pc);

		graph = d3.parcoords()('#graph')
			.data(cleanedData)
			.margin({
				top: 50,
				left: 20,
				bottom: 10,
				right: 20
			})
			.alpha(0.2)
			.mode("queue")
			.rate(20)
			.dimensions(cleanedParams4pc)
			.render()
			.brushMode("1D-axes") // enable brushing
			.interactive()
			.reorderable();
		//.scale("Rating", [0, 5]).updateAxes(); // set initial domain for rating

		// graph.scale("Rating", [0,5]).updateAxes();
		//graph.toTypeCoerceNumbers();

		updateLabels();

	}

	// update pc chart labels and axis color based on input and outputs parameters
	function updateLabels() {
		// modify labels
		var inputLabelColor = "black",
			outputLabelColor = "steelblue",
			inputLabels = d3.keys(inputData[0]),
			outputLabels = d3.keys(outputData[0]),
			colorset = []; //color set for lables

		d3.selectAll("text.label")
			.style("fill", function (d) {
				// change colors for inputs vs outputs
				if (inputLabels.indexOf(d) != -1) {
					colorset.push(inputLabelColor);
					return inputLabelColor; // it is an input

				} else if (outputLabels.indexOf(d) != -1) {
					colorset.push(outputLabelColor);
					return outputLabelColor; //it's an output

				} else {
					// undefined
					colorset.push("black");
					return "black";
				}
			});


		//modify axes
		d3.selectAll("path.domain")
			.style("stroke", function (d, i) {
				return colorset[i];
			});


		setupPcLabelEvent();

	}

	// click label to activate coloring
	function setupPcLabelEvent() {
		d3.selectAll(".dimension")
			.on("click", function (d) {
				pcIsColoredBy = d;
				update_colors(d);
			});
	}

	// update color and font weight of chart based on axis selection
	function update_colors(dim, chart) {
		pcIsColoredBy = dim;

		// change color of lines
		// set domain of color scale
		var values = graph.data()
			.map(function (d) {
				return parseFloat(d[dim]);

			});

		colorDomain = color.domain(d3.extent(values));

		// change colors for each line
		graph.color(function (d) {
				return color([d[dim]]);
			})
			.render();

		// change border color for images
		d3.selectAll("img#thumbnails-btm")
			.style("border-color", function (d) {
				//console.log(color(d[dim]));
				return color(d[dim]);
			});
		d3.selectAll("img#thumbnails-side")
			.style("border-color", function (d) {
				return color(d[dim]);
			});

		// change ScatterMatrix dots color
		update_sc_colorsOnly();

	}

	//update_sc_colorsOnly
	update_sc_colorsOnly=function() {
		d3.selectAll(".cell circle")
			.style("fill", function (d) {
				return color(d[pcIsColoredBy]);
			});

	}


	// <!-- draw legend -->
	function drawLegend() {

		// add text
		//d3.select("#legend-heading").text("LEGEND");

		// get width and height for legend area
		var legendWidth = d3.select("#legend")
			.style("width")
			.replace("px", "");
		var legendHeight = d3.select("#sidebar-wrapper")
			.style("height")
			.replace("px", "") / 3;

		// legend boxes are diminsions of the graph
		//console.log(Object.keys(graph.dimensions()));
		dimensions = d3.keys(graph.dimensions())
			.map(function (d) {
				return {
					name: d,
					enabled: true
				};
			});

		// find size of the square based on the height
		//var legendSquareSize = 16;
		var legendSquareSize = Math.max(legendHeight / (d3.keys(graph.dimensions())
			.length + 4), 12);

		// create one group for each rect and text
		var legend = d3.select("#legend")
			.append("svg")
			.attr("width", legendWidth)
			.attr("height", legendHeight)
			.selectAll("g")
			.data(dimensions)
			.enter()
			.append("g")
			.attr("transform", function (d, i) {
				return "translate(10," + ((legendSquareSize + 3) * i) + ")";
			});

		legend.append("rect")
			.attr("width", legendSquareSize)
			.attr("height", legendSquareSize)
			.attr("class", "legend")
			.style("fill", "grey")
			.style("stroke", "black")
			.style("stroke-width", 1)
			.style("cursor", "pointer");

		legend.append("text")
			.attr("x", legendSquareSize + 6)
			.attr("y", legendSquareSize / 2)
			.attr("dy", ".35em")
			.text(function (d) {
				return d.name;
			});
	}


	// <!-- add sorting dropdowns -->
	function addSortDropdowns() {

		sortBy = d3.keys(graph.dimensions())[0]; // will be used to sort thumbnail images
		ascending = true;

		var select = d3.selectAll(".sorting")
			.text("Sort by: ")
			.append("select")
			.attr("class", "btn btn-default btn-xs");

		// add options based on input and outputs
		select.selectAll("option")
			.data(d3.keys(graph.dimensions()))
			.enter()
			.append("option")
			.attr("value", function (d) {
				return d;
			})
			.text(function (d) {
				return d;
			});

		// add change event to resort images
		select.on("change", function (d) {
			sortBy = d3.select(this)
				.property("value");

			// update the value in other dropdown menu
			d3.selectAll("select option")
				.filter(function (d) {
					return d == sortBy;
				})
				.attr("selected", "true");

			updateImageGrid(graph.brushed(), false);
		});

		// add option to reverse sorting order
		var sortingBtn = d3.selectAll(".sorting")
			.append("button")
			.attr("type", "button")
			.attr("class", "btn btn-default btn-xs")
			.attr("id", "reverseSortOrder")
			.attr("title", "Reverse sorting order");

		// append icon
		sortingBtn.append("span")
			.attr("class", "glyphicon glyphicon-circle-arrow-up")
			.attr("aria-hidden", "true");

		sortingBtn.on("click", function () {
			ascending = !ascending;

			sortingBtn.selectAll("span")
				.attr("class", function () {
					return ascending ? "glyphicon glyphicon-circle-arrow-up" : "glyphicon glyphicon-circle-arrow-down";
				});

			updateImageGrid(graph.brushed(), false);
		});
	}


	// <!-- add thumbnail images to both thumbnail divs-->
	function getTitle(data) {

		// get title for each image
		var title = [];

		d3.keys(graph.dimensions())
			.forEach(function (key) {
				var info = key + ":" + data[key];
				title.push(info);
			});

		return title.join(" | ");

		//return title.join(" &#013; "); //I tried to add them for each line but it didn't work
	}

	function updateImageGrid(data, resizeImageDiv) {

		// this is based on bootstraps 12 column grid
		// we can replace it with a fancier version later
		var gridSizes = [1, 2, 3, 4, 6];
		var fgridSize = 1; //gridSizes[gridSize];

		if (!data) data = graph.data(); //if data is false then use graph data

		// sort data based on dropdown selecion
		if (ascending) {
			data.sort(function (x, y) {
				return d3.ascending(parseFloat(x[sortBy]), parseFloat(y[sortBy]));
			});
		} else {
			data.sort(function (x, y) {
				return d3.descending(parseFloat(x[sortBy]), parseFloat(y[sortBy]));
			});
		}

		// remove all the current divs
		// I think eventually I will change this to a filter function
		d3.select("#thumbnails-btm")
			.selectAll("div")
			.remove();
		d3.select("#thumbnails-side")
			.selectAll("div")
			.remove();

		var pcHeight = d3.select("#graph")
			.style("height")
			.replace("px", "");

		if (resizeImageDiv) {
			d3.select("#thumbnails-btm_container")
				.style("height", (cleanHeight - pcHeight) + "px");
		}

		// attach images ---------------------------------------------------------------------------------------------------
		var imgLink = function (d) {
			return makeUrl(d.img);
		};


		d3.select("#thumbnails-btm")
			//.style("height", "100%") //20px for credit line -
			.selectAll("div")
			.data(data)
			.enter()
			.append("div")
			.attr("class", "col-xs-1")
			.style("cursor", "pointer")
			.append("img")
			.attr("id", "thumbnails-btm")
			.attr("src", imgLink)
			.on("click", updateLayoutOnSelect)
			.attr("title", getTitle)
			.style("border-color", function (d) {
				return color(d[pcIsColoredBy]);
			});

		d3.select("#thumbnails-side")
			.selectAll("div")
			.data(data)
			.enter()
			.append("div")
			.attr("class", "col-xs-3")
			.style("cursor", "pointer")
			.append("img")
			.attr("id", "thumbnails-side")
			.attr("src", imgLink)
			.on("click", updateLayoutOnSelect)
			.attr("title", getTitle)
			.style("border-color", function (d) {
				return color(d[pcIsColoredBy]);
			});
	}


	function addPlaceHolderImage() {
		// add an image holder with toggle between 2D and 3D
		// just toggle between 2d and 3d
		d3.select("#zoomed")
			.style("height", zoomedHeight)
			.append("img");
		//.attr("src", "https://raw.githubusercontent.com/tt-acm/DesignExplorer/gh-pages/design_explorer_data/img/placeholder/placeholder.png?token=ACx89Xl7jGRusi88wWHKH97INGjRifH5ks5Vy6YGwA%3D%3D");
	}


	// <!-- set up events between charts and graphs -->

	function setupEvents() {
		// brushing events for parallel coordinates graph
		graph.on("brush", function (d) {
			//rc.updateData(graph.brushed());   //-----TODO:here needs a switch for different charts-------
			updateScatterChart();
			updateImageGrid(d, false);
		});

		graph.on("brushend", function (d) {

			// if nothing is highlighted return
			if (graph.highlight()
				.length === 0) return;

			// in case highlighted data not in brused then deselect
			if (graph.brushed()
				.length == inputData.length || graph.brushed()
				.indexOf(graph.highlight()[0]) == -1) {
				updateLayoutOnDeselect();
			}
		});

		// assign buttons
		// Keep brushed (zoom to selection)
		d3.select("#keep")
			.on("click", function () {

				var newData = graph.brushed();
				if (newData === false || newData.length === 0) {
					alert("You need to select some data to be kept!");
				} else {
					graph.data(newData)
						.dimensions(d3.keys(graph.dimensions()));
					updateSlidersTickValues();

				}
			});

		d3.select("#remove")
			.on("click", function () {

				var selectedData = graph.brushed();

				if (selectedData === false || selectedData.length === 0) {
					alert("You need to select some data to be removed!");
				} else {
					// update graph with new data
					var newData = graph.data()
						.filter(function (d) {
							return selectedData.indexOf(d) == -1;
						});
					updateGraph(newData);
				}
			});

		// go back to original
		d3.select("#reset")
			.on("click", function () {
				updateGraph(cleanedData);

			});


		function updateGraph(newData) {
			graph.data(newData)
				.brushReset()
				.render()
				.interactive()
				.reorderable();
			//updateRadarChart();                   //-----TODO:here needs a switch for different charts-------
			updateScatterChart();
			updateLayoutOnDeselect();
			updateImageGrid(newData, false);
			updateSlidersTickValues();
		}


		d3.selectAll("rect.legend")
			.on('click', function (d) {
				var rect = d3.select(this);
				var name = d.name;
				var enabled = true;


				if (rect.attr('class') === 'legend disabled') {
					rect.attr('class', 'legend');
				} else {
					rect.attr('class', 'legend disabled');
					enabled = false;
				}

				// update dimensions
				dimensions.forEach(function (dim) {
					if (d.name === name) d.enabled = enabled;
				});

				// get active dimensios to update parallel coordinate charts
				var activeDimensions = dimensions.filter(function (d) {
						return (d.enabled) ? 1 : 0;
					})
					.map(function (d) {
						return d.name;
					});
				//console.log(activeDimensions);
				graph.dimensions(activeDimensions);

				if (graph.highlighted()
					.length !== 0) graph.highlight(graph.highlighted());
			});



		//turn off rating rectangle
		d3.selectAll("rect.legend")
			.attr("class", function (d) {

				if (d.name == "Rating") {
					d.enabled = false;
					return 'legend disabled';
				}
			});

		// remove Rating for on page load
		var activeDimensions = dimensions.filter(function (d) {
				return d.name != "Rating";
			})
			.map(function (d) {
				return d.name;
			});
		graph.dimensions(activeDimensions);



		// set left chart full screen
		var oldpcHeight = d3.select("#graph")
			.style("height")
			.replace("px", "");
		var oldpcWidth = d3.select("#graph")
			.style("width")
			.replace("px", "");
		var newpcHeight = (windowHeight - 109) * 0.5;
		var newpcWidth = windowWidth - 30;

		d3.select("#pcFullScreen-toggle")
			.on("click", function () {

				isLeftChartFullScreenToggled = !isLeftChartFullScreenToggled;

				d3.select(".col-lg-3") //hide right side
					.transition()
					.delay(200)
					.style("display", function () {
						if (isLeftChartFullScreenToggled) {
							return "none";
						} else {
							return "block";
						}
					});

				d3.select(".col-lg-9")
					.transition()
					.duration(500)
					.style("height", function () {
						if (isLeftChartFullScreenToggled) {
							return newpcHeight + 30 + "px";
						} else {
							return "auto";
						}
					})
					.style("width", function () {
						if (isLeftChartFullScreenToggled) {
							return newpcWidth + "px";
						} else {
							return oldpcWidth + "px";
						}
					});

				d3.selectAll(".zoomed")
					.transition()
					.duration(500)
					.style("width", function () {
						if (isLeftChartFullScreenToggled) {
							return "0px";
						} else {
							return "100%";
						}
					});

				d3.select(".row-fluid #thumbnails-btm_container")
					.transition()
					.duration(500)
					.style("height", function () {
						if (isLeftChartFullScreenToggled) {
							return "auto";
						} else {
							return d3.select("#zoomedArea")
								.style("height") == "0px" ? "auto" : "0px";
						}
					});



				// change the chart size;
				var highlightedData = graph.highlighted()
					.length !== 0 ? graph.highlighted() : 0;

				if (isLeftChartFullScreenToggled) {

					graph.width(newpcWidth)
						.height(newpcHeight);
					if (highlightedData !== 0) graph.highlight(highlightedData);

				} else {
					//back to normal size mode

					graph.width(oldpcWidth)
						.height(oldpcHeight);
					if (graph.highlighted()
						.length !== 0) {
						graph.highlight(highlightedData);
					}

					//show left side thumbnails FIXME: when fullscreen size back to normal size, zoomed area not showing properly
					d3.select("#thumbnails-side_container")
						.transition()
						.duration(1500)
						.style("height", (newpcHeight * 2) - oldpcHeight + "px");
				}

				updateLabels();

			});


	}


	// <!-- import data  //  onload functions to close intro window and read input data -->
	function loadDataToDesignExplorer(data) {
		// analyze data and separate them as input/output and general data
		analyzeInputData(data);

		// get sliders information based on input data
		prepareSlidersInfo();

		// add sliders to the page
		initiateSliders();

		// draw parallel coordinates graph
		drawParallelCoordinates();

		//draw radar chart
		//updateRadarChart();                //-----TODO:here needs a switch for different charts-------

		//draw scatter chart
		addScatterChart();

		// set color change
		// set the initial coloring based on the 3rd column
		pcIsColoredBy = d3.keys(graph.dimensions())[0];
		update_colors(pcIsColoredBy);

		// draw legend in side bar
		drawLegend();

		// add sorting divs
		addSortDropdowns();

		// add thumbnails
		updateImageGrid(graph.data(), true); // true will set the size of btm div

		// add place holder image to zoomed area
		addPlaceHolderImage();

		// set up events between graphs
		setupEvents();
	}


	window.onload = function () {
		if (window.location.href.toUpperCase()
			.search("GFOLDER") > 0) {
			// this is old user with google drive files.
			d3.select("#welcome")
				.style("display", "none");
			MP_getGoogleIDandLoad("URL");
			// if(GfolderORUrl.search("/")>0){
			//     //GfolderORUrl is server link
			//     filePath = GfolderORUrl + "/data.csv";
			// }else{
			//     //GfolderORUrl is google folder ID
			//     filePath = "https://www.googleapis.com/drive/v3/files?q=%27" + GfolderORUrl  + "%27+in+parents&key="+ key;
			//     console.log("110:"+filePath);
			//     prepareGFolder(filePath, function(d){
			//         console.log("111:"+d);
			//         readyToLoad(GfolderORUrl,d);
			//         // d3.csv(d, loadDataToDesignExplorer);
			//     });
			// }

		} else {
			// load default data
			//parse the csv data from the design_explorer_data folder
			d3.csv("/design_explorer_data/default_onload.csv", loadDataToDesignExplorer);

		}

		//function to close intro window div
		d3.selectAll("#close, #loadDataclose")
			.on("click", function () {
				d3.select("#welcome")
					.style("display", "none");
			});

		d3.select("#showLoadData")
			.on("click", function () {

				d3.select("#welcome")
					.style("display", "flex");

				d3.select("#welcomeContainer")
					.style("display", "none");

				d3.select("#loadDataContainer")
					.style("display", "block");

			});

		var fileInput = document.getElementById('csv-file');

		fileInput.addEventListener('change', function (e) {
			//clean whatever was added via Google
			document.getElementById("folderLinkID")
				.value = "";

			unloadPageContent();


			var file = fileInput.files[0];
			var reader = new FileReader();

			var regex = /^([a-zA-Z0-9\s_\\.\-:])+(.csv|.txt)$/;


			if (regex.test(file.name.toLowerCase())) {

				// Update project name
				var inputFileName = file.name.toUpperCase()
					.replace(".CSV", "");

				d3.select("p.navbar-brand")
					.text(inputFileName);

				reader.onload = function (e) {

					var inputString = e.target.result;

					// I need to add some defense here
					// separateInputOutputs(e);

					var data = d3.csv.parse(inputString);

					//originalDataLength = data.length;

					if (data !== null) loadDataToDesignExplorer(data);
				};


			} else {
				alert("Please upload a valid CSV file!");
			}

			reader.readAsText(file);
			d3.select("#welcome")
				.style("display", "none");
		});

	}; // end of window.onload


	// <!-- Setting up sliders -->
	function initiateSliders() {
		// this just runs first onload of the page
		// all the sliders should be disabled on load until the user select one of the options
		//d3.select(".sidebar-brand").text("INPUT SLIDERS");

		// insert divs for sliders
		d3.selectAll("#inputSliders")
			.selectAll("div")
			.data(slidersInfo)
			.enter()
			.append("div")
			.attr("class", "inputSlider") // full width
			.text(function (d) {
				return d.name;
			})
			.append("input")
			.attr("id", function (d) {
				return d.namewithnospace;
			})
			.attr("name", function (d) {
				return d.name;
			});


		// if number of ticks is less than 7 then show the numbers under slider
		var showGrid = function (info) {
			return info.tickValues.length < 7;
		};

		// set up slider properties
		// they will be all set to disabled until user selects one option
		slidersInfo.forEach(function (info, i) {

			$("#" + info.namewithnospace)
				.ionRangeSlider({
					grid: showGrid(info),
					prettify_separator: ",",
					values: info.tickValues,
					disable: true,
					onChange: function (data) {
						// remove white spaces
						// var sliderName = data.input[0].name.replace(/\s/g, '');
						updateSliderValue(data.input[0].name, data.from_value);
					}

				});
		});
	}

	function updateSlidersTickValues() {

		// This function only gets called once there is a new selection
		// and for major changes in data selection (reset/exclude/zoom to selection)
		// don't call this frequently as this is a fairly expensive run


		// I need to re-visit this
		if (graph.brushed() == [] || graph.brushed()
			.length == inputData.length) {
			// go back to default
			// disable all sliders once no option is selected
			slidersInfo.forEach(function (info) {
				$("#" + info.namewithnospace)
					.data("ionRangeSlider")
					.update({
						values: info.originalTickValues
					});
			});

		} else {

			var tickValues = {};
			var data;

			slidersInfo.forEach(function (info) {
				tickValues[info.name] = [];
			}); //create an empty list for each slider

			if (!graph.brushed()) {
				// in case graph is just rendered
				data = graph.data();
			} else {
				data = graph.brushed();
			}

			// find tick values
			data.forEach(function (d) {
				slidersInfo.forEach(function (info) {
					// check if the value is already in list - add it to the list if not
					if (tickValues[info.name].indexOf(d[info.name]) == -1) tickValues[info.name].push(d[info.name]);
				});
			});


			slidersInfo.forEach(function (sliderInfo) {

				var sliderName = sliderInfo.name;
				// remove spaces
				var namewithnospace = sliderName.replace(/\s/g, '');
				var newTickValues = tickValues[sliderName].sort();
				//console.log(sliderName);

				// update values in sliderInfo
				sliderInfo.tickValues = newTickValues;

				$("#" + namewithnospace)
					.data("ionRangeSlider")
					.update({
						values: newTickValues
					});
			});

			// update current values
			updateSlidersValue(graph.highlighted()[0]);

		}
	}


	function disableAllSliders() {
		// disable all sliders once no option is selected
		slidersInfo.forEach(function (info) {
			$("#" + info.namewithnospace)
				.data("ionRangeSlider")
				.update({
					disable: true
				});
		});
	}


	function enableAllSliders() {
		// enable all sliders once an option is selected
		// This will be called after selecting a new option
		slidersInfo.forEach(function (info) {
			$("#" + info.namewithnospace)
				.data("ionRangeSlider")
				.update({
					disable: false
				});
		});
	}

	function updateSlidersValue(data) {

		// clear report area
		d3.selectAll("#sliders-report")
			.text("");

		// update the value of all the sliders based on an input object
		// this function will be called when a new option is selected by user
		slidersInfo.forEach(function (info) {
			var value;

			if (isNaN(data[info.name])) {
				value = data[info.name]; // if a number
			} else {
				value = parseFloat(data[info.name]); // otherwise
			}

			currentSliderValues[info.name] = value;

			$("#" + info.namewithnospace)
				.data("ionRangeSlider")
				.update({
					from: info.tickValues.indexOf(value), //update the value
				});
		});
	}


	function updateSliderValue(changedSliderName, newValue) {
		// This function update the value for a single slider
		// All the sliders call this function on update
		if (!isNaN(newValue)) currentSliderValues[changedSliderName] = newValue;

		// create the id
		var id = getCaseId(currentSliderValues);
		var selectedData;

		if (ids.indexOf(id) != -1) {

			selectedData = allDataCollector[id].cleanedParams;
			//console.log(selectedData);

			// update chart
			graph.highlight([selectedData]);

			//update radar chart
			//rc.highlight([selectedData]);
			highlightScatterDot(); //-----TODO:here needs a switch for different charts-------

			// push the image to zoomed area


			d3.selectAll(".zoomed")
				.select("img")
				.attr("src", makeUrl(selectedData.img));

			if (currentView == "3D") loadNew3DModel();

			d3.selectAll("#sliders-report")
				.text("");

		} else {

			// try to remap the values based on slider value
			var possibleCombinations = slidersMapping[changedSliderName][newValue];

			if (possibleCombinations.length == 1) {
				// there is only one combination update the values to the new combination
				updateSlidersValue(possibleCombinations[0]);

			} else {

				// sort them based on distance to current values
				possibleCombinations.sort(function (x, y) {
					return d3.ascending(distanceFromCurrent(x), distanceFromCurrent(y));
				});


				// if it is in the seletion then change the sliders to that value
				selectedData = graph.brushed();

				if (!selectedData) selectedData = graph.data();

				for (var i = 0; i < possibleCombinations.length; i++) {
					var combination = possibleCombinations[i];
					if (selectedData.indexOf(combination) != -1) {
						updateSlidersValue(combination);
						// console.log(i);
						break;
					}
				}
			}

		}
	}

	function distanceFromCurrent(sliderValues) {
		var distance = 0;

		slidersInfo.forEach(function (info) {
			var tValues = info.originalTickValues;
			var d = tValues.indexOf(currentSliderValues[info.name]) - tValues.indexOf(sliderValues[info.name]);
			distance += Math.abs(d);
		});


		return distance;

	}


	// <!-- 3D Viewer -->
	var currentView = "2D";
	var initit3DViewer = true;
	var fullscreen = false;

	// Initiate 3D viewer
	function initiate3DViewer() {

		var jsonFileAddress = makeUrl(graph.highlighted()[0].threeD);
		var viewerId = "viewer3d";

		//load JSON file
		d3.json(jsonFileAddress, function (data) {
			//Initialize a VA3C viewer
			va3cViewer = new SPECTACLES($("#" + viewerId), data, function (app) {
				//call the UI / functionality modules
				app.setBackgroundColor(0xFFFFFF);
			});
		});
	}

	// load new models
	function loadNew3DModel() {
		var jsonFileAddress = makeUrl(graph.highlighted()[0].threeD);
		d3.json(jsonFileAddress, function (data) {
			va3cViewer.loadNewModel(data);
		});
	}


	// toggle between 2d and 3d
	d3.selectAll("input.toggleView")
		.on("change", toggleView);

	function toggleView() {

		currentView = this.value;

		if (currentView == "3D" && initit3DViewer) {

			initit3DViewer = false;

			// initiate the viewer
			initiate3DViewer();

		} else if (currentView == "3D") {

			// user is changing to 3D view so let's load it.
			//$.when(loadNew3DModel()).then(va3cViewer.viewerDiv.resize());
			loadNew3DModel();
		}


		var onOff = {
			"2D": ["zoomed", "viewer3d"],
			"3D": ["viewer3d", "zoomed"]
		};

		d3.select("#" + onOff[currentView][0])
			.attr("class", "zoomed");

		d3.select("#" + onOff[currentView][1])
			.attr("class", "zoomed hidden");

		// remove spectacles footer
		d3.select(".Spectacles_Footer")
			.remove();

		// resize the view
		va3cViewer.viewerDiv.resize();

	}


	// active and de-activate full screen mode
	d3.select("button#fullscreentoggle")
		.on("click", toggleFullscreen);


	function toggleFullscreen() {

		fullscreen = !fullscreen;

		// select zoomed Div and change style
		d3.select("#zoomedArea")
			.attr("class", function () {
				return fullscreen ? "zoomed fullscreen" : "zoomed";
			});

		//make sure width and height are 100%

		d3.select("#viewer3d")
			.style("width", "100%")
			.style("height", "100%");

		d3.select("#zoomed")
			.style("width", "100%")
			.style("height", "100%");

		//change full screen icon
		d3.select("button#fullscreentoggle")
			.select("span")
			.attr("class", function () {
				return fullscreen ? "glyphicon glyphicon-resize-small" : "glyphicon glyphicon-fullscreen";
			});

		if (initit3DViewer) {
			return 0;
		} else {
			va3cViewer.viewerDiv.resize();
		}

	}


	// Rating system
	var firstRating = true;

	// submit the value on change
	$('.star')
		.rating({
			callback: function (value, link) {
				// 'value' is the value selected
				if (firstRating === true) {

					//turn on rating rectangle
					d3.selectAll("rect.legend")
						.attr("class", function (d) {

							if (d.name == "Rating") {
								d.enabled = true;
								return 'legend';
							}
						});

					// add Rating to dimensions
					graph.dimensions(cleanedParams4pc);
					graph.scale("Rating", [0, 5]);
					graph.updateAxes();
					firstRating = false;
				}

				// check if this is the first rating

				// update rating value
				graph.highlighted()[0].Rating = value;

				// this method is not really optimized. I couldn't find a solution just to change          //I agree
				// extent of dimensions for just rating axis

				graph.update()
					.interactive()
					.reorderable();
				//if(graph.brushed()) graph.clear("foreground");

				// highlight selected option
				graph.highlight(graph.highlighted());

			}
		});


	// set the value for rating based on the current value
	function setStarValue(value) {

		// remove any current value
		$('.star')
			.data('rating')
			.current = undefined; // set current value to undefined

		// set current value to undefined
		var offClass = "star-rating rater-0 star star-rating-applied star-rating-live";
		var onClass = offClass + " star-rating-on";

		//select rating divs
		d3.selectAll("div.star-rating")
			.attr("class", function (d, i) {
				return i < value ? onClass : offClass;
			});

	}


	// <!-- saveToCSV -->
	function saveToCSV() {

		// modified from http://stackoverflow.com/questions/14964035/how-to-export-javascript-array-info-to-csv-on-client-side
		var data = graph.brushed() === false ? graph.data() : graph.brushed();
		var csvTitle = d3.keys(data[0]);

		var csvContent = "data:attachment/csv;charset=utf-8,";
		var scidIndex = csvTitle.indexOf("scid");
		csvTitle.splice(scidIndex, 1);

		csvContent += csvTitle.join(",") + "\n"; //add first row

		data.forEach(function (infoArray, index) {
			dataString = d3.values(infoArray);
			dataString.splice(scidIndex, 1);
			dataString = dataString.join(",");
			csvContent += index < data.length ? dataString + "\n" : dataString;

		});

		csvContent = encodeURI(csvContent);

		var a = d3.select("body")
			.append("a")
			.attr("href", csvContent)
			.attr("target", '_blank')
			.attr("download", 'DesignExplorer_SelectedResults.csv');

		a[0][0].click();
	}


})();
