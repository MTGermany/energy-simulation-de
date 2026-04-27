"use strict"



//####################################################################
// top-level global GUI variables and event listeners
//####################################################################

// vw and vh as in css such that 100*vw is full window width
// "||0" catches undefined or null where you cannot do a Math.max)


let vw = 0.01*Math.max(document.documentElement.clientWidth || 0,
		       window.innerWidth || 0);
let vh = 0.01*Math.max(document.documentElement.clientHeight || 0,
		       window.innerHeight || 0);
let vmin=Math.min(vw, vh);
let vmax=Math.max(vw, vh);

window.addEventListener("resize", handleWindowResize); //eventListener needed!

function handleWindowResize() {
  vw = 0.01*Math.max(document.documentElement.clientWidth || 0,
		     window.innerWidth || 0);
  vh = 0.01*Math.max(document.documentElement.clientHeight || 0,
		     window.innerHeight || 0);
  vmin=Math.min(vw, vh);
  vmax=Math.max(vw, vh);
  for(var i=0; i<5; i++){
    smileImgs[i].width=8*vmin; // rounding automatically; no ".."!
    smileImgs[i].height=8*vmin;
    console.log("smileImgs[i]=",smileImgs[i]);
  }
  console.log("in handleWindowResize(): vw=",vw," vh=",vh);
}

let strategyIndex=0; //!!
function implementStrategy(selectedIndex) {
  strategyIndex=selectedIndex;
  console.log("implementStrategy: strategieIndex=",strategyIndex);
}



//####################################################################
// General helpers
//####################################################################

function isNumeric(n) {
    return !isNaN(parseFloat(n)) && isFinite(n);
}
function formd0(x){return parseFloat(x).toFixed(0);}


//####################################################################
// Button control
//####################################################################

var supplyDemandShown=true;
var energymixShown=true;

function toggleControl(){ 

  //console.log("in toggleControl");

  var toggleButton=document.getElementById('toggleControlButton');
  var controlSupplyDemandWindow
      =document.getElementById('controlSupplyDemandDiv');
  var controlStrategyWindow
      =document.getElementById('controlStrategyDiv');
  supplyDemandShown = !supplyDemandShown;
  
  if(supplyDemandShown){
    controlSupplyDemandWindow.style.display = 'block';  
    controlStrategyWindow.style.display = 'none';  
    toggleButton.innerHTML="Gehe zu Speicherattributen/Strategie";
  }
  else{
    controlSupplyDemandWindow.style.display = 'none';  
    controlStrategyWindow.style.display = 'block';  
    toggleButton.innerHTML="Gehe zu Angebot/Nachfrage";
  }
   
} // end Start/Stop button callback as images

function toggleGraphics(){ 

  //console.log("in toggleGraphics");

  var toggleButton=document.getElementById('toggleGraphicsButton');
  var chart1Window=document.getElementById('areaGraphics1');
  var chart2Window=document.getElementById('areaGraphics2');
  var chart3Window=document.getElementById('areaGraphics3');
  var chart4Window=document.getElementById('areaGraphics4');

  energymixShown = !energymixShown;
  
  if(energymixShown){
    chart1Window.style.display = 'block';  
    chart2Window.style.display = 'block';  
    chart3Window.style.display = 'none';  
    chart4Window.style.display = 'none';
    document.getElementById("clickInfo").style.display = "none";
    toggleButton.innerHTML="Gehe zur Speicheransicht";
  }
  else{
    chart1Window.style.display = 'none';  
    chart2Window.style.display = 'none';  
    chart3Window.style.display = 'block';  
    chart4Window.style.display = 'block';  
    document.getElementById("clickInfo").style.display = "none";
    toggleButton.innerHTML="Gehe zur Energiemix-Ansicht";

  }

  if(false){console.log("exit toggleGraphics: energymixShown=",energymixShown,
	      "\n chart1Window=",chart1Window,
			"\n chart3Window=",chart3Window);
	   }
   
} // end toggleGraphics


//####################################################################
// Merkelsmileys
//####################################################################

const smileImgs=[5];

for(var i=0; i<5; i++){
  smileImgs[i] = document.createElement("img");
  let str_imgfile="figs/smiley"+(i+1).toString()+".png";
  smileImgs[i].src=str_imgfile;
  smileImgs[i].width=8*vmin; //WATCH OUT! Only direct numbers, no pix, vw etc
  smileImgs[i].height=8*vmin;
  //console.log("smileImgs[i]=",smileImgs[i]);

}
console.log(document.getElementById("merkelsmileys"));
document.getElementById("merkelsmileys").appendChild(smileImgs[0]);



