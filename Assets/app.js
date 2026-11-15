const {PROFILES,METRICS,GROUPS,makeSnapshot,evaluate,projection,isFresh,metricAge}=OrbitEngine;
const $=id=>document.getElementById(id), fmt=(v,d=0)=>v===null||v===undefined||!Number.isFinite(Number(v))?'—':Number(v).toLocaleString('en-US',{minimumFractionDigits:d,maximumFractionDigits:d});
const state={group:0,selected:'hr',region:'chest',environment:'ISS',scenario:'nominal',member:'0',snapshot:makeSnapshot('0','nominal'),alerts:[],reports:[],reportId:null,lastCritical:'',days:7};
const regionMap={head:{name:'Head / sleep',group:0,metric:'sleep',text:'The sleep score is a demo output derived from sensor data; it is not a direct pressure measurement.'},eyes:{name:'Eyes / SANS',group:3,metric:'oct',text:'OCT changes relative to personal baseline are reviewed alongside visual symptoms. They do not indicate intracranial or intraocular pressure.'},chest:{name:'Heart / respiration',group:0,metric:'hr',text:'Astroskin heart rate and respiration. Each measurement shows its source and timestamp.'},muscle:{name:'Muscle / bone',group:2,metric:'fatigue',text:'sEMG fatigue model + ARED strength trend. Load cells do not directly measure bone loss.'},lab:{name:'Blood / urine',group:4,metric:'lymph',text:'Periodic laboratory data. Lymphocytes are assessed against personal baseline; urinary calcium is assessed as a 24-hour sample.'},radiation:{name:'Whole body / dosimetry',group:1,metric:'rate',text:'HERA environment measurements and CAD personal measurements are kept separate. Effective dose requires an approved conversion model.'}};
const crewName=()=>state.member==='0'?'AST-01 · Deniz Kaya':'AST-02 · Ece Yıldız';
const timeText=t=>new Date(t).toISOString().replace('T',' ').slice(0,19)+' UTC';
const duration=seconds=>seconds<60?`${seconds} s`:`${fmt(seconds/60,seconds%60?1:0)} min`;
const ageText=seconds=>seconds>=86400?`${fmt(seconds/86400,1)} days ago`:seconds>=3600?`${fmt(seconds/3600,1)} hours ago`:`${seconds} s ago`;
try{const saved=JSON.parse(localStorage.getItem('orbit-decision-reports-v1')||'[]');if(Array.isArray(saved))state.reports=saved.filter(r=>r&&typeof r.id==='string'&&r.routes&&r.snapshot).slice(0,50);for(const r of state.reports){for(const route of [r.routes.station,r.routes.earth]){if(route.state==='Demo: gecikme kuyruğunda')route.state='Demo: in delay queue';else if(route.state==='Demo: yerel alıcıda')route.state='Demo: received locally';else if(route.state==='Demo: Dünya alıcısında')route.state='Demo: received on Earth';}}}catch{}
const save=()=>{try{localStorage.setItem('orbit-decision-reports-v1',JSON.stringify(state.reports.filter(r=>r.dataMode!=='manual')));}catch{$('reportStatus').textContent='Local storage is unavailable; reports are retained for this session only.';}};
function makeReport(automatic=false){
 const s=state.snapshot,p=PROFILES[state.environment],now=Date.now();
 const report={id:crypto.randomUUID(),created:now,automatic,simulation:true,crew:crewName(),environment:state.environment,profile:'DEMO-0.1 / unapproved',delaySeconds:p.delay,snapshot:JSON.parse(JSON.stringify(s)),findings:JSON.parse(JSON.stringify(state.alerts)),projection:projection(s,state.environment),futureRisks:window.FutureRisks?.assess(s,state.environment,Number(document.getElementById('futureDays')?.value||7),Number(document.getElementById('futureReduction')?.value??50))||null,limitations:['No live sensors or actual transmissions','All clinical thresholds are illustrative; decisions require medical and flight approval','CAD dose was not added directly to career effective dose','OCT is not a pressure measurement'],routes:{station:{target:'Mission medical officer',state:'Demo: received locally',at:now},earth:{target:'Earth control / flight surgeon',state:'Demo: in delay queue',due:now+p.delay*1000}}};
 report.dataMode=s.mode==='manual'?'manual':'demo';report.referenceWarnings=window.ReferenceAlerts?ReferenceAlerts.current().filter(r=>r.out):[];report.nasaContextNote='NASA environment / archive data was not included in personal measurements.';
 state.reports.unshift(report);state.reports=state.reports.slice(0,50);state.reportId=report.id;save();renderReports();return report;
}
function analyze(){
 state.alerts=evaluate(state.snapshot,state.environment);
 const critical=state.alerts.filter(a=>a.level==='critical');
 const key=critical.length?`${state.member}-${state.environment}-${critical.map(a=>a.id).sort().join(',')}`:'';
 if(key&&key!==state.lastCritical)makeReport(true);
 state.lastCritical=key;
}
function setGroup(index){state.group=index;state.selected=METRICS.find(m=>m.group===index).id;state.region=METRICS.find(m=>m.id===state.selected).region;render();}
function selectMetric(id){const m=METRICS.find(x=>x.id===id);state.selected=id;state.group=m.group;state.region=m.region;render();}
function selectRegion(region){const r=regionMap[region];state.region=region;state.group=r.group;state.selected=r.metric;render();}
const tabs=document.querySelector('.tabs');
GROUPS.forEach((g,i)=>{const b=document.createElement('button');b.id=`tab-${i}`;b.role='tab';b.textContent=g.name;b.setAttribute('aria-controls','metrics');b.onclick=()=>setGroup(i);b.onkeydown=e=>{const next=e.key==='Home'?0:e.key==='End'?GROUPS.length-1:e.key==='ArrowRight'?(i+1)%5:e.key==='ArrowLeft'?(i+4)%5:null;if(next!==null){e.preventDefault();setGroup(next);document.getElementById(`tab-${next}`).focus();}};tabs.append(b);});
document.querySelectorAll('.hotspot').forEach(b=>b.onclick=()=>selectRegion(b.dataset.region));
function newData(){if(window.OrbitData&&state.dataMode==='manual'){OrbitData.loadContext();return;}state.member=$('crew').value;state.scenario=$('scenario').value;state.snapshot=makeSnapshot(state.member,state.scenario);analyze();render();}
$('crew').onchange=newData;$('scenario').onchange=newData;$('refreshData').onclick=newData;
$('environment').onchange=()=>{state.environment=$('environment').value;if(window.OrbitData&&state.dataMode==='manual'){OrbitData.loadContext();return;}analyze();render();};
document.querySelectorAll('[data-days]').forEach(b=>b.onclick=()=>{state.days=Number(b.dataset.days);renderChart();});
function render(){
 const s=state.snapshot,p=PROFILES[state.environment];
 document.body.dataset.module=state.group;$('gravity').textContent=p.gravity;$('latency').textContent=duration(p.delay);$('avatar').textContent=state.member==='0'?'DK':'EY';
 $('moduleCode').textContent=`MODULE 0${state.group+1} / 05 · ${p.name}`;$('title').textContent=GROUPS[state.group].name;$('desc').textContent=s.mode==='manual'?'Personal measurement records · user-reported · no live device connection':GROUPS[state.group].desc;
 document.querySelectorAll('.tabs button').forEach((b,i)=>{b.setAttribute('aria-selected',String(i===state.group));b.tabIndex=i===state.group?0:-1;});
 const metrics=METRICS.filter(m=>m.group===state.group);$('metricCount').textContent=`${metrics.length} measurements`;
 $('metrics').replaceChildren();
 metrics.forEach(m=>{const b=document.createElement('button');b.className='card'+(isFresh(s,m)?'':' stale');b.dataset.metric=m.id;b.setAttribute('aria-pressed',String(m.id===state.selected));
  const name=document.createElement('span');name.textContent=m.name;const value=document.createElement('strong');value.textContent=s.mode==='manual'&&Number.isFinite(s.values[m.id])?s.values[m.id].toLocaleString('en-US',{maximumFractionDigits:6}):fmt(s.values[m.id],m.digits);const unit=document.createElement('small');unit.textContent=s.mode==='manual'?(window.OrbitData?.schema[m.id][2]||m.unit):m.unit;const tag=document.createElement('span');tag.className='data-tag';tag.textContent=s.mode==='manual'?(s.meta[m.id]?(isFresh(s,m)?'MANUAL ENTRY':'MANUAL ENTRY · OUTDATED'):'NO RECORD'):(isFresh(s,m)?`${m.source} · demo`:'! OUTDATED DATA');b.append(name,value,unit,tag);b.onclick=()=>selectMetric(m.id);$('metrics').append(b);
 });
 document.querySelectorAll('.hotspot').forEach(b=>{b.setAttribute('aria-pressed',String(b.dataset.region===state.region));const alert=state.alerts.some(a=>a.regions.includes(b.dataset.region));b.dataset.alert=String(alert);b.setAttribute('aria-label',`${regionMap[b.dataset.region].name} — open data${alert?' — warning present':''}`);});
 const rd=$('regionDetail');rd.replaceChildren();const heading=document.createElement('strong');heading.textContent=regionMap[state.region].name;rd.append(heading,document.createTextNode(regionMap[state.region].text));
 $('sensorInfo').textContent=state.group===3?'OCT sample from 24 hours ago. The baseline is specific to this person; this is a periodic scan.':state.group===4?'Blood / urine sample from 48 hours ago. Lymphocytes alone do not diagnose radiation effects.':state.group===2?'sEMG score and strength trend are model outputs; ARED load cells do not directly measure bone density.':state.group===1?'HERA: environment µGy/h; CAD: demo personal µSv/h. These quantities are not treated as equivalent.':'Astroskin measurements are simulated. Sleep quality is a derived score in this prototype.';
 if(s.mode==='manual')$('sensorInfo').textContent='These are user-entered records for the selected person and environment. The source is user-supplied; this is not device verification or an automatic NASA import.';
 if($('dataModeBanner'))$('dataModeBanner').textContent=s.mode==='manual'?'PERSONAL RECORD MODE · Missing measurements remain unavailable. Demo rules are not applied. Manual reports are retained for this session only and can be exported as JSON.':'DEMO MODE · Measurements and rules are simulated. Real NASA environment records have a separate screen and are not mixed with these measurements.';
 document.querySelector('header .simulation').textContent=s.mode==='manual'?'PERSONAL RECORD / PROTOTYPE':'SIMULATION / MEDICAL PROTOTYPE';
 renderBudget();renderAlerts();renderSelected();renderReports();renderProfile();window.FutureRisks?.render();window.SpaceTheme?.sync();
 window.OrbitData?.renderHistory();window.ReferenceAlerts?.sync();
}
function renderSelected(){
 const m=METRICS.find(m=>m.id===state.selected),s=state.snapshot,value=fmt(s.values[m.id],m.digits);
 for(const id of ['readingName','floatingName'])$(id).textContent=m.name;
 for(const id of ['readingValue','floatingValue'])$(id).textContent=value;
 for(const id of ['readingUnit','floatingUnit'])$(id).textContent=m.unit;
 if(s.mode==='manual'){
  const record=s.meta[m.id],unit=window.OrbitData?.schema[m.id][2]||m.unit; for(const id of ['readingValue','floatingValue'])$(id).textContent=record?record.value.toLocaleString('en-US',{maximumFractionDigits:6}):'—';
  for(const id of ['readingUnit','floatingUnit'])$(id).textContent=unit;
  $('readingSource').textContent=record?'Manual entry · '+record.source:'No record';$('readingTime').textContent=record?timeText(record.measuredAt)+' ('+ageText(metricAge(s,m))+')':'—';$('readingQuality').textContent=record?(isFresh(s,m)?'User record · current':'User record · outdated'):'No data';$('readingDelta').textContent='Recorded samples only; no synthetic difference';renderChart();return;
 }
 $('readingSource').textContent=m.source+(state.environment==='EVA'&&m.group===1?' · EVA not verified':' · demo');
 $('readingTime').textContent=`${timeText(Date.now()-metricAge(s,m)*1000)} (${ageText(metricAge(s,m))})`;
 $('readingQuality').textContent=isFresh(s,m)?'Simulated / current sample':'OUTDATED · recommendations limited';
 $('readingDelta').textContent='Synthetic series · not an actual difference';renderChart();
}
function renderBudget(){
 const el=$('radiationBudget');el.hidden=state.group!==1;if(el.hidden)return;
 if(state.snapshot.mode==='manual'){el.replaceChildren();const p=document.createElement('p');p.textContent='Personal dose records represent separate quantities. Total dose, remaining career duration and safe stay duration are not calculated without an approved integration / effective dose model.';el.append(p);return;}
 const v=state.snapshot.values,p=PROFILES[state.environment],remaining=Math.max(0,600-v.career),proj=projection(state.snapshot,state.environment);
 el.innerHTML='<h3>Career effective dose record</h3><strong>'+fmt(v.career,1)+' / 600 mSv</strong><progress max="600" value="'+Math.min(600,v.career)+'"></progress><p>'+fmt(remaining,1)+' mSv remaining effective dose allowance · NASA career limit.<br>Daily '+fmt(v.daily,2)+' mSv / 30 days '+fmt(v.monthly,2)+' mSv: separate demo personal dose records; not automatically included in effective dose calculations.</p><h3>Demo session planning projection</h3><strong>'+(proj.hours===null?'No calculation':fmt(proj.hours,1)+' hours')+'</strong><p>'+proj.reason+'<br>Profile budget '+fmt(p.sessionBudget,1)+' mSv; mission cap '+p.sessionHours+' hours. Calculation is limited by the remaining budget and constant demo dose rate.</p>';
}
function renderAlerts(){
 const alerts=state.alerts;const severity=alerts.some(a=>a.level==='critical')?'critical':alerts.some(a=>a.level==='hold')?'hold':alerts.length?'warning':'nominal';
 const labels={critical:'CRITICAL DEMO EVENT',warning:'REVIEW REQUIRED · DEMO',hold:'DATA / HARDWARE LIMITATION',nominal:'NO DEMO RULE TRIGGERED'};
 if(state.snapshot.mode==='manual')labels.hold='PERSONAL RECORD / NO CLINICAL MODEL';
 $('statusLabel').textContent=labels[severity];document.querySelector('.decision-summary').dataset.severity=severity;
 $('statusDescription').textContent=alerts.length?`${alerts.length} rule findings. ${severity==='critical'?'A dual-destination report was automatically placed in the local simulation queue.':'Supporting evidence is shown below.'}`:'This result is not a health or flight-fitness clearance. Monitoring continues using an illustrative profile.';
 $('alerts').replaceChildren();
 if(!alerts.length){const e=document.createElement('p');e.className='empty-note';e.textContent='No cross-alert in this sample. Switch scenarios to explore exertion, radiation, musculoskeletal, SANS or stale-data cases.';$('alerts').append(e);}
 alerts.forEach(a=>{const box=document.createElement('article');box.className='alert';box.dataset.level=a.level;const h=document.createElement('div');h.className='alert-header';const title=document.createElement('h3');title.textContent=a.title;const status=document.createElement('span');status.textContent=a.level==='critical'?'! CRITICAL / DEMO':a.level==='hold'?'! LIMITATION / DEMO':'! REVIEW / DEMO';h.append(title,status);const evidence=document.createElement('p');evidence.className='evidence';evidence.textContent='Evidence: '+a.evidence;const action=document.createElement('p');action.textContent=a.action;const protocol=document.createElement('p');protocol.className='protocol';protocol.textContent=a.protocol;box.append(h,evidence,action,protocol);$('alerts').append(box);});
}
function renderProfile(){const p=PROFILES[state.environment];$('profileTable').innerHTML=`<table><caption>${p.name} — ILLUSTRATIVE PROFILE / NOT A MEDICAL THRESHOLD</caption><tr><th>Demo rule input</th><th>Value</th></tr><tr><td>Personal dose rate</td><td>${p.doseRate} µSv/h</td></tr><tr><td>Heart rate / fatigue</td><td>${p.hr} bpm / %${p.fatigue}</td></tr><tr><td>OCT baseline change / urinary Ca</td><td>${p.oct} µm / ${p.calcium} mg/24 h</td></tr><tr><td>Session budget / duration cap</td><td>${p.sessionBudget} mSv / ${p.sessionHours} hours</td></tr><tr><td>Live data freshness limit</td><td>Vitals / dose 120 s; muscle 300 s</td></tr><tr><td>Periodic data freshness limit</td><td>OCT 7 days; lab 72 hours</td></tr></table>`;}
function renderChart(){
 if(state.snapshot.mode==='manual'){window.OrbitData?.drawChart($('plot'),METRICS.find(m=>m.id===state.selected),state.days);return;}
 const m=METRICS.find(m=>m.id===state.selected),current=state.snapshot.values[m.id],n=state.days,canvas=$('plot');
 $('chartTitle').textContent=m.name+' · demo trend';$('period').textContent=`${n} synthetic samples · ${m.unit}`;
 document.querySelectorAll('[data-days]').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.days)===n)));
 const cumulative=['daily','monthly','career'].includes(m.id);
 const values=Array.from({length:n},(_,i)=>{const age=n-1-i;return cumulative?Math.max(0,current-age*m.spread*.15):current+m.spread*(Math.sin(age*.7+state.group)-Math.sin(state.group))*.63;});
 const lo=Math.min(...values)-m.spread*.5,hi=Math.max(...values)+m.spread*.5,w=canvas.clientWidth,h=canvas.clientHeight,dpr=devicePixelRatio||1;if(w<60)return;
 canvas.width=w*dpr;canvas.height=h*dpr;const c=canvas.getContext('2d');c.scale(dpr,dpr);c.font='10px Segoe UI';const l=49,r=w-12,t=16,b=h-25,x=i=>l+(r-l)*i/(n-1),y=v=>b-(v-lo)*(b-t)/(hi-lo);
 for(let i=0;i<4;i++){const v=lo+(hi-lo)*i/3;c.strokeStyle='#46504a';c.beginPath();c.moveTo(l,y(v));c.lineTo(r,y(v));c.stroke();c.fillStyle='#bdc9c0';c.textAlign='right';c.fillText(fmt(v,m.digits),l-8,y(v)+3);}
 c.strokeStyle='#a4d8c6';c.lineWidth=2;c.beginPath();values.forEach((v,i)=>i?c.lineTo(x(i),y(v)):c.moveTo(x(i),y(v)));c.stroke();c.fillStyle='#b0e8ce';c.beginPath();c.arc(r,y(current),3,0,Math.PI*2);c.fill();
 c.fillStyle='#bdc9c0';c.textAlign='left';c.fillText('Sample 1',l,h-5);c.textAlign='right';c.fillText('Sample '+n,r,h-5);canvas.setAttribute('aria-label',`${m.name}, ${n} synthetic samples. Last demo value ${fmt(current,m.digits)} ${m.unit}.`);
}
function reportText(r){const out=[`ORBIT / ${r.id}`,`DATA: ${r.dataMode==='manual'?'PERSONAL RECORD':'SIMULATION'} — NO ACTUAL TRANSMISSION`,`${timeText(r.created)} | ${r.crew} | ${PROFILES[r.environment].name}`,`Profile: ${r.profile}`,`Sample time: ${timeText(r.snapshot.at)}`,`Local clinician: ${r.routes.station.state}`,`Earth: ${r.routes.earth.state}`,`One-way demo delay: ${duration(r.delaySeconds)}`,``, 'FINDINGS',...r.findings.map(a=>`${a.level.toUpperCase()} / ${a.title}\n${a.evidence}\nDraft: ${a.action}`),'','MEASUREMENTS',...METRICS.map(m=>r.dataMode==='manual'?`${m.name}: ${r.snapshot.meta?.[m.id]?r.snapshot.values[m.id].toLocaleString('en-US',{maximumFractionDigits:6})+' '+r.snapshot.meta[m.id].unit+' | manual entry: '+r.snapshot.meta[m.id].source+' | measurements '+timeText(r.snapshot.meta[m.id].measuredAt):'NO RECORD'}`:`${m.name}: ${fmt(r.snapshot.values[m.id],m.digits)} ${m.unit} | ${m.source} | age ${metricAge(r.snapshot,m,r.created)} s`),'','LIMITATIONS',...r.limitations];if(r.futureRisks){const f=r.futureRisks;out.push('','FUTURE RISKS / ASSUMPTIONS',`${f.days} days / dose rate reduction %${f.reduction}`,f.clinicalPrediction,f.exposure?`Additional personal dose: continued ${fmt(f.exposure.continued,2)} mSv / reduced ${fmt(f.exposure.reduced,2)} mSv`:f.exposureReason,...f.problems.map(p=>`${p.title}: ${p.label}\nLimitation: ${p.missing}`));}if(r.referenceWarnings?.length)out.push('','REFERENCE INTERVAL WARNINGS',...r.referenceWarnings.map(a=>a.message));return out.join('\n');}
function renderReports(){
 const el=$('reportQueue');el.replaceChildren();
 state.reports.forEach(r=>{const b=document.createElement('button');b.className='queue-item';b.setAttribute('aria-pressed',String(r.id===state.reportId));const title=document.createElement('strong');title.textContent=`${r.automatic?'Automatic critical':'Manual'} · ${r.crew}`;const context=document.createElement('span');context.textContent=`${r.dataMode==='manual'?'PERSONAL RECORD':'DEMO'} / ${PROFILES[r.environment].name} / ${timeText(r.created)}`;const routes=document.createElement('span');const left=Math.max(0,Math.ceil((r.routes.earth.due-Date.now())/1000));routes.textContent=`Local: ${r.routes.station.state}\nEarth: ${r.routes.earth.state}${r.routes.earth.state.includes('queue')?' · remaining '+duration(left):''}`;b.append(title,context,routes);b.onclick=()=>{state.reportId=r.id;renderReports();};el.append(b);});
 if(!state.reports.length)el.textContent='No reports yet. Try a critical scenario or create a report manually.';
 const selected=state.reports.find(r=>r.id===state.reportId);$('reportPreview').textContent=selected?reportText(selected):'Select a report. Medical officer and Earth destinations are tracked separately.';$('exportReport').disabled=!selected;
}
function deliver(now=Date.now()){
 let n=0;state.reports.forEach(r=>{if(r.routes.earth.due<=now&&r.routes.earth.state.includes('queue')){r.routes.earth.state='Demo: received on Earth';r.routes.earth.at=now;n++;}});save();renderReports();return n;
}
$('createReport').onclick=()=>{makeReport(false);$('reportStatus').textContent='Summary created; both destinations are simulated locally.';};
$('simulateDelivery').onclick=()=>{$('reportStatus').textContent=`${deliver()} reports marked received by the demo Earth recipient. Reports whose delay has not elapsed remain queued. No actual transmission occurred.`;};
$('exportReport').onclick=()=>{const r=state.reports.find(r=>r.id===state.reportId);if(r&&window.chrome?.webview){window.chrome.webview.postMessage({type:'export-report',report:r});$('reportStatus').textContent='The report save dialog is open; select a file.';}};
let timer=null,remaining=60;
function paintClock(){$('pauseClock').textContent=`${String(Math.floor(remaining/60)).padStart(2,'0')}:${String(remaining%60).padStart(2,'0')}`;}
$('pauseButton').onclick=()=>{if(timer){clearInterval(timer);timer=null;$('pauseButton').textContent='Resume';return;}if(remaining===0)remaining=60;$('pauseButton').textContent='Pause';timer=setInterval(()=>{remaining--;paintClock();if(remaining<=0){clearInterval(timer);timer=null;$('pauseButton').textContent='Restart';}},1000);};
$('pauseReset').onclick=()=>{clearInterval(timer);timer=null;remaining=60;paintClock();$('pauseButton').textContent='Start timer';};
setInterval(renderReports,1000);setInterval(()=>{analyze();render();},30000);new ResizeObserver(renderChart).observe($('plot'));state.reportId=state.reports[0]?.id||null;analyze();render();
window.ORBIT={state,selectMetric,selectRegion,setGroup,newData,makeReport,deliver,render,analyze};
