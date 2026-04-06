export function generateSlug(title: string): string {
  return title.toLowerCase().trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80)
}

export function makeUniqueSlug(title: string, existingSlugs: readonly string[]): string {
  const base = generateSlug(title)
  if (!existingSlugs.includes(base)) return base
  for (let i = 2; i < 100; i++) {
    const candidate = `${base}-${i}`
    if (!existingSlugs.includes(candidate)) return candidate
  }
  return `${base}-${Date.now()}`
}
