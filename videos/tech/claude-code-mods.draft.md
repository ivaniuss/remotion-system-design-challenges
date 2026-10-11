# Draft: Claude Code just got mods

`claude-code-mods` · en · pack tech · long video ~3 min (horizontal + vertical) + 2 Shorts

## Question

Claude Code just got mods: you can change how it behaves and what it draws on screen.
But it already had hooks, skills and MCP. So what's actually new? We build it up from
the simplest picture: the agent loop, the extensions that live outside it, and then
code that runs inside it.

## How this video teaches

- **Progressive build**: the agent loop that already works → the extensions that work
  from the outside → their limit (a narrow door: yes or no) → "what if your code ran
  inside?" → mods → "what's the catch?" → permissions and how to stay safe.
- **Every piece earns its place**: skill, MCP server, settings hook and mod each say
  what they are and what they change, in one clause.
- **Blame the mechanism**: mods aren't dangerous because they're new; they're powerful
  because they run in the same process, with your permissions. Same rule as any
  software you install.
- **Never imply the simple option is wrong**: a skill, MCP or a settings hook is still
  the right pick when it does the job (the official docs say so too).
- Brand: name "Claude Code" in narration and text (factual); no logos or official art.

## Versions (internal map)

| Picture | Question that triggers it | What it shows | Its limit |
| --- | --- | --- | --- |
| The agent loop | — | You → Claude Code → model → tool call on your machine | Fixed behavior and interface |
| Extensions from outside | "How did you customize it until now?" | Skill (instructions), MCP (tools), settings hook (script on events) | Can allow/block/log, can't draw or take over |
| Mods | "What if your code ran inside?" | Functions on events: observe, rewrite, answer; panes, spinner, commands | Runs with your permissions, no sandbox |
| Safe use | "What's the catch?" | validate before installing, safe mode, admin policies, sec-default | Trust is on you |

## Board

```
[You] → [Claude Code] → [Model]
             ↓    ↑
        [Your machine]          (bash · files)
[Skill] [MCP server] [Settings hook]   (outside, row 2)
             [Mod]                     (inside, revealed later)
        [Your secrets]                 (the catch)
```
Icons (tech pack): user · code (Claude Code) · ai (model) · container (your machine) ·
file (skill) · external (MCP server) · worker (settings hook script) · lambda (mod: functions) ·
lock (secrets / permissions).

## Scenes (long video)

1. **Claude Code just got *mods*** (title) — Claude Code just got mods: you can change how it behaves and what it draws on screen. But it already had hooks, skills and MCP. So what's actually new? Let's build it up from the simplest picture.
   _Visual:_ Tag "Claude Code", heading on frame 0; beats "You" → "Claude Code" → "Mod" → "?".

2. **The agent loop** (board) — Start with the loop you already know. You type a prompt, and Claude Code sends it to the model. The model answers with a tool call, like running a command or editing a file, and Claude Code runs it on your machine.
   _Visual:_ You → Claude Code → Model; packet "prompt", packet back "tool call", packet to "Your machine" (bash · files).

3. **Extensions, from the outside** (board) — Until now, you extended it from the outside. A skill is instructions Claude reads. An MCP server is an outside program that gives Claude new tools. And a settings hook runs your script when something happens, like right before a tool call.
   _Visual:_ Skill (file), MCP server (external), Settings hook (script) pop in on a row outside Claude Code, each with a one-line note.

4. **A narrow door** (board) — Each one talks to Claude Code through a narrow door. A script can say yes or no to a tool call, or change its input. But it can't draw a panel, change the spinner, or take over a command. That's the gap.
   _Visual:_ Packet "tool call?" to the settings hook and back "yes / no"; note "Outside: *allow · block · log*".

5. **Inside** (callout) — So, what if your code could run inside Claude Code itself?
   _Visual:_ "Inside" · "a mod's code runs in Claude Code's own process" over the dimmed board (impact).

6. **What a mod is** (board) — That's a mod. It's a plugin with JavaScript or TypeScript functions, and Claude Code calls them when something happens: a tool call, a prompt you send, or a piece of the screen being drawn.
   _Visual:_ "Mod" (λ functions) appears next to Claude Code; three packets "tool.call", "prompt", "ui.render" from Claude Code to the mod.

7. **Observe, rewrite, or answer** (board) — The function runs before Claude Code acts, so it decides what happens next. It can just watch. It can rewrite the event. Or it can answer it itself, so the usual behavior never runs.
   _Visual:_ Three notes in turn: "*Observe*: let it pass", "*Rewrite*: change it", "*Answer*: take over".

8. **Twelve lines** (board) — The official example is tiny. One function counts every tool call. Another redraws the spinner with that count: thinking, tool calls, three. Two hooks, sharing one variable.
   _Visual:_ Packets "tool.call" ×3 into the mod (busy); packet "spinner +3" back to Claude Code; note "Two hooks, *one shared variable*".

