(() => {
 const E=OrbitEngine,O=ORBIT,byId=id=>document.getElementById(id);
 const schema={hr:[1,350,'bpm'],resp:[1,120,'breaths/min'],sleep:[0,100,'/100'],rate:[0,10000000,'µSv/h'],area:[0,10000000,'µGy/h'],daily:[0,10000,'mSv'],monthly:[0,100000,'mSv'],career:[0,100000,'mSv'],fatigue:[0,100,'%'],force:[0,100000,'N'],strength:[-100,500,'%'],oct:[-1000,1000,'µm'],blur:[0,10,'/10'],lymph:[0,100,'×10⁹/L'],calcium:[0,10000,'mg/24 h']};
 let records=[],ready=false,busy=false,pendingCsv=[];
 function number(text){if(typeof text==='number')return text;const t=String(text).trim();if(!/^[+-]?\d+(?:[.,]\d+)?$/.test(t))return NaN;return Number(t.replace(',','.'));}
 function validate(input,now=Date.now()){
  const m=E.METRICS.find(m=>m.id===input.metric);if(!m)throw Error('Unknown measurement code: '+input.metric);
  const value=number(input.value),[min,max,unit]=schema[m.id];
  if(!Number.isFinite(value)||value<min||value>max)throw Error(`${m.name}: ${min}–${max} numeric value required. This validation range is not a medical reference interval.`);
  // Legacy labels denote the same units: only the language changes, never the value.
  const legacyUnits={'atım/dk':'bpm','nefes/dk':'breaths/min','µSv/saat':'µSv/h','µGy/saat':'µGy/h','mg/24 saat':'mg/24 h'};
  if((legacyUnits[input.unit]||input.unit)!==unit)throw Error(`${m.name}: unit ${unit} is required; no automatic unit conversion was performed.`);
  const raw=String(input.measuredAt||'');if(!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?Z$/.test(raw))throw Error('Time must be in UTC and end with Z.');
  const measuredAt=Date.parse(raw);if(!Number.isFinite(measuredAt)||new Date(measuredAt).toISOString().slice(0,16)!==raw.slice(0,16)||measuredAt>now+3000||measuredAt<Date.UTC(2000,0,1))throw Error('Measurement time is invalid or in the future.');
  const source=String(input.source||'').trim(),note=String(input.note||'').trim();if(source.length<3||source.length>120)throw Error('Source description must contain 3–120 characters.');if(note.length>400)throw Error('Note must not exceed 400 characters.');
  if(!['0','1'].includes(String(input.member))||!E.PROFILES[input.environment])throw Error('Invalid crew member or environment.');
  const context=['rest','activity','sleep','normal-diet','other-diet','unknown'].includes(input.context)?input.context:'unknown';
  let reference=null;
  if(input.reference){const low=number(input.reference.low),high=number(input.reference.high),refSource=String(input.reference.source||'').trim();if(!Number.isFinite(low)||!Number.isFinite(high)||low>=high||low<min||high>max||refSource.length<3||refSource.length>120)throw Error('Invalid reference limits or source description.');reference={low,high,source:refSource};}
  return {id:typeof input.id==='string'?input.id:crypto.randomUUID(),metric:m.id,value,unit,measuredAt,source,note,member:String(input.member),environment:input.environment,enteredAt:now,kind:'manual',context,reference};
 }
 function snapshot(member,environment,now=Date.now()){
  const matching=records.filter(r=>r.member===member&&r.environment===environment).sort((a,b)=>a.measuredAt-b.measuredAt||a.enteredAt-b.enteredAt);
  const values={},meta={},history={};for(const m of E.METRICS){const all=matching.filter(r=>r.metric===m.id);history[m.id]=all;const latest=all.at(-1);values[m.id]=latest?.value??null;if(latest)meta[m.id]=latest;}
  return {id:'manual-'+member+'-'+environment+'-'+now,at:now,member,environment,scenario:'manual',mode:'manual',values,meta,history,age:{vital:Infinity,radiation:Infinity,muscle:Infinity,oct:Infinity,lab:Infinity},quality:'manual',baseline:{},solarEvent:false};
 }
 function loadContext(){if(O.state.dataMode==='manual'){O.state.member=byId('crew').value;O.state.snapshot=snapshot(O.state.member,O.state.environment);O.analyze();O.render();}renderHistory();}
 function setMode(mode){O.state.dataMode=mode==='demo'?'demo':'manual';byId('dataMode').value=O.state.dataMode;byId('scenario').disabled=O.state.dataMode!=='demo';byId('refreshData').textContent=O.state.dataMode==='demo'?'New demo sample':'Refresh records';try{localStorage.setItem('orbit-data-mode-v1',O.state.dataMode);}catch{}if(O.state.dataMode==='manual')loadContext();else O.newData();}
 async function commit(items){if(!ready)throw Error('Local record storage is not ready yet.');if(busy)throw Error('Wait for the previous save operation to finish.');
  const fingerprint=r=>JSON.stringify([r.metric,r.member,r.environment,r.measuredAt,r.value,r.source,r.context||'unknown',r.reference||null]);const seen=new Set(records.map(fingerprint));
  const unique=items.filter(item=>{const key=fingerprint(item);if(seen.has(key))return false;seen.add(key);return true;});
  const next=[...records,...unique];if(next.length>1000)throw Error('The 1,000-record limit has been reached. No records were automatically deleted.');busy=true;
  try{await OrbitBridge.request('manual-save',{records:next});records=next;loadContext();return unique.length;}finally{busy=false;}
 }
 function renderHistory(){
  const person=byId('crew').value,env=O.state.environment;byId('manualContext').textContent=`${person==='0'?'AST-01 · Deniz Kaya':'AST-02 · Ece Yıldız'} / ${E.PROFILES[env].name} — records belong to this person and environment.`;
  const list=records.filter(r=>r.member===person&&r.environment===env).sort((a,b)=>b.measuredAt-a.measuredAt);
  byId('recordCount').textContent=`${list.length} records · latest 50 shown`;
  byId('manualHistory').replaceChildren();list.slice(0,50).forEach(r=>{const row=document.createElement('tr');for(const text of [E.METRICS.find(m=>m.id===r.metric).name,`${r.value} ${r.unit}`,new Date(r.measuredAt).toISOString().replace('T',' ').slice(0,19),r.source]){const cell=document.createElement('td');cell.textContent=text;row.append(cell);}byId('manualHistory').append(row);});
  if(!list.length){const row=document.createElement('tr'),cell=document.createElement('td');cell.colSpan=4;cell.textContent='No records for this person and environment.';row.append(cell);byId('manualHistory').append(row);}
 }
 function parseCsv(text,context){
  text=text.replace(/^\uFEFF/,'');if(text.length>1000000)throw Error('CSV exceeds the 1 MB limit.');const sep=text.split(/\r?\n/,1)[0].includes(';')?';':',';const rows=[];let row=[],field='',quote=false;
  for(let i=0;i<text.length;i++){const ch=text[i];if(ch==='"'){if(quote&&text[i+1]==='"'){field+='"';i++;}else{quote=!quote;}}else if(ch===sep&&!quote){row.push(field);field='';}else if((ch==='\n'||ch==='\r')&&!quote){if(ch==='\r'&&text[i+1]==='\n')i++;row.push(field);if(row.some(v=>v.trim()))rows.push(row);row=[];field='';}else field+=ch;}
  if(quote)throw Error('CSV contains an unclosed quotation mark.');row.push(field);if(row.some(v=>v.trim()))rows.push(row);
  const headers=rows.shift()?.map(v=>v.trim());const required=['metric','value','unit','measuredAt','source'];if(!headers||required.some(k=>!headers.includes(k))||new Set(headers).size!==headers.length)throw Error('CSV headers are missing or duplicated.');
  if(headers.some(k=>![...required,'note','context','referenceLow','referenceHigh','referenceSource'].includes(k)))throw Error('Unknown column. Crew member / environment are taken from the selections above.');if(!rows.length||rows.length>1000)throw Error('CSV must contain 1–1,000 data rows.');
  return rows.map((fields,i)=>{if(fields.length!==headers.length)throw Error(`Row ${i+2}: incorrect column count.`);const raw=Object.fromEntries(headers.map((h,j)=>[h,fields[j]]));try{return validate({...raw,...context,reference:(raw.referenceLow||raw.referenceHigh)?{low:raw.referenceLow,high:raw.referenceHigh,source:raw.referenceSource}:null});}catch(error){throw Error(`Row ${i+2}: ${error.message}`);}});
 }
 function drawChart(canvas,m,count){
  const samples=(O.state.snapshot.history[m.id]||[]).slice(-count),w=canvas.clientWidth,h=canvas.clientHeight,d=devicePixelRatio||1;if(w<50)return;canvas.width=w*d;canvas.height=h*d;const c=canvas.getContext('2d');c.scale(d,d);c.fillStyle='#c2dde4';c.font='11px Segoe UI';
  byId('chartTitle').textContent=m.name+' · record history';byId('period').textContent=`${samples.length} actual user records · ${schema[m.id][2]}`;canvas.setAttribute('aria-label',`${m.name}, ${samples.length} user records. No synthetic intermediate values.`);
  if(!samples.length){c.fillText('No records for this measurement.',20,40);return;}
  const values=samples.map(r=>r.value),min=Math.min(...values),max=Math.max(...values),pad=Math.max((max-min)*.15,Math.abs(max)*.01,.1),lo=min-pad,hi=max+pad,first=samples[0].measuredAt,last=samples.at(-1).measuredAt;
  const x=r=>last===first?w/2:50+(r.measuredAt-first)/(last-first)*(w-70),y=v=>h-35-(v-lo)/(hi-lo)*(h-55);c.strokeStyle='#637f9a';
  for(let i=0;i<3;i++){const v=lo+(hi-lo)*i/2;c.beginPath();c.moveTo(45,y(v));c.lineTo(w-15,y(v));c.stroke();c.fillText(v.toFixed(m.digits),3,y(v)+3);}
  // Discrete records only: no invented continuous laboratory curve.
  samples.forEach(r=>{c.beginPath();c.arc(x(r),y(r.value),4,0,Math.PI*2);c.fillStyle='#c2dde4';c.fill();});
  c.fillStyle='#c2dde4';c.fillText(new Date(first).toISOString().slice(5,16).replace('T',' '),45,h-8);c.textAlign='right';c.fillText(new Date(last).toISOString().slice(5,16).replace('T',' '),w-15,h-8);
 }
 E.METRICS.forEach(m=>{const o=document.createElement('option');o.value=m.id;o.textContent=m.name;byId('manualMetric').append(o);});
 const updateUnit=()=>byId('manualUnit').value=schema[byId('manualMetric').value][2];byId('manualMetric').onchange=updateUnit;updateUnit();byId('manualTime').value=new Date().toISOString().slice(0,16);
 byId('manualForm').onsubmit=async event=>{event.preventDefault();byId('manualSave').disabled=true;try{const item=validate({metric:byId('manualMetric').value,value:byId('manualValue').value,unit:byId('manualUnit').value,measuredAt:byId('manualTime').value+'Z',source:byId('manualSource').value,note:byId('manualNote').value,member:byId('crew').value,environment:O.state.environment,context:byId('manualMeasureContext').value,reference:(byId('manualRefLow').value!==''||byId('manualRefHigh').value!=='')?{low:byId('manualRefLow').value,high:byId('manualRefHigh').value,source:byId('manualRefSource').value}:null});const n=await commit([item]);byId('manualStatus').textContent=n?'Record saved to the encrypted local file.':'This record already exists; no duplicate was added.';setMode('manual');}catch(error){byId('manualStatus').textContent=error.message;}finally{byId('manualSave').disabled=false;}};
 byId('manualCsv').onchange=async event=>{pendingCsv=[];byId('csvCommit').disabled=true;try{const file=event.target.files[0];if(!file)return;if(file.size>1000000)throw Error('File must not exceed 1 MB.');pendingCsv=parseCsv(await file.text(),{member:byId('crew').value,environment:O.state.environment});byId('csvPreview').textContent=`${pendingCsv.length} rows validated. Crew member: ${pendingCsv[0].member==='0'?'Deniz Kaya':'Ece Yıldız'}, environment: ${E.PROFILES[pendingCsv[0].environment].name}. First record: ${pendingCsv[0].metric} = ${pendingCsv[0].value} ${pendingCsv[0].unit}. Not saved yet.`;byId('csvCommit').disabled=false;byId('csvStatus').textContent='Review the preview, then select Import.';}catch(error){byId('csvStatus').textContent=error.message;byId('csvPreview').textContent='No records to import.';}};
 byId('csvCommit').onclick=async()=>{byId('csvCommit').disabled=true;try{if(pendingCsv.some(r=>r.member!==byId('crew').value||r.environment!==O.state.environment))throw Error('Crew member or environment changed; select the CSV file again.');const n=await commit(pendingCsv);byId('csvStatus').textContent=`${n} new records saved.`;pendingCsv=[];setMode('manual');}catch(error){byId('csvStatus').textContent=error.message;}};
 byId('csvTemplate').onclick=()=>{byId('csvExample').hidden=!byId('csvExample').hidden;byId('csvExample').textContent='metric,value,unit,measuredAt,source\nhr,72,bpm,'+new Date().toISOString().slice(0,19)+'Z,User device record';};
 const modeLabel=document.createElement('label');modeLabel.className='data-mode-control';modeLabel.innerHTML='Data mode<select id="dataMode"><option value="manual">Personal records</option><option value="demo">Separate demo scenarios</option></select>';document.querySelector('.context-bar').prepend(modeLabel);
 const banner=document.createElement('p');banner.id='dataModeBanner';banner.className='data-mode-banner';document.querySelector('.context-bar').after(banner);
 byId('dataMode').onchange=e=>setMode(e.target.value);
 window.OrbitData={schema,validate,parseCsv,snapshot,loadContext,setMode,renderHistory,drawChart,commit,get records(){return records;},get ready(){return ready;}};
 let preferred='manual';try{preferred=localStorage.getItem('orbit-data-mode-v1')||'manual';}catch{}setMode(preferred);
 OrbitBridge.request('manual-load').then(data=>{if(!Array.isArray(data))throw Error('Invalid local record file format.');records=data.map(r=>validate({...r,measuredAt:new Date(r.measuredAt).toISOString()},r.enteredAt||Date.now()));ready=true;byId('manualStatus').textContent='Encrypted local record storage tied to this Windows user is ready.';loadContext();}).catch(error=>{byId('manualStatus').textContent='Could not open record storage: '+error.message+' Existing records were not deleted; new records cannot be saved.';});
})();
