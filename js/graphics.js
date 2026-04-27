
const colBiomass="rgba(0,127,0,1)";
const colRunningHydro="rgb(0,0,255)";
const colPumpHydro="rgb(0,0,155)";
const colNuclear="rgb(200,0,200)";
const colCoal="rgb(50,50,50)";
const colGas="rgb(255,120,60)";
const colH2="rgb(255,0,0)";
const colWindOn="rgb(0,200,255)";
const colWindOff="rgb(0,127,255)";
const colSolar="rgb(255,200,0)";
const colImport="rgb(180,180,180)";
const colBatt="rgb(150,0,200)";







Chart.defaults.font.size = Math.round(2*vmin); // OK
Chart.maintainAspectRatio= false; // DOS; need to define in Chart.options
Chart.responsive=true; // OK
Chart.animation=false; // DOS, in options

//var chart1; // 1-year or custom display energymix
//let chart2; // 14-day moving window energymix
//let chart3; // 1-year or custom display storage 
//let chart4; // 14-day moving window storage
let allCharts=new Array(4);
const canvasIDs=["chart1", "chart2","chart3", "chart4"];




// ----------------------------
// Helpers
// ----------------------------
function clampPositive(v) { return v > 0 ? v : 0; }
function clampNegative(v) { return v < 0 ? v : 0; }

function ds(label, data, color, stack = "default", fill = true) {
  return {
    label,
    data,
    borderColor: color,
    //backgroundColor: fill ? color + "AA" : color,
    backgroundColor: color,
    fill,
    tension: 0,
    pointRadius: 0,
    borderWidth: 0,
    order: 3, // lower is more on top, reverse of z index!
    stack
  };
}

// ----------------------------
// Build datasets for the energymix daily and clipped charts
// ----------------------------

function buildDatasetsEnergymix(inputData) {

  // fn=function argument,
  // v=>v is the default identity function in arrow style
  function mapData(key, fn = v => v) { 
    return inputData.map(d => ({
      x: d.timeUTC_ms,
      y: fn(d[key] || 0)
    }));
  }

  // rgba or rgb colors possible
  
  const datasets = [
    ds("Biomasse", mapData("biomass"), colBiomass),
    ds("Laufwasser", mapData("runningHydro"), colRunningHydro),
    ds("Kernkraft", mapData("nuclear"), colNuclear),
    ds("Kohle", mapData("coal"), colCoal),
    ds("Gas", mapData("gas"), colGas),
    ds("WindOn", mapData("windOn"), colWindOn),
    ds("WindOff", mapData("windOff"), colWindOff),
    ds("Solar", mapData("solar"), colSolar),
    ds("Import/Export", mapData("importHrly", clampPositive), colImport),
    ds("Pumpspeicher", mapData("pumpHydro", clampPositive),colPumpHydro),
    ds("Batterien", mapData("batt", clampPositive), colBatt),
    ds("H2-Speicher", mapData("H2", clampPositive), colH2),
    ds("", mapData("importHrly", clampNegative), colImport, "neg"),
    ds("",mapData("pumpHydro", clampNegative),
       colPumpHydro, "neg"),
    ds("",mapData("batt",clampNegative),colBatt,"neg"),
    ds("", mapData("H2", clampNegative), colH2, "neg")
  ];

  //console.log("datasets=",datasets);


  const total = inputData.map(d => ({
    x: d.timeUTC_ms,
    y:
    1.00*(
      d.biomass
	+ d.runningHydro
	+ d.nuclear 
        + d.coal 
	+ d.gas
        + d.windOn
        + d.windOff
        + d.solar
        + d.importHrly
        //+ clampPositive(d.importHrly) 
	//+ clampPositive(d.pumpHydro) 
	//+ clampPositive(d.batt) 
      //+ clampPositive(d.H2)
    )
  }));

  datasets.push({
    //label: "Nachfrage+Export+Laden",
    label: "Nachfrage",
    data: total,
    borderColor: "#000",
    borderWidth: 3,
    fill: false,
    stack: 'independent',
    order: 2, // lower order is higher on top!
    pointRadius: 0
  });
  if(false){console.log("builddatsetsEnergymix:",
	      " datasets[1].data[0]=",datasets[1].data[0],
	      " datasets[16].data[0]=",datasets[16].data[0],
	      " inputData[0]=",inputData[0].runningHydro,
	      " inputData[0].runningHydro=",inputData[0].runningHydro,
	      "");
	   }
 // console.log("datasets=",datasets);
  return datasets;
}


