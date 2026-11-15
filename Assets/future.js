(() => {
 const E=OrbitEngine;
 const sourceLinks={radiation:'https://www.nasa.gov/reference/risk-of-radiation-induced-cancers/',bone:'https://www.nasa.gov/reference/4-0-human-performance/',sans:'https://www.nasa.gov/humans-in-space/international-space-station-research-keeps-an-eye-on-vision-changes-in-space/',sleep:'https://www.nasa.gov/hrp/risks/'};
 function assess(snapshot,environment,days=7,reduction=50){
  days=Math.max(1,Math.min(30,Number(days)||7));reduction=Math.max(0,Math.min(80,Number(reduction)||0));
  if(snapshot.mode==='manual'){
   const domains=[['radiation','Radiation / long-term effects',['rate','daily','career']],['bone','Musculoskeletal / kidney stones',['strength','calcium']],['sans','Eyes / SANS',['oct','blur']],['sleep','Sleep / performance',['sleep','fatigue']]];
   return {version:'FUTURE-MANUAL-NO-MODEL',days,reduction,environment,generatedAt:Date.now(),snapshotId:snapshot.id,exposure:null,exposureReason:'Personal records do not generate exposure or disease projections without an approved radiation model.',clinicalPrediction:'Prediction unavailable: no validated clinical model is connected for personal records.',problems:domains.map(([id,title,ids])=>({id,title,label:'Personal record / no model connected',watch:false,potential:'Available records can be monitored; no individual health outcome or probability was predicted for this domain.',evidence:ids.map(key=>{const m=E.METRICS.find(m=>m.id===key),r=snapshot.meta[key];return m.name+': '+(r?`${r.value} ${r.unit} · manual entry`:'no data');}),data:ids.map(key=>{const m=E.METRICS.find(m=>m.id===key);return m.name+': '+(snapshot.meta[key]?(E.isFresh(snapshot,m)?'current':'outdated'):'no record');}).join(' / '),continued:'Personal records can be tracked longitudinally; no numerical outcome is calculated for continued conditions.',reduced:'The reduction percentage is not applied to personal measurements or health outcomes.',missing:'A clinically validated model adapted to this person / mission, sufficient historical measurements and medical assessment are required.',source:sourceLinks[id]}))};
  }
  const v=snapshot.values,metric=id=>E.METRICS.find(m=>m.id===id),fresh=id=>E.isFresh(snapshot,metric(id));
  const radiationAllowed=fresh('rate')&&environment!=='EVA'&&!snapshot.solarEvent&&Number.isFinite(v.rate)&&v.rate>=0;
  const unavailable=!fresh('rate')?'Dose data is outdated. Generate a new demo sample.':environment==='EVA'?'An EVA-compatible dosimeter has not been verified.':snapshot.solarEvent?'An acute particle event is ongoing. Its time course is unknown, so the instantaneous dose rate cannot be extrapolated over days.':'Invalid dose rate.';
  const exposure=radiationAllowed?{continued:v.rate*24*days/1000,reduced:v.rate*24*days/1000*(1-reduction/100),unit:'mSv · additional personal dose / demo'}:null;
  const problems=[
   {id:'radiation',title:'Radiation / long-term effects',label:radiationAllowed?'Exposure scenario available':'Exposure calculation unavailable',watch:snapshot.solarEvent||v.career>=600,
    potential:'Radiation-induced cancer and other late effects are long-term risks to monitor. No individual disease probability was calculated.',
    evidence:[`Personal dose rate: ${v.rate} µSv/h (demo)`,`Daily / 30 days: ${v.daily} / ${v.monthly} mSv (demo)`,`Career effective dose record: ${v.career} mSv (separate model record)`],
    data:fresh('rate')?'Dose sample current':'Dose sample outdated',
    continued:'Continued exposure adds personal dose. Its conversion into disease probability cannot be calculated here.',
    reduced:'A lower dose rate is assumed as input, reducing future additional dose. Previously accumulated dose and injury are not considered reversed.',
    missing:'No approved effective-dose conversion, detailed exposure history or validated individual risk model is available. CAD personal dose was not added to career effective dose.',source:sourceLinks.radiation},
   {id:'bone',title:'Musculoskeletal / kidney stone monitoring',label:fresh('strength')&&fresh('calcium')?'Monitoring signals available':'Data is not recent enough',watch:fresh('strength')&&fresh('calcium')&&(v.strength<=-5||v.calcium>=E.PROFILES[environment].calcium),
    potential:'Declining strength and changes in bone metabolism may warrant monitoring for functional loss and kidney stones. These are not diagnoses.',
    evidence:[`Strength change from personal baseline: %${v.strength}`,`Fatigue model score: %${v.fatigue}`,`Urinary calcium: ${v.calcium} mg/24 h`],
    data:`ARED: ${fresh('strength')?'current':'outdated'} · urine sample: ${fresh('calcium')?'current':'outdated'}`,
    continued:'If adverse measurement trends and low loading persist, strength and bone health should be reassessed. Future loss cannot be quantified.',
    reduced:'Changes can be monitored with new measurements after reviewing the prescribed exercise, nutrition and fluid plan. Recovery magnitude and timing are not predicted.',
    missing:'No bone density / metabolism series, urine volume and complete chemistry, longitudinal strength records or validated prediction model is available. A single urine result cannot determine stone probability.',source:sourceLinks.bone},
   {id:'sans',title:'Eye / SANS monitoring',label:fresh('oct')?'OCT monitoring data available':'OCT sample outdated',watch:fresh('oct')&&v.oct>=E.PROFILES[environment].oct&&v.blur>=3,
    potential:'Changes in ocular structure and vision may affect mission performance. SANS progression and pressure changes cannot be predicted from these data.',
    evidence:[`OCT change from personal baseline: +${v.oct} µm`,`Blurred vision: ${v.blur}/10 · self-report`],
    data:fresh('oct')?'Periodic OCT sample current':'OCT sample outdated',
    continued:'Persistent visual symptoms or OCT changes increase the priority of scheduled screening and medical review. Progression timing is not predicted.',
    reduced:'A physician selects approved countermeasures for the environment / mission. Exposure reduction percentages are not converted into OCT or vision improvement.',
    missing:'No serial OCT / vision tests or validated SANS progression model is available. OCT does not directly measure intracranial or intraocular pressure.',source:sourceLinks.sans},
   {id:'sleep',title:'Sleep / fatigue and performance',label:fresh('sleep')?'Current monitoring data available':'Sleep data outdated',watch:fresh('sleep')&&(v.sleep<60||v.fatigue>=E.PROFILES[environment].fatigue),
    potential:'Persistent sleep loss and workload are monitored for reduced attention and mission performance. Individual error probability is not calculated.',
    evidence:[`Sleep quality score: ${v.sleep}/100 · derived demo`,`Fatigue score: %${v.fatigue}`],
    data:fresh('sleep')?'Demo sleep model current':'Sleep model data outdated',
    continued:'Repeated sleep disruption requires assessment for cumulative fatigue. A single score does not establish prolonged sleep loss.',
    reduced:'The responsible team can adjust rest and mission plans and monitor repeated sleep / performance measurements. Recovery time is not predicted.',
    missing:'Multi-night sleep duration, circadian timing, workload and performance tests are unavailable. A single score cannot predict future performance.',source:sourceLinks.sleep}
  ];
  return {version:'FUTURE-DEMO-0.1',days,reduction,environment,generatedAt:Date.now(),snapshotId:snapshot.id,exposure,exposureReason:radiationAllowed?'Assumes a constant personal dose rate and uninterrupted 24-hour daily exposure.':unavailable,problems,clinicalPrediction:'Prediction unavailable: no validated individual disease model or longitudinal data.'};
 }
 const n=(value,d=2)=>value.toLocaleString('en-US',{minimumFractionDigits:d,maximumFractionDigits:d});
 function el(tag,className,text){const item=document.createElement(tag);if(className)item.className=className;if(text!==undefined)item.textContent=text;return item;}
 function render(){
  const host=document.getElementById('futureArea');if(!host||!window.ORBIT)return;
  const result=assess(ORBIT.state.snapshot,ORBIT.state.environment,document.getElementById('futureDays').value,document.getElementById('futureReduction').value);
  document.getElementById('futureReductionValue').textContent=result.reduction+'%';
  document.getElementById('futureContext').textContent=`${ORBIT.state.member==='0'?'Deniz Kaya':'Ece Yıldız'} · ${E.PROFILES[result.environment].name} · ${result.days} day assumption · source sample ${new Date(ORBIT.state.snapshot.at).toISOString().slice(11,19)} UTC`;
  const comparison=document.getElementById('futureComparison');comparison.replaceChildren();
  if(result.exposure){
   const ex=result.exposure;const title=el('h3',null,'Radiation exposure comparison only');comparison.append(title);
   const rows=el('div','future-dose-rows');
   for(const [label,value,color] of [['If conditions continue',ex.continued,'#f1b6a1'],['If the assumed dose rate is reduced',ex.reduced,'#9fdac2']]){
    const row=el('div','future-dose-row');row.append(el('span',null,label),el('strong',null,n(value)+' mSv'));
    const bar=el('div','future-dose-track'),fill=el('i');fill.style.width=(ex.continued>0?value/ex.continued*100:0)+'%';fill.style.background=color;bar.append(fill);row.append(bar);rows.append(row);
   }
   comparison.append(rows,el('p',null,`${result.days} days: ${n(ex.continued-ex.reduced)} mSv less additional personal dose — entirely hypothetical. This does not imply a proportional reduction in disease risk.`));
  }else comparison.append(el('h3',null,'Numerical exposure scenario unavailable'),el('p',null,result.exposureReason));
  comparison.append(el('p','future-small',result.exposureReason+' This calculation is not added to career effective dose; it is not a safe stay duration or disease probability.'));
  const list=document.getElementById('futureCards');list.replaceChildren();
  result.problems.forEach(p=>{
   const card=el('article','future-card');card.dataset.watch=String(p.watch);
   const heading=el('div','future-card-heading');heading.append(el('h3',null,p.title),el('span',null,p.watch?'! Review signal · demo':p.label));card.append(heading,el('p','future-potential',p.potential));
   const evidence=el('ul','future-evidence');p.evidence.forEach(text=>evidence.append(el('li',null,text)));card.append(evidence,el('p','future-data',p.data));
   const scenarios=el('div','future-scenarios');
   for(const [title,text] of [['If conditions continue',p.continued],['If exposure / workload is reduced',p.reduced]]){const block=el('div');block.append(el('h4',null,title),el('p',null,text));scenarios.append(block);}card.append(scenarios);
   const missing=el('div','future-missing');missing.append(el('strong',null,'Individual disease prediction unavailable'),el('p',null,p.missing));card.append(missing);
   const source=el('details','future-source');source.append(el('summary',null,'Source: NASA · show link'),el('p',null,p.source),el('p',null,'This source provides a general risk framework; it does not validate individual predictions or demo thresholds.'));card.append(source);list.append(card);
  });
  window.FutureRisks.last=result;
 }
 window.FutureRisks={assess,render,last:null};
 document.getElementById('futureDays').onchange=render;document.getElementById('futureReduction').oninput=render;
 document.getElementById('futureReport').onclick=()=>{const report=ORBIT.makeReport(false);report.futureRisks=JSON.parse(JSON.stringify(FutureRisks.last||assess(ORBIT.state.snapshot,ORBIT.state.environment)));try{localStorage.setItem('orbit-decision-reports-v1',JSON.stringify(ORBIT.state.reports.filter(r=>r.dataMode!=='manual')));}catch{}document.getElementById('futureReportStatus').textContent='A local demo report containing the comparison and its limitations was created. You can export it as JSON from Medical reports.';};
 render();
})();
