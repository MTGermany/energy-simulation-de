
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
    order: 1,
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
    ds("Import", mapData("importHrly", clampPositive), colImport),
    ds("Pumpspeicher (+)", mapData("pumpHydro", clampPositive),colPumpHydro),
    ds("Batterien (+)", mapData("batt", clampPositive), colBatt),
    ds("H2-Speicher (+)", mapData("H2", clampPositive), colH2),
    ds("Export", mapData("importHrly", clampNegative), colImport, "neg"),
    ds("Pumpspeicher (-)",mapData("pumpHydro", clampNegative),
       colPumpHydro, "neg"),
    ds("Batteryien (-)",mapData("batt",clampNegative),colBatt,"neg"),
    ds("H2-Speicher (-)", mapData("H2", clampNegative), colH2, "neg")
  ];


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
    order: 0,
    pointRadius: 0
  });
  if(false){console.log("builddatsetsEnergymix:",
	      " datasets[1].data[0]=",datasets[1].data[0],
	      " datasets[16].data[0]=",datasets[16].data[0],
	      " inputData[0]=",inputData[0].runningHydro,
	      " inputData[0].runningHydro=",inputData[0].runningHydro,
	      "");
	   }
  console.log("datasets=",datasets);
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




// ----------------------------
// Click popup
// ----------------------------
function setupClick(canvasID, inputData) {

  const box = document.getElementById("clickInfo"); // generic for all charts
  const canvas=document.getElementById(canvasID);
  const ctx = canvas.getContext('2d');
  
  // only rect, not canvas has width unless explicitly assigned from rect!!
  const rect = canvas.getBoundingClientRect(); 
  
  const xPixOffset=-0.01*rect.width; // distance between pointer and zoombar

  
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
      
      let xPixLeft=rect.left; // left-upper corner of the canvas 
      let yPixTop=rect.top;  // in browser reference system
      xPixUser= event.clientX-xPixLeft; //pixel coords in canvas reference
      yPixUser= event.clientY-yPixTop;
      
      // draw zoomed=in region on this canvas

      translateX_val="translateX("+(0.978*(xPixUser-xPixOffset))+"px";
      console.log("translateX_val=",translateX_val);
      document.getElementById("zoomInRegion").style.transform=translateX_val;


      // move lower chart ranges

      let xrel=1.08*xPixUser/canvas.width-0.06;
      let itcenter=Math.round(xrel*winddata.length);
      let itmin=itcenter-itHalfInterval;
      let itmax=itcenter+itHalfInterval;
      if(Math.abs(xRelDragStart-xrel)>0.002){ // rhs=mouse drag delay
	xRelDragStart=xrel;
        updateRange(itmin,itmax);
      }
    }
    else{mousedown=false;}
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
    box.style.left = evt.pageX + 10 + "px"; //!!
    box.style.top = evt.pageY + 10 + "px";
    box.style.display = "block";
    //box.style.fontsize= fontsize; // DOS; set in .css
    //console.log("fontsize=",fontsize," box=",box);

    // move lower charts also at click; because no named functions possible,
    // code duplication (without the mousedown "if" and w/o min drag condition)

    if((canvasID==canvasIDs[0]) || (canvasID==canvasIDs[2])){
      getMouseCoordinates(event,canvas);  //=> xPixUser, yPixUser

     // draw zoomed=in region on this canvas


      // do move lower chart ranges

      let xrel=1.08*xPixUser/this.width-0.06;
      let itcenter=Math.round(xrel*winddata.length);
      let itmin=itcenter-itHalfInterval;
      let itmax=itcenter+itHalfInterval;
      //console.log("itmin=",itmin," itmax=",itmax);
      xRelDragStart=xrel;
      updateRange(itmin,itmax);
      
    }
    mousedown=false; 
  };
}

// ----------------------------
// main


//initChart;
