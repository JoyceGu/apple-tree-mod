import type { Apple, Garden, Week } from '../types'
import { STRINGS } from './i18n'
import type { Lang } from './i18n'

export type Limit = { kind: string; percentUsed: number; resetsAt?: string }

export const EMPTY: Garden = { week: null, current: null, orchard: [], hasLimits: false }

export const STAGES = [0, 10, 30, 60, 85] as const

export const stageOf = (pct: number) => {
  let i = 0
  STAGES.forEach((at, n) => {
    if (pct >= at) i = n
  })
  return i
}

export const RIPE = 90

const moved = (a: string, b: string | undefined, toleranceMs: number) =>
  b !== undefined && Math.abs(Date.parse(a) - Date.parse(b)) > toleranceMs

const HOUR = 3_600_000

// Folds one rate-limit reading into the garden; events are toast lines.
export const advance = (prev: Garden, limits: Limit[], lang: Lang = 'zh') => {
  const t = STRINGS[lang]
  const five = limits.find(l => l.kind === 'five_hour')
  const seven = limits.find(l => l.kind === 'seven_day')
  const events: string[] = []
  let week: Week | null = prev.week
  let current = prev.current
  let orchard = prev.orchard

  if (!five && !seven) {
    return { garden: { ...prev, hasLimits: prev.hasLimits }, events }
  }

  // A new 5-hour window: the last apple is set at its final size.
  if (five?.resetsAt && current && moved(current.resetsAt, five.resetsAt, HOUR / 2)) {
    if (current.pct > 0 && week) {
      const apple: Apple = { pct: current.pct, resetsAt: current.resetsAt }
      week = { ...week, apples: [...week.apples, apple] }
      events.push(t.appleSet(current.pct))
    }
    current = null
  }

  if (seven?.resetsAt) {
    if (week && moved(week.resetsAt, seven.resetsAt, 6 * HOUR)) {
      orchard = [
        ...orchard,
        { resetsAt: week.resetsAt, pct: week.pct, apples: week.apples.map(a => a.pct) },
      ].slice(-52)
      events.push(t.newWeek(week.pct, week.apples.length))
      week = null
    }
    if (!week) {
      week = { resetsAt: seven.resetsAt, pct: 0, apples: [] }
    }
    const before = stageOf(week.pct)
    week = { ...week, resetsAt: seven.resetsAt, pct: seven.percentUsed }
    const after = stageOf(week.pct)
    if (after > before) {
      events.push(t.stageUp(t.stages[after] ?? '', week.pct))
    }
  }

  if (five?.resetsAt) {
    const was = current?.pct ?? 0
    current = { resetsAt: five.resetsAt, pct: five.percentUsed }
    if (was < RIPE && current.pct >= RIPE) {
      events.push(t.ripe(current.pct))
    }
  }

  return { garden: { week, current, orchard, hasLimits: true }, events }
}

export const untilText = (iso: string | undefined, now: number, lang: Lang = 'zh') => {
  if (!iso) return ''
  const ms = Date.parse(iso) - now
  if (ms <= 0) return STRINGS[lang].soon
  const h = Math.floor(ms / HOUR)
  const m = Math.floor((ms % HOUR) / 60_000)
  return STRINGS[lang].resetIn(Math.floor(h / 24), h >= 24 ? h % 24 : h, m)
}

export const statusText = (g: Garden, lang: Lang = 'zh') => {
  if (!g.hasLimits) return undefined
  const apples = g.week?.apples.length ?? 0
  const five = g.current ? ` · 5h ${g.current.pct}%` : ''
  const week = g.week ? ` · ${STRINGS[lang].week} ${g.week.pct}%` : ''
  return `🍎${apples}${five}${week}`
}

// ---- drawing ----

export type Seg = { text: string; color?: string; bold?: boolean }

const W = 33
const BARK = '#8b5a2b'
const LEAF = ['#9ccc65', '#7cb342', '#558b2f', '#33691e', '#2e7d32']
const LEAF_CHAR = [',', ';', '%', '%', '%']

export const appleSeg = (pct: number, isCurrent: boolean): Seg => {
  if (isCurrent && pct === 0) return { text: '*', color: '#f48fb1', bold: true }
  const s: Seg =
    pct < 30 ? { text: '·', color: '#c5e1a5' }
      : pct < 70 ? { text: 'o', color: '#aed581' }
        : pct < RIPE ? { text: 'O', color: '#ffa726' }
          : { text: 'O', color: '#e53935', bold: true }
  return isCurrent ? { ...s, bold: true, color: s.color } : s
}

const hash = (x: number, y: number) => {
  let h = (x * 374761393 + y * 668265263) | 0
  h = (h ^ (h >>> 13)) * 1274126177
  return (h ^ (h >>> 16)) >>> 0
}

