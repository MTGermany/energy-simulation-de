
"use strict"


/*

//state variables from gui:

fLoad        (1=100%)
fBEV         (1=100%)
fWP          (1=100%)
pow0_PV      (simulated nominal power [GW] PV)
pow0_WindOn  (simulated nominal power [GW] wind onshore)
pow0_WindOff (simulated nominal power [GW] wind offshore)
pow0_Nuclear (simulated nominal power [GW] nuclear
pow0_Coal    (simulated nominal power [GW] black + lignite coal)
pow0_Gas     (simulated nominal power [GW] gas)

battCharge   (simulated max battery charging and discharging power [GW]
battEnergy   (simulated storage capacity [GWh] including eta

H2Charge     (analog)
H2Discharge
H2Energy


// defined in data:

winddata
solardata
supplydemanddata2025

*/

const nt=winddata.length;
let itmax=nt-1;  // itmax may become < nt-1 if Dunkelflaute/Hellbrise

const itHalfInterval=3*24;
let itminClipped=238*24;  // initial clippings for lower charts
let itmaxClipped=itminClipped+2*itHalfInterval;

function simulation(strategy){

  // use also global constants defined in gui.js
  // (needed there for the % info)

  this.strategy=strategy; 

  this.hourlymix={}; // create new object => no cloning needed!
  this.hourlysolarRegions={}; // create new object => no cloning needed!
  this.windRegions={}; // create new object => no cloning needed!

  this.storage={ // energy in GWh
    "timeUTC_ms": winddata[0].timeUTC_ms, // initialisation
    "batt": 0.5*battEnergy0,
    "pumpHydro": 0.5*hydroEnergy0,
    "H2": 0.5*H2Energy0
  };
}

//!!! need clone for copying it to outer storage[]

simulation.prototype.cloneStorageWithTime=function(it){ 
  
  var obj={
    "timeUTC_ms": winddata[it].timeUTC_ms, //!! should alsways same es mixdate
    "batt": this.storage.batt,
    "pumpHydro": this.storage.pumpHydro,
    "H2": this.storage.H2
  };

  return obj;
}



// since H2 charged/discharged at other times depending on strategy,
// two separate load management functions
// each returns [matched=true or false, updated mismatch]

// Note 1: since energy in [GWh] and power in [GW] and update time 1h,
// can have power and energy in one expression

// Note 2: The roundtrip efficiency eta is applied completely in the
// charging phase


// only charge but do not discharge for safety

simulation.prototype.chargeHydroBattStorage=function(it){
  let loc_mismatch=this.mismatch();

  if(loc_mismatch<0){// nothing to do because only charging if allowed
    return false; // load not balanced
  }

  else{// supply left to charge batteries and hydro
    let battChargeMax=Math.min((battEnergy-this.storage.batt)/battEta,
			       battCharge);
    let hydroChargeMax=Math.min(
      (hydroEnergy0-this.storage.pumpHydro)/hydroEta,
      hydroCharge0); // index 0 since hydro constant

    if(loc_mismatch<=battChargeMax){
      this.storage.batt += battEta*loc_mismatch;
      this.hourlymix.batt =- loc_mismatch;  // w/o roundturn eta!
      return true;
    }
    else{
      this.storage.batt +=battEta*battChargeMax;
      this.hourlymix.batt =- battChargeMax;
    }
    
    loc_mismatch=this.mismatch();
    if(loc_mismatch<=hydroChargeMax){
      this.storage.pumpHydro +=hydroEta*loc_mismatch;
      this.hourlymix.pumpHydro =- loc_mismatch; // w/o roundturn eta!
      return true;
    }
    else{
      this.storage.pumpHydro +=hydroEta*hydroChargeMax;
      this.hourlymix.pumpHydro =-hydroChargeMax; // w/o roundturn eta!
      return false;
    }
  } // charging branch
}  // chargeHydroBattStorage


// charge and discharge to match demand

simulation.prototype.useHydroBattStorage=function(it){

  
  let loc_mismatch=this.mismatch();

  if(loc_mismatch>=0){// power left to load batteries and pumped hydro

    let battChargeMax=Math.min((battEnergy-this.storage.batt)/battEta,
			       battCharge);
    let hydroChargeMax=Math.min(
      (hydroEnergy0-this.storage.pumpHydro)/hydroEta,
      hydroCharge0); // index 0 since hydro constant

    if(false){
      console.log("sim.useHydroBattStorage: it=",it,
		  " loc_mismatch=", loc_mismatch,
		  " battEnergy=",battEnergy,
		  " this.storage.batt=",this.storage.batt,
		  " battCharge=",battCharge," battChargeMax=", battChargeMax);
    }
 
    if(loc_mismatch<=battChargeMax){
      this.storage.batt += battEta*loc_mismatch;
      this.hourlymix.batt =- loc_mismatch;  // w/o roundturn eta!
      return true;
    }
    else{
      this.storage.batt +=battEta*battChargeMax;
      this.hourlymix.batt =- battChargeMax;
    }
    
    loc_mismatch=this.mismatch();
    if(loc_mismatch<=hydroChargeMax){
      this.storage.pumpHydro +=hydroEta*loc_mismatch;
      this.hourlymix.pumpHydro =- loc_mismatch; // w/o roundturn eta!
      return true;
    }
    else{
      this.storage.pumpHydro +=hydroEta*hydroChargeMax;
      this.hourlymix.pumpHydro =-hydroChargeMax; // w/o roundturn eta!
      return false;
    }
  } // charging branch

  
  // mismatch<0, energy from battery and/or hydro needed
  // charging and discharging power the same

  else{
    
    loc_mismatch=this.mismatch();
    var battDischargeMax=Math.min(this.storage.batt, battCharge0);
    var hydroDischargeMax=Math.min(this.storage.pumpHydro, hydroCharge0);


    if(-loc_mismatch<=battDischargeMax){
      this.storage.batt +=loc_mismatch; // loc_mismatch<0, no eta
      this.hourlymix.batt = - loc_mismatch;
      return true;
    }
    else{
      this.storage.batt -= battDischargeMax;
      this.hourlymix.batt = + battDischargeMax;
    }

    
    loc_mismatch=this.mismatch();

    if(-loc_mismatch<=hydroDischargeMax){
      this.storage.pumpHydro +=loc_mismatch;  //loc_mismatch<0
      this.hourlymix.pumpHydro = - loc_mismatch;  //loc_mismatch<0
      return true;
    }
    else{
      this.storage.pumpHydro -=hydroDischargeMax;
      this.hourlymix.pumpHydro = + hydroDischargeMax;  //loc_mismatch<0
    }
  } // discharging branch

  return false;
}


