const generateUSLineChart = async () => {
    const dataOriginal = await d3.csv(
        "../datasets/coronavirus-school-closures-data.csv"
    );
    let data = processUSDate(dataOriginal);
    console.log(data);
};

generateUSLineChart();
