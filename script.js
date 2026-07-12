/* ---------- Language: EN <-> DE ----------
   Elements carrying data-de swap their innerHTML when German is active. The swap
   runs before any animation init below, so GSAP splits/targets the translated DOM.
   Toggling stores the preference and reloads — simplest correct behaviour for a
   static multi-page site. */
(function(){
  const saved = localStorage.getItem('mpasys-lang') || 'en';
  if(saved === 'de'){
    document.querySelectorAll('[data-de]').forEach(el=>{ el.innerHTML = el.dataset.de; });
    document.documentElement.lang = 'de';
  }
  const btn = document.getElementById('langToggle');
  if(btn){
    btn.textContent = saved === 'de' ? 'EN' : 'DE';
    btn.addEventListener('click', ()=>{
      localStorage.setItem('mpasys-lang', saved === 'de' ? 'en' : 'de');
      location.reload();
    });
  }
})();

gsap.registerPlugin(ScrollTrigger);
// iOS/Android: ignore the viewport-height jitter from the browser toolbar
// collapsing mid-scroll — otherwise pinned scrub sections stutter/re-measure.
ScrollTrigger.config({ignoreMobileResize:true});

/* ---------- Header: dark over hero/dark sections, light over light sections ---------- */
const header = document.getElementById('header');
const lightSections = ['floats','partners','services','industries','labs','cta'];
function updateHeader(){
  const y = window.scrollY + 70;
  let light = false;
  document.querySelectorAll('.float-section,.partners,.services,.industries,.labs,.cta,.section-light').forEach(s=>{
    if(y >= s.offsetTop && y < s.offsetTop + s.offsetHeight) light = true;
  });
  header.classList.toggle('light', light);
}
window.addEventListener('scroll', updateHeader, {passive:true});
updateHeader();

/* ---------- Home hero: header cloaked at the top, glides in across the hero scroll ----------
   Set the hidden/glass state immediately (before ScrollTrigger wires up) to avoid a flash of
   the solid bar. The reveal itself is driven from the hero scrub progress further below. */
const heroScrubEl = document.getElementById('heroScrub');
const heroCanScrub = !!heroScrubEl;   // all devices — phones scrub too
function setHeaderReveal(p){
  const r = Math.max(0, Math.min(1, (p - 0.03) / 0.72));   // hidden at top → fully in ~75% through
  header.style.opacity = r;
  header.style.transform = 'translateY(' + ((r - 1) * 100) + '%)';
  header.style.pointerEvents = r < 0.25 ? 'none' : 'auto';
}
if(heroCanScrub && header){
  header.classList.add('hero-float');
  setHeaderReveal(0);
}

/* ---------- Mega menu (hover dropdowns, scale.com style) ---------- */
(function(){
  const mega = document.getElementById('mega');
  if(!mega) return;
  const panels = mega.querySelectorAll('.mega-panel');
  const groups = document.querySelectorAll('.nav-group');
  const plainItems = document.querySelectorAll('.main-nav > a.nav-item');
  let closeT;
  function open(menu){
    clearTimeout(closeT);
    panels.forEach(p=> p.classList.toggle('active', p.dataset.menu===menu));
    mega.classList.add('open');
    header.classList.add('menu-open');
  }
  function scheduleClose(){
    closeT = setTimeout(()=>{ mega.classList.remove('open'); header.classList.remove('menu-open'); }, 130);
  }
  function closeNow(){ clearTimeout(closeT); mega.classList.remove('open'); header.classList.remove('menu-open'); }
  groups.forEach(g=> g.addEventListener('mouseenter', ()=> open(g.dataset.menu)));
  plainItems.forEach(a=> a.addEventListener('mouseenter', closeNow));
  header.addEventListener('mouseleave', scheduleClose);
  mega.addEventListener('mouseenter', ()=> clearTimeout(closeT));
  mega.addEventListener('mouseleave', scheduleClose);
  mega.querySelectorAll('a').forEach(a=> a.addEventListener('click', closeNow));
  document.addEventListener('keydown', e=>{ if(e.key==='Escape') closeNow(); });
})();