// only charge H2

simulation.prototype.chargeH2Storage=function(it){
  let loc_mismatch=this.mismatch();

  if(loc_mismatch<0){ return false;} // nothing to do

  else {// power left for electrolysis

    var H2ChargeMax=Math.min((H2Energy-this.storage.H2)/H2eta, H2Charge);
  
    if(loc_mismatch<=H2ChargeMax){
      this.storage.H2 +=H2eta*loc_mismatch; 
      this.hourlymix.H2 = -loc_mismatch; // w/o roundturn eta
      return true;
    }
    else{
      this.storage.H2 +=H2eta*H2ChargeMax;
      this.hourlymix.H2 =- H2ChargeMax;
      return false;
    }
  }
} // chargeH2Storage


// change and discharge H2 storage

simulation.prototype.useH2Storage=function(it){
  let loc_mismatch=this.mismatch();
  if(loc_mismatch>=0){// power left for electrolysis

    var H2ChargeMax=Math.min((H2Energy-this.storage.H2)/H2eta, H2Charge);
    if(this.debug){
      console.log("sim.useH2Storage: it=",it,
		  " loc_mismatch=", loc_mismatch,
		  " H2Energy=",H2Energy,
		  " this.storage.H2=",this.storage.H2,
		  " H2Charge=",H2Charge,"  H2ChargeMax=", H2ChargeMax);
    }
    
    if(loc_mismatch<=H2ChargeMax){
      this.storage.H2 +=H2eta*loc_mismatch; 
      this.hourlymix.H2 = -loc_mismatch; // w/o roundturn eta
      return true;
    }
    else{
      this.storage.H2 +=H2eta*H2ChargeMax;
      this.hourlymix.H2 =- H2ChargeMax;
      return false;
    }
  }
  else{ // loc_mismatch<0

    loc_mismatch=this.mismatch();
    var H2DischargeMax=Math.min(this.storage.H2, H2Discharge);

    if(-loc_mismatch<=H2DischargeMax){
      this.storage.H2 +=loc_mismatch; // <0
      this.hourlymix.H2 = -loc_mismatch; // <0
      return true;
    }
    else{
      this.storage.H2   -= H2DischargeMax;
      this.hourlymix.H2  = + H2DischargeMax;
    }
  }
  return false;
}

simulation.prototype.importExport=function(it){
  let loc_mismatch=this.mismatch();
  let rel_mismatch=(loc_mismatch-mismatch_maxImport)
    /(mismatch_maxExport-mismatch_maxImport);
  let r=Math.max(-1., Math.min(1., -1+2*rel_mismatch));
  this.hourlymix.importHrly=-r*importPow;

  let success=(Math.abs(this.mismatch())<1e-6);
  return success;
}

 
simulation.prototype.init=function(strategy){

  this.strategy=strategy;

  this.storage={ // this.hourlymix in update since history independent
    "batt": 0.5*battEnergy,
    "pumpHydro": 0.5*hydroEnergy,
    "H2": 0.5*H2Energy
  };

}

simulation.prototype.powFact_wind=function(v,vc1,vc2,vc3){
  return ((v<vc1)||(v>vc3)) ? 0
    : (v<vc2) ? Math.pow(v/vc2,3) : 1;
}

// solar cell efficiency change factor by temperature,
// parameterised to year incl avg leap year
// optimal=nominal power in winter => factor (cos phi_year - 1)

simulation.prototype.factorSolar=function(it){
  var result=(1+solar_amplRel
	      *(Math.cos(2*Math.PI*(it%8766)/8766-year_dphi)-1));
  return result;
    //1+solar_amplRel*Math.cos(2*Math.PI*(it%8766)/8766-year_dphi);
}

// yearly pattern heat pump usage, only consider heating, no AC, 
// parameterised to year incl avg leap year

simulation.prototype.factorWP=function(it){
  return 0.5*(1+Math.cos(2*Math.PI*(it%8766)/8766-year_dphi));
}


simulation.prototype.supply=function(){
  return (this.hourlymix.solar
    + this.hourlymix.windOn
    + this.hourlymix.windOff
    + this.hourlymix.runningHydro
    + this.hourlymix.biomass
    + this.hourlymix.nuclear
    + this.hourlymix.coal
    + this.hourlymix.gas
    + this.hourlymix.importHrly
    + this.hourlymix.pumpHydro
    + this.hourlymix.batt
	  + this.hourlymix.H2);
}

simulation.prototype.load=function(){
  return this.hourlymix.load;
}

simulation.prototype.mismatch=function(){
  return this.supply()-this.load();
}

simulation.prototype.curtail=function(energyName,it){
  //console.log("this.rangesMax=",this.rangesMax);
  let loadBalanced=false;
  const loc_mismatch=this.mismatch();

  if(this.mismatch()>0){

    if(loc_mismatch>this.rangesMax[energyName]-this.rangesMin[energyName]){
      this.hourlyCurtailment[energyName]
	=this.rangesMax[energyName]-this.rangesMin[energyName];
      this.hourlymix[energyName]=this.rangesMin[energyName];
	loadBalanced=false;
    }
    else{
      this.hourlyCurtailment[energyName]=loc_mismatch;
      this.hourlymix[energyName] -= loc_mismatch;
      loadBalanced=true;
	
      if(Math.abs(this.mismatch())>1e-6){
	  console.log("sim.update -> sim.curtail, it=",it,
		      " exiting in (5) after curtailing ",energyName,
		      "this.mismatch()=",this.mismatch());
      }
    }
  }
  if(false){
    console.log("sim.curtail: energyName=",energyName," this.rangesMax[energyName]=", this.rangesMax[energyName]," loc_mismatch=",loc_mismatch)
  }

  return loadBalanced;
}

simulation.prototype.handleHellbrise=function(it){
  console.log("Hellbrise! Too little demand or too much supply",
	      " shut off baseload power");
  let shutoffFactor=this.mismatch()/this.supply();
  let stabreserveFactor=(pow_rotatingMass-minPow_rotatingMass)
      /pow_rotatingMass;
  if (shutoffFactor>stabreserveFactor){
    console.log("(6) Hellbrise! need to emergency shut off",
		" too little baseload rotating mass => blackout");
    return false; // alert Hellbrise
  }
  let reduceFact=1-shutoffFactor;
  this.hourlymix.gas *=reduceFact;
  this.hourlymix.coal *=reduceFact;
  this.hourlymix.nuclear *=reduceFact;
  this.hourlymix.runningHydro *=reduceFact;
  this.hourlymix.biomass *=reduceFact;
  console.log("sim.update: exiting in (6) after reducing minimum supply",
	      "this.mismatch()=",this.mismatch());
  return true;
}

