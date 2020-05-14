const generateWorldMap = async function () {
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

    var surveyData = await d3.csv("../datasets/covid_impact_education.csv");
    console.log("surveyData", surveyData);

    var countries_localized = [];
    var countries_national = [];
    var countries_reopen = [];

    surveyData.forEach((row) => {
        var date = "16/05/2020";
        if (row.Date == date) {
            if (row.Scale == "Localized") {
                // console.log("Localized country",row.Country)
                countries_localized.push(row.Country);
                // console.log("countries_localized", countries_localized)
            } else if (row.Scale == "National") {
                // console.log("National country",row.Country)
                countries_national.push(row.Country);
            } else if (row.Scale == "Open") {
                // console.log("Open country",row.Country)
                countries_reopen.push(row.Country);
            }
        }
    });

    const colorScale = d3
        .scaleQuantile()
        .domain(["Localized", "National"])
        .range(["#fff", "#d1e8ed"]);
    console.log("colorScale", colorScale);

    g.selectAll("path")
        .data(countries.features)
        .enter()
        .append("path")
        .attr("d", pathGenerator)
        .attr("class", "allcountry")
        .attr("id", (d) => {
            //console.log(d.properties.name);
            return d.properties.name;
        });

    console.log("Hello");

    // countries_localized.forEach( country => {
    //   g.select('path#'+country)
    //     .style("fill", 'orange' );
    // });

    // countries_national.forEach( country => {
    //   g.select('path#'+country)
    //     .style("fill", 'red' );
    // });

    // countries_reopen.forEach( country => {
    //   g.select('path#'+country)
    //     .style("fill", 'lightgreen' );
    // });

    // g.selectAll('path')
    //   .data(countries.features)
    //   .enter().append('path')// we use path in css
    //     .attr('d', pathGenerator)
    //     .attr('class', 'country')
    //   .append('title')
    //     .text(d=>d.properties.name);//【】hover是怎么实现的？？
};
generateWorldMap();
