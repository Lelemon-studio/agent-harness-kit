# Agent orchestration

When to use more than one agent, which patterns hold up, and - just as important -
when a single agent is the right call. This is the part of the harness that's
easiest to over-build, so the bias here is toward restraint.

> **The 80/20:** most work is best done by a single agent with good context and a
> verification pass. Reach for multiple agents when the task is high-value and
> cleanly decomposable, and keep *writes single-threaded*. Multi-agent is a tool,
> not a default.

## The one idea underneath all of it: context isolation

A subagent's real value isn't parallelism - it's a **clean, separate context
window**. The lead agent stays focused on the goal; each subagent burns its own
tokens chewing through a noisy subtask (reading 30 files, sifting search results)
and returns only the conclusion. The parent never sees the mess.

So the question to ask before spawning an agent is not "can this run in parallel?"
but **"do I want this work to happen in a context I don't have to keep?"** If the
subtask produces a lot of intermediate noise and a small conclusion, isolate it.

## Patterns that hold up

### 1. Orchestrator - worker (lead + scouts)
A lead agent decomposes the task and dispatches workers with **explicit, bounded
briefs** (objective, output format, tools allowed, what NOT to touch). Workers run
in isolated contexts; the lead synthesizes their structured results.

- Best for: research, codebase mapping, broad audits, data gathering.
- Why it works: workers reason through more total tokens in parallel windows.
  Anthropic reported large gains on research tasks this way.
- The catch: it costs many times more tokens than a single agent. Worth it only
  when the answer is valuable.

### 2. Pipeline (stages with handoffs)
Item flows through stage A -> B -> C, each stage a focused step. Run many items
through the pipeline concurrently rather than synchronizing every stage - the
slowest single item sets the pace, not the slowest stage.

- Best for: migrations, transforming a known worklist, review-then-verify flows.

### 3. Map over a worklist (fan-out)
Discover the list first (files, endpoints, findings), then process each item with
an isolated agent. Cheap and effective when items are independent.

- Best for: "do X to all N of these."

### 4. Critic / adversarial verification
A separate agent whose job is to *refute* the first agent's output, not bless it.
For findings that could be wrong, spawn 2-3 skeptics prompted to disprove; keep
the finding only if it survives. Give the critic real teeth (independent prompt,
different angle) or it just rubber-stamps.

- Best for: bug hunts, security review, any "is this actually true?" check.
- This is where multi-agent earns its keep most reliably: extra agents add
  *judgment*, not parallel writes.

## Anti-patterns (what fails in production)

- **Parallel writers.** Two agents editing the same surface from incomplete views
  make incompatible choices (the classic: two halves of a UI that don't match).
  Let one agent own the writes; others only read, analyze, and propose.
- **Swarms / free-for-all peer coordination.** Looks clever, fragments fast.
  Conflicting decisions and runaway token use.
- **Multi-agent as a default.** If the task isn't clearly decomposable, more agents
  add coordination cost and failure modes without adding intelligence. A single
  agent with better context usually wins.
- **Solving a context problem with agents.** If the real issue is a bloated or
  stale context, fix the context (see below) before adding agents.

## The honest tradeoff

The field spent 2025-2026 arguing about this. Anthropic showed orchestrator-worker
winning big on research; Cognition argued "don't build multi-agents" because of
state fragmentation - then shipped isolated subagents themselves once they enforced
single-threaded writes. The synthesis both arrived at:

> Multi-agent helps when **roles are tightly scoped, contexts are isolated, and
> only one agent writes.** It hurts when agents act in parallel on shared state.
> And it always costs a large token multiple - only spend it on high-value work.

Start single-agent. Add a critic when correctness matters. Add workers only when
you've got a clean decomposition and the task is worth the tokens.

## Practical notes for Claude Code

- Use subagents (the Task/Agent tool) to isolate context, not just to go faster.
- Give cheap/fast models the exploration and search; reserve the strong model for
  synthesis and judgment.
- Hand each subagent a tight brief and ask for **structured output** (a schema), so
  the lead gets data back, not prose to re-parse.
- Pair orchestration with the other layers in this kit: a `SPEC.md` keeps every
  agent pointed at the same contract, and the [hooks](HARNESS.md) still gate the one
  agent that writes.

## Related: context engineering

Orchestration is one answer to a bigger discipline - **context engineering**:
deciding what enters the context window and when. The accepted moves in 2026:

- **Write** durable state to files (specs, decision logs, memory) instead of
  carrying it in the conversation.
- **Select** just-in-time: pull in only what this turn needs.
- **Compress** long histories into summaries before the window fills (not at the
  limit - quality degrades as it fills).
- **Isolate** subtasks into subagents (this doc).

The spec system and the memory system in this kit are the "Write" leg; subagents
are the "Isolate" leg. Together they're how you keep an agent reliable over long,
multi-session work.
