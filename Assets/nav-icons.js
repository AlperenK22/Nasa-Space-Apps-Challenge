(() => {
 const icons={data:'<ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v14c0 4 16 4 16 0V5M4 12c0 4 16 4 16 0"/>',nasa:'<path d="m4 4 5 1 2 5-5-1-2-5Zm9 10 5 1 2 5-5-1-2-5Zm-3-4 4 4M8 16l4-4M3 14a7 7 0 0 0 7 7M4 17l-1 4 4-1"/>',future:'<path d="M4 20h16M5 16l5-5 4 3 5-9M14 5h5v5"/><path d="M5 5h3M5 8h1"/>',
  health:'<path d="M12 21s-8.5-5.2-8.5-11.3A4.8 4.8 0 0 1 12 6.5a4.8 4.8 0 0 1 8.5 3.2C20.5 15.8 12 21 12 21Z"/><path d="M3.8 12h4.1l1.8-3.2 3.1 6.2 1.8-3H20"/>',
  decision:'<path d="m12 3 9 9-9 9-9-9 9-9Z"/><path d="M12 7.5v5M12 16h.01"/>',
  reports:'<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9l-6-6Z"/><path d="M14 3v6h6M8 13h8M8 17h6"/>',
  profiles:'<path d="M4 6h5m4 0h7M4 12h9m4 0h3M4 18h2m4 0h10"/><rect x="9" y="3.5" width="4" height="5" rx="1.4"/><rect x="13" y="9.5" width="4" height="5" rx="1.4"/><rect x="6" y="15.5" width="4" height="5" rx="1.4"/>'
 };
 document.querySelectorAll('.sidebar .side-link[data-route]').forEach(link=>{
  const path=icons[link.dataset.route];if(!path)return;
  const label=link.textContent.replace(/^[\s▦◇≡⌁]+/u,'').trim();
  link.replaceChildren();
  const icon=document.createElement('span');icon.className='nav-icon';icon.setAttribute('aria-hidden','true');
  icon.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" focusable="false">'+path+'</svg>';
  const text=document.createElement('span');text.className='nav-text';text.textContent=label;
  link.append(icon,text);link.setAttribute('aria-label',label);
 });
})();
