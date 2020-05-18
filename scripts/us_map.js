// Code References:
// 1. INFO5100 Course Lectures on March 04 and March 06
// 2. http://bl.ocks.org/mapsam/6083585
// 3. http://bl.ocks.org/rgdonohue/9280446
// 4. https://bl.ocks.org/d3noob/a22c42db65eb00d4e369
// 5. https://www.d3-graph-gallery.com/graph/custom_legend.html#cont1

var dateArray = [];
var currentDateIdx = 0;
var play = false;
var color_ordered = "rgb(228, 26, 28)";
var color_recommended = "rgb(55, 126, 184)";

const usmapGenerator = async function () {
    // sets the inner HTML with the specified value on all selected elements
    d3.select("#us-map-clock").html(dateArray[currentDateIdx]); 

    const svg = d3.select("#svg3");
    const width = svg.attr("width");
    const height = svg.attr("height");
    const margin = { top: 0, right: 0, bottom: 0, left: 0 };
    const mapWidth = width - margin.left - margin.right;
    const mapHeight = height - margin.top - margin.bottom;

    const map = svg.append("g");

    const us = await d3.json("datasets/us.json");

    // 1a. d3 projection
    var projection = d3
        .geoAlbersUsa()
        .translate([width / 2, height / 2]) // translate to center of screen
        .scale([1280]); // scale things down so see entire US

    // 1b. Define path generator
    var path = d3
        .geoPath() // path generator that will convert GeoJSON to SVG paths
        .projection(projection); // tell path generator to use albersUsa projection

    // 1c. Pick out topographic features
    var states = topojson.feature(us, us.objects.states); // convert TOPOJSON to GeoJSON

    const usNames = await d3.tsv("datasets/us-state-names.tsv"); // loading US 51 states' names

    var idToStateName = [];
    // generate an id for the name of each state
    usNames.forEach( row => {
        idToStateName[row.id] = row.code;
    })

    // 1d. create a tooltip
    var tooltip = d3.select("body")
                    .append("div")
                    .attr("class","tooltip")
                    .style("opacity", 0);
                    // .text("I am the state!");

    // 2a. Draw a  map of states with white stroke
    map.selectAll("path.state")
        .data(states.features)
        .join("path")
        .attr("class", "state")
        .attr("id", d => {
            return idToStateName[d.id];
        })
        .attr("d", path)
        .style("stroke", "black")
        .style("fill", "lightblue")
        .style("stroke-width", 1)
        // displaying the secondary information of the topojson features
        .on("mouseover", function (d) {
            // when the mouse is on the map, display the states Abbrvation
            tooltip.transition()		
                .duration(200)		
                .style("opacity", .8)
            tooltip .html( "StateAbbr:" +  "<br>"  + idToStateName[d.id]  )
                    .style("left",(d3.event.pageX) + "px")
                    .style("top",(d3.event.pageY - 26) + "px");
        })
        .on("mouseout", function (d) {
            // when the mouse if left the map, display nothing
            tooltip.transition()		
                .duration(500)		
                .style("opacity", 0);
        });

    // 3a. loading csv data
    const dataOriginal = await d3.csv(
        // loading the original school closure data
        "datasets/coronavirus-school-closures-data.csv" 
    ); 
    var data = processUSDate(dataOriginal);
    console.log("data", data);

    // 3b. generate an array of beginning dats of the virus pandemic from the processed data
    for (let i = 0; i < data.length; i++) {
        dateArray.push(data[i][0]["dateString"]);
    }

    // 3c. animate the map
    var timer;
    d3.select("button#us-map-play").on("click", function () {
        console.log("click!");
        if (play == false) {
            console.log("play is false");
            d3.select(this).html("stop");
            timer = setInterval(function () {
                if (currentDateIdx < dateArray.length - 1) {
                    currentDateIdx += 1;
                    console.log("currentDateIdx",currentDateIdx);
                    drawMap(currentDateIdx);
                    console.log("currentDate for us-map-clock:", dateArray[currentDateIdx] );
                    d3.select("#us-map-clock").html(dateArray[currentDateIdx]);
                    play = true;
                } else {
                    d3.select("#us-map-play").html("play");
                    currentDateIdx = 0;
                    clearInterval(timer);
                    play = false;
                    map.selectAll("path").style("fill", "white");
                    d3.select("#us-map-clock").html("");
                    drawInitialMap();
                }
            }, 1000);
        } else {
            console.log("play is true");
            clearInterval(timer);
            d3.select(this).html("play");
            play = false;
        }
    });

    // 4a. helper function for drawing the map of a specific day
    // the input argument is the specific date in Month Day Year
    function drawMap(date) {
        
        var states_ordered_closure = [];
        var states_recommended_closure = [];

        data[date].forEach((row) => {
            if (row.status == "ordered") {
                states_ordered_closure.push(row.stateAbbr);
            } else if (row.status == "recommended") {
                states_recommended_closure.push(row.stateAbbr);
            }
        });

        // color the map
        console.log("begin cloring");
        states_ordered_closure.forEach((id) => {
            map.select("path#" + id)
                .style("fill", color_ordered);
        });

        states_recommended_closure.forEach((id) => {
            map.select("path#" + id)
                .style("fill", color_recommended);
        });
    }

    // 4b. draw the state of the initial map
    function drawInitialMap(){
        map.selectAll("path.state")
            .style("fill","lightblue");
    }

    // 4c. draw the legend
    var legendSVG = d3.select("#legend");

    // create the list of legend names
    var legend_names = ["ordered closure", "recommended closure"];

    // make the colorscale
    var colorScale = d3.scaleOrdinal()
                         .domain(legend_names)
                         .range(d3.schemeSet1);

    // add the square for each legend
    legendSVG.selectAll("mysquare")
                .data(legend_names)
                .enter()
                .append("rect")
                .attr("x", 10)
                .attr("y", function(d, i){
                    return 50 + i*30;
                })
                .attr("width", 20)
                .attr("height", 20)
                .style("fill", d => { return colorScale(d) }  );

    // add the text for each legend as the name
    legendSVG.selectAll("mylegend")
                .data(legend_names)
                .enter()
                .append("text")
                .attr("x", 40  )
                .attr("y", function(d, i){
                    return 50 + i*30 + 10 ;
                })
                .style("fill", d => { return colorScale(d) })
                .text( d => { return d })
                .attr("width",50)
                .attr("height",20)
                .attr("text-anchor", "start")
                .style("alignment-baseline", "middle");

};
usmapGenerator();
