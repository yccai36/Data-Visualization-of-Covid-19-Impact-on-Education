// ======= Utility Functions for US Charts ====== //
// process US school closure data
// return an array grouped by dates
const processUSDate = (dataOriginal) => {
    const dateParser = d3.timeParse("%m/%d/%y");

    let dataFiltered = dataOriginal.filter((element) => {
        return (
            element["State Abbreviation"].length === 2 &&
            element["State Abbreviation"] != "VI"
        );
    });

    let dates = {
        "3/15/20": 0,
        "3/16/20": 1,
        "3/17/20": 2,
        "3/18/20": 3,
        "3/19/20": 4,
        "3/20/20": 5,
        "3/21/20": 6,
        "3/22/20": 7,
        "3/23/20": 8,
        "3/24/20": 9,
    };

    let numToDate = [
        "3/15/20",
        "3/16/20",
        "3/17/20",
        "3/18/20",
        "3/19/20",
        "3/20/20",
        "3/21/20",
        "3/22/20",
        "3/23/20",
        "3/24/20",
    ];

    let newData = [];
    for (let i = 0; i < Object.keys(dates).length; i++) {
        newData.push([]);
    }

    dataFiltered.forEach((element) => {
        let stateName = element["State"].trim();
        let stateAbbr = element["State Abbreviation"];
        let startDateString = element["State Closure Start Date"];
        let startDateIndex = dates[startDateString];
        let startDate = dateParser(startDateString);
        let status = element["State Status"];
        if (status === "State ordered closure") {
            status = "ordered";
        } else {
            status = "recommended";
        }
        let schoolNum = element["State Number of Public Schools"];
        let enrollmentNum = element["State Public School Enrollment"];

        for (let i = startDateIndex; i < newData.length; i++) {
            let item = {
                stateName: stateName,
                stateAbbr: stateAbbr,
                startDate: startDate,
                startDateIndex: startDateIndex,
                startDateString: startDateString,
                status: status,
                schoolNum: schoolNum,
                enrollmentNum: enrollmentNum,
                dateIndex: i,
                dateString: numToDate[i],
                date: dateParser(numToDate[i]),
            };
            newData[i].push(item);
        }
    });

    let emptyItem = {
        stateName: "N/A",
        stateAbbr: "N/A",
        startDate: "N/A",
        startDateIndex: "N/A",
        startDateString: "N/A",
        status: "N/A",
        schoolNum: 0,
        enrollmentNum: 0,
        dateIndex: 0,
        dateString: numToDate[0],
        date: dateParser(numToDate[0]),
    };

    newData[0].push(emptyItem);

    return newData;
};

const processUSMapTooltipData = (dataOriginal) => {
    const dateParser = d3.timeParse("%m/%d/%y");

    let dataFiltered = dataOriginal.filter((element) => {
        return (
            element["State Abbreviation"].length === 2 &&
            element["State Abbreviation"] != "VI"
        );
    });

    let tooltip = {};
    dataFiltered.forEach((element) => {
        let stateName = element["State"].trim();
        let stateAbbr = element["State Abbreviation"];
        let startDateString = element["State Closure Start Date"];
        let startDate = dateParser(startDateString);
        let status = element["State Status"];
        if (status === "State ordered closure") {
            status = "ordered";
        } else {
            status = "recommended";
        }
        let schoolNum = element["State Number of Public Schools"];
        let enrollmentNum = element["State Public School Enrollment"];

        tooltip[stateAbbr] = {
            stateName: stateName,
            startDate: startDate,
            startDateString: startDateString,
            status: status,
            schoolNum: schoolNum,
            enrollmentNum: enrollmentNum,
        };
    });

    return tooltip;
};

// update US slider
const updateSliderUS = (data, day, sliderScaleUS) => {
    let formatTime = d3.timeFormat("%m/%d");
    d3.select("#us-map-slider .parameter-value").attr(
        "transform",
        "translate(" + sliderScaleUS(data[day][0]["date"]) + ",0)"
    );

    d3.select("#us-map-slider .parameter-value text").text(
        formatTime(data[day][0]["date"])
    );
};

