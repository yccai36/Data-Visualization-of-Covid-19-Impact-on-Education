// process US school closure data
// return an array grouped by dates
const processUSDate = (dataOriginal) => {
    const dateParser = d3.timeParse("%m/%d/%Y");

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

        let item = {
            stateName: stateName,
            stateAbbr: stateAbbr,
            startDate: startDate,
            startDateIndex: startDateIndex,
            startDateString: startDateString,
            status: status,
            schoolNum: schoolNum,
            enrollmentNum: enrollmentNum,
        };

        for (let i = startDateIndex; i < newData.length; i++) {
            newData[i].push(item);
        }
    });
    return newData;
};
