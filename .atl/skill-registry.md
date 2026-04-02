# Skill Registry — poc-trello

Generated: 2026-04-01

## Project: poc-trello

Stack: Angular 21 + Express + TypeScript + OpenAPI 3.0  
Persistence: engram

---

## Sources Scanned

- User-level skill dirs: `~/.claude/skills`, `~/.config/opencode/skills`, `~/.gemini/skills`, `~/.cursor/skills`, `~/.copilot/skills`
- Project-level skill dirs: `.claude/skills`, `.gemini/skills`, `.agent/skills`, `skills` (none present)
- Dedupe policy: project-level wins; for user-level duplicates, kept canonical path from `~/.copilot/skills` when available
- Exclusions: `sdd-*`, `_shared`, `skill-registry`

---

## Available Skills (Non-SDD)

| Skill                   | Path                                               | Trigger                                                                    |
| ----------------------- | -------------------------------------------------- | -------------------------------------------------------------------------- |
| `branch-pr`             | `~/.copilot/skills/branch-pr/SKILL.md`             | Creating/opening pull requests and preparing changes for review            |
| `go-testing`            | `~/.copilot/skills/go-testing/SKILL.md`            | Writing Go tests, Bubbletea/teatest patterns, test coverage                |
| `issue-creation`        | `~/.copilot/skills/issue-creation/SKILL.md`        | Creating GitHub issues (bug reports/feature requests)                      |
| `judgment-day`          | `~/.copilot/skills/judgment-day/SKILL.md`          | Dual adversarial review when asked for judgment day / dual review          |
| `skill-creator`         | `~/.copilot/skills/skill-creator/SKILL.md`         | Creating or documenting new AI skills/instructions                         |
| `engram-sync`           | `~/.claude/skills/engram-sync/SKILL.md`            | Syncing Engram memory across machines via Git                              |
| `sdd-meta-orchestrator` | `~/.copilot/skills/sdd-meta-orchestrator/SKILL.md` | Three-layer SDD execution: Copilot proxy → Orchestrator subagent → workers |

---

## Project Convention Files

- `AGENTS.md` (index, symlink)
- `.github/copilot-instructions.md` (referenced by `AGENTS.md`)

---

## Compact Rules

### Angular Frontend

- Use standalone components only (no NgModules)
- Use `inject()` in class body and signals for local UI state
- Keep HTTP calls in services and consume via observables
- Respect strict mode and strict templates

### Express Backend

- Use functional controllers with early returns after `res.status().json()`
- Keep DTOs typed with `Pick`/`Partial`; avoid `any`
- Use UUID v4 for IDs and ISO timestamps via `new Date().toISOString()`
- Keep REST style with nested and standalone routes as currently organized

### Workflow

- Do not run `npm run build` automatically after edits
- Use SDD for new features/refactors/architecture changes
- Persist SDD artifacts in Engram topic keys for cross-session continuity

### SDD Execution Model (three-layer)

- Copilot = proxy layer: interprets user command, pre-fetches Engram artifacts, builds orchestrator prompt, launches Orchestrator subagent
- Orchestrator subagent = coordination layer: reads artifacts, delegates to worker subagents (sdd-apply, sdd-verify, etc.), commits per phase, returns Result Contract
- Worker subagents = execution layer: implement tasks, run tests, write code; receive compact rules pre-injected; save discoveries via mem_save
- Workers do NOT search Engram themselves — orchestrator passes observation IDs
- Copilot post-processes result: summarizes to user, re-caches skills if skill_resolution ≠ "injected", persists decisions
