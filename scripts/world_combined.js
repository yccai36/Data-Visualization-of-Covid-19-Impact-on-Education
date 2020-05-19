// ======= Utility Functions for World Chart ====== //
// return a JS objet that maps alpha ISO to num ISO
const processISOData = (dataISO) => {
    alphaToNum = {};
    dataISO.forEach((element) => {
        let alpha = element["alpha-3"];
        let num = element["country-code"];
        alphaToNum[alpha] = num;
    });
    return alphaToNum;
};

// process original world data to an array grouped by dates
const processWorldData = (dataOriginal, alphaToNum) => {
    const dateParser = d3.timeParse("%d/%m/%Y");
    let dates = [];
    dataOriginal.forEach((element) => {
        let date = element["Date"];
        if (!dates.includes(date)) {
            dates.push(date);
        }
    });

    let newData = [];
    for (let i = 0; i < dates.length; i++) {
        newData.push([]);
    }
    dataOriginal.forEach((element) => {
        let dateString = element["Date"];
        let date = dateParser(dateString);
        let alphaISO = element["ISO"];
        let country = element["Country"].trim();
        let scale = element["Scale"];
        let numISO = alphaToNum[alphaISO];

        let index = dates.indexOf(dateString);
        let item = {
            date: date,
            dateString: dateString,
            dateIndex: index,
            alphaISO: alphaISO,
            numISO: numISO,
            country: country,
            scale: scale,
        };

        newData[index].push(item);
    });
    return newData;
};

// process world data to generate data of tooltips on world map
const processWorldMapTooltips = (data) => {
    let tooltipData = {};
    data.forEach((oneDayData) => {
        let date = oneDayData[0]["date"];
        let dateString = oneDayData[0]["dateString"];
        let dateIndex = oneDayData[0]["dateIndex"];
        oneDayData.forEach((element) => {
            let alphaISO = element["alphaISO"];
            let numISO = element["numISO"];
            let country = element["country"];
            let scale = element["scale"];
            let item = {
                startDate: date,
                startDateString: dateString,
                startDateIndex: dateIndex,
                scale: scale,
                country: country,
                numISO: numISO,
                alphaISO: alphaISO,
            };

            if (alphaISO in tooltipData) {
                let array = tooltipData[alphaISO];
                let oldItem = array[array.length - 1];
                if (oldItem["scale"] != item["scale"]) {
                    array.push(item);
                }
            } else {
                tooltipData[alphaISO] = [item];
            }
        });
    });

    return tooltipData;
};

// process orginal data, return arraies for 3 group to draw the world line chart
const processDataWorldLine = (dataOriginal, dataISO) => {
    const alphaToNum = processISOData(dataISO);
    const data = processWorldData(dataOriginal, alphaToNum);

    // init data
    let dataNational = [];
    let dataLocalized = [];
    let dataOpen = [];

    data.forEach((element) => {
        let date = element[0]["date"];
        let dateString = element[0]["dateString"];
        let dateIndex = element[0]["dateIndex"];
        let countNational = 0;
        let countLocalized = 0;
        let countOpen = 0;

        element.forEach((item) => {
            if (item["scale"] === "National") {
                countNational++;
            } else if (item["scale"] === "Localized") {
                countLocalized++;
            } else if (item["scale"] === "Open") {
                countOpen++;
            }
        });

        let dataOneDayNational = {
            date: date,
            dateString: dateString,
            dateIndex: dateIndex,
            scale: "national",
            count: countNational,
        };

        let dataOneDayLocalized = {
            date: date,
            dateString: dateString,
            dateIndex: dateIndex,
            scale: "localized",
            count: countLocalized,
        };

        let dataOneDayOpen = {
            date: date,
            dateString: dateString,
            dateIndex: dateIndex,
            scale: "open",
            count: countOpen,
        };

        dataNational.push(dataOneDayNational);
        dataLocalized.push(dataOneDayLocalized);
        dataOpen.push(dataOneDayOpen);
    });

    return [dataNational, dataLocalized, dataOpen];
};

