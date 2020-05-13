// const generateWorldMap = async () => {
//     data = await d3.csv("../datasets/covid_impact_education.csv");
//     console.log(data);
// };

// generateWorldMap();

(function (d3, topojson) {
  'use strict';

  const svg = d3.select('svg');

  const projection = d3.geoNaturalEarth1();
  const pathGenerator = d3.geoPath().projection(projection);

  const g = svg.append('g');
  g.append('path')
  	.attr('d', pathGenerator({type: "Sphere"}))
  	.attr('class','Sphere');

  svg.call(d3.zoom().on('zoom',()=>{
  	g.attr('transform', d3.event.transform);
  }));

  d3.json('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-50m.json')
  	.then(data => {
    	const countries = topojson.feature(data, data.objects.countries);
    	console.log(countries);
    
    	g.selectAll('path')
        .data(countries.features)
        .enter().append('path')// we use path in css
          .attr('d', pathGenerator)
          .attr('class', 'country')
    		.append('title')
    			.text(d=>d.properties.name);
  	});

}(d3, topojson));