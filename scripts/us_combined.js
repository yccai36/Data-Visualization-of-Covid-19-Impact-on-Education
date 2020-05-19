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
    let [dataOrdered, dataRecommended] = processDataUSLine(dataOriginal);

    const colorOrdered = "red";
    const colorRecommended = "steelblue";

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

        // update us map
    });

    // ==== User Interactive End === //
};

// call functions
generateUSLineChart();
