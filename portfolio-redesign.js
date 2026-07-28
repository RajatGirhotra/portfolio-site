if ('scrollRestoration' in history) {
  history.scrollRestoration = 'manual';
}

window.scrollTo(0, 0);

const resetScrollToTop = () => {
  window.scrollTo(0, 0);
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;
};

window.addEventListener('DOMContentLoaded', resetScrollToTop);
window.addEventListener('load', () => {
  resetScrollToTop();
  requestAnimationFrame(() => {
    resetScrollToTop();
    setTimeout(resetScrollToTop, 60);
  });
});

window.addEventListener('pageshow', resetScrollToTop);
window.addEventListener('beforeunload', resetScrollToTop);

const askAiTriggers = Array.from(document.querySelectorAll('.ask-ai-trigger'));
const askAiTrigger = askAiTriggers[0] || null;
const askAiPanel = document.getElementById('askAiPanel');
const askAiBackdrop = document.getElementById('askAiBackdrop');
const askAiClose = document.getElementById('askAiClose');
const askAiInput = document.getElementById('askAiInput');
const askAiSend = document.getElementById('askAiSend');
const askAiChat = document.getElementById('askAiChat');
const askAiSuggestions = document.querySelector('.ask-ai-suggestions');
const askAiSuggestionButtons = Array.from(document.querySelectorAll('.ask-ai-suggestion'));
const askAiSuggestionsToggle = document.getElementById('askAiSuggestionsToggle');
const askAiSuggestionDrawer = document.getElementById('askAiSuggestionDrawer');
const askAiDrawerSuggestionButtons = Array.from(document.querySelectorAll('.ask-ai-drawer-suggestion'));
const primaryNavigation = document.getElementById('primaryNavigation');
const mobileMenuToggle = document.getElementById('mobileMenuToggle');
const topnavLinks = Array.from(document.querySelectorAll('.topnav a'));
const heroSection = document.querySelector('.hero');
const contactTrigger = document.getElementById('contactTrigger');
const contactIsland = document.getElementById('contactIsland');
const contactClose = document.getElementById('contactClose');
const emailCopyButton = document.getElementById('emailCopyButton');
const phoneCopyButton = document.getElementById('phoneCopyButton');
const contactToast = document.getElementById('contactToast');
const caseStudyOverlays = {
  health: document.getElementById('healthCaseStudy'),
  colrows: document.getElementById('colrowsCaseStudy')
};
const caseStudyOpenTriggers = Array.from(document.querySelectorAll('[data-case-study-open]'));
const caseStudyActionBar = document.getElementById('caseStudyActionBar');
const caseStudyReturn = document.getElementById('caseStudyReturn');
const caseStudyContactTrigger = document.getElementById('caseStudyContactTrigger');
const caseStudyContactIsland = document.getElementById('caseStudyContactIsland');
const caseStudyContactClose = document.getElementById('caseStudyContactClose');
const caseStudyContactCopyButtons = Array.from(
  caseStudyContactIsland?.querySelectorAll('.contact-copy-button') || []
);
let activeCaseStudy = null;
let homeScrollPosition = 0;
let mobileMenuCloseTimer = null;

function setMobileMenuOpen(isOpen) {
  if (!mobileMenuToggle) return;

  if (mobileMenuCloseTimer) {
    window.clearTimeout(mobileMenuCloseTimer);
    mobileMenuCloseTimer = null;
  }

  if (isOpen) {
    document.body.classList.remove('mobile-menu-closing');
    document.body.classList.add('mobile-menu-open');
  } else if (document.body.classList.contains('mobile-menu-open')) {
    document.body.classList.remove('mobile-menu-open');
    document.body.classList.add('mobile-menu-closing');
    mobileMenuCloseTimer = window.setTimeout(() => {
      document.body.classList.remove('mobile-menu-closing');
      mobileMenuCloseTimer = null;
    }, 260);
  }

  mobileMenuToggle.setAttribute('aria-expanded', String(isOpen));
  mobileMenuToggle.setAttribute('aria-label', isOpen ? 'Close menu' : 'Open menu');
}

function updateMobileAskAiVisibility() {
  if (!heroSection) return;
  const isMobile = window.matchMedia('(max-width: 900px)').matches;
  const heroRect = heroSection.getBoundingClientRect();
  document.body.classList.toggle('mobile-ask-ai-visible', isMobile && heroRect.bottom <= 0);
}

