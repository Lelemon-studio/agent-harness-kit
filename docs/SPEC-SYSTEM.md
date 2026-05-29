# The spec system

A lightweight, file-based planning protocol for building features with a coding
agent across multiple sessions. It's this kit's take on **spec-driven development**
(SDD): write the plan as durable files, let the agent work against the plan, and
keep the plan - not the chat history - as the source of truth.

This is the same idea behind GitHub's spec-kit, Kiro, and "plan mode" workflows
that took off in 2025-2026. The difference here is that it's deliberately tiny:
four markdown files and four slash commands, no tooling to install.

## Why it exists

Agents drift. In a long session the model loses the thread, "vibe-codes" past the
original intent, and cuts corners as the context window fills. The fix isn't a
better prompt - it's moving the plan out of the conversation and into files the
agent re-reads each session. When you come back tomorrow (or a fresh agent does),
it reads four files and knows exactly where things stand.

Use it for **multi-session or non-trivial features**. Skip it for one-off edits and
quick exploration - the ceremony isn't worth it there.

## The four files

Each spec is a folder under `specs/YYYYMMDD-HHMM-<name>/` with:

| File | Role | Read it when |
|------|------|--------------|
| `SPEC.md` | The contract: problem, proposal, goals, non-goals, alternatives, risks. The "what and why." | Starting, or when scope is unclear |
| `PHASES.md` | The plan: phases broken into tasks, each with a success criterion and a verification command. The "how, in order." | Picking the next task |
| `SESSION.md` | The working memory: current state, key files, decisions made, blockers, notes from past sessions. The "where was I." | At the start of every session |
| `DONE.md` | The acceptance checklist: functional + technical criteria that must all pass before closing. The "are we actually done." | Before calling it finished |

The split matters: `SPEC.md` is stable (the intent), `PHASES.md` is the roadmap,
`SESSION.md` is the only file that churns every session, and `DONE.md` is the gate.
Keeping working state in `SESSION.md` means the other three stay clean.

## The workflow

```
/spec add-rate-limiting          # scaffold the four files (dated folder)
   -> fill in SPEC.md (problem, proposal, goals/non-goals)
   -> define phases + tasks in PHASES.md

/spec-continue add-rate-limiting # resume: loads SESSION + PHASES + SPEC,
                                 # finds the next unchecked task, shows timing
   -> work the task, check it off, update SESSION.md notes

# ... days later, new session ...
/spec-status add-rate-limiting   # where things stand (phases, checklist, elapsed)
/spec-continue add-rate-limiting # pick up exactly where you left off

/spec-done add-rate-limiting     # verify DONE.md checklist, stamp finish time,
                                 # compute duration, mark SPEC status DONE
```

The commands are plain markdown in `.claude/commands/` - read them, they're short.
`/spec` carries the file templates inline, so it works even without the
`specs/_templates/` folder.

## How to use it well

- **Write `SPEC.md` before any code.** The 20-30% you spend up front is repaid the
  first time you resume without re-deriving context. If you can't write the
  non-goals, you don't understand the scope yet.
- **Make every phase verifiable.** Each phase has a success criterion and a
  `bash` command that proves it. "Done" means the command passes, not "looks right."
- **Treat `SESSION.md` as the handoff note to your future self.** End each session
  by recording what you finished and the next step. This is what makes it
  multi-session.
- **Don't over-specify.** Over-constraining leaves no room for the agent to do its
  job; under-specifying reintroduces vibe-coding. Specify the contract and the
  boundaries, not every line.
- **Specs don't move when done.** `/spec-done` flips the status and stamps the
  finish time; the folder stays in `specs/` as a durable record of what was built
  and why.

## See it in action

`template/specs/EXAMPLE-add-rate-limiting/` is a filled-in worked example (a
generic API rate-limiting feature) showing what the four files look like mid-flight.

## Tradeoffs (be honest)

- **Spec debt** is real: a spec that drifts from the code is worse than none. Keep
  `SESSION.md` current; let `SPEC.md` reflect final decisions at close.
- **Setup friction**: not worth it for throwaway work. Reach for it when a feature
  spans sessions, will be handed off, or is complex enough that boundaries matter.