simulation.prototype.handleDunkelflaute=function(it){
  if (this.mismatch()<-loadSheddingFactor*this.hourlymix.load){
    this.hourlymix.loadShedding=-this.mismatch();
    console.log("handleDunkelflaute: it=",it,
		" blackout due to load shedding > maximum factor ",
		loadSheddingFactor);
    this.displayResults(it);
    return false; // alert Dunkelflaute
  }
  this.hourlymix.loadShedding=-this.mismatch();  
  console.log("it=",it," imposed load shedding of ",-this.mismatch(),
		" GW to prevent blackout");
  return true;

}


simulation.prototype.add=function(energyName,it){
  let loadBalanced=false;
  const loc_mismatch=this.mismatch();
  const addMax=this.rangesMax[energyName]-this.hourlymix[energyName];
  
  if(loc_mismatch<-addMax){
    this.hourlymix[energyName]=this.rangesMax[energyName]; 
    this.hourlyCurtailment[energyName]=0;
  }
     
  else{
    this.hourlymix[energyName] -= loc_mismatch;
    this.hourlyCurtailment[energyName]=addMax+loc_mismatch;
    loadBalanced=true;
  }
  return loadBalanced;
}



/*###############################################################
 if r<1 (not added to max)
 preference energy1:energy2=lambda:1 weighted with potential A1,A2
 A1,A2=max addtl power sources 1,2 can deliver
 a1,a2=realized addtl power (<=A1,A2) is solution of the conditions 

 (I)  a1+a2=neededPow
 (II) a1/(A1-a1)=lambda*a2/(A2-a2) (lambda=odds ratio A1,A2)
 
#################################################################*/


simulation.prototype.addTwo=function(energyName1, energyName2, lambda, it){
  let loadBalanced=false;
  //console.log("this.rangesMax=",this.rangesMax);
  //console.log("this.hourlymix=",this.hourlymix);
  const neededPow=-this.mismatch();
  const A1=this.rangesMax[energyName1]-this.hourlymix[energyName1];
  const A2=this.rangesMax[energyName2]-this.hourlymix[energyName2];
  const r=neededPow/(A1+A2)
  if(r>=1){
    this.hourlymix[energyName1]=this.rangesMax[energyName1];
    this.hourlyCurtailment[energyName1]=0;
    this.hourlymix[energyName2]=this.rangesMax[energyName2];
    this.hourlyCurtailment[energyName2]=0; // loadBalanced remains false
  }
  else{
    const SMALL_VAL=1e-6;
    loadBalanced=true;
    let a1=0;
    let a2=0;
    
    if(A1<SMALL_VAL){a1=0; a2=neededPow;}
    
    else if(A2<SMALL_VAL){a2=0; a1=neededPow;}

    else if(Math.abs(lambda-1)<SMALL_VAL){
      a1=neededPow/(1+A2/A1);
      a2=neededPow-a1;
    }
    
    else{
      const p=0.5*(A2-neededPow+lambda*(A1+neededPow))/(1-lambda);
      const sqrt_term=Math.sqrt(p*p+lambda*neededPow*A1/(1-lambda));
      const a1_1=-p+sqrt_term;
      const a1_2=-p-sqrt_term;
      a1=((a1_1>=0)&&(a1_1<=neededPow)) ? a1_1 : a1_2;
      a2=neededPow-a1;
    }
    this.hourlymix[energyName1]+=a1;
    this.hourlymix[energyName2]+=a2;
    this.hourlyCurtailment[energyName1]=A1-a1;
    this.hourlyCurtailment[energyName2]=A2-a2;
    if(false){
	console.log("it=",it," lambda=",lambda.toFixed(1),
		    " a1=",a1.toFixed(1)," a2=",a2.toFixed(1),
		    " A1=",A1.toFixed(1)," A2=",A2.toFixed(1),
		    " neededPow=",neededPow.toFixed(1));
    }
    
    if((a1<0)||(a1>neededPow)){
      console.log("Error: addtl power a1 not in [0,",neededPow,"]");
    }
  }

  return loadBalanced;
}

simulation.prototype.displayResults=function(it){
  console.log(
    "it=",it,
    " W_load=",  this.hourlymix.load,
    " W_supply=",  this.supply(),
    " W_mismatch=",this.mismatch(),
    "\n W_nuclear=",  this.hourlymix.nuclear.toFixed(1),
    "\n W_nuclear_curtailment=",  this.hourlyCurtailment.nuclear.toFixed(1),
    "\n W_solar=",  this.hourlymix.solar.toFixed(1),
    "\n W_solar_curtailment=",  this.hourlyCurtailment.solar.toFixed(1),
    "\n W_windOn=",  this.hourlymix.windOn.toFixed(1),
    "\n W_windOn_curtailment=",  this.hourlyCurtailment.windOn.toFixed(1),
    "\n W_windOff=",  this.hourlymix.windOff.toFixed(1),
    "\n W_windOff_curtailment=",  this.hourlyCurtailment.windOff.toFixed(1),
    "\n W_import=",  Math.max(0,+this.hourlymix.importHrly).toFixed(1),
    "\n W_export=",  Math.max(0,-this.hourlymix.importHrly).toFixed(1),
    "\n W_gas=",  this.hourlymix.gas.toFixed(1),
    "\n W_gas_curtailment=",  this.hourlyCurtailment.gas.toFixed(1),
    "\n W_coal=",  this.hourlymix.coal.toFixed(1),
    "\n W_coal_curtailment=",  this.hourlyCurtailment.coal.toFixed(1),
    "\n W_hydro+W_biomass (fixed)=",(pow_runningHydro+pow_biomass).toFixed(1)
  );
}



// #################################################################
// central update depends on variable simulation.strategy
// 0=aktuell 1=Klimaschoner, 2=safety first, 3=Sparfuchs,  4=Gruen
// #################################################################

