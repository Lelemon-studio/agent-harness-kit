---
recipe: rag-support-over-live-source
one-liner: A support agent grounded in your product's living source of truth — docs/code are auto-ingested on every deploy, and the agent answers with both that knowledge and the user's real-time data.
maturity: tested
extracted-from: Generic pattern (a conversational support layer over a SaaS product). No project specifics or secrets here.
related: [rag-evaluation-harness]
---

# Recipe: RAG Support over a Live Source of Truth

> **One-liner:** an external agent answers customer-support questions accurately because it reads (a) your product's documentation/code as a continuously-refreshed vector index, and (b) the asking user's real data via a read-only live tool — instead of hallucinating from stale training.
>
> _A recipe is a code-free blueprint you hand to a coding agent (e.g. Claude Code).
> It describes WHAT to build and the architecture — not the source. The agent reads
> it, asks you the "Tune" questions, and builds it into your own stack._

## When to use it / when NOT

**Use it when:**
- You have a product whose truth lives in the repo (docs, domain logic, schema) and changes often.
- Support answers must be **grounded** (no making things up) and ideally **personalized** to the asking user's account state.
- You want to decouple the support/growth brain from the product so you can ship support changes without editing the product.

**Don't use it when:**
- The docs are tiny and static — a single system prompt with the FAQ pasted in is cheaper and good enough.
- You can't safely expose any internal text to an agent (then do a curated, hand-written KB instead of ingesting the repo).
- You don't need per-user live data — if generic answers suffice, skip the live read-only tool and keep just the RAG half.

## Outcome

A support/growth agent that, on any question:
1. **Retrieves** the relevant chunks from an always-fresh index of your source of truth and answers in the user's language (translating technical truth into plain terms).
2. Optionally **reads the asking user's live state** (subscription, usage, health signals) through a **read-only** tool, so the answer is personalized — never guessed.
3. **Escalates to a human** when it's not confident, instead of inventing.

The index refreshes automatically on every deploy, so the agent is never more stale than your last ship.

## Architecture

```
  SOURCE PROJECT (the product)                 AGENT PLATFORM (the brain)
  ┌─────────────────────────┐                 ┌──────────────────────────────┐
  │ allowlisted source files │  ── ingest ──► │ chunk → embed → vector store │
  │ (docs, domain logic,     │   (on deploy)  │ (tenant-scoped collection)   │
  │  schema; NO secrets)     │                │                              │
  │                          │                │ support agent:               │
  │ read-only live API/MCP   │ ◄── tool ───── │  · semantic_search(query)    │
  │ (user state, scoped)     │                │  · read_user_state(...)      │
  └─────────────────────────┘                 │  · escalate_to_human()       │
                                              └──────────────────────────────┘
```

Two decoupled halves. **Ingestion** keeps a vector index of safe-to-expose text current. **Retrieval + live read** lets the agent ground every answer in both the *general truth* (the index) and the *user-specific truth* (the live read-only tool). The product stays clean; the conversational logic lives in the agent platform.

## Ingredients

> Swappable slots — the agent picks what fits the target stack.

- **Source allowlist** — an explicit list of files/globs safe to ingest (docs, domain logic, schema). Paired with a **denylist** for anything sensitive. _This is the security spine — see below._
- **Ingestion trigger** — CI step on deploy (e.g. GitHub Action post-deploy) / webhook / scheduled job. Pushes changed files to the ingestion endpoint.
- **Chunker** — splits docs into retrieval-sized chunks (e.g. ~500–1000 tokens, slight overlap). Keep it deterministic so the same input yields the same chunks.
- **Embedding model** — any retrieval embedding model (e.g. Gemini `gemini-embedding-001`, OpenAI `text-embedding-3`, Voyage). Use the doc/query task distinction if the model supports it.
- **Vector store** — pgvector / Pinecone / Qdrant / etc. Must support **per-tenant scoping** (filter by org/collection) so clients never see each other's index.
- **Agent platform** — whatever runs your agent with tools and channels (email / WhatsApp / in-app widget).
- **Live read-only data tool** — an MCP server or API exposing the user's state, **read-only and scoped to the asking user** (subscription, usage, health signals). The write tools must not even be mounted for this agent.

