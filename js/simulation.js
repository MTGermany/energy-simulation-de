
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




let energymix=[]; // array of objects; fill with energymix.push(hourlymix)
let storage=[]; // array of objects; fill with hourly_state
let solarRegions=[];
let windRegions=[];

function simulation(strategy){

  // use also global constants defined in gui.js
  // (needed there for the % info)

  this.strategy=strategy; 

  this.hourlymix={}; // create new object => no cloning needed!
  this.hourlysolarRegions={}; // create new object => no cloning needed!
  this.windRegions={}; // create new object => no cloning needed!

  this.storage={ // energy in GWh
    "batt": 0.5*battEnergy0,
    "pumpHydro": 0.5*hydroEnergy0,
    "H2": 0.5*H2Energy0
  };
}

//!!! need clone for copying it to outer storage[]

simulation.prototype.cloneStorage=function(){ 
  
  var obj={
    "batt": this.storage.batt,
    "pumpHydro": this.storage.pumpHydro,
    "H2": this.storage.H2
  };

  return obj;
}



// since H2 charged/discharged at other times depending on strategy,
// two separate load management functions
// each returns [matched=true or false, updated mismatch]

// Note 1: since energy in [GWh] and powere in [GW] and update time 1h,
// can have power and energy in one expression

// Note 2: The roundtrip efficiency eta is applied completely in the
// charging phase

