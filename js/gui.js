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

function implementStrategy(index) {
  console.log("implementStrategy: index=",index);
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

function toggleControl(){ 

  console.log("in toggleControl");

  var toggleButton=document.getElementById('toggleControlButton');
  var controlSupplyDemandWindow
      =document.getElementById('controlSupplyDemandDiv');
  var controlStrategyWindow
      =document.getElementById('controlStrategyDiv');
  supplyDemandShown=!supplyDemandShown;
  
  if(supplyDemandShown){
    controlSupplyDemandWindow.style.display = 'block';  
    controlStrategyWindow.style.display = 'none';  
    toggleButton.innerHTML="Gehe zu Speicher/Strategie";
  }
  else{
    controlSupplyDemandWindow.style.display = 'none';  
    controlStrategyWindow.style.display = 'block';  
    toggleButton.innerHTML="Gehe zu Angebot/Nachfrage";
  }
   
} // end Start/Stop button callback as images


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
  console.log("smileImgs[i]=",smileImgs[i]);

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
  console.log("in slider_Load.oninput: this.value=" + this.value);
  slider_LoadStr.innerHTML = this.value+" %";
  fLoad=parseFloat(this.value)/100;
}
setSlider(slider_Load, slider_LoadStr, 100*fLoad, 0, "%");


// BEV

var fBEV=fBEV0;
var slider_BEV = document.getElementById('slider_BEV');
var slider_BEVStr = document.getElementById("slider_BEVStr");
slider_BEV.oninput = function() {
  console.log("in slider_BEV.oninput: this.value="+this.value);
  slider_BEVStr.innerHTML = this.value+" %";
  fBEV=parseFloat(this.value)/100;
}
setSlider(slider_BEV, slider_BEVStr, 100*fBEV0, 0, "%");

// heatpumps

var fWP=fWP0;
var slider_WP = document.getElementById('slider_WP');
var slider_WPStr = document.getElementById("slider_WPStr");
slider_WP.oninput = function() {
  console.log("in slider_WP.oninput: this.value=" + this.value);
  slider_WPStr.innerHTML = this.value+" %";
  fWP=parseFloat(this.value)/100;
}
setSlider(slider_WP, slider_WPStr, 100*fWP0, 0, "%");


// ------------------------------------------------
// Sliders 2: supply
// ------------------------------------------------


// PV

var pow0_PV=pow00_PV;
var slider_PV = document.getElementById('slider_PV');
var slider_PVStr = document.getElementById("slider_PVStr");
slider_PV.oninput = function() {
  console.log("in slider_PV.oninput: this.value=" + this.value);
  pow0_PV=parseFloat(this.value);
  slider_PVStr.innerHTML
    = Math.round(this.value)+" GW ("+formd0(100*pow0_PV/pow00_PV)+"%)";
}
setSlider(slider_PV, slider_PVStr, pow0_PV, 0, " GW (100%)");


// wind onshore

var pow0_WindOn=pow00_WindOn;
var slider_WindOn = document.getElementById('slider_WindOn');
var slider_WindOnStr = document.getElementById("slider_WindOnStr");
slider_WindOn.oninput = function() {
  console.log("in slider_WindOn.oninput: this.value=" + this.value);
  pow0_WindOn=parseFloat(this.value);
  slider_WindOnStr.innerHTML
    = Math.round(this.value)+" GW ("+formd0(100*pow0_WindOn/pow00_WindOn)+"%)";
}
setSlider(slider_WindOn, slider_WindOnStr, pow0_WindOn, 0, " GW (100%)");


// wind offshore

var pow0_WindOff=pow00_WindOff;
var slider_WindOff = document.getElementById('slider_WindOff');
var slider_WindOffStr = document.getElementById("slider_WindOffStr");
slider_WindOff.oninput = function() {
  console.log("in slider_WindOff.oninput: this.value=" + this.value);
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
  console.log("in slider_Nuclear.oninput: this.value=" + this.value);
  pow0_Nuclear=parseFloat(this.value);
  slider_NuclearStr.innerHTML
    = Math.round(this.value)+" GW";

  let merkelIndex=Math.min(4, Math.round(pow0_Nuclear/5.));
  let imageDiv=document.getElementById("merkelsmileys");
  console.log("merkelIndex=",merkelIndex);
  imageDiv.replaceChild(smileImgs[merkelIndex], imageDiv.childNodes[0]);
}
setSlider(slider_Nuclear, slider_NuclearStr, pow0_Nuclear, 0, " GW");