/* ---------- Mobile hamburger menu ---------- */
(function(){
  const toggle = document.getElementById('navToggle');
  const menu = document.getElementById('mobileNav');
  if(!toggle || !menu) return;
  function setOpen(open){
    menu.classList.toggle('open', open);
    toggle.classList.toggle('active', open);
    toggle.setAttribute('aria-expanded', open);
    header.classList.toggle('nav-open', open);
  }
  toggle.addEventListener('click', ()=> setOpen(!menu.classList.contains('open')));
  menu.querySelectorAll('a').forEach(a=> a.addEventListener('click', ()=> setOpen(false)));
  document.addEventListener('keydown', e=>{ if(e.key==='Escape') setOpen(false); });
})();

/* ---------- Pause expensive hero bg animation when off-screen ---------- */
const heroEl = document.querySelector('.hero');
const heroBg = document.querySelector('.hero-bg');
if(heroEl && heroBg){
  new IntersectionObserver((entries)=>{
    entries.forEach(e=> heroBg.classList.toggle('paused', !e.isIntersecting));
  },{threshold:0}).observe(heroEl);

  /* ---------- Hero: scroll-scrubbed video + phased content (home only) ----------
     The hero pins for the wrapper's height while the video's frames follow the
     scrollbar — scroll drives currentTime (all-keyframe encode = instant seeks),
     an rAF lerp smooths the playhead, and the content cross-fades through phases.
     Runs on every device — phones get the same pinned scrub experience. */
  const heroVideo = document.querySelector('.hero-video');
  const heroScrub = document.getElementById('heroScrub');
  const canScrub = !!(heroVideo && heroScrub);

  // First-paint entrance: eyebrow → headline → sub → CTAs rise in sequence over
  // ~1.5s. Children only — phase-level opacity stays owned by the scrub timeline.
  const introEls = document.querySelectorAll('.hero-phase[data-phase="0"] > *');
  if(introEls.length && window.gsap){
    gsap.from(introEls, {opacity:0, y:36, duration:1.1, ease:'power3.out',
      stagger:0.14, delay:0.25, clearProps:'opacity,transform'});
  }

  if(canScrub){
    heroVideo.removeAttribute('autoplay');
    heroVideo.removeAttribute('loop');
    heroVideo.setAttribute('preload','auto');
    heroVideo.muted = true;
    heroVideo.src = 'Videos/transformer-hero-scrub.mp4?v=2';   // every frame a keyframe (v2: 1080p master)
    heroVideo.load();
    // A paused, never-played video often won't buffer/decode frames (readyState
    // stays at 1), which freezes seeking on frame 0. Kick it once data lands:
    // play → pause primes the decoder; the rAF then drives it back to frame 0.
    heroVideo.addEventListener('loadeddata', ()=>{
      heroVideo.play().then(()=> heroVideo.pause()).catch(()=>{});
    }, {once:true});

    let scrollProgress = 0;
    ScrollTrigger.create({
      trigger: heroScrub, start:'top top', end:'bottom bottom', scrub:true,
      onUpdate(self){ scrollProgress = self.progress; setHeaderReveal(self.progress); },
      // Past the hero: hand the header back to the normal solid/light logic.
      onLeave(){ header.classList.remove('hero-float'); header.style.opacity=''; header.style.transform=''; header.style.pointerEvents=''; },
      onEnterBack(){ header.classList.add('hero-float'); }
    });
    (function scrubStep(){
      const d = heroVideo.duration;                       // read live — no metadata-timing race
      if(d && isFinite(d)){
        // reach the final frame by 92% of the scroll, then hold it — so the tail
        // of the clip always plays out before the hero unpins (no cut-off end).
        const vp = Math.min(1, scrollProgress / 0.92);
        const target = vp * (d - 0.04);
        const cur = heroVideo.currentTime;
        const next = cur + (target - cur) * 0.14;          // gentle lerp = fluid, glides after the scrollbar
        if(Math.abs(next - cur) > 0.001){ try{ heroVideo.currentTime = next; }catch(e){} }
      }
      requestAnimationFrame(scrubStep);
    })();

    // Content choreography: cross-fade the phases across the pinned scroll,
    // synced to the same range that scrubs the video. Each phase holds, then
    // hands off to the next; the video keeps advancing underneath throughout.
    const phases = gsap.utils.toArray('.hero-phase');
    const N = phases.length;
    gsap.set(phases, {opacity:0, y:32, pointerEvents:'none'});
    gsap.set(phases[0], {opacity:1, y:0, pointerEvents:'auto'});

    const HOLD = 0.6, TRANS = 0.32;   // per-phase hold vs. transition (timeline units)
    const heroTl = gsap.timeline({defaults:{ease:'none'},
      scrollTrigger:{trigger:heroScrub, start:'top top', end:'bottom bottom', scrub:1.2}});
    // slow continuous zoom + fade the scroll hint; length N keeps the last phase held to the end.
    // Zoom kept subtle (1 → 1.08): the film starts at native resolution so it stays pin-sharp.
    heroTl.fromTo(heroVideo, {scale:1}, {scale:1.08, duration:N}, 0);
    heroTl.to('.scroll-explore', {opacity:0, duration:0.5}, 0);
    phases.forEach((p,i)=>{
      const hasCta = !!p.querySelector('.hero-cta-row');
      if(i>0){
        heroTl.set(p, {pointerEvents: hasCta ? 'auto' : 'none'}, i - TRANS)
              .fromTo(p, {opacity:0, y:32}, {opacity:1, y:0, duration:TRANS}, i - TRANS);
      }
      if(i < N-1){
        heroTl.to(p, {opacity:0, y:-32, duration:TRANS}, i + HOLD)
              .set(p, {pointerEvents:'none'}, i + HOLD + TRANS);
      }
    });
  }
}

