const generateWorldLinChart = async () => {
    data = await d3.csv("../datasets/covid_impact_education.csv");
    console.log(data);
};

generateWorldLinChart();
