function sleep(milliseconds) {
    const date = Date.now();
    let currentDate = null;
    do {
        currentDate = Date.now();
    } while (currentDate - date < milliseconds);
}

const generateWorldMap = async function (day) {
    const svg = d3.select("#svg1");
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
    console.log("=-=-=-=-=-==-", typeof(surveyData));
    var countries_localized = [];
    var countries_national = [];
    var countries_reopen = [];
    // var day = 70;
    // surveyData.forEach((day) => {
        // sleep(2000);
        // day.forEach((row) => {
        surveyData[day].forEach((row) => {
            if (row.scale == "Localized") {
                countries_localized.push(row.numISO);
            } else if (row.scale == "National") {
                countries_national.push(row.numISO);
            } else if (row.scale == "Open") {
                countries_reopen.push(row.numISO);
            }
    
        });
        
    // });



    g.selectAll("path")
        .data(countries.features)
        .enter()
        .append("path")
        .attr("d", pathGenerator)
        .attr("class", "allcountry")
        .attr("id", (d) => {
            return "ISO" + d.id;
        });

    countries_localized.forEach((id) => {
          g.select('path#ISO'+id)
            .style("fill", 'orange' );
    });

    countries_national.forEach((id) => {
          g.select('path#ISO'+id)
            .style("fill", 'red' );
    });

    countries_reopen.forEach((id) => {
          g.select('path#ISO'+id)
            .style("fill", 'lightgreen' );
    });


};


generateWorldMap(20);
sleep(2000);
generateWorldMap(10);




    // g.selectAll('path')
    //   .data(countries.features)
    //   .enter().append('path')// we use path in css
    //     .attr('d', pathGenerator)
    //     .attr('class', 'country')
    //   .append('title')
    //     .text(d=>d.properties.name);//【】hover是怎么实现的？？