/* ---------- Pinned 3D panel stacks ---------- */
function buildStory(sel){
  const root = typeof sel === 'string' ? document.querySelector(sel) : sel;
  if(!root) return;
  const sticky = root.querySelector('.story-sticky');
  if(!sticky) return;
  const panels = sticky.querySelectorAll('.panel');
  const text = sticky.querySelector('.story-text');

  // initial scattered 2D state (cheap GPU transforms: x/y/rotate/scale)
  gsap.set(panels, {transformOrigin:'50% 60%'});
  panels.forEach((p,i)=>{
    gsap.set(p,{x:(i-1)*70 - 30, y:i*26, rotation:-9+i*5, scale:.9, opacity:0});
  });
  gsap.set(text,{opacity:0, y:40});

  const tl = gsap.timeline({
    scrollTrigger:{trigger:root, start:'top top', end:'bottom bottom', scrub:1}
  });
  tl.to(panels,{opacity:.95, duration:.4, stagger:.06},0)
    .to(panels,{x:(i)=> (i-1)*30, y:(i)=> i*14, rotation:(i)=> -3+i*2, scale:.97, duration:1},0)
    .to(panels,{x:(i)=> (i-1)*10, y:(i)=> i*6, rotation:0, scale:1, duration:1},1)
    .to(text,{opacity:1, y:0, duration:.6},.7);
}
document.querySelectorAll('.story').forEach(buildStory);

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
    {word:'Manufacturing',        color:'tan',   file:'robotics'},
    {word:'Healthcare',           color:'green', file:'medicine'},
    {word:'Compliance',           color:'tan',   file:'defense'},
    {word:'B2B Sales',            color:'green', file:'public'},
    {word:'Logistics',            color:'tan',   file:'aerospace'},
    {word:'Finance',              color:'tan',   file:'finance'},
    {word:'Automation',           color:'green', file:'climate'},
    {word:'Professional Services',color:'tan',   file:'research'}
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

/* ---------- Sticky card-stack: cards stick + scale down as you scroll (subpages) ---------- */
(function(){
  const wraps = document.querySelectorAll('.svc-stack-wrap');
  if(!wraps.length) return;
  const STICK = 120;                 // px from top where each card pins
  const STEP = 0.04;                 // how much each underlying card recedes
  const mm = gsap.matchMedia();
  mm.add('(min-width: 769px)', ()=>{
    wraps.forEach(wrap=>{
      const items = wrap.querySelectorAll('.svc-stack-item');
      const cards = wrap.querySelectorAll('.svc-stack-card');
      const N = cards.length;
      cards.forEach((card,i)=>{
        card.style.top = (STICK + i*28) + 'px';
        const targetScale = 1 - (N - 1 - i) * STEP;
        gsap.fromTo(card, {scale:1}, {
          scale: targetScale, ease:'none',
          scrollTrigger:{ trigger: items[i], start:'top '+STICK+'px', end:'bottom '+STICK+'px', scrub:true }
        });
      });
    });
  });
})();

