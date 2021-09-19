import {
  activePopulation,
  employmentInLegalEntities,
  employmentInCraftsTrades,
  activeInsuredPeopleFarmers,
  unemployment,
  unempleymentRate,
  overallEmployed,
  populationData,
} from "./data.js";

var year = 2009;
var chosenCounty = "Republic of Croatia";
var chosenSector = 1;
let sectorMaxValue = 100000;
let countiesToCompare = [];
let comparisonCounter = 0;

var mapWidth = 700;
var mapHeight = 700;

let mapSVG = d3
  .select("#map")
  .append("svg")
  .attr("width", mapWidth)
  .attr("height", mapHeight)
  .style("background", "white")
  .append("g");
let mapPath;
// let pieChartSVG;
// let pieChartSVG;

var dataArray = [
  activePopulation,
  overallEmployed,
  activeInsuredPeopleFarmers,
  employmentInCraftsTrades,
  employmentInLegalEntities,
  unemployment,
  unempleymentRate,
];

var slider = document.getElementById("myRange");
var output = document.getElementById("selectedYear");
output.innerHTML = slider.value;

let nameOfCountyHolder = d3.select("#nameOfCounty");
let countyValueHolder = d3.select("#countySectorValue");
countyValueHolder.text(dataArray[chosenSector][0].data[year - 1998]);
let firstChosenCountyHolder = d3.select("#firstChosenCounty");
let secondChosenCountyHolder = d3.select("#secondChosenCounty");
let lineChartTitleHolder = d3.select("#lineChartTitle");

var lineChartMargin = { top: 20, bottom: 70, left: 70, right: 20 };
var lineChartWidth = 600 - lineChartMargin.left - lineChartMargin.right;
var lineChartHeight = 450 - lineChartMargin.top - lineChartMargin.bottom;
var barPadding = 4;
var barWidth = lineChartWidth / activePopulation[0].data.length - barPadding;

var chartLineSvg = d3
  .select("#lineChart")
  .append("svg")
  .attr("width", lineChartWidth + lineChartMargin.left + lineChartMargin.right)
  .attr(
    "height",
    lineChartHeight + lineChartMargin.bottom + lineChartMargin.top
  )
  .style("background-color", "white")
  .append("g")
  .attr(
    "transform",
    "translate(" + lineChartMargin.left + "," + lineChartMargin.top + ")"
  );

const xAxisGroup = chartLineSvg
  .append("g")
  .attr("class", "x axis")
  .attr("transform", "translate(0," + lineChartHeight + ")");

const yAxisGroup = chartLineSvg.append("g").attr("class", "y axis");

function initVisualizations() {
  createMap();
  createLineChart();
}


slider.oninput = function () {
  output.innerHTML = this.value;
  year = slider.value;
  resolveGeoData();
};



function createMap() {
  var projection = d3.geo
    .mercator()
    .center([1, 10])
    .scale(6000)
    .translate([17600, 4500])
    .rotate([-180, 0]);
  mapPath = d3.geo.path().projection(projection);
  mapSVG.call(d3.behavior.zoom().scaleExtent([0.3, 5]).on("zoom", onZoom));

  resolveGeoData();
}

const tip = d3.tip().attr("class", "tip card");

mapSVG.call(tip);

function resolveGeoData() {
  d3.json("cro_regv3.json", function (error, cro) {
    let data = topojson.feature(cro, cro.objects.layer1);
    const counties = mapSVG.selectAll("path.county").data(data.features);
    counties
      .enter()
      .append("path")
      .attr("class", "county")
      .attr("id", function (d) {
        return d.id;
      })
      .attr("d", mapPath)
      .style("fill", "red")
      .style("fill-opacity", function (d) {
        return calculateOpacity(d);
      })
      .style("stroke", "gray")
      .style("stroke-width", 1)
      .style("stroke-opacity", 1)
      .on("click", (d) => handeClick(d))
      .on("mouseover", (d, i, n) => {
        handleHover(i, d);
      })
      .on("mouseout", (d) => {
        handleHoverOut(d);
      });
    counties.style("fill-opacity", function (d) {
      return calculateOpacity(d);
    });
  });
}

