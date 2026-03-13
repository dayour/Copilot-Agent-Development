export interface TicketCard {
  ticketId: string;
  category: string;
  priority: string;
  description: string;
}

export interface EventCard {
  subject: string;
  start: string;
  end: string;
  attendees: string[];
}

export interface KbResultCard {
  title: string;
  excerpt: string;
  url: string;
}

export function buildTicketCard(ticket: TicketCard): object {
  return {
    type: 'AdaptiveCard',
    version: '1.5',
    body: [
      { type: 'TextBlock', text: 'Support Ticket Created', weight: 'Bolder', size: 'Medium' },
      { type: 'FactSet', facts: [
        { title: 'Ticket ID', value: ticket.ticketId },
        { title: 'Category', value: ticket.category },
        { title: 'Priority', value: ticket.priority },
        { title: 'Description', value: ticket.description },
      ]},
    ],
  };
}

export function buildEventCard(event: EventCard): object {
  return {
    type: 'AdaptiveCard',
    version: '1.5',
    body: [
      { type: 'TextBlock', text: 'Meeting Scheduled', weight: 'Bolder', size: 'Medium' },
      { type: 'FactSet', facts: [
        { title: 'Subject', value: event.subject },
        { title: 'Start', value: event.start },
        { title: 'End', value: event.end },
        { title: 'Attendees', value: event.attendees.join(', ') },
      ]},
    ],
  };
}

export function buildKbResultCard(result: KbResultCard): object {
  return {
    type: 'AdaptiveCard',
    version: '1.5',
    body: [
      { type: 'TextBlock', text: result.title, weight: 'Bolder', size: 'Medium' },
      { type: 'TextBlock', text: result.excerpt, wrap: true },
    ],
    actions: [
      { type: 'Action.OpenUrl', title: 'Open Article', url: result.url },
    ],
  };
}
