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

// consolidate timestamps (bring everything to UTC)
// by adding an additional timeUTC_ms entry to be used in graphics
// using native JavaScript Date().getTimezoneOffset()
// instead of relying on unstable "magic" at charts.js

// ERA5 winddata and DWD solardata are UTC, but SMARD data are MET/MEST
//https://www.smard.de/resource/blob/215828/3d407b3638ac86f6341aca9ca8f3d7ec/smard-benutzerhandbuch-02-2025-data.pdf

// if origin UTC, timestamp.toLocaleString('de-DE') in graphics
// already gives correct times

// if origin MET/MEST, we need to increment
// the timestamp by 60000*(new Date(timeString).getTimezoneOffset());
// getting the MET/MEST time back to UTC
// (getTimeOffset()=-60 or -120, so the UTC in ms is < CET/CEST in ms)
// then, time.toLocaleString('de-DE') will revert this transformation
// to display CET/CEST values

// NOTE: Just for clarity, in the simulation,
// the SMARD  data are just shifted back by 1 => itSMARD

// winddata in UTC

for (let it=0; it<winddata.length; it++){
  winddata[it].timeUTC_ms=new Date(winddata[it].time).getTime();
  if ((it>=0*24)&&(it<1*24)){
    console.log("wind timeString=",winddata[it].time,
		" MET/MEST time=",new Date(winddata[it].timeUTC_ms));
  }
}

// solardata (DWD data) in UTC

for (let it=0; it<solardata.length; it++){
  solardata[it].timeUTC_ms=new Date(solardata[it].time).getTime();
}

//supply/demand data in MET/MEST

for (let it=0; it<supplydemanddata2025.length; it++){
  let timeCET=new Date(supplydemanddata2025[it].time).getTime();
  let offset_ms=60000*(new Date(timeCET).getTimezoneOffset());
  supplydemanddata2025[it].timeUTC_ms=timeCET+offset_ms;
  if(it<2){console.log("supplydemanddata2025 timeString=",
		       supplydemanddata2025[it].time,
		       " MET/MEST time=",
		       new Date(supplydemanddata2025[it].timeUTC_ms));
  }
}
