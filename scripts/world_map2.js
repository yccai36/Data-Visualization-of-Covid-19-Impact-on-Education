// reference code
// http://bl.ocks.org/rgdonohue/9280446
// info3300's note for March 4(usmap)

const generateWorldMap = async function () {
    let color_sea = "lightblue";
    let color_healthy = "white";
    let color_localized = "orange";
    let color_national = "red";
    let color_reopen = "white";

    let colors = [
        color_healthy,
        color_sea,
        color_localized,
        color_national,
        color_reopen,
    ];

    const width = window.innerWidth * 0.45;
    const height = 500;

    const container = d3
        .select("#world-map-container")
        .style("width", width + "px")
        .style("height", height + "px");

    const svg = d3
        .select("#world-map")
        .attr("width", width)
        .attr("height", height);

    const legendSVG = d3.select("#world-map-legend");
    var legend_names = [
        "localized closure",
        "nationalized closure",
        "open/no record",
    ];
    var legend_range = [color_localized, color_national, color_reopen];

    var colorScale = d3.scaleOrdinal().domain(legend_names).range(legend_range);

    legendSVG
        .selectAll("mysquare")
        .data(legend_names)
        .enter()
        .append("rect")
        .attr("stroke", "gray")
        .attr("stroke-width", "0.02em")
        .attr("x", 10)
        .attr("y", function (d, i) {
            return 50 + i * 30;
        })
        .attr("width", 20)
        .attr("height", 20)
        .style("fill", (d) => {
            return colorScale(d);
        });

    legendSVG
        .selectAll("mylegend")
        .data(legend_names)
        .enter()
        .append("text")
        .attr("x", 40)
        .attr("y", function (d, i) {
            return 50 + i * 30 + 10;
        })
        .style("fill", "black")
        .text((d) => {
            return d;
        })
        .attr("width", 50)
        .attr("height", 20)
        .attr("text-anchor", "start")
        .style("alignment-baseline", "middle");

    //tooltip reference: https://bl.ocks.org/tiffylou/88f58da4599c9b95232f5c89a6321992
    let tooltip = d3
        .select("#world-map-container")
        .append("div")
        .attr("class", "tooltip")
        .style("visibility", "hidden");
    const margin = { top: 20, right: 20, bottom: 20, left: 20 };
    const mapWidth = width - margin.left - margin.right;
    const mapHeight = height - margin.top - margin.bottom;
    const map = svg
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    const world = await d3.json("../datasets/world.json"); // https://raw.githubusercontent.com/plotly/plotly.js/master/dist/topojson/world_50m.json

    const countries = topojson.feature(
        world,
        world.objects.ne_50m_admin_0_countries
    );

    const projection = d3
        .geoNaturalEarth1()
        .fitSize([mapWidth, mapHeight], countries);
    const pathGenerator = d3.geoPath().projection(projection);

    //sphere,map edge
    map.append("path")
        .attr("d", pathGenerator({ type: "Sphere" }))
        .attr("class", "Sphere");

    //zoom
    svg.call(
        d3.zoom().on("zoom", () => {
            map.attr("transform", d3.event.transform);
        })
    );

    const dataOriginal = await d3.csv("../datasets/covid_impact_education.csv");
    const dataISO = await d3.json("../datasets/ISO.json");
    const AlphaToNum = processISOData(dataISO);
    let surveyData = processWorldData(dataOriginal, AlphaToNum);
    const tooltipData = processWorldMapTooltips(surveyData);

    map.selectAll("path")
        .data(countries.features)
        .enter()
        .append("path")
        .attr("d", pathGenerator)
        .attr("class", "country")
        .attr("id", (d) => {
            return d.properties.ISO_A3;
        })
        .on("mouseover", function (d) {
            tooltip.style("visibility", "visible");
        })
        .on("mouseout", function (d) {
            tooltip.style("visibility", "hidden");
        })
        .on("mousemove", function (d) {
            let [mouseX, mouseY] = d3.mouse(this);

            let tooltipTop = margin.top + mouseY + 20;
            let tooltipBottom = mapHeight - mouseY + margin.bottom + 20;
            let tooltipLeft = margin.left + mouseX + 20;
            let tooltipRight = mapWidth - mouseX + margin.right + 20;

            let tooltipContent = `<p>${d.properties.NAME}</p>`;
            if (!tooltipData[d.properties.ISO_A3]) {
                tooltipContent += `<p>No record</p>`;
            } else {
                tooltipData[d.properties.ISO_A3].forEach((row) => {
                    tooltipContent += `<p> ${
                        row["startDate"].toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                        }) +
                        " update: " +
                        row["scale"]
                    }</p>`;
                });
            }

            if (tooltipTop < height * (2 / 3)) {
                tooltip.style("top", tooltipTop + "px").style("bottom", "auto");
            } else {
                tooltip
                    .style("top", "auto")
                    .style("bottom", tooltipBottom + "px");
            }

            if (tooltipLeft < width * (2 / 3)) {
                tooltip
                    .style("left", tooltipLeft + "px")
                    .style("right", "auto");
            } else {
                tooltip
                    .style("left", "auto")
                    .style("right", tooltipRight + "px");
            }
            tooltip.html(tooltipContent);
        });

    // for COVID spread trend animation
    let dateArray = [],
        currentDateIndex = 0,
        playing = false;
    for (let i = 0; i < surveyData.length; i++) {
        dateArray.push(
            surveyData[i][0]["date"].toLocaleDateString(undefined, {
                year: "numeric",
                month: "short",
                day: "numeric",
            })
        );
    }
    let animation;
    d3.select("#world-map-play").on("click", function () {
        if (playing == false) {
            playing = true;
            d3.select(this).html("Pause");
            animation = setInterval(function () {
                if (currentDateIndex <= dateArray.length - 1) {
                    //update slider
                    var formatTime = d3.timeFormat("%m/%d");
                    var curDate = formatTime(
                        surveyData[currentDateIndex][0]["date"]
                    );
                    d3.select(".parameter-value").attr(
                        "transform",
                        "translate(" +
                            xLinear(surveyData[currentDateIndex][0]["date"]) +
                            ",0)"
                    );
                    d3.select(".parameter-value text").text(curDate);
                    // update map to current date
                    updateMapWorld(surveyData, map, currentDateIndex, colors);
                    d3.select("#world-map-clock").html(
                        dateArray[currentDateIndex]
                    );
                    currentDateIndex++;
                } else {
                    // animation completes
                    clearInterval(animation);
                    d3.select("#world-map-play").html("Restart");
                    currentDateIndex = 0;
                    playing = false;
                }
            }, 400);
        } else {
            // pause
            clearInterval(animation);
            playing = false;
            d3.select(this).html("Resume");
        }
    });

    //for COVID situation of a certain day using slider
    //https://bl.ocks.org/johnwalley/e1d256b81e51da68f7feb632a53c3518
    let width_slider = width;
    let height_slider = 100;
    let margin_slider = { top: 20, right: 50, bottom: 50, left: 40 };

    let sliderData = d3.range(0, surveyData.length).map((d) => ({
        //surveyData[d][0]["date"]
        date: surveyData[d][0]["date"],
    }));

    let svg_slider = d3
        .select("div#world-map-slider")
        .append("svg")
        .attr("width", width_slider)
        .attr("height", height_slider);

    //slide bar does not show the last day when domain is larger than 20s, so change domain of xLinear from[mindate, maxdate] to [mindate, maxdate]
    var datebug = new Date(surveyData[surveyData.length - 1][0]["date"]);
    datebug.setDate(datebug.getDate() + 1);

    let xLinear = d3
        .scaleLinear()
        .domain([surveyData[0][0]["date"], datebug])
        .range([margin.left, width - margin.right]);

    let slider = (g) =>
        g
            .attr(
                "transform",
                `translate(0,${height_slider - margin_slider.bottom})`
            )
            .call(
                d3
                    .sliderBottom(xLinear)
                    .step(60 * 60 * 24)
                    .tickFormat(d3.timeFormat("%m/%d"))
                    // .ticks(20)
                    .on("onchange", (value) => draw(value))
            );

    svg_slider.append("g").call(slider);

    let draw = (selected) => {
        let formatTime = d3.timeFormat("%m/%d");
        let curDate = formatTime(selected);
        let startDate = surveyData[0][0]["date"];
        let dateParse = d3.timeParse("%m/%d");
        let date_ = dateParse(curDate);
        date_.setFullYear(2020);
        let idx = d3.timeDay.count(startDate, date_);

        currentDateIndex = idx;
        d3.select("#world-map-clock").html(dateArray[currentDateIndex]);
        updateMapWorld(surveyData, map, currentDateIndex, colors);
        clearInterval(animation);
        playing = false;
        d3.select("#world-map-play").html("Play");
    };
};

generateWorldMap();
