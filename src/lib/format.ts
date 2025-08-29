export function splitDayTime(x: number): [string, string] {
  const d = new Date(x)
  const day = `${d.toLocaleString(undefined, { day: '2-digit' })} ${d.toLocaleString(undefined, { month: 'short' })}`
  const time = d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
  return [day, time]
}

export function tooltipRunLabel(x: number): string {
  const [day, time] = splitDayTime(x)
  return `Run: ${day} ${time}`
}

