    const svg = d3.select("#svg3");
    const width = svg.attr("width");
    const height = svg.attr("height");
    const margin = { top: 20, right: 20, bottom: 20, left:20};
    const mapWidth = width - margin.left - margin.right;
    const mapHeight = height - margin.top - margin.bottom;
    const map = svg.append("g")
                    .attr("transform","translate("+margin.left+","+margin.top+")");

    const request_data = async function(){
        const us = await d3.json("datasets/us.json");

        const surveydata = await d3.csv("datasets/coronavirus-school-closures-data.csv");
        
        // d3 projection
        var projection = d3.geoAlbersUsa()
				   .translate([width/2, height/2])    // translate to center of screen
                   .scale([1280]);          // scale things down so see entire US

        // Define path generator
        var path = d3.geoPath()               // path generator that will convert GeoJSON to SVG paths
                    .projection(projection);  // tell path generator to use albersUsa projection   
        
                    
        
    }

    request_data();