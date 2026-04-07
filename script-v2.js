
  function toggleMobileMenu() {
    const menu = document.getElementById('mobileMenu');
    const btn = document.querySelector('.menu-toggle');
    if (menu.classList.contains('open')) {
      closeMobileMenu();
    } else {
      menu.style.display = 'flex';
      // Double rAF ensures display:flex is painted before transition starts
      requestAnimationFrame(() => requestAnimationFrame(() => {
        menu.classList.add('open');
        btn.classList.add('open');
      }));
    }
  }

  function closeMobileMenu() {
    const menu = document.getElementById('mobileMenu');
    const btn = document.querySelector('.menu-toggle');
    menu.classList.remove('open');
    btn.classList.remove('open');
    menu.addEventListener('transitionend', () => {
      if (!menu.classList.contains('open')) menu.style.display = 'none';
    }, { once: true });
  }

  function getBaseColor() {
    return document.documentElement.classList.contains('dark') ? '#ffffff' : '#000000';
  }

  function syncThemeImages() {
    const isDark = document.documentElement.classList.contains('dark');
    document.querySelectorAll('[data-light-src][data-dark-src]').forEach(img => {
      img.src = isDark ? img.dataset.darkSrc : img.dataset.lightSrc;
    });
  }

  function toggleTheme() {
    document.documentElement.classList.toggle('dark');
    syncThemeImages();
    // Update all tspan fills to match new theme
    const base = getBaseColor();
    tspans.forEach(t => {
      if (t.el.getAttribute('fill') !== 'url(#' + (t.el._gradId || '') + ')') {
        t.el.setAttribute('fill', base);
      }
    });
    // Update big name text base fill
    const bigText = document.getElementById('bigNameText');
    if (bigText) bigText.setAttribute('fill', base);
  }

  function openPage(id) {
    document.querySelectorAll('.page-view').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
    const page = document.getElementById('page-' + id);
    if (page) {
      page.classList.add('active');
      page.scrollTop = 0;
      updateCsProgressSlider(page);
    }
    syncGlobalCloseButton();
    document.querySelectorAll('.nav-link').forEach(l => {
      if (l.getAttribute('onclick').includes(id)) l.classList.add('active');
    });
  }

  function closePage() {
    document.querySelectorAll('.page-view').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
    syncGlobalCloseButton();
    updateProgressSlider();
  }

  const siteLoader = document.getElementById('site-loader');
  let hasRevealedSite = false;

  function waitForWindowLoad() {
    if (document.readyState === 'complete') return Promise.resolve();
    return new Promise(resolve => {
      window.addEventListener('load', resolve, { once: true });
    });
  }

  function waitForImages() {
    const images = [...document.images].filter(img =>
      (!siteLoader || !siteLoader.contains(img)) &&
      img.loading !== 'lazy'
    );
    return Promise.all(images.map(img => {
      if (img.complete) {
        return img.decode ? img.decode().catch(() => {}) : Promise.resolve();
      }
      return new Promise(resolve => {
        img.addEventListener('load', resolve, { once: true });
        img.addEventListener('error', resolve, { once: true });
        window.setTimeout(resolve, 1800);
      });
    }));
  }

  function revealSite() {
    if (hasRevealedSite) return;
    hasRevealedSite = true;

    fitName();
    update();
    updateProgressSlider();
    document.querySelectorAll('.page-view.active').forEach(updateCsProgressSlider);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        document.body.classList.add('is-loaded');
        document.body.classList.remove('is-loading');
        syncCursorMode();

        if (siteLoader) {
          window.setTimeout(() => {
            siteLoader.remove();
          }, 700);
        }
      });
    });
  }

  // Close with Escape key
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') { closePage(); closeMobileMenu(); }
  });



  const wrapper    = document.getElementById('bigNameWrapper');
  const svg        = document.getElementById('bigNameSvg');
  const text       = document.getElementById('bigNameText');
  const heroCenter = document.querySelector('.hero-center');

  const SIDE_PAD = 200;
  let nameHeight   = 0;
  let bottomOffset = 0;
  let triggerScrollY = null; // scrollY when portfolio section fully leaves viewport

  function fitName() {
    const W = window.innerWidth;
    const isMobile = W <= 768;
    const H = isMobile && window.visualViewport ? window.visualViewport.height : window.innerHeight;
    const navHeight = isMobile ? 58 : 74;
    bottomOffset = isMobile ? 60 : 0;

    const svgW = W + SIDE_PAD * 2;
    svg.setAttribute('width', svgW);
    svg.setAttribute('height', '400');
    text.setAttribute('x', SIDE_PAD + W / 2);
    text.setAttribute('y', '300');
    text.setAttribute('font-family', "'Inter', sans-serif");

    text.style.fontSize = '200px';
    text.style.letterSpacing = '-4px';

    const padding = isMobile ? 10 : 60;
    const availableWidth = W - padding * 2;
    const bbox = text.getBBox();
    const scale = availableWidth / bbox.width;
    let fs = 200 * scale;
    text.style.fontSize = fs + 'px';
    text.style.letterSpacing = (-fs * 0.02) + 'px';

    let bbox2 = text.getBBox();
    nameHeight = bbox2.height;

    if (isMobile) {
      const centerH = heroCenter.offsetHeight;
      const verticalReserve = navHeight + centerH + bottomOffset + 28;
      const maxNameHeight = Math.max(72, H - verticalReserve);
      if (nameHeight > maxNameHeight) {
        const heightScale = maxNameHeight / nameHeight;
        fs *= heightScale;
        text.style.fontSize = fs + 'px';
        text.style.letterSpacing = (-fs * 0.02) + 'px';
        bbox2 = text.getBBox();
        nameHeight = bbox2.height;
      }
    }

    svg.setAttribute('height', nameHeight * 1.15);
    text.setAttribute('y', nameHeight * 0.92);

    const nameTop = H - nameHeight - bottomOffset;
    const centerH = heroCenter.offsetHeight;
    const totalSpace = nameTop - navHeight;
    const topGap = (totalSpace - centerH) / 2;
    heroCenter.style.top = (navHeight + topGap) + 'px';

    if (isMobile) {
      wrapper.style.position = 'absolute';
      wrapper.style.bottom = '0';
      wrapper.style.left = '-200px';
      wrapper.style.right = '-200px';
      wrapper.style.opacity = '1';
      wrapper.style.filter = '';
      wrapper.style.webkitFilter = '';
    } else {
      wrapper.style.position = 'fixed';
      wrapper.style.bottom = '0';
      wrapper.style.left = '-200px';
      wrapper.style.right = '-200px';
      wrapper.style.transition = 'opacity 0.18s linear, filter 0.18s linear';
      update();
    }
  }

  function update() {
    const W = window.innerWidth;
    if (W <= 768) return;

    const H = window.innerHeight;
    const scrollY = window.scrollY;
    const portfolioSection = document.querySelector('.portfolio-section');

    if (portfolioSection) {
      const rect = portfolioSection.getBoundingClientRect();
      const nameTopInViewport = H - nameHeight - bottomOffset;
      const nameBottomInViewport = H - bottomOffset;
      const revealGap = 160;
      const overlapStart = nameTopInViewport - revealGap;
      const overlapEnd = nameBottomInViewport + revealGap;
      const overlapDistance = Math.max(0, Math.min(rect.bottom, overlapEnd) - Math.max(rect.top, overlapStart));
      const opacityRatio = 1 - Math.min(1, overlapDistance / (nameHeight + revealGap * 2));
      wrapper.style.opacity = opacityRatio.toFixed(3);

      if (rect.bottom > H / 2) {
        // Portfolio bottom still in upper half — stay fixed
        wrapper.style.bottom = bottomOffset + 'px';
        triggerScrollY = scrollY;
      } else {
        // Portfolio bottom crossed viewport midpoint — scroll name up
        const scrolledPast = scrollY - triggerScrollY;
        wrapper.style.bottom = (bottomOffset + scrolledPast) + 'px';
      }
    } else {
      wrapper.style.bottom = bottomOffset + 'px';
      wrapper.style.opacity = '1';
    }

    // Blur logic
    const nameTopInViewport = H - nameHeight - bottomOffset;
    const sections = [
      document.querySelector('.work-section'),
      document.querySelector('.portfolio-section'),
      document.querySelector('.about-section')
    ].filter(Boolean);

    let maxRatio = 0;
    for (const section of sections) {
      const rect = section.getBoundingClientRect();
      const overlaps = rect.bottom > nameTopInViewport && rect.top < (H - bottomOffset);
      if (!overlaps) continue;
      const overlapPx = Math.max(0, Math.min(rect.bottom - nameTopInViewport, nameHeight));
      const effectiveOverlap = Math.max(0, overlapPx - Math.max(0, (rect.top + 120) - nameTopInViewport));
      const ratio = Math.min(1, effectiveOverlap / nameHeight);
      if (ratio > maxRatio) maxRatio = ratio;
    }

    if (maxRatio === 0) {
      wrapper.style.filter = '';
      wrapper.style.webkitFilter = '';
    } else {
      const blurPx = maxRatio * 31.8;
      const f = blurPx > 0.1 ? `blur(${blurPx}px)` : '';
      wrapper.style.filter = f;
      wrapper.style.webkitFilter = f;
    }
  }

  document.fonts.ready.then(() => {
    fitName();
    setTimeout(fitName, 100);
  });

  window.addEventListener('resize', fitName);
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', fitName);
  }
  window.addEventListener('scroll', update, { passive: true });



  const dot  = document.getElementById('cursor-dot');
  const ring = document.getElementById('cursor-ring');

  let mouseX = 0, mouseY = 0;
  let ringX  = 0, ringY  = 0;
  let raf;
  let mobileCursorTimer;
  const psLines = document.querySelectorAll('#progress-slider .ps-line');
  const totalMainProgressLines = psLines.length;
  const navProgressBar = document.getElementById('nav-progress-bar');
  const progressSlider = document.getElementById('progress-slider');
  const globalPageClose = document.getElementById('globalPageClose');

  function syncGlobalProgressVisibility() {
    if (!progressSlider) return;
    progressSlider.style.display = window.innerWidth > 768 ? 'flex' : 'none';
  }

  function syncGlobalCloseButton() {
    if (!globalPageClose) return;
    const activePage = document.querySelector('.page-view.active');
    globalPageClose.classList.toggle('is-visible', Boolean(activePage));
  }

  function setGlobalProgress(progress) {
    const filled = Math.round(progress * totalMainProgressLines);
    psLines.forEach((line, index) => {
      line.classList.toggle('active', index < filled);
    });
    if (navProgressBar) {
      navProgressBar.style.setProperty('--progress', `${(progress * 100).toFixed(2)}%`);
    }
  }

  function getOverlayProgress(pageEl) {
    if (!pageEl) return 0;
    const scrollTop = pageEl.scrollTop;
    const scrollHeight = pageEl.scrollHeight - pageEl.clientHeight;
    return scrollHeight > 0 ? scrollTop / scrollHeight : 0;
  }

  function updateProgressSlider() {
    const activeCaseStudy = document.querySelector('.page-view.active.case-study-view');
    syncGlobalProgressVisibility();
    syncGlobalCloseButton();
    if (activeCaseStudy && window.innerWidth > 768) {
      setGlobalProgress(getOverlayProgress(activeCaseStudy));
      return;
    }

    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = docHeight > 0 ? scrollTop / docHeight : 0;
    setGlobalProgress(progress);
  }

  function updateCsProgressSlider(pageEl) {
    if (!pageEl || !pageEl.classList.contains('case-study-view') || window.innerWidth <= 768) return;
    syncGlobalProgressVisibility();
    setGlobalProgress(getOverlayProgress(pageEl));
  }

  window.addEventListener('scroll', updateProgressSlider, { passive: true });
  document.querySelectorAll('.page-view').forEach(pageView => {
    pageView.addEventListener('scroll', () => updateCsProgressSlider(pageView), { passive: true });
  });
  syncThemeImages();
  syncGlobalCloseButton();
  updateProgressSlider();

  Promise.all([
    waitForWindowLoad(),
    document.fonts ? document.fonts.ready.catch(() => {}) : Promise.resolve(),
    waitForImages(),
    new Promise(resolve => window.setTimeout(resolve, 900))
  ]).then(revealSite).catch(revealSite);

  function hasCustomCursorEffect() {
    return window.innerWidth > 1024 && window.matchMedia('(pointer: fine)').matches;
  }

  function setCursorVisibility(isVisible) {
    const opacity = isVisible ? '1' : '0';
    dot.style.opacity = opacity;
    ring.style.opacity = opacity;
    neonCanvas.style.opacity = opacity;
  }

  function scheduleMobileCursorHide() {
    clearTimeout(mobileCursorTimer);
    mobileCursorTimer = setTimeout(() => {
      if (!hasCustomCursorEffect()) {
        dot.classList.remove('expanded');
        dot.classList.remove('is-pointer');
        ring.classList.remove('expanded');
        setCursorVisibility(false);
      }
    }, 3000);
  }

  function syncCursorMode() {
    clearTimeout(mobileCursorTimer);
    if (!hasCustomCursorEffect()) {
      dot.classList.remove('expanded');
      dot.classList.remove('is-pointer');
      ring.classList.remove('expanded');
      setCursorVisibility(false);
    } else {
      setCursorVisibility(true);
    }
  }

  document.addEventListener('mousemove', e => {
    if (!hasCustomCursorEffect()) return;
    mouseX = e.clientX;
    mouseY = e.clientY;
    dot.style.left = mouseX + 'px';
    dot.style.top  = mouseY + 'px';
    const hoveredEl = document.elementFromPoint(mouseX, mouseY);
    dot.classList.toggle('is-pointer', Boolean(hoveredEl && hoveredEl.closest(pointerSelector)));
  });

  function handleTouchCursor(e) {
    if (hasCustomCursorEffect()) return;
    const touch = e.touches[0] || e.changedTouches[0];
    if (!touch) return;

    mouseX = mx = touch.clientX;
    mouseY = my = touch.clientY;
    dot.style.left = mouseX + 'px';
    dot.style.top = mouseY + 'px';
    setCursorVisibility(true);
    scheduleMobileCursorHide();
  }

  document.addEventListener('touchstart', handleTouchCursor, { passive: true });
  document.addEventListener('touchmove', handleTouchCursor, { passive: true });
  document.addEventListener('touchend', () => {
    if (!hasCustomCursorEffect()) scheduleMobileCursorHide();
  }, { passive: true });

  // Smoothly follow cursor for ring
  function animateRing() {
    ringX += (mouseX - ringX) * 0.22;
    ringY += (mouseY - ringY) * 0.22;
    ring.style.left = ringX + 'px';
    ring.style.top  = ringY + 'px';
    raf = requestAnimationFrame(animateRing);
  }
  animateRing();

  // Magnetic effect on interactive elements
  const magneticEls = document.querySelectorAll('.logo, .nav-link');
  const pointerSelector = '.logo, .nav-link';

  magneticEls.forEach(el => {
    el.addEventListener('mouseenter', () => {
      if (!hasCustomCursorEffect()) return;
      dot.classList.add('is-pointer');
    });

    el.addEventListener('mousemove', e => {
      if (!hasCustomCursorEffect()) return;
      const rect = el.getBoundingClientRect();
      const elCX = rect.left + rect.width  / 2;
      const elCY = rect.top  + rect.height / 2;
      const dx = e.clientX - elCX;
      const dy = e.clientY - elCY;
      const strength = 0.35;
      ring.style.left = (e.clientX - dx * strength) + 'px';
      ring.style.top  = (e.clientY - dy * strength) + 'px';
      ringX = parseFloat(ring.style.left);
      ringY = parseFloat(ring.style.top);
    });

    el.addEventListener('mouseleave', () => {
      if (!hasCustomCursorEffect()) return;
      dot.classList.remove('is-pointer');
    });
  });

  // Hide cursor when leaving window
  document.addEventListener('mouseleave', () => {
    if (!hasCustomCursorEffect()) return;
    dot.style.opacity  = '0';
    ring.style.opacity = '0';
  });
  document.addEventListener('mouseenter', () => {
    if (!hasCustomCursorEffect()) return;
    dot.style.opacity  = '1';
    ring.style.opacity = '1';
  });



  const neonCanvas = document.getElementById('neonCanvas');
  const nctx = neonCanvas.getContext('2d');

  function resizeNeonCanvas() {
    neonCanvas.width  = window.innerWidth;
    neonCanvas.height = window.innerHeight;
  }
  resizeNeonCanvas();
  window.addEventListener('resize', resizeNeonCanvas);
  window.addEventListener('resize', syncCursorMode);
  window.addEventListener('resize', () => {
    updateProgressSlider();
    document.querySelectorAll('.page-view.active').forEach(updateCsProgressSlider);
  });
  syncCursorMode();

  const points = [];
  const MAX_POINTS = 20;
  let mx = window.innerWidth / 2;
  let my = window.innerHeight / 2;
  let headX = mx, headY = my;
  let velX = 0, velY = 0;
  let wiggle = 0;

  document.addEventListener('mousemove', e => {
    if (!hasCustomCursorEffect()) return;
    mx = e.clientX;
    my = e.clientY;
  });

  function drawTrail() {
    const prevHeadX = headX;
    const prevHeadY = headY;

    headX += (mx - headX) * 0.85;
    headY += (my - headY) * 0.85;

    // Detect if snapping back (head moving toward cursor fast)
    const speed = Math.sqrt((headX - prevHeadX) ** 2 + (headY - prevHeadY) ** 2);
    const dist  = Math.sqrt((mx - headX) ** 2 + (my - headY) ** 2);

    // Wiggle when distance is closing fast
    wiggle = dist > 5 ? Math.sin(Date.now() * 0.04) * Math.min(dist * 0.08, 6) : wiggle * 0.85;

    points.push({ x: headX + wiggle, y: headY + wiggle * 0.5 });
    if (points.length > MAX_POINTS) points.shift();

    nctx.clearRect(0, 0, neonCanvas.width, neonCanvas.height);
    if (points.length < 3) { requestAnimationFrame(drawTrail); return; }

    nctx.save();
    nctx.beginPath();
    nctx.moveTo(
      (points[0].x + points[1].x) / 2,
      (points[0].y + points[1].y) / 2
    );
    for (let i = 1; i < points.length - 1; i++) {
      const midX = (points[i].x + points[i+1].x) / 2;
      const midY = (points[i].y + points[i+1].y) / 2;
      nctx.quadraticCurveTo(points[i].x, points[i].y, midX, midY);
    }

    nctx.lineWidth = 6;
    nctx.lineCap = 'round';
    nctx.lineJoin = 'round';
    nctx.strokeStyle = '#0FAF57';
    nctx.shadowColor = '#0FAF57';
    nctx.shadowBlur = 14;
    nctx.globalAlpha = 1;
    nctx.stroke();

    const tail = points[0];
    const head = points[points.length - 1];
    const fadeGrad = nctx.createLinearGradient(tail.x, tail.y, head.x, head.y);
    fadeGrad.addColorStop(0, 'rgba(0,0,0,1)');
    fadeGrad.addColorStop(0.5, 'rgba(0,0,0,0.3)');
    fadeGrad.addColorStop(1, 'rgba(0,0,0,0)');

    nctx.globalCompositeOperation = 'destination-out';
    nctx.beginPath();
    nctx.moveTo(
      (points[0].x + points[1].x) / 2,
      (points[0].y + points[1].y) / 2
    );
    for (let i = 1; i < points.length - 1; i++) {
      const midX = (points[i].x + points[i+1].x) / 2;
      const midY = (points[i].y + points[i+1].y) / 2;
      nctx.quadraticCurveTo(points[i].x, points[i].y, midX, midY);
    }
    nctx.lineWidth = 8;
    nctx.strokeStyle = fadeGrad;
    nctx.stroke();

    nctx.restore();
    requestAnimationFrame(drawTrail);
  }

  drawTrail();



  const GRADIENTS = [
    ['#FF3D3D', '#FF6B00'],
    ['#FF6B00', '#FFD600'],
    ['#FFD600', '#00C853'],
    ['#00C853', '#00E5FF'],
    ['#00B0FF', '#651FFF'],
    ['#651FFF', '#FF4081'],
    ['#FF4081', '#FF3D3D'],
    ['#00E5FF', '#76FF03'],
    ['#76FF03', '#FFD600'],
    ['#FF6D00', '#FF4081'],
  ];

  let tspans = [];
  let activeIdx = -1;
  let footerTspans = [];
  let activeFooterIdx = -1;

  function splitIntoLetters() {
    const textEl = document.getElementById('bigNameText');
    const svgEl  = document.getElementById('bigNameSvg');
    if (!textEl || !svgEl) return;

    let defs = svgEl.querySelector('defs');
    if (!defs) {
      defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
      svgEl.insertBefore(defs, svgEl.firstChild);
    }

    const name = 'Rajat Girhotra';
    tspans = [];

    // Measure character extents using the full text first
    textEl.textContent = name;
    const charExtents = [];
    for (let i = 0; i < name.length; i++) {
      try {
        const ext = textEl.getExtentOfChar(i);
        charExtents.push(ext); // has x, y, width, height in SVG coords
      } catch(e) {
        charExtents.push(null);
      }
    }

    // Now rebuild as tspans (no explicit x — let SVG handle natural spacing)
    textEl.textContent = '';

    [...name].forEach((char, i) => {
      const tspan = document.createElementNS('http://www.w3.org/2000/svg', 'tspan');
      tspan.textContent = char === ' ' ? '\u00A0' : char;
      tspan.setAttribute('fill', '#000000');

      if (char !== ' ') {
        const gradId = `lg${i}`;
        const grad = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
        grad.setAttribute('id', gradId);
        grad.setAttribute('x1', '0%'); grad.setAttribute('y1', '0%');
        grad.setAttribute('x2', '100%'); grad.setAttribute('y2', '100%');
        const stop1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
        stop1.setAttribute('offset', '0%');
        const stop2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
        stop2.setAttribute('offset', '100%');
        grad.appendChild(stop1);
        grad.appendChild(stop2);
        defs.appendChild(grad);
        tspan._gradId = gradId;
        tspan._stop1 = stop1;
        tspan._stop2 = stop2;
        tspan._ext = charExtents[i]; // store SVG extent for hit testing
      }

      tspans.push({ el: tspan, char });
      textEl.appendChild(tspan);
    });
  }

  function splitFooterIntoLetters() {
    const textEl = document.getElementById('footerNameText');
    const svgEl = document.getElementById('footerNameSvg');
    if (!textEl || !svgEl || window.innerWidth <= 1024) return;

    let defs = svgEl.querySelector('defs');
    if (!defs) {
      defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
      svgEl.insertBefore(defs, svgEl.firstChild);
    }

    const name = 'Rajat Girhotra';
    footerTspans = [];

    textEl.textContent = name;
    const charExtents = [];
    for (let i = 0; i < name.length; i++) {
      try {
        charExtents.push(textEl.getExtentOfChar(i));
      } catch (e) {
        charExtents.push(null);
      }
    }

    textEl.textContent = '';

    [...name].forEach((char, i) => {
      const tspan = document.createElementNS('http://www.w3.org/2000/svg', 'tspan');
      tspan.textContent = char === ' ' ? '\u00A0' : char;
      tspan.setAttribute('fill', getBaseColor());

      if (char !== ' ') {
        const gradId = `footer-lg${i}`;
        const grad = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
        grad.setAttribute('id', gradId);
        grad.setAttribute('x1', '0%');
        grad.setAttribute('y1', '0%');
        grad.setAttribute('x2', '100%');
        grad.setAttribute('y2', '100%');
        const stop1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
        stop1.setAttribute('offset', '0%');
        const stop2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
        stop2.setAttribute('offset', '100%');
        grad.appendChild(stop1);
        grad.appendChild(stop2);
        defs.appendChild(grad);
        tspan._gradId = gradId;
        tspan._stop1 = stop1;
        tspan._stop2 = stop2;
        tspan._ext = charExtents[i];
      }

      footerTspans.push({ el: tspan, char });
      textEl.appendChild(tspan);
    });
  }

  document.addEventListener('mousemove', e => {
    if (!tspans.length) return;

    const svgEl = document.getElementById('bigNameSvg');
    if (!svgEl) return;

    // Convert mouse position to SVG coordinate space
    const pt = svgEl.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const svgPt = pt.matrixTransform(svgEl.getScreenCTM().inverse());

    let hitIdx = -1;
    for (let i = 0; i < tspans.length; i++) {
      const { el, char } = tspans[i];
      if (char === ' ' || !el._ext) continue;
      const ext = el._ext;
      if (svgPt.x >= ext.x && svgPt.x <= ext.x + ext.width &&
          svgPt.y >= ext.y - 5 && svgPt.y <= ext.y + ext.height + 5) {
        hitIdx = i;
        break;
      }
    }

    if (hitIdx === activeIdx) return;

    if (activeIdx !== -1 && tspans[activeIdx]) {
      tspans[activeIdx].el.setAttribute('fill', getBaseColor());
    }

    activeIdx = hitIdx;

    if (hitIdx !== -1) {
      const t = tspans[hitIdx].el;
      if (t._gradId) {
        const [c1, c2] = GRADIENTS[Math.floor(Math.random() * GRADIENTS.length)];
        t._stop1.setAttribute('stop-color', c1);
        t._stop2.setAttribute('stop-color', c2);
        t.setAttribute('fill', `url(#${t._gradId})`);
      }
    }
  });

  document.addEventListener('mousemove', e => {
    if (!footerTspans.length || window.innerWidth <= 1024) return;

    const svgEl = document.getElementById('footerNameSvg');
    if (!svgEl) return;

    const pt = svgEl.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const screenCTM = svgEl.getScreenCTM();
    if (!screenCTM) return;
    const svgPt = pt.matrixTransform(screenCTM.inverse());

    let hitIdx = -1;
    for (let i = 0; i < footerTspans.length; i++) {
      const { el, char } = footerTspans[i];
      if (char === ' ' || !el._ext) continue;
      const ext = el._ext;
      if (svgPt.x >= ext.x && svgPt.x <= ext.x + ext.width &&
          svgPt.y >= ext.y - 8 && svgPt.y <= ext.y + ext.height + 8) {
        hitIdx = i;
        break;
      }
    }

    if (hitIdx === activeFooterIdx) return;

    if (activeFooterIdx !== -1 && footerTspans[activeFooterIdx]) {
      footerTspans[activeFooterIdx].el.setAttribute('fill', getBaseColor());
    }

    activeFooterIdx = hitIdx;

    if (hitIdx !== -1) {
      const t = footerTspans[hitIdx].el;
      if (t._gradId) {
        const [c1, c2] = GRADIENTS[Math.floor(Math.random() * GRADIENTS.length)];
        t._stop1.setAttribute('stop-color', c1);
        t._stop2.setAttribute('stop-color', c2);
        t.setAttribute('fill', `url(#${t._gradId})`);
      }
    }
  });

  document.fonts.ready.then(() => {
    setTimeout(() => {
      splitIntoLetters();
      splitFooterIntoLetters();
      const letters = tspans.filter(t => t.char !== ' ');
      const totalDuration = 1500;
      const interval = totalDuration / letters.length;

      letters.forEach((t, i) => {
        setTimeout(() => {
          const el = t.el;
          if (!el._gradId) return;
          const [c1, c2] = GRADIENTS[Math.floor(Math.random() * GRADIENTS.length)];
          el._stop1.setAttribute('stop-color', c1);
          el._stop2.setAttribute('stop-color', c2);
          el.setAttribute('fill', `url(#${el._gradId})`);

          // Turn back to black immediately after filling (400ms later)
          setTimeout(() => {
            el.setAttribute('fill', getBaseColor());
          }, 400);
        }, i * interval);
      });
    }, 200);
  });
