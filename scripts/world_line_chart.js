const generateWorldLinChart = async () => {
    const dataOriginal = await d3.csv("../datasets/covid_impact_education.csv");
    const dataISO = await d3.json("../datasets/ISO.json");
    const AlphaToNum = processISOData(dataISO);
    let data = processWorldData(dataOriginal, AlphaToNum);
};

generateWorldLinChart();
