// process data to draw US line chart
const processDataUSLine = (dataOriginal) => {
    let data = processUSDate(dataOriginal);

    let dataRecommended = [];
    let dataOrdered = [];

    data.forEach((element) => {
        let date = element[0]["date"];
        let dateString = element[0]["dateString"];

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
            status: "ordered",
            count: countOrdered,
        };

        let dataOneDayRecommended = {
            date: date,
            dateString: dateString,
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
    console.log(dataOrdered);
    console.log(dataRecommended);

    const width = 900;
    const height = 500;
    const div = d3
        .select("#us-line-div")
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
        .attr("stroke", "red")
        .attr("stroke-width", lineWidth)
        .attr("d", lineGenerator);

    // points - ordered
    orderedPlot
        .selectAll("circle.point")
        .data(dataOrdered)
        .join("circle")
        .attr("class", "point ordered-point")
        .attr("r", pointRadius)
        .attr("cx", (d) => dateScale(d["date"]))
        .attr("cy", (d) => stateScale(d["count"]))
        .attr("fill", "white")
        .attr("stroke", "red")
        .attr("stroke-width", 1);

    // line - recommended
    recommendedPlot
        .append("path")
        .datum(dataRecommended)
        .attr("id", "recommended-line")
        .attr("fill", "none")
        .attr("stroke", "steelblue")
        .attr("stroke-width", lineWidth)
        .attr("d", lineGenerator);

    // points - recommended
    recommendedPlot
        .selectAll("circle.point")
        .data(dataRecommended)
        .join("circle")
        .attr("class", "point recommended-point")
        .attr("r", pointRadius)
        .attr("cx", (d) => dateScale(d["date"]))
        .attr("cy", (d) => stateScale(d["count"]))
        .attr("fill", "white")
        .attr("stroke", "steelblue")
        .attr("stroke-width", 1);

    // ==== User Interactive Start === //

    let activeGroup = svg
        .append("g")
        .attr("class", "active-group")
        .attr(
            "transform",
            "translate(" + padding.left + ", " + padding.top + ")"
        )
        .attr("visibility", "hidden");

    let markerLine = activeGroup
        .append("line")
        .attr("class", "active-marker-line")
        .attr("fill", "none")
        .attr("stroke", "#aaa")
        .attr("stroke-width", "1")
        .attr("y1", 0)
        .attr("y2", plotHeight);

    let activeRect = activeGroup
        .append("rect")
        .attr("class", "active-rect")
        .attr("width", plotWidth)
        .attr("height", plotHeight)
        .attr("fill", "none")
        .attr("pointer-events", "all");

    let tooltip = d3
        .select("#us-line-div")
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
        activeGroup.style("visibility", "visible");

        tooltip.style("visibility", "visible");
    });

    activeRect.on("mouseout", function () {
        activeGroup.style("visibility", "hidden");

        tooltip.style("visibility", "hidden");
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
    });

    // ==== User Interactive End === //
};

generateUSLineChart();
