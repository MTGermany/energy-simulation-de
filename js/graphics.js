Chart.defaults.font.size = Math.round(2*vmin); // OK
Chart.maintainAspectRatio= false; // DOS; need to define in Chart.options
Chart.responsive=true; // OK
Chart.animation=false; // DOS, in options

//var chart1; // 1-year or custom display energymix
//let chart2; // 14-day moving window energymix
//let chart3; // 1-year or custom display storage 
//let chart4; // 14-day moving window storage
let allCharts=new Array(4);




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

  // rgba colors DOS, shows only in key list
  
  const datasets = [
    ds("Biomasse", mapData("biomass"), "rgba(0,127,0,1)"),
    ds("Laufwasser", mapData("runningHydro"), "rgba(0,0,255,1)"),
    ds("Kernkraft", mapData("nuclear"), "#aa00aa"),
    ds("Kohle", mapData("coal"), "#444"),
    ds("Gas", mapData("gas"), "#ff7f50"),
    ds("WindOn", mapData("windOn"), "rgba(0,127,255,1)"),
    ds("WindOff", mapData("windOff"), "rgba(0,40,225,1)"),
    ds("Solar", mapData("solar"), "rgba(255,200,0,1)"),
    ds("Import", mapData("importHrly", clampPositive), "rgba(180,180,180,1"),

    ds("Pumpspeicher (+)", mapData("pumpHydro", clampPositive), "#17becf"),
    ds("Batterien (+)", mapData("batt", clampPositive), "#9467bd"),
    ds("H2-Speicher (+)", mapData("H2", clampPositive), "#bcbd22"),
    ds("Export", mapData("importHrly", clampNegative), "#888888", "neg"),
    ds("Pumpspeicher (-)", mapData("pumpHydro", clampNegative), "#17becf", "neg"),
    ds("Batteryien (-)", mapData("batt", clampNegative), "#9467bd", "neg"),
    ds("H2-Speicher (-)", mapData("H2", clampNegative), "#bcbd22", "neg")
  ];

  // Total line //!! bugfix*=1.02, charts does not draw on top althhough last
  const total = inputData.map(d => ({
    x: d.timeUTC_ms,
    y:
    1.02*(
        d.biomass +
	d.runningHydro +
	d.nuclear +  
        d.coal +
	d.gas +
        d.windOn +
        d.windOff +
        d.solar +
        clampPositive(d.importHrly) +
	clampPositive(d.pumpHydro) +
	clampPositive(d.batt) +
	clampPositive(d.H2))
  }));

  datasets.push({
    label: "Nachfrage+Export+Laden",
    data: total,
    borderColor: "#000",
    borderWidth: 3,
    fill: false,
    pointRadius: 0
  });
  //console.log("datsets=",datasets);

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

  // rgba colors DOS, shows only in key list
  
  const datasets = [
    ds("Batteriespeicher", mapData("batt"), "rgba(127,127,127,1)"),
    ds("Pumpspeicher", mapData("pumpHydro"), "rgba(0,40,210,1)"),
    ds("H2-Speicher", mapData("H2"), "#ff4400")
  ];

  // Total line //!! bugfix*=1.02, charts does not draw on top althhough last
  const total = inputData.map(d => ({
    x: d.timeUTC_ms,
    y:
    1.02*(
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

  let canvasID=(isEnergymix) ? ((isDaily) ? "chart1" : "chart2")
      : ((isDaily) ? "chart3" : "chart4");
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
      interaction: {
        mode: 'index',
        intersect: false
      },

      plugins: {
        tooltip: { enabled: false },
        legend: { display: true }
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
	    autoSkip: true
	  }
	},
	
	y: {
          stacked: true,
          title: {
            display: true,
            text: ((isEnergymix) ? "Leistung [GW]" : "Energy [GWh]")
          }
        }
      }
    }
  });
  //console.log("leaving initChartEnergymix);


}  // initChart




// ----------------------------
// Click popup
// ----------------------------
function setupClick(canvasID, inputData) {

  const box = document.getElementById("clickInfo"); // generic for all charts
  let canvas=document.getElementById(canvasID);
  // canvas.onmousemove = handleMouseMove(event,this); // does not work

  canvas.onmousedown = function(event){
    mousedown=true;
  }

  canvas.onmouseup = function(event){
    mousedown=false; xPixDragStart=0;
  }

  // separate named function does not work;
  // DOS both inside and outside setupClick
  
  canvas.onmousemove = function(event){
    //console.log("canvas.onmousemove: canvasID=",canvasID,
//		" mousedown=",mousedown);

    // dragging over top charts to shift range of bottom charts
    
    if(mousedown &&((canvasID=="chart1") || (canvasID=="chart3"))){ 
      getMouseCoordinates(event,this);  //=> xPixUser, yPixUser

      // do moving lower chart ranges

      let xrel=1.08*xPixUser/this.width-0.06;
      let itcenter=Math.round(xrel*winddata.length);
      let itmin=itcenter-itHalfInterval;
      let itmax=itcenter+itHalfInterval;
      if(Math.abs(xRelDragStart-xrel)>0.02){
	xRelDragStart=xrel;
        updateRange(itmin,itmax);
      }
    }
    else{mousedown=false; xPixDragStart=0;}
  }
  
  canvas.onclick = function(evt) {
    let chart=Chart.getChart(canvasID);
    //console.log("in canvas.onclick: function setupClick: canvasID=",
//		canvasID," chart=",chart);

    const points = chart.getElementsAtEventForMode(
      evt, 'index', { intersect: false }, true
    );
    //console.log("onclick: points=",points);
    
    if (!points.length) {
      box.style.display = "none";
      return;
    }

    const d = inputData[points[0].index];
    const dt = new Date(d.timeUTC_ms);
    //console.log("d=",d);
    let html = `<b>${dt.toLocaleString('de-DE')}</b><br>`;
    //console.log("html=",html);
    for (let k in d) {
      if (k !== "timeStr" && k !== "timeUTC_ms") {
        html += `${k}: ${d[k].toFixed(2)} GW<br>`;
      }
    }

    let fontsize=(Math.round(2.5*vmin)).toString();
    box.innerHTML = html;
    box.style.left = evt.pageX + 10 + "px"; //!!!
    box.style.top = evt.pageY + 10 + "px";
    box.style.display = "block";
    //box.style.fontsize= fontsize; // DOS; set in .css
    //console.log("fontsize=",fontsize," box=",box);

    // move lower charts also at click; because no named functions possible,
    // code duplication (without the mousedown "if" and w/o min drag condition)

    if((canvasID=="chart1") || (canvasID=="chart3")){
      getMouseCoordinates(event,this);  //=> xPixUser, yPixUser

      // do moving lower chart ranges

      let xrel=1.08*xPixUser/this.width-0.06;
      let itcenter=Math.round(xrel*winddata.length);
      let itmin=itcenter-itHalfInterval;
      let itmax=itcenter+itHalfInterval;
      //console.log("itmin=",itmin," itmax=",itmax);
      xRelDragStart=xrel;
      updateRange(itmin,itmax);
      
    }
    mousedown=false; xPixDragStart=0;
  };
}

// ----------------------------
// main


//initChart;
