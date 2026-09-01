(function(){
  "use strict";

  /* ===================== CANVAS: SKY + STARS + METEORS ===================== */
  const canvas = document.getElementById('sky');
  const ctx = canvas.getContext('2d');
  let W, H;

  function resize(){
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resize);
  resize();

  // Stars: pre-calculate positions
  const STAR_COUNT = 300;
  const stars = [];
  for(let i=0; i<STAR_COUNT; i++){
    const sizeRoll = Math.random();
    stars.push({
      x: Math.random() * W,
      y: Math.random() * H,
      size: sizeRoll < 0.5 ? 0.5 : (sizeRoll < 0.85 ? 1 : 1.5),
      baseOpacity: 0.3 + Math.random() * 0.7,
      phase: Math.random() * Math.PI * 2,
      duration: 2 + Math.random() * 4 // seconds
    });
  }
  // Recompute star positions proportionally on resize
  let prevW = W, prevH = H;
  window.addEventListener('resize', function(){
    const scaleX = W / prevW, scaleY = H / prevH;
    stars.forEach(s => { s.x *= scaleX; s.y *= scaleY; });
    prevW = W; prevH = H;
  });

  // Meteors
  let meteors = [];
  const MAX_METEORS = 6;
  const ANGLE = 35 * Math.PI / 180;

  function spawnMeteor(){
    if(meteors.length >= MAX_METEORS) return;
    const startX = Math.random() * W;
    const startY = Math.random() * (H * 0.3);
    const speed = 8 + Math.random() * 6;
    const length = 80 + Math.random() * 100;
    const thickness = 1 + Math.random() * 0.5;
    meteors.push({
      x: startX,
      y: startY,
      vx: Math.cos(ANGLE) * speed,
      vy: Math.sin(ANGLE) * speed,
      length,
      thickness,
      opacity: 1.0
    });
    const nextDelay = 800 + Math.random() * 700;
    setTimeout(spawnMeteor, nextDelay);
  }
  setTimeout(spawnMeteor, 400);

  let startTime = performance.now();

  function draw(now){
    const elapsed = (now - startTime) / 1000;

    // Layer 1: base sky gradient
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, '#000005');
    grad.addColorStop(0.5, '#02020a');
    grad.addColorStop(1, '#000000');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // subtle radial glow center-top
    const radial = ctx.createRadialGradient(W/2, 0, 0, W/2, 0, W*0.7);
    radial.addColorStop(0, 'rgba(255,255,255,0.03)');
    radial.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = radial;
    ctx.fillRect(0, 0, W, H);

    // Layer 2: stars with twinkle
    stars.forEach(s => {
      const twinkle = Math.sin((elapsed / s.duration) * Math.PI * 2 + s.phase);
      const opacity = s.baseOpacity * 0.5 + (twinkle * 0.5 + 0.5) * s.baseOpacity * 0.5;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,255,${Math.max(0.05, Math.min(1, opacity))})`;
      ctx.fill();
    });

    // Layer 3: meteors
    for(let i = meteors.length - 1; i >= 0; i--){
      const m = meteors[i];
      m.x += m.vx;
      m.y += m.vy;
      m.opacity -= 0.006;

      if(m.x - m.length > W || m.y - m.length > H || m.opacity <= 0){
        meteors.splice(i, 1);
        continue;
      }

      const tailX = m.x - Math.cos(ANGLE) * m.length;
      const tailY = m.y - Math.sin(ANGLE) * m.length;

      const lineGrad = ctx.createLinearGradient(m.x, m.y, tailX, tailY);
      lineGrad.addColorStop(0, `rgba(255,255,255,${m.opacity})`);
      lineGrad.addColorStop(1, 'rgba(255,255,255,0)');

      ctx.strokeStyle = lineGrad;
      ctx.lineWidth = m.thickness;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(m.x, m.y);
      ctx.lineTo(tailX, tailY);
      ctx.stroke();

      // head
      ctx.beginPath();
      ctx.arc(m.x, m.y, m.thickness * 0.9, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,255,${m.opacity})`;
      ctx.fill();
    }

    requestAnimationFrame(draw);
  }
  requestAnimationFrame(draw);

  /* ===================== NAVBAR SCROLL STATE ===================== */
  const navbar = document.getElementById('navbar');
  window.addEventListener('scroll', function(){
    if(window.scrollY > 50){
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  }, { passive: true });

  /* ===================== MOBILE NAV TOGGLE ===================== */
  const hamburger = document.getElementById('hamburger');
  const navLinks = document.getElementById('navLinks');
  hamburger.addEventListener('click', function(){
    const isOpen = navLinks.classList.toggle('open');
    hamburger.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
  });
  navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      navLinks.classList.remove('open');
      hamburger.setAttribute('aria-expanded', 'false');
    });
  });

  /* ===================== ACTIVE NAV LINK ON SCROLL ===================== */
  const sections = document.querySelectorAll('main section[id]');
  const navAnchors = document.querySelectorAll('.nav-link');

  const navObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if(entry.isIntersecting){
        const id = entry.target.getAttribute('id');
        navAnchors.forEach(a => {
          a.classList.toggle('active', a.dataset.section === id);
        });
      }
    });
  }, { threshold: 0.5 });

  sections.forEach(sec => navObserver.observe(sec));

  /* ===================== FADE-IN ON SCROLL ===================== */
  const fadeEls = document.querySelectorAll('.fade-in');
  const fadeObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry, i) => {
      if(entry.isIntersecting){
        setTimeout(() => entry.target.classList.add('visible'), i * 100);
        fadeObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });

  fadeEls.forEach(el => fadeObserver.observe(el));

})();