simulation.prototype.update=function(it){

  //this.debug=(it<10);
  if(this.debug){console.log("in sim.update: it=",it);}
  this.debug=false;
  
  this.rangesMax={
    nuclear: nuclear_av*pow0_Nuclear,
    solar: 0,
    windOn: 0,
    windOff: 0,
    gas: gas_av*pow0_Gas,
    coal: coal_av*pow0_Coal
  };

  this.rangesMin={
    nuclear: nuclear_minRelPow*nuclear_av*pow0_Nuclear,
    solar: 0,
    windOn: 0,
    windOff: 0,
    gas: gas_minRelPow*gas_av*pow0_Gas,
    coal: coal_minRelPow*coal_av*pow0_Coal
  };
  

  /*
  let minNuclear=nuclear_minRelPow*nuclear_av*pow0_Nuclear;
  let maxNuclear=nuclear_av*pow0_Nuclear;
  let minGas= gas_av*gas_minRelPow*pow0_Gas;
  let maxGas= gas_av*pow0_Gas;
  let minCoal= coal_av*coal_minRelPow*pow0_Coal;
  let maxCoal= coal_av*pow0_Coal;
  */
  
  // SMARD uses CET/CEST but no summertime jumps in data, just the strings
  
  let itSMARD=Math.max(0,it-1); 


  // initial fixed energy mix for all strategies (all powers in GW)
  // defines supplymin w/o import and storage supply
  
  this.hourlymix={
    "timeStr": winddata[it].time,
    "timeUTC_ms": winddata[it].timeUTC_ms,
    "load": 0.001*fLoad*supplydemanddata2025[itSMARD].load
      + (fBEV-fBEV0)*load100_BEV
      + (fWP-fWP0)*load100_WP*this.factorWP(it),  // load 2025 in GW
    "loadShedding": 0,
    "solar": 0, 
    "windOn": 0,
    "windOff": 0,
    "runningHydro": pow_runningHydro,
    "biomass": pow_biomass,
    "nuclear": this.rangesMin.nuclear,
    "coal": this.rangesMin.coal,
    "gas": this.rangesMin.gas,
    "importHrly": 0,
    "pumpHydro": 0, // >0 if energy from pump hydro
    "batt": 0,
    "H2": 0
  };

  this.hourlyCurtailment={ // in kWh  per hour
    "solar": 0,
    "windOn": 0,
    "windOff": 0,
    "nuclear": this.rangesMax.nuclear-this.rangesMin.nuclear,
    "coal": this.rangesMax.coal-this.rangesMin.coal,
    "gas": this.rangesMax.gas-this.rangesMin.gas
  }

  this.hourlySolarRegions={
    "region0":0,
    "region1":0,
    "region2":0,
    "region3":0,
    "region4":0,
    "region5":0
  };

  this.hourlyWindRegions={
    "region0":0,
    "region1":0,
    "region2":0,
    "region3":0,
    "region4":0,
    "region5":0
  };

 
  // for the inertia reserve, the nominal power is relevant
  
  var pow_rotatingMass=this.rangesMax.gas+this.rangesMax.coal+this.rangesMax.uclear
      +pow_biomass+pow_runningHydro;

  if(pow_rotatingMass<minPow_rotatingMass){
    console.log("warning: power configuration unstable!");
    console.log("  pow_rotatingMass=",pow_rotatingMass,
		" < minPow_rotatingMass=",minPow_rotatingMass,
		"\n  add gas, coal, or nuclear plants!");
    return false;
  }
  

  
   // max solar power obtained from six regions at time index it
  // NOTE: with key written as obj[key] instead of obj.key
  // key as variables possible!

  // get solar intensity array and correct -999 errors

  var intensity=[];
  for(var i=0; i<6; i++){
    let entry="I"+(i+1);
    intensity[i]=solardata[it][entry];
  }
  var validCount=0;
  var isValid=[];
  var avg=0;
  for(var i=0; i<6; i++){
    isValid[i]=(intensity[i]>=0);
    if(isValid[i]){
      avg+=intensity[i];
      validCount++;
    }
    else{
      //console.log("time=",solardata[it].time,
//		  " no valid solar data for region ",i," using valid avg");
    }
  }

  if (validCount>0){
    avg/=validCount;
    for(var i=0; i<6; i++){
      if(!isValid[i]){intensity[i]=avg;}
    }
  }

  else{
    console.log("error! time=",solardata[it].time,
		" not a single of the six regions has valid solar data!");
    console.log("setting some guess");
    //!! no UTC shift, no beginning != midnight possible, no yearly season
    var daytime=it%24;
    for(var i=0; i<6; i++){
      intensity[i]=Math.max(0, -300*Math.cos(2*Math.PI*daytime/24));
    }
  }
 
  
  var maxSolar=0;
  //console.log("solardata[it]=",solardata[it]);
  for(var i=0; i<6; i++){
    let regionalContrib=pow0_PV* frac_solar[i]
	*intensity[i]/solar_Iref*this.factorSolar(it)*solar_av;
    this.hourlySolarRegions["region"+i]=regionalContrib;
    maxSolar+=regionalContrib;
    this.rangesMax.solar+=regionalContrib;
  }


  // max onshore and offshore wind power
  // obtained from 4(2) regions at time index it
  // since nonlinear curve, add separately, do not average
  
  var maxWindOn=0;
  for(var i=0; i<4; i++){
    let entry="w100_"+(i+1);
    let v=winddata[it][entry]*fWind_onshore;
    let regionalContrib=pow0_WindOn * frac_onshore[i]
      * this.powFact_wind(v,vc1_onshore, vc2_onshore, vc3_onshore)*windOn_av;
    this.hourlyWindRegions["region"+i]=regionalContrib;
    maxWindOn += regionalContrib;
    this.rangesMax.windOn+=regionalContrib;
  }


  var maxWindOff=0;
  for(var i=0; i<2; i++){
    let entry="w100_"+(i+5);
    let v=winddata[it][entry]*fWind_offshore;
    let regionalContrib=pow0_WindOff * frac_offshore[i]
	* this.powFact_wind(v,vc1_offshore, vc2_offshore, vc3_offshore)
	* windOff_av;
    this.hourlyWindRegions["region"+(i+4)]=regionalContrib;
    maxWindOff += regionalContrib;
    this.rangesMax.windOff+=regionalContrib;
  }

  //console.log("pow0_WindOff=",pow0_WindOff," maxWindOff=",maxWindOff);
  let supplymin=this.supply(); // init. with min supply w/o import,storage


  /* ###########################################################
  Strategy 0: "2025"

   Strategy 1: maximum climate friendly "Klimaschoner"
  (1) add max sun, wind, and nuclear to maximum
  (2) charge/discharge batteries and pump hydro => exit 1
  (3) if mismatch>0 charge H2 => exit 2
  (4) add import/export => exit 3
  (5) if mismatch>0 curtail wind->sun->nuclear => exit4
  (6) if still mismatch>0 emergency cutoff biomass, runningHydro, 
      minimum nuclear power; 
      if then movingMass<min => exit "blackout Hellbrise"
  (7) if mismatch<0 add gas, discharge H2, add coal => exit 6
  (8) if still mismatch<0 curtail load => exit 7
  (9) if load<0.7 normal load => exit "blackout Dunkelflaute"

  Strategy 2: Safety first (many H2)
  (1) add all possible supply incl import, excluding storage
  (2) add/subtract all storage => exit 1
  (3) if mismatch<0 => Strategy 0, point 8
  (4) if mismatch>0 subtract gas, coal, import, wind, sun, nuclear
      (storage does not apply since no discharge possible if at 4) => exit 3 
  (5) if still mismatch => Strategy 0, point 6

  Strategy 3: "Sparschwein"

  As strategy 0 but H2 storage on equal footing as batteries, hydro 
  (of course, no H2 should be built then), buying/selling depends on price

  Strategy 4: "Green"
  curtail nuclear first, discharge H2 before adding gas


   #################################################################*/

  //if(it==0){console.log("\n\nrunSimulation: this.strategy=",this.strategy);}
  if(this.strategy>=4){
    console.log("error: strategy ",this.strategy," not yet implemented");
    return false;
  }
  
  if(this.strategy==0){ //"2025"

    // (1) add max sun, wind, and nuclear to max
    // (default curtailment=0 for solar,windOn,windOff)
    
    this.hourlymix.nuclear=this.rangesMax.nuclear;
    this.hourlyCurtailment.nuclear=0;
    this.hourlymix.solar=this.rangesMax.solar; 
    this.hourlymix.windOn=this.rangesMax.windOn;
    this.hourlymix.windOff=this.rangesMax.windOff;

    if(false){
    //if(this.debug){
      console.log("it=",it," strategy 0 after (1): this.mismatch()=",
		  this.mismatch()," this.load()=",this.load());
    }
 
    // (2) import/export (updates this.hourlymix.importHrly)

    if(this.importExport(it)){return true;}


    // (3) charge/discharge storages (updates this.storage, this.hourlymix)
    
    if(this.useHydroBattStorage(it)){return true;} // changes this.storage
    if(this.useH2Storage(it)){return true;} // changes this.storage
        

    // Strategy 2025, (4-5): Path if still too much supply
 
    
    // (4) curtail supply power windOff, windOn, solar, nuclear  

    if(this.curtail("windOff",it)){return true;}
    if(this.curtail("windOn",it)){return true;}
    if(this.curtail("solar",it)){return true;}
    if(this.curtail("nuclear",it)){return true;}

    
    // (5) emergency "Hellbrise" //!!! proper handling still missing

    if(this.mismatch()>0){
      return this.handleHellbrise(it);
    }


    // Strategy 2025: path for too little supply
    // !!! this.handleDunkelflaute(it) not yet properly implemeted;
 
    if(this.mismatch()>0){
      console.log("it=",it," error: mismatch ",this.mismatch(),
		  " should be <0 at this point!");
    }
  
    if(this.addTwo("gas","coal",0.8,it)){return true;}
    
    return this.handleDunkelflaute(it);
    
  } // strategy 0: 2025

  //#####################################################
  if(this.strategy==1){// climate friendly / Klimaschoner
  //#####################################################

    // (1) add max sun, wind, and nuclear to max

    this.hourlymix.nuclear=this.rangesMax.nuclear;
    this.hourlyCurtailment.nuclear=0;
    this.hourlymix.solar=this.rangesMax.solar;
    this.hourlymix.windOn=this.rangesMax.windOn;
    this.hourlymix.windOff=this.rangesMax.windOff;

    // (2) charge/discharge storages (updates this.storage, this.hourlymix)
    
    if(this.useHydroBattStorage(it)){return true;} // changes this.storage
    if(this.useH2Storage(it)){return true;} // changes this.storage

    // (3) import/export (updates this.hourlymix.importHrly)

    if(this.importExport(it)){return true;}


    // (4-5) high supply branch as in Strategy 2025

    if(this.curtail("windOff",it)){return true;}
    if(this.curtail("windOn",it)){return true;}
    if(this.curtail("solar",it)){return true;}
    if(this.curtail("nuclear",it)){return true;}
    if(this.mismatch()>0){return this.handleHellbrise(it);}

    // (6-7) low supply branch start adding gas first
    
    if(this.add("gas",it)){return true;}
    if(this.add("coal",it)){return true;}
    return this.handleDunkelflaute(it);
  }

  
  if(this.strategy==2){// safety first

    // (1) add everything to max

    this.hourlymix.nuclear=this.rangesMax.nuclear;
    this.hourlyCurtailment.nuclear=0;
    this.hourlymix.solar=this.rangesMax.solar;
    this.hourlymix.windOn=this.rangesMax.windOn;
    this.hourlymix.windOff=this.rangesMax.windOff;
    this.hourlymix.gas=this.rangesMax.gas;
    this.hourlyCurtailment.gas=0;
    this.hourlymix.coal=this.rangesMax.coal;
    this.hourlyCurtailment.coal=0;


    // (2) only charge but do not discharge storages
    
    if(this.chargeHydroBattStorage(it)){return true;}
    if(this.chargeH2Storage(it)){return true;} // changes this.storage

    // (3) import/export (previous to last chance to get energy into system;
    // only exports if still supply surplus after charging everything

    if(this.importExport(it)){return true;}

    // (4) get energy from storage: last chance to match demand in
    //     case of a low-supply situation

    if(this.mismatch()<0){
      if(this.useHydroBattStorage(it)){return true;}
      if(this.useH2Storage(it)){return true;}
    }

    // (5) Dunkelflaute

    if(this.mismatch()<0){return this.handleDunkelflaute(it);}

    // (6) High-supply path; successively reduce energy sources to minimum
    //     keeping as climate-friendly as possible (coal first)
    //     (this.mismatch()>=0 at this point)

    if(this.curtail("coal",it)){return true;}
    if(this.curtail("gas",it)){return true;}
    if(this.curtail("windOff",it)){return true;}
    if(this.curtail("windOn",it)){return true;}
    if(this.curtail("solar",it)){return true;}
    if(this.curtail("nuclear",it)){return true;}

    // (7) high-supply emergency
 
    return this.handleHellbrise(it);
  }

  if(this.strategy==3){ //"Gruen" (!= Klimaschoner!)

    // (1) add only renewables to max

    this.hourlymix.solar=this.rangesMax.solar;
    this.hourlymix.windOn=this.rangesMax.windOn;
    this.hourlymix.windOff=this.rangesMax.windOff;

    // (2-3) import/export and charge/discharge as in "2025"

    if(this.importExport(it)){return true;}
    if(this.useHydroBattStorage(it)){return true;}
    if(this.useH2Storage(it)){return true;}

    // (3-4) high-supply branch as in "2025"

    if(this.curtail("windOff",it)){return true;}
    if(this.curtail("windOn",it)){return true;}
    if(this.curtail("solar",it)){return true;}
    if(this.mismatch()>0){ return this.handleHellbrise(it);}

    // (5-6) low-supply branch: nuclear is added last

    if(this.add("gas",it)){return true;}
    if(this.add("coal",it)){return true;}
    if(this.add("nuclear",it)){return true;}
    return this.handleDunkelflaute(it);
  }

    

}

