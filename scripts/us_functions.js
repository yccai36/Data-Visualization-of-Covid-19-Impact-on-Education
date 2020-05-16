// process US school closure data
// return an array grouped by dates
const processUSDate = (dataOriginal) => {
    const dateParser = d3.timeParse("%m/%d/%y");

    let dataFiltered = dataOriginal.filter((element) => {
        return element["State Abbreviation"].length === 2;
    });

    let dates = {
        "3/15/20": 0,
        "3/16/20": 1,
        "3/17/20": 2,
        "3/18/20": 3,
        "3/19/20": 4,
        "3/20/20": 5,
        "3/21/20": 6,
        "3/22/20": 7,
        "3/23/20": 8,
        "3/24/20": 9,
    };

    let numToDate = [
        "3/15/20",
        "3/16/20",
        "3/17/20",
        "3/18/20",
        "3/19/20",
        "3/20/20",
        "3/21/20",
        "3/22/20",
        "3/23/20",
        "3/24/20",
    ];

    let newData = [];
    for (let i = 0; i < Object.keys(dates).length; i++) {
        newData.push([]);
    }

    dataFiltered.forEach((element) => {
        let stateName = element["State"];
        let stateAbbr = element["State Abbreviation"];
        let startDateString = element["State Closure Start Date"];
        let startDateIndex = dates[startDateString];
        let startDate = dateParser(startDateString);
        let status = element["State Status"];
        if (status === "State ordered closure") {
            status = "ordered";
        } else {
            status = "recommended";
        }
        let schoolNum = element["State Number of Public Schools"];
        let enrollmentNum = element["State Public School Enrollment"];

        for (let i = startDateIndex; i < newData.length; i++) {
            let item = {
                stateName: stateName,
                stateAbbr: stateAbbr,
                startDate: startDate,
                startDateIndex: startDateIndex,
                startDateString: startDateString,
                status: status,
                schoolNum: schoolNum,
                enrollmentNum: enrollmentNum,
                dateIndex: i,
                dateString: numToDate[i],
                date: dateParser(numToDate[i]),
            };
            newData[i].push(item);
        }
    });

    let emptyItem = {
        stateName: "N/A",
        stateAbbr: "N/A",
        startDate: "N/A",
        startDateIndex: "N/A",
        startDateString: "N/A",
        status: "N/A",
        schoolNum: 0,
        enrollmentNum: 0,
        dateIndex: 0,
        dateString: numToDate[0],
        date: dateParser(numToDate[0]),
    };

    newData[0].push(emptyItem);

    return newData;
};