9. **Blast radius** (board) — Anthropic's sample mods go further. One holds a risky command, like a recursive delete or a force push, shows what it would change, and waits for you to press proceed or cancel.
   _Visual:_ Model → Claude Code "rm -rf", held at the mod (warn); note "Held: *proceed / cancel*"; you → mod "proceed".

10. **Even Claude Code uses them** (board) — And Anthropic moved some of its own features into mods: the diff pane, loading your AGENTS file, and telemetry. You can turn them off, or replace them with your own.
   _Visual:_ Notes "Built-in mods: */diff · AGENTS.md · telemetry*".

11. **No sandbox** (callout) — So, what's the catch?
   _Visual:_ "No sandbox" · "a mod runs with your permissions" (alarm).

12. **What a mod can reach** (board) — A mod is code that runs with your permissions. It can read and write your files, read secrets like API keys, see every prompt, approve a tool call before you're asked, and spend your usage. And it isn't sandboxed.
   _Visual:_ "Your secrets" (lock) appears; mod → files, mod → secrets packets; error peak on "approve a tool call before you're asked".

13. **How to stay safe** (board) — So treat a mod like any software you install. Before installing, claude plugin validate lists the events it handles and what it calls. Safe mode starts a session without them. And companies can allow only their own mods.
   _Visual:_ Notes "`claude plugin validate`: *see before you install*", "`--safe-mode`: *start without mods*", "Admins: *only managed mods*"; mod back to idle, camera [] on the whole board.

14. **Which one do you pick?** (list) — So which one do you pick? A skill changes what Claude knows. MCP changes what it can reach. A settings hook allows, blocks or logs. And a mod changes the behavior and the interface itself.
   _Visual:_ Four rows with icons: Skill · MCP server · Settings hook · Mod.

15. **The takeaway** (summary) — Mods are code inside Claude Code: powerful, and running with your permissions. Use one when nothing else can do the job. What mod would you build first?
   _Visual:_ Points "Mods run *inside* Claude Code" · "Observe, rewrite or *answer* events" · "Your permissions: *install only what you trust*"; CTA "What mod would you build first?".

16. **Before you go** (list, long YouTube only) — Before you go: tell me in the comments what mod you'd build, and which tool you want me to explain next. If this helped, a like and a subscribe help the channel a lot.

## Shorts (cut from the long video, vertical, ~50 s each, end with the question + "full video on the channel")

**Short 1 — "Claude Code just got mods. What's new?"**
Hook (title + beats) → the outside extensions and their narrow door (scenes 3–4, cut) → "what if it ran inside?" → a mod: functions on events; observe, rewrite, answer (6–7) → the spinner example (8) → "What mod would you build? The full video is on the channel."

**Short 2 — "The catch with Claude Code mods"**
Hook: "Claude Code mods can approve a tool call before you're asked. Here's why." → what a mod is in one line → what it can reach, error peak (12) → how to stay safe (13) → "Would you install mods from strangers? The full video is on the channel."

## Talking points (said, not shown) — with sources

1. Launched October 1, 2026 (@ClaudeDevs: "You can now mod Claude Code"). Needs Claude Code v2.1.287+ in the terminal; the Desktop app's Code tab from v2.1.286. On by default.
2. Docs definition: "A mod is a plugin that changes how Claude Code looks and behaves. It's made of JavaScript or TypeScript event handlers." Settings hooks run a shell command, HTTP request or prompt from a settings file; mod handlers are functions inside Claude Code.
3. A hook can observe, rewrite or answer an event. To do anything outside its own code (draw, add a command, call a model, read a file, start a process, network) it must call the mods API, which is why `claude plugin validate` can list what a mod does before you install it.
4. The official example (counting tool calls and showing them by the spinner) is two hooks sharing one variable: `tool.call` and `ui.render` on the Spinner component.
5. Sample mods (anthropics/claude-code-playground): token-weather (a context-window forecast above the prompt), blast-radius (holds risky shell commands like `rm -rf` or a force push, with proceed/cancel), replay-theater (`/replay` steps through the last turn's edits).
6. Built-in mods: `/diff`, AGENTS.md loading, telemetry, the plugin-authoring skill, `sec-default` (guards what an organization manages from user-installed mods), and an opt-in side agent ("you should know").
7. What a mod can reach (docs): your files and processes, network, environment variables and settings (API keys), every prompt and tool call, rewriting them, approving a tool call before you're asked, spending your usage. Not sandboxed: Bash sandboxing isolates Claude's commands, not processes a mod starts. A mod can't restyle the permission prompt.
8. Controls: `claude plugin validate` (hooks/calls), `--safe-mode`, `"disableAllHooks": true`, admins' `allowManagedModsOnly`, and `sec-default` loading first on managed setups.
9. Where they draw: the terminal and the Desktop app's Code tab; hooks also run (without UI) in the VS Code extension, `claude -p` and the Agent SDK.
10. When not to write a mod: if a skill, settings hook or MCP server already does it, the docs recommend those.

Sources: code.claude.com/docs/en/plugins/mods/overview · claude.com/resources/articles/claude-code-mods · github.com/anthropics/claude-code-playground (claude-code/mods) · github.com/anthropics/claude-code (mods).
