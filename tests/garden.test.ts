import { expect, test } from 'claude-code/testing'

import { EMPTY, advance, drawTree, stageOf, statusText } from '../hooks/logic'
import { pickLang } from '../hooks/i18n'

const five = (pct: number, resetsAt: string) => ({ kind: 'five_hour', percentUsed: pct, resetsAt })
const seven = (pct: number, resetsAt: string) => ({ kind: 'seven_day', percentUsed: pct, resetsAt })
const W1 = '2026-10-08T00:00:00Z'
const W2 = '2026-10-15T00:00:00Z'

test('a 5-hour window sets its apple at its final percent', async () => {
  let g = advance(EMPTY, [five(20, '2026-10-05T10:00:00Z'), seven(30, W1)]).garden
  g = advance(g, [five(64, '2026-10-05T10:00:00Z'), seven(33, W1)]).garden
  expect(g.week?.apples.length).toBe(0)
  const r = advance(g, [five(3, '2026-10-05T15:00:00Z'), seven(34, W1)])
  expect(r.garden.week?.apples).toEqual([{ pct: 64, resetsAt: '2026-10-05T10:00:00Z' }])
  expect(r.garden.current?.pct).toBe(3)
  expect(r.events.some(t => t.includes('64%'))).toBe(true)
})

test('an unused window leaves no apple; ripeness and stage toast once', async () => {
  let g = advance(EMPTY, [five(0, '2026-10-05T10:00:00Z'), seven(8, W1)]).garden
  g = advance(g, [five(0, '2026-10-05T15:00:00Z'), seven(8, W1)]).garden
  expect(g.week?.apples.length).toBe(0)
  const r = advance(g, [five(91, '2026-10-05T15:00:00Z'), seven(12, W1)])
  expect(r.events.filter(t => t.includes('熟了')).length).toBe(1)
  expect(r.events.filter(t => t.includes('树苗')).length).toBe(1)
  expect(advance(r.garden, [five(95, '2026-10-05T15:00:00Z'), seven(13, W1)]).events).toEqual([])
})

test('a new week files the tree in the orchard and starts from a seed', async () => {
  let g = advance(EMPTY, [five(50, '2026-10-07T22:00:00Z'), seven(70, W1)]).garden
  g = advance(g, [five(2, '2026-10-08T03:00:00Z'), seven(1, W2)]).garden
  expect(g.orchard).toEqual([{ resetsAt: W1, pct: 70, apples: [50] }])
  expect(g.week).toEqual({ resetsAt: W2, pct: 1, apples: [] })
  expect(stageOf(g.week!.pct)).toBe(0)
  expect(statusText(g)).toBe('🍎0 · 5h 2% · 周 1%')
})

test('the tree grows with the weekly percent', async () => {
  const small = drawTree(advance(EMPTY, [seven(5, W1)]).garden).rows.length
  const big = drawTree(advance(EMPTY, [seven(95, W1)]).garden).rows.length
  expect(big).toBeGreaterThan(small)
})

test('text follows the language', async () => {
  expect(pickLang('auto', undefined, 'zh_CN.UTF-8')).toBe('zh')
  expect(pickLang('auto', 'chinese', 'en_US.UTF-8')).toBe('zh')
  expect(pickLang('auto', 'English', 'zh_CN.UTF-8')).toBe('en')
  expect(pickLang('en', '中文', undefined)).toBe('en')
  const g = advance(EMPTY, [five(91, '2026-10-05T10:00:00Z'), seven(12, W1)], 'en')
  expect(g.events).toContain('🍎 The current apple is ripe (5h 91%)')
  expect(statusText(g.garden, 'en')).toBe('🍎0 · 5h 91% · wk 12%')
})