/* ---------- Benchmark cards: single-select click-to-color (per section, any page) ---------- */
document.querySelectorAll('.benchmark-grid').forEach(grid=>{
  const cards = Array.from(grid.querySelectorAll('.bm-card'));
  if(!cards.length) return;
  function activate(card){ cards.forEach(c=>c.classList.toggle('active', c===card)); }
  cards.forEach(card=> card.addEventListener('click', ()=> activate(card)));
  activate(cards[0]);
});

/* ---------- Smooth scroll for scroll-to-explore ---------- */
const scrollExplore = document.querySelector('.scroll-explore');
if(scrollExplore){
  scrollExplore.addEventListener('click',()=>{
    window.scrollTo({top:window.innerHeight, behavior:'smooth'});
  });
}

/* ---------- Service deep-dive tabs ---------- */
(function(){
  const tabs = document.querySelectorAll('.svc-tab');
  const panels = document.querySelectorAll('.svc-panel');
  if(!tabs.length) return;
  tabs.forEach(tab=>{
    tab.addEventListener('click', ()=>{
      const key = tab.dataset.panel;
      tabs.forEach(t=> t.classList.toggle('active', t===tab));
      panels.forEach(p=> p.classList.toggle('active', p.dataset.panel===key));
      ScrollTrigger.refresh();
    });
  });
})();

/* ---------- Nav: smooth-scroll to in-page sections ---------- */
document.querySelectorAll('.nav-item[data-scroll]').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    const target = document.getElementById(btn.dataset.scroll);
    if(!target) return;
    const y = target.getBoundingClientRect().top + window.scrollY - 60;
    window.scrollTo({top:y, behavior:'smooth'});
  });
});

/* ---------- Reveal-on-scroll for new sections ---------- */
document.querySelectorAll('.proof-block,.svc-block,.ind-card,.step-card,.cases-title,.services-title,.industries-title,.engage-title').forEach(el=>{
  el.classList.add('reveal');
  ScrollTrigger.create({trigger:el, start:'top 90%', onEnter:()=>el.classList.add('in')});
});

/* ---------- Recalculate trigger positions after async content (images/fonts) loads ---------- */
ScrollTrigger.refresh();
window.addEventListener('load', ()=> ScrollTrigger.refresh());
// orbit images shift layout as they decode — refresh once they're in, plus a safety pass
window.addEventListener('load', ()=> setTimeout(()=> ScrollTrigger.refresh(), 600));
if(document.fonts && document.fonts.ready){ document.fonts.ready.then(()=> ScrollTrigger.refresh()); }

/* ---------- Cal.com 30-min booking popup, wired into every CTA ---------- */
(function (C, A, L) { let p = function (a, ar) { a.q.push(ar); }; let d = C.document; C.Cal = C.Cal || function () { let cal = C.Cal; let ar = arguments; if (!cal.loaded) { cal.ns = {}; cal.q = cal.q || []; d.head.appendChild(d.createElement("script")).src = A; cal.loaded = true; } if (ar[0] === L) { const api = function () { p(api, arguments); }; const namespace = ar[1]; api.q = api.q || []; if(typeof namespace === "string"){cal.ns[namespace] = cal.ns[namespace] || api;p(cal.ns[namespace], ar);p(cal, ["initNamespace", namespace]);} else p(cal, ar); return;} p(cal, ar); }; })(window, "https://app.cal.com/embed/embed.js", "init");
Cal("init", "30min", {origin:"https://app.cal.com"});
Cal.config = Cal.config || {};
Cal.config.forwardQueryParams = true;
Cal.ns["30min"]("ui", {"cssVarsPerTheme":{"dark":{"cal-brand":"#9a6bec"}},"hideEventTypeDetails":false,"layout":"month_view"});

(function(){
  const cfg = '{"layout":"month_view","useSlotsViewOnSmallScreen":"true","theme":"auto"}';
  // Turn booking CTAs into Cal pop-ups. Links that literally display the email
  // address (contain "@") are left as mailto: links.
  document.querySelectorAll('a[href="mailto:kailash@mpasys.ai"]').forEach(el=>{
    if(el.textContent.indexOf('@') !== -1) return;
    el.setAttribute('data-cal-link','mpasys/30min');
    el.setAttribute('data-cal-namespace','30min');
    el.setAttribute('data-cal-config', cfg);
    el.addEventListener('click', e=>{ e.preventDefault(); }); // suppress the mailto fallback; Cal opens the popup
  });
})();
