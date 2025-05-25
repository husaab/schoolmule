export const getInitials = (username: string | null): string => {
  if (!username) return '';
  return username
    .split(' ')
    .map(name => name.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);
};
