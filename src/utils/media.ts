export function assetUrl(path: string): string {
  if (!path) return ''
  if (path.startsWith('http')) return path
  const base = import.meta.env.VITE_API_BASE_URL || ''
  return `${base}${path}`
}
