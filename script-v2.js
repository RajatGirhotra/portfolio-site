
  function toggleMobileMenu() {
    const menu = document.getElementById('mobileMenu');
    const backdrop = document.getElementById('drawerBackdrop');
    const btn = document.querySelector('.menu-toggle');
    if (menu.classList.contains('open')) {
      closeMobileMenu();
    } else {
      menu.style.display = 'flex';
      if (backdrop && window.innerWidth > 768) backdrop.classList.add('is-visible');
      // Double rAF ensures display:flex is painted before transition starts
      requestAnimationFrame(() => requestAnimationFrame(() => {
        menu.classList.add('open');
        btn.classList.add('open');
      }));
    }
  }

  function closeMobileMenu() {
    const menu = document.getElementById('mobileMenu');
    const backdrop = document.getElementById('drawerBackdrop');
    const btn = document.querySelector('.menu-toggle');
    menu.classList.remove('open');
    btn.classList.remove('open');
    if (backdrop) backdrop.classList.remove('is-visible');
    menu.addEventListener('transitionend', () => {
      if (!menu.classList.contains('open')) menu.style.display = 'none';
    }, { once: true });
  }

  function getBaseColor() {
    return document.documentElement.classList.contains('dark') ? '#F3F3F3' : '#000000';
  }

  function syncThemeImages() {
    const isDark = document.documentElement.classList.contains('dark');
    document.querySelectorAll('[data-light-src][data-dark-src]').forEach(img => {
      img.src = isDark ? img.dataset.darkSrc : img.dataset.lightSrc;
    });
  }

  function applyThemeState(isDark) {
    document.documentElement.classList.toggle('dark', isDark);
    syncThemeImages();

    const base = getBaseColor();
    tspans.forEach(t => {
      if (t.el.getAttribute('fill') !== 'url(#' + (t.el._gradId || '') + ')') {
        t.el.setAttribute('fill', base);
      }
    });

    const bigText = document.getElementById('bigNameText');
    if (bigText) bigText.setAttribute('fill', base);

    footerTspans.forEach(t => {
      if (t.el.getAttribute('fill') !== 'url(#' + (t.el._gradId || '') + ')') {
        t.el.setAttribute('fill', base);
      }
    });

    const footerText = document.getElementById('footerNameText');
    if (footerText) footerText.setAttribute('fill', base);
  }

  function toggleTheme() {
    applyThemeState(!document.documentElement.classList.contains('dark'));
  }

  function pressSurpriseMe(event) {
    const button = event && event.currentTarget ? event.currentTarget : null;
    if (!button) {
      toggleMacFinderMode();
      return;
    }

    event.preventDefault();
    if (button.dataset.isPressing === 'true') return;
    button.dataset.isPressing = 'true';
    button.classList.add('is-pressing');
    window.setTimeout(() => {
      toggleMacFinderMode();
      window.setTimeout(() => {
        button.classList.remove('is-pressing');
        delete button.dataset.isPressing;
      }, 260);
    }, 140);
  }

  let macFinderCloseTimer;
  let macFinderBootTimer;
  let macFinderOpenTimer;

  function setMacFinderMode(isActive, options = {}) {
    const shouldPersist = options.persist !== false;
    const shouldAnimate = options.animate !== false;
    const enabled = Boolean(isActive);
    const toggles = document.querySelectorAll('.mac-transform-toggle, .nav-finder-toggle');
    const finderMode = document.getElementById('macFinderMode');
    const finderScroller = document.querySelector('.mac-mobile-scroll-pages');
    const shouldUseTvTransition = window.innerWidth > 768 && finderMode;
    const shouldUseMobileTransition = window.innerWidth <= 768 && finderMode;
    const wasFinderActive = document.body.classList.contains('mac-finder-active');
    window.clearTimeout(macFinderCloseTimer);
    window.clearTimeout(macFinderBootTimer);
    window.clearTimeout(macFinderOpenTimer);

    if (enabled) {
      document.body.classList.remove('mac-finder-closing', 'mac-finder-mobile-closing', 'mac-finder-booting', 'mac-finder-opening');
      document.body.classList.add('mac-finder-active');
      if (!shouldAnimate && finderMode) finderMode.classList.remove('tv-open');
      if (!wasFinderActive && shouldAnimate && shouldUseTvTransition) {
        document.body.classList.add('mac-finder-opening');
        finderMode.classList.remove('tv-open');
        void finderMode.offsetWidth;
        finderMode.classList.add('tv-open');
        macFinderOpenTimer = window.setTimeout(() => {
          document.body.classList.remove('mac-finder-opening');
        }, 920);
      } else if (!wasFinderActive && shouldAnimate && shouldUseMobileTransition) {
        document.body.classList.add('mac-finder-opening', 'mac-finder-booting');
        macFinderBootTimer = window.setTimeout(() => {
          document.body.classList.remove('mac-finder-opening', 'mac-finder-booting');
        }, 2500);
      }
    } else if (shouldAnimate && shouldUseTvTransition && document.body.classList.contains('mac-finder-active')) {
      finderMode.classList.remove('tv-open');
      document.body.classList.add('mac-finder-closing');
      macFinderCloseTimer = window.setTimeout(() => {
        document.body.classList.remove('mac-finder-active', 'mac-finder-closing');
      }, 820);
    } else if (shouldAnimate && shouldUseMobileTransition && document.body.classList.contains('mac-finder-active')) {
      document.body.classList.remove('mac-finder-booting');
      document.body.classList.add('mac-finder-mobile-closing');
      macFinderCloseTimer = window.setTimeout(() => {
        document.body.classList.remove('mac-finder-active', 'mac-finder-mobile-closing');
      }, 720);
    } else {
      document.body.classList.remove('mac-finder-active', 'mac-finder-closing', 'mac-finder-opening', 'mac-finder-booting', 'mac-finder-mobile-closing');
      if (finderMode) finderMode.classList.remove('tv-open');
    }

    if (shouldPersist) {
      sessionStorage.setItem(STORAGE_KEYS.homeMode, enabled ? 'finder' : 'normal');
    }
    toggles.forEach(toggle => {
      toggle.setAttribute('aria-pressed', enabled ? 'true' : 'false');
    });
    if (enabled && finderMode) {
      finderMode.dataset.pageOffset = '0';
      finderMode.classList.remove('is-pager-animating');
      finderMode.scrollTo({ left: 0, top: 0, behavior: 'auto' });
      if (finderScroller) finderScroller.scrollTo({ left: 0, top: 0, behavior: 'auto' });
      syncMacMobilePager();
      requestAnimationFrame(() => {
        finderMode.scrollTo({ left: 0, top: 0, behavior: 'auto' });
        if (finderScroller) finderScroller.scrollTo({ left: 0, top: 0, behavior: 'auto' });
        syncMacMobilePager();
      });
    }
  }

  function syncMacMobilePager() {
    const finderMode = document.getElementById('macFinderMode');
    if (!finderMode) return;
    const x = Number(finderMode.dataset.pageOffset || 0);
    const pageX = `${-x}px`;
    finderMode.style.setProperty('--mac-page-x', pageX);
    if (window.innerWidth <= 768) {
      finderMode.querySelectorAll('.mac-desktop, .mac-welcome, .mac-second-page-note').forEach(layer => {
        layer.style.transform = `translate3d(${pageX}, 0, 0)`;
      });
    } else {
      finderMode.querySelectorAll('.mac-desktop, .mac-welcome, .mac-second-page-note').forEach(layer => {
        layer.style.transform = '';
      });
    }
    finderMode.dataset.pageIndex = x > window.innerWidth * 0.5 ? '1' : '0';
    finderMode.querySelectorAll('.mac-page-dot').forEach((dot, index) => {
      dot.classList.toggle('is-active', index === Number(finderMode.dataset.pageIndex || 0));
    });
  }

  function updateMacMenuDateTime() {
    const dateEl = document.getElementById('macMenuDate');
    const clockEl = document.getElementById('macMenuClock');
    if (!dateEl || !clockEl) return;

    const now = new Date();
    const timeZone = 'Asia/Kolkata';
    dateEl.textContent = new Intl.DateTimeFormat('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      timeZone
    }).format(now);
    const puneTime = new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone
    }).format(now);
    clockEl.textContent = `Pune ${puneTime}`;
  }

  function toggleMacFinderMode() {
    const isFinderActive = document.body.classList.contains('mac-finder-active');
    if (!isFinderActive) {
      setMacFinderMode(true);
      return;
    }

    closeMacFinderWindow();
    document.querySelectorAll('.page-view').forEach(page => page.classList.remove('active'));
    document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));
    setMacFinderMode(false);
    persistViewState('');
    syncGlobalCloseButton();
    updateProgressSlider();
    requestAnimationFrame(() => {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    });
  }

  const MAC_APP_SPLASH = {
    home: { name: 'Safari', icon: 'safari.png' },
    work: { name: 'Work', icon: 'workmobile.png' },
    'how-i-ai': { name: 'How I AI', icon: 'howiaimobile.png' },
    resume: { name: 'Resume', icon: 'resumemobile.png' },
    contact: { name: 'Contact', icon: 'contacts.png' },
    about: { name: 'Notes', icon: 'notes.png' },
    settings: { name: 'Settings', icon: 'settings.png' }
  };

  function showMacAppSplash(id, onComplete) {
    const splash = document.getElementById('macAppSplash');
    const icon = document.getElementById('macAppSplashIcon');
    const name = document.getElementById('macAppSplashName');
    const app = MAC_APP_SPLASH[id] || { name: MAC_WINDOW_TITLES[id] || 'App', icon: 'workmobile.png' };

    if (!splash || window.innerWidth > 768) {
      onComplete();
      return;
    }

    if (icon) icon.src = app.icon;
    if (name) name.textContent = app.name;
    splash.classList.add('is-visible');
    window.setTimeout(() => {
      splash.classList.remove('is-visible');
      onComplete();
    }, 520);
  }

  function showMacComingSoonToast() {
    let toast = document.getElementById('macComingSoonToast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'macComingSoonToast';
      toast.className = 'mac-coming-soon-toast';
      document.body.appendChild(toast);
    }

    toast.textContent = 'Setting coming soon';
    toast.classList.add('is-visible');
    window.clearTimeout(showMacComingSoonToast.timer);
    showMacComingSoonToast.timer = window.setTimeout(() => {
      toast.classList.remove('is-visible');
    }, 1500);
  }

  function stripDuplicateIds(root) {
    root.querySelectorAll('[id]').forEach(el => el.removeAttribute('id'));
  }

  function createMacSafariNameBlock() {
    const nameBlock = document.createElement('div');
    nameBlock.className = 'mac-safari-big-name mac-safari-home-section';
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    svg.setAttribute('viewBox', '0 0 1200 240');
    svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    text.setAttribute('x', '600');
    text.setAttribute('y', '174');
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('textLength', '1120');
    text.setAttribute('lengthAdjust', 'spacingAndGlyphs');
    text.textContent = 'Rajat Girhotra';
    svg.appendChild(text);
    nameBlock.appendChild(svg);
    return nameBlock;
  }

  function buildMacSafariHome() {
    const content = document.getElementById('macSafariContent');
    if (!content) return;

    content.innerHTML = '';
    const page = document.createElement('div');
    page.className = 'mac-safari-page';

    const homeSections = [
      document.querySelector('body > .hero'),
      document.querySelector('body > .mobile-home-experience'),
      ...document.querySelectorAll('body > .work-section-wrapper'),
      document.querySelector('body > .site-footer')
    ].filter(Boolean);

    homeSections.forEach(source => {
      if (!source) return;

      const clone = source.cloneNode(true);
      if (source.classList && source.classList.contains('hero')) {
        clone.querySelector('#bigNameWrapper')?.remove();
        clone.appendChild(createMacSafariNameBlock());
      }

      stripDuplicateIds(clone);
      clone.querySelectorAll('.hero-transform-toggle, .floating-transform-toggle, script, canvas').forEach(el => el.remove());

      clone.classList.add('mac-safari-home-section');
      page.appendChild(clone);
    });

    content.appendChild(page);
    ensureImagesLoad(content);
  }

  function openMacSafariWindow() {
    const win = document.getElementById('macSafariWindow');
    if (!win) return;
    setMacFinderMode(true, { persist: false });
    buildMacSafariHome();
    win.classList.add('is-open');
    win.classList.remove('is-maximized', 'is-minimized');
    win.setAttribute('aria-hidden', 'false');
    syncMacMinimizedWindow(null);
  }

  function closeMacSafariWindow() {
    const win = document.getElementById('macSafariWindow');
    const content = document.getElementById('macSafariContent');
    if (!win) return;
    win.classList.remove('is-open', 'is-maximized', 'is-minimized');
    win.setAttribute('aria-hidden', 'true');
    if (content) content.innerHTML = '';
    syncMacMinimizedWindow(null);
  }

  function minimizeMacSafariWindow() {
    const win = document.getElementById('macSafariWindow');
    if (!win || !win.classList.contains('is-open')) return;
    win.classList.add('is-minimized');
    win.classList.remove('is-open');
    win.setAttribute('aria-hidden', 'true');
    syncMacMinimizedWindow('home', 'safari');
  }

  function toggleMacSafariWindowMaximize() {
    const win = document.getElementById('macSafariWindow');
    if (!win || !win.classList.contains('is-open')) return;
    win.classList.toggle('is-maximized');
  }

  function openMacShortcut(id) {
    if (id === 'settings') {
      if (window.innerWidth <= 768) showMacComingSoonToast();
      return;
    }

    if (id === 'home') {
      if (window.innerWidth <= 768) {
        showMacAppSplash('home', openMacSafariWindow);
      } else {
        openMacSafariWindow();
      }
      return;
    }

    if (window.innerWidth > 768 && id !== 'home') {
      setMacFinderMode(true, { persist: false });
      openMacFinderWindow(id);
      return;
    }

    showMacAppSplash(id, () => {
      setMacFinderMode(false, { persist: false, animate: false });
      openPage(id, { homeMode: 'finder' });
    });
  }

  function openMacWorkTab(tabId) {
    setWorkTab(tabId || 'office');
    openMacShortcut('work');
  }

  const MAC_WINDOW_TITLES = {
    home: 'Safari',
    work: 'Some of my work',
    'how-i-ai': 'How I AI',
    resume: 'Resume',
    contact: 'Contact',
    about: 'Notes',
    'life-insurance': 'Life Insurance',
    'go-leap': 'Go Leap',
    colrows: 'Colrows',
    'refi-nft-dashboard': 'ReFi NFT Dashboard',
    'health-insurance': 'Health Insurance',
    'car-insurance': 'Car Insurance'
  };

  const MAC_WINDOW_ICONS = {
    home: 'safari.png',
    work: 'folderwork.png',
    'how-i-ai': 'folderhowiai.png',
    resume: 'folderresume.png',
    contact: 'contacts.png',
    about: 'notes.png',
    'life-insurance': 'folderwork.png',
    'go-leap': 'folderwork.png',
    colrows: 'folderwork.png',
    'refi-nft-dashboard': 'folderwork.png',
    'health-insurance': 'folderwork.png',
    'car-insurance': 'folderwork.png'
  };

  function getMacWindowSource(pageId) {
    const page = document.getElementById('page-' + pageId);
    if (!page) return null;
    return page.querySelector('.page-inner, .case-study-page') || page;
  }

  function openMacFinderWindow(pageId, options = {}) {
    const win = document.getElementById('macFinderWindow');
    const content = document.getElementById('macFinderWindowContent');
    const page = document.getElementById('page-' + pageId);
    const source = getMacWindowSource(pageId);
    if (!win || !content || !source) return;

    closeMacSafariWindow();
    content.innerHTML = '';
    const clone = source.cloneNode(true);
    clone.querySelectorAll('.page-close, .global-page-close, .progress-slider-cs').forEach(el => el.remove());
    clone.querySelectorAll('[id]').forEach(el => el.removeAttribute('id'));
    clone.querySelectorAll('.image-skeleton-host').forEach(el => el.classList.add('is-loaded'));
    clone.querySelectorAll('img').forEach(img => {
      img.classList.add('is-loaded');
      img.loading = 'eager';
    });
    clone.classList.add('mac-window-clone');
    clone.dataset.sourcePage = pageId;
    win.dataset.currentPage = pageId;

    const isCaseStudy = Boolean(page && page.classList.contains('case-study-view'));
    if (!isCaseStudy) {
      win.dataset.folderPage = pageId;
    }

    const pageTitle = clone.querySelector('.page-title');
    if (pageTitle && MAC_WINDOW_TITLES[pageId]) {
      pageTitle.textContent = MAC_WINDOW_TITLES[pageId];
    }

    content.appendChild(clone);
    win.classList.add('is-open');
    win.classList.remove('is-maximized', 'is-minimized');
    win.setAttribute('aria-hidden', 'false');
    syncMacMinimizedWindow(null);
    constrainMacFinderWindow();
    ensureImagesLoad(content);
  }

  function openMacCaseWindow(pageId) {
    const win = document.getElementById('macCaseWindow');
    const content = document.getElementById('macCaseWindowContent');
    const source = getMacWindowSource(pageId);
    if (!win || !content || !source) return;

    content.innerHTML = '';
    const clone = source.cloneNode(true);
    clone.querySelectorAll('.page-close, .global-page-close, .progress-slider-cs, .mac-window-back').forEach(el => el.remove());
    clone.querySelectorAll('[id]').forEach(el => el.removeAttribute('id'));
    clone.querySelectorAll('.image-skeleton-host').forEach(el => el.classList.add('is-loaded'));
    clone.querySelectorAll('img').forEach(img => {
      img.classList.add('is-loaded');
      img.loading = 'eager';
    });
    clone.classList.add('mac-window-clone', 'mac-case-window-clone');
    clone.dataset.sourcePage = pageId;
    win.dataset.currentPage = pageId;

    content.appendChild(clone);
    win.classList.add('is-open');
    win.classList.remove('is-maximized', 'is-minimized');
    win.setAttribute('aria-hidden', 'false');
    syncMacMinimizedWindow(null);
    constrainMacCaseWindow();
    ensureImagesLoad(content);
  }

  function syncMacMinimizedWindow(pageId, windowType = 'finder') {
    const item = document.getElementById('macMinimizedWindow');
    const icon = document.getElementById('macMinimizedWindowIcon');
    const label = document.getElementById('macMinimizedWindowLabel');
    if (!item) return;

    if (!pageId) {
      item.hidden = true;
      delete item.dataset.windowType;
      delete item.dataset.pageId;
      return;
    }

    item.dataset.windowType = windowType;
    item.dataset.pageId = pageId;
    if (icon) icon.src = MAC_WINDOW_ICONS[pageId] || 'folderwork.png';
    if (label) label.textContent = MAC_WINDOW_TITLES[pageId] || 'Window';
    item.hidden = false;
  }

  function minimizeMacFinderWindow() {
    const win = document.getElementById('macFinderWindow');
    if (!win || !win.classList.contains('is-open')) return;

    const pageId = win.dataset.currentPage || win.dataset.folderPage || 'work';
    win.classList.add('is-minimized');
    win.classList.remove('is-open');
    win.setAttribute('aria-hidden', 'true');
    syncMacMinimizedWindow(pageId, 'finder');
  }

  function minimizeMacCaseWindow() {
    const win = document.getElementById('macCaseWindow');
    if (!win || !win.classList.contains('is-open')) return;

    const pageId = win.dataset.currentPage || 'work';
    win.classList.add('is-minimized');
    win.classList.remove('is-open');
    win.setAttribute('aria-hidden', 'true');
    syncMacMinimizedWindow(pageId, 'case');
  }

  function restoreMacFinderWindow() {
    const item = document.getElementById('macMinimizedWindow');
    const windowType = item ? item.dataset.windowType : '';
    if (windowType === 'safari') {
      const win = document.getElementById('macSafariWindow');
      if (!win) return;
      win.classList.remove('is-minimized');
      win.classList.add('is-open');
      win.setAttribute('aria-hidden', 'false');
      syncMacMinimizedWindow(null);
      return;
    }
    if (windowType === 'case') {
      restoreMacCaseWindow();
      return;
    }

    const win = document.getElementById('macFinderWindow');
    if (!win) return;
    win.classList.remove('is-minimized');
    win.classList.add('is-open');
    win.setAttribute('aria-hidden', 'false');
    syncMacMinimizedWindow(null);
    constrainMacFinderWindow();
  }

  function restoreMacCaseWindow() {
    const win = document.getElementById('macCaseWindow');
    if (!win) return;
    win.classList.remove('is-minimized');
    win.classList.add('is-open');
    win.setAttribute('aria-hidden', 'false');
    syncMacMinimizedWindow(null);
    constrainMacCaseWindow();
  }

  function closeMacFinderWindow() {
    const win = document.getElementById('macFinderWindow');
    const content = document.getElementById('macFinderWindowContent');
    if (!win) return;
    win.classList.remove('is-open', 'is-maximized', 'is-minimized');
    win.setAttribute('aria-hidden', 'true');
    delete win.dataset.currentPage;
    if (content) content.innerHTML = '';
    syncMacMinimizedWindow(null);
  }

  function closeMacCaseWindow() {
    const win = document.getElementById('macCaseWindow');
    const content = document.getElementById('macCaseWindowContent');
    if (!win) return;
    win.classList.remove('is-open', 'is-maximized', 'is-minimized');
    win.setAttribute('aria-hidden', 'true');
    delete win.dataset.currentPage;
    if (content) content.innerHTML = '';
    syncMacMinimizedWindow(null);
  }

  function toggleMacFinderWindowMaximize() {
    const win = document.getElementById('macFinderWindow');
    if (!win || !win.classList.contains('is-open')) return;
    if (win.classList.contains('is-maximized')) {
      win.classList.remove('is-maximized');
      win.style.left = win.dataset.restoreLeft || win.style.left;
      win.style.top = win.dataset.restoreTop || win.style.top;
      constrainMacFinderWindow();
      return;
    }

    const rect = win.getBoundingClientRect();
    win.dataset.restoreLeft = win.style.left || `${rect.left}px`;
    win.dataset.restoreTop = win.style.top || `${rect.top}px`;
    win.style.left = '';
    win.style.top = '';
    win.classList.add('is-maximized');
  }

  function toggleMacCaseWindowMaximize() {
    const win = document.getElementById('macCaseWindow');
    if (!win || !win.classList.contains('is-open')) return;
    if (win.classList.contains('is-maximized')) {
      win.classList.remove('is-maximized');
      win.style.left = win.dataset.restoreLeft || win.style.left;
      win.style.top = win.dataset.restoreTop || win.style.top;
      constrainMacCaseWindow();
      return;
    }

    const rect = win.getBoundingClientRect();
    win.dataset.restoreLeft = win.style.left || `${rect.left}px`;
    win.dataset.restoreTop = win.style.top || `${rect.top}px`;
    win.style.left = '';
    win.style.top = '';
    win.classList.add('is-maximized');
  }

  function constrainMacWindowById(windowId) {
    const win = document.getElementById(windowId);
    if (!win || !win.classList.contains('is-open') || win.classList.contains('is-maximized')) return;

    const rect = win.getBoundingClientRect();
    const margin = 12;
    const left = Number.parseFloat(win.style.left || rect.left);
    const top = Number.parseFloat(win.style.top || rect.top);
    const maxLeft = Math.max(margin, window.innerWidth - rect.width - margin);
    const maxTop = Math.max(margin, window.innerHeight - rect.height - margin);
    win.style.left = `${Math.min(Math.max(left, margin), maxLeft)}px`;
    win.style.top = `${Math.min(Math.max(top, margin), maxTop)}px`;
  }

  function constrainMacFinderWindow() {
    constrainMacWindowById('macFinderWindow');
  }

  function constrainMacCaseWindow() {
    constrainMacWindowById('macCaseWindow');
  }

  function constrainMacSafariWindow() {
    constrainMacWindowById('macSafariWindow');
  }

  function setupMacWindowDrag(windowId, constrainFn, chromeSelector = '.mac-window-chrome') {
    const win = document.getElementById(windowId);
    const chrome = win ? win.querySelector(chromeSelector) : null;
    if (!win || !chrome) return;

    let startX = 0;
    let startY = 0;
    let startLeft = 0;
    let startTop = 0;
    let isDragging = false;

    chrome.addEventListener('pointerdown', event => {
      if (window.innerWidth <= 768 || event.button !== 0) return;
      if (event.target.closest('.mac-window-control')) return;

      if (win.classList.contains('is-maximized')) {
        win.classList.remove('is-maximized');
        win.style.left = win.dataset.restoreLeft || '40px';
        win.style.top = win.dataset.restoreTop || '56px';
      }

      const rect = win.getBoundingClientRect();
      startX = event.clientX;
      startY = event.clientY;
      startLeft = rect.left;
      startTop = rect.top;
      isDragging = true;
      win.classList.add('is-dragging');
      chrome.setPointerCapture(event.pointerId);
      event.preventDefault();
    });

    chrome.addEventListener('pointermove', event => {
      if (!isDragging) return;

      const rect = win.getBoundingClientRect();
      const margin = 12;
      const nextLeft = startLeft + event.clientX - startX;
      const nextTop = startTop + event.clientY - startY;
      const maxLeft = Math.max(margin, window.innerWidth - rect.width - margin);
      const maxTop = Math.max(margin, window.innerHeight - rect.height - margin);
      win.style.left = `${Math.min(Math.max(nextLeft, margin), maxLeft)}px`;
      win.style.top = `${Math.min(Math.max(nextTop, margin), maxTop)}px`;
    });

    const endDrag = event => {
      if (!isDragging) return;
      isDragging = false;
      win.classList.remove('is-dragging');
      if (chrome.hasPointerCapture(event.pointerId)) {
        chrome.releasePointerCapture(event.pointerId);
      }
    };

    chrome.addEventListener('pointerup', endDrag);
    chrome.addEventListener('pointercancel', endDrag);
    window.addEventListener('resize', constrainFn, { passive: true });
  }

  function setupMacFinderWindowDrag() {
    setupMacWindowDrag('macFinderWindow', constrainMacFinderWindow);
    setupMacWindowDrag('macCaseWindow', constrainMacCaseWindow);
    setupMacWindowDrag('macSafariWindow', constrainMacSafariWindow, '.mac-safari-chrome');
  }

  const STORAGE_KEYS = {
    page: 'portfolio-active-page',
    workTab: 'portfolio-work-tab',
    howAiTab: 'portfolio-how-ai-tab',
    homeMode: 'portfolio-home-mode'
  };

  function getPageIdFromElement(pageEl) {
    return pageEl ? pageEl.id.replace(/^page-/, '') : '';
  }

  function persistViewState(pageIdOverride) {
    const activePage = document.querySelector('.page-view.active');
    const pageId = typeof pageIdOverride === 'string' ? pageIdOverride : getPageIdFromElement(activePage);
    sessionStorage.setItem(STORAGE_KEYS.page, pageId || '');

    const activeWorkTab = document.querySelector('[data-work-tab].is-active');
    if (activeWorkTab) {
      sessionStorage.setItem(STORAGE_KEYS.workTab, activeWorkTab.dataset.workTab);
    }

    const activeHowAiTab = document.querySelector('[data-how-ai-tab].is-active');
    if (activeHowAiTab) {
      sessionStorage.setItem(STORAGE_KEYS.howAiTab, activeHowAiTab.dataset.howAiTab);
    }
  }

  function getCurrentHomeMode() {
    return document.body.classList.contains('mac-finder-active') ? 'finder' : 'normal';
  }

  function openPage(id, options = {}) {
    closeMobileMenu();
    const currentActivePage = document.querySelector('.page-view.active');
    const homeMode = options.homeMode || (currentActivePage && currentActivePage.dataset.homeMode) || getCurrentHomeMode();
    setMacFinderMode(false, { persist: false, animate: false });
    document.querySelectorAll('.page-view').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
    const page = document.getElementById('page-' + id);
    if (page) {
      if (page.classList.contains('case-study-view') && currentActivePage) {
        page.dataset.returnTo = getPageIdFromElement(currentActivePage);
        page.dataset.homeMode = currentActivePage.dataset.homeMode || homeMode;
      } else if (!page.classList.contains('case-study-view')) {
        document.querySelectorAll('.case-study-view').forEach(caseStudy => {
          delete caseStudy.dataset.returnTo;
          delete caseStudy.dataset.homeMode;
        });
        page.dataset.homeMode = homeMode;
      }
      page.classList.add('active');
      ensureImagesLoad(page);
      page.scrollTop = 0;
      updateCsProgressSlider(page);
    }
    syncGlobalCloseButton();
    document.querySelectorAll('.nav-link').forEach(l => {
      if (l.getAttribute('onclick').includes(id)) l.classList.add('active');
    });
    persistViewState(id);
  }

  function setWorkTab(tabId, triggerEl) {
    document.querySelectorAll('.work-tab').forEach(tab => {
      const isActive = tab.dataset.workTab === tabId;
      tab.classList.toggle('is-active', isActive);
      tab.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });

    let activePanel = null;
    document.querySelectorAll('.work-tab-panel').forEach(panel => {
      const isActive = panel.dataset.workPanel === tabId;
      panel.classList.toggle('is-active', isActive);
      panel.hidden = !isActive;
      if (isActive) activePanel = panel;
    });
    ensureImagesLoad(activePanel);

    if (triggerEl) {
      triggerEl.blur();
    }
    sessionStorage.setItem(STORAGE_KEYS.workTab, tabId);
  }

  function setHowIAITab(tabId, triggerEl) {
    document.querySelectorAll('[data-how-ai-tab]').forEach(tab => {
      const isActive = tab.dataset.howAiTab === tabId;
      tab.classList.toggle('is-active', isActive);
      tab.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });

    let activePanel = null;
    document.querySelectorAll('[data-how-ai-panel]').forEach(panel => {
      const isActive = panel.dataset.howAiPanel === tabId;
      panel.classList.toggle('is-active', isActive);
      panel.hidden = !isActive;
      if (isActive) activePanel = panel;
    });
    ensureImagesLoad(activePanel);

    if (triggerEl) {
      triggerEl.blur();
    }
    sessionStorage.setItem(STORAGE_KEYS.howAiTab, tabId);
  }

  function closePage() {
    closeMobileMenu();
    const activePage = document.querySelector('.page-view.active');
    const returnTo = activePage && activePage.classList.contains('case-study-view') ? activePage.dataset.returnTo : '';
    const homeMode = activePage && activePage.dataset.homeMode ? activePage.dataset.homeMode : sessionStorage.getItem(STORAGE_KEYS.homeMode) || 'finder';

    document.querySelectorAll('.page-view').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));

    if (returnTo) {
      const returnPage = document.getElementById('page-' + returnTo);
      if (returnPage) {
        returnPage.classList.add('active');
        returnPage.dataset.homeMode = homeMode;
        ensureImagesLoad(returnPage);
        updateCsProgressSlider(returnPage);
        document.querySelectorAll('.nav-link').forEach(l => {
          if (l.getAttribute('onclick').includes(returnTo)) l.classList.add('active');
        });
        syncGlobalCloseButton();
        persistViewState(returnTo);
        return;
      }
    }

    setMacFinderMode(homeMode === 'finder', { animate: false });
    syncGlobalCloseButton();
    persistViewState('');
    updateProgressSlider();
  }

  function mobileWorkBack() {
    if (window.history.length > 1 && document.referrer) {
      window.history.back();
      return;
    }
    closePage();
  }

  const siteLoader = document.getElementById('site-loader');
  let hasRevealedSite = false;
  let hasInitializedNameEffects = false;

  function afterDomReady() {
    if (document.readyState === 'loading') {
      return new Promise(resolve => {
        document.addEventListener('DOMContentLoaded', resolve, { once: true });
      });
    }
    return Promise.resolve();
  }

  function withTimeout(promise, timeoutMs) {
    return Promise.race([
      promise,
      new Promise(resolve => window.setTimeout(resolve, timeoutMs))
    ]);
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
        window.setTimeout(resolve, 1200);
      });
    }));
  }

  function waitForFinderAssets() {
    const assets = window.innerWidth <= 768
      ? ['movbilebackground.jpg', 'workmobile.png', 'howiaimobile.png', 'resumemobile.png', 'safari.png', 'contacts.png', 'settings.png', 'notes.png']
      : ['background-1800.jpg', 'folderwork.png', 'folderhowiai.png', 'folderresume.png', 'safari.png', 'contacts.png', 'settings.png', 'notes.png'];

    return Promise.all(assets.map(src => new Promise(resolve => {
      const img = new Image();
      img.onload = resolve;
      img.onerror = resolve;
      img.src = src;
    })));
  }

  function isMobileImageRuntime() {
    return window.innerWidth <= 768 || (window.matchMedia && window.matchMedia('(pointer: coarse)').matches);
  }

  function ensureImagesLoad(root = document) {
    if (!root || !isMobileImageRuntime()) return;

    root.querySelectorAll('img').forEach(img => {
      if (siteLoader && siteLoader.contains(img)) return;

      img.loading = 'eager';
      if (!img.decoding) {
        img.decoding = 'async';
      }

      const picture = img.closest('picture');
      if (picture) {
        picture.querySelectorAll('source[srcset]').forEach(source => {
          const srcset = source.getAttribute('srcset');
          if (srcset) {
            source.setAttribute('srcset', srcset);
          }
        });
      }

      const src = img.getAttribute('src');
      if ((!img.complete || img.naturalWidth === 0) && src) {
        img.setAttribute('src', src);
      }

      if (img.decode) {
        img.decode().catch(() => {});
      }
    });
  }

  function ensureInitialMobileImages() {
    const activePage = document.querySelector('.page-view.active');
    if (activePage) {
      ensureImagesLoad(activePage);
      return;
    }

    ensureImagesLoad(document.querySelector('.hero'));
    ensureImagesLoad(document.querySelector('.mobile-home-experience'));
    ensureImagesLoad(document.querySelector('.portfolio-section .portfolio-container'));
  }

  function setupImageSkeletons() {
    document.querySelectorAll('img').forEach(img => {
      if (siteLoader && siteLoader.contains(img)) return;

      const host = img.closest('.portfolio-project-image, .case-study-hero-media, .resume-preview, .artwork-figure, .portfolio-card');
      if (!host) return;

      host.classList.add('image-skeleton-host');
      img.classList.add('image-skeleton');

      const markReady = () => {
        host.classList.add('is-loaded');
        img.classList.add('is-loaded');
      };

      if (img.complete && img.naturalWidth > 0) {
        if (img.decode) {
          img.decode().catch(() => {}).finally(markReady);
        } else {
          markReady();
        }
        return;
      }

      img.addEventListener('load', () => {
        if (img.decode) {
          img.decode().catch(() => {}).finally(markReady);
        } else {
          markReady();
        }
      }, { once: true });

      img.addEventListener('error', markReady, { once: true });
    });
  }

  function initializeNameEffects() {
    if (hasInitializedNameEffects) return;
    hasInitializedNameEffects = true;

    const fontsReady = document.fonts ? document.fonts.ready.catch(() => {}) : Promise.resolve();
    fontsReady.then(() => {
      fitName();
      fitFooterName();
      setTimeout(fitName, 100);
      setTimeout(fitFooterName, 100);
      setTimeout(() => {
        splitIntoLetters();
        splitFooterIntoLetters();
        fitFooterName();
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

            setTimeout(() => {
              el.setAttribute('fill', getBaseColor());
            }, 400);
          }, i * interval);
        });
      }, 200);
    });
  }

  function revealSite() {
    if (hasRevealedSite) return;
    hasRevealedSite = true;

    fitName();
    fitFooterName();
    update();
    updateProgressSlider();
    document.querySelectorAll('.page-view.active').forEach(updateCsProgressSlider);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        document.body.classList.add('is-loaded');
        document.body.classList.remove('is-loading');
        syncCursorMode();
        initializeNameEffects();
        initMobileHeroNameEffect();

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
  const footerNameWrap = document.querySelector('.footer-name');
  const footerNameSvg = document.getElementById('footerNameSvg');
  const footerNameText = document.getElementById('footerNameText');

  const SIDE_PAD = 200;
  let nameHeight   = 0;
  let bottomOffset = 0;
  let triggerScrollY = null; // scrollY when portfolio section fully leaves viewport

  function fitName() {
    const W = window.innerWidth;
    const isMobile = W <= 768;
    const H = isMobile && window.visualViewport ? window.visualViewport.height : window.innerHeight;
    const navHeight = isMobile ? 58 : 74;
    bottomOffset = 0;

    if (isMobile) {
      wrapper.style.display = 'none';
      wrapper.style.position = 'absolute';
      heroCenter.style.top = 'calc(50% + 32px)';
      heroCenter.style.transform = 'translate(-50%, -50%)';
      return;
    }

    wrapper.style.display = '';
    heroCenter.style.transform = 'translateX(-50%)';

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
      wrapper.style.bottom = bottomOffset + 'px';
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
      wrapper.style.pointerEvents = 'auto';
      wrapper.style.transition = 'filter 0.12s linear';
      update();
    }
  }

  function fitFooterName() {
    if (!footerNameWrap || !footerNameSvg || !footerNameText) return;

    const isMobile = window.innerWidth <= 768;
    const availableWidth = footerNameWrap.clientWidth;
    if (!availableWidth) return;

    const baseFontSize = isMobile ? 230 : 390;
    const baseLetterSpacing = isMobile ? -18 : -30;
    const hasSplitLetters = footerNameText.querySelector('tspan');

    if (!hasSplitLetters) {
      footerNameText.textContent = 'Rajat Girhotra';
    }

    footerNameText.setAttribute('font-size', String(baseFontSize));
    footerNameText.setAttribute('letter-spacing', String(baseLetterSpacing));
    footerNameText.setAttribute('x', '0');
    footerNameText.setAttribute('y', isMobile ? '220' : '332');

    const bbox = footerNameText.getBBox();
    if (!bbox.width) return;

    const scale = availableWidth / bbox.width;
    footerNameText.setAttribute('font-size', (baseFontSize * scale).toFixed(2));
    footerNameText.setAttribute('letter-spacing', (baseLetterSpacing * scale).toFixed(2));

    const fittedBox = footerNameText.getBBox();
    footerNameSvg.setAttribute(
      'viewBox',
      `${(fittedBox.x - 6).toFixed(2)} ${(fittedBox.y - 8).toFixed(2)} ${(fittedBox.width + 12).toFixed(2)} ${(fittedBox.height + 16).toFixed(2)}`
    );
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
      const fadeStart = nameBottomInViewport + 120;
      const fadeEnd = nameTopInViewport - Math.max(180, nameHeight * 0.32);
      const fadeRange = Math.max(1, fadeStart - fadeEnd);
      const rawFade = Math.max(0, Math.min(1, (fadeStart - rect.top) / fadeRange));
      const easedFade = rawFade * rawFade * (3 - 2 * rawFade);
      const nameOpacity = 1 - easedFade;
      wrapper.style.opacity = nameOpacity.toFixed(3);
      wrapper.style.pointerEvents = nameOpacity > 0.08 ? 'auto' : 'none';

      if (rect.bottom > H / 2 || nameOpacity > 0.02) {
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
      wrapper.style.pointerEvents = 'auto';
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

  window.addEventListener('resize', fitName);
  window.addEventListener('resize', fitFooterName);
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', fitName);
    window.visualViewport.addEventListener('resize', fitFooterName);
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

  if (globalPageClose) {
    globalPageClose.addEventListener('touchend', event => {
      event.preventDefault();
      closePage();
    }, { passive: false });
  }

  function syncGlobalProgressVisibility() {
    if (!progressSlider) return;
    progressSlider.style.display = window.innerWidth > 768 ? 'flex' : 'none';
  }

  function syncGlobalCloseButton() {
    if (!globalPageClose) return;
    const activePage = document.querySelector('.page-view.active');
    document.body.classList.toggle('has-active-page', Boolean(activePage));
    document.body.classList.toggle('active-work-page', Boolean(activePage && activePage.id === 'page-work'));
    globalPageClose.classList.toggle('is-visible', Boolean(activePage));
  }

  function syncDesktopTabFloat(pageEl) {
    const activePage = pageEl || document.querySelector('#page-work.page-view.active, #page-how-i-ai.page-view.active');
    const allFloatingTabs = document.querySelectorAll('#page-work .work-tabs, #page-how-i-ai .work-tabs');

    if (!activePage || window.innerWidth <= 768) {
      allFloatingTabs.forEach(tab => {
        tab.style.setProperty('--tab-dock-x', '0px');
        tab.style.setProperty('--tab-dock-y', '0px');
      });
      return;
    }

    const tabs = activePage.querySelector('.work-tabs');
    const pageInner = activePage.querySelector('.page-inner');
    const nav = document.querySelector('nav');
    if (!tabs || !pageInner) return;

    tabs.style.setProperty('--tab-dock-x', '0px');
    tabs.style.setProperty('--tab-dock-y', '0px');

    const scrollTop = activePage.scrollTop;
    const progress = Math.max(0, Math.min(scrollTop / 360, 1));
    const tabsRect = tabs.getBoundingClientRect();
    const navRect = nav ? nav.getBoundingClientRect() : { top: 0, height: 72, left: 0, width: window.innerWidth };
    const naturalLeft = tabsRect.left;
    const naturalTop = tabsRect.top;
    const targetLeft = (window.innerWidth - tabs.offsetWidth) / 2;
    const targetTop = navRect.top + ((navRect.height - tabs.offsetHeight) / 2);
    const shiftX = (targetLeft - naturalLeft) * progress;
    const shiftY = (targetTop - naturalTop) * progress;

    tabs.style.setProperty('--tab-dock-x', `${shiftX.toFixed(2)}px`);
    tabs.style.setProperty('--tab-dock-y', `${shiftY.toFixed(2)}px`);
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

  function updateNavFillState(activePage) {
    const pageScrollTop = activePage ? activePage.scrollTop : 0;
    const shouldFillNav = pageScrollTop > 2 || window.scrollY > 2;
    document.body.classList.toggle('nav-filled', shouldFillNav);
  }

  function syncTransformCtaFloat(activePage) {
    const hero = document.querySelector('.hero');
    const isFinderActive = document.body.classList.contains('mac-finder-active');
    const shouldFloat = Boolean(
      hero &&
      !activePage &&
      !isFinderActive &&
      window.scrollY > Math.max(160, hero.offsetHeight * 0.72)
    );
    document.body.classList.toggle('show-transform-fab', shouldFloat);
  }

  function getOverlayProgress(pageEl) {
    if (!pageEl) return 0;
    const scrollTop = pageEl.scrollTop;
    const scrollHeight = pageEl.scrollHeight - pageEl.clientHeight;
    return scrollHeight > 0 ? scrollTop / scrollHeight : 0;
  }

  function updateProgressSlider() {
    const activePage = document.querySelector('.page-view.active');
    syncGlobalProgressVisibility();
    syncGlobalCloseButton();
    syncDesktopTabFloat(activePage);
    updateNavFillState(activePage);
    syncTransformCtaFloat(activePage);
    if (activePage) {
      setGlobalProgress(getOverlayProgress(activePage));
      return;
    }

    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = docHeight > 0 ? scrollTop / docHeight : 0;
    setGlobalProgress(progress);
  }

  function updateCsProgressSlider(pageEl) {
    if (!pageEl || !pageEl.classList.contains('active')) return;
    syncGlobalProgressVisibility();
    updateNavFillState(pageEl);
    syncTransformCtaFloat(pageEl);
    setGlobalProgress(getOverlayProgress(pageEl));
    syncDesktopTabFloat(pageEl);
  }

  window.addEventListener('scroll', updateProgressSlider, { passive: true });
  document.querySelectorAll('.page-view').forEach(pageView => {
    pageView.addEventListener('scroll', () => updateCsProgressSlider(pageView), { passive: true });
  });
  const macWindowContent = document.getElementById('macFinderWindowContent');
  if (macWindowContent) {
    macWindowContent.addEventListener('click', event => {
      const actionEl = event.target.closest('[onclick]');
      if (!actionEl) return;
      const action = actionEl.getAttribute('onclick') || '';
      const match = action.match(/openPage\('([^']+)'\)/);
      if (!match) return;
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      openMacCaseWindow(match[1]);
    }, true);

    macWindowContent.addEventListener('keydown', event => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      const actionEl = event.target.closest('[onclick]');
      if (!actionEl) return;
      const action = actionEl.getAttribute('onclick') || '';
      const match = action.match(/openPage\('([^']+)'\)/);
      if (!match) return;
      event.preventDefault();
      event.stopPropagation();
      openMacCaseWindow(match[1]);
    }, true);
  }
  const macMobileScroller = document.querySelector('.mac-mobile-scroll-pages');
  const macFinderMode = document.getElementById('macFinderMode');
  if (macMobileScroller && macFinderMode) {
    let macTouchStartX = 0;
    let macTouchStartY = 0;
    let macStartOffset = 0;
    let macCurrentOffset = 0;
    let macPagerRaf = 0;
    let macIsDragging = false;

    const setMacOffset = (offset, shouldAnimate = false) => {
      const maxOffset = window.innerWidth;
      macCurrentOffset = Math.max(0, Math.min(offset, maxOffset));
      macFinderMode.dataset.pageOffset = String(macCurrentOffset);
      macFinderMode.classList.toggle('is-pager-animating', shouldAnimate);

      if (macPagerRaf) cancelAnimationFrame(macPagerRaf);
      macPagerRaf = requestAnimationFrame(syncMacMobilePager);
    };

    const snapMacPager = () => {
      const wasOnSecondPage = macStartOffset > window.innerWidth * 0.5;
      const threshold = wasOnSecondPage ? window.innerWidth * 0.82 : window.innerWidth * 0.32;
      const target = macCurrentOffset > threshold ? window.innerWidth : 0;
      setMacOffset(target, true);
      window.setTimeout(() => {
        macFinderMode.classList.remove('is-pager-animating');
      }, 280);
    };

    const pagerInputTarget = macFinderMode;

    pagerInputTarget.addEventListener('touchstart', event => {
      const touch = event.touches[0];
      if (!touch) return;
      macCurrentOffset = Number(macFinderMode.dataset.pageOffset || 0);
      macTouchStartX = touch.clientX;
      macTouchStartY = touch.clientY;
      macStartOffset = macCurrentOffset;
      macIsDragging = false;
      macFinderMode.classList.remove('is-pager-animating');
    }, { passive: true });

    pagerInputTarget.addEventListener('touchmove', event => {
      if (!document.body.classList.contains('mac-finder-active')) return;
      const touch = event.touches[0];
      if (!touch) return;
      const deltaX = macTouchStartX - touch.clientX;
      const deltaY = macTouchStartY - touch.clientY;
      if (!macIsDragging && Math.abs(deltaX) < 8) return;
      if (!macIsDragging && Math.abs(deltaY) > Math.abs(deltaX)) return;
      macIsDragging = true;
      setMacOffset(macStartOffset + deltaX);
      event.preventDefault();
    }, { passive: false });

    pagerInputTarget.addEventListener('touchend', () => {
      if (!macIsDragging) return;
      macIsDragging = false;
      snapMacPager();
    }, { passive: true });

    pagerInputTarget.addEventListener('wheel', event => {
      if (!document.body.classList.contains('mac-finder-active') || window.innerWidth > 768) return;
      const delta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
      setMacOffset(macCurrentOffset + delta, true);
      window.clearTimeout(macFinderMode._wheelSnapTimer);
      macFinderMode._wheelSnapTimer = window.setTimeout(snapMacPager, 140);
    }, { passive: true });
  }

  function setupMobileFinderItemDrag() {
    const finderMode = document.getElementById('macFinderMode');
    if (!finderMode) return;

    const getTranslate = item => ({
      x: Number.parseFloat(item.style.getPropertyValue('--mac-item-x') || '0') || 0,
      y: Number.parseFloat(item.style.getPropertyValue('--mac-item-y') || '0') || 0
    });

    const clampItem = (item, nextX, nextY) => {
      const rect = item.getBoundingClientRect();
      const current = getTranslate(item);
      const baseLeft = rect.left - current.x;
      const baseTop = rect.top - current.y;
      const margin = 8;
      const maxX = window.innerWidth - margin - rect.width - baseLeft;
      const minX = margin - baseLeft;
      const maxY = window.innerHeight - margin - rect.height - baseTop;
      const minY = margin - baseTop;
      return {
        x: Math.min(Math.max(nextX, minX), maxX),
        y: Math.min(Math.max(nextY, minY), maxY)
      };
    };

    const draggableSelector = '.mac-folder, .mac-welcome .mac-note-image, .mac-second-page-note img';
    finderMode.addEventListener('pointerdown', event => {
      if (window.innerWidth > 768 || !document.body.classList.contains('mac-finder-active')) return;
      const item = event.target.closest(draggableSelector);
      if (!item || !finderMode.contains(item)) return;

      const start = getTranslate(item);
      const startX = event.clientX;
      const startY = event.clientY;
      let didDrag = false;

      const move = moveEvent => {
        const deltaX = moveEvent.clientX - startX;
        const deltaY = moveEvent.clientY - startY;
        if (!didDrag && Math.hypot(deltaX, deltaY) < 8) return;
        didDrag = true;
        item.dataset.wasDragged = 'true';
        const next = clampItem(item, start.x + deltaX, start.y + deltaY);
        item.style.setProperty('--mac-item-x', `${next.x.toFixed(1)}px`);
        item.style.setProperty('--mac-item-y', `${next.y.toFixed(1)}px`);
        moveEvent.preventDefault();
      };

      const up = () => {
        window.removeEventListener('pointermove', move);
        window.removeEventListener('pointerup', up);
        window.removeEventListener('pointercancel', up);
        if (didDrag) {
          window.setTimeout(() => {
            delete item.dataset.wasDragged;
          }, 0);
        }
      };

      window.addEventListener('pointermove', move, { passive: false });
      window.addEventListener('pointerup', up, { once: true });
      window.addEventListener('pointercancel', up, { once: true });
    });

    finderMode.addEventListener('click', event => {
      const item = event.target.closest(draggableSelector);
      if (!item || item.dataset.wasDragged !== 'true') return;
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
    }, true);
  }

  function setupDesktopFinderItemDrag() {
    const finderMode = document.getElementById('macFinderMode');
    if (!finderMode) return;

    const draggableSelector = '.mac-welcome, .mac-folder, .mac-dock-item';

    const getTranslate = item => ({
      x: Number.parseFloat(item.style.getPropertyValue('--mac-item-x') || '0') || 0,
      y: Number.parseFloat(item.style.getPropertyValue('--mac-item-y') || '0') || 0
    });

    const clampItem = (item, nextX, nextY) => {
      const rect = item.getBoundingClientRect();
      const current = getTranslate(item);
      const baseLeft = rect.left - current.x;
      const baseTop = rect.top - current.y;
      const margin = 12;
      const maxX = window.innerWidth - margin - rect.width - baseLeft;
      const minX = margin - baseLeft;
      const maxY = window.innerHeight - margin - rect.height - baseTop;
      const minY = margin - baseTop;
      return {
        x: Math.min(Math.max(nextX, minX), maxX),
        y: Math.min(Math.max(nextY, minY), maxY)
      };
    };

    finderMode.addEventListener('pointerdown', event => {
      if (window.innerWidth <= 768 || !document.body.classList.contains('mac-finder-active')) return;
      if (event.button !== 0) return;
      if (event.target.closest('.mac-window, .mac-safari-window')) return;

      const item = event.target.closest(draggableSelector);
      if (!item || !finderMode.contains(item) || item.hidden) return;

      const start = getTranslate(item);
      const startX = event.clientX;
      const startY = event.clientY;
      let didDrag = false;

      const move = moveEvent => {
        const deltaX = moveEvent.clientX - startX;
        const deltaY = moveEvent.clientY - startY;
        if (!didDrag && Math.hypot(deltaX, deltaY) < 6) return;
        didDrag = true;
        item.dataset.wasDragged = 'true';
        item.classList.add('is-dragging');
        const next = clampItem(item, start.x + deltaX, start.y + deltaY);
        item.style.setProperty('--mac-item-x', `${next.x.toFixed(1)}px`);
        item.style.setProperty('--mac-item-y', `${next.y.toFixed(1)}px`);
        moveEvent.preventDefault();
      };

      const up = () => {
        item.classList.remove('is-dragging');
        window.removeEventListener('pointermove', move);
        window.removeEventListener('pointerup', up);
        window.removeEventListener('pointercancel', up);
        if (didDrag) {
          window.setTimeout(() => {
            delete item.dataset.wasDragged;
          }, 0);
        }
      };

      window.addEventListener('pointermove', move, { passive: false });
      window.addEventListener('pointerup', up, { once: true });
      window.addEventListener('pointercancel', up, { once: true });
    });

    finderMode.addEventListener('click', event => {
      const item = event.target.closest(draggableSelector);
      if (!item || item.dataset.wasDragged !== 'true') return;
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
    }, true);
  }
  const systemThemeQuery = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;

  if (systemThemeQuery) {
    const handleSystemThemeChange = event => {
      applyThemeState(event.matches);
    };

    if (typeof systemThemeQuery.addEventListener === 'function') {
      systemThemeQuery.addEventListener('change', handleSystemThemeChange);
    } else if (typeof systemThemeQuery.addListener === 'function') {
      systemThemeQuery.addListener(handleSystemThemeChange);
    }
  }

  setupMacFinderWindowDrag();
  setupMobileFinderItemDrag();
  setupDesktopFinderItemDrag();
  updateMacMenuDateTime();
  window.setInterval(updateMacMenuDateTime, 30000);
  syncThemeImages();
  syncGlobalCloseButton();
  syncDesktopTabFloat();
  updateProgressSlider();
  const bootSavedPage = sessionStorage.getItem(STORAGE_KEYS.page);
  const bootHomeMode = bootSavedPage ? (sessionStorage.getItem(STORAGE_KEYS.homeMode) || 'finder') : 'finder';
  setMacFinderMode(bootHomeMode === 'finder', { persist: false });

  afterDomReady().then(() => {
    const savedWorkTab = sessionStorage.getItem(STORAGE_KEYS.workTab);
    if (savedWorkTab) {
      setWorkTab(savedWorkTab);
    }

    const savedHowAiTab = sessionStorage.getItem(STORAGE_KEYS.howAiTab);
    if (savedHowAiTab) {
      setHowIAITab(savedHowAiTab);
    }

    const savedPage = sessionStorage.getItem(STORAGE_KEYS.page);
    if (savedPage) {
      openPage(savedPage, { homeMode: sessionStorage.getItem(STORAGE_KEYS.homeMode) || 'finder' });
    }
  });

  window.addEventListener('resize', () => {
    syncDesktopTabFloat();
  }, { passive: true });

  Promise.all([
    afterDomReady(),
    withTimeout(waitForImages(), 1200),
    withTimeout(waitForFinderAssets(), 1200),
    new Promise(resolve => window.setTimeout(resolve, 350))
  ]).then(revealSite).catch(revealSite);

  afterDomReady().then(() => {
    setupImageSkeletons();
    ensureInitialMobileImages();
  });

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
    if (!hasCustomCursorEffect()) return;
    const touch = e.touches[0] || e.changedTouches[0];
    if (!touch) return;

    mouseX = touch.clientX;
    mouseY = touch.clientY;
    dot.style.left = mouseX + 'px';
    dot.style.top = mouseY + 'px';
    setCursorVisibility(true);
    scheduleMobileCursorHide();
  }

  document.addEventListener('touchstart', handleTouchCursor, { passive: true });
  document.addEventListener('touchmove', handleTouchCursor, { passive: true });
  document.addEventListener('touchend', () => {
    if (hasCustomCursorEffect()) scheduleMobileCursorHide();
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
  const magneticEls = document.querySelectorAll('.nav-link');
  const pointerSelector = '.nav-link, .mac-clickable, .mac-welcome';

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

  function initMobileHeroNameEffect() {
    const nameEl = document.querySelector('.mobile-hero-name');
    if (!nameEl || nameEl.dataset.colorReady === 'true') return;

    nameEl.dataset.colorReady = 'true';
    const lines = ['RAJAT', 'GIRHOTRA'];
    nameEl.innerHTML = lines.map(line => (
      `<span class="mobile-hero-line">${[...line].map(char => (
        `<span class="mobile-hero-letter">${char}</span>`
      )).join('')}</span>`
    )).join('');

    const letters = [...nameEl.querySelectorAll('.mobile-hero-letter')];
    const flashLetter = letter => {
      const [c1, c2] = GRADIENTS[Math.floor(Math.random() * GRADIENTS.length)];
      letter.style.backgroundImage = `linear-gradient(135deg, ${c1}, ${c2})`;
      letter.classList.add('is-gradient');
      window.setTimeout(() => {
        letter.classList.remove('is-gradient');
        letter.style.backgroundImage = '';
      }, 420);
    };

    const runWave = () => {
      letters.forEach((letter, index) => {
        window.setTimeout(() => flashLetter(letter), index * 38);
      });
    };

    nameEl.addEventListener('touchstart', runWave, { passive: true });
    nameEl.addEventListener('mouseenter', runWave);
    window.setTimeout(runWave, 450);
  }

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

    fitFooterName();
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