function displayHourlyResults(sim,it){
  console.log(
    " W_load=",  energymix[it].load,
    " W_supply=",  sim.supply(),
    "\n W_nuclear=",  energymix[it].nuclear,
    "\n W_nuclear_curtailment=",  curtailment[it].nuclear,
    "\n W_solar=",  energymix[it].solar,
    "\n W_solar_curtailment=",  curtailment[it].solar,
    "\n W_windOn=",  energymix[it].windOn,
    "\n W_windOn_curtailment=",  curtailment[it].windOn,
    "\n W_windOff=",  energymix[it].windOff,
    "\n W_windOff_curtailment=",  curtailment[it].windOff,
    "\n W_import=",  Math.max(0,+energymix[it].importHrly),
    "\n W_export=",  Math.max(0,-energymix[it].importHrly),
    "\n W_gas=",  energymix[it].gas,
    "\n W_gas_curtailment=",  curtailment[it].gas,
    "\n W_coal=",  energymix[it].coal,
    "\n W_coal_curtailment=",  curtailment[it].coal
  );
}

//

function displayResultsMain(){

  let nt=energymix.length;
  let W_solar=0; let W_solar_data=0; let W_solar_curtailment=0;
  let W_windOn=0; let W_windOn_data=0; let W_windOn_curtailment=0;
  let W_windOff=0; let W_windOff_data=0; let W_windOff_curtailment=0;
  let W_gas=0; let W_gas_data=0; let W_gas_curtailment=0;
  let W_coal=0; let W_coal_data=0; let W_coal_curtailment=0;
  let W_nuclear=0; let W_nuclear_curtailment=0;
  let W_import=0; let W_import_data=0;
  let W_export=0; let W_export_data=0;
  let W_load=0;

  
  let W_biomass=8760*pow_biomass;
  let W_runningHydro=8760*pow_runningHydro;
  
  for (let it=0; it<nt; it++){
    let itSMARD=Math.max(0,it-1);
    W_load += energymix[it].load;
    W_nuclear += energymix[it].nuclear;
    W_nuclear_curtailment += curtailment[it].nuclear;
    W_solar += energymix[it].solar;
    W_solar_curtailment += curtailment[it].solar;
    W_solar_data += 0.001*supplydemanddata2025[itSMARD].PV;
    W_windOn += energymix[it].windOn;
    W_windOn_curtailment += curtailment[it].windOn;
    W_windOn_data += 0.001*supplydemanddata2025[itSMARD].w_on;
    W_windOff += energymix[it].windOff;
    W_windOff_curtailment += curtailment[it].windOff;
    W_windOff_data += 0.001*supplydemanddata2025[itSMARD].w_off;
    W_import += Math.max(0,+energymix[it].importHrly);
    W_export += Math.max(0,-energymix[it].importHrly);
    //if(isNaN(W_import)){console.log("it=",it," error! W_import is NaN!");}
    W_import_data += Math.max(0,-0.001*supplydemanddata2025[itSMARD].export);
    W_export_data += Math.max(0,+0.001*supplydemanddata2025[itSMARD].export);
    W_gas += energymix[it].gas;
    W_gas_curtailment += curtailment[it].gas;
    W_gas_data += 0.001*supplydemanddata2025[itSMARD].gas;
    W_coal += energymix[it].coal;
    W_coal_curtailment += curtailment[it].coal;
//    if(isNaN(W_coal)){console.log("it=",it," W_coal is NaN!");}
    W_coal_data +=
      0.001*(supplydemanddata2025[itSMARD].bk
	     +supplydemanddata2025[itSMARD].sk);

    

  }

  let W_total= W_nuclear+W_solar+W_windOn+W_windOff+W_gas+W_coal
      +W_biomass+W_runningHydro;

  let W_CO2=W_gas+W_coal;

  let W_green=W_CO2-W_total;

  
  // availabilities ("capacity factor" OK, "Kapazitaetsfaktor" OK)
  
  let solar_av=W_solar/(nt*pow0_PV);
  let solar_av_data=W_solar_data/(nt*pow0_PV);
  let windOn_av=W_windOn/(nt*pow0_WindOn);
  let windOn_av_data=W_windOn_data/(nt*pow0_WindOn);
  let windOff_av=W_windOff/(nt*pow0_WindOff);
  let windOff_av_data=W_windOff_data/(nt*pow0_WindOff);
  let nuclear_av=(pow0_Nuclear>0) ? W_nuclear/(nt*pow0_Nuclear) : 0;

  // curtailment (in % of max availability)

  let solar_fracCurtail=W_solar_curtailment/(W_solar+W_solar_curtailment);
  let windOn_fracCurtail=W_windOn_curtailment/(W_windOn+W_windOn_curtailment);
  let windOff_fracCurtail
      =W_windOff_curtailment/(W_windOff+W_windOff_curtailment);
  let nuclear_fracCurtail
      =(pow0_Nuclear>0)
      ? W_nuclear_curtailment/(W_nuclear+W_nuclear_curtailment) : 0;
  let gas_fracCurtail=W_gas_curtailment/(W_gas+W_gas_curtailment);
  let coal_fracCurtail=W_coal_curtailment/(W_coal+W_coal_curtailment);

  // import/export balance (max import importPow0=max export)

  let import_fracMax=(importPow0>0) ? W_import/(nt*importPow0) : 0;
  let export_fracMax=(importPow0>0) ? W_export/(nt*importPow0) : 0;

  
  // emission factors w/o additional emissions of H2 technology

  let emissionCO2=e_nuclear*W_nuclear+e_solar*W_solar
      + e_biomass*W_biomass+e_runningHydro*W_runningHydro
      + e_windOn*W_windOn+e_windOff*W_windOff
      + e_gas*W_gas+e_coal*W_coal;
  
  let emissionFactor=emissionCO2/W_total;

  if(false){
    console.log("Energies from ",nt," days since 2025-01-01");
    console.log("W_solar=",W_solar," W_solar_data=",W_solar_data);
    console.log("  W_solar_curtailment=",W_solar_curtailment);
    console.log("W_windOn=",W_windOn," W_windOn_data=",W_windOn_data);
    console.log("  W_windOn_curtailment=",W_windOn_curtailment);
  }
  if(false){
  console.log("W_windOff=",W_windOff," W_windOff_data=",W_windOff_data);
  console.log("W_import=",W_import," W_import_data=",W_import_data);
  console.log("W_export=",W_export," W_export_data=",W_export_data);
  console.log("W_gas=",W_gas," W_gas_data=",W_gas_data);
  console.log("W_coal=",W_coal," W_coal_data=",W_coal_data);
  console.log("W_biomass=",W_biomass);
  console.log("W_runningHydro=",W_runningHydro);
  console.log("total w/o import/export:",W_total);
  console.log("total with import-export:",W_total+W_import-W_export,
	      " W_load (demand+losses+internal)=",W_load);
  }

  const box = document.getElementById("generalInfo");
  //console.log("box=",box);
  //const fontsize=(Math.round(2.5*vmin)).toString();
  let html = '<table class="infoTable"><tr> <th>C-Faktor</th> <th>Curtail</th>\n';
  html += '<tr>\n'
  html += '<td class="important"> Solar: '+(100*solar_av).toFixed(1)+'%</td>'
  html += '<td>'+(100*solar_fracCurtail).toFixed(1)+'%</td>'
  html += '\n</tr>\n<tr>'
  html += '<td> WindOn: '+(100*windOn_av).toFixed(1)+'%</td>'
  html += '<td>'+(100*windOn_fracCurtail).toFixed(1)+'% </td>'
  html += '\n</tr>\n<tr>'
  html += '<td> WindOff: '+(100*windOff_av).toFixed(1)+'%</td>'
  html += '<td>'+(100*windOff_fracCurtail).toFixed(1)+'% </td>'
  html += '\n</tr>\n<tr>'
  html += '<td> Nuclear: '+(100*nuclear_av).toFixed(1)+'%</td>'
  html += '<td>'+(100*nuclear_fracCurtail).toFixed(1)+'% </td>'
  html += '\n</tr>\n</table></span>'
  box.innerHTML=html;


  const boxImportExport = document.getElementById("infoImportExport");
  //console.log("box=",box);
  //const fontsize=(Math.round(2.5*vmin)).toString();
  html = '<table class="infoTable"><tr> <th>Flow</th> <th>%Max</th></th>\n';
  html += '<tr>\n'
  html += '<td> Import: '+(0.001*W_import).toFixed(1)+' TWh</td>'
  html += '<td>'+(100*import_fracMax).toFixed(1)+'</td>'
  html += '\n</tr>\n<tr>'
  html += '<td> Export: '+(0.001*W_export).toFixed(1)+' TWh</td>'
  html += '<td>'+(100*export_fracMax).toFixed(1)+'</td>'
  html += '\n</tr>\n</table></span>'
  boxImportExport.innerHTML=html;

  const boxCO2 = document.getElementById("CO2Info");
  //console.log("boxCO2=",boxCO2);
  html="";
  html +=emissionFactor.toFixed(0)+' [g/kWh]';
  boxCO2.innerHTML=html;
  //console.log("boxCO2.innerHTML=",boxCO2.innerHTML);

  if(false){
    console.log("\nAvailabiities:",
	      "\n solar_av=",solar_av," solar_av_data=",solar_av_data,
	      "\n windOn_av=",windOn_av," windOn_av_data=",windOn_av_data,
		"\n windOff_av=",windOff_av," windOff_av_data=",windOff_av_data);
  }

  if(false){console.log("\nCO2:",
	      "\n Total CO2 emissions [Mio t]: ",
	      (1e-6*emissionCO2).toFixed(0),
	      "\n Carbon footprint [g/kWh]:",emissionFactor.toFixed(0));
	   }

} // displayResultsmain


