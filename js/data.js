"use strict"


const winddata = JSON.parse(str_wind2025);
console.log("winddata.length=",winddata.length);
console.log("winddata[0]=",winddata[0]);
console.log("winddata[0].w100_1=",winddata[0].w100_1);
console.log("winddata[8759]=",winddata[8759]);

const solardata = JSON.parse(str_solar2025);
console.log("solardata.length=",solardata.length);
console.log("solardata[0]=",solardata[0]);
console.log("solardata[12].I1=",solardata[12].I1);
console.log("solardata[4000]=",solardata[4000]);

const supplydemanddata2025 = JSON.parse(str_supplyDemand2025);
console.log("supplydemanddata2025.length=",supplydemanddata2025.length);
console.log("supplydemanddata2025[0]=",supplydemanddata2025[0]);
console.log("supplydemanddata2025[0].load=",supplydemanddata2025[0].load);
console.log("supplydemanddata2025[8759]=",supplydemanddata2025[8759]);
