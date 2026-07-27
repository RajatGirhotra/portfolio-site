(function initPortfolioAiValidation(root) {
  const REPLIES = {
    empty: 'What would you like to know about Rajat or one of his projects?',
    greeting: "Hi! You can ask me about Rajat's projects, experience, design process, or AI workflow.",
    short: 'Looks like your message may have been cut off. What would you like to know about Rajat?',
    incomplete: 'I think your message is incomplete. Feel free to ask me about Rajat, his projects, or his design process.',
    gibberish: "I couldn't understand that. You can ask me about Rajat, his work, or any project on this site.",
    unrelated: "That's outside what I'm here for. You can ask me about Rajat's work, projects, design decisions, or experience."
  };

  const GREETINGS = new Set(['hi', 'hello', 'hey', 'good morning', 'good afternoon', 'good evening']);
  const INCOMPLETE_FRAGMENTS = new Set([
    'tell', 'tell me', 'what about', 'can you', 'proj', 'raj', 'hea', 'strong'
  ]);
  const GIBBERISH_TERMS = new Set(['asdf', 'qwerty', 'ajskd', 'hjjk']);
  const UNRELATED_PATTERNS = [
    /\bcapital of france\b/,
    /\bweather\b/,
    /\bmovie recommendation\b/,
    /\bpython\b/,
    /\bsorting\b/,
    /\bwrite code\b/,
    /\bwrite .* code\b/
  ];
  const PORTFOLIO_PATTERNS = [
    /\brajat\b/,
    /\bproject\b|\bprojects\b|\bportfolio\b|\bcase stud(?:y|ies)\b/,
    /\bexperience\b|\bwork\b|\brole\b|\bdesigner\b|\bdesign\b|\bskills?\b|\bprocess\b/,
    /\bai\b|\bworkflow\b/,
    /\bbajaj\b|\bbajaj finserv\b/,
    /\binsurance\b|\bhealth insurance\b|\blife insurance\b|\bcar insurance\b|\bmotor insurance\b/,
    /\bgo leap\b|\bgoleap\b|\brefi\b|\bcolrows\b/,
    /\bcontact\b|\bemail\b|\bhire\b|\bhiring\b|\brecruiter\b|\bcollaboration\b|\bfreelance\b/,
    /\bstrongest project\b/
  ];

  function normaliseInput(value) {
    return (value || '')
      .toLowerCase()
      .replace(/[’‘]/g, "'")
      .replace(/[“”]/g, '"')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function countAlphabeticCharacters(value) {
    const matches = value.match(/[a-z]/gi);
    return matches ? matches.length : 0;
  }

  function isGibberish(input) {
    const compact = input.replace(/\s+/g, '');
    const alphaCount = countAlphabeticCharacters(input);

    if (GIBBERISH_TERMS.has(input)) return true;
    if (/^[\d\W_]+$/.test(compact) && compact.length >= 4) return true;
    if (/^[a-z]{4,}$/.test(compact) && !/[aeiou]/.test(compact)) return true;
    if (/^[a-z]{5,}$/.test(compact) && !PORTFOLIO_PATTERNS.some(pattern => pattern.test(input))) {
      const vowelRatio = (compact.match(/[aeiou]/g) || []).length / alphaCount;
      return vowelRatio < 0.25;
    }

    return false;
  }

  function hasPortfolioIntent(input) {
    return PORTFOLIO_PATTERNS.some(pattern => pattern.test(input));
  }

  function isUnrelated(input) {
    return UNRELATED_PATTERNS.some(pattern => pattern.test(input));
  }

  function validatePortfolioInput(rawInput) {
    const input = normaliseInput(rawInput);
    const alphaCount = countAlphabeticCharacters(input);

    if (!input) {
      return { allowed: false, reason: 'empty', reply: REPLIES.empty };
    }

    if (GREETINGS.has(input)) {
      return { allowed: false, reason: 'greeting', reply: REPLIES.greeting };
    }

    if (alphaCount < 3) {
      return { allowed: false, reason: 'short', reply: REPLIES.short };
    }

    if (INCOMPLETE_FRAGMENTS.has(input)) {
      return { allowed: false, reason: 'incomplete', reply: REPLIES.incomplete };
    }

    if (isGibberish(input)) {
      return { allowed: false, reason: 'gibberish', reply: REPLIES.gibberish };
    }

    if (isUnrelated(input)) {
      return { allowed: false, reason: 'unrelated', reply: REPLIES.unrelated };
    }

    if (hasPortfolioIntent(input)) {
      return { allowed: true, reason: 'portfolio' };
    }

    return { allowed: false, reason: 'unrelated', reply: REPLIES.unrelated };
  }

  const api = { validatePortfolioInput };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }

  root.PortfolioAiValidation = api;
})(typeof globalThis !== 'undefined' ? globalThis : window);
