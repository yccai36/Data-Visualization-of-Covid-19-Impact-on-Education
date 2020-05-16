// return a JS objet that maps alpha ISO to num ISO
const processISOData = (dataISO) => {
    AlphaToNum = {};
    dataISO.forEach((element) => {
        let alpha = element["alpha-3"];
        let num = element["country-code"];
        AlphaToNum[alpha] = num;
    });
    return AlphaToNum;
};

// process original world data to an array grouped by dates
const processWorldData = (dataOriginal, AlphaToNum) => {
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
        let numISO = AlphaToNum[alphaISO];

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