const ASK_AI_FALLBACK_KB = `
Rajat Girhotra is a product designer based in Pune, India, currently working at Bajaj Finserv.
He specialises in simplifying complex insurance journeys across discovery, comparison, forms, checkout, payment, and servicing.
He previously worked as a coder and switched into design in 2020.
His coding background gives him technical understanding, while his design practice focuses on user clarity, business outcomes, systems thinking, and product quality.
Rajat is strongest in end-to-end product design, UX strategy, user-flow architecture, funnel design, form design, edge cases, design systems, and trust-heavy experiences.
At Bajaj Finserv he has worked across health insurance, life insurance, car and motor insurance, listing pages, detail pages, cart, checkout, payment, transaction history, membership, and point-of-sale products.
In health insurance, he redesigned the purchase journey to reduce drop-offs, simplify family-member selection, improve plan discovery, and reduce form friction.
According to the portfolio, the health insurance redesign improved conversion from 18.6 percent to 26.9 percent and reduced several key drop-offs.
In life insurance, he redesigned the end-to-end purchase experience with emphasis on trust, continuity, transparency, and conversion.
In car insurance, he worked on scalable flow architecture, decision trees, validation, plan selection, add-ons, and edge-case recovery across purchase and renewal journeys.
Go Leap was a freelance project focused on turning static catalogue browsing into a more immersive discovery experience.
ReFi Protocol was a freelance Web3 dashboard project designed to make staking, NFTs, wallets, and sustainability flows easier to understand.
Colrows involved working closely with the founder, product, and engineering teams on a bright product and brand direction.
Rajat uses AI as a creative and productivity partner to expand exploration while keeping product judgment, editing, and systems thinking human-led.
He is open to product design roles, collaborations, freelance projects, and conversations around design, systems, AI, and creative technology.
His email is rajatgirhotra13@gmail.com and his phone number is +91 9354423022.
`;

let askAiKnowledgeText = ASK_AI_FALLBACK_KB;
let askAiKnowledgeChunks = [];
const validatePortfolioInput = globalThis.PortfolioAiValidation?.validatePortfolioInput;

const ASK_AI_STOPWORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'but', 'if', 'then', 'than', 'to', 'of', 'for', 'in', 'on',
  'at', 'by', 'with', 'from', 'into', 'about', 'me', 'my', 'your', 'you', 'his', 'her', 'their',
  'is', 'are', 'was', 'were', 'be', 'been', 'being', 'do', 'does', 'did', 'can', 'could', 'would',
  'should', 'what', 'which', 'who', 'how', 'tell', 'more', 'please', 'i', 'we', 'it', 'this', 'that'
]);

