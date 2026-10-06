# 🍎 Apple Tree for Claude Code

[中文](#中文) · [English](#english)

---

## 中文

一棵跟着你的 Claude Code 用量长大的苹果树。

- **整棵树 = 每周额度**：周用量越高，树越大，从发芽、树苗、长叶、茂密一直长到开花。
- **一个果子 = 一个 5 小时窗口**：当前窗口的果子会随用量长大、变色。窗口重置时，果子按最终的百分比定型，留在树上。整个窗口都没用就不结果。
- **每周重置**：旧树收进"果园"，新的一周从种子重新长。

果子越大，说明那个 5 小时用得越多：

| 样子 | 5 小时用量 |
|---|---|
| 🌸 粉色小花 | 刚开始，0% |
| 浅绿小果 | < 30% |
| 绿果 | 30–70% |
| 橙果 | 70–90% |
| 红苹果（熟了） | ≥ 90% |

### 显示在哪

- **`/tree`**：打开侧边面板。桌面版和手机上是插画，终端里是字符画。
- **状态栏**：`🍎4 · 5h 42% · 周 37%`（英文环境显示 `wk 37%`）
- **提示**：果子熟了、树长到下一阶段、果子定型、新一周开始时，各弹一次。

### 安装

1. 下载到本地：

   ```bash
   git clone https://github.com/JoyceGu/apple-tree-mod ~/.claude/mods/apple-tree-mod
   ```

2. 在 `~/.claude/settings.json` 里加上（已有 `env` 的话，把这一行放进去）：

   ```json
   "env": { "CLAUDE_CODE_PLUGIN_DIRS": "~/.claude/mods/apple-tree-mod" }
   ```

   已经装了别的 mod 的话，用 `:` 把路径接在后面。

3. 开一个新会话，输入 `/tree`。

### 语言

界面文字会跟随语言，中文或英文。自动判断的顺序：Claude Code 设置里的 `language` → 系统的 `LANG` / `LC_ALL` → 都没有时用英文。想固定成某一种，可以在 `/config` 里把 apple-tree 的 Language 改成 `zh` 或 `en`，或者在 `settings.json` 里加：

```json
"pluginConfigs": { "apple-tree": { "options": { "language": "zh" } } }
```

更新：`cd ~/.claude/mods/apple-tree-mod && git pull`，下次开新会话时生效。

### 需要什么

- 一个较新的 Claude Code（在 2.1.288 上测试过）。函数钩子 mod 目前是早期功能，接口以后可能会变。
- **订阅账号（Pro / Max）**。5 小时和每周额度的百分比只有订阅账号才有；用 API key 的话，面板会显示"还没有额度数据"。

### 怎么运作

- 数据来自 Claude Code 每次回复后推送的额度读数（`five_hour`、`seven_day`），和设置里看到的用量是同一个数。
- 树的状态存在 Claude Code 的本机插件存储里，所有会话一起长同一棵树。数据不会离开你的电脑。
- 数字只在某个会话收到回复时更新。没在用的时候不会有新数据，但窗口重置会在下一次回复时被发现，果子不会漏记。
- 装好之前的用量拿不到，所以第一棵树从当周中途开始长。

### 开发

```
hooks/register.tsx   钩子：读额度、面板、状态栏、提示
hooks/i18n.ts        中英文文字
hooks/logic.ts       纯逻辑：窗口和周的结算、画树（SVG + 字符）
tests/               claude plugin test 跑的测试
```

```bash
claude plugin validate ~/.claude/mods/apple-tree-mod
claude plugin test ~/.claude/mods/apple-tree-mod
```

---

## English

An apple tree that grows with your Claude Code usage.

- **The tree is your weekly limit.** The more of the week you use, the bigger it gets: sprout, sapling, leafing out, full canopy, then blossoms.
- **Each apple is one 5-hour window.** The current window's apple grows and changes color as you use it. When the window resets, the apple keeps its final size and stays on the tree. A window you never used leaves no apple.
- **Weekly reset.** The old tree goes into your "orchard" and a new seed sprouts.

A bigger apple means you used more of that 5-hour window:

| Looks like | 5-hour usage |
|---|---|
| 🌸 pink blossom | just started, 0% |
| tiny pale apple | < 30% |
| green apple | 30–70% |
| orange apple | 70–90% |
| red apple (ripe) | ≥ 90% |

### Where it shows up

- **`/tree`** opens a side pane: an illustration on desktop and mobile, ASCII art in the terminal.
- **Status line:** `🍎4 · 5h 42% · wk 37%`
- **Toasts** when an apple ripens, the tree reaches a new stage, an apple is set, or a new week starts.

### Install

1. Clone it:

   ```bash
   git clone https://github.com/JoyceGu/apple-tree-mod ~/.claude/mods/apple-tree-mod
   ```

2. Add this to `~/.claude/settings.json` (inside your existing `env` block if you have one):

   ```json
   "env": { "CLAUDE_CODE_PLUGIN_DIRS": "~/.claude/mods/apple-tree-mod" }
   ```

   If you already load other mods, append this path with `:`.

3. Start a new session and type `/tree`.

### Language

The text follows your language, Chinese or English. Auto picks from Claude Code's `language` setting, then the system `LANG` / `LC_ALL`, and falls back to English. To pin one, set apple-tree's Language to `zh` or `en` in `/config`, or add this to `settings.json`:

```json
"pluginConfigs": { "apple-tree": { "options": { "language": "en" } } }
```

To update: `cd ~/.claude/mods/apple-tree-mod && git pull`, then start a new session.

### Requirements

- A recent Claude Code (tested on 2.1.288). Function-hook mods are an early-access feature and the API may change.
- **A subscription (Pro / Max).** Only subscription accounts report 5-hour and weekly limit percentages. With an API key, the pane says there's no limit data yet.

### How it works

- It reads the rate-limit figures Claude Code reports after each reply (`five_hour`, `seven_day`), the same numbers you see in settings.
- The tree lives in Claude Code's local plugin store, so every session grows the same tree. Nothing leaves your machine.
- Numbers only update when a session gets a reply. While you're away nothing changes, but a window reset is caught on the next reply, so no apple goes missing.
- Usage from before you installed it isn't available, so your first tree starts partway through the week.

### Development

```
hooks/register.tsx   hooks: limit readings, pane, status line, toasts
hooks/i18n.ts        Chinese / English strings
hooks/logic.ts       pure logic: window/week bookkeeping, drawing (SVG + ASCII)
tests/               run by claude plugin test
```

```bash
claude plugin validate ~/.claude/mods/apple-tree-mod
claude plugin test ~/.claude/mods/apple-tree-mod
```

## License

MIT