function handeClick(d) {
  if (countiesToCompare.length == 2) {
    countiesToCompare = [];
    secondChosenCountyHolder.text("");
  }
  if (comparisonCounter % 2 == 0) {
    if (countiesToCompare[1] !== d.properties.gn_name) {
      countiesToCompare[0] = d.properties.gn_name;
      firstChosenCountyHolder.text(d.properties.gn_name);
      comparisonCounter++;
    }
  } else {
    if (countiesToCompare[0] !== d.properties.gn_name) {
      countiesToCompare[1] = d.properties.gn_name;
      secondChosenCountyHolder.text(d.properties.gn_name);
      comparisonCounter++;
      updateLineChart();
    }
  }
  chosenCounty = d.properties.gn_name;
}

function handleHover(i, d) {
  d3.select(d.target).style("opacity", 0.5);
  const stateInfo = {
    name: d.properties.gn_name,
    value: findValueForStateByYear(d.properties.gn_name),
  };
  tip.html((d) => {
    return `${stateInfo.name} <br> ${stateInfo.value}  `;
  });
  tip.show(i, d.target);
}

function handleHoverOut(d) {
  tip.hide();
  d3.select(d.target).style("opacity", (d) => calculateOpacity(d));
}

function findValueForStateByYear(name) {
  const state = dataArray[chosenSector].find((el) => el.county == name);
  return state.data[year - 1998];
}

function calculateOpacity(d) {
  var sectorData = dataArray[chosenSector];

  // if (d.properties.gn_name == "Grad Zagreb") return 1;
  var county = sectorData.find((el) => el.county == d.properties.gn_name);
  return county.data[year - 1998] / sectorMaxValue;
}

function changeSector() {
  chosenSector = document.getElementById("sectorSelector").value;
  countyValueHolder.text(dataArray[chosenSector][0].data[year - 1998]);
  nameOfCountyHolder.text("Republika Hrvatska");
  findSectorMaxValue();
  resolveGeoData();
  updateLineChart();
}

function findSectorMaxValue() {
  let maxValue = 0;

  if (
    chosenSector == 0 ||
    chosenSector == 1 ||
    chosenSector == 3 ||
    chosenSector == 4 ||
    chosenSector == 7
  ) {
    dataArray[chosenSector]
      .slice(1, dataArray[chosenSector].length - 1)
      .forEach((el) => {
        if (el.data[year - 1998] > maxValue) maxValue = el.data[year - 1998];
      });
  } else {
    dataArray[chosenSector].slice(1).forEach((el) => {
      if (el.data[year - 1998] > maxValue) maxValue = el.data[year - 1998];
    });
  }

  sectorMaxValue = maxValue;
  console.log("Sector max value");
  console.log(maxValue);
}

window.changeSector = changeSector;

function findMaxValueForStateComparison() {
  if (countiesToCompare.length < 2) {
    return 100000;
  }

  const firstState = dataArray[chosenSector].find(
    (el) => el.county == countiesToCompare[0]
  );
  const secondState = dataArray[chosenSector].find(
    (el) => el.county == countiesToCompare[1]
  );

  const max = Math.max.apply(Math, firstState.data) < Math.max.apply(Math, secondState.data)
  ? Math.max.apply(Math, secondState.data)
  : Math.max.apply(Math, firstState.data);
  console.log(max);
  return max;
  
}
function findMinValueForStateComparison() {
  if (countiesToCompare.length < 2) {
    console.log(countiesToCompare.length);
    return 0;
  }
  const firstState = dataArray[chosenSector].find(
    (el) => el.county == countiesToCompare[0]
  );
  const secondState = dataArray[chosenSector].find(
    (el) => el.county == countiesToCompare[1]
  );
  const min = Math.min.apply(Math, firstState.data) < Math.min.apply(Math, secondState.data)
  ? Math.min.apply(Math, firstState.data)
  : Math.min.apply(Math, secondState.data);
  console.log(min);
  return min;
  
}

function createLineChart() {
  var countyIndex = activePopulation.findIndex(
    (el) => el.county == chosenCounty
  );

  xAxisGroup
    .call(xAxis)
    .selectAll("text")
    .attr("transform", "rotate(90)")
    .attr("x", 6)
    .attr("dx", ".71em")
    .style("text-anchor", "start");

  yAxisGroup
    .call(yAxis)
    .append("text")
    .attr("transform", "rotate(-90)")
    .attr("y", 6)
    .attr("dy", ".71em")
    .style("text-anchor", "end")
    .text("Vrijednost");

 

  let sectorSelector = document.querySelector("#sectorSelector");
  lineChartTitleHolder.text(
    sectorSelector.options[sectorSelector.selectedIndex].text
  );
}

