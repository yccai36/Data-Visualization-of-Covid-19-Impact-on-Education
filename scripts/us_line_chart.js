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
};

generateUSLineChart();