// update US map
const updateMapUS = (map, data, date) => {
    map.selectAll("path.state").style("fill", colorEmpty);
    let states_ordered_closure = [];
    let states_recommended_closure = [];

    data[date].forEach((row) => {
        if (row.status == "ordered") {
            states_ordered_closure.push(row.stateAbbr);
        } else if (row.status == "recommended") {
            states_recommended_closure.push(row.stateAbbr);
        }
    });

    // color the map
    states_ordered_closure.forEach((id) => {
        map.select("path#" + id).style("fill", colorOrdered);
    });

    states_recommended_closure.forEach((id) => {
        map.select("path#" + id).style("fill", colorRecommended);
    });
};

// ======= US Line Chart ====== //
// process data to draw US line chart
const processDataUSLine = (dataOriginal) => {
    let data = processUSDate(dataOriginal);

    let dataRecommended = [];
    let dataOrdered = [];

    data.forEach((element) => {
        let date = element[0]["date"];
        let dateString = element[0]["dateString"];
        let dateIndex = element[0]["dateIndex"];

        let countOrdered = 0;
        let countRecommended = 0;

        element.forEach((item) => {
            if (item["status"] === "ordered") {
                countOrdered++;
            } else if (item["status"] === "recommended") {
                countRecommended++;
            }
        });

        let dataOneDayOrdered = {
            date: date,
            dateString: dateString,
            dateIndex: dateIndex,
            status: "ordered",
            count: countOrdered,
        };

        let dataOneDayRecommended = {
            date: date,
            dateString: dateString,
            dateIndex: dateIndex,
            status: "recommended",
            count: countRecommended,
        };

        dataOrdered.push(dataOneDayOrdered);
        dataRecommended.push(dataOneDayRecommended);
    });

    return [dataOrdered, dataRecommended];
};

