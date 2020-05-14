// const generateWorldMap = async () => {
//     data = await d3.csv("../datasets/covid_impact_education.csv");
//     console.log(data);
// };

// generateWorldMap();
(function (d3, topojson) {
  'use strict';

const svg = d3.select('#svg1');
const width = svg.attr("width");
const height = svg.attr("height");

const margin = { top: 20, right: 20, bottom: 20, left:20};
const mapWidth = width - margin.left - margin.right;
const mapHeight = height - margin.top - margin.bottom;
const map = svg.append("g")
                .attr("transform","translate("+margin.left+","+margin.top+")");

const requestData = async function() {                
  const world = await d3.json("../datasets/world.json");// https://cdn.jsdelivr.net/npm/world-atlas@2/countries-50m.json
  console.log("world",world);

  const projection = d3.geoNaturalEarth1();
  const pathGenerator = d3.geoPath().projection(projection);

  const g = svg.append('g');

  //sphere,map edge 
  g.append('path')
    .attr('d', pathGenerator({type: "Sphere"}))
    .attr('class','Sphere');

  //zoom
  svg.call(d3.zoom().on('zoom',()=>{
    g.attr('transform', d3.event.transform);
  }));

  const countries = topojson.feature(world, world.objects.countries);
  console.log("countries",countries);
  
  var surveyData = await d3.csv("../datasets/covid_impact_education.csv");
  console.log("surveyData",surveyData);

  surveyData.forEach( row => {
    var date = "16/02/2020";
    if(row.Date == date){
      console.log("countries",row.Country);
    }
  });

  const colorScale = d3.scaleQuantile()
      .domain(["Localized","National"])
      .range(["#fff","#d1e8ed"]);
  console.log("colorScale",colorScale)

  // .style("fill", d => colorScale( stateCounts[ idToState[d.id] ]) )
  g.selectAll('path')
    .data(countries.features)
    .enter().append('path')
      .attr('d', pathGenerator)
      .attr('class', 'allcountry');

  
  g.selectAll('path')
    .data(countries.features)
    .enter().append('path')// we use path in css
      .attr('d', pathGenerator)
      .attr('class', 'country')
    .append('title')
      .text(d=>d.properties.name);//【】hover是怎么实现的？？

  
  

};
requestData();

}(d3, topojson)); 