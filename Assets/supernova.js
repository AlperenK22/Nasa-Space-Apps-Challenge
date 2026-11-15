(() => {
 const app=document.querySelector('.app'),image=new Image();image.src='supernova.png';image.alt='';
 // Fixed 60% visual brightness; no palette or adjustment toolbar.
 app.style.backgroundImage='linear-gradient(90deg,rgba(5,13,30,.7),rgba(5,13,30,.48) 42%,rgba(5,13,30,.4)),url("supernova.png")';
 // Visible disclosure stays legible above the background shading and on all pages.
 const disclosure=document.createElement('div');
 disclosure.className='ai-image-disclosure';
 disclosure.textContent='AI-generated background';
 disclosure.setAttribute('aria-label','The supernova background image was generated with AI.');
 document.body.append(disclosure);
 window.SupernovaTheme={image,brightness:60};
})();
