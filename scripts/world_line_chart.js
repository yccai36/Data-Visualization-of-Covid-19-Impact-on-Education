const generateWorldLinChart = async () => {
    const dataOriginal = await d3.csv("../datasets/covid_impact_education.csv");
    const dateParser = d3.timeParse("%d/%m/%Y");

    let data = [];
    let dates = [];

    dataOriginal.forEach((element) => {
        let date = element["Date"];
    });

    d1 = dateParser(date1);
    console.log(d1);
};

generateWorldLinChart();
