"use strict"

// all the global constants encoding the assumptions of this simulator


// ###############################################################
// load changes due to WP and BEVs
// ###############################################################

/* additional demand  (load) at 100% BEVs and heatpumps

"Wie gross ist der zuaetzliche Strombedarf bei 100% Waermepumpen 
in TWh pro Jahr" 

=> 150-200 TWh/a => +40% or avg 20 GW
=> leads to load changes (fWP-fWP0)*40 GW*1/2(1+cos(phi_year-phi0))
 
"Wie gross ist der zuaetzliche Strombedarf in TWh/Jahr, 
wenn alle Fahrzeuge einschl. LKW elektrifiziert sind?"
(nach Nachfragen)
=> * 160 TWh/Jahr ist die technisch korrekte Zahl für den Fall, dass alle Fahrzeuge batterieelektrisch (BEV) fahren.
 * 260 TWh/Jahr (und mehr) ist die Zahl für Szenarien mit einem signifikanten Anteil an wasserstoffbetriebenen Lkw oder E-Fuels.

=> 160 TWh/a 
=> 20 GW const., load100_BEV=20;
=> leads to load changes (fBEV-fBEV0)*20 GW
*/

const load100_BEV=20;    // addl load [GW] (100%-0%) BEVs trucks/buses/cars
const load100_WP=40;     // addl winter load [GW] (100%-0%) heatpumps
const fBEV0=0.04;        // ADAC ("Anteil BEV Deutschland 2025")
const fWP0=0.045;        // "Anteil der WP bei Wohnungsheizungen 2025"


//####################################################################
// Energy/power constants reference 2025 (needed for sliders)
//####################################################################

// end 2025 inst power 106 GW, W=87.5 TWh solar, 70.6 TWh into the grid
// (my data says 73.8)
// end 2024 inst power 99 GW, 72.2 TWh solar, 59.8 TWh into the grid
// end 2025 inst power 68 GW, 106.5 TWh wind onshore, all into the grid
// end 2024 inst power 63.6 GW, 106.5 TWh wind onshore, all into the grid
//// (my data says 106.8)
// 2025 26.1 TWh wind onshore, all into the grid (my data says 26.2)

const pow00_PV=102.5*70.6/87.5; // avg eff. nom power PV (2025) OK
const pow00_WindOn=62.8;    // Nom eff power wind onshore (2025) OK
const pow00_WindOff=9.4;   // Nom eff power wind offshore (2025) OK
const pow00_Coal=31;        // Nominal power coal (2025) OK
const pow00_Gas=35.5;         // Nominal power gas (2025) google, OK
const pow00_Nuclear=0;      // Nominal power nuclear (2025) OK ;-(
const pow_runningHydro=2.0; // assumed to be constant, google OK
const pow_biomass=4.8;        // assumed to be constant, google OK

// 2025 storage properties

const battCharge0=10;     // charge and discharge power [GW] batteries (2025)
const battEnergy0=25;     // energy-charts.info
const battEta=0.8;        // roundtrip (electricity-electricity) efficiency 

const hydroCharge0=9.4;    // max charge and discharge power [GW] (OK, const)
const hydroEnergy0=40;     // storage energy [GWh] (const)
const hydroEta=0.8;        // roundtrip (electricity-electricity) efficiency 

const H2Charge0=2;       // H2 (2025)  (do not use as reference)
const H2Discharge0=5;   
const H2Energy0=10;       // not yet any industrial scale storage    
const H2eta=0.24;     

// maximum import/export 2025 [GW]

const importPow0=13;


//####################################################################
// Constants related to calculation of solar/wind power from weather
//####################################################################

// wind speed extrapolation from 100m (data)
//v(h)=v(h0)*(h/h0)^E, E=0.1 (offshore), 0.24 (onshore), h=120..140m

const fWind_onshore=1.05;  // at avg axle hight compared to 100m 
const fWind_offshore=1.03;  

// wind power characteristics

const vc1_onshore=3; // transition speed 1 [m/s]: pow=0 below
const vc2_onshore=11.5; // transition speed 2 [m/s]: pow propto v^3 below
const vc3_onshore=21; // transition speed 3 [m/s]; pow=p0 below, pow=0 above

const vc1_offshore=4; // transition speed 1 [m/s]: pow=0 below
const vc2_offshore=13; // transition speed 2 [m/s]: pow propto v^3 below
const vc3_offshore=22; // transition speed 3 [m/s]; pow=p0 below, pow=0 above

// wind powerplants distribution
// 0=M, 1=S, 2=NW, 3=NE, 4=offshore N, 5=offshore E

const frac_onshore=[11./64, 5./64, 30./64, 18./64];
const frac_offshore=[7.5/9, 1.5/9];


// solar yearly performance characteristic (efficiency higher if cold)
// pWind=p0*I/Iref*(1-amplRel*(Math.cos(phi_year-dphi)-1))

const solar_Iref=1000; // W/m^2
const solar_amplRel=0.08;
const year_dphi=2*Math.PI/12; // coldest at end of January

// solar powerplants distribution
// 0=M, 1=S, 2=NW, 3=NE, 4=SW, 5=SE

const frac_solar=[19./109, 27./109, 21./109, 14./109, 14./109, 14./109];


//####################################################################
// Constants related to operations
//####################################################################

const gas_minRelPow=0.1;  // min relative load (ramping per h unrestricted)
const gas_av=0.9;         // availability
const coal_minRelPow=0.20;
const coal_av=0.9;
const nuclear_minRelPow=0.5;
const nuclear_av=0.9;
const solar_av=0.82; // also due to suboptimal alignment
const windOn_av=0.905; // fitting to the data 2025
const windOff_av=0.78; // fitting to the data 2025


//####################################################################
// Constants related to strategies
//####################################################################

// import/export maximally if mismatch<mismatch_maxImport/ >mismatch_maxExport
// if strategy 0 (present strategy)

const mismatch_maxImport=-45; // [GW] w/resp to minClassic, full RE, storage
const mismatch_maxExport=30; // [GW] w/resp to minClassic, full RE, storage

const minPow_rotatingMass=8; // handling of the "Hellbrise"

const loadSheddingFactor=0.3; //to prevent blackout (0.3=30% maxLoadShedding)



//####################################################################
// emission factors [g/kWh]
//####################################################################

// app.electricitymaps.com/map/zone/DE/5y/yearly auf Quellen hovern
// WATCH OUT!
// as standard settings, imports/exports are included as mix
// at electricitymaps => at 342 g/kWh are displayed,
// this also agrees with many publications
// when switching off flows (right gear symbol) 371 g/kWh are displayed
// OK also with simulated 166 Mio t at 370 g/kWh
// (published load 168 t at 371 g/kWh)

const e_nuclear=5;  // [g CO2eq/kWh]
const e_solar=35;
const e_biomass=230;
const e_runningHydro=11;
const e_windOn=13;
const e_windOff=13;
const e_gas=494;  // Pipelinegas 400, LPG 600
const e_coal=1130;



