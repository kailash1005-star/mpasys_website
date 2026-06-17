gsap.registerPlugin(ScrollTrigger);

/* ---------- Header: dark over hero/dark sections, light over light sections ---------- */
const header = document.getElementById('header');
const lightSections = ['floats','partners','proven','labs','cta'];
function updateHeader(){
  const y = window.scrollY + 70;
  let light = false;
  document.querySelectorAll('.float-section,.partners,.proven,.labs,.cta').forEach(s=>{
    if(y >= s.offsetTop && y < s.offsetTop + s.offsetHeight) light = true;
  });
  header.classList.toggle('light', light);
}
window.addEventListener('scroll', updateHeader, {passive:true});
updateHeader();

/* ---------- Pause expensive hero bg animation when off-screen ---------- */
const heroBg = document.querySelector('.hero-bg');
new IntersectionObserver((entries)=>{
  entries.forEach(e=> heroBg.classList.toggle('paused', !e.isIntersecting));
},{threshold:0}).observe(document.querySelector('.hero'));

/* ---------- Hero title subtle parallax ---------- */
gsap.to('.hero-bg', {yPercent:12, ease:'none', scrollTrigger:{trigger:'.hero', start:'top top', end:'bottom top', scrub:true}});
gsap.to('.hero-content', {yPercent:30, opacity:.2, ease:'none', scrollTrigger:{trigger:'.hero', start:'top top', end:'bottom top', scrub:true}});

/* ---------- Pinned 3D panel stacks ---------- */
function buildStory(sel){
  const sticky = document.querySelector(`${sel} .story-sticky`);
  const panels = sticky.querySelectorAll('.panel');
  const text = sticky.querySelector('.story-text');

  // initial scattered 2D state (cheap GPU transforms: x/y/rotate/scale)
  gsap.set(panels, {transformOrigin:'50% 60%'});
  panels.forEach((p,i)=>{
    gsap.set(p,{x:(i-1)*70 - 30, y:i*26, rotation:-9+i*5, scale:.9, opacity:0});
  });
  gsap.set(text,{opacity:0, y:40});

  const tl = gsap.timeline({
    scrollTrigger:{trigger:sel, start:'top top', end:'bottom bottom', scrub:1}
  });
  tl.to(panels,{opacity:.95, duration:.4, stagger:.06},0)
    .to(panels,{x:(i)=> (i-1)*30, y:(i)=> i*14, rotation:(i)=> -3+i*2, scale:.97, duration:1},0)
    .to(panels,{x:(i)=> (i-1)*10, y:(i)=> i*6, rotation:0, scale:1, duration:1},1)
    .to(text,{opacity:1, y:0, duration:.6},.7);
}
buildStory('#story1');
buildStory('#story2');

/* ---------- 90% progressive word reveal (scrubs over the spacer while the card is pinned) ---------- */
const words = gsap.utils.toArray('.stat-text .reveal-word');
ScrollTrigger.create({
  trigger:'.stack-stat',
  start:'top top',
  end:'+=80%',
  scrub:true,
  onUpdate:(self)=>{
    const total = words.length;
    const active = Math.floor(self.progress * (total + 2));
    words.forEach((w,i)=> w.classList.toggle('on', i < active));
  }
});
// stat media drift
gsap.to('.stat-media',{yPercent:-10, ease:'none', scrollTrigger:{trigger:'.stack-stat', start:'top top', end:'+=90%', scrub:true}});