export const drawTree = (g: Garden): { rows: Seg[][]; overflow: number } => {
  const pct = Math.min(100, Math.max(0, g.week?.pct ?? 0))
  const stage = stageOf(pct)
  const t = pct / 100
  const rx = 2 + t * 13
  const ry = 1 + t * 5
  const trunk = 1 + Math.round(t * 3)
  const cx = Math.floor(W / 2)
  const rowsN = Math.ceil(ry) * 2 + 1

  const cells: [number, number][] = []
  for (let y = 0; y < rowsN; y++) {
    for (let x = 0; x < W; x++) {
      const dx = (x - cx) / rx
      const dy = (y - (rowsN - 1) / 2) / ry
      if (dx * dx + dy * dy <= 1) cells.push([x, y])
    }
  }
  const slots = [...cells].sort((a, b) => hash(...a) - hash(...b))

  const apples = (g.week?.apples ?? []).map(a => appleSeg(a.pct, false))
  if (g.current) apples.push(appleSeg(g.current.pct, true))

  const at = new Map<string, Seg>()
  apples.slice(0, slots.length).forEach((seg, i) => at.set(slots[i]!.join(','), seg))
  const overflow = Math.max(0, apples.length - slots.length)

  const grid: Seg[][] = []
  for (let y = 0; y < rowsN; y++) {
    const row: Seg[] = []
    for (let x = 0; x < W; x++) {
      const key = `${x},${y}`
      const dx = (x - cx) / rx
      const dy = (y - (rowsN - 1) / 2) / ry
      if (at.has(key)) row.push(at.get(key)!)
      else if (dx * dx + dy * dy <= 1) {
        const isFlower = stage === 4 && hash(x, y) % 9 === 0
        row.push(isFlower ? { text: '*', color: '#f8bbd0' } : { text: LEAF_CHAR[stage] ?? '%', color: LEAF[stage] })
      } else row.push({ text: ' ' })
    }
    grid.push(row)
  }
  for (let i = 0; i < trunk; i++) {
    const row: Seg[] = Array.from({ length: W }, () => ({ text: ' ' }))
    row[cx] = { text: '|', color: BARK, bold: true }
    if (stage >= 2 && i === 0) {
      row[cx - 1] = { text: '\\', color: BARK }
      row[cx + 1] = { text: '/', color: BARK }
    }
    grid.push(row)
  }
  grid.push(Array.from({ length: W }, () => ({ text: '~', color: '#6d4c41' })))

  // merge same-style runs so each row is a few spans
  const rows = grid.map(row =>
    row.reduce<Seg[]>((out, s) => {
      const last = out[out.length - 1]
      if (last && last.color === s.color && last.bold === s.bold) last.text += s.text
      else out.push({ ...s })
      return out
    }, []),
  )
  return { rows, overflow }
}

// ---- picture (desktop / vscode / mobile) ----

const appleFill = (pct: number) =>
  pct < 30 ? '#c5e1a5' : pct < 70 ? '#8bc34a' : pct < RIPE ? '#ffa726' : '#e53935'

const appleSvg = (x: number, y: number, pct: number, isCurrent: boolean) => {
  if (isCurrent && pct === 0) {
    const petals = [0, 72, 144, 216, 288]
      .map(a => {
        const r = (a * Math.PI) / 180
        return `<circle cx="${(x + Math.cos(r) * 4).toFixed(1)}" cy="${(y + Math.sin(r) * 4).toFixed(1)}" r="3.2" fill="#f8bbd0"/>`
      })
      .join('')
    return `${petals}<circle cx="${x}" cy="${y}" r="2" fill="#fff59d"/>`
  }
  const r = 4 + (Math.min(100, pct) / 100) * 9
  const ring = isCurrent
    ? `<circle cx="${x}" cy="${y}" r="${r + 4}" fill="none" stroke="#fff" stroke-width="2" stroke-dasharray="3 3"><animate attributeName="r" values="${r + 3};${r + 6};${r + 3}" dur="2s" repeatCount="indefinite"/></circle>`
    : ''
  return (
    `<line x1="${x}" y1="${y - r}" x2="${x + 1}" y2="${y - r - 4}" stroke="#5d4037" stroke-width="1.5"/>` +
    `<ellipse cx="${x + 4}" cy="${y - r - 3}" rx="3.5" ry="1.8" fill="#43a047" transform="rotate(-25 ${x + 4} ${y - r - 3})"/>` +
    `<circle cx="${x}" cy="${y}" r="${r}" fill="${appleFill(pct)}"/>` +
    `<circle cx="${x - r * 0.35}" cy="${y - r * 0.35}" r="${r * 0.28}" fill="#fff" opacity=".45"/>` +
    ring
  )
}