//################################################################
// html5 sliders callback routines
//#################################################################

// value in units displayed by slider, generally not SI
// round => commaDigits=0
// e.g., setSlider(slider_loadGen, slider_loadGenStr, 100*loadGenRel, 0, "%");

function setSlider(slider, slider_valField, value, commaDigits, str_units){
  var formattedValue=value.toFixed(commaDigits);
  slider.value=formattedValue;
  slider_valField.innerHTML=formattedValue+" "+str_units; 
}


// ------------------------------------------------
// Sliders 1: General load (w/o BEV and heatpumps)
// ------------------------------------------------

var fLoad=1.  //1=100%
var slider_Load = document.getElementById('slider_Load');
var slider_LoadStr = document.getElementById("slider_LoadStr");
slider_Load.oninput = function() {
  //console.log("in slider_Load.oninput: this.value=" + this.value);
  slider_LoadStr.innerHTML = this.value+" %";
  fLoad=parseFloat(this.value)/100;
}
setSlider(slider_Load, slider_LoadStr, 100*fLoad, 0, "%");


// BEV

var fBEV=fBEV0;
var slider_BEV = document.getElementById('slider_BEV');
var slider_BEVStr = document.getElementById("slider_BEVStr");
slider_BEV.oninput = function() {
  //console.log("in slider_BEV.oninput: this.value="+this.value);
  slider_BEVStr.innerHTML = this.value+" %";
  fBEV=parseFloat(this.value)/100;
}
setSlider(slider_BEV, slider_BEVStr, 100*fBEV0, 0, "%");

// heatpumps

var fWP=fWP0;
var slider_WP = document.getElementById('slider_WP');
var slider_WPStr = document.getElementById("slider_WPStr");
slider_WP.oninput = function() {
  //console.log("in slider_WP.oninput: this.value=" + this.value);
  slider_WPStr.innerHTML = this.value+" %";
  fWP=parseFloat(this.value)/100;
}
setSlider(slider_WP, slider_WPStr, 100*fWP0, 0, "%");


// ------------------------------------------------
// Sliders 2: supply
// ------------------------------------------------


// PV  add some &nbsp; to PV to force right margin since html does not
// want to do this

var pow0_PV=pow00_PV;
var slider_PV = document.getElementById('slider_PV');
var slider_PVStr = document.getElementById("slider_PVStr");
slider_PV.oninput = function() {
  //console.log("in slider_PV.oninput: this.value=" + this.value);
  pow0_PV=parseFloat(this.value);
  slider_PVStr.innerHTML
    = Math.round(this.value)+" GW ("+formd0(100*pow0_PV/pow00_PV)+"%)"
  + " &nbsp;"
}
setSlider(slider_PV, slider_PVStr, pow0_PV, 0,
	  " GW (100%)  &nbsp;");


// wind onshore

var pow0_WindOn=pow00_WindOn;
var slider_WindOn = document.getElementById('slider_WindOn');
var slider_WindOnStr = document.getElementById("slider_WindOnStr");
slider_WindOn.oninput = function() {
  //console.log("in slider_WindOn.oninput: this.value=" + this.value);
  pow0_WindOn=parseFloat(this.value);
  slider_WindOnStr.innerHTML
    = Math.round(this.value)+" GW ("+formd0(100*pow0_WindOn/pow00_WindOn)
    +"%) &nbsp;";
}
setSlider(slider_WindOn, slider_WindOnStr, pow0_WindOn, 0,
	  " GW (100%)  &nbsp;");


// wind offshore

var pow0_WindOff=pow00_WindOff;
var slider_WindOff = document.getElementById('slider_WindOff');
var slider_WindOffStr = document.getElementById("slider_WindOffStr");
slider_WindOff.oninput = function() {
  //console.log("in slider_WindOff.oninput: this.value=" + this.value);
  pow0_WindOff=parseFloat(this.value);
  slider_WindOffStr.innerHTML
    = Math.round(this.value)+" GW ("+formd0(100*pow0_WindOff/pow00_WindOff)+"%)";
}
setSlider(slider_WindOff, slider_WindOffStr, pow0_WindOff, 0, " GW (100%)");

