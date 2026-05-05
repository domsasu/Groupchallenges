/** First sentence or clause from marketing copy for compact card surfaces. */
export function challengeWhyJoinOneLiner(whyJoin: string): string {
  const t = whyJoin.trim();
  if (!t) return '';
  const m = /^.+?[.!?](?=\s|$)/.exec(t);
  if (m) return m[0].trim();
  if (t.length <= 140) return t;
  return `${t.slice(0, 137)}…`;
}