const updateMapWorld = (surveyData, map, day, colors) => {
    let countries_localized = [];
    let countries_national = [];
    let countries_reopen = [];
    let [
        color_healthy,
        color_sea,
        color_localized,
        color_national,
        color_reopen,
    ] = colors;

    surveyData[day].forEach((row) => {
        if (row.scale == "Localized") {
            countries_localized.push(row.alphaISO);
        } else if (row.scale == "National") {
            countries_national.push(row.alphaISO);
        } else if (row.scale == "Open") {
            countries_reopen.push(row.alphaISO);
        }
    });

    map.selectAll("path").style("fill", color_healthy);
    map.select(".Sphere").style("fill", color_sea);

    countries_localized.forEach((id) => {
        map.select("path#" + id)
            .style("fill", color_localized)
            .append("title")
            .text("localized");
    });

    countries_national.forEach((id) => {
        map.select("path#" + id)
            .style("fill", color_national)
            .append("title")
            .text("national");
    });

    countries_reopen.forEach((id) => {
        map.select("path#" + id)
            .style("fill", color_reopen)
            .append("title")
            .text("reopen!");
    });
};

// ======= World Line Chart ====== //
const generateWorldLineChart = async () => {
    // load orginal data
    const dataOriginal = await d3.csv("../datasets/covid_impact_education.csv");
    const dataISO = await d3.json("../datasets/ISO.json");
    // format data
    const alphaToNum = processISOData(dataISO);
    const surveyData = processWorldData(dataOriginal, alphaToNum);
    const [dataNational, dataLocalized, dataOpen] = processDataWorldLine(
        dataOriginal,
        dataISO
    );
    const colorNational = "red";
    const colorLocalized = "steelblue";
    const colorOpen = "yellow";

    const width = window.innerWidth * 0.45;
    const height = 500;
    const container = d3
        .select("#world-line-container")
        .style("width", width + "px")
        .style("height", height + "px");
    const svg = d3
        .select("#world-line")
        .attr("width", width)
        .attr("height", height);
    const padding = { left: 40, bottom: 40, right: 20, top: 50 };
    const plotWidth = width - padding.left - padding.right;
    const plotHeight = height - padding.bottom - padding.top;

    // Scales
    const countryScale = d3
        .scaleLinear()
        .domain([0, 200])
        .range([plotHeight, 0]);

    // const firstDate = dataLocalized[0]["date"];
    // const lastDate = dataLocalized[dataLocalized.length - 1]["date"];

    const firstDate = new Date(2020, 1, 12);
    const lastDate = new Date(2020, 4, 26);

    const dateScale = d3
        .scaleTime()
        .domain([firstDate, lastDate])
        .range([0, plotWidth]);

    // Gridlines
    const yGridlines = d3
        .axisLeft(countryScale)
        .tickSize(-plotWidth)
        .tickFormat("");
    const xGridlines = d3
        .axisBottom(dateScale)
        .tickSize(-plotHeight)
        .ticks(d3.timeWeek.every(1))
        .tickFormat("");

    // Draw gridlines
    svg.append("g")
        .attr("class", "y gridlines")
        .attr(
            "transform",
            "translate(" + padding.left + "," + padding.top + ")"
        )
        .call(yGridlines);

    // svg.append("g")
    //     .attr("class", "x gridlines")
    //     .attr(
    //         "transform",
    //         "translate(" +
    //             padding.left +
    //             ", " +
    //             (padding.top + plotHeight) +
    //             ")"
    //     )
    //     .call(xGridlines);

    // Axises
    const yAxis = d3.axisLeft(countryScale);

    const xAxis = d3
        .axisBottom(dateScale)
        .tickFormat(d3.timeFormat("%m/%d"))
        .tickSize(5)
        .ticks(d3.timeWeek.every(1))
        .tickPadding(10);

    // Draw Axises
    svg.append("g")
        .attr("class", "x axis")
        .attr(
            "transform",
            "translate(" +
                padding.left +
                ", " +
                (padding.top + plotHeight) +
                ")"
        )
        .call(xAxis);

    svg.append("g")
        .attr("class", "y axis")
        .attr(
            "transform",
            "translate(" + padding.left + ", " + padding.top + ")"
        )
        .call(yAxis);

    // line marker group
    const markerGroup = svg
        .append("g")
        .attr("id", "marker-group")
        .attr(
            "transform",
            "translate(" + padding.left + ", " + padding.top + ")"
        )
        .style("visibility", "hidden");

    const markerLine = markerGroup
        .append("line")
        .attr("id", "marker-line")
        .attr("fill", "none")
        .attr("stroke", "#aaa")
        .attr("stroke-width", "1")
        .attr("y1", 0)
        .attr("y2", plotHeight);

    const markerGroupFixed = svg
        .append("g")
        .attr("id", "marker-fixed-group")
        .attr(
            "transform",
            "translate(" + padding.left + ", " + padding.top + ")"
        )
        .style("visibility", "hidden");

    const markerLineFixed = markerGroupFixed
        .append("line")
        .attr("id", "marker-line")
        .attr("fill", "none")
        .attr("stroke", "#aaa")
        .attr("stroke-width", "1")
        .attr("y1", 0)
        .attr("y2", plotHeight);

    // Plot group
    const plot = svg
        .append("g")
        .attr("class", "plot")
        .attr(
            "transform",
            "translate(" + padding.left + ", " + padding.top + ")"
        );
    const localizedPlot = plot.append("g").attr("class", "localized");

    const nationalPlot = plot.append("g").attr("class", "national");

    const openPlot = plot.append("g").attr("class", "open");

    let lineGenerator = d3
        .line()
        .x((d) => dateScale(d["date"]))
        .y((d) => countryScale(d["count"]));

    const lineWidth = 2;
    const pointRadius = 2;

    // line - localized
    localizedPlot
        .append("path")
        .datum(dataLocalized)
        .attr("id", "localized-line")
        .attr("fill", "none")
        .attr("stroke", colorLocalized)
        .attr("stroke-width", lineWidth)
        .attr("d", lineGenerator);

    // points - localized
    localizedPlot
        .selectAll("circle.point")
        .data(dataLocalized)
        .join("circle")
        .attr("class", "point localized-point normal")
        .attr("id", (d) => "localized" + d["dateIndex"])
        .attr("r", pointRadius)
        .attr("cx", (d) => dateScale(d["date"]))
        .attr("cy", (d) => countryScale(d["count"]))
        .attr("fill", "white")
        .attr("stroke", colorLocalized)
        .attr("stroke-width", 1);

    // line - national
    nationalPlot
        .append("path")
        .datum(dataNational)
        .attr("id", "national-line")
        .attr("fill", "none")
        .attr("stroke", colorNational)
        .attr("stroke-width", lineWidth)
        .attr("d", lineGenerator);

    // points - national
    nationalPlot
        .selectAll("circle.point")
        .data(dataNational)
        .join("circle")
        .attr("class", "point national-point normal")
        .attr("id", (d) => "national" + d["dateIndex"])
        .attr("r", pointRadius)
        .attr("cx", (d) => dateScale(d["date"]))
        .attr("cy", (d) => countryScale(d["count"]))
        .attr("fill", "white")
        .attr("stroke", colorNational)
        .attr("stroke-width", 1);

    // ==== User Interactive Start === //

    const activeGroup = svg
        .append("g")
        .attr("class", "active-group")
        .attr(
            "transform",
            "translate(" + padding.left + ", " + padding.top + ")"
        )
        .attr("visibility", "hidden");

    const activeRect = activeGroup
        .append("rect")
        .attr("class", "active-rect")
        .attr("width", plotWidth)
        .attr("height", plotHeight)
        .attr("fill", "none")
        .attr("pointer-events", "all");

    const tooltip = d3
        .select("#world-line-container")
        .append("div")
        .attr("class", "line-tooltip")
        .style("visibility", "hidden");

    // find the closest date to the mouse position
    const findDate = (data, mouseDate) => {
        let bisector = d3.bisector((d) => d["date"]).right;
        let index = bisector(data, mouseDate);
        // special cases: index == 0, index === data.length
        if (index === 0) return [index, data[index]["date"]];
        if (index === data.length) return [index - 1, data[index - 1]["date"]];

        const date1 = data[index - 1]["date"];
        const date2 = data[index]["date"];
        return mouseDate - date1 < date2 - mouseDate
            ? [index - 1, date1]
            : [index, date2];
    };

    // Add interactive event handlers
    activeRect.on("mouseover", function () {
        markerGroup.style("visibility", "visible");

        activeGroup.style("visibility", "visible");

        tooltip.style("visibility", "visible");
    });

    activeRect.on("mouseout", function () {
        markerGroup.style("visibility", "hidden");
        markerGroupFixed.style("visibility", "hidden");
        activeGroup.style("visibility", "hidden");

        tooltip.style("visibility", "hidden");

        d3.selectAll("circle.national-point")
            .attr("r", 2)
            .attr("fill", "white")
            .attr("stroke", colorNational)
            .attr("stroke-width", 1)
            .classed("normal", true);
        d3.selectAll("circle.localized-point")
            .attr("r", 2)
            .attr("fill", "white")
            .attr("stroke", colorLocalized)
            .attr("stroke-width", 1)
            .classed("normal", true);
    });

    activeRect.on("mousemove", function () {
        // marker line
        // get mouse position
        let [mouseX, mouseY] = d3.mouse(this);
        // get mouse corresponding date
        let mouseDate = dateScale.invert(mouseX);
        // find the closest date
        let [newIndex, newDate] = findDate(dataLocalized, mouseDate);
        let markerX = dateScale(newDate);
        markerLine.attr("x1", markerX).attr("x2", markerX);

        // tooltip content
        let dateString = newDate.toLocaleDateString(undefined, {
            year: "numeric",
            month: "long",
            day: "numeric",
        });
        // let dateString = newDate.toDateString();
        let countLocalized = dataLocalized[newIndex]["count"];
        let countNational = dataNational[newIndex]["count"];
        let tooltipContent = `<p>${dateString}</p><p>Countries national closure: ${countNational}</p><p>Countries localized closure: ${countLocalized}</p>`;

        // tooltip position
        let tooltipTop = padding.top + mouseY + 20;
        let tooltipBottom = plotHeight - mouseY + padding.bottom + 20;
        let tooltipLeft = padding.left + markerX + 20;
        let tooltipRight = plotWidth - markerX + padding.right + 20;

        if (tooltipTop < height * (2 / 3)) {
            tooltip.style("top", tooltipTop + "px").style("bottom", "auto");
        } else {
            tooltip.style("top", "auto").style("bottom", tooltipBottom + "px");
        }

        if (tooltipLeft < width * (2 / 3)) {
            tooltip.style("left", tooltipLeft + "px").style("right", "auto");
        } else {
            tooltip.style("left", "auto").style("right", tooltipRight + "px");
        }
        tooltip.html(tooltipContent);

        // emphasize points
        d3.selectAll("circle.national-point.normal")
            .attr("r", pointRadius)
            .attr("fill", "white")
            .attr("stroke", colorNational)
            .attr("stroke-width", 1);
        d3.selectAll("circle.localized-point.normal")
            .attr("r", pointRadius)
            .attr("fill", "white")
            .attr("stroke", colorLocalized)
            .attr("stroke-width", 1);

        d3.select("circle#national" + newIndex)
            .attr("r", pointRadius + 2.5)
            .attr("fill", colorNational)
            .attr("stroke", "white")
            .attr("stroke-width", 2);
        d3.select("circle#localized" + newIndex)
            .attr("r", pointRadius + 2.5)
            .attr("fill", colorLocalized)
            .attr("stroke", "white")
            .attr("stroke-width", 2);
    });

    activeRect.on("click", function () {
        markerGroupFixed.style("visibility", "visible");

        // marker line
        // get mouse position
        let [mouseX, mouseY] = d3.mouse(this);
        // get mouse corresponding date
        let mouseDate = dateScale.invert(mouseX);
        // find the closest date
        let [newIndex, newDate] = findDate(dataLocalized, mouseDate);
        let markerX = dateScale(newDate);
        markerLineFixed.attr("x1", markerX).attr("x2", markerX);

        // emphasize points
        d3.selectAll("circle.national-point")
            .attr("r", pointRadius)
            .attr("fill", "white")
            .attr("stroke", colorNational)
            .attr("stroke-width", 1)
            .classed("normal", true);
        d3.selectAll("circle.localized-point")
            .attr("r", pointRadius)
            .attr("fill", "white")
            .attr("stroke", colorLocalized)
            .attr("stroke-width", 1)
            .classed("normal", true);

        d3.select("circle#national" + newIndex)
            .attr("r", pointRadius + 2.5)
            .attr("fill", colorNational)
            .attr("stroke", "white")
            .attr("stroke-width", 2)
            .classed("normal", false);
        d3.select("circle#localized" + newIndex)
            .attr("r", pointRadius + 2.5)
            .attr("fill", colorLocalized)
            .attr("stroke", "white")
            .attr("stroke-width", 2)
            .classed("normal", false);

        // update world map
        let map = d3.select("#world-map");

        let color_sea = "lightblue";
        let color_healthy = "white";
        let color_localized = "orange";
        let color_national = "red";
        let color_reopen = "lightgreen";

        let colorsMap = [
            color_healthy,
            color_sea,
            color_localized,
            color_national,
            color_reopen,
        ];

        // update the map to the corresponding date
        currentDateIndexWorld = newIndex;
        d3.select("#world-map-clock").html(dateArray[currentDateIndexWorld]);
        updateMapWorld(surveyData, map, currentDateIndexWorld, colorsMap);
        // pause animation
        clearInterval(animationWorld);
        playingWorld = false;
        d3.select("#world-map-play").html("Play");
    });

    // ==== User Interactive End === //
};