function normaliseText(value) {
  return (value || '')
    .toLowerCase()
    .replace(/[^\w\s+]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokenise(value) {
  return normaliseText(value)
    .split(' ')
    .filter(token => token && !ASK_AI_STOPWORDS.has(token) && token.length > 1);
}

function parseKnowledgeBase(markdown) {
  const lines = markdown.split('\n');
  const chunks = [];
  let currentHeading = '';
  let buffer = [];

  function isSearchableHeading(heading) {
    return !/mandatory input gate|critical architecture rule|retrieval permission|deterministic input rules|^rule \d|approved portfolio intent terms|exact test cases|required application-layer guard/i.test(heading);
  }

  function flushBuffer() {
    const raw = buffer.join('\n').trim();
    if (!raw) return;
    if (!isSearchableHeading(currentHeading)) {
      buffer = [];
      return;
    }
    const text = raw
      .replace(/^>\s?/gm, '')
      .replace(/^\-\s+/gm, '• ')
      .replace(/^\d+\.\s+/gm, '')
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/\[(.*?)\]\((.*?)\)/g, '$1')
      .replace(/\n{2,}/g, '\n\n')
      .trim();

    if (text) {
      chunks.push({
        heading: currentHeading || 'General',
        text,
        corpus: `${currentHeading} ${text}`.trim()
      });
    }
    buffer = [];
  }

  lines.forEach((line) => {
    if (/^#{1,6}\s/.test(line)) {
      flushBuffer();
      currentHeading = line.replace(/^#{1,6}\s*/, '').trim();
      return;
    }
    if (line.trim() === '---') {
      flushBuffer();
      return;
    }
    buffer.push(line);
  });

  flushBuffer();
  return chunks;
}

function formatAnswerText(text) {
  return text
    .replace(/\s+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function getTopKnowledgeChunks(question, limit = 3) {
  const query = normaliseText(question);
  const tokens = tokenise(question);

  const scored = askAiKnowledgeChunks.map((chunk) => {
    const headingNorm = normaliseText(chunk.heading);
    const corpusNorm = normaliseText(chunk.corpus);
    let score = 0;

    tokens.forEach((token) => {
      if (headingNorm.includes(token)) score += 7;
      if (corpusNorm.includes(token)) score += 3;
    });

    if (query && corpusNorm.includes(query)) score += 12;
    if (query && headingNorm.includes(query)) score += 16;

    return { chunk, score };
  });

  return scored
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(item => item.chunk);
}

function getIntroResponse() {
  return "Hi! I’m the AI guide for Rajat’s portfolio. You can ask me about his product design experience, Bajaj Finserv work, insurance projects, AI workflow, strengths, or how to contact him.";
}

function answerFromKnowledgeBase(question) {
  const query = normaliseText(question);

  if (!query) {
    return "Ask me about Rajat’s experience, projects, design approach, AI workflow, or how to contact him.";
  }

  if (/^(hi|hello|hey|yo|hola)$/.test(query)) {
    return getIntroResponse();
  }

  if (/\b(thanks|thank you)\b/.test(query)) {
    return "You’re welcome. You can also ask about Rajat’s insurance work, his strongest skills, AI workflow, or the projects in this portfolio.";
  }

  if (/\b(are you rajat|who are you)\b/.test(query)) {
    return "I’m the AI guide for Rajat Girhotra’s portfolio. I’m not Rajat himself, but I can help you understand his work, experience, projects, and design approach.";
  }

  if (/\b(contact|email|phone|reach|hire|collaborat|availability)\b/.test(query)) {
    return "You can reach Rajat at rajatgirhotra13@gmail.com or +91 9354423022.\n\nBased on his portfolio, he is open to product design roles, collaborations, freelance projects, and conversations around design, systems, AI, and creative technology.";
  }

  const topChunks = getTopKnowledgeChunks(question, 3);
  if (!topChunks.length) {
    return "I don’t have that exact detail in Rajat’s portfolio knowledge base. You can ask about his Bajaj Finserv work, insurance projects, AI workflow, design strengths, or how to contact him.";
  }

  const used = new Set();
  const selected = [];

  topChunks.forEach((chunk) => {
    const paragraphs = chunk.text
      .split(/\n\s*\n/)
      .map(part => formatAnswerText(part))
      .filter(Boolean);

    for (const paragraph of paragraphs) {
      const key = paragraph.toLowerCase();
      if (!used.has(key)) {
        used.add(key);
        selected.push(paragraph);
      }
      if (selected.length >= 2) break;
    }
  });

  const answer = selected.slice(0, 2).join('\n\n');
  return answer || "I found relevant information in Rajat’s portfolio, but I couldn’t form a good short answer yet. Try asking in a more specific way, for example about health insurance, life insurance, car insurance, AI workflow, or contact details.";
}

function appendAskAiMessage(role, text) {
  if (!askAiChat) return;
  askAiChat.hidden = false;

  const wrapper = document.createElement('div');
  wrapper.className = `ask-ai-message ask-ai-message-${role}`;

  const bubble = document.createElement('div');
  bubble.className = 'ask-ai-message-bubble';
  bubble.textContent = text;

  wrapper.appendChild(bubble);
  askAiChat.appendChild(wrapper);
  askAiChat.scrollIntoView({ block: 'end', behavior: 'smooth' });
}

function appendAskAiLoaderMessage(initialText) {
  if (!askAiChat) return null;
  askAiChat.hidden = false;

  const wrapper = document.createElement('div');
  wrapper.className = 'ask-ai-message ask-ai-message-assistant ask-ai-message-loading';

  const bubble = document.createElement('div');
  bubble.className = 'ask-ai-message-bubble';

  const loader = document.createElement('div');
  loader.className = 'ask-ai-loader';

  const loaderMark = document.createElement('span');
  loaderMark.className = 'ask-ai-loader-mark';
  loaderMark.setAttribute('aria-hidden', 'true');

  const loaderText = document.createElement('span');
  loaderText.className = 'ask-ai-loader-text';
  loaderText.textContent = initialText;

  loader.append(loaderMark, loaderText);
  bubble.appendChild(loader);
  wrapper.appendChild(bubble);
  askAiChat.appendChild(wrapper);
  askAiChat.scrollIntoView({ block: 'end', behavior: 'smooth' });

  return { wrapper, bubble, loaderText };
}

function wait(ms) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

let askAiReplyInFlight = false;
let askAiAbortController = null;

function randomFallbackDelay() {
  return Math.floor(1800 + Math.random() * 501);
}

function waitWithAbort(ms, signal) {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException('Aborted', 'AbortError'));
      return;
    }

    const timeoutId = window.setTimeout(resolve, ms);

    signal?.addEventListener('abort', () => {
      window.clearTimeout(timeoutId);
      reject(new DOMException('Aborted', 'AbortError'));
    }, { once: true });
  });
}