// coal (black and lignite)

var pow0_Coal=pow00_Coal;
var slider_Coal = document.getElementById('slider_Coal');
var slider_CoalStr = document.getElementById("slider_CoalStr");
slider_Coal.oninput = function() {
  console.log("in slider_Coal.oninput: this.value=" + this.value);
  pow0_Coal=parseFloat(this.value)
  slider_CoalStr.innerHTML 
    = Math.round(this.value)+" GW ("+formd0(100*pow0_Coal/pow00_Coal)+"%)";
}
setSlider(slider_Coal, slider_CoalStr, pow0_Coal, 0, " GW (100%)");


// gas

var pow0_Gas=pow00_Gas;
var slider_Gas = document.getElementById('slider_Gas');
var slider_GasStr = document.getElementById("slider_GasStr");
slider_Gas.oninput = function() {
  console.log("in slider_Gas.oninput: this.value=" + this.value);
  pow0_Gas=parseFloat(this.value)
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
  battCharge=parseFloat(this.value)
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
  battEnergy=parseFloat(this.value)
  slider_battEnergyStr.innerHTML
    = Math.round(this.value)+" GWh ("+formd0(100*battEnergy/battEnergy0)+"%)";
}
setSlider(slider_battEnergy, slider_battEnergyStr, battEnergy, 0,
	  " GWh (100%)");

// pumphydro=const

var hydroEnergy=hydroEnergy0;
var hydroCharge=hydroCharge0;


// H2 charging power ("Electrolyseure")

var H2Charge=0;
var slider_H2Charge = document.getElementById('slider_H2Charge');
var slider_H2ChargeStr = document.getElementById("slider_H2ChargeStr");
slider_H2Charge.oninput = function() {
  console.log("in slider_H2Charge.oninput: this.value=" + this.value);
  H2Charge=parseFloat(this.value)
  slider_H2ChargeStr.innerHTML
    = Math.round(this.value)+" GW ("+formd0(100*H2Charge/H2Charge0)+"%)";
}
setSlider(slider_H2Charge, slider_H2ChargeStr, H2Charge, 0, " GW (100%)");


// H2 discharging power (H2 power plants to be built)

var H2Discharge=0;
var slider_H2Discharge = document.getElementById('slider_H2Discharge');
var slider_H2DischargeStr = document.getElementById("slider_H2DischargeStr");
slider_H2Discharge.oninput = function() {
  console.log("in slider_H2Discharge.oninput: this.value=" + this.value);
  H2Discharge=parseFloat(this.value)
  slider_H2DischargeStr.innerHTML
    = Math.round(this.value)
    +" GW ("+formd0(100*H2Discharge/H2Discharge0)+"%)";
}
setSlider(slider_H2Discharge, slider_H2DischargeStr, H2Discharge, 0,
	  " GW (100%)");


// H2 capacity

var H2Energy=H2Energy0;
var slider_H2Energy = document.getElementById('slider_H2Energy');
var slider_H2EnergyStr = document.getElementById("slider_H2EnergyStr");
slider_H2Energy.oninput = function() {
  console.log("in slider_H2Energy.oninput: this.value=" + this.value);
  H2Energy=parseFloat(this.value)
  slider_H2EnergyStr.innerHTML
    = Math.round(this.value)+" GWh ("+formd0(100*H2Energy/H2Energy0)+"%)";
}
setSlider(slider_H2Energy, slider_H2EnergyStr, H2Energy, 0, " GW (100%)");


// ------------------------------------------------
// Sliders 4: import/export
// ------------------------------------------------



var importPow=importPow0;
var slider_importPow = document.getElementById('slider_importPow');
var slider_importPowStr = document.getElementById("slider_importPowStr");
slider_importPow.oninput = function() {
  console.log("in slider_importPow.oninput: this.value=" + this.value);
  importPow=parseFloat(this.value)
  slider_importPowStr.innerHTML
    = Math.round(this.value)+" GW ("+formd0(100*importPow/importPow0)+"%)";
}
setSlider(slider_importPow, slider_importPowStr, importPow, 0, " GW (100%)");












//####################################################################
// mouse callbacks (presently not used but maybe later)
//####################################################################

function handleMouseEnter(event){
  //console.log("mouse entered");
  activateCoordDisplay(event);
}

