export function timeAgo(date: string | null): string {
  if (!date) return "-";
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function truncateId(id: string, len = 12): string {
  if (id.length <= len) return id;
  return `${id.slice(0, 6)}…${id.slice(-4)}`;
}
