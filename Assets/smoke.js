(() => {
 const checks=[]; OrbitData.setMode('demo');const check=(name,ok)=>checks.push({name,ok:!!ok});const E=OrbitEngine,O=ORBIT;
 localStorage.removeItem('orbit-decision-reports-v1');O.state.reports=[];
 check('image loaded',document.querySelector('.anatomy img').naturalWidth>0);
 check('five modules',document.querySelectorAll('.tabs button').length===5);
 for(let group=0;group<5;group++){
  O.setGroup(group);check('metric count '+group,document.querySelectorAll('.card').length===[3,5,3,2,2][group]);
  for(const crew of ['0','1']){
   document.getElementById('crew').value=crew;O.newData();
   for(const m of E.METRICS.filter(m=>m.group===group)){
    O.selectMetric(m.id);
    check('selected '+m.id+crew,document.getElementById('readingValue').textContent===document.querySelector(`[data-metric="${m.id}"] strong`).textContent);
    check('floating '+m.id+crew,document.getElementById('floatingValue').textContent===document.getElementById('readingValue').textContent);
   }
  }
 }
 for(const r of ['head','eyes','chest','muscle','lab','radiation']){document.querySelector(`[data-region="${r}"]`).click();check('region '+r,O.state.region===r);}
 const nominal=E.makeSnapshot('0','nominal');check('nominal no alarm',E.evaluate(nominal,'ISS').length===0);
 const exertion=E.makeSnapshot('0','exertion');check('strain cross rule',E.evaluate(exertion,'ISS').some(a=>a.id==='strain'));
 const storm=E.makeSnapshot('0','storm');check('storm critical',E.evaluate(storm,'ISS').some(a=>a.level==='critical'));check('blood cross rule',E.evaluate(storm,'ISS').some(a=>a.id==='blood'));
 check('bone cross rule',E.evaluate(E.makeSnapshot('0','bone'),'ISS').some(a=>a.id==='bone'));
 check('sans cross rule',E.evaluate(E.makeSnapshot('0','sans'),'ISS').some(a=>a.id==='sans'));
 const aged=E.makeSnapshot('0','nominal',Date.now()-180000);check('elapsed time makes stale',E.evaluate(aged,'ISS').some(a=>a.id==='quality')); const stale=E.makeSnapshot('0','stale');stale.values.rate=1000;stale.solarEvent=true;check('stale suppress radiation',!E.evaluate(stale,'ISS').some(a=>a.id==='storm'));check('stale blocks projection',E.projection(stale,'ISS').hours===null);
 check('EVA blocks CAD rules',E.evaluate(storm,'EVA').every(a=>!['storm','blood'].includes(a.id)));check('EVA blocks projection',E.projection(storm,'EVA').hours===null);
 check('profile projections differ',E.projection(nominal,'ISS').hours!==E.projection(nominal,'Moon').hours);
 const near=E.makeSnapshot('0','nominal');near.values.career=610;check('career over limit alarm',E.evaluate(near,'ISS').some(a=>a.id==='career'));
 document.getElementById('environment').value='Mars';document.getElementById('environment').dispatchEvent(new Event('change'));
 document.getElementById('scenario').value='storm';O.newData();const count=O.state.reports.length;check('automatic critical report',count>0&&O.state.reports[0].automatic);
 O.render();O.analyze();check('same event deduplicated',O.state.reports.length===count);
 const r=O.state.reports[0];check('two destinations',r.routes.station&&r.routes.earth);check('Mars delay',r.routes.earth.due-r.created===1200000);
 O.deliver(r.created+1000);check('no early delivery',r.routes.earth.state.includes('queue'));
 O.deliver(r.routes.earth.due+1);check('delivery after delay',r.routes.earth.state.includes('received'));
 check('report snapshot immutable',r.snapshot.values.rate===420);check('stored queue',JSON.parse(localStorage.getItem('orbit-decision-reports-v1')).length>0);
 document.getElementById('scenario').value='nominal';O.newData();check('report preserved after scenario change',r.snapshot.scenario==='storm');
 document.querySelector('[data-days="30"]').click();check('chart range',O.state.days===30);
 document.getElementById('pauseButton').click();check('timer starts',document.getElementById('pauseButton').textContent==='Pause');document.getElementById('pauseReset').click();check('timer resets',document.getElementById('pauseClock').textContent==='01:00');
 check('no horizontal overflow',document.documentElement.scrollWidth<=window.innerWidth);
 const selectedMetric=O.state.selected,reportCount=O.state.reports.length;
 for(const route of ['decision','future','reports','profiles','health']){
  document.querySelector(`.side-link[data-route="${route}"]`).click();
  check('page route '+route,OrbitPages.current===route&&location.hash==='#/'+route);
  check('only one page '+route,[...document.querySelectorAll('.app-page[data-page]')].filter(p=>!p.hidden).length===1);
  check('correct visible page '+route,!document.querySelector(`.app-page[data-page="${route}"]`).hidden);
  check('active sidebar '+route,document.querySelector('.side-link[aria-current="page"]').dataset.route===route);
 }
 check('metric selection preserved',O.state.selected===selectedMetric);
 check('reports preserved across pages',O.state.reports.length===reportCount);
 const F=FutureRisks,base=E.makeSnapshot('0','nominal');
 const forecast=F.assess(base,'ISS',7,50);
 check('future four domains',forecast.problems.length===4);
 check('future dose arithmetic',Math.abs(forecast.exposure.continued-3.696)<.000001);
 check('future reduction arithmetic',Math.abs(forecast.exposure.reduced-1.848)<.000001);
 check('future no reduction',F.assess(base,'ISS',7,0).exposure.reduced===forecast.exposure.continued);
 check('future reduction clamped',F.assess(base,'ISS',7,120).reduction===80);
 check('future horizon clamped',F.assess(base,'ISS',100,50).days===30);
 check('future no clinical probability',forecast.clinicalPrediction.includes('Prediction unavailable'));
 check('future no career dose addition',base.values.career===142.6);
 check('future stale blocks dose',F.assess(E.makeSnapshot('0','stale'),'ISS',7,50).exposure===null);
 check('future EVA blocks dose',F.assess(base,'EVA',7,50).exposure===null);
 check('future storm blocks extrapolation',F.assess(E.makeSnapshot('0','storm'),'ISS',7,50).exposure===null);
 check('future bone warning',F.assess(E.makeSnapshot('0','bone'),'ISS').problems.find(p=>p.id==='bone').watch);
 check('future SANS warning',F.assess(E.makeSnapshot('0','sans'),'ISS').problems.find(p=>p.id==='sans').watch);
 OrbitPages.navigate('future');F.render();
 check('future card rendering',document.querySelectorAll('.future-card').length===4);
 document.getElementById('futureDays').value='30';document.getElementById('futureDays').dispatchEvent(new Event('change'));
 check('future horizon control',F.last.days===30);
 document.getElementById('futureReduction').value='0';document.getElementById('futureReduction').dispatchEvent(new Event('input'));
 check('future reduction control',F.last.reduction===0);
 const beforeFutureReports=O.state.reports.length;
 document.getElementById('futureReport').click();
 check('future report generated',O.state.reports.length===beforeFutureReports+1);
 const futureReport=O.state.reports[0];
 check('future report contains assumptions',futureReport.futureRisks.days===30&&futureReport.futureRisks.reduction===0);
 document.getElementById('futureDays').value='7';document.getElementById('futureDays').dispatchEvent(new Event('change'));
 check('future report immutable',futureReport.futureRisks.days===30);
 OrbitPages.navigate('reports');
 check('future report preview',document.getElementById('reportPreview').textContent.includes('FUTURE RISKS'));
 document.querySelector('.decision-summary a').click();check('decision shortcut opens page',OrbitPages.current==='decision');
 OrbitPages.navigate('health');
 const oldEnvironment=document.getElementById('environment').value;
 SpaceTheme.setEnabled(true);
 check('space theme on',document.body.dataset.spaceTheme==='on');
 check('space toggle accessibility',document.getElementById('spaceThemeToggle').getAttribute('aria-pressed')==='true');
 check('space strip visible',getComputedStyle(document.querySelector('.space-mission-strip')).display!=='none');
 const colors=[];
 for(const environment of ['ISS','Moon','Mars','EVA']){
  document.getElementById('environment').value=environment;document.getElementById('environment').dispatchEvent(new Event('change'));
  check('space environment '+environment,document.body.dataset.spaceEnvironment===environment);
  check('space location text '+environment,document.getElementById('spaceLocation').textContent.length>0);
  colors.push(getComputedStyle(document.body).getPropertyValue('--space-accent').trim());
 }
 check('distinct environment colors',new Set(colors).size===4);
 const metricColorOn=getComputedStyle(document.querySelector('.card')).backgroundColor;
 const dataBeforeToggle=JSON.stringify(O.state.snapshot);
 SpaceTheme.setEnabled(false);
 check('space strip hides',getComputedStyle(document.querySelector('.space-mission-strip')).display==='none');
 check('space decorative sky hides',getComputedStyle(document.querySelector('.space-sky')).display==='none');
 check('metric identity color preserved',getComputedStyle(document.querySelector('.card')).backgroundColor===metricColorOn);
 check('theme does not change medical data',JSON.stringify(O.state.snapshot)===dataBeforeToggle);
 check('space preference stored',localStorage.getItem('orbit-space-theme-v1')==='off');
 document.getElementById('spaceThemeToggle').click();check('space toggle button',SpaceTheme.enabled);
 document.getElementById('environment').value=oldEnvironment;document.getElementById('environment').dispatchEvent(new Event('change'));
 check('space theme no horizontal overflow',document.documentElement.scrollWidth<=innerWidth);
 check('supernova asset loaded',SupernovaTheme.image.complete&&SupernovaTheme.image.naturalWidth>0);
 check('supernova on application background',getComputedStyle(document.querySelector('.app')).backgroundImage.includes('supernova.png'));
 check('supernova brightness fixed at sixty',SupernovaTheme.brightness===60);
 check('palette toolbar removed',!document.querySelector('.supernova-tools'));
 const sidebarMetric=O.state.selected;
 OrbitSidebar.setCollapsed(true);check('sidebar collapses',document.body.dataset.sidebar==='collapsed');
 check('sidebar hides text',getComputedStyle(document.querySelector('.sidebar .nav-text')).display==='none');
 document.getElementById('sidebarToggle').click();check('sidebar expands by button',!OrbitSidebar.collapsed&&document.getElementById('sidebarToggle').getAttribute('aria-expanded')==='true');
 document.querySelector('.sidebar .side-link[data-route="reports"]').click();check('sidebar navigation preserved',OrbitPages.current==='reports');
 document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}));check('sidebar closes by escape',OrbitSidebar.collapsed);
 check('sidebar preference saved',localStorage.getItem('orbit-sidebar-collapsed-v1')==='true');
 check('sidebar keeps selected metric',O.state.selected===sidebarMetric);
 OrbitPages.navigate('health');
 localStorage.removeItem('orbit-decision-reports-v1');
 window.testResults=checks; if(window.OrbitDataTests){window.OrbitDataTests(check).then(()=>window.testDone=checks.every(c=>c.ok)).catch(error=>{check('data test exception: '+error.message,false);window.testDone=false;});return 'pending';}
 return checks.every(c=>c.ok);
})()