export const drawSvg = (g: Garden) => {
  const pct = Math.min(100, Math.max(0, g.week?.pct ?? 0))
  const stage = stageOf(pct)
  const t = Math.max(pct, 3) / 100
  const W = 360
  const H = 380
  const ground = H - 40
  const cx = W / 2
  const trunkH = 18 + t * 110
  const R = 22 + t * 100
  const cy = ground - trunkH - R * 0.55
  const leaf = LEAF[stage] ?? '#558b2f'

  const parts: string[] = []
  parts.push(`<ellipse cx="${cx}" cy="${ground + 6}" rx="${150}" ry="16" fill="#a1887f" opacity=".35"/>`)
  parts.push(`<ellipse cx="${cx}" cy="${ground + 2}" rx="${40 + R * 0.6}" ry="8" fill="#6d4c41" opacity=".25"/>`)

  if (stage === 0) {
    // a sprout: a stem and two leaves
    const top = ground - 22 - t * 300
    parts.push(`<path d="M${cx} ${ground} Q${cx - 4} ${(ground + top) / 2} ${cx} ${top}" stroke="#7cb342" stroke-width="4" fill="none" stroke-linecap="round"/>`)
    parts.push(`<ellipse cx="${cx - 13}" cy="${top}" rx="14" ry="7" fill="#9ccc65" transform="rotate(-30 ${cx - 13} ${top})"/>`)
    parts.push(`<ellipse cx="${cx + 13}" cy="${top - 2}" rx="14" ry="7" fill="#8bc34a" transform="rotate(30 ${cx + 13} ${top - 2})"/>`)
  } else {
    const tw = 6 + t * 18
    parts.push(`<path d="M${cx - tw} ${ground} L${cx - tw * 0.45} ${cy + R * 0.3} L${cx + tw * 0.45} ${cy + R * 0.3} L${cx + tw} ${ground} Z" fill="#8d6e63"/>`)
    if (stage >= 2) {
      parts.push(`<path d="M${cx} ${cy + R * 0.5} Q${cx - R * 0.35} ${cy + R * 0.2} ${cx - R * 0.55} ${cy}" stroke="#8d6e63" stroke-width="${3 + t * 5}" fill="none" stroke-linecap="round"/>`)
      parts.push(`<path d="M${cx} ${cy + R * 0.45} Q${cx + R * 0.35} ${cy + R * 0.15} ${cx + R * 0.5} ${cy - R * 0.1}" stroke="#8d6e63" stroke-width="${3 + t * 5}" fill="none" stroke-linecap="round"/>`)
    }
    const blobs = [
      [0, -0.25, 0.62], [-0.45, 0.05, 0.5], [0.45, 0.05, 0.5], [-0.25, -0.5, 0.45], [0.28, -0.48, 0.45], [0, 0.18, 0.5],
    ].slice(0, stage >= 2 ? 6 : 3)
    const shades = [leaf, '#689f38', leaf, '#7cb342', '#689f38', leaf]
    blobs.forEach(([bx, by, br], i) =>
      parts.push(`<circle cx="${cx + bx! * R}" cy="${cy + by! * R}" r="${br! * R}" fill="${shades[i]}" opacity="${stage >= 3 ? 1 : 0.85}"/>`),
    )
    if (stage === 4) {
      for (let i = 0; i < 14; i++) {
        const a = i * 2.39996
        const rr = R * 0.8 * Math.sqrt((i + 0.5) / 14)
        parts.push(`<circle cx="${(cx + Math.cos(a + 1) * rr).toFixed(1)}" cy="${(cy - R * 0.1 + Math.sin(a + 1) * rr * 0.8).toFixed(1)}" r="3" fill="#f8bbd0"/>`)
      }
    }
  }

  const apples = (g.week?.apples ?? []).map(a => ({ pct: a.pct, isCurrent: false }))
  if (g.current) apples.push({ pct: g.current.pct, isCurrent: true })
  const N = 36
  apples.slice(0, N).forEach((a, i) => {
    let x: number
    let y: number
    if (stage === 0) {
      // nothing to hang on yet: they rest on the ground
      x = cx + 34 + (i % 8) * 16
      y = ground - 8 - Math.floor(i / 8) * 14
    } else {
      const ang = i * 2.39996
      const rr = R * 0.78 * Math.sqrt((i + 0.5) / N)
      x = cx + Math.cos(ang) * rr
      y = cy - R * 0.1 + Math.sin(ang) * rr * 0.8
    }
    parts.push(appleSvg(Math.round(x), Math.round(y), a.pct, a.isCurrent))
  })

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">${parts.join('')}</svg>`
}
