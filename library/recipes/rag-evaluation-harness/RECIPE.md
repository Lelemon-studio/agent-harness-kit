---
recipe: rag-evaluation-harness
one-liner: A test harness that measures whether your RAG actually retrieves the right context and answers without hallucinating — separately, with thresholds that gate deploys and monitoring that catches drift.
maturity: tested
extracted-from: Generic pattern (evaluating any retrieval-augmented system). Vendor-agnostic; no project specifics or secrets.
related: [rag-support-over-live-source]
---

# Recipe: RAG Evaluation Harness

> **One-liner:** stop shipping RAG on vibes. This builds a repeatable harness that measures **retrieval quality** and **generation quality as two separate things**, gates merges on thresholds, and monitors production for drift — grounded in a versioned golden set calibrated against humans.
>
> _A recipe is a code-free blueprint you hand to a coding agent (e.g. Claude Code).
> It describes WHAT to build and the architecture — not the source. The agent reads
> it, asks you the "Tune" questions, and builds it into your own stack._

## When to use it / when NOT

**Use it when:**
- You have a RAG system (support agent, doc Q&A, internal search, copilot) whose answers must be trusted, and you're changing it (prompt, model, chunking, embeddings, index) and can't tell if a change helped or regressed.
- You need a deploy gate that blocks "the new prompt hallucinates more" before it reaches users.
- You want to catch silent quality drift in production (stale docs, new question types).

**Don't use it when:**
- The RAG is a throwaway prototype with no users — eval overhead isn't worth it yet.
- Answers are deterministic/structured (exact strings, numbers, JSON) — use a plain parser/assertion, not an LLM judge.
- You haven't shipped any RAG yet — build it first (see [rag-support-over-live-source](../rag-support-over-live-source/RECIPE.md)), then add this.

## Outcome

A harness you can run on demand and in CI that reports, **separately**:
- **Retrieval health** — did we pull the right context at all? (hit rate, recall, context precision)
- **Generation health** — given that context, did the model answer faithfully and relevantly, without inventing? (faithfulness, answer relevance)
- **Cost/latency** — what did that quality cost per query.

It **fails a merge** when a change regresses past your thresholds, posts a readable report on the PR, and (optionally) samples live traffic to alert when production quality drifts from baseline. Every production failure becomes a new golden-set case, so the harness gets stricter over time.

## The core idea (read this first)

**Retrieval and generation are two different failures and you must measure them apart.** If the agent gives a bad answer, there are two distinct causes:
1. **Retrieval failed** — the right context never made it into the prompt. No model can answer from context it didn't get.
2. **Generation failed** — the right context *was* there, and the model ignored it, misread it, or made something up.

A single blended score hides which one broke and sends you debugging the half that's fine. So the harness always reports both layers, and you read retrieval first: if context recall is low, fix retrieval before you even look at the answer.

## Architecture

```
  GOLDEN SET (versioned, calibrated)
  ┌────────────────────────────────────────┐
  │ {query, expected_answer,               │
  │  ground_truth_chunks[], metadata}      │
  └───────────────┬────────────────────────┘
                  │ run each case through the RAG under test
                  ▼
  ┌──────────── RETRIEVAL LAYER ───────────┐   metrics:
  │ query → retriever → retrieved chunks   │ → hit_rate@k, recall@k, MRR
  │                                        │ → context precision / recall (LLM-judged)
  └───────────────┬────────────────────────┘
                  ▼
  ┌──────────── GENERATION LAYER ──────────┐   metrics (LLM-as-judge):
  │ chunks + query → model → answer        │ → faithfulness (anti-hallucination)
  │                                        │ → answer relevance
  └───────────────┬────────────────────────┘
                  ▼
        SCORES + cost/latency  ──►  GATE (CI: pass/fail) ──► report on PR
                                └─►  MONITOR (prod sample) ──► alert on drift
```

## Ingredients

> Swappable slots — the agent picks what fits your stack. Don't marry a vendor.