## Build steps

> High level. The agent turns each into real code in the target project.

1. **Define the allowlist/denylist.** Decide exactly which files are safe to expose. Default-deny: nothing ingests unless listed.
2. **Build the ingestion pipeline** in the agent platform: `extract → chunk → embed → upsert`, idempotent per document (re-ingesting a doc replaces its chunks, never duplicates).
3. **Make ingestion incremental** (see Efficiency — this is the part most people get wrong).
4. **Scope the index per tenant**: the product gets its own collection, assigned only to its agent. Every search filters by tenant.
5. **Wire the deploy trigger**: on each deploy of the source project, push the changed allowlisted files to the ingestion endpoint.
6. **Expose user state read-only**: add/extend a read-only tool surface (MCP/API) with only the lifecycle/state reads the agent needs. Enforce per-user access on the server (an unknown id → "not found", no enumeration oracle).
7. **Build the agent**: system prompt that says "ground every answer in retrieved chunks + live data; if unsure, escalate; never promise what the docs don't say." Give it `semantic_search`, `read_user_state`, `escalate_to_human`.
8. **Pick channels** (email / WhatsApp / in-app) and connect them.
9. **Instrument**: log what the agent retrieved and which user it read, plus an analytics event per conversation. Watch for hallucination and over-promising.

## Efficiency & token economy

> Baked-in best practices. Skipping these turns a good pattern into a money pit.

- **Don't re-embed unchanged content.** Store a **content hash per chunk** (or per document). On ingest, compare hashes; only chunks whose hash changed get re-embedded. A deploy that didn't touch the docs should cost ~zero embedding calls. _This is the single biggest token saver._
- **Diff at the source, not the sink.** The deploy trigger should push only files that changed in that deploy (e.g. `git diff` against the last deployed ref), not the whole tree every time.
- **Batch embedding calls.** Embed many chunks per request instead of one-by-one; dedupe identical chunks within a batch before sending.
- **Cap retrieval.** Retrieve top-K (small, e.g. 4–8) and let the model ask for more only if needed — don't stuff the whole index into context.
- **Idempotent + safe to retry.** Re-running ingestion must converge to the same state without duplicating chunks or double-charging embeddings. Make the upsert key `(document_id, chunk_index, content_hash)`.
- **Match embedding dimension to need.** If the model supports Matryoshka/truncated dims, a smaller dimension is cheaper to store and search with little recall loss — measure before maxing it out.
- **Cache live reads within a conversation.** The read-only user-state tool can be called repeatedly; cache per conversation turn so the agent doesn't re-fetch the same subscription five times.
- **Don't ingest noise.** Tests, fixtures, mocks, lockfiles and generated output add tokens and dilute retrieval quality. Keep the allowlist tight — it's a relevance lever, not just a security one.
- **Purge on delete / de-allowlist.** When a doc is removed or drops off the allowlist, delete its chunks — don't leave orphans the agent will cite as live truth. The deploy diff includes deletions; act on them.
- **Embedding model is part of the index identity.** The content-hash gate assumes a fixed model + dimension. If you switch model or dimension, hashes won't change but the vectors are incomparable → you must re-embed everything (a deliberate, one-shot reindex). Version the index by model so a swap forces a full rebuild instead of silently corrupting recall.

## Security (the allowlist is the spine)

> The agent reads the truth and translates it — but not everything is safe to expose.

