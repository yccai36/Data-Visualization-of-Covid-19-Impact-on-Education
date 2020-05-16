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
    const svg = d3
        .select("#us-line")
        .attr("width", width)
        .attr("height", height);
    const padding = { left: 40, bottom: 40, right: 20, top: 50 };
    const plotWidth = width - padding.left - padding.right;
    const plotHeight = height - padding.bottom - padding.top;

    // Scales
    const stateScale = d3.scaleLinear().domain([0, 50]).range([plotHeight, 0]);

    // const firstDate = dataLocalized[0]["date"];
    // const lastDate = dataLocalized[dataLocalized.length - 1]["date"];

    const firstDate = new Date(2020, 2, 15);
    const lastDate = new Date(2020, 2, 25);

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

    // line - ordered
    orderedPlot
        .append("path")
        .datum(dataOrdered)
        .attr("id", "ordered-line")
        .attr("fill", "none")
        .attr("stroke", "red")
        .attr("stroke-width", 2)
        .attr("d", lineGenerator);

    // points - ordered
    orderedPlot
        .selectAll("circle.point")
        .data(dataOrdered)
        .join("circle")
        .attr("class", "point ordered-point")
        .attr("r", 2)
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
        .attr("stroke-width", 2)
        .attr("d", lineGenerator);

    // points - recommended
    recommendedPlot
        .selectAll("circle.point")
        .data(dataRecommended)
        .join("circle")
        .attr("class", "point recommended-point")
        .attr("r", 2)
        .attr("cx", (d) => dateScale(d["date"]))
        .attr("cy", (d) => stateScale(d["count"]))
        .attr("fill", "white")
        .attr("stroke", "steelblue")
        .attr("stroke-width", 1);
};

generateUSLineChart();