function finishAskAiReply() {
  askAiReplyInFlight = false;
  askAiAbortController = null;
}

function updateAskAiSendState() {
  if (!askAiInput || !askAiSend) return;
  askAiSend.classList.toggle('is-active', askAiInput.value.trim().length > 0);
}

function setAskAiSuggestionDrawerOpen(isOpen) {
  if (!askAiSuggestionsToggle || !askAiSuggestionDrawer) return;

  askAiSuggestionDrawer.hidden = !isOpen;
  askAiSuggestionsToggle.classList.toggle('is-active', isOpen);
  askAiSuggestionsToggle.setAttribute('aria-expanded', String(isOpen));

  const icon = askAiSuggestionsToggle.querySelector('img');
  if (!icon) return;
  icon.src = isOpen ? icon.dataset.activeSrc : icon.dataset.inactiveSrc;
}

async function submitAskAiQuestion(rawQuestion) {
  const question = (rawQuestion || '').trim();
  if (askAiReplyInFlight) return;

  askAiAbortController = new AbortController();

  const validation = validatePortfolioInput
    ? validatePortfolioInput(rawQuestion)
    : { allowed: true };

  if (!validation.allowed) {
    askAiReplyInFlight = true;
    if (askAiSuggestions) askAiSuggestions.hidden = true;
    setAskAiSuggestionDrawerOpen(false);
    if (question) appendAskAiMessage('user', question);
    if (askAiInput) askAiInput.value = '';
    updateAskAiSendState();

    const loadingState = appendAskAiLoaderMessage('Thinking...');

    try {
      await waitWithAbort(randomFallbackDelay(), askAiAbortController.signal);
    } catch (error) {
      loadingState?.wrapper?.remove();
      if (askAiSuggestions) askAiSuggestions.hidden = false;
      finishAskAiReply();
      return;
    }

    if (loadingState?.wrapper && loadingState?.bubble) {
      loadingState.wrapper.classList.remove('ask-ai-message-loading');
      loadingState.bubble.textContent = validation.reply;
    } else {
      appendAskAiMessage('assistant', validation.reply);
    }

    if (askAiSuggestions) askAiSuggestions.hidden = false;
    finishAskAiReply();
    return;
  }

  askAiReplyInFlight = true;
  if (askAiSuggestions) askAiSuggestions.hidden = true;
  setAskAiSuggestionDrawerOpen(false);

  await loadAskAiKnowledge();

  appendAskAiMessage('user', question);
  if (askAiInput) askAiInput.value = '';
  updateAskAiSendState();

  const loadingState = appendAskAiLoaderMessage('Thinking...');
  const statusSteps = ['Thinking...', 'Working on it...', 'Presenting the answer...'];
  let statusIndex = 0;

  const statusTimer = window.setInterval(() => {
    if (!loadingState?.loaderText) return;
    statusIndex = (statusIndex + 1) % statusSteps.length;
    loadingState.loaderText.textContent = statusSteps[statusIndex];
  }, 1100);

  await wait(3400);

  window.clearInterval(statusTimer);

  const answer = answerFromKnowledgeBase(question);
  if (loadingState?.wrapper && loadingState?.bubble) {
    loadingState.wrapper.classList.remove('ask-ai-message-loading');
    loadingState.bubble.textContent = answer;
  } else {
    appendAskAiMessage('assistant', answer);
  }

  if (askAiSuggestions) askAiSuggestions.hidden = false;
  finishAskAiReply();
}