var xScale = d3.scale
  .ordinal()
  .domain(d3.range(activePopulation[0].data.length))
  .rangeRoundBands([0, lineChartWidth]);
var yScale = d3.scale
  .linear()
  .domain([
    findMinValueForStateComparison(),
    findMaxValueForStateComparison(),
  ])
  .range([lineChartHeight, 0]);

var xAxis = d3.svg
  .axis()
  .scale(xScale)
  .orient("bottom")
  .tickFormat(function (d, i) {
    return i + 1998;
  });
var yAxis = d3.svg.axis().scale(yScale).orient("left").ticks(10);

function addLineChartAxes() {
  yAxisGroup.transition().duration(1500).call(yAxis);
}

var valueline = d3.svg
.line()
.interpolate("linear")
.x(function (d, i) {
  return xScale(i);
})
.y(function (d) {
  return yScale(d);
});


function updateLineChart() {
  d3.selectAll("path.line").remove();
  if (countiesToCompare.length == 2) {
    yScale.domain([
      findMinValueForStateComparison() *0.9,
      findMaxValueForStateComparison() *1.1,
    ]);

    var linechart = chartLineSvg
    .append("path")
    .attr("class", "line")
    .attr("d", valueline(returnCountySectorData(0)))
    .attr("fill", "none")
    .style("stroke", "blue");
  var linechart = chartLineSvg
    .append("path")
    .attr("class", "line")
    .attr("d", valueline(returnCountySectorData(1)))
    .attr("fill", "none")
    .style("stroke", "red");
  
    addLineChartAxes();
  }
}

function returnCountySectorData(index) {
  const stateData = dataArray[chosenSector].find(
    (el) => el.county == countiesToCompare[index]
  );
  console.log(stateData.data);
  return stateData.data;
}

function createPieChart() {
  var countyIndex = activePopulation.findIndex(
    (el) => el.county == chosenCounty
  );

  var data = [
    {
      name: "Registrirana nezaposlenost",
      value: unemployment[countyIndex].data[year - 1998],
    },
    {
      name: "Aktivni osiguranici-individualni poljoprivrednici",
      value: activeInsuredPeopleFarmers[countyIndex].data[year - 1998],
    },
    {
      name: "Zaposleni u obrtu i slobodnim profesijama",
      value: employmentInCraftsTrades[countyIndex].data[year - 1998],
    },
    {
      name: "Zaposleni u pravnim osobama",
      value: employmentInLegalEntities[countyIndex].data[year - 1998],
    },
  ];

  var width = 300;
  var height = 300;
  var outerRadius = 100;
  var innerRadius = 0;
  var color = d3.scale.category20();
  var arc = d3.svg.arc().innerRadius(innerRadius).outerRadius(outerRadius);
  var pie = d3.layout.pie().value(function (d) {
    return d.value;
  });
  var svg = d3
    .select("div#pieChart")
    .append("svg")
    .attr("width", width)
    .attr("height", height);
  var pieArcs = svg
    .selectAll("g.pie")
    .data(pie(data))
    .enter()
    .append("g")
    .attr("class", "pie")
    .attr("transform", "translate(" + width / 2 + ", " + height / 2 + ")");
  pieArcs
    .append("path")
    .attr("fill", function (d, i) {
      return color(i);
    })
    .attr("d", arc);
  pieArcs
    .append("text")
    .attr("transform", function (d) {
      return "translate(" + arc.centroid(d) + ")";
    })
    .attr("text-anchor", "middle")
    .text(function (d) {
      return d.value;
    });
  pieArcs
    .append("text")
    .attr("transform", function (d) {
      return "translate(" + arc.centroid(d) + ")";
    })
    .attr("text-anchor", "middle")
    .attr("baseline-shift", "20px")
    .text(function (d, i) {
      return data[i].name;
    });
}

createMap();
createLineChart();



function onZoom() {
  let svg = d3.select("g");
  svg.attr(
    "transform",
    "translate (" + d3.event.translate + ") scale (" + d3.event.scale + ")"
  );
}
