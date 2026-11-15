(() => {
 const app=document.querySelector('.app'),image=new Image();image.src='supernova.png';image.alt='';
 // Fixed 60% visual brightness; no palette or adjustment toolbar.
 app.style.backgroundImage='linear-gradient(90deg,rgba(5,13,30,.7),rgba(5,13,30,.48) 42%,rgba(5,13,30,.4)),url("supernova.png")';
 window.SupernovaTheme={image,brightness:60};
})();