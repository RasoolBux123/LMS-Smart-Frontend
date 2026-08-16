/** Builds an ISO date relative to today, so the mock data never goes stale. */
export function daysFromNow(days: number, hour = 23) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(hour, 59, 0, 0);
  return d.toISOString();
}
