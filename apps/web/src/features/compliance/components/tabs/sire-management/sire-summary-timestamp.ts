export function formatSireSummaryTimestamp(isoTimestamp?: string): string | null {
  if (!isoTimestamp) return null;

  const date = new Date(isoTimestamp);
  if (Number.isNaN(date.getTime())) return null;

  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'America/Lima',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  const parts = formatter.formatToParts(date);
  const getPart = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? '';

  const day = getPart('day');
  const month = getPart('month');
  const year = getPart('year');
  const hour = getPart('hour');
  const minute = getPart('minute');

  if (!day || !month || !year || !hour || !minute) return null;

  return `${day}/${month}/${year} ${hour}:${minute} PET`;
}
