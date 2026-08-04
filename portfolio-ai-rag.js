(function initPortfolioAiRag(root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
    return;
  }

  root.PortfolioAiRag = factory();
}(typeof globalThis !== 'undefined' ? globalThis : this, function createPortfolioAiRag() {
  const KNOWLEDGE_BASE_HEADING = '# KNOWLEDGE BASE';

  function splitPortfolioMarkdown(markdown) {
    const source = String(markdown || '');
    const headingIndex = source.indexOf(KNOWLEDGE_BASE_HEADING);

    if (headingIndex === -1) {
      throw new Error('Portfolio AI markdown is missing required "# KNOWLEDGE BASE" heading.');
    }

    return {
      systemInstructions: source.slice(0, headingIndex).trim(),
      knowledgeMarkdown: source.slice(headingIndex + KNOWLEDGE_BASE_HEADING.length).trim()
    };
  }

  function cleanMarkdownText(raw) {
    return raw
      .replace(/^>\s?/gm, '')
      .replace(/^\-\s+/gm, '• ')
      .replace(/^\d+\.\s+/gm, '')
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/\[(.*?)\]\((.*?)\)/g, '$1')
      .replace(/\n{2,}/g, '\n\n')
      .trim();
  }

  function parseKnowledgeBase(knowledgeMarkdown) {
    const lines = String(knowledgeMarkdown || '').split('\n');
    const chunks = [];
    let currentHeading = '';
    let buffer = [];

    function flushBuffer() {
      const raw = buffer.join('\n').trim();
      if (!raw) return;

      const text = cleanMarkdownText(raw);

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

  function parsePortfolioKnowledge(markdown) {
    const split = splitPortfolioMarkdown(markdown);
    return {
      ...split,
      chunks: parseKnowledgeBase(split.knowledgeMarkdown)
    };
  }

  return {
    KNOWLEDGE_BASE_HEADING,
    splitPortfolioMarkdown,
    parseKnowledgeBase,
    parsePortfolioKnowledge
  };
}));
