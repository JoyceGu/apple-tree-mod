export type Lang = 'zh' | 'en'

export const pickLang = (option: unknown, setting: unknown, locale: string | undefined): Lang => {
  if (option === 'zh' || option === 'en') return option
  const s = String(setting ?? '').toLowerCase()
  if (s) return /zh|chin|中文|汉|漢/.test(s) ? 'zh' : 'en'
  return (locale ?? '').toLowerCase().startsWith('zh') ? 'zh' : 'en'
}

export const STRINGS = {
  zh: {
    stages: ['发芽', '树苗', '长叶', '茂密', '开花'],
    appleSet: (p: number) => `🍎 这个 5 小时窗口的果子定型了：${p}%`,
    newWeek: (p: number, n: number) => `🧺 新的一周：上周的树（${p}%，${n} 个果子）收进果园`,
    stageUp: (name: string, p: number) => `🌳 树长到了「${name}」阶段（周 ${p}%）`,
    ripe: (p: number) => `🍎 当前果子熟了（5h ${p}%）`,
    soon: '即将重置',
    resetIn: (d: number, h: number, m: number) => (d > 0 ? `${d}天${h}h 后重置` : `${h}h${String(m).padStart(2, '0')}m 后重置`),
    week: '周',
    command: '打开苹果树：周额度长树，每个 5 小时窗口结一个果',
    title: '🍎 苹果树',
    opened: '苹果树已打开。',
    noData1: '还没有额度数据。',
    noData2: '订阅账号收到下一次回复后，树就会开始长。',
    header: (stage: string, n: number) => `${stage} · 本周已结 ${n} 个果子`,
    overflow: (n: number) => `还有 ${n} 个果子挂不下`,
    legend: ['花', '<30%', '<70%', '<90%', '熟'],
    current: '（当前果子，加粗）',
    orchard: '果园',
    orchardRow: (date: string, p: number, n: number) => `${date} 周 ${p}% · ${n} 个果子`,
    alt: (p: number, n: number) => `苹果树：周 ${p}%，${n} 个果子`,
  },
  en: {
    stages: ['Sprout', 'Sapling', 'Leafing', 'Full', 'Blossom'],
    appleSet: (p: number) => `🍎 This 5-hour window's apple is set: ${p}%`,
    newWeek: (p: number, n: number) => `🧺 New week: last week's tree (${p}%, ${n} apples) went to the orchard`,
    stageUp: (name: string, p: number) => `🌳 Your tree reached "${name}" (week ${p}%)`,
    ripe: (p: number) => `🍎 The current apple is ripe (5h ${p}%)`,
    soon: 'resets soon',
    resetIn: (d: number, h: number, m: number) => (d > 0 ? `resets in ${d}d ${h}h` : `resets in ${h}h${String(m).padStart(2, '0')}m`),
    week: 'wk',
    command: 'Open the apple tree: weekly limit grows the tree, each 5-hour window grows an apple',
    title: '🍎 Apple tree',
    opened: 'Apple tree opened.',
    noData1: 'No limit data yet.',
    noData2: 'On a subscription, the tree starts growing after your next reply.',
    header: (stage: string, n: number) => `${stage} · ${n} apples this week`,
    overflow: (n: number) => `${n} more apples don't fit`,
    legend: ['bloom', '<30%', '<70%', '<90%', 'ripe'],
    current: ' (current apple, bold)',
    orchard: 'Orchard',
    orchardRow: (date: string, p: number, n: number) => `${date} week ${p}% · ${n} apples`,
    alt: (p: number, n: number) => `Apple tree: week ${p}%, ${n} apples`,
  },
} as const