/* ---------- Artificial Intelligence orbit ---------- */
(function(){
  const orbit = document.getElementById('orbit');
  const realWord = document.getElementById('realWord');
  if(!orbit || !realWord) return;

  // category, accent color, primary Unsplash photo id + picsum fallback seed
  const cats = [
    {word:'Research',      color:'tan',   file:'research'},
    {word:'Medicine',      color:'green', file:'medicine'},
    {word:'Defense',       color:'tan',   file:'defense'},
    {word:'Public Sector', color:'green', file:'public'},
    {word:'Robotics',      color:'tan',   file:'robotics'},
    {word:'Finance',       color:'tan',   file:'finance'},
    {word:'Climate',       color:'green', file:'climate'},
    {word:'Aerospace',     color:'tan',   file:'aerospace'}
  ];
  const N = cats.length;
  const BASE = 140;            // base square size (px) at scale 1
  const items = [];

  cats.forEach((c,i)=>{
    const el = document.createElement('div');
    el.className = 'orbit-item';
    el.style.width = el.style.height = BASE + 'px';
    const img = document.createElement('img');
    img.src = `images/${c.file}.jpg`;
    img.alt = c.word;
    el.appendChild(img);
    el.addEventListener('mouseenter', ()=>{ paused = true; setWord(c.word, c.color); });
    el.addEventListener('mouseleave', ()=>{ paused = false; });
    orbit.appendChild(el);
    items.push({el});
  });

  function setWord(word, color){
    if(realWord.textContent === word && (color==='green')===realWord.classList.contains('green')) return;
    realWord.textContent = word;
    realWord.classList.toggle('green', color === 'green');
  }

  let t = 0, paused = false, visible = true, last = performance.now();
  const SPEED = 0.13;          // radians / second (clockwise)

  function layout(){
    const W = orbit.clientWidth, H = orbit.clientHeight;
    const cx = W/2, cy = H/2;
    const RX = Math.min(W*0.40, 580);
    const RY = Math.min(H*0.40, 300);
    for(let i=0;i<N;i++){
      const a = (i/N)*Math.PI*2 + t;            // clockwise in screen space
      const x = cx + RX*Math.cos(a);
      const y = cy + RY*Math.sin(a);
      const depth = (Math.sin(a)+1)/2;          // 0 = back/top, 1 = front/bottom
      const scale = 0.6 + depth*0.85;           // smaller at back, larger at front
      const el = items[i].el;
      el.style.transform = `translate(${x-BASE/2}px, ${y-BASE/2}px) scale(${scale.toFixed(3)})`;
      el.style.zIndex = Math.round(depth*30);   // always below the central text/button (z-index 50)
      el.style.opacity = (0.55 + depth*0.45).toFixed(2);
    }
  }

  function frame(now){
    const dt = Math.min((now-last)/1000, 0.05); last = now;
    if(!paused && visible) t += dt*SPEED;
    layout();
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  // auto-cycle the word when the user isn't hovering an image
  let auto = 0;
  setInterval(()=>{ if(!paused && visible){ auto=(auto+1)%N; setWord(cats[auto].word, cats[auto].color); } }, 2600);

  // pause work when the section is off-screen
  new IntersectionObserver((e)=>{ visible = e[0].isIntersecting; },{threshold:0})
    .observe(document.querySelector('.float-section'));

  window.addEventListener('resize', layout);
})();

/* ---------- Generic reveal-on-scroll ---------- */
document.querySelectorAll('.partner-card,.proven-card,.bento-card,.cta-title,.cta-copy,.labs-title,.float-title').forEach(el=>{
  el.classList.add('reveal');
  ScrollTrigger.create({trigger:el, start:'top 88%', onEnter:()=>el.classList.add('in')});
});

/* ---------- Footer big text reveal ---------- */
gsap.from('.footer-big',{opacity:0, y:60, duration:1, scrollTrigger:{trigger:'.footer', start:'top 80%'}});

/* ---------- Benchmark: panel slides up over partners (CSS), cards fade in + click-to-color ---------- */
(function(){
  const section = document.getElementById('benchmark');
  if(!section) return;
  const cards = gsap.utils.toArray('.bm-card');

  // (the whole white panel slides up over the partners section via CSS sticky —
  //  the cards rise with it, so no separate scroll animation is needed here)

  // single-select click-to-color (first card active by default)
  function activate(card){ cards.forEach(c=>c.classList.toggle('active', c===card)); }
  cards.forEach(card=> card.addEventListener('click', ()=> activate(card)));
  activate(cards[0]);
})();

/* ---------- Smooth scroll for scroll-to-explore ---------- */
document.querySelector('.scroll-explore').addEventListener('click',()=>{
  window.scrollTo({top:window.innerHeight, behavior:'smooth'});
});

/* ---------- Recalculate trigger positions after async content (images/fonts) loads ---------- */
ScrollTrigger.refresh();
window.addEventListener('load', ()=> ScrollTrigger.refresh());
// orbit images shift layout as they decode — refresh once they're in, plus a safety pass
window.addEventListener('load', ()=> setTimeout(()=> ScrollTrigger.refresh(), 600));
if(document.fonts && document.fonts.ready){ document.fonts.ready.then(()=> ScrollTrigger.refresh()); }
