(() => {
// All thresholds below are deliberately illustrative demo rules, not medical protocols.
const PROFILES={
 ISS:{name:'ISS',gravity:'Microgravity',delay:1,doseRate:100,sessionBudget:1,sessionHours:24,hr:110,fatigue:30,oct:12,calcium:300},
 Moon:{name:'Moon',gravity:'0.16 g',delay:3,doseRate:150,sessionBudget:2,sessionHours:8,hr:115,fatigue:35,oct:15,calcium:320},
 Mars:{name:'Mars',gravity:'0.38 g',delay:1200,doseRate:180,sessionBudget:2,sessionHours:8,hr:115,fatigue:35,oct:15,calcium:320},
 EVA:{name:'EVA',gravity:'External activity / depends on mission vehicle',delay:3,doseRate:75,sessionBudget:.5,sessionHours:6,hr:120,fatigue:25,oct:12,calcium:300}
};
const METRICS=[
 {id:'hr',group:0,name:'Heart rate',unit:'bpm',digits:0,source:'Astroskin',region:'chest',spread:4},
 {id:'resp',group:0,name:'Respiration',unit:'breaths/min',digits:0,source:'Astroskin',region:'chest',spread:2},
 {id:'sleep',group:0,name:'Sleep quality',unit:'/ 100 · derived demo',digits:0,source:'Astroskin + sleep model',region:'head',spread:4},
 {id:'rate',group:1,name:'Personal dose rate',unit:'µSv/h · demo',digits:1,source:'CAD',region:'radiation',spread:2},
 {id:'area',group:1,name:'Environment dose rate',unit:'µGy/h · demo',digits:1,source:'HERA',region:'radiation',spread:2},
 {id:'daily',group:1,name:'Daily personal dose',unit:'mSv · demo',digits:2,source:'CAD integration',region:'radiation',spread:.02},
 {id:'monthly',group:1,name:'Past 30-day dose',unit:'mSv · demo',digits:2,source:'CAD records',region:'radiation',spread:.1},
 {id:'career',group:1,name:'Career effective dose',unit:'mSv · model record',digits:1,source:'Mission dose model',region:'radiation',spread:.1},
 {id:'fatigue',group:2,name:'Muscle fatigue',unit:'% · model score',digits:0,source:'sEMG model',region:'muscle',spread:3},
 {id:'force',group:2,name:'ARED peak load',unit:'N',digits:0,source:'ARED load cell',region:'muscle',spread:15},
 {id:'strength',group:2,name:'Strength change',unit:'% · relative to preflight',digits:1,source:'ARED trend model',region:'muscle',spread:.3},
 {id:'oct',group:3,name:'OCT thickness change',unit:'µm · relative to personal baseline',digits:1,source:'OCT scan',region:'eyes',spread:.5},
 {id:'blur',group:3,name:'Blurred vision',unit:'/ 10 · self-report',digits:0,source:'Crew self-report',region:'eyes',spread:.3},
 {id:'lymph',group:4,name:'Lymphocytes',unit:'×10⁹/L',digits:2,source:'Blood kit',region:'lab',spread:.04},
 {id:'calcium',group:4,name:'Urinary calcium',unit:'mg/24 h',digits:0,source:'24-hour urine kit',region:'lab',spread:8}
];
const GROUPS=[{name:'Vital signs',desc:'Astroskin · cardiorespiratory measurements and sleep model'},{name:'Radiation',desc:'HERA environment / CAD personal measurements · different quantities are not added directly'},{name:'Muscle & bone',desc:'sEMG + ARED · fatigue and strength trend relative to personal baseline'},{name:'SANS',desc:'OCT and self-report · intracranial / intraocular pressure is not measured directly'},{name:'Laboratory',desc:'Periodic blood and 24-hour urine samples · interpreted with sampling time'}];
function makeSnapshot(member,scenario,now=Date.now()){
 const v=member==='1'?{hr:76,resp:16,sleep:74,rate:20,area:22,daily:.43,monthly:12.9,career:186.5,fatigue:20,force:310,strength:-2.4,oct:4,blur:1,lymph:1.8,calcium:225}:{hr:72,resp:15,sleep:82,rate:22,area:24,daily:.48,monthly:14.4,career:142.6,fatigue:18,force:365,strength:-1.8,oct:3,blur:1,lymph:2.1,calcium:210};
 if(scenario==='exertion')Object.assign(v,{hr:128,resp:25,fatigue:42});
 if(scenario==='storm')Object.assign(v,{rate:420,area:470,daily:1.6,lymph:1.05});
 if(scenario==='bone')Object.assign(v,{fatigue:40,strength:-8.4,force:280,calcium:380});
 if(scenario==='sans')Object.assign(v,{oct:22,blur:5});
 return {id:`${member}-${scenario}-${now}`,at:now,member,scenario,values:v,age:{vital:scenario==='stale'?600:2,radiation:scenario==='stale'?600:3,muscle:20,oct:86400,lab:172800},quality:scenario==='stale'?'stale':'demo',baseline:{lymph:member==='1'?1.8:2.1},solarEvent:scenario==='storm'};
}
function sampleAge(s,key,now=Date.now()){return Math.floor(s.age[key]+Math.max(0,now-s.at)/1000);} function metricAge(s,m,now=Date.now()){if(s.mode==='manual')return s.meta?.[m.id]?Math.max(0,Math.floor((now-s.meta[m.id].measuredAt)/1000)):Infinity;return sampleAge(s,m.group===0?'vital':m.group===1?'radiation':m.group===2?'muscle':m.group===3?'oct':'lab',now);}
function isFresh(s,m){const limits=[120,120,300,604800,259200];return Number.isFinite(s.values[m.id])&&metricAge(s,m)<=limits[m.group];}
function evaluate(s,environment){
 if(s.mode==='manual')return [{id:'manual-unvalidated',level:'hold',title:'Personal record mode — clinical rules not applied',evidence:`${Object.values(s.values).filter(Number.isFinite).length} measurements available. Missing data is left empty.`,action:'Manual records and their history can be viewed. Demo thresholds are not applied to real measurements; clinical decisions require a validated protocol and medical assessment.',regions:[],protocol:'No clinical model connected'}];
 const p=PROFILES[environment],v=s.values,alerts=[];
 const add=(id,level,title,evidence,action,regions)=>alerts.push({id,level,title,evidence,action,regions,protocol:'DEMO-0.1 / no medical or flight approval'});
 const freshVitals=sampleAge(s,'vital')<=120,freshRad=sampleAge(s,'radiation')<=120;
 if(!freshVitals||!freshRad)add('quality','hold','Data is outdated',`Vital data ${sampleAge(s,'vital')} s; radiation ${sampleAge(s,'radiation')} s.`, 'Check the sensor connection and timestamp. No autonomous recommendation was generated from outdated data.', ['chest','radiation']);
 if(environment==='EVA')add('eva','hold','EVA sensor compatibility not verified','CAD vacuum compatibility is not assumed; HERA is an interior environment sensor.','Do not use radiation duration calculations until an EVA-compatible dosimeter and mission telemetry are verified.',['radiation']);
 if(freshRad&&environment!=='EVA'&&v.rate>=p.doseRate&&s.solarEvent)add('storm','critical','Radiation event — demo cross-alert',`Personal dose rate ${v.rate} µSv/h + simulated particle event. ${p.name} demo threshold ${p.doseRate}. HERA environment increase: ${v.area} µGy/h.`, 'Simulation step: stop external activity; notify the mission commander and follow the approved radiation / storm shelter procedure.',['radiation']);
 if(freshVitals&&v.hr>=p.hr&&v.resp>=22&&v.fatigue>=p.fatigue)add('strain','warning','Multiple exertion-related signals',`Heart rate ${v.hr}, respiration ${v.resp}, muscle fatigue score %${v.fatigue}.`, 'Simulation step: pause activity, start the 60-second assessment timer and recheck sensors. For chest pain, marked breathlessness or fainting, follow the mission emergency medical procedure immediately.',['chest','muscle']);
 if(sampleAge(s,'lab')<=259200&&sampleAge(s,'muscle')<=300&&v.strength<=-5&&v.calcium>=p.calcium)add('bone','warning','Combined musculoskeletal and urine findings',`Strength trend %${v.strength}; urinary calcium ${v.calcium} mg/24 h.`, 'Request a medical assessment; review the assigned fluid and ARED plan. Additional ARED load or an automatic fluid volume is not recommended during fatigue.',['muscle','lab']);
 if(sampleAge(s,'oct')<=604800&&v.oct>=p.oct&&v.blur>=3)add('sans','warning','OCT change + visual symptoms',`Relative to baseline +${v.oct} µm; blur ${v.blur}/10.`, 'Pause hazardous tasks that require vision and notify the medical officer; request an approved vision / OCT check. These findings do not diagnose intracranial pressure.',['eyes','head']);
 if(freshRad&&environment!=='EVA'&&sampleAge(s,'lab')<=259200&&v.rate>=p.doseRate&&v.lymph<s.baseline.lymph*.7)add('blood','warning','Radiation signal + lymphocyte change',`Lymphocytes ${v.lymph} ×10⁹/L; personal baseline ${s.baseline.lymph}.`, 'Submit the blood sample and dose record for medical review. A lymphocyte decrease alone does not establish radiation injury.',['lab','radiation']);
 if(v.career>=600)add('career','critical','Career effective dose limit exceeded',`Model record ${v.career} mSv / 600 mSv.`, 'Assessment by the mission radiation medical officer is required. This record is simulated.',['radiation']);
 return alerts;
}
function projection(s,environment){
 if(s.mode==='manual')return {hours:null,reason:'Duration is not calculated for personal records without an approved dose and mission model.'};
 const p=PROFILES[environment];
 if(environment==='EVA'||sampleAge(s,'radiation')>120)return {hours:null,reason:environment==='EVA'?'EVA hardware not verified':'Dose data is outdated'};
 // Illustrative personal dose budget only, never a physiological safe-stay estimate.
 const remaining=Math.max(0,p.sessionBudget-s.values.daily);
 return {hours:Math.min(p.sessionHours,s.values.rate>0?remaining/(s.values.rate/1000):p.sessionHours),remaining,reason:'Assumes a constant dose rate; demo session budget only. This is not a safe stay duration.'};
}
window.OrbitEngine={PROFILES,METRICS,GROUPS,makeSnapshot,evaluate,projection,isFresh,metricAge};

})();
