// reference code
// http://bl.ocks.org/rgdonohue/9280446
// info3300's note for March 4(usmap)

const generateWorldMap = async function () {     
    const svg = d3.select("#world-map").append("svg")   // append a svg to our html div to hold our map
      .attr("width", 960)
      .attr("height", 500);
    const width = svg.attr("width");
    const height = svg.attr("height");

    const margin = { top: 20, right: 20, bottom: 20, left: 20 };
    const mapWidth = width - margin.left - margin.right;
    const mapHeight = height - margin.top - margin.bottom;
    const map = svg
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    const world = await d3.json("../datasets/world.json"); // https://raw.githubusercontent.com/plotly/plotly.js/master/dist/topojson/world_50m.json
    console.log("world", world);

    const projection = d3.geoNaturalEarth1();
    const pathGenerator = d3.geoPath().projection(projection);

    const g = svg.append("g");

    //sphere,map edge
    g.append("path")
        .attr("d", pathGenerator({ type: "Sphere" }))
        .attr("class", "Sphere");

    //zoom
    svg.call(
        d3.zoom().on("zoom", () => {
            g.attr("transform", d3.event.transform);
        })
    );

    const countries = topojson.feature(world, world.objects.ne_50m_admin_0_countries);
    console.log("countries", countries);

    const dataOriginal = await d3.csv("../datasets/covid_impact_education.csv");
    const dataISO = await d3.json("../datasets/ISO.json");
    const [dataNational, dataLocalized, dataOpen] = processDataWorldLine(
        dataOriginal,
        dataISO
    );
    const AlphaToNum = processISOData(dataISO);
    let surveyData = processWorldData(dataOriginal, AlphaToNum);
    // console.log("=-=-=-=-=-==-", surveyData[surveyData.length-1][0]["date"]);
    
    g.selectAll("path")
        .data(countries.features)
        .enter()
        .append("path")
            .attr("d", pathGenerator)
            .attr("class", "country")
            .attr("id", (d) => {//
                return d.properties.ISO_A3;
            })
        .append('title')
            .text(d=>d.properties.NAME);

    var countries_localized = [];
    var countries_national = [];
    var countries_reopen = [];
    // for COVID spread trend animation
    var dateArray = [], currentDateIdx = 0,playing = false;
    var i;
    for (i = 0; i < surveyData.length; i++) {
        dateArray.push(surveyData[i][0]["dateString"]);
    }
    d3.select('#world-map-clock').html(dateArray[currentDateIdx]);        
    var timer;
    d3.select('#world-map-play') 
    .on('click', function(){
        if(playing == false){
            d3.select(this).html('stop');
            timer = setInterval(function(){
                if(currentDateIdx < dateArray.length-1) {  
                    currentDateIdx +=1; 
                    sequenceMap(currentDateIdx);
                    d3.select('#world-map-clock').html(dateArray[currentDateIdx]);
                    playing = true; 
                } else {
                    d3.select('#world-map-play').html('play');
                    currentDateIdx = 0;
                    clearInterval(timer); 
                    playing = false;
                    g.selectAll("path")
                        .style("fill", 'white');
                    g.select(".Sphere")
                        .style("fill", 'lightblue'); 
                    d3.select('#world-map-clock').html('date');
                }
               
            }, 200);
        }else {   
            clearInterval(timer);   
            d3.select(this).html('play');  
            playing = false;  
        }
    });

    //for COVID situation of a certain day using slider
    //https://bl.ocks.org/johnwalley/e1d256b81e51da68f7feb632a53c3518
    var width_slider = 960;
    var height_slider = 200;
    var margin_slider = { top: 20, right: 50, bottom: 50, left: 40 };

    var sliderData = d3.range(0, surveyData.length).map(d => ({
        dayIdx: d+1,
        date: surveyData[d][0]["date"],//surveyData[0][0]['dateString']
        value: 241,
        countries_localized: dataLocalized[d]["count"],
        countries_national:dataNational[d]["count"],
        countries_reopen:dataOpen[d]["count"] 
    }));
    console.log("-=-=sliderData-=-=",sliderData);

    var svg_slider = d3
      .select('div#world-map-slider')
      .append('svg')
      .attr('width', width_slider)
      .attr('height', height_slider);

    var padding = 0.1;
    var xBand = d3
        .scaleBand()
        .domain(sliderData.map(d => d.dayIdx))
        .range([margin_slider.left, width_slider - margin_slider.right])
        .padding(padding);
    console.log('-=-=-!!=',d3.max(sliderData, d => d.date));
    var xLinear = d3
        .scaleLinear()
        .domain([
            d3.min(sliderData, d => d.date),
            d3.max(sliderData, d => d.date),
        ])
        .range([
        margin.left + xBand.bandwidth() / 2 + xBand.step() * padding - 0.5,
        width - margin.right - xBand.bandwidth() / 2 - xBand.step() * padding - 0.5,
        ]);

    var y = d3
        .scaleLinear()
        .domain([0, d3.max(sliderData, d => d.value)])
        .nice()
        .range([height_slider - margin_slider.bottom, margin_slider.top]);
 
    var slider = g =>
        g.attr('transform', `translate(0,${height_slider - margin_slider.bottom})`).call(
          d3.sliderBottom(xLinear)
            .step(60 * 60 * 24)
            .tickFormat(d3.timeFormat('%m/%d'))
            .ticks(10)
            .on('onchange', value => draw(value))
        );
    
    var bars1 = svg_slider
        .append('g')
        .selectAll('rect')
        .data(sliderData);
    var bars2 = svg_slider
        .append('g')
        .selectAll('rect')
        .data(sliderData);
    var bars3 = svg_slider
        .append('g')
        .selectAll('rect')
        .data(sliderData);
    var bars4 = svg_slider
        .append('g')
        .selectAll('rect')
        .data(sliderData);
    var barsEnter1 = bars1
        .enter()
        .append('rect')
        .attr('x', d => xBand(d.dayIdx))
        .attr('y', d => y(d.value))
        .attr('height', d => y(0) - y(d.value))
        .attr('fill', 'gray')
        .attr('fill-opacity', '0.2')
        .attr('width', xBand.bandwidth());
    
    var barsEnter2 = bars2
        .enter()
        .append('rect')
        .attr('x', d => xBand(d.dayIdx))
        .attr('y', d => y(d.countries_national + d.countries_localized))
        .attr('height', d =>y(0) -y(d.countries_localized))
        .attr('fill', 'orange')
        .attr('fill-opacity', '0.2')
        .attr('width', xBand.bandwidth());
    var barsEnter3 = bars3
        .enter()
        .append('rect')
        .attr('x', d => xBand(d.dayIdx))
        .attr('y', d => y(d.countries_national))
        .attr('height', d =>y(0) -y(d.countries_national))
        .attr('fill', 'red')
        .attr('fill-opacity', '0.2')
        .attr('width', xBand.bandwidth());
    var barsEnter4 = bars4
            .enter()
            .append('rect')
            .attr('x', d => xBand(d.dayIdx))
            .attr('y', d => y(d.countries_national + d.countries_localized + d.countries_reopen))
            .attr('height', d =>y(0) -y(d.countries_reopen))
            .attr('fill', 'green')
            .attr('fill-opacity', '0.2')
            .attr('width', xBand.bandwidth());

    
    svg_slider.append('g').call(slider);
    
    var draw = selected => {
        var formatTime = d3.timeFormat("%m/%d"); 
        var curDate =  formatTime(selected);  
        barsEnter1
          .merge(bars1)
          .attr('fill-opacity', d => (formatTime(d.date) === curDate ? '0.5' : '0.2'));
        barsEnter2
          .merge(bars2)
          .attr('fill-opacity', d => (formatTime(d.date) === curDate ? '0.8' : '0.2'));
        barsEnter3
            .merge(bars3)
            .attr('fill-opacity', d => (formatTime(d.date) === curDate ? '0.8' : '0.2'));
        barsEnter4
            .merge(bars4)
            .attr('fill-opacity', d => (formatTime(d.date) === curDate ? '0.8' : '0.2'));
        
        var startDate = surveyData[0][0]['date'];
        var idx = d3.timeDay.count(startDate,new Date(curDate)) + 6939;//【】
        currentDateIdx = idx;
        d3.select('#world-map-clock').html(dateArray[currentDateIdx]);  
        sequenceMap(idx);
        d3.select('p#world-map-slider-value1')
        .text(
          d3.format("d")(sliderData[idx].countries_localized) + " countries have localized school closures"
        ); 
        d3.select('p#world-map-slider-value2').text(
            d3.format("d")(sliderData[idx].countries_national) + " countries have country-wide closures" 
        ); 
        d3.select('p#world-map-slider-value3').text(
            d3.format("d")(sliderData[idx].countries_reopen) + " affected countries decide to reopen the schools"
        );       
    };
    
    draw(0);

    ////////////////
    function sequenceMap(day) {
        countries_localized = [];
        countries_national = [];
        countries_reopen = [];
        surveyData[day].forEach((row) => {
            if (row.scale == "Localized") {
                countries_localized.push(row.alphaISO);
            } else if (row.scale == "National") {
                countries_national.push(row.alphaISO);
            } else if (row.scale == "Open") {
                countries_reopen.push(row.alphaISO);
            }
    
        }); 

        g.selectAll("path")
            .style("fill", 'white');
        g.select(".Sphere")
            .style("fill", 'lightblue');

        countries_localized.forEach((id) => {
            g.select('path#'+id)
                .style("fill", 'orange' )
                .append('title')
                .text('localized');
        });
    
        countries_national.forEach((id) => {
            g.select('path#'+id)
                .style("fill", 'red' )
                .append('title')
                .text('national');
        });

        countries_reopen.forEach((id) => {
            g.select('path#'+id)
                .style("fill", 'lightgreen' )
                .append('title')
                .text('reopen!');//d=>d.properties.name
        });
    }
};

window.onload = generateWorldMap();