const generateUSLineChart = async () => {
    const dataOriginal = await d3.csv(
        "../datasets/coronavirus-school-closures-data.csv"
    );
    let data = processUSDate(dataOriginal);
    let [dataOrdered, dataRecommended] = processDataUSLine(dataOriginal);

    const width = window.innerWidth * 0.45;
    const height = 500;
    const container = d3
        .select("#us-line-container")
        .style("width", width + "px")
        .style("height", height + "px");
    const svg = d3
        .select("#us-line")
        .attr("width", width)
        .attr("height", height);
    const padding = { left: 40, bottom: 40, right: 20, top: 50 };
    const plotWidth = width - padding.left - padding.right;
    const plotHeight = height - padding.bottom - padding.top;

    // Scales
    const stateScale = d3.scaleLinear().domain([0, 50]).range([plotHeight, 0]);

    const firstDate = new Date(2020, 2, 14, 12);
    const lastDate = new Date(2020, 2, 24, 12);

    const dateScale = d3
        .scaleTime()
        .domain([firstDate, lastDate])
        .range([0, plotWidth]);

    // Gridlines
    const yGridlines = d3
        .axisLeft(stateScale)
        .tickSize(-plotWidth)
        .tickFormat("");
    const xGridlines = d3
        .axisBottom(dateScale)
        .tickSize(-plotHeight)
        .ticks(d3.timeWeek.every(2))
        .tickFormat("");

    // Draw gridlines
    svg.append("g")
        .attr("class", "y gridlines")
        .attr(
            "transform",
            "translate(" + padding.left + "," + padding.top + ")"
        )
        .call(yGridlines);

    // Axises
    const yAxis = d3.axisLeft(stateScale);

    const xAxis = d3
        .axisBottom(dateScale)
        .tickFormat(d3.timeFormat("%m/%d"))
        .tickSize(0)
        .ticks()
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
    const orderedPlot = plot.append("g").attr("class", "ordered");

    const recommendedPlot = plot.append("g").attr("class", "recommended");

    let lineGenerator = d3
        .line()
        .x((d) => dateScale(d["date"]))
        .y((d) => stateScale(d["count"]));

    const lineWidth = 2.5;
    const pointRadius = 3;

    // line - ordered
    orderedPlot
        .append("path")
        .datum(dataOrdered)
        .attr("id", "ordered-line")
        .attr("fill", "none")
        .attr("stroke", colorOrdered)
        .attr("stroke-width", lineWidth)
        .attr("d", lineGenerator);

    // points - ordered
    orderedPlot
        .selectAll("circle.point")
        .data(dataOrdered)
        .join("circle")
        .attr("class", "point ordered-point normal")
        .attr("id", (d) => "ordered" + d["dateIndex"])
        .attr("r", pointRadius)
        .attr("cx", (d) => dateScale(d["date"]))
        .attr("cy", (d) => stateScale(d["count"]))
        .attr("fill", "white")
        .attr("stroke", colorOrdered)
        .attr("stroke-width", 1);

    // line - recommended
    recommendedPlot
        .append("path")
        .datum(dataRecommended)
        .attr("id", "recommended-line")
        .attr("fill", "none")
        .attr("stroke", colorRecommended)
        .attr("stroke-width", lineWidth)
        .attr("d", lineGenerator);

    // points - recommended
    recommendedPlot
        .selectAll("circle.point")
        .data(dataRecommended)
        .join("circle")
        .attr("class", "point recommended-point normal")
        .attr("id", (d) => "recommended" + d["dateIndex"])
        .attr("r", pointRadius)
        .attr("cx", (d) => dateScale(d["date"]))
        .attr("cy", (d) => stateScale(d["count"]))
        .attr("fill", "white")
        .attr("stroke", colorRecommended)
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
        .select("#us-line-container")
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

        d3.selectAll("circle.ordered-point")
            .attr("r", pointRadius)
            .attr("fill", "white")
            .attr("stroke", colorOrdered)
            .attr("stroke-width", 1)
            .classed("normal", true);
        d3.selectAll("circle.recommended-point")
            .attr("r", pointRadius)
            .attr("fill", "white")
            .attr("stroke", colorRecommended)
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
        let [newIndex, newDate] = findDate(dataOrdered, mouseDate);
        let markerX = dateScale(newDate);
        markerLine.attr("x1", markerX).attr("x2", markerX);

        // tooltip content
        let dateString = newDate.toLocaleDateString(undefined, {
            year: "numeric",
            month: "long",
            day: "numeric",
        });
        // let dateString = newDate.toDateString();
        let countOrdered = dataOrdered[newIndex]["count"];
        let countRecommended = dataRecommended[newIndex]["count"];
        let tooltipContent = `<p>${dateString}</p><p>States ordered closure: ${countOrdered}</p><p>States recommended closure: ${countRecommended}</p>`;

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
        d3.selectAll("circle.ordered-point.normal")
            .attr("r", pointRadius)
            .attr("fill", "white")
            .attr("stroke", colorOrdered)
            .attr("stroke-width", 1);
        d3.selectAll("circle.recommended-point.normal")
            .attr("r", pointRadius)
            .attr("fill", "white")
            .attr("stroke", colorRecommended)
            .attr("stroke-width", 1);

        d3.select("circle#ordered" + newIndex)
            .attr("r", pointRadius + 2.5)
            .attr("fill", colorOrdered)
            .attr("stroke", "white")
            .attr("stroke-width", 2);

        d3.select("circle#recommended" + newIndex)
            .attr("r", pointRadius + 2.5)
            .attr("fill", colorRecommended)
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
        let [newIndex, newDate] = findDate(dataOrdered, mouseDate);
        let markerX = dateScale(newDate);
        markerLineFixed.attr("x1", markerX).attr("x2", markerX);

        // emphasize points
        d3.selectAll("circle.ordered-point")
            .attr("r", pointRadius)
            .attr("fill", "white")
            .attr("stroke", colorOrdered)
            .attr("stroke-width", 1)
            .classed("normal", true);
        d3.selectAll("circle.recommended-point")
            .attr("r", pointRadius)
            .attr("fill", "white")
            .attr("stroke", colorRecommended)
            .attr("stroke-width", 1)
            .classed("normal", true);

        d3.select("circle#ordered" + newIndex)
            .attr("r", pointRadius + 2.5)
            .attr("fill", colorOrdered)
            .attr("stroke", "white")
            .attr("stroke-width", 2)
            .classed("normal", false);

        d3.select("circle#recommended" + newIndex)
            .attr("r", pointRadius + 2.5)
            .attr("fill", colorRecommended)
            .attr("stroke", "white")
            .attr("stroke-width", 2)
            .classed("normal", false);

        let map = d3.select("#us-map");

        // update us map
        currentDateIndexUS = newIndex;
        updateMapUS(map, data, currentDateIndexUS);
        d3.select("#us-map-clock").html(dateArrayUS[currentDateIndexUS]);
        // update slider
        updateSliderUS(data, currentDateIndexUS, sliderScaleUS);
        // pause animation
        clearInterval(animationUS);
        playingUS = false;
        d3.select("#us-map-play").html("Play");
    });

    // ==== User Interactive End === //
};