async function loadAskAiKnowledge() {
  try {
    const response = await fetch(`./kb.md?v=${Date.now()}`, { cache: 'no-store' });
    if (response.ok) {
      askAiKnowledgeText = await response.text();
    }
  } catch (error) {
    // Local file access can block fetch; fallback text keeps the panel usable.
  }

  askAiKnowledgeChunks = parseKnowledgeBase(askAiKnowledgeText);
}

async function openAskAiPanel() {
  if (!askAiPanel || !askAiTrigger || !askAiBackdrop) return;
  document.body.classList.add('ask-ai-open');
  askAiPanel.setAttribute('aria-hidden', 'false');
  askAiTriggers.forEach((trigger) => trigger.setAttribute('aria-expanded', 'true'));
  askAiBackdrop.hidden = false;
  setTimeout(() => {
    askAiInput?.focus();
  }, 180);
}

function closeAskAiPanel() {
  if (!askAiPanel || !askAiTrigger || !askAiBackdrop) return;
  askAiAbortController?.abort();
  document.body.classList.remove('ask-ai-open');
  askAiPanel.setAttribute('aria-hidden', 'true');
  askAiTriggers.forEach((trigger) => trigger.setAttribute('aria-expanded', 'false'));
  askAiBackdrop.hidden = true;
}

function getCaseStudyFromUrl() {
  const caseStudyId = new URL(window.location.href).searchParams.get('case-study');
  return Object.hasOwn(caseStudyOverlays, caseStudyId) ? caseStudyId : null;
}

function setCaseStudyUrl(caseStudyId) {
  const url = new URL(window.location.href);
  url.searchParams.set('case-study', caseStudyId);
  url.hash = '';
  history.pushState({ portfolioCaseStudyEntry: true, caseStudyId }, '', url);
}

function clearCaseStudyUrl() {
  const url = new URL(window.location.href);
  url.searchParams.delete('case-study');
  url.hash = '';
  history.replaceState(null, '', url);
}

function openCaseStudy(caseStudyId, { updateHistory = true } = {}) {
  const overlay = caseStudyOverlays[caseStudyId];
  if (!overlay) return;
  if (!activeCaseStudy) homeScrollPosition = window.scrollY;
  closeAskAiPanel();
  setContactIslandOpen(false);
  setCaseStudyContactOpen(false);
  Object.entries(caseStudyOverlays).forEach(([id, caseStudy]) => {
    if (id === caseStudyId) return;
    caseStudy.classList.remove('is-open');
    caseStudy.setAttribute('aria-hidden', 'true');
    caseStudy.hidden = true;
  });
  activeCaseStudy = caseStudyId;
  overlay.hidden = false;
  caseStudyActionBar.hidden = false;
  document.body.classList.add('case-study-open');
  if (updateHistory && getCaseStudyFromUrl() !== caseStudyId) {
    setCaseStudyUrl(caseStudyId);
  }
  requestAnimationFrame(() => {
    overlay.classList.add('is-open');
    overlay.setAttribute('aria-hidden', 'false');
    window.scrollTo(0, 0);
    caseStudyReturn?.focus();
  });
}

function closeCaseStudy(caseStudyId = activeCaseStudy, { restoreScroll = true } = {}) {
  const overlay = caseStudyOverlays[caseStudyId];
  if (!overlay) return;
  overlay.classList.remove('is-open');
  overlay.setAttribute('aria-hidden', 'true');
  overlay.hidden = true;
  if (activeCaseStudy === caseStudyId) activeCaseStudy = null;
  if (activeCaseStudy) return;
  caseStudyActionBar.hidden = true;
  document.body.classList.remove('case-study-open');
  setCaseStudyContactOpen(false);
  if (restoreScroll) window.scrollTo(0, homeScrollPosition);
}

function closeAllCaseStudies(options = {}) {
  Object.keys(caseStudyOverlays).forEach((caseStudyId) => {
    if (caseStudyOverlays[caseStudyId].hidden) return;
    closeCaseStudy(caseStudyId, options);
  });
}

function returnFromCaseStudy() {
  if (!activeCaseStudy) return;
  if (history.state?.portfolioCaseStudyEntry) {
    history.back();
    return;
  }
  clearCaseStudyUrl();
  closeAllCaseStudies();
}