function displayResultsRegions(){
  let W_solarRegions=[0,0,0,0,0,0];
  let W_windRegions=[0,0,0,0,0,0];

  for (let it=0; it<nt; it++){
    for(let i=0; i<6; i++){
      W_solarRegions[i] +=solarRegions[it]["region"+i];
      W_windRegions[i] +=windRegions[it]["region"+i];
    }
  }

  console.log("Regional sun availabiities (0=M 1=S 2=NW 3=NE 4=SW 5=SE)");
  for(let i=0; i<6; i++){
    let av=W_solarRegions[i]/(nt*pow0_PV*frac_solar[i]);
    console.log("solar availability region",i,": ",av);
  }

  console.log("Regional wind availabiities 0=M 1=S 2=NW 3=NE 4=offN 5=offE");
  for(let i=0; i<4; i++){
    let av=W_windRegions[i]/(nt*pow0_WindOn*frac_onshore[i]);
    console.log("onshore wind availability region",i,": ",av);
  }
  for(let i=0; i<2; i++){
    let av=W_windRegions[i+4]/(nt*pow0_WindOff*frac_offshore[i]);
    console.log("offshore wind availability region",i+4,": ",av);
  }
}

function displayResultsStorage(){
  console.log("to do");
}

// ##############################################################
// top-level simulation
// ##############################################################