- **Golden set** — the versioned, immutable-per-version dataset of `{query, expected_answer, ground_truth_chunks, metadata}`. This is the spine; everything else measures against it.
- **Retrieval metrics** — **hit rate@k** (did any relevant chunk land in top-k?) and **recall@k** (did we get *all* the needed chunks?) as the binary minimum; **MRR / nDCG** only if rank position matters or you annotated graded relevance.
- **Context metrics (LLM-judged)** — **context precision** (is the retrieved context free of noise?) and **context recall** (does it contain everything needed to answer?).
- **Generation metrics (LLM-judged)** — **faithfulness/groundedness** (every claim traceable to the context = the anti-hallucination metric) and **answer relevance** (does it actually answer the question?). This trio (context relevance → groundedness → answer relevance) is the **"RAG triad."**
- **Evaluator model** — the LLM acting as judge. Must be **different** from the model that generated answers or synthetic data (self-preference bias). Swappable; ideally 2+ judges averaged.
- **Eval framework** — any of the established ones, all vendor-agnostic and open source: **RAGAS** (RAG-purpose-built metrics, good CI baseline), **Promptfoo** (fast prompt iteration / multi-model compare in dev), **TruLens** or **Arize Phoenix** (tracing + online monitoring in prod). Recommended default: RAGAS for the CI gate + Promptfoo for dev loops + one tracing tool for prod. Don't build metric math from scratch.
- **Gate** — a CI step that compares scores to thresholds and blocks merge on regression, posting a report.
- **Monitor** — a production sampler (small % of real traffic) that runs the same metrics and alerts on drift.

## Build steps

> High level. The agent turns each into real code in your stack.

1. **Build the golden set (do this first, by hand-ish).** ~50–100 cases to start, **hybrid sourced**: real user queries from logs, domain-expert ("what *should* work") cases, and a smaller slice of LLM-generated-then-human-validated. Deliberately include the hard kinds: simple one-chunk, multi-chunk synthesis, ambiguous (multiple valid answers), **unanswerable** ("not in the docs" → correct answer is "I don't know"), and near-miss traps. Each case records its `ground_truth_chunks`.
2. **Calibrate the judge against humans.** Before trusting any number: have 2–3 domain experts score ~15–20 cases by hand, run the LLM judge on the same cases, and check agreement (aim ≥80%, i.e. inter-human level). If it disagrees, fix the judge's rubric before going further. **Uncalibrated judge scores are noise dressed as data.**
3. **Wire the retrieval-layer eval.** For each golden case, run the query through the retriever and compute hit rate / recall / context precision-recall against `ground_truth_chunks`. Report at a couple of k values.
4. **Wire the generation-layer eval.** Feed retrieved context + query to the model, then judge faithfulness and answer relevance. Keep it separate from step 3 so you can attribute failures.
5. **Set thresholds and the CI gate.** Pick thresholds (sane starting points: faithfulness ≥0.70, context recall ≥0.80, hit rate@10 ≥0.85, plus latency/cost caps). The gate runs on any change to prompt / model / chunking / embeddings / index, blocks merge on regression, and posts a per-metric report to the PR — never a single blended number.
6. **Add the production monitor.** Sample a small % of live traffic, log `{query, retrieved chunks, answer, cost, latency}`, run the same metrics on the sample, and alert when a metric drops more than ~10% below its rolling baseline.
7. **Close the loop.** Every production failure (bad answer, hallucination, user thumbs-down) becomes a new golden-set case in the next version. The harness only gets stricter.

## Efficiency & token economy

> LLM-judging every metric on every case is the expensive part. Treat judge calls as a budget.

- **Tiered runs, not one giant suite.** Smoke test (a handful of cases, retrieval-only, cheap math) on every commit; full LLM-judged suite on RAG-affecting changes and nightly. Don't pay for 4 judge calls × 500 cases on a README typo.
- **Cheap metrics first, judge last.** Hit rate / recall / MRR are pure set math — free, no LLM. Run them first; only spend judge tokens on the cases and metrics that need semantic judgment.
- **Only the metrics your case needs.** Context precision matters only when you retrieve multiple chunks. Answer relevance can often use embedding similarity instead of a full judge call. Don't run all four RAGAS metrics reflexively.
- **Sample in production, don't judge 100%.** A small random sample (e.g. 1–5%) tracks drift at a fraction of the cost of judging every live answer.
- **Cache judge verdicts by input hash.** If the (case, retrieved-context, answer, judge-model) tuple is unchanged, reuse the cached score instead of re-calling the judge — same discipline as not re-embedding unchanged content in the retrieval recipe.
- **Batch judge calls** where the framework allows, and pick a judge model sized to the job — a mid-tier judge calibrated against humans often beats an expensive one used blindly.

## Anti-patterns to avoid (explicit)

> These are the documented ways RAG eval goes wrong. The harness must not do any of them.

