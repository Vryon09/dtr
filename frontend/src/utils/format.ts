export function formatHours(hours: number | null | undefined): string {
  if (hours === null || hours === undefined) return '0.00h';
  return `${Number(hours).toFixed(2)}h`;
}

export function formatPercent(percentage: number | null | undefined): string {
  if (percentage === null || percentage === undefined) return '0%';
  return `${Number(percentage).toFixed(1)}%`;
}