function runSimulation(strategy){
  //console.log("in runSimulation: strategy=",strategy);
  energymix=[]; storage=[]; solarRegions=[]; windRegions=[];
  curtailment=[];

  var sim=new simulation(1);

  var noBreakdown=true;
  sim.init(strategy); // set up storage to half full

  //console.log("=================================================\n");
  for(let it=0; (it<nt)&& noBreakdown; it++){
    noBreakdown=sim.update(it);
  
    energymix[it]=sim.hourlymix;
    storage[it]=sim.cloneStorageWithTime(it);
    solarRegions[it]=sim.hourlySolarRegions;
    windRegions[it]=sim.hourlyWindRegions;
    curtailment[it]=sim.hourlyCurtailment;
    if(false){
      console.log("it=",it," energymix[it]=",energymix[it],
		  " storage[it]=",storage[it]);
    }
  }

  itmax=energymix.length-1; //!!
  
  if(!noBreakdown){
    console.log("itmax=",itmax);
    console.log("Warning! Electricity system broke down during simulation"+
		"at time "+energymix[itmax].timeStr);
    //displayHourlyResults(sim,itmax);
  }
}

function updateCharts(){
  updateChartsDaily();
  updateChartsClipped();
}

function updateChartsDaily(){
  updateChartEnergymix(allCharts[0], canvasIDs[0], energymixDaily);
  //console.log("updateChartsDaily(): energymixDaily[0]=",energymixDaily[0]);
  updateChartStorage(allCharts[2], canvasIDs[2], storageDaily);
}

