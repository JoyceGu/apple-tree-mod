import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import type { Garden } from '../types'
import { EMPTY, advance, appleSeg, drawSvg, drawTree, stageOf, statusText, untilText } from './logic'
import type { Limit } from './logic'
import { STRINGS, pickLang } from './i18n'
import type { Lang } from './i18n'

const PANE = 'apple-tree'
const STORE_KEY = 'garden'


const garden = atom({ plugin: 'apple-tree', key: 'garden' } as const, EMPTY)

// $.store is shared by every session, so each reading starts from it.
async function fold($: EngineInterface, limits: Limit[], lang: Lang) {
  const saved = ((await $.store.get(STORE_KEY)) as Garden | undefined) ?? EMPTY
  const { garden: next, events } = advance(saved, limits, lang)
  await $.store.set(STORE_KEY, next)
  await update($, garden, () => next)
  $.ui.status(statusText(next, lang))
  events.forEach(text => $.ui.toast(text, { timeoutMs: 6000 }))
}

export const register: Register = (on, options) => {
  let lang: Lang = 'en'

  on('session.start', async ($, e, next) => {
    const settings = (await $.settings.read()) as { language?: unknown }
    const locale = (await $.env.get('LC_ALL')) || (await $.env.get('LANG'))
    lang = pickLang(options.language, settings.language, locale)
    await $.command.register({ name: 'tree', description: STRINGS[lang].command })
    const saved = ((await $.store.get(STORE_KEY)) as Garden | undefined) ?? EMPTY
    await update($, garden, () => saved)
    $.ui.status(statusText(saved, lang))
    const usage = await $.session.usage()
    if (usage.rateLimits.length > 0) await fold($, usage.rateLimits, lang)

    return next(e)
  })

  on('session.measure', async ($, e, next) => {
    if (e.changed.includes('rateLimits')) await fold($, e.rateLimits, lang)

    return next(e)
  })

  on('command.run', { command: 'tree' }, async $ => {
    await $.ui.open({ id: PANE, title: STRINGS[lang].title })

    return { text: STRINGS[lang].opened }
  })

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const ui = $.ui.resolve(e)
    const { Box, Text } = ui
    const g = await read($, garden)
    const now = await $.clock.now()
    const t = STRINGS[lang]

    if (!g.hasLimits) {
      return (
        <Box flexDirection="column">
          <Text dimColor>{t.noData1}</Text>
          <Text dimColor>{t.noData2}</Text>
        </Box>
      )
    }

    const { rows, overflow } = drawTree(g)
    const weekPct = g.week?.pct ?? 0
    const apples = g.week?.apples ?? []
    const legend = [
      appleSeg(0, true),
      appleSeg(10, false),
      appleSeg(50, false),
      appleSeg(80, false),
      appleSeg(95, false),
    ].map((s, i) => [s, t.legend[i]] as const)

    return (
      <Box flexDirection="column">
        <Text bold>
          {t.header(t.stages[stageOf(weekPct)] ?? '', apples.length)}
        </Text>
        <Text> </Text>
        {'Svg' in ui ? (
          <ui.Svg
            source={drawSvg(g)}
            alt={t.alt(weekPct, apples.length)}
            isInteractive
          />
        ) : (
          rows.map(row => (
            <Text>
              {row.map(s => (
                <Text color={s.color} bold={s.bold}>{s.text}</Text>
              ))}
            </Text>
          ))
        )}
        {!('Svg' in ui) && overflow > 0 && <Text dimColor>{t.overflow(overflow)}</Text>}
        <Text> </Text>
        <Text>
          {legend.map(([s, label]) => (
            <Text>
              <Text color={s.color} bold={s.bold}>{s.text}</Text>
              <Text dimColor> {label}  </Text>
            </Text>
          ))}
        </Text>
        <Text> </Text>
        <Text>
          5h  <Text bold>{g.current?.pct ?? 0}%</Text>
          <Text dimColor>  {untilText(g.current?.resetsAt, now, lang)}{t.current}</Text>
        </Text>
        <Text>
          {t.week}  <Text bold>{weekPct}%</Text>
          <Text dimColor>  {untilText(g.week?.resetsAt, now, lang)}</Text>
        </Text>
        {g.orchard.length > 0 && <Text> </Text>}
        {g.orchard.length > 0 && <Text bold>{t.orchard}</Text>}
        {g.orchard.slice(-4).reverse().map(w => (
          <Text dimColor>
            {t.orchardRow(w.resetsAt.slice(5, 10), w.pct, w.apples.length)}
          </Text>
        ))}
      </Box>
    )
  })
}