// ====== US Map Function ====== //
// Code References:
// 1. INFO5100 Course Lectures on March 04 and March 06
// 2. http://bl.ocks.org/mapsam/6083585
// 3. http://bl.ocks.org/rgdonohue/9280446
// 4. https://bl.ocks.org/d3noob/a22c42db65eb00d4e369
// 5. https://www.d3-graph-gallery.com/graph/custom_legend.html#cont1
const generateUSMap = async () => {
    const width = window.innerWidth * 0.45;
    const height = 500;

    const container = d3
        .select("#us-map-container")
        .style("width", width + "px");

    const svg = d3
        .select("#us-map")
        .attr("width", width)
        .attr("height", height);

    const margin = { top: 20, right: 20, bottom: 20, left: 20 };
    const mapWidth = width - margin.left - margin.right;
    const mapHeight = height - margin.top - margin.bottom;

    const map = svg
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    const us = await d3.json("datasets/us.json");

    // 3a. loading csv data
    const dataOriginal = await d3.csv(
        "datasets/coronavirus-school-closures-data.csv"
    );
    let data = processUSDate(dataOriginal);

    // 1c. Pick out topographic features
    let states = topojson.feature(us, us.objects.states); // convert TOPOJSON to GeoJSON

    // 1a. d3 projection
    let projection = d3.geoAlbersUsa().fitSize([mapWidth, mapHeight], states);
    // .translate([width / 2, height / 2]) // translate to center of screen
    // .scale([1280]); // scale things down so see entire US

    // 1b. Define path generator
    let path = d3
        .geoPath() // path generator that will convert GeoJSON to SVG paths
        .projection(projection); // tell path generator to use albersUsa projection

    const usNames = await d3.tsv("datasets/us-state-names.tsv"); // loading US 51 states' names

    let idToStateName = [];
    // generate an id for the name of each state
    usNames.forEach((row) => {
        idToStateName[row.id] = row.code;
    });

    // 1d. create a tooltip
    let tooltip = d3
        .select("#us-map-container")
        .append("div")
        .attr("class", "tooltip")
        .style("visibility", "hidden");

    const tooltipData = processUSMapTooltipData(dataOriginal);

    // 2a. Draw a  map of states with white stroke
    map.selectAll("path.state")
        .data(states.features)
        .join("path")
        .attr("class", "state")
        .attr("id", (d) => {
            return idToStateName[d.id];
        })
        .attr("d", path)
        .style("stroke", "black")
        .style("fill", colorEmpty)
        .style("stroke-width", 1)
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

            let stateAbbr = idToStateName[d.id];
            let currentTooltipData = tooltipData[stateAbbr];
            let currentState = currentTooltipData["stateName"];
            let currentStartDate = currentTooltipData[
                "startDate"
            ].toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
            });

            let currentStatus = currentTooltipData["status"];

            let tooltipContent = `<p>${currentState}</p><p>Closure Start Date: ${currentStartDate}</p><p>Closure Status: ${currentStatus}</p>`;

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

    // 3b. generate an array of beginning dats of the virus pandemic from the processed data

    for (let i = 0; i < data.length; i++) {
        dateArrayUS.push(
            data[i][0]["date"].toLocaleDateString(undefined, {
                year: "numeric",
                month: "short",
                day: "numeric",
            })
        );
    }

    d3.select("#us-map-clock").html(dateArrayUS[currentDateIndexUS]);

    // 3c. animate the map
    d3.select("button#us-map-play").on("click", function () {
        if (playingUS == false) {
            playingUS = true;
            d3.select(this).html("Pause");
            animationUS = setInterval(function () {
                if (currentDateIndexUS < dateArrayUS.length - 1) {
                    currentDateIndexUS++;
                    updateSliderUS(data, currentDateIndexUS, sliderScaleUS);
                    updateMapUS(map, data, currentDateIndexUS);
                    d3.select("#us-map-clock").html(
                        dateArrayUS[currentDateIndexUS]
                    );
                } else {
                    d3.select("#us-map-play").html("Restart");
                    currentDateIndexUS = 0;
                    clearInterval(animationUS);
                    playingUS = false;
                }
            }, 1000);
        } else {
            // pause
            clearInterval(animationUS);
            d3.select(this).html("Play");
            playingUS = false;
        }
    });

    // 4b. draw the slide bar
    let width_slider = width;
    let height_slider = 100;
    let margin_slider = { top: 20, right: 50, bottom: 50, left: 40 };

    let sliderData = d3.range(0, data.length).map((d) => ({
        dayIdx: d,
        date: data[d][0]["date"],
    }));

    let svg_slider = d3
        .select("div#us-map-slider")
        .append("svg")
        .attr("width", width_slider)
        .attr("height", height_slider);

    let dateEnd = new Date(data[data.length - 1][0]["date"]);

    sliderScaleUS = d3
        .scaleTime()
        .domain([data[0][0]["date"], dateEnd])
        .range([margin.left, width - margin.right]);

    let slider = (g) =>
        g
            .attr(
                "transform",
                `translate(0, ${height_slider - margin_slider.bottom})`
            )
            .call(
                d3
                    .sliderBottom(sliderScaleUS)
                    .step(60 * 60 * 24)
                    .tickFormat(d3.timeFormat("%m/%d"))
                    .on("onchange", (value) => draw(value))
            );

    // draw the slider bar
    svg_slider.append("g").call(slider);

    let draw = (selected) => {
        let formatTime = d3.timeFormat("%m/%d");
        let curDate = formatTime(selected);

        let startDate = data[0][0]["date"];
        let dateParse = d3.timeParse("%m/%d");
        let newDate = dateParse(curDate).setFullYear(2020);

        // counting the index of the current day from the initial starting date
        currentDateIndexUS = d3.timeDay.count(startDate, newDate);

        // updating the date shown on the html text next to the play button
        d3.select("#us-map-clock").html(dateArrayUS[currentDateIndexUS]);

        updateMapUS(map, data, currentDateIndexUS);

        // pause
        clearInterval(animationUS);
        d3.select(this).html("Play");
        playingUS = false;
    };

    // 4c. draw the legend
    let legendSVG = d3
        .select("#us-legend")
        .attr("height", 60)
        .attr("width", 350);

    // create the list of legend names
    let legend_names = ["Recommended closure", "Ordered closure"];

    let legend_range = [colorOrdered, colorRecommended];

    // make the colorscale
    let colorScale = d3.scaleOrdinal().domain(legend_names).range(legend_range);

    // add the square for each legend
    legendSVG
        .selectAll("rect.us-legend-rect")
        .data(legend_names)
        .enter()
        .append("rect")
        .attr("class", "us-legend-rect")
        .attr("stroke", "gray")
        .attr("stroke-width", "0.5px")
        .attr("x", function (d, i) {
            return 10 + i * 200;
        })
        .attr("y", 20)
        .attr("width", 20)
        .attr("height", 20)
        .style("fill", (d) => {
            return colorScale(d);
        });

    // add the text for each legend as the name
    legendSVG
        .selectAll("text.us-legend-text")
        .data(legend_names)
        .enter()
        .append("text")
        .attr("class", "us-legend-text")
        .attr("x", function (d, i) {
            return 40 + i * 200;
        })
        .attr("y", 30)
        .style("fill", (d) => {
            return colorScale(d);
        })
        .text((d) => {
            return d;
        })
        .attr("width", 50)
        .attr("height", 20)
        .attr("text-anchor", "start")
        .style("alignment-baseline", "middle");
};

// init colors
const colorOrdered = "green";
const colorRecommended = "orange";
const colorEmpty = "lightblue";

// init global variables
var animationUS;
var playingUS = false;
var dateArrayUS = [];
var currentDateIndexUS = 0;
var sliderScaleUS;

// call functions
generateUSLineChart();
generateUSMap();
