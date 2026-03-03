import { classify, SpecialistTarget } from '../src/router';

describe('Router intent classifier', () => {
  const cases: Array<[string, SpecialistTarget]> = [
    // IT Help Desk cases
    ['reset my password', 'it_help_desk'],
    ['I cannot login to my account', 'it_help_desk'],
    ['my software is not working', 'it_help_desk'],
    ['I need a new laptop', 'it_help_desk'],
    ['raise a support ticket', 'it_help_desk'],
    ['help desk please', 'it_help_desk'],
    ['my computer is broken', 'it_help_desk'],
    ['VPN is not connecting', 'it_help_desk'],

    // Calendar Manager cases
    ['schedule a meeting tomorrow', 'calendar_manager'],
    ['book a call for next Friday', 'calendar_manager'],
    ['what is my calendar today', 'calendar_manager'],
    ['am I free at 3pm', 'calendar_manager'],
    ['cancel my meeting at noon', 'calendar_manager'],
    ['reschedule the appointment', 'calendar_manager'],
    ['check everyone availability', 'calendar_manager'],

    // Knowledge Base cases
    ['how do I configure two-factor auth', 'knowledge_base'],
    ['what is the expense policy', 'knowledge_base'],
    ['where can I find onboarding documentation', 'knowledge_base'],
    ['search for VPN setup guide', 'knowledge_base'],
    ['FAQ about remote work policy', 'knowledge_base'],
    ['guide to using the HR portal', 'knowledge_base'],

    // General / ambiguous
    ['hello there', 'general'],
    ['thanks', 'general'],
  ];

  test.each(cases)('"%s" -> %s', (message, expected) => {
    expect(classify(message)).toBe(expected);
  });
});

describe('Adaptive card builders', () => {
  const { buildTicketCard, buildEventCard, buildKbResultCard } = require('../src/cards/index');

  it('builds a ticket card with the correct structure', () => {
    const card = buildTicketCard({
      ticketId: 'INC-001',
      category: 'Software',
      priority: 'High',
      description: 'Application crashes on startup',
    });
    expect(card).toHaveProperty('type', 'AdaptiveCard');
    expect(card).toHaveProperty('body');
  });

  it('builds an event card with the correct structure', () => {
    const card = buildEventCard({
      subject: 'Team standup',
      start: '2025-01-15T09:00:00Z',
      end: '2025-01-15T09:30:00Z',
      attendees: ['alice@example.com', 'bob@example.com'],
    });
    expect(card).toHaveProperty('type', 'AdaptiveCard');
    expect(card).toHaveProperty('body');
  });

  it('builds a knowledge base result card with an open URL action', () => {
    const card = buildKbResultCard({
      title: 'How to reset your password',
      excerpt: 'Navigate to the account portal and click Forgot Password.',
      url: 'https://intranet.example.com/kb/password-reset',
    });
    expect(card).toHaveProperty('type', 'AdaptiveCard');
    expect((card as any).actions[0].type).toBe('Action.OpenUrl');
  });
});