- **One blended score.** A 75/100 can hide context-precision 0.95 + faithfulness 0.40. Always report metrics decoupled, with a threshold each.
- **Evaluating generation without isolating retrieval.** You'll debug the half that isn't broken. Read retrieval metrics first.
- **A golden set that's tiny or all happy-path.** <50 cases, no edge cases, no unanswerables → falsely high scores that miss real failures.
- **Same model generates and evaluates.** Self-preference bias inflates scores silently. Generate with one model, judge with another; human-validate synthetic cases.
- **LLM judge with no human calibration.** "Faithfulness 0.85" means nothing until you've shown the judge agrees with experts.
- **Mutating the golden set between runs.** Then you can't tell if the *model* improved or the *test* got easier. Golden set is immutable per version; add a new version, never edit in place.
- **Ignoring cost and latency.** Bumping k from 5→50 can raise hit rate and quietly make every query slow and expensive. Track latency/cost as first-class metrics.
- **Optimizing the metric instead of the user.** A metric win that users don't feel is noise. Tie offline gains to a user proxy (thumbs up/down, re-ask rate, resolution).
- **Online monitoring with no offline gate (or vice-versa).** Offline prevents regressions; online catches real-world drift. You need both.

## LLM-as-judge: known biases & mitigation

The judge model has documented biases (MT-Bench, Zheng et al. 2023). Don't pretend it's neutral:
- **Position bias** (favors first/last) → randomize/swap order across runs and average.
- **Verbosity / length bias** (favors longer answers) → normalize for length; don't reward padding.
- **Self-preference** (favors its own family's output) → judge with a different model than generated.
- **General mitigation** → explicit rubrics with anchored 1-star / top-score examples, 2+ judge models averaged for the metrics that matter, and periodic recalibration against humans (e.g. quarterly) since the domain drifts.

## Done signals (how the agent verifies)

> The harness is itself a sensor — so verify the sensor works before you trust it.

- **Judge is calibrated** → on a held-out slice, the LLM judge agrees with human labels ≥ your bar (e.g. 80%); below that, the harness is not trustworthy yet.
- **The gate actually blocks** → feed it a deliberately bad answer (hallucinated, off-topic) and confirm the gate fails the run; a gate that never fails is decoration.
- **Retrieval and generation report separately** → a run shows distinct retrieval vs generation scores, not one blended number.
- **Cost/latency are recorded** → each run emits tokens and latency, not just quality.
- **Cheap-first holds** → on an unchanged case, the judge isn't re-called (cache hit); the smoke tier runs without LLM judging.
- **The loop closes** → a past production failure exists as a golden-set case and the suite would now catch it.

## Tune

> What the agent should ask you before/while building.

- **What's the cost of a wrong answer here?** High-stakes (support, legal) → strict faithfulness threshold + bigger golden set. Low-stakes → lighter harness.
- **Do you have production logs to seed the golden set,** or are we cold-starting from domain-expert cases only?
- **Which judge model(s)** can we use, and is it different from the answering model? Budget per eval run?
- **What thresholds** make a deploy "good enough"? (Start from the defaults, calibrate to your reality.)
- **Where do retrieval vs generation usually break for you today?** Focus the first metrics there.
- **CI gate, production monitor, or both** in round one? (Recommended: gate first, monitor next.)
- **What's the human handoff / user-feedback signal** we can tie offline metrics to (thumbs, re-ask, escalation)?

## Trade-offs & gotchas

- **The harness is only as good as the golden set.** Garbage or unrepresentative cases → confident, wrong green checkmarks. Invest here, not in fancier metrics.
- **Judge drift.** A judge calibrated once decays as your domain evolves; recalibrate on a schedule, not never.
- **Thresholds are guesses until you have data.** The starting numbers here are reasonable defaults, not law — set your baseline from a first run, then ratchet.
- **More metrics ≠ better.** Each LLM-judged metric is cost + a place to over-fit. Start with faithfulness + context recall; add others only when they earn their keep.
- **Eval is not free latency in CI.** A full judged suite can take minutes; that's why it's tiered (smoke on commit, full on RAG changes/nightly).

## Prerequisites / assumptions

- A working RAG system you can call programmatically (retriever returns chunks; full pipeline returns answers) — e.g. the one from [rag-support-over-live-source](../rag-support-over-live-source/RECIPE.md).
- Access to an LLM you can use as an **independent** judge.
- Somewhere to version the golden set (the repo) and run the gate (CI).
- For the production monitor: the ability to log queries, retrieved chunks, and answers safely (mind PII — sample and redact).

## Related recipes

- **[rag-support-over-live-source](../rag-support-over-live-source/RECIPE.md)** — the companion that *builds* the RAG support agent. Build it first; evaluate it with this harness. This recipe is generic and works for any RAG, not just that one.
