export type Apple = { pct: number; resetsAt: string }
export type Week = { resetsAt: string; pct: number; apples: Apple[] }
export type Window = { resetsAt: string; pct: number }
export type WeekRecord = { resetsAt: string; pct: number; apples: number[] }
export type Garden = {
  week: Week | null
  current: Window | null
  orchard: WeekRecord[]
  hasLimits: boolean
}

declare module 'claude-code' {
  interface PluginState {
    'apple-tree': { garden: Garden }
  }
}
