# Effective use: how to run a session well

The day-to-day operating posture that makes an agent fast *and* reliable. This is the
practitioner layer: how to keep a session sharp, which model to reach for, how to work
in parallel, and how to review against your own rules. It complements
[WAYS-OF-WORKING.md](WAYS-OF-WORKING.md) (the cycle) and
[AGENT-ORCHESTRATION.md](AGENT-ORCHESTRATION.md) (the multi-agent deep dive); this doc
is about the **single main session** you spend most of your time in.

The mechanics named below (`/clear`, `/compact`, `--worktree`, subagents) are Claude
Code's. The principles are tool-agnostic - any agent degrades as its context fills and
benefits from delegation; map the commands to your tool.

## 1. The lean orchestrator (the default posture)

Treat your main session as an **orchestrator**, not a workhorse. Its context should
hold the goal, the plan, and the decisions - not the raw noise of getting there. The
single biggest lever on output quality is keeping that context lean.

So the default move for any noisy subtask - reading 20 files, a broad search, sifting
logs, a research question - is **delegate it to a subagent**. The subagent burns its
own context on the mess and returns only the conclusion; your main window never sees
the 20 files. You stay focused; quality stays high.

- Aim to keep the main session's working context modest and decision-focused.
- Delegate *out* anything that produces a lot of intermediate tokens and a small
  answer. Keep *in* the goal, the plan, and the few facts you're deciding on.
- This isn't about speed first - it's about not polluting the context that's making
  the decisions. (Details in [AGENT-ORCHESTRATION.md](AGENT-ORCHESTRATION.md).)

## 2. Context economy and session hygiene

**Context rot is real.** Model output quality degrades as the context window fills -
measurably, and well before the hard limit (independent testing across frontier models
shows decline even at moderate fill). A long, junk-filled conversation produces worse
code than a short, clean one. Manage the window like a budget.

Concrete habits (Claude Code commands shown; adapt to your tool):

- **`/clear` between unrelated tasks.** Don't carry the last task's mess into the next.
  A fresh, well-scoped prompt beats a polluted continuation.
- **Compact while you still have headroom, not at the limit.** `/compact <instruction>`
  while the model still recalls the full thread produces a better summary than an
  emergency compaction at 95% full. Watch usage (`/cost`); intervene early (~60% is a
  reasonable trigger, not dogma).
- **Two failed loops -> reset.** If you've corrected the same issue twice and it's not
  landing, `/clear` and restart with a sharper prompt that bakes in what you learned.
  Thrashing in a full context rarely recovers.
- **One workstream per session.** Name sessions like branches (`/rename`), resume them
  (`/resume`) instead of mixing concerns into one ever-growing thread.
- **Write durable state to files, not the chat.** Specs, decision logs, and memory
  hold the state that must survive; the conversation is scratch space. See
  [SPEC-SYSTEM.md](SPEC-SYSTEM.md) and [MEMORY-SYSTEM.md](MEMORY-SYSTEM.md). This is the
  "Write" leg of context engineering - the cheapest way to keep a context lean is to
  not put durable state in it.

## 3. Model selection per task

Match the model to the task. A fast/cheap model on exploration frees budget (and a top
model's planning overhead is wasted on a file read); a top model on a hard refactor
pays for itself. The tiers, not the version numbers (which change):

| Task | Tier | Why |
|---|---|---|
| File navigation, reading, summarizing, classifying, batch grunt-work, broad search | **Haiku** (fast/cheap) | Speed and cost dominate; little reasoning needed. Ideal for delegated scouts. |
| General implementation, most features, docs, routine code review | **Sonnet** (balanced) | The everyday default - starts working sooner, iterates fast. |
| Cross-file refactors, hard debugging, architecture decisions, reliability-critical work | **Opus** (top reasoning) | Plans more thoroughly before acting, weighs multi-step approaches and edge cases. |

Heuristics:
- **Default to the balanced tier**; escalate to the top tier when reasoning gets hard,
  drop to the fast tier for delegated search/read work.
- **Give subagents their own model.** A reviewer subagent can run the top tier while
  your main session runs balanced - deep review without slowing the main loop. Scouts
  run the fast tier. (Claude Code: the `model:` field in an agent file, or per-call.)
- The top tier "plans more thoroughly before acting"; the faster tiers "are more direct
  - they start sooner and iterate." Pick by whether the task rewards upfront planning.

## 4. Worktrees and parallel work

When you have **independent** pieces of work, run them in parallel on separate git
worktrees so their file edits never collide.

- **Isolate per branch.** Claude Code: `claude --worktree <name> -p "<task>"` spawns a
  session on a fresh checkout/branch. Each agent owns its files; no cross-talk.
- **A sane parallel count is 2-5 locally** (more with terminal automation). Past a
  handful, *you* become the bottleneck reviewing them.
- **Writer / reviewer split.** One session implements; a second, fresh-context session
  reviews it - unbiased by the implementation's reasoning. Cheap, high-value.
- **Tradeoffs to accept:** worktrees cost disk (a checkout each), and merges are on you
  - there's no built-in conflict resolution. Hand off via PRs, not mid-session. Keep
  **writes single-threaded per surface**: parallel is for *independent* work, never two
  agents editing the same files (see the parallel-writers anti-pattern in
  [AGENT-ORCHESTRATION.md](AGENT-ORCHESTRATION.md)).

## 5. Review against your own rules

A review is only as good as what it checks against. The high-leverage practice: review
each change against **the project's own stated rules** - the `CLAUDE.md`, the
anti-patterns list, the conventions - not just generic "is this good code." A violation
of a rule the team already wrote down is a real finding; a style nit a linter handles is
noise.

- The kit's [`code-reviewer`](../template/.claude/agents/code-reviewer.md) agent loads
  the project's rules and checks the diff against them, in its own context.
- **Meta-practice: check that the rules exist.** A project with no written rules can't
  be reviewed against them - and the absence is itself the finding. Run
  [`/rules-audit`](../template/.claude/commands/rules-audit.md) to assess whether the
  repo has a usable rule set (CLAUDE.md, anti-patterns, hooks) and propose a starter set
  seeded from the actual code if it's thin. Then reviews have something to bite on.
- Keep the rules themselves lean and true (see [WRITING-CLAUDE-MD.md](WRITING-CLAUDE-MD.md)):
  a bloated CLAUDE.md gets half-ignored. Prune it like code.

## The throughline

Curate the main context, delegate the noise, pick the model that fits, parallelize only
what's independent, and review against rules you actually wrote down. None of it is
exotic - it's just refusing to let a session degrade when keeping it sharp is cheap.

---

### Sources

- Anthropic - [Claude Code best practices](https://code.claude.com/docs/en/best-practices),
  [Subagents](https://code.claude.com/docs/en/agent-sdk/subagents),
  [Code review](https://code.claude.com/docs/en/code-review),
  [Worktrees](https://code.claude.com/docs/en/worktrees).
- Context-rot testing: [Chroma research](https://research.trychroma.com/context-rot).
