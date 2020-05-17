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

const updateMap = (surveyData, map, day, colors) => {
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