function updateChartsClipped(){
  updateChartEnergymix(allCharts[1], canvasIDs[1], energymixClipped); 
  updateChartStorage(allCharts[3], canvasIDs[3], storageClipped);
}

function updateChartEnergymix(chart, canvasID, inputData){
  //console.log("chart=",chart);
  //console.log("updateChartEnergymix: inputData=",inputData);
  chart.data.datasets=buildDatasetsEnergymix(inputData);
  chart.update('none');  // speedup w/respect to update() if no new structure
  setupClick(canvasID, inputData); // otherwise box outdated

}

// storage: other chart structure

function updateChartStorage(chart, canvasID, inputData){ 
  //console.log("chart=",chart);
  chart.data.datasets=buildDatasetsStorage(inputData);
  chart.update('none'); // suggestion by ChatGPT
  setupClick(canvasID, inputData); // otherwise box outdated
}

function updateSimulation(strategy,itminClipped,itmaxClipped){
  console.log("\n\n\nbefore updateSimulation, strategy=",strategy);

  // storageDaily=[]; // not needed
  //energymixDaily=[];

  runSimulation(strategy);
  calcChartInput(itminClipped, itmaxClipped); // fills the *Daily and *Clipped variables
  updateCharts();
  displayText();
 
  //console.log("allCharts[1].scales.x.max=",allCharts[1].scales.x.max);
  //console.log("after redoSimulation(): energymixDaily=",energymixDaily);
  //console.log("after redoSimulation(): energymixClipped=",energymixClipped);
}

function calcClippedTimeseries(itminClipped,itmaxClipped){
  let energymixClipped=[];
  let storageClipped=[];
  for(let it=Math.max(itminClipped,0); it<=Math.min(itmaxClipped,energymix.length-1); it++){
    energymixClipped.push(energymix[it]);
    storageClipped.push(storage[it]);
  }
     
  return [energymixClipped, storageClipped];
}

		
function calcDailyTimeseries(){
  let energymixDaily=[];
  let storageDaily=[];
  let nt=energymix.length;
  if(storage.length !=nt){
    console.log("error: storage.length ",storage.length,
		" should be equal to nt=",nt);
    return [energymixDaily, storageDaily];
  }

  let keysMix=["load", "nuclear", "solar", "windOn", "windOff", "importHrly","batt", "runningHydro", "pumpHydro", "H2", "biomass", "gas", "coal"];

  let keysStorage=["batt", "pumpHydro", "H2"];
  
  for(let iday=0; iday<Math.floor(nt/24); iday++){

    // js cannot "extend" objects simultaneously over 2 levels
    energymixDaily[iday]={};
    storageDaily[iday]={};
    

    for(let ikey=0; ikey<keysMix.length; ikey++){ // for..in does not work!
      let key=keysMix[ikey];
      energymixDaily[iday][key]=0;
    }
    for(let ikey=0; ikey<keysStorage.length; ikey++){ 
      let key=keysStorage[ikey];
      storageDaily[iday][key]=0;
    }
    
    energymixDaily[iday].timeUTC_ms=energymix[24*iday].timeUTC_ms;
    storageDaily[iday].timeUTC_ms=energymix[24*iday].timeUTC_ms;
    //console.log("iday=",iday," energymixDaily[iday]=",energymixDaily[iday]);
    //console.log("iday=",iday," energymix[24*iday]=",energymix[24*iday]);
    
    for(let ihour=0; ihour<23; ihour++){
      let it=24*iday+ihour;
      if(it>=nt){
	console.log("error: nt=",nt," ihour=",ihour," it>=nt");}
      for(let ikey=0; ikey<keysMix.length; ikey++){
	let key=keysMix[ikey];
	energymixDaily[iday][key]+=energymix[it][key]/24;
      }
      for(let ikey=0; ikey<keysStorage.length; ikey++){
	let key=keysStorage[ikey];
	storageDaily[iday][key]+=storage[it][key]/24;
      }
    }


    //console.log("iday=",iday," energymixDaily[iday]=",energymixDaily[iday]);
    //console.log("iday=",iday," storageDaily[iday]=",storageDaily[iday]);

  }
  return [energymixDaily, storageDaily];
}

function calcChartInput(itminClipped,itmaxClipped){
  let dailyAvg=calcDailyTimeseries();
  let clippedData=calcClippedTimeseries(itminClipped,itmaxClipped);
  energymixDaily=dailyAvg[0];
  storageDaily=dailyAvg[1];
  energymixClipped=clippedData[0];
  storageClipped=clippedData[1];
  //console.log("energymixDaily=",energymixDaily);
  //console.log("storageDaily=",storageDaily);
}




function displayText(){
  //console.log("\n");
 // displayResultsRegions();
 // console.log("\n\n");

  displayResultsMain();
  //console.log("\n");

  //displayResultsStorage();
  //console.log("\n");
  
}

  



// loads now clipped data and redraws lower charts
// works standalone because itminClipped,itmaxClipped
// and energymix[] and storage[] used in calcClippedTimeseries
// global variables

function updateRangeClipped(itminClipped,itmaxClipped){
  let clippedData=calcClippedTimeseries(itminClipped,itmaxClipped);
  energymixClipped=clippedData[0];
  storageClipped=clippedData[1];
  updateChartsClipped();
}
 


// #################################################################
// Main sim and graphics initialisation directly after loading
// #################################################################



let energymix=[]; // array of objects; fill with energymix.push(hourlymix)
let storage=[]; // array of objects; fill with hourly_state
let solarRegions=[];
let windRegions=[];

let energymixDaily=[];
let storageDaily=[];
let energymixClipped=[];
let storageClipped=[];
let curtailment=[];

runSimulation(strategyIndex); // fills energymix, storage, solar/windRegions
//console.log("storage=",storage);

calcChartInput(itminClipped, itmaxClipped); // fills the *Daily and *Clipped variables
displayText();

// initChart(isEnergymix, isDaily, inputData) fills allCharts[0] ... [3]
// assign allCharts[i] with respective return does not work

initChart(true, true, energymixDaily); // initializes allCharts[0]
initChart(true, false, energymixClipped); // initializes allCharts[1]

initChart(false, true, storageDaily); // initializes allCharts[2]
initChart(false, false, storageClipped); // initializes allCharts[3]
//updateZoom(Chart.getChart(canvasIDs[0]), Chart.getChart(canvasIDs[1]),
//	   energymixDaily, false);

//console.log("allCharts[0]=",allCharts[0],"allCharts[1]=",allCharts[1]," energymixDaily=",energymixDaily);

initZoom(allCharts[0], allCharts[1], energymixDaily, itminClipped, itmaxClipped);