simulation.prototype.useHydroBattStorage=function(){
  let loc_mismatch=this.mismatch();

  if(loc_mismatch>=0){// power left to load batteries and pumped hydro

    var battChargeMax=Math.min((battEnergy0-this.storage.batt)/battEta,
			       battCharge0);
    var hydroChargeMax=Math.min(
      (hydroEnergy0-this.storage.pumpHydro)/hydroEta,
      hydroCharge0);

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

 
simulation.prototype.useH2Storage=function(mismatch){
  let loc_mismatch=this.mismatch();
  if(loc_mismatch>=0){// power left for electrolysis

    var H2ChargeMax=Math.min((H2Energy0-this.storage.H2)/H2eta, H2Charge0);

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
    var H2DischargeMax=Math.min(this.storage.H2, H2Discharge0);

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
  this.hourlymix.importHrly=-r*importPow0;

  let success=(Math.abs(this.mismatch())<1e-6);
  return success;
}

 
simulation.prototype.init=function(){


  this.storage={ // this.hourlymix in update since history independent
    "batt": 0.5*battEnergy,
    "pumpHydro": 0.5*hydroEnergy,
    "H2": 0.5*H2Energy
  };

  console.log("in simulation.init:",
	      " this.storage=",this.storage);
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



// #################################################################
// central update
// strategy: 0=Klimaschoner, 1=Sparfuchs, 2=safety first, 3=Gruen
// #################################################################

simulation.prototype.update=function(it){

  let minNuclear=nuclear_minRelPow*nuclear_av*pow0_Nuclear;
  let maxNuclear=nuclear_av*pow0_Nuclear;
  let minGas= gas_av*gas_minRelPow*pow0_Gas;
  let maxGas= gas_av*pow0_Gas;
  let minCoal= coal_av*coal_minRelPow*pow0_Coal;
  let maxCoal= coal_av*pow0_Coal;

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
    "nuclear": minNuclear,
    "coal": minCoal,
    "gas": minGas,
    "importHrly": 0,
    "pumpHydro": 0, // >0 if energy from pump hydro
    "batt": 0,
    "H2": 0
  };

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
  
  var pow_rotatingMass=maxGas+maxCoal+maxNuclear+pow_biomass+pow_runningHydro;

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
  }

  //console.log("pow0_WindOff=",pow0_WindOff," maxWindOff=",maxWindOff);
  var supplymin=this.supply(); // init. with min supply w/o import,storage


  /* ###########################################################
  Strategy 0: "2025"

  smoothed trategy 1

   Strategy 1: maximum climate friendly
  (1) add max sun, wind, and nuclear to minimum supply
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

  if(this.strategy!=1){
    console.log("error: strategy ",this.strategy," not yet implemented");
    return false;
  }
  
  if(this.strategy==1){ //"Klimaschoner"

    // (1) add max sun, wind, and nuclear to preexisting minimum supply

    this.hourlymix.nuclear=maxNuclear;
    this.hourlymix.solar=maxSolar;
    this.hourlymix.windOn=maxWindOn;
    this.hourlymix.windOff=maxWindOff;
    //console.log("(1): mismatch=",this.mismatch());


    // (2) import/export

    result=this.importExport(it); // updates this.hourlymix.importHrly
    if(result){
      if(Math.abs(this.mismatch())>1e-6){
	console.log("sim.update, it=",it,
		    " sim.update: exiting in (4) after import/export",
		    "this.mismatch()=",this.mismatch());
      }
      return true;
    }
    //console.log("(2): mismatch=",this.mismatch());

    // (3) charge/discharge batteries and pump hydro
    // changes this.storage and this.hourlymix
    
    var result=this.useHydroBattStorage(); // changes this.storage
    
    if(result){
      if(Math.abs(this.mismatch())>1e-6){
	console.log("sim.update, it=",it,
		    " exiting in (2) after batteries/pumphydro",
		    " this.mismatch()=",this.mismatch() );
      }
      return true;
    }
    
    //console.log("(3): mismatch=",this.mismatch());

    // (4) charge/discharge  H2

    //if(this.mismatch()>0){ // if charge but do not discharge
    if(true){
      result=this.useH2Storage(); // changes this.storage
      if(result){
        if(Math.abs(this.mismatch())>1e-6){
	  console.log("sim.update, it=",it,
		      " exiting in (3) after charging H2 system",
		      "this.mismatch()=",this.mismatch());
	}
        return true;
      }
    }
    //console.log("(4): mismatch=",this.mismatch());




    // ############################################################
    // (5) -(6) path if still too much energy
    // ############################################################

    
    // (5) curtail supply power windOff, windOn, solar, nuclear

    /*
    // windOff and windOn simultaneously
    
    if(this.mismatch()>0){
      if(this.mismatch()>maxWindOn+maxWindOff){
        this.hourlymix.windOn=0;
        this.hourlymix.windOff=0;
      }
      else{
        let fracWind=1-this.mismatch()/(maxWindOn+maxWindOff);
        this.hourlymix.windOn=fracWind*maxWindOn;
        this.hourlymix.windOff=fracWind*maxWindOff;
	if(Math.abs(this.mismatch())>1e-6){
	  console.log("sim.update, it=",it,
		      " exiting in (5) after curtailing wind",
		      "this.mismatch()=",this.mismatch());
	}
        //console.log("fracWind=",fracWind," this.hourlymix.windOff=",this.hourlymix.windOff);
        return true;
      }
    }
    */

    // curtail windOff due to lacking demand (grid bottlenecks at maxWindOff)
    
    if(this.mismatch()>0){
   
      if(this.mismatch()>maxWindOff){
        this.hourlymix.windOff=0;
      }
      else{
        this.hourlymix.windOff -= this.mismatch();
	if(Math.abs(this.mismatch())>1e-6){
	  console.log("sim.update, it=",it,
		      " exiting in (5) after curtailing wind offshore",
		      "this.mismatch()=",this.mismatch());
	}

        return true;
      }
    }

    // curtail windOn
    
    if(this.mismatch()>0){
   
      if(this.mismatch()>maxWindOn){
        this.hourlymix.windOn=0;
      }
      else{
        this.hourlymix.windOn -= this.mismatch();
	if(Math.abs(this.mismatch())>1e-6){
	  console.log("sim.update, it=",it,
		      " exiting in (5) after curtailing wind onshore",
		      "this.mismatch()=",this.mismatch());
	}

        return true;
      }
    }

    // curtail solar
    
    if(this.mismatch()>0){
   
      if(this.mismatch()>maxSolar){
        this.hourlymix.solar=0;
      }
      else{
        this.hourlymix.solar -= this.mismatch();
	if(Math.abs(this.mismatch())>1e-6){
	  console.log("sim.update, it=",it,
		      " exiting in (5) after curtailing sun",
		      "this.mismatch()=",this.mismatch());
	}

        return true;
      }
    }
    
    // curtail nuclear
    
    if(this.mismatch()>0){
      if(this.mismatch()>maxNuclear-minNuclear){
        this.hourlymix.nuclear=minNuclear;
      }
      else{
        this.hourlymix.nuclear -=this.mismatch();
	if(Math.abs(this.mismatch())>1e-6){
	  console.log("sim.update, it=",it,
		      " exiting in (5) after curtailing nuclear",
		      "this.mismatch()=",this.mismatch());
	}
        return true;
      }
    }
    

    // (6) emergency "Hellbrise"

    if(this.mismatch()>0){
      console.log("Hellbrise! Too little demand or too much supply",
		  " shut off baseload power");
      let shutoffFactor=this.mismatch()/supplymin;
      let stabreserveFactor=(pow_rotatingMass-minPow_rotatingMass)
	  /pow_rotatingMass;
      if (shutoffFactor>stabreserveFactor){
	console.log("(6) Hellbrise! need to emergency shut off",
		    " too much baseload rotating mass => blackout");
	return false;
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

    // ############################################################
    // (7-9): path for too little supply (mismatch should be <0)
    // ############################################################

    if(this.mismatch()>0){
      console.log("it=",it," path (7-9): error: mismatch ",this.mismatch(),
		  " should be <0 at this point!");
    }

    
    //add H2 discharge (only if not charged/discharged in step 3)

    if(false){
      result=this.useH2Storage(); // changes this.storage
      if(result){
        if(Math.abs(this.mismatch())>1e-6){
	  console.log("sim.update, it=",it,
		      " exiting in (7) after adding H2",
		      "this.mismatch()=",this.mismatch());
        }
        return true;
      }
    }


   /*

    // add gas before coal (ecofriendly)
    
    if(this.mismatch()<-(maxGas-minGas)){
      this.hourlymix.gas=maxGas;
    }
    else{
      this.hourlymix.gas -= this.mismatch();
      if(Math.abs(this.mismatch())>1e-6){
	console.log("sim.update, it=",it,
		    " exiting in (7) after adding gas",
		    "this.mismatch()=",this.mismatch());
      }
      return true;
    }

    // add coal


    if(this.mismatch()<-(maxCoal-minCoal)){
      this.hourlymix.coal=maxCoal;
    }
    else{
      this.hourlymix.coal -= this.mismatch();
      if(Math.abs(this.mismatch())>1e-6){
	console.log("sim.update, it=",it,
		    " exiting in (8) after adding coal",
		    "this.mismatch()=",this.mismatch());
      return true;
    }
   */

    // (7-8) add gas and coal in availability ratio 2:1 (Germany 2025)
    
    if(-this.mismatch()>(maxGas-minGas+maxCoal-minCoal)){
      this.hourlymix.gas=maxGas;
      this.hourlymix.coal=maxCoal;
    }
    else{
      let r=-this.mismatch()/(maxGas-minGas+maxCoal-minCoal);
      this.hourlymix.gas=(1-r)*minGas+r*maxGas;
      this.hourlymix.coal=(1-r)*minCoal+r*maxCoal;
      
      this.hourlymix.gas -= this.mismatch();
      if(Math.abs(this.mismatch())>1e-6){
	console.log("sim.update, it=",it,
		    " exiting in (7-8) after adding gas,coal simultaneously",
		    "this.mismatch()=",this.mismatch());
      }
      return true;
    }

    

    // (9) prevent dunkelflaute blackout or raise dunkelflaute event

    if (this.mismatch()<-loadSheddingFactor*this.hourlymix.load){
      this.hourlymix.loadShedding=-this.mismatch();   
      console.log("(9) it=",it," blackout due to load shedding > maximum factor ",
		  loadSheddingFactor);
      return false;
    }
    this.hourlymix.loadShedding=-this.mismatch();   
    console.log("imposed load shedding of ",-this.mismatch(),
		" GW to prevent blackout");
    console.log("sim.update: it=",it," exiting in (9) after load shedding",
		"this.mismatch()=",this.mismatch());
    return true;
  }


}



function displayResultsMain(){

  let W_solar=0; let W_solar_data=0;
  let W_windOn=0; let W_windOn_data=0;
  let W_windOff=0; let W_windOff_data=0;
  let W_import=0; let W_import_data=0;
  let W_export=0; let W_export_data=0;
  let W_gas=0; let W_gas_data=0;
  let W_coal=0; let W_coal_data=0;
  let W_load=0;
  let W_nuclear=0;

  
  let W_biomass=8760*pow_biomass;
  let W_runningHydro=8760*pow_runningHydro;
  
  for (let it=0; it<nt; it++){
    let itSMARD=Math.max(0,it-1);
    W_load += energymix[it].load;
    W_nuclear += energymix[it].nuclear;
    W_solar += energymix[it].solar;
    W_solar_data += 0.001*supplydemanddata2025[itSMARD].PV;
    W_windOn += energymix[it].windOn;
    W_windOn_data += 0.001*supplydemanddata2025[itSMARD].w_on;
    W_windOff += energymix[it].windOff;
    W_windOff_data += 0.001*supplydemanddata2025[itSMARD].w_off;
    W_import += Math.max(0,+energymix[it].importHrly);
    W_export += Math.max(0,-energymix[it].importHrly);
    //if(isNaN(W_import)){console.log("it=",it," error! W_import is NaN!");}
    W_import_data += Math.max(0,-0.001*supplydemanddata2025[itSMARD].export);
    W_export_data += Math.max(0,+0.001*supplydemanddata2025[itSMARD].export);
    W_gas += energymix[it].gas;
    W_gas_data += 0.001*supplydemanddata2025[itSMARD].gas;
    W_coal += energymix[it].coal;
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


  // emission factors w/o additional emissions of H2 technology
  // CO2 in 
  let emissionCO2=e_nuclear*W_nuclear+e_solar*W_solar
      + e_biomass*W_biomass+e_runningHydro*W_runningHydro
      + e_windOn*W_windOn+e_windOff*W_windOff
      + e_gas*W_gas+e_coal*W_coal;
  
  let emissionFactor=emissionCO2/W_total;


  console.log("Energies from ",nt," days since 2025-01-01");
  console.log("W_solar=",W_solar," W_solar_data=",W_solar_data);
  console.log("W_windOn=",W_windOn," W_windOn_data=",W_windOn_data);
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

  console.log("\n\nAvailabiities:",
	      "\n solar_av=",solar_av," solar_av_data=",solar_av_data,
	      "\n windOn_av=",windOn_av," windOn_av_data=",windOn_av_data,
	      "\n windOff_av=",windOff_av," windOff_av_data=",windOff_av_data);

  console.log("\n\nCO2:",
	      "\n Total CO2 emissions [Mio t]: ",
	      (1e-6*emissionCO2).toFixed(0),
	      "\n Carbon footprint [g/kWh]:",emissionFactor.toFixed(0));

} // displayResultsText


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


function runSimulation(nt){
  energymix=[]; storage=[]; solarRegions=[]; windRegions=[];

  var sim=new simulation(1);

  var noBreakdown=true;
  sim.init(); // set up storage to half full

  console.log("=================================================\n");
  for(let it=0; (it<nt)&& noBreakdown; it++){
    noBreakdown=sim.update(it);
  
    energymix[it]=sim.hourlymix;
    storage[it]=sim.cloneStorage();
    solarRegions[it]=sim.hourlySolarRegions;
    windRegions[it]=sim.hourlyWindRegions;
  }

  if(!noBreakdown){
    console.log("Warning! Electricity system broke down during simulation!");
  }
}


function displayText(){
  console.log("\n\n");
 // displayResultsRegions();
 // console.log("\n\n");

  displayResultsMain();
  console.log("\n\n");

  displayResultsStorage();
  //console.log("\n\n");
  
}

function displayGraphics(){
  initChart();
}

function updateGraphics(chart){
  chart.data.datasets=buildDatasets();
  chart.update();
}



// #################################################################
// main (debug, later started by buttons on the left panel)
// #################################################################

//let nt=2;
//let nt=4000;
//let nt=290;

let nt=8760;
runSimulation(nt);
displayText();
displayGraphics();

console.log("before update");
runSimulation(500);
updateGraphics(chart1); // (energymix,chart1)  (parameters (data,chart))
console.log("after update");

//console.log("storage=",storage,"\nenergymix=",energymix);
//console.log("solarRegions=",solarRegions);
//console.log("windRegions=",windRegions);
console.log("energymix=",energymix);