// ----------------------------
// Build datasets for the storage daily and clipped charts
// ----------------------------

function buildDatasetsStorage(inputData) {

  // fn=function argument,
  // v=>v is the default identity function in arrow style
  function mapData(key, fn = v => v) { 
    return inputData.map(d => ({
      x: d.timeUTC_ms,
      y: fn(d[key] || 0)
    }));
  }

  
  const datasets = [
    ds("Batteriespeicher", mapData("batt"), colBatt),
    ds("Pumpspeicher", mapData("pumpHydro"), colPumpHydro),
    ds("H2-Speicher", mapData("H2"), colH2)
  ];

  // Total line //!! bugfix*=1.02, charts does not draw on top althhough last
  const total = inputData.map(d => ({
    x: d.timeUTC_ms,
    y:
    1.00*(
        d.batt +
	d.pumpHydro +
	d.H2)
  }));

  datasets.push({
    label: "Gespeicherte Gesamtenergie",
    data: total,
    borderColor: "#000",
    borderWidth: 3,
    fill: false,
    pointRadius: 0
  });
  //console.log("datsets=",datasets);

  return datasets;
  //console.log(datasets);
}




// ######################################################
// init energymix charts (STATIC)
// time scales for daily and clipped timeseries handled automatically
// ######################################################

function initChart(isEnergymix, isDaily, inputData) {

  // y axis max=max(suggestedMaxVal, dataMax)
  
  const suggestedMaxVal=(!isEnergymix && (!isDaily))
	? H2Energy0+hydroEnergy0+battEnergy0 : 0;

  let canvasID=(isEnergymix) ? ((isDaily) ? canvasIDs[0] : canvasIDs[1])
      : ((isDaily) ? canvasIDs[2] : canvasIDs[3]);
  //console.log("initChart: canvasID=",canvasID);
  const ctx = document.getElementById(canvasID).getContext('2d');
  //let chart = new Chart(ctx, {
  setupClick(canvasID, inputData);
  let arrIndex=2*((isEnergymix) ? 0 : 1) + ((isDaily) ? 0 : 1);

  allCharts[arrIndex]=new Chart(ctx, {
    type: "line",
    data: {
      datasets: (isEnergymix) ? buildDatasetsEnergymix(inputData)
	: buildDatasetsStorage(inputData)
    },
    options: {
      events: ['click'],   // only clicks
      maintainAspectRatio: false,
      animation: false,
      parsing: false,  // speedup-hint by ChatGPT
      normalized: true,  // speedup-hint by ChatGPT
      interaction: {
        mode: 'index',
        intersect: false
      },

      plugins: {
        tooltip: { enabled: false },
        legend: {
	  display: true,
	  labels: { // don't draw legend for legend text ''
            filter: function(legendItem, data) {
	      //console.log("legendItem=",legendItem);
	      return (legendItem.text!=='');
            }
	  }
	}
      },
      scales: {
        x: {
          type: 'linear',
	  bounds: 'data', // clip exactly at the data. Works by miracle
	  ticks: {
	    callback: function(value, index, ticks) {

	      const d = new Date(value);

              const start = new Date(inputData[0].timeUTC_ms);
	      const end = new Date(inputData[inputData.length - 1].timeUTC_ms);

	      const rangeHours = (end - start) / (1000 * 60 * 60);

    // ----------------------------
    // 1) SHORT RANGE → hourly view
    // ----------------------------
	      if (rangeHours <= 48) {
		return d.toLocaleString('de-DE', {
                  //day: '2-digit',
		  hour: '2-digit',
                 //minute: '2-digit'
		});
	      }

    // ----------------------------
    // 2) MEDIUM RANGE → daily view
    // ----------------------------
	      if (rangeHours <= 24 * 31) {
                return d.toLocaleString('de-DE', {
                  day: '2-digit',
                  month: 'short'
		});
	      }

    // ----------------------------
    // 3) LONG RANGE → monthly view
    // ----------------------------
	      return d.toLocaleString('de-DE', {
                month: 'short',
                year: '2-digit'
	      });
	    },

	    maxRotation: 0,
	    autoSkip: false,
	    align: 'inner',
	    maxTicksLimit: 10
	  }
	},
	
	y: {
          stacked: true,
	  suggestedMax: suggestedMaxVal,
          title: {
            display: true,
            text: ((isEnergymix) ? "Leistung [GW]" : "Energy [GWh]")
          }
        }
      }
    }
  });
//  console.log("leaving initChartEnergymix, allCharts[arrIndex]=",allCharts[arrIndex]);


}  // initChart