// nuclear

var pow0_Nuclear=pow00_Nuclear;
var slider_Nuclear = document.getElementById('slider_Nuclear');
var slider_NuclearStr = document.getElementById("slider_NuclearStr");
slider_Nuclear.oninput = function() {
  //console.log("in slider_Nuclear.oninput: this.value=" + this.value);
  pow0_Nuclear=parseFloat(this.value);
  slider_NuclearStr.innerHTML
    = Math.round(this.value)+" GW";

  let merkelIndex=Math.min(4, Math.round(pow0_Nuclear/5.));
  let imageDiv=document.getElementById("merkelsmileys");
  //console.log("merkelIndex=",merkelIndex);
  imageDiv.replaceChild(smileImgs[merkelIndex], imageDiv.childNodes[0]);
}
setSlider(slider_Nuclear, slider_NuclearStr, pow0_Nuclear, 0, " GW");


// coal (black and lignite)

var pow0_Coal=pow00_Coal;
var slider_Coal = document.getElementById('slider_Coal');
var slider_CoalStr = document.getElementById("slider_CoalStr");
slider_Coal.oninput = function() {
  //console.log("in slider_Coal.oninput: this.value=" + this.value);
  pow0_Coal=parseFloat(this.value);
  slider_CoalStr.innerHTML 
    = Math.round(this.value)+" GW ("+formd0(100*pow0_Coal/pow00_Coal)+"%)";
}
setSlider(slider_Coal, slider_CoalStr, pow0_Coal, 0, " GW (100%)");


// gas

var pow0_Gas=pow00_Gas;
var slider_Gas = document.getElementById('slider_Gas');
var slider_GasStr = document.getElementById("slider_GasStr");
slider_Gas.oninput = function() {
  //console.log("in slider_Gas.oninput: this.value=" + this.value);
  pow0_Gas=parseFloat(this.value);
  slider_GasStr.innerHTML
    = Math.round(this.value)+" GW ("+formd0(100*pow0_Gas/pow00_Gas)+"%)";
}
setSlider(slider_Gas, slider_GasStr, pow0_Gas, 0, " GW (100%)");

// hydro and biomass (const slider)

var slider_Hydro = document.getElementById('slider_Hydro');
var slider_Biomass = document.getElementById('slider_Biomass');


// ------------------------------------------------
// Sliders 3: storage
// ------------------------------------------------

// battery charging/discharging power

var battCharge=battCharge0;
var slider_battCharge = document.getElementById('slider_battCharge');
var slider_battChargeStr = document.getElementById("slider_battChargeStr");
slider_battCharge.oninput = function() {
  console.log("in slider_battCharge.oninput: this.value=" + this.value);
  battCharge=parseFloat(this.value);
  slider_battChargeStr.innerHTML
    = Math.round(this.value)
    +" GW ("+formd0(100*battCharge/battCharge0)+"%)";
}
setSlider(slider_battCharge, slider_battChargeStr, battCharge, 0,
	  " GW (100%)");


// battery capacity

var battEnergy=battEnergy0;
var slider_battEnergy = document.getElementById('slider_battEnergy');
var slider_battEnergyStr = document.getElementById("slider_battEnergyStr");
slider_battEnergy.oninput = function() {
  console.log("in slider_battEnergy.oninput: this.value=" + this.value);
  battEnergy=parseFloat(this.value);
  slider_battEnergyStr.innerHTML
    = Math.round(this.value)+" GWh ("+formd0(100*battEnergy/battEnergy0)+"%)";
}
setSlider(slider_battEnergy, slider_battEnergyStr, battEnergy, 0,
	  " GWh (100%)");

// pumphydro=const

var hydroEnergy=hydroEnergy0;
var hydroCharge=hydroCharge0;


// H2 charging power ("Electrolyseure")

var H2Charge=H2Charge0;
var slider_H2Charge = document.getElementById('slider_H2Charge');
var slider_H2ChargeStr = document.getElementById("slider_H2ChargeStr");
slider_H2Charge.oninput = function() {
  //console.log("in slider_H2Charge.oninput: this.value=" + this.value);
  H2Charge=parseFloat(this.value);
  slider_H2ChargeStr.innerHTML
    = Math.round(this.value)+" GW";
}
setSlider(slider_H2Charge, slider_H2ChargeStr, H2Charge0, 0, " GW");


// H2 discharging power (H2 power plants to be built)

