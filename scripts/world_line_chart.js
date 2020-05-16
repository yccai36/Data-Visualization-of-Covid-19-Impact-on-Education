// process orginal data, return arraies for 3 group to draw the world line chart
const processDataWorldLine = (dataOriginal, dataISO) => {
    const AlphaToNum = processISOData(dataISO);
    const data = processWorldData(dataOriginal, AlphaToNum);

    // console.log(data);
    // init data
    let dataNational = [];
    let dataLocalized = [];
    let dataOpen = [];

    data.forEach((element) => {
        let date = element[0]["date"];
        let dateString = element[0]["dateString"];
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
            scale: "national",
            count: countNational,
        };

        let dataOneDayLocalized = {
            date: date,
            dateString: dateString,
            scale: "localized",
            count: countLocalized,
        };

        let dataOneDayOpen = {
            date: date,
            dateString: dateString,
            scale: "open",
            count: countOpen,
        };

        dataNational.push(dataOneDayNational);
        dataLocalized.push(dataOneDayLocalized);
        dataOpen.push(dataOneDayOpen);
    });

    return [dataNational, dataLocalized, dataOpen];
};

const generateWorldLineChart = async () => {
    // load orginal data
    const dataOriginal = await d3.csv("../datasets/covid_impact_education.csv");
    const dataISO = await d3.json("../datasets/ISO.json");
    // format data
    const [dataNational, dataLocalized, dataOpen] = processDataWorldLine(
        dataOriginal,
        dataISO
    );
    // console.log(dataNational);
    // console.log(dataLocalized);
    // console.log(dataOpen);

    const width = 900;
    const height = 500;
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

    const firstDate = new Date(2020, 1, 10);
    const lastDate = new Date(2020, 4, 29);

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
        .tickSize(0)
        .ticks(d3.timeWeek.every(2))
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
    const localizedPlot = plot.append("g").attr("class", "localized");

    const nationalPlot = plot.append("g").attr("class", "national");

    const openPlot = plot.append("g").attr("class", "open");

    let lineGenerator = d3
        .line()
        .x((d) => dateScale(d["date"]))
        .y((d) => countryScale(d["count"]));

    // line - localized
    localizedPlot
        .append("path")
        .datum(dataLocalized)
        .attr("id", "localized-line")
        .attr("fill", "none")
        .attr("stroke", "steelblue")
        .attr("stroke-width", 2)
        .attr("d", lineGenerator);

    // points - localized
    localizedPlot
        .selectAll("circle.point")
        .data(dataLocalized)
        .join("circle")
        .attr("class", "point localized-point")
        .attr("r", 2)
        .attr("cx", (d) => dateScale(d["date"]))
        .attr("cy", (d) => countryScale(d["count"]))
        .attr("fill", "white")
        .attr("stroke", "steelblue")
        .attr("stroke-width", 1);

    // line - national
    nationalPlot
        .append("path")
        .datum(dataNational)
        .attr("id", "national-line")
        .attr("fill", "none")
        .attr("stroke", "red")
        .attr("stroke-width", 2)
        .attr("d", lineGenerator);

    // points - national
    nationalPlot
        .selectAll("circle.point")
        .data(dataNational)
        .join("circle")
        .attr("class", "point national-point")
        .attr("r", 2)
        .attr("cx", (d) => dateScale(d["date"]))
        .attr("cy", (d) => countryScale(d["count"]))
        .attr("fill", "white")
        .attr("stroke", "red")
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
};

generateWorldLineChart();
