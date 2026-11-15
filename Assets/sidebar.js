(() => {
 const sidebar=document.querySelector('.sidebar');sidebar.id='mainSidebar';
 const toggle=document.createElement('button');toggle.type='button';toggle.id='sidebarToggle';toggle.className='sidebar-toggle';toggle.setAttribute('aria-controls','mainSidebar');
 toggle.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16"/></svg><span>Menu</span>';
 document.querySelector('.app header>div').prepend(toggle);
 const close=document.createElement('button');close.type='button';close.className='sidebar-close';close.textContent='×';close.setAttribute('aria-label','Collapse sidebar');sidebar.prepend(close);
 let collapsed=true;try{const saved=localStorage.getItem('orbit-sidebar-collapsed-v1');if(saved!==null)collapsed=saved==='true';}catch{}
 function setCollapsed(value){
  collapsed=!!value;document.body.dataset.sidebar=collapsed?'collapsed':'expanded';toggle.setAttribute('aria-expanded',String(!collapsed));toggle.setAttribute('aria-label',collapsed?'Expand sidebar':'Collapse sidebar');toggle.title=collapsed?'Open menu':'Close menu';
  document.querySelectorAll('.sidebar .side-link').forEach(link=>{link.title=collapsed?(link.getAttribute('aria-label')||link.textContent.trim()):'';});
  try{localStorage.setItem('orbit-sidebar-collapsed-v1',String(collapsed));}catch{}
 }
 toggle.onclick=()=>setCollapsed(!collapsed);
 close.onclick=()=>{setCollapsed(true);toggle.focus();};
 sidebar.addEventListener('click',event=>{if(innerWidth<=600&&event.target.closest('.side-link'))setCollapsed(true);});
 document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!collapsed){setCollapsed(true);toggle.focus();}});
 setCollapsed(collapsed);window.OrbitSidebar={setCollapsed,get collapsed(){return collapsed;}};
})();
