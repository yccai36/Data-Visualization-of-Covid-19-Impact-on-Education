// Code References:
// 1. INFO5100 Course Lectures on March 04 and March 06
// 2. http://bl.ocks.org/mapsam/6083585
// 3. http://bl.ocks.org/rgdonohue/9280446

var dateArray = [];
var currentDateIdx = 0;
var play = false;

const usmapGenerator = async function () {
    d3.select("#us-map-clock").html(dateArray[currentDateIdx]); // sets the inner HTML with the specified value on all selected elements

    const svg = d3.select("#svg3");
    const width = svg.attr("width");
    const height = svg.attr("height");
    const margin = { top: 0, right: 0, bottom: 0, left: 0 };
    const mapWidth = width - margin.left - margin.right;
    const mapHeight = height - margin.top - margin.bottom;

    const map = svg.append("g");
    // .attr("transform","translate("+margin.left+","+margin.top+")");

    // const us = await d3.json("datasets/us.json");
    // const us = await d3.json("datasets/states-albers-10m.json");
    const us = await d3.json("datasets/states-10m.json");

    console.log("us.json loaded");

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
    console.log("states", states);
    // console.log(states.features);
    // var statesMesh = topojson.mesh(us, us.objects.states);  // mesh TopoJSON geometry and convert to GeoJSON lines.
    // console.log(statesMesh);

    // const usNames = await d3.tsv("datasets/us-state-names.tsv"); // loading US 51 states' names
    // console.log("us-state-names data loaded", usNames);

    // var idToState = [];
    // // generate an id for the name of each state
    // usNames.forEach( row => {
    //     idToState[row.id] = row.name;
    // })

    // // filter out an empty entry
    // idToState =  idToState.filter( (element) =>{
    //     return  element.length > 0;
    // });
    // console.log("idToState", idToState);

    // 2a. Draw a  map of states with white stroke
    console.log(states.features);
    map.selectAll("path.state")
        .data(states.features)
        .join("path")
        .attr("class", "state")
        .attr("id", (d) => {
            return d.properties.name;
        })
        .attr("d", path)
        .style("stroke", "black")
        .style("fill", "lightblue")
        .style("stroke-width", 1)
        // displaying the secondary information of the topojson features
        .on("mouseover", function (d) {
            var statesname = d.properties.name;
            return (document.getElementById("sname").innerHTML = statesname); // when the mouse is on the map, display the states name
        })
        .on("mouseout", function (d) {
            return (document.getElementById("sname").innerHTML = null); // when the mouse if left the map, display nothing
        });
    // .append('title')
    //     .text(d => d.properties.NAME);

    //2b. zoom
    // svg.call(d3.zoom().on('zoom',()=>{
    //     map.append("g")
    //         .attr('transform', d3.event.transform);
    // }));

    // // 2c. Make a colour scale
    // const colorScale = d3.scaleQuantile()
    //     .domain(0, 50, 100)
    //     .range(["yellow","blue","red"]);

    // 3a. loading csv data
    const dataOriginal = await d3.csv(
        "datasets/coronavirus-school-closures-data.csv"
    ); // loading the original school clousore data
    var data = processUSDate(dataOriginal);
    console.log("processed data", data);
    // console.log(data[1][1]["dateString"]);

    // generate an array of beginning dats of the virus pandemic from the processed data
    for (let i = 0; i < data.length; i++) {
        dateArray.push(data[i][0]["dateString"]);
    }
    console.log(dateArray);

    // animate the map
    var timer;
    d3.select("button#us-map-play").on("click", function () {
        console.log("click!");
        if (play == false) {
            console.log("play is false");
            d3.select(this).html("stop");
            timer = setInterval(function () {
                if (currentDateIdx < dateArray.length - 1) {
                    currentDateIdx += 1;
                    drawMap(currentDateIdx);
                    d3.select("#us-map-clock").html(dateArray[currentDateIdx]);
                    play = true;
                } else {
                    d3.select("#us-map-play").html("play");
                    currentDateIdx = 0;
                    clearInterval(timer);
                    play = false;
                    map.selectAll("path").style("fill", "white");
                    d3.select("#us-map-clock").html("date");
                }
            }, 10);
        } else {
            console.log("play is true");
            clearInterval(timer);
            d3.select(this).html("play");
            play = false;
        }
    });

    // helper function for drawing the map of a specific day
    // the input argument is the specific date in Month Day Year
    function drawMap(date) {
        // check if the date is out of boundary
        // if ( date < data[0][0]["date"] || date > data[9][0]["date"]){
        //     return ;
        // }
        console.log("intialize");
        var states_ordered_clousore = [];
        var states_recommended_clousore = [];

        data[date].forEach((row) => {
            if (row.status == "ordered") {
                states_ordered_clousore.push(row.State);
            } else if (row.status == "recommended") {
                states_recommended_clousore.push(row.State);
            }
        });

        // color the map
        console.log("begin cloring");
        states_ordered_clousore.forEach((id) => {
            map.select("path#" + id)
                .style("fill", "red")
                .append("title")
                .text("ordered clousore");
        });

        states_recommended_clousore.forEach((id) => {
            map.select("path#" + id)
                .style("fill", "blue")
                .append("title")
                .text("recommened clousore");
        });
    }
};
usmapGenerator();