var H2Discharge=H2Discharge0;
var slider_H2Discharge = document.getElementById('slider_H2Discharge');
var slider_H2DischargeStr = document.getElementById("slider_H2DischargeStr");
slider_H2Discharge.oninput = function() {
  //console.log("in slider_H2Discharge.oninput: this.value=" + this.value);
  H2Discharge=parseFloat(this.value);
  slider_H2DischargeStr.innerHTML
    = Math.round(this.value)+" GW";
}
setSlider(slider_H2Discharge, slider_H2DischargeStr, H2Discharge0, 0, " GW");


// H2 capacity

var H2Energy=H2Energy0;
var slider_H2Energy = document.getElementById('slider_H2Energy');
var slider_H2EnergyStr = document.getElementById("slider_H2EnergyStr");
slider_H2Energy.oninput = function() {
  //console.log("in slider_H2Energy.oninput: this.value=" + this.value);
  H2Energy=parseFloat(this.value);
  slider_H2EnergyStr.innerHTML
    = Math.round(this.value)+" GWh";
}
setSlider(slider_H2Energy, slider_H2EnergyStr, H2Energy0, 0, " GW");


// ------------------------------------------------
// Sliders 4: import/export
// ------------------------------------------------



var importPow=importPow0;
var slider_importPow = document.getElementById('slider_importPow');
var slider_importPowStr = document.getElementById("slider_importPowStr");
slider_importPow.oninput = function() {
  console.log("in slider_importPow.oninput: this.value=" + this.value);
  importPow=parseFloat(this.value);
  slider_importPowStr.innerHTML
    = Math.round(this.value)+" GW ("+formd0(100*importPow/importPow0)+"%)";
}
setSlider(slider_importPow, slider_importPowStr, importPow, 0, " GW (100%)");








//####################################################################
// mouse callbacks (presently not used but maybe later)
//####################################################################

function handleMouseEnter(event){
  //console.log("handleMouseEnter: mouse entered");
}

function handleMouseDown(event){
  //console.log("handleMouseDown from div");
}

// does not work -> in graphics canvas.onmousemove = function(event){

function handleMouseMove(event,canvas){
  //console.log("handleMouseMove: mouse moved"); 
}

function handleMouseUp(event){
  //console.log("handleMouseUp from div: redo simulation");
  mousedown=false;
  updateSimulation(strategyIndex);
}



//#####################################################
// canvas onclick and part of touchEnd callback
// do at most one of the following actions
// [(1) traffic light editor (only traffic-simulation.de)
// (2) change speed limits
// (3) switch traffic lights
// (4) slow down vehicles
// (2)-(4) only if isDragged=false (real click)
//#####################################################



//####################################################################
// functions called in the top-level mouse callbacks
//####################################################################


// get physical and pixel coordinates for all mouse events
// for touch events: getTouchCoordinates(event)

let xPixUser=0;
let yPixUser=0;
let xRelDragStart=0;
let mousedown=false;

function getMouseCoordinates(event,canvas){

  // always use canvas-related pixel and physical coordinates

  var rect = canvas.getBoundingClientRect();
  var xPixLeft=rect.left; // left-upper corner of the canvas 
  var yPixTop=rect.top;   // in browser reference system
  xPixUser= event.clientX-xPixLeft; //pixel coords in canvas reference
  yPixUser= event.clientY-yPixTop; 

  if(false){
    console.log("getMouseCoordinates: xPixUser=",xPixUser,
		" yPixUser=",yPixUser);
  }
}

/*
function download(data, filename) {
    // data is the string type, that contains the contents of the file.
    // filename is the default file name, some browsers allow the user to change this during the save dialog.

    // Note that we use octet/stream as the mimetype
    // this is to prevent some browsers from displaying the 
    // contents in another browser tab instead of downloading the file
    var blob = new Blob([data], {type:'octet/stream'});

    //IE 10+
    if (window.navigator.msSaveBlob) {
        window.navigator.msSaveBlob(blob, filename);
    }
    else {
        //Everything else
        var url = window.URL.createObjectURL(blob);
        var a = document.createElement('a');
        document.body.appendChild(a);
        a.href = url;
        a.download = filename;
      console.log("a.download=",a.download);
        setTimeout(() => {
            //setTimeout hack is required for older versions of Safari

            a.click();

            //Cleanup
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        }, 1);
    }
}

*/