function setCaseStudyContactOpen(isOpen) {
  if (!caseStudyContactTrigger || !caseStudyContactIsland) return;
  if (isOpen) {
    caseStudyContactTrigger.style.setProperty(
      '--contact-expanded-height',
      `${caseStudyContactIsland.scrollHeight}px`
    );
  }
  caseStudyContactTrigger.classList.toggle('is-open', isOpen);
  caseStudyContactTrigger.setAttribute('aria-expanded', String(isOpen));
  caseStudyContactIsland.classList.toggle('is-open', isOpen);
  caseStudyContactIsland.setAttribute('aria-hidden', String(!isOpen));
  if (!isOpen) {
    caseStudyContactCopyButtons.forEach(resetCopyIcon);
  }
}

function setContactIslandOpen(isOpen) {
  if (!contactTrigger || !contactIsland) return;
  if (isOpen) {
    contactTrigger.style.setProperty('--contact-expanded-height', `${contactIsland.scrollHeight}px`);
  }
  contactTrigger.classList.toggle('is-open', isOpen);
  contactTrigger.setAttribute('aria-expanded', String(isOpen));
  contactIsland.classList.toggle('is-open', isOpen);
  contactIsland.setAttribute('aria-hidden', String(!isOpen));

  if (!isOpen) {
    resetCopyIcon(emailCopyButton);
    resetCopyIcon(phoneCopyButton);
  }
}

function resetCopyIcon(button) {
  const icon = button?.querySelector('.contact-item-icon');
  if (!icon) return;
  icon.innerHTML = '<img src="copy.svg" alt="">';
}

function setDoneIcon(button) {
  const icon = button?.querySelector('.contact-item-icon');
  if (!icon) return;
  icon.innerHTML = '<img src="done.svg" alt="">';
}

function showContactToast(message = 'Copied to clipboard') {
  if (!contactToast) return;
  contactToast.textContent = message;
  contactToast.hidden = false;
  requestAnimationFrame(() => {
    contactToast.classList.add('is-visible');
  });

  window.clearTimeout(showContactToast.timeoutId);
  showContactToast.timeoutId = window.setTimeout(() => {
    contactToast.classList.remove('is-visible');
    window.setTimeout(() => {
      contactToast.hidden = true;
    }, 240);
  }, 2200);
}

async function copyToClipboard(value) {
  try {
    await navigator.clipboard.writeText(value);
    return;
  } catch (error) {
    // Fallback for file:// previews and older browsers.
  }

  const tempInput = document.createElement('input');
  tempInput.value = value;
  tempInput.setAttribute('readonly', '');
  tempInput.style.position = 'fixed';
  tempInput.style.opacity = '0';
  document.body.appendChild(tempInput);
  tempInput.select();
  document.execCommand('copy');
  tempInput.remove();
}

async function copyContactValue(button, toastMessage) {
  if (!button) return;
  const value = button.dataset.copyValue || '';
  await copyToClipboard(value);
  setDoneIcon(button);
  showContactToast(toastMessage);
}

askAiTriggers.forEach((trigger) => {
  trigger.addEventListener('click', () => {
    const isOpen = document.body.classList.contains('ask-ai-open');
    if (isOpen) {
      closeAskAiPanel();
      return;
    }
    openAskAiPanel();
  });
});

askAiClose?.addEventListener('click', closeAskAiPanel);
askAiBackdrop?.addEventListener('click', closeAskAiPanel);
mobileMenuToggle?.addEventListener('click', () => {
  setMobileMenuOpen(!document.body.classList.contains('mobile-menu-open'));
});
topnavLinks.forEach((link) => {
  link.addEventListener('click', () => setMobileMenuOpen(false));
});
caseStudyOpenTriggers.forEach((trigger) => {
  const caseStudyId = trigger.dataset.caseStudyOpen;
  trigger.addEventListener('click', () => openCaseStudy(caseStudyId));
  trigger.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    openCaseStudy(caseStudyId);
  });
});
caseStudyReturn?.addEventListener('click', returnFromCaseStudy);
caseStudyContactTrigger?.addEventListener('click', (event) => {
  const isOpen = caseStudyContactIsland?.classList.contains('is-open');
  const target = event.target;
  const clickedCollapsedLabel =
    target === caseStudyContactTrigger || target?.classList?.contains('contact-label');
  if (isOpen && !clickedCollapsedLabel) return;
  setCaseStudyContactOpen(!isOpen);
});
caseStudyContactTrigger?.addEventListener('keydown', (event) => {
  if (event.key !== 'Enter' && event.key !== ' ') return;
  event.preventDefault();
  setCaseStudyContactOpen(!caseStudyContactIsland?.classList.contains('is-open'));
});
caseStudyContactClose?.addEventListener('click', (event) => {
  event.stopPropagation();
  setCaseStudyContactOpen(false);
});
caseStudyContactCopyButtons.forEach((button) => {
  button.addEventListener('click', (event) => {
    event.stopPropagation();
    copyContactValue(button, button.dataset.copyToast || 'Copied to clipboard');
  });
});
contactTrigger?.addEventListener('click', (event) => {
  const isOpen = contactIsland?.classList.contains('is-open');
  const target = event.target;
  const clickedCollapsedLabel = target === contactTrigger || target?.classList?.contains('contact-label');

  if (isOpen && !clickedCollapsedLabel) return;
  setContactIslandOpen(!isOpen);
});

