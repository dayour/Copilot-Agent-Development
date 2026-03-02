import { ItHelpDeskAdapter } from './adapters/it-help-desk';
import { CalendarManagerAdapter } from './adapters/calendar-manager';
import { KnowledgeBaseAdapter } from './adapters/knowledge-base';

export type SpecialistTarget = 'it_help_desk' | 'calendar_manager' | 'knowledge_base' | 'general';

const IT_KEYWORDS = [
  'password', 'reset', 'locked', 'login', 'account', 'software', 'install',
  'laptop', 'hardware', 'ticket', 'incident', 'help desk', 'helpdesk',
  'vpn', 'mfa', 'error', 'broken', 'not working', 'support',
];

const CALENDAR_KEYWORDS = [
  'schedule', 'meeting', 'calendar', 'appointment', 'book', 'free', 'busy',
  'available', 'reschedule', 'cancel meeting', 'time slot', 'availability',
  'invite', 'event',
];

const KNOWLEDGE_KEYWORDS = [
  'how do i', 'how to', 'what is', 'where can i find', 'policy', 'procedure',
  'documentation', 'guide', 'faq', 'search', 'find information', 'article',
  'knowledge', 'process for',
];

function classify(text: string): SpecialistTarget {
  const lower = text.toLowerCase();

  const itScore = IT_KEYWORDS.filter((k) => lower.includes(k)).length;
  const calScore = CALENDAR_KEYWORDS.filter((k) => lower.includes(k)).length;
  const kbScore = KNOWLEDGE_KEYWORDS.filter((k) => lower.includes(k)).length;

  const max = Math.max(itScore, calScore, kbScore);
  if (max === 0) return 'general';
  if (itScore === max) return 'it_help_desk';
  if (calScore === max) return 'calendar_manager';
  return 'knowledge_base';
}

class Router {
  private itAdapter = new ItHelpDeskAdapter();
  private calAdapter = new CalendarManagerAdapter();
  private kbAdapter = new KnowledgeBaseAdapter();

  async initialize(): Promise<void> {
    await Promise.all([
      this.itAdapter.initialize(),
      this.calAdapter.initialize(),
      this.kbAdapter.initialize(),
    ]);
    console.log('All specialist adapters initialized.');
  }

  async dispatch(message: string, activity: unknown): Promise<string> {
    const target = classify(message);
    const start = Date.now();

    let response: string;
    switch (target) {
      case 'it_help_desk':
        response = await this.itAdapter.send(message);
        break;
      case 'calendar_manager':
        response = await this.calAdapter.send(message);
        break;
      case 'knowledge_base':
        response = await this.kbAdapter.send(message);
        break;
      default:
        response = this.generalHelp();
    }

    console.log(`Routed to ${target} in ${Date.now() - start}ms`);
    return response;
  }

  private generalHelp(): string {
    return (
      'Hello! I am your A365 assistant. I can help you with:\n\n' +
      '- **IT Support** — password resets, software issues, hardware requests, support tickets\n' +
      '- **Calendar** — scheduling meetings, checking availability, managing events\n' +
      '- **Knowledge Base** — searching internal guides, policies, and FAQs\n\n' +
      'What would you like help with today?'
    );
  }
}

export const router = new Router();
export { classify };
