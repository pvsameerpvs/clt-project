export function generateOrderNumber() {
  const stamp = Date.now().toString(36).toUpperCase()
  const suffix = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, '0')

  return `CLE-${stamp}-${suffix}`
}