- **Default-deny ingestion.** Only allowlisted paths ingest. Typical allow: product docs, domain/business logic, schema structure (no data). Typical **deny, always**: `.env*`/secrets, crypto/key handling, integration credentials & scrapers, billing/payment ids & tokens, webhook secrets, cron secrets, DB migrations (possible PII in backfills).
- **Read-only, scoped service auth for the agent.** If the agent contacts users **proactively** (the user didn't authorize anything), don't reuse a per-user OAuth token — use a dedicated **org-scoped, read-only, audited** service credential with its own secret.
- **Read-only scope must be structural.** Don't rely on the prompt to "not write" — build the server so write tools aren't even mounted for this agent. If the tool doesn't exist, it can't be misused.
- **Per-user isolation enforced server-side**, not by the agent. Every live read is scoped to the asking user; the agent can't read across tenants even if it tries.
- **The agent never decides anything irreversible.** Billing, account state, deletes = deterministic in the product. The agent reads + converses; it does not mutate.
- **PII discipline.** The code carries no PII; the live data does → don't log it, respect your jurisdiction's data law.

## Done signals (how the agent verifies)

> Deterministic checks the agent can run to confirm each piece works — not its own opinion.

- **Ingestion ran** → the endpoint returns success and the stored chunk count for a changed doc matches the new chunking; an unchanged deploy makes ~zero embedding calls (assert the hash gate).
- **Index is fresh** → a known fact from a just-changed doc is retrievable by `semantic_search`; the old phrasing is not.
- **Orphans purged** → after removing a doc, a query that used to return it no longer does.
- **Read-only is structural** → the agent's mounted tool list contains no write tool (assert by inspection, not by trusting the prompt).
- **Isolation holds** → a query scoped to user A never returns user B's data (cross-tenant probe returns "not found").
- **Grounding holds** → on a question whose answer isn't in the index, the agent escalates instead of inventing (verify with the companion [rag-evaluation-harness](../rag-evaluation-harness/RECIPE.md)).

## Tune

> What the agent should ask you before/while building.

- **Freshness vs cost:** ingest on every deploy (near-real-time, recommended) or on a schedule? How fresh must support answers be?
- **Which source files are the truth?** Walk the allowlist together — what's safe, what's the denylist.
- **Do you need per-user live data**, or is generic doc-grounded support enough? (Drops the whole read-only-tool half if not.)
- **Embedding model & dimension?** Constrained by an existing provider, or free to choose? Cost/recall target?
- **Channels:** email, WhatsApp, in-app widget — which first?
- **Escalation:** what's the human handoff, and what confidence bar triggers it?
- **Proactive or reactive only?** Proactive outreach raises the service-auth + opt-out + reputation questions (see Security).

## Trade-offs & gotchas

- **Stale index = wrong answers with confidence.** The incremental-ingest hashing must actually run on deploy; if the trigger silently fails, the agent confidently serves old truth. Alert on ingestion failures.
- **Allowlist drift.** New sensitive files can appear over time; the denylist must be reviewed, not set-and-forget. Prefer default-deny so a new secret file isn't auto-ingested.
- **Retrieval quality ≠ index size.** Ingesting more isn't better; noise hurts recall. Curate.
- **Grounding is a prompt + product discipline, not magic.** The model will still over-promise if the system prompt lets it. Keep "answer only from retrieved truth; else escalate" hard.
- **Two products, more moving parts.** You now operate an ingestion pipeline and a live read tool across a boundary — instrument both, or failures hide.

## Prerequisites / assumptions

- The source project's truth lives in text you control (repo docs/code), and you can run a step on its deploy.
- An agent platform exists (or you'll stand one up) that supports tools, tenant-scoped knowledge, and your channels.
- A vector store with per-tenant filtering.
- You can expose a **read-only** slice of user state safely (only if you want per-user personalization).

## Related recipes

- **[rag-evaluation-harness](../rag-evaluation-harness/RECIPE.md)** — the companion that *measures* this. Build the support agent with this recipe, then evaluate retrieval and answer quality (and gate deploys) with the harness. Don't ship grounded-answer claims without it.