function handleMouseDown(event){
  //console.log("mouse down");
  mousedown=true;
  getMouseCoordinates(event); //=> xUser, yUser, xPixUser, yPixUser
  xUserDown=xUser; // memorize starting point of mouse drag
  yUserDown=yUser;
  pickObject(xUser,yUser); // here only trafficObject
}

function handleMouseMove(event){
  //console.log("mouse moved");
  getMouseCoordinates(event); //=> xUser, yUser, xPixUser, yPixUser
  doDragging(xUser,yUser,xUserDown,yUserDown); 
  drawSim(); // to be able to move objects during stopped simulation
}

function handleMouseUp(event){
  //console.log("mouse up");
  getMouseCoordinates(event); // => xUser, yUser, xPixUser, yPixUser
  dropObject(xUser, yUser); // from simulation.de's finishDistortOrDropObject
  drawSim;
  if(false){console.log("  end handleMouseUp(evt):",
			" speedlBoxActive=",speedlBoxActive);}
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

function handleClick(event){
  //console.log("mouse clicked");
  getMouseCoordinates(event); //=> xPixUser, yPixUser, xUser, yUser;
  var isDragged=(distDrag>distDragCrit);
  
  // only if clicked w/o drag:
  // deal with either speedlimit changes, TL, or slow vehicles
  // (drop vehicles/drag them away etc only if isDragged)

  if(!isDragged){
    
    // (2) speedlimit changes if applicable
    
    var changingSpeedl=false; 

    // change speedlimit if speeldBoxActive
    
    if(speedlBoxActive){
      changingSpeedl=true;
      changeSpeedl(xPixUser,yPixUser); 
    }

    // check if click should activate speedlimit box for manip at next click 

    else{ 
      changingSpeedl=activateSpeedlBox(xPixUser,yPixUser);
    }

    // (3) if no speedlimit-changing related action, 
    // change TL if applicable or otherwise slow down vehicle if applicable
    
    if(!changingSpeedl){
      console.log("change TL or slow down vehicles");
      influenceTL(xUser,yUser);
    }
  }
}



function handleMouseOut(event){
  //console.log("mouse out");
  deactivateCoordDisplay(event);
  mousedown=false;
  touchdown=false;
  roadPicked=false;
}




//####################################################################
// functions called in the top-level mouse callbacks
//####################################################################


// get physical and pixel coordinates for all mouse events
// for touch events: getTouchCoordinates(event)


function getMouseCoordinates(event){

  // always use canvas-related pixel and physical coordinates

  var rect = canvas.getBoundingClientRect();
  var xPixLeft=rect.left; // left-upper corner of the canvas 
  var yPixTop=rect.top;   // in browser reference system
  xPixUser= event.clientX-xPixLeft; //pixel coords in canvas reference
  yPixUser= event.clientY-yPixTop; 
  xUser=xPixUser/scale;   //scale from main js onramp.js etc
  yUser=-yPixUser/scale;   //scale from main js onramp.js etc (! factor -1)

  if(false){
	console.log("getMouseCoordinates: xUser=",xUser," yUser=",yUser);
  }
}

// activate display in simulator "log coords u= ..., v= ..."
// if true (overridden in main js) mouse coords shown one activated
// ("onmousemove")

var mouseCoordsActivated=false;
var showMouseCoords=false; 
function activateCoordDisplay(event){
  if(showMouseCoords){
    mouseCoordsActivated=true;  // => sim-straight.showLogicalCoords
    getMouseCoordinates(event); // => xPixUser, xPixUser, xUser, yUser
  }
}


// called in html file whenever onmouseout=true

function deactivateCoordDisplay(event){
  mouseCoordsActivated=false;
}




// do drag actions if onmousemove&&mousedown or if touchdown=true
// which action(s) (onmousdown drag road or trafficObject)
// is determined by onmousedown/touchStart  callback


function doDragging(xUser,yUser,xUserDown,yUserDown){

  trafficObjIsDragged=false;
  
  if(mousedown){

	distDrag=Math.sqrt(Math.pow(xUser-xUserDown,2)
			   + Math.pow(yUser-yUserDown,2));

	if(false){
	  console.log("mousemove && mousedown: trafficObjPicked=",
		      trafficObjPicked,
		    " xUser=",xUser,"xUserDown=",xUserDown,
		    " distDrag=",distDrag,
		    " distDragCrit=",distDragCrit);
	}

	if(distDrag>distDragCrit){ // !! do no dragging actions if only click
	  if(trafficObjPicked){// drag an object
	    trafficObjIsDragged=true;
	      if(trafficObject.isActive){
		trafficObjs.deactivate(trafficObject); // detach obj from road
	      }

	      trafficObject.isDragged=true;
	      trafficObject.xPix=xPixUser;
	      trafficObject.yPix=yPixUser;
	    }
	}
  }// mouse down


    // reset dragged distance to zero if mouse is up

  else{distDrag=0;}
}





// #########################################################
// do the action 1: pick an active or passive trafficObject
// if one is nearby (adapted from pickRoadOrObject of traffic-simulation.de)
// #########################################################

function pickObject(xUser,yUser){


  if(true){
    console.log("itime=",itime," in pickObject: xUser=",
		formd0(xUser)," yUser=",formd0(yUser));
  }

  if(!(typeof trafficObjs === 'undefined')){ // just check for scenarios w/o
    var pickResults=trafficObjs.pickObject(xPixUser, yPixUser, 
				      distCrit_m*scale);
    console.log("  pickObject: pickResults=",pickResults);
    if(pickResults[0]){ // pickResults=[success, trafficObject]
      trafficObject=pickResults[1];
      trafficObjPicked=true;
      if(false){
        console.log("  end pickRoadOrObject: success! picked trafficObject id=",
		    trafficObject.id," type ",
		    trafficObject.type,
		    " isActive=",trafficObject.isActive,
		    " inDepot=",trafficObject.inDepot," end");
      }
      return;
    }
  }

} // canvas onmousedown or touchStart: pickRoadOrObject



// #########################################################
// do the action 2: drop=finalize dragging action 
// Notice: klicking action influenceClickedVehOrTL(..) is separately below 
// while both called in handleTouchEnd(evt)
// from traffic-simulation.de's finishDistortOrDropObject
// #########################################################

function dropObject(xUser, yUser){
  if(true){
    console.log("itime=",itime," in dropObject (canvas_gui):",
    		" trafficObjPicked=",trafficObjPicked,
  		"");
  }

  mousedown=false;
  
  if(distDrag<distDragCrit){
    if(true){
      console.log("  end dropObject: dragging crit",
		  " distDrag =",distDrag,"< distDragCrit=",distDragCrit,
		  " not satisfied (only click) => do nothing)");
    }
    return;
  }


  if(trafficObjPicked){

    var distCritPix=distCrit_m*scale;
    trafficObjs.dropObject(trafficObject, mainroad, 
			   xUser, yUser, distCritPix, scale);
    trafficObjPicked=false;
    console.log("  end dropObject: dropped object!");
  }

  
} // handleMouseUp -> dropObject// writes trajectories recorded every gui.dt_export to file

function performDownload(){  
  var msg="";
  var present=new Date();
  var day=("0" + present.getDate()).slice(-2);// prepend 0 if single-digit day
  var month=("0" + (present.getMonth()+1)).slice(-2);// months start with 0
  var hours=("0" + (present.getHours()+0)).slice(-2);
  var minutes=("0" + (present.getMinutes()+0)).slice(-2);
  var seconds=("0" + (present.getSeconds()+0)).slice(-2);
  var filename="mixedTrafficRecord_"
      +present.getFullYear()+"-"
      +month+"-"
      +day+"_"
      +hours+"h"  // for some strange reason, colons : are transformed into _
      +minutes+"m"
      +seconds+"s"
    +".txt";
  msg=msg+filename+" ";

  mainroad.writeVehiclesToFile(filename);
  if(typeof detectors!=="undefined"){
    for (var iDet=0; iDet<detectors.length; iDet++){
      var filename="Detector"+iDet
        +"_road"+detectors[iDet].road.roadID
        +"_x"+detectors[iDet].u.toFixed(0)+"_time"+time.toFixed(0)+".txt";
      msg=msg+filename+" ";
      detectors[iDet].writeToFile(filename);
    }
  }
  msg="wrote files "+msg+" to default folder (Downloads)";
  downloadActive=false;
  alert(msg);
}


//######################################################################
// write (JSON or normal) string to file (automatically in download folder)
// see also ~/versionedProjects/demo_js/writeFileDemo.html, .js
// and ~/versionedProjects/trafficSimulation/js/control_gui.js
//######################################################################
  
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


