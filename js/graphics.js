Chart.defaults.font.size = Math.round(2*vmin);
Chart.maintainAspectRatio= false;
Chart.responsive=true;
Chart.animation=false;

let chart1; // 1-year or custom display energymix
let chart2; // 14-day moving window energymix
let chart3; // 1-year or custom display storage 
let chart4; // 14-day moving window storage


// ----------------------------
// Example data
// ----------------------------
let obj = [
  {
    timeUTC_ms: 1735689600000,
    biomass: 5,
    gas: 10,
    coal: 8,
    runningHydro: 3,
    hydroStorage: -2,
    batteryStorage: -1,
    wind: 12, solar: 0,
    H2storage: -0.5
  },
  {
    timeUTC_ms:1735693200000,
    biomass: 6,
    gas: 9,
    coal: 7,
    runningHydro: 3,
    hydroStorage: 2,
    batteryStorage: -2,
    wind: 14, solar: 0,
    H2storage: 0.3
  },
  {
    timeUTC_ms:1735696800000,
    biomass: 5,
    gas: 8,
    coal: 6,
    runningHydro: 2,
    hydroStorage: -1,
    batteryStorage: 1,
    wind: 10, solar: 1,
    H2storage: -0.2
  }
];



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
    backgroundColor: fill ? color + "AA" : color,
    fill,
    tension: 0,
    pointRadius: 0,
    stack
  };
}

// ----------------------------
// Build datasets
// ----------------------------

function buildDatasets() {

  function mapData(key, fn = v => v) {
    return obj.map(d => ({
      x: d.timeUTC_ms,
      y: fn(d[key] || 0)
    }));
  }

  const datasets = [
    ds("Coal", mapData("coal"), "#444"),
    ds("Gas", mapData("gas"), "#ff7f50"),
    ds("Biomass", mapData("biomass"), "#6b8e23"),
    ds("Running Hydro", mapData("runningHydro"), "#1f77b4"),

    ds("Hydro Storage (+)", mapData("hydroStorage", clampPositive), "#17becf"),
    ds("Battery Storage (+)", mapData("batteryStorage", clampPositive), "#9467bd"),
    ds("H2 Storage (+)", mapData("H2storage", clampPositive), "#bcbd22"),

    ds("Wind", mapData("wind"), "#2ca02c"),
    ds("Solar", mapData("solar"), "#ffd700"),

    ds("Hydro Storage (-)", mapData("hydroStorage", clampNegative), "#17becf", "neg"),
    ds("Battery Storage (-)", mapData("batteryStorage", clampNegative), "#9467bd", "neg"),
    ds("H2 Storage (-)", mapData("H2storage", clampNegative), "#bcbd22", "neg")
  ];

  // Total line //!! bugfix*=1.02, charts does not draw on top althhough last
  const total = obj.map(d => ({
    x: d.timeUTC_ms,
    y:
    1.02*(clampPositive(d.coal) +  
      clampPositive(d.gas) +
      clampPositive(d.biomass) +
      clampPositive(d.runningHydro) +
      clampPositive(d.wind) +
      clampPositive(d.solar) +
      clampPositive(d.hydroStorage) +
      clampPositive(d.batteryStorage) +
	  clampPositive(d.H2storage))
  }));

  datasets.push({
    label: "Total",
    data: total,
    borderColor: "#000",
    borderWidth: 3,
    fill: false,
    pointRadius: 0
  });
  console.log("datsets=",datasets);

  return datasets;
  console.log(datasets);
}

// ----------------------------
// Chart init (STATIC)
// ----------------------------
function initChart() {

  const ctx = document.getElementById('chart1').getContext('2d');
  chart1 = new Chart(ctx, {
    type: "line",
    data: {
      datasets: buildDatasets()
    },
    options: {
       events: ['click'],   // only clicks

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
	  ticks: {
	    callback: function(value, index, ticks) {

	      const d = new Date(value);

              const start = new Date(obj[0].timeUTC_ms);
	      const end = new Date(obj[obj.length - 1].timeUTC_ms);

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
            text: "Leistung [GW]"
          }
        }
      }
    }
  });

  setupClick();
  console.log("leaving initChart(), chart1=",chart1);
}  // initChart


// ----------------------------
// Click popup
// ----------------------------
function setupClick() {

  const box = document.getElementById("clickInfo");

  document.getElementById("chart1").onclick = function(evt) {

    const points = chart1.getElementsAtEventForMode(
      evt, 'index', { intersect: false }, true
    );

    if (!points.length) {
      box.style.display = "none";
      return;
    }

    const d = obj[points[0].index];
    const dt = new Date(d.timeUTC_ms);

    let html = `<b>${dt.toLocaleString('de-DE')}</b><br>`;

    for (let k in d) {
      if (k !== "time" && k !== "timeUTC_ms") {
        html += `${k}: ${d[k].toFixed(2)} GW<br>`;
      }
    }

    let fontsize=(Math.round(1.5*vmin)).toString();
    box.innerHTML = html;
    box.style.left = evt.pageX + 10 + "px";
    box.style.top = evt.pageY + 10 + "px";
    box.style.display = "block";
    //box.style.fontsize= fontsize; // DOS; set in .css
    console.log("fontsize=",fontsize," box.style=",box.style);

  };
}

// ----------------------------
// main


//initChart();
