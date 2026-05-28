export interface DemoEventInput {
  title: string;
  source: string;
  category: string;
  severity?: string;
  numericValue?: number;
  occurredAt: string;
  url?: string;
}

export const DEMO_EVENTS: DemoEventInput[] = [
  {
    title: "Major earthquake near demo city",
    source: "demo",
    category: "disaster",
    severity: "high",
    occurredAt: "2026-05-28T12:15:00.000Z",
    url: "https://example.test/demo-earthquake"
  },
  {
    title: "Major breaking news event",
    source: "demo",
    category: "breaking-news",
    severity: "critical",
    occurredAt: "2026-05-28T12:20:00.000Z",
    url: "https://example.test/demo-breaking-news"
  },
  {
    title: "Index moves sharply",
    source: "demo",
    category: "market",
    numericValue: 6.2,
    occurredAt: "2026-05-28T12:25:00.000Z",
    url: "https://example.test/demo-market"
  }
];
