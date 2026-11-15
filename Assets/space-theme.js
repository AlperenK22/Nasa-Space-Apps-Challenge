(() => {
 const key='orbit-space-theme-v1';let enabled=true;try{enabled=localStorage.getItem(key)!=='off';}catch{}
 const sky=document.createElement('div');sky.className='space-sky';sky.setAttribute('aria-hidden','true');document.querySelector('.app').prepend(sky);
 const toggle=document.createElement('button');toggle.type='button';toggle.id='spaceThemeToggle';toggle.className='space-theme-toggle';
 toggle.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><circle cx="12" cy="12" r="6"/><ellipse cx="12" cy="12" rx="11" ry="3.5" transform="rotate(-28 12 12)"/></svg><span></span>';
 document.querySelector('.header-right').prepend(toggle);
 const strip=document.createElement('section');strip.className='space-mission-strip';strip.setAttribute('aria-label','Mission overview');
 strip.innerHTML='<div class="space-location"><span class="space-orbit-symbol" aria-hidden="true">◎</span><div><small>MISSION ENVIRONMENT</small><strong id="spaceLocation"></strong></div></div><div><small>MISSION DAY</small><strong>042</strong></div><div><small>EARTH / ONE WAY</small><strong id="spaceDelay"></strong></div><div class="space-link-state"><small>DATA LINK</small><strong>○ SIMULATION / YEREL</strong></div>';
 document.getElementById('section').prepend(strip);
 const orbit=document.createElement('div');orbit.className='space-body-orbit';orbit.setAttribute('aria-hidden','true');document.getElementById('bodyMap').prepend(orbit);
 function sync(){
  const environment=window.ORBIT?.state.environment||'ISS';document.body.dataset.spaceEnvironment=environment;
  const descriptions={ISS:'ISS / Earth orbit',Moon:'MOON / Surface mission',Mars:'MARS / Surface mission',EVA:'EVA / External activity'};
  document.getElementById('spaceLocation').textContent=descriptions[environment];
  const delay=OrbitEngine.PROFILES[environment].delay;
  document.getElementById('spaceDelay').textContent=delay<60?`${delay} s · demo`:`${delay/60} min · demo`;
 }
 function setEnabled(value){enabled=!!value;document.body.dataset.spaceTheme=enabled?'on':'off';toggle.setAttribute('aria-pressed',String(enabled));toggle.querySelector('span').textContent=enabled?'Space theme on':'Space theme off';toggle.setAttribute('aria-label',enabled?'Turn space theme off':'Turn space theme on');try{localStorage.setItem(key,enabled?'on':'off');}catch{}sync();}
 toggle.onclick=()=>setEnabled(!enabled);window.SpaceTheme={sync,setEnabled,get enabled(){return enabled;}};setEnabled(enabled);
})();
