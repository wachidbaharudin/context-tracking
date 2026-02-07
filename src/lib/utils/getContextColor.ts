/** Default color palette for contexts without explicit colors */
export const defaultContextColors: string[] = [
  '#3b82f6', // blue
  '#10b981', // emerald
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // violet
  '#06b6d4', // cyan
  '#ec4899', // pink
  '#84cc16', // lime
];

/**
 * Returns the context's color, or generates a consistent color based on context id
 */
export function getContextColor(context: { id: string; color?: string }): string {
  if (context.color) {
    return context.color;
  }

  // Generate a deterministic hash from the context id
  const hash = context.id.split('').reduce((acc, char) => {
    return acc + char.charCodeAt(0);
  }, 0);

  return defaultContextColors[hash % defaultContextColors.length];
}
