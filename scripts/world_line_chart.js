const processDataWorldLine = (dataOriginal, dataISO) => {
    const AlphaToNum = processISOData(dataISO);
    const data = processWorldData(dataOriginal, AlphaToNum);

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
    console.log(dataNational);
    console.log(dataLocalized);
    console.log(dataOpen);
};

generateWorldLineChart();