contactTrigger?.addEventListener('keydown', (event) => {
  if (event.key !== 'Enter' && event.key !== ' ') return;
  event.preventDefault();
  setContactIslandOpen(!contactIsland?.classList.contains('is-open'));
});
contactClose?.addEventListener('click', (event) => {
  event.stopPropagation();
  setContactIslandOpen(false);
});
emailCopyButton?.addEventListener('click', (event) => {
  event.stopPropagation();
  copyContactValue(emailCopyButton, 'Email copied to clipboard');
});
phoneCopyButton?.addEventListener('click', (event) => {
  event.stopPropagation();
  copyContactValue(phoneCopyButton, 'Phone number copied to clipboard');
});

askAiSend?.addEventListener('click', () => {
  submitAskAiQuestion(askAiInput?.value || '');
});

askAiInput?.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') {
    event.preventDefault();
    submitAskAiQuestion(askAiInput.value);
  }
});

askAiInput?.addEventListener('input', updateAskAiSendState);

askAiSuggestionButtons.forEach((button) => {
  button.addEventListener('click', () => {
    submitAskAiQuestion(button.textContent || '');
  });
});

askAiSuggestionsToggle?.addEventListener('click', () => {
  setAskAiSuggestionDrawerOpen(askAiSuggestionDrawer?.hidden ?? true);
});

askAiDrawerSuggestionButtons.forEach((button) => {
  button.addEventListener('click', () => {
    submitAskAiQuestion(button.textContent || '');
  });
});

window.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    returnFromCaseStudy();
    closeAskAiPanel();
    setMobileMenuOpen(false);
    setContactIslandOpen(false);
    setCaseStudyContactOpen(false);
  }
});

window.addEventListener('popstate', () => {
  const caseStudyId = getCaseStudyFromUrl();
  if (caseStudyId) {
    openCaseStudy(caseStudyId, { updateHistory: false });
    return;
  }
  closeAllCaseStudies();
});

window.addEventListener('scroll', updateMobileAskAiVisibility, { passive: true });
window.addEventListener('resize', () => {
  updateMobileAskAiVisibility();
  if (!window.matchMedia('(max-width: 900px)').matches) {
    setMobileMenuOpen(false);
  }
});
updateMobileAskAiVisibility();

document.addEventListener('click', (event) => {
  if (document.body.classList.contains('mobile-menu-open')) {
    const target = event.target;
    if (!primaryNavigation?.contains(target) && !mobileMenuToggle?.contains(target)) {
      setMobileMenuOpen(false);
    }
  }

  if (!contactIsland?.classList.contains('is-open')) return;
  const target = event.target;
  if (contactIsland.contains(target) || contactTrigger?.contains(target)) return;
  setContactIslandOpen(false);
});

document.addEventListener('click', (event) => {
  if (!caseStudyContactIsland?.classList.contains('is-open')) return;
  const target = event.target;
  if (
    caseStudyContactIsland.contains(target) ||
    caseStudyContactTrigger?.contains(target)
  ) return;
  setCaseStudyContactOpen(false);
});

document.querySelectorAll('[data-scroll-target]').forEach((button) => {
  button.addEventListener('click', () => {
    const target = document.querySelector(button.getAttribute('data-scroll-target'));
    if (!target) return;
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
});

document.querySelectorAll('a[href^="#"]').forEach((link) => {
  link.addEventListener('click', (event) => {
    const href = link.getAttribute('href');
    const target = href ? document.querySelector(href) : null;
    if (!target) return;
    event.preventDefault();
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
});

const initialCaseStudy = getCaseStudyFromUrl();
if (initialCaseStudy) {
  openCaseStudy(initialCaseStudy, { updateHistory: false });
}
