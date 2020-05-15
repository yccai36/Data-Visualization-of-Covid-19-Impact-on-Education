// reference code
// http://bl.ocks.org/rgdonohue/9280446
// info3300's note for March 4(usmap)
var dateArray = [], currentDateIdx = 0,playing = false;
const generateWorldMap = async function () {
    
    d3.select('#world-map-clock').html(dateArray[currentDateIdx]); 
   
    const svg = d3.select("#world-map");
    const width = svg.attr("width");
    const height = svg.attr("height");

    const margin = { top: 20, right: 20, bottom: 20, left: 20 };
    const mapWidth = width - margin.left - margin.right;
    const mapHeight = height - margin.top - margin.bottom;
    const map = svg
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    const world = await d3.json("../datasets/world.json"); // https://cdn.jsdelivr.net/npm/world-atlas@2/countries-50m.json
    console.log("world", world);

    const projection = d3.geoNaturalEarth1();
    const pathGenerator = d3.geoPath().projection(projection);

    const g = svg.append("g");

    //sphere,map edge
    g.append("path")
        .attr("d", pathGenerator({ type: "Sphere" }))
        .attr("class", "Sphere");

    //zoom
    svg.call(
        d3.zoom().on("zoom", () => {
            g.attr("transform", d3.event.transform);
        })
    );

    const countries = topojson.feature(world, world.objects.countries);
    console.log("countries", countries);

    const dataOriginal = await d3.csv("../datasets/covid_impact_education.csv");
    const dataISO = await d3.json("../datasets/ISO.json");
    const AlphaToNum = processISOData(dataISO);
    let surveyData = processWorldData(dataOriginal, AlphaToNum);
    // console.log("=-=-=-=-=-==-", surveyData[3][0]["dateString"]);

    var i;
    for (i = 0; i < surveyData.length; i++) {
        dateArray.push(surveyData[i][0]["dateString"]);
    }
        
    g.selectAll("path")
        .data(countries.features)
        .enter()
        .append("path")
            .attr("d", pathGenerator)
            .attr("class", "country")
            .attr("id", (d) => {
                return "ISO" + d.id;
            })
        .append('title')
            .text(d=>d.properties.name);

    var timer;
    d3.select('#world-map-play') 
    .on('click', function(){
        if(playing == false){
            d3.select(this).html('stop');
            timer = setInterval(function(){
                if(currentDateIdx < dateArray.length-1) {  
                    currentDateIdx +=1; 
                    sequenceMap(currentDateIdx);
                    d3.select('#world-map-clock').html(dateArray[currentDateIdx]);
                    playing = true; 
                } else {
                    d3.select('#world-map-play').html('play');
                    currentDateIdx = 0;
                    clearInterval(timer); 
                    playing = false;
                    g.selectAll("path")
                        .style("fill", 'white');
                    g.select(".Sphere")
                        .style("fill", 'lightblue'); 
                    d3.select('#world-map-clock').html('date');
                }
               
            }, 20);
        }else {   
            clearInterval(timer);   
            d3.select(this).html('play');  
            playing = false;  
        }
    });

    function sequenceMap(day) {
        var countries_localized = [];
        var countries_national = [];
        var countries_reopen = [];
    
        surveyData[day].forEach((row) => {
            if (row.scale == "Localized") {
                countries_localized.push(row.numISO);
            } else if (row.scale == "National") {
                countries_national.push(row.numISO);
            } else if (row.scale == "Open") {
                countries_reopen.push(row.numISO);
            }
    
        }); 
    
        countries_localized.forEach((id) => {
            g.select('path#ISO'+id)
                .style("fill", 'orange' )
                .append('title')
                .text('localized');
        });
    
        countries_national.forEach((id) => {
            g.select('path#ISO'+id)
                .style("fill", 'red' )
                .append('title')
                .text('national');
        });

        countries_reopen.forEach((id) => {
            g.select('path#ISO'+id)
                .style("fill", 'lightgreen' )
                .append('title')
                .text('reopen!');//d=>d.properties.name
        });
    }
};

window.onload = generateWorldMap();