function updateZoom(chart, otherChart, chartData, redrawBottom){
  const points = chart.getElementsAtEventForMode(
    event, 'index', { intersect: false }, true );
      
  if(points.length){
        const it_day=points[0].index;  // points[0] ... [16] all the same
	const it_h=24*it_day;
        const itmin_h=Math.max(Math.min(
	  it_h-itHalfInterval,24*(chartData.length-1)-2*itHalfInterval),0); 
        const itmax_h=itmin_h+2*itHalfInterval;
	const itmin_day=itmin_h/24;
	const itmax_day=itmax_h/24;
    console.log("updateZoom: it_h=",it_h," itmin_h=",itmin_h," itmax_h=",itmax_h);

    // move lower chart ranges 

    if(redrawBottom){updateRange(itmin_h,itmax_h);}

      // draw zoomed lines on zoomInCanvas
      // need separate transparently overlain canvas because
      // chart's redraw overrides zoon-in lines


    const xAxis = chart.scales.x;
    const yAxis = chart.scales.y;
    const xmin = xAxis.min;   // Get the minimum X value
    const xmax = xAxis.max;  
    const ymin = yAxis.min; 
    const other_xAxis = otherChart.scales.x;
    const other_yAxis = otherChart.scales.y;
    const other_xmin = other_xAxis.min;   // Get the minimum X value
    const other_xmax = other_xAxis.max;  
    const other_ymin = other_yAxis.min; 


    // otherChart at same x but +50*vw y value (css)

    const xPixMin=xAxis.getPixelForValue(xmin);
    const xPixLow=xAxis.getPixelForValue(chartData[itmin_day].timeUTC_ms);
    const xPixHi=xAxis.getPixelForValue(chartData[itmax_day].timeUTC_ms);
    const xPixMax = xAxis.getPixelForValue(xmax);

    const yPixMin = yAxis.getPixelForValue(ymin);

    const other_xPixMin = other_xAxis.getPixelForValue(other_xmin);
    const other_xPixMax = other_xAxis.getPixelForValue(other_xmax);

    const other_yPixMin = other_yAxis.getPixelForValue(other_ymin)+50*vh;

      
    //const zoomInRegion=document.getElementById("zoomInRegion");
    //zoomInRegion.zIndex="2";
    const zoomInCanvas=document.getElementById("zoomInCanvas");
    zoomInCanvas.width=60*vw;                 // as css zoomInRegion
    zoomInCanvas.height=100*vh;
    //zoomInCanvas.zIndex="2"; // DOS
    //zoomInCanvas.bringToFront; // DOS
    console.log("zoomInCanvas=",zoomInCanvas);
    const ctx = zoomInCanvas.getContext('2d');

    ctx.strokeStyle="rgb(0,0,0)";
    ctx.beginPath();
    ctx.moveTo(xPixLow, yPixMin);
    ctx.lineTo(other_xPixMin, other_yPixMin);

    ctx.moveTo(xPixHi, yPixMin);
    ctx.lineTo(other_xPixMax, other_yPixMin);

    // draw the Path
	
    ctx.stroke();

    // draw semitransparent rectangle denoting the range in top chart

    ctx.fillStyle="rgba(0,0,50,0.1)";
    ctx.fillRect(xPixLow,0,xPixHi-xPixLow,yPixMin);
  }
}


