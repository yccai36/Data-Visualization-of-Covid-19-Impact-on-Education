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

    // // line - school reopen
    // openPlot
    //     .append("path")
    //     .datum(dataOpen)
    //     .attr("id", "open-line")
    //     .attr("fill", "none")
    //     .attr("stroke", "green")
    //     .attr("stroke-width", 2)
    //     .attr(
    //         "d",
    //         d3
    //             .line()
    //             .x((d) => dateScale(d["date"]))
    //             .y((d) => countryScale(d["count"]))
    //     );

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
        console.log(markerX);

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

        window.worldMapPlaying = false;
        window.worldMapCurrentDateIndex = newIndex;
        updateMap(surveyData, map, newIndex, colorsMap);
    });

    // ==== User Interactive End === //
};

generateWorldLineChart();
