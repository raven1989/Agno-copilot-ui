import { AgentEvent, EventType } from '../types';

interface ParsedSSELine {
  event?: string;
  data?: string;
}

export function parseSSELine(line: string): ParsedSSELine {
  if (line.startsWith('event:')) {
    return { event: line.slice(6).trim() };
  }
  if (line.startsWith('data:')) {
    return { data: line.slice(5).trim() };
  }
  return {};
}

export function parseSSEStream(
  text: string,
  onEvent: (event: AgentEvent) => void
): void {
  const lines = text.split('\n');
  let currentEvent: string | null = null;
  let currentData: string | null = null;

  for (const line of lines) {
    const parsed = parseSSELine(line);

    if (parsed.event) {
      currentEvent = parsed.event;
    } else if (parsed.data) {
      currentData = parsed.data;
    }

    if (line === '' && currentEvent && currentData) {
      try {
        const parsedData = JSON.parse(currentData);
        onEvent(parsedData as AgentEvent);
      } catch (e) {
        console.error('Failed to parse SSE data:', currentData, e);
      }
      currentEvent = null;
      currentData = null;
    }
  }
}

export class SSEParser {
  private buffer: string = '';
  private currentEvent: string | null = null;
  private currentData: string | null = null;

  parse(chunk: string, onEvent: (event: AgentEvent) => void): void {
    this.buffer += chunk;
    const lines = this.buffer.split('\n');

    let i = 0;
    for (; i < lines.length - 1; i++) {
      const line = lines[i];
      const parsed = parseSSELine(line);

      if (parsed.event) {
        this.currentEvent = parsed.event;
      } else if (parsed.data) {
        this.currentData = parsed.data;
      }

      if (line === '' && this.currentEvent && this.currentData) {
        try {
          const parsedData = JSON.parse(this.currentData);
          onEvent(parsedData as AgentEvent);
        } catch (e) {
          console.error('Failed to parse SSE data:', this.currentData, e);
        }
        this.currentEvent = null;
        this.currentData = null;
      }
    }

    this.buffer = lines[lines.length - 1];
  }

  reset(): void {
    this.buffer = '';
    this.currentEvent = null;
    this.currentData = null;
  }
}

export function isEventType(event: unknown, type: EventType): event is AgentEvent {
  return (
    typeof event === 'object' &&
    event !== null &&
    'event' in event &&
    (event as AgentEvent).event === type
  );
}
