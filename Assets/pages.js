(() => {
 const routes={health:{title:'Health map',anchor:'#section'},decision:{title:'Decision support',anchor:'#decisionArea'},future:{title:'Future risks',anchor:'#futureArea'},reports:{title:'Medical reports',anchor:'#reportArea'},data:{title:'Data entry',anchor:'#dataArea'},nasa:{title:'NASA data',anchor:'#nasaArea'},profiles:{title:'Threshold profiles',anchor:'#protocolArea'}};
 const pages=[...document.querySelectorAll('[data-page]')],heading=document.querySelector('header h1');heading.tabIndex=-1;
 let current=null;
 document.querySelectorAll('.sidebar .side-link,.sidebar .brand,.decision-summary a').forEach(link=>{
  const route=Object.keys(routes).find(key=>routes[key].anchor===link.getAttribute('href'));
  if(!route)return;
  link.href='#/'+route;link.dataset.route=route;
  link.addEventListener('click',event=>{if(event.ctrlKey||event.metaKey||event.shiftKey||event.altKey||event.button!==0)return;event.preventDefault();navigate(route,true);});
 });
 function navigate(route,push=false){
  if(!routes[route])route='health';
  const hash='#/'+route;
  if(push&&location.hash!==hash)history.pushState({page:route},'',hash);
  else if(!push&&location.hash!==hash)history.replaceState({page:route},'',hash);
  current=route;document.body.dataset.page=route;
  pages.forEach(page=>page.hidden=page.dataset.page!==route);
  document.querySelectorAll('.sidebar .side-link').forEach(link=>{const active=link.dataset.route===route;link.classList.toggle('active',active);if(active)link.setAttribute('aria-current','page');else link.removeAttribute('aria-current');});
  heading.textContent=routes[route].title;document.title='ORBIT | '+routes[route].title;
  window.scrollTo(0,0);heading.focus({preventScroll:true});
  if(route==='data')window.OrbitData?.renderHistory(); if(route==='future')window.FutureRisks?.render(); if(route==='health')requestAnimationFrame(()=>window.ORBIT?.render());
 }
 const fromUrl=()=>navigate(location.hash.slice(2));
 window.addEventListener('popstate',fromUrl);window.addEventListener('hashchange',fromUrl);
 window.OrbitPages={navigate,get current(){return current;}};
 fromUrl();
})();
