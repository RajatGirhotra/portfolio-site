const assert = require('node:assert/strict');
const { validatePortfolioInput } = require('../portfolio-ai-validation');

function assertBlocked(input, expectedReply) {
  const result = validatePortfolioInput(input);
  assert.equal(result.allowed, false, `${input} should not trigger retrieval`);
  assert.equal(result.reply, expectedReply);
}

function assertAllowed(input) {
  const result = validatePortfolioInput(input);
  assert.equal(result.allowed, true, `${input} should trigger portfolio retrieval`);
}

assertBlocked(
  'as',
  'Looks like your message may have been cut off. What would you like to know about Rajat?'
);

assertBlocked(
  'a',
  'Looks like your message may have been cut off. What would you like to know about Rajat?'
);

assertBlocked(
  'asdf',
  "I couldn't understand that. You can ask me about Rajat, his work, or any project on this site."
);

assertBlocked(
  'proj',
  'I think your message is incomplete. Feel free to ask me about Rajat, his projects, or his design process.'
);

assertBlocked(
  'hello',
  "Hi! You can ask me about Rajat's projects, experience, design process, or AI workflow."
);

assertBlocked(
  'capital of France',
  "That's outside what I'm here for. You can ask me about Rajat's work, projects, design decisions, or experience."
);

assertAllowed('Health Insurance');
assertAllowed('strongest project');
assertAllowed('Who is Rajat?');
assertAllowed('Tell me about yourself');
assertAllowed('Can you tell me more about yourself?');
assertAllowed('Who are you?');
assertAllowed('Introduce yourself');
assertAllowed('What do you do?');
assertAllowed("What's your background?");
assertAllowed("What's your story?");
assertAllowed('Tell me about your experience');
assertAllowed('What kind of designer are you?');
assertAllowed('Can you introduce yourself?');
assertAllowed('Go Leap');
assertAllowed('Projects');
assertAllowed('Experience');
assertAllowed('Skills');
assertAllowed('Contact');
assertAllowed('AI workflow');
assertAllowed('Design process');
assertAllowed('What is your current role?');
assertAllowed('Tell me about your career');
assertAllowed('What is your education?');
assertAllowed('Where are you based?');
assertAllowed('Bajaj Finserv');

console.log('Portfolio AI validation tests passed.');
