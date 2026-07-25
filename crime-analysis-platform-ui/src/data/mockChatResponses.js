/**
 * data/mockChatResponses.js
 * Fallback simulated answers for ChatPanel.jsx, used only when the real
 * /chat endpoint is unreachable (network-level failure, e.g. not
 * deployed yet or a bad URL) — NOT used when the service responds with
 * a real error (like the known token-expiry 502), since that should
 * surface honestly rather than be masked.
 *
 * Clearly labeled "simulated" in the UI (see MessageBubble.jsx) so it's
 * never mistaken for a real QuickML answer during a demo.
 */

const MOCK_RESPONSES = [
  {
    keywords: ['chain snatching', 'bengaluru'],
    answer:
      'Simulated response: Bengaluru Urban shows a cluster of chain-snatching incidents concentrated in the Majestic area during evening hours (roughly 6–11 PM), consistent with the hotspot flagged on the dashboard map.',
    sources: [
      { document_title: 'FIR-2026-04821', content_preview: 'Chain snatching reported near Majestic bus stand, victim reported loss of gold chain around 8:30 PM...' },
      { document_title: 'FIR-2026-05103', content_preview: 'Similar MO reported in adjacent police station jurisdiction, same time window...' },
    ],
  },
  {
    keywords: ['repeat offender', 'mysuru'],
    answer:
      'Simulated response: Mysuru has a small number of individuals appearing across 3 or more incidents, primarily linked to burglary cases in the city center area — consistent with the repeat-offender tracking described in the network graph.',
    sources: [
      { document_title: 'FIR-2026-03312', content_preview: 'Accused previously linked to two prior burglary cases in same jurisdiction...' },
    ],
  },
  {
    keywords: ['burglary', 'kalaburagi'],
    answer:
      'Simulated response: Kalaburagi shows an above-average share of burglary and assault cases relative to its population density, which lines up with the anomaly flagged on the dashboard for that district.',
    sources: [
      { document_title: 'FIR-2026-02290', content_preview: 'House burglary reported in Kalaburagi Old Town, entry via rear window...' },
    ],
  },
];

const DEFAULT_RESPONSE = {
  answer:
    "Simulated response: this is a placeholder answer shown because the Ask SCRB service isn't reachable right now. Once it's deployed, real questions will be answered from actual FIR records with citations.",
  sources: [],
};

/** Very simple keyword match — good enough for a demo fallback, not meant to be smart. */
export function getMockChatResponse(query) {
  const lowerQuery = query.toLowerCase();
  const match = MOCK_RESPONSES.find((r) => r.keywords.every((kw) => lowerQuery.includes(kw)));
  return match || DEFAULT_RESPONSE;
}