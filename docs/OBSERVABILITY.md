# Observability

You can't improve a harness you can't see. Claude Code can emit OpenTelemetry (OTEL)
metrics - token usage, cost, session counts, tool calls - and once that data lands
somewhere you can query it, you can answer "where are my tokens going?" and "is this
agent actually helping?" instead of guessing.

This is Layer 3 of the harness (see [HARNESS.md](HARNESS.md)).

## Turn on Claude Code telemetry

Set these in your user-level `~/.claude/settings.json` (machine-level, not the
project's versioned settings). The exact knobs evolve - check the current Claude Code
docs - but the shape is:

```json
{
  "env": {
    "CLAUDE_CODE_ENABLE_TELEMETRY": "1",
    "OTEL_METRICS_EXPORTER": "otlp",
    "OTEL_EXPORTER_OTLP_PROTOCOL": "http/protobuf",
    "OTEL_EXPORTER_OTLP_ENDPOINT": "http://localhost:4318",
    "OTEL_METRIC_EXPORT_INTERVAL": "10000"
  }
}
```

That exports metrics every 10s over OTLP to a collector listening on `localhost:4318`.
You need *something* at that endpoint to receive them - an OTEL collector, a local
metrics tool, or a hosted backend.

## What you get

- **Token usage and cost** per session - the single most useful number for a
  one-person operation watching its spend.
- **Session counts and durations** - how much you're actually leaning on the agent.
- **Tool-call patterns** - which tools fire most; useful for spotting waste (e.g. a
  loop re-reading the same files) and for deciding which read-only calls to allowlist.

## A local sink: claude-meter

For a zero-infra local setup, a small collector that speaks OTLP and writes to SQLite
lets you query your own usage with SQL. `claude-meter` is one such tool (a Rust CLI
that ingests Claude Code's OTLP metrics into SQLite and answers token/cost/session
queries). Point `OTEL_EXPORTER_OTLP_ENDPOINT` at it and you have a private,
queryable record of your agent usage on your own machine.

Any OTLP-compatible backend works (hosted observability platforms, a self-run OTEL
collector + Prometheus/Grafana, etc.). The local-SQLite route is the lightest for a
solo developer.

## What to watch for

- **Cost creep** - a task that quietly 10x's its token use usually means context
  bloat or a retry loop. The metric catches it before the bill does.
- **Multi-agent spend** - orchestration costs a large token multiple (see
  [AGENT-ORCHESTRATION.md](AGENT-ORCHESTRATION.md)). Telemetry tells you whether the
  multi-agent run was worth it.

## Honest scope

Metrics tell you *how much* and *what happened*, not *whether the output was good* -
that's evaluation, a separate discipline (trajectory checks, LLM-as-judge, regression
suites). Telemetry is the cheap, always-on baseline; reach for eval when you need to
measure quality, not just usage.
