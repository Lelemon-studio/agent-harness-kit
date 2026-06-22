# Loop engineering

> **The harness is the loop.** An agent doesn't answer once — it runs a loop:
> act → observe → verify → iterate → stop. Loop engineering is designing that loop
> well. In this kit's terms, it's [`HARNESS.md`](HARNESS.md)'s guides and sensors put
> in motion: guides orient each decision, sensors correct each step, and the loop adds
> what a single answer doesn't need — stop conditions, context management across
> iterations, and self-correction.

## Where the term comes from (and an honest caveat)

The focus of "what you engineer" has moved:

**Prompt engineering** (write a better instruction) → **context engineering** (structure
what the agent sees) → **loop engineering** (design the whole act-observe-verify-iterate
loop the agent runs).

Be honest: *loop engineering* is a recent, still-fuzzy label (popularized ~2026), and many
posts use it interchangeably with "harness engineering." But the idea underneath is solid
and has real consensus (Anthropic, Cognition, AlphaCodium): **the leverage is in the loop,
not the prompt.** AlphaCodium showed it bluntly — same model, a verify-and-iterate flow
instead of one call took accuracy from 19% → 44%. So: ignore the buzzword inflation, keep
the substance.

Sources: [Designing Agentic Loops (Willison)](https://simonw.substack.com/p/designing-agentic-loops) ·
[Building Effective Agents (Anthropic)](https://www.anthropic.com/engineering/building-effective-agents) ·
[Effective Context Engineering (Anthropic)](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents) ·
[Why Cognition doesn't use naive multi-agent](https://cognition.ai/blog/dont-build-multi-agents) ·
[AlphaCodium: from prompt to flow engineering](https://arxiv.org/abs/2401.08500).

## The loop

```
        ┌──────────────────────────────────────────────┐
        │  GUIDES orient the decision (CLAUDE.md,       │
        │  memory, rules, the recipe/spec)              │
        ▼                                               │
   ACT ──► OBSERVE ──► VERIFY (sensor) ──► pass? ──┐    │
   (tool)   (read       (test / lint /       │     │    │
            result)      typecheck)          │ no  │    │
        ▲                                    └─────┘ ───┘  iterate
        │                                       │
        │                                  yes  ▼
        └───────────────────────────────► STOP (done signal met)
```

What you engineer is everything around `ACT`: the sensors that make `VERIFY` deterministic,
the stop condition, what context survives each turn, and how a failed observation turns into
a *directed* fix instead of a random retry.

## The nine levers (and where this kit already pulls them)

Loop engineering is concrete. These are the levers, each with the kit mechanism that
implements it — and most of the value is in closing the gaps, not admiring the wins.

1. **Deterministic sensors in the loop.** Tests, typecheck, lint, build — checks that
   return pass/fail without an opinion. *Always prefer a deterministic sensor over asking
   the model "is this right?"* — the model hallucinates about state; the test doesn't.
   → kit: hooks in [`HARNESS.md`](HARNESS.md) (Layer 2) + per-project `build/lint/test`.
2. **Explicit stop conditions.** The agent must know "done" as something verifiable, not a
   feeling. A binary, checkable goal ("tests green", "metric ≥ X") beats "looks clean," and
   a hard iteration/budget cap prevents runaway cost. → kit: spec `DONE.md` + a recipe's
   **Done signals** ([`RECIPES.md`](RECIPES.md)).
3. **Context management across iterations.** Compact old turns, retrieve just-in-time, keep
   a written scratchpad — context rot is real and degrades long loops. → kit:
   [`MEMORY-SYSTEM.md`](MEMORY-SYSTEM.md), spec `SESSION.md`, `/compact` discipline in
   [`EFFECTIVE-USE.md`](EFFECTIVE-USE.md).
4. **Clear tool design.** Tools should return a crisp signal, not prose (tool output costs
   far more tokens than chat), and be documented so the agent uses them right. → kit:
   `AGENTS.md` as the neutral entry point; structured tool I/O.
5. **Isolation & safety.** Sandboxes, budgets, least-privilege, disposable workspaces — so a
   bad step has a small blast radius. → kit: the [orchestration broker](../library/orchestration/)
   (worktree + port + DB per agent) and rules in [`RULES-AND-OPS.md`](RULES-AND-OPS.md).
6. **Self-correction.** A failed sensor should feed the error back and drive a *directed*
   fix, with a retry cap and a "no-progress → stop" rule so the agent doesn't loop on the
   same idea. → kit: the spec loop + an adversarial reviewer subagent.
7. **Sub-agents with clean context.** Delegate an isolated subtask to a fresh-context agent;
   keep **one writer** and a coordinator. Naive peer multi-agent amplifies error — Cognition's
   finding. → kit: [`AGENT-ORCHESTRATION.md`](AGENT-ORCHESTRATION.md).
8. **Human-in-the-loop at the irreversible steps.** Confirm before push/deploy/delete; stream
   progress so a human can intervene before budget burns. → kit: `confirm-push.py`, the
   spec-approval checkpoint.
9. **External eval / feedback loops.** Measure the loop to improve it: cost/iteration,
   iterations-to-done, what each failure taught you. The loop that improves the loop. → kit:
   [`OBSERVABILITY.md`](OBSERVABILITY.md) (OTEL) + memory `feedback` entries; for RAG
   specifically, the [`rag-evaluation-harness`](../library/recipes/rag-evaluation-harness/RECIPE.md) recipe.

## Anti-patterns

- **LLM-as-validator.** "Did the test pass?" asked to the model. Run the test; read the exit
  code. The model's "yes" is not a sensor.
- **No stop condition.** "Refine until it looks good" → infinite loop and runaway cost. Set a
  binary goal and a hard cap.
- **Context stuffing.** Dumping everything in once degrades recall and inflates tokens.
  Retrieve just-in-time; compact.
- **Naive multi-agent.** A flat mesh of peer agents that write the same state amplifies error.
  One writer + a coordinator + isolated read-mostly sub-agents.
- **Implicit state.** Relying on the model "remembering" across turns/sessions. Write state to
  files; read files as the source of truth.
- **Sandboxless autonomy.** An agent with prod access and no budget cap is a five-figure bill
  and a prompt-injection blast radius waiting to happen.

## Honest: consensus vs hype

- **Strong consensus:** deterministic sensors beat LLM validation; external memory beats
  stateless; budgets/iteration caps are mandatory; just-in-time context beats stuffing; one
  writer beats naive multi-agent.
- **Weaker / situational:** how far to push sub-agent delegation; how much loop machinery a
  given task warrants. The *bitter lesson* applies — a better model with a clean loop usually
  beats a baroque loop around a weaker one. Don't over-engineer the loop; give it good
  context, real sensors, and a stop condition, then let the model work.

## How recipes feed the loop

A [recipe](RECIPES.md) is structured input to this loop: Architecture + Build steps scope the
target (less wandering), **Tune** is the human checkpoint before building, **Done signals**
are the deterministic sensors, and Efficiency/Anti-patterns are the cost discipline and
guardrails. Writing a recipe well *is* applying loop engineering to a buildable solution.
