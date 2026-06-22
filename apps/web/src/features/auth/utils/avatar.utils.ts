/**
 * Generate user initials from name
 * @param name - User's full name
 * @returns Initials (max 2 characters)
 */
export function getInitials(name: string): string {
  const parts = name.trim().split(' ').filter(Boolean);

  if (parts.length === 0) return '??';
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();

  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Get background color for avatar based on name
 * @param name - User's name
 * @returns Tailwind color class
 */
export function getAvatarColor(name: string): string {
  const colors = [
    'bg-[var(--premium-action-blue)]',
    'bg-[var(--premium-action-cyan)]',
    'bg-[var(--premium-success)]',
    'bg-[rgba(var(--premium-warning-rgb),0.82)]',
    'bg-[rgba(var(--premium-danger-rgb),0.78)]',
    'bg-[rgba(var(--premium-info-rgb),0.85)]',
    'bg-[var(--premium-action-blue)]',
    'bg-[var(--premium-action-cyan)]',
  ];

  const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[hash % colors.length];
}