// ----------------------------
// Click popup
// ----------------------------
function setupClick(canvasID, inputData) {

  const box = document.getElementById("clickInfo"); // generic for all charts
  const canvas=document.getElementById(canvasID);
  const ctx = canvas.getContext('2d');
  
 

  
  // canvas.onmousemove = handleMouseMove(event,this); // does not work
  // treat it here directly inside function 

  canvas.onmousedown = function(event){
    mousedown=true;
  }

  canvas.onmouseup = function(event){
    mousedown=false;
  }

  // separate named function does not work;
  // DOS both inside and outside setupClick
  
  canvas.onmousemove = function(event){
    //console.log("canvas.onmousemove: canvasID=",canvasID,
//		" mousedown=",mousedown);

    // dragging over top charts 0,2 to shift range of bottom charts
    
    if(mousedown &&((canvasID==canvasIDs[0]) || (canvasID==canvasIDs[2]))){ 

      //getMouseCoordinates(event,canvas);  //=> xPixUser, yPixUser
      
      let chart=Chart.getChart(canvasID);
      let otherChart=(canvasID==canvasIDs[0])
	  ? Chart.getChart(canvasIDs[1]) : Chart.getChart(canvasIDs[3]);

      updateZoom(chart, otherChart, inputData, false); //last arg redrawBottom

  
    }
    else{mousedown=false;}
  }
  
  canvas.onclick = function(event) {
    let chart=Chart.getChart(canvasID);
    const isTopChart=((canvasID==canvasIDs[0])||(canvasID==canvasIDs[2]));
    const isEnergyChart=((canvasID==canvasIDs[0])||(canvasID==canvasIDs[1]));

    const points = chart.getElementsAtEventForMode(
      event, 'index', { intersect: false }, true
    );
    console.log("onclick: points=",points);
    
    if (!points.length) {
      box.style.display = "none";
      return;
    }

    const d = inputData[points[0].index];
    const dt = (isTopChart)
	  ? new Date(d.timeUTC_ms).toDateString()
	  : new Date(d.timeUTC_ms);

    let html = `<b>${dt.toLocaleString('de-DE')}</b><br>`;

    // selected data for energy view

    if(isEnergyChart){
      html += "Nachfrage: "+d.load.toFixed(1)+" GW<br>";
      html += "Solar: "+d.solar.toFixed(1)+" GW<br>";
      html += "Wind: "+(d.windOn+d.windOff).toFixed(1)+" GW<br>";
    }

    else{
      for (let k in d) {
        if (k !== "timeStr" && k !== "timeUTC_ms") {
          html += `${k}: ${d[k].toFixed(2)} GW<br>`;
        }
      }
    }


    let fontsize=(Math.round(2.0*vmin)).toString();
    box.innerHTML = html;
    box.style.left = event.pageX + 10 + "px"; //!!
    box.style.top = (isTopChart) ? 1*vh : 51*vh;
    box.style.display = "block";
    box.style.fontSize=fontsize;
    console.log(" box.style=",box.style);

    // move lower charts also at click; because no named functions possible,
    // code duplication (without the mousedown "if" and w/o min drag condition)

    if(isTopChart){
      getMouseCoordinates(event,canvas);  //=> xPixUser, yPixUser

      let otherChart=(canvasID==canvasIDs[0])
	  ? Chart.getChart(canvasIDs[1]) : Chart.getChart(canvasIDs[3]);

      updateZoom(chart, otherChart,inputData,true); //last arg redrawBottom);
      
    }
    mousedown=false; 
  };
}

// ----------------------------
// main


//initChart;