// ====== World Map ===== //
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
    const alphaToNum = processISOData(dataISO);
    let surveyData = processWorldData(dataOriginal, alphaToNum);
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
    for (let i = 0; i < surveyData.length; i++) {
        dateArray.push(
            surveyData[i][0]["date"].toLocaleDateString(undefined, {
                year: "numeric",
                month: "short",
                day: "numeric",
            })
        );
    }
    d3.select("#world-map-play").on("click", function () {
        if (playingWorld == false) {
            playingWorld = true;
            d3.select(this).html("Pause");
            animationWorld = setInterval(function () {
                if (currentDateIndexWorld <= dateArray.length - 1) {
                    //update slider
                    var formatTime = d3.timeFormat("%m/%d");
                    var curDate = formatTime(
                        surveyData[currentDateIndexWorld][0]["date"]
                    );
                    d3.select(".parameter-value").attr(
                        "transform",
                        "translate(" +
                            xLinear(
                                surveyData[currentDateIndexWorld][0]["date"]
                            ) +
                            ",0)"
                    );
                    d3.select(".parameter-value text").text(curDate);
                    // update map to current date
                    updateMapWorld(
                        surveyData,
                        map,
                        currentDateIndexWorld,
                        colors
                    );
                    d3.select("#world-map-clock").html(
                        dateArray[currentDateIndexWorld]
                    );
                    currentDateIndexWorld++;
                } else {
                    // animationWorld completes
                    clearInterval(animationWorld);
                    d3.select("#world-map-play").html("Restart");
                    currentDateIndexWorld = 0;
                    playingWorld = false;
                }
            }, 400);
        } else {
            // pause
            clearInterval(animationWorld);
            playingWorld = false;
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
    var dateEnd = new Date(surveyData[surveyData.length - 1][0]["date"]);
    dateEnd.setDate(dateEnd.getDate() + 1);

    let xLinear = d3
        .scaleLinear()
        .domain([surveyData[0][0]["date"], dateEnd])
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
        let newDate = dateParse(curDate).setFullYear(2020);

        let idx = d3.timeDay.count(startDate, newDate);
        currentDateIndexWorld = idx;
        d3.select("#world-map-clock").html(dateArray[currentDateIndexWorld]);
        updateMapWorld(surveyData, map, currentDateIndexWorld, colors);
        clearInterval(animationWorld);
        playingWorld = false;
        d3.select("#world-map-play").html("Play");
    };
};

// global variables
var animationWorld;
var playingWorld = false;
var currentDateIndexWorld = 0;
var dateArray = [];

// ====== Call functions ====== //
generateWorldLineChart();
generateWorldMap();
