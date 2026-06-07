// QA workflow (template) — orchestrates specialist agents in parallel, each in an
// isolated workspace (provisioned by the broker workspace.mjs), running the full
// cycle build + TDD + e2e + review + security, with adversarial verification before
// accepting each change. You approve the plan; the rest runs on its own.
//
// The broker is NOT called from this script (the Workflow sandbox has no shell):
// AGENTS run it via Bash in the Provision/Teardown phases.
//
// Launch (requires explicit multi-agent opt-in):
//   Workflow({ scriptPath: "<path>/qa-workflow.mjs",
//              args: { repo: "<broker profile>", specPath: "<spec or task source>",
//                      skipE2e: false,
//                      tasks: [ { id: "module-a", prompt: "Implement X" }, ... ] } })
//
// One worker per task. Task index = broker --index (disjoint port/DB/worktree per worker).

export const meta = {
  name: 'qa-workflow',
  description: 'Build + TDD + e2e + review + security per isolated worker, with adversarial verification',
  phases: [
    { title: 'Provision' },
    { title: 'Build+QA' },
    { title: 'Verify' },
    { title: 'Teardown' },
  ],
}

// args may arrive as an object or a JSON string: normalize.
let input = args
if (typeof input === 'string') { try { input = JSON.parse(input) } catch { input = {} } }
input = input || {}
const repo = input.repo
const spec = input.specPath ?? '(no spec)'
const tasks = Array.isArray(input.tasks) ? input.tasks : []
const globalSkipE2e = input.skipE2e === true
// Path to the broker, relative to the workspace root where agents run. Override via
// args.brokerPath if you install it elsewhere.
const brokerPath = input.brokerPath ?? 'orchestration/workspace.mjs'

if (!repo) { log('Missing args.repo (broker profile). Nothing to do.'); return { error: 'no repo' } }
if (!tasks.length) { log('No tasks in args.tasks. Pass { repo, specPath, tasks: [...] }.'); return { error: 'no tasks' } }

const BROKER = `node ${brokerPath} --repo ${repo}`

const PROVISION_SCHEMA = {
  type: 'object',
  required: ['index', 'ok', 'worktreePath', 'webPort', 'databaseUrl'],
  properties: {
    index: { type: 'number' },
    ok: { type: 'boolean' },
    worktreePath: { type: 'string' },
    webPort: { type: 'number' },
    databaseUrl: { type: 'string' },
    notes: { type: 'string' },
  },
}

const BUILD_SCHEMA = {
  type: 'object',
  required: ['taskId', 'summary', 'tscPass', 'testsPass', 'e2ePass', 'changedFiles'],
  properties: {
    taskId: { type: 'string' },
    summary: { type: 'string' },
    tscPass: { type: 'boolean' },
    testsPass: { type: 'boolean' },
    e2ePass: { type: 'boolean' },
    changedFiles: { type: 'array', items: { type: 'string' } },
    pending: { type: 'array', items: { type: 'string' } },
  },
}

const VERDICT_SCHEMA = {
  type: 'object',
  required: ['lens', 'pass', 'reason'],
  properties: {
    lens: { type: 'string' },
    pass: { type: 'boolean' },
    reason: { type: 'string' },
  },
}

// Ensure the template once before fanning out.
phase('Provision')
log(`Spec: ${spec} — ${tasks.length} worker(s) on profile "${repo}"`)
await agent(
  `Run at the workspace root: \`${BROKER} setup-template\`. If the template already exists, that's fine. ` +
  `Report only "template ready" or the exact error. Do nothing else.`,
  { label: 'setup-template', phase: 'Provision' },
)

// Provision one workspace per task (index = position). Deterministic: no clashes.
const provisioned = await parallel(tasks.map((t, i) => () =>
  agent(
    `Provision the workspace for worker ${i}, task "${t.id}". Run at the workspace root: ` +
    `\`${BROKER} alloc --index ${i}\`. Return the resources the command prints: worktreePath, ` +
    `webPort, databaseUrl. Set ok=true only if the command finished without error.`,
    { label: `alloc:${t.id}`, phase: 'Provision', schema: PROVISION_SCHEMA },
  ).then(r => ({ ...r, task: t, index: i })).catch(() => null)
))

const ready = provisioned.filter(Boolean).filter(r => r.ok)
log(`Provisioned ${ready.length}/${tasks.length} workers.`)

// Build + QA + adversarial verification, pipelined (each worker advances independently).
const results = await pipeline(
  ready,
  // Stage 1: implement in the worker's worktree (TDD red-green) + types + tests + e2e.
  (w) => {
    const doE2e = !globalSkipE2e && w.task.e2e !== false
    const e2eStep = doE2e
      ? `5. e2e: start the dev server on your port (${w.webPort}) and exercise the flow with the Playwright MCP ` +
        `(navigate to http://localhost:${w.webPort}, run the flow, screenshot). Load MCP tools via ToolSearch.\n`
      : `5. e2e SKIPPED for this task (no UI / smoke test). Report e2ePass=true.\n`
    return agent(
      `You are a development agent working ISOLATED in your worktree. HARD RULES:\n` +
      `- Work ONLY inside: ${w.worktreePath} (cd there; never touch the main repo or another worktree).\n` +
      `- Your app runs on port ${w.webPort}; your DB is ${w.databaseUrl}. Use those, not the dev ones.\n` +
      `- Follow the repo rules in .claude/rules/ and CLAUDE.md (clean code, clear errors).\n\n` +
      `TASK (${w.task.id}) from ${spec}:\n${w.task.prompt}\n\n` +
      `REQUIRED FLOW (TDD):\n` +
      `1. Write the test(s) first and leave them RED (verify they fail).\n` +
      `2. Implement until GREEN. 3. Type-check passes (0 errors). 4. Test suite green.\n` +
      e2eStep +
      `Report the real result (do not fake green). List changedFiles and anything left pending.`,
      { label: `build:${w.task.id}`, phase: 'Build+QA', schema: BUILD_SCHEMA },
    ).then(b => ({ ...b, w }))
  },
  // Stage 2: adversarial verification — distinct lenses try to REFUTE the change.
  (build) => parallel(
    ['correctness', 'clean-code-per-rules', 'domain-invariants'].map(lens => () =>
      agent(
        `Adversarially verify task "${build.taskId}" in ${build.w.worktreePath}. ` +
        `Lens: ${lens}. Try to REFUTE that it is correct and complete (default: pass=false if there's real doubt). ` +
        `Review the diff and tests; for clean-code check against .claude/rules/ and CLAUDE.md; for ` +
        `domain-invariants check the project's business rules hold. Build summary: ${build.summary}`,
        { label: `verify:${build.taskId}:${lens}`, phase: 'Verify', schema: VERDICT_SCHEMA },
      ).catch(() => null)
    )
  ).then(verdicts => {
    const vs = verdicts.filter(Boolean)
    const passed = vs.filter(v => v.pass).length
    return { ...build, verdicts: vs, confirmed: passed >= 2 } // majority of 3
  }),
)

// Always tear down (free worktree + branch + DB for each provisioned worker).
phase('Teardown')
await parallel(ready.map(w => () =>
  agent(
    `Free the workspace for worker ${w.index}. Run at the workspace root: ` +
    `\`${BROKER} free --index ${w.index}\`. Report "freed" or the error.`,
    { label: `free:${w.task.id}`, phase: 'Teardown' },
  ).catch(() => null)
))

// Synthesis.
const ok = results.filter(Boolean)
const confirmed = ok.filter(r => r.confirmed)
const review = ok.filter(r => !r.confirmed)
log(`Confirmed: ${confirmed.length}/${ok.length}. To review: ${review.length}.`)

return {
  spec,
  confirmed: confirmed.map(r => ({ task: r.taskId, summary: r.summary, files: r.changedFiles })),
  toReview: review.map(r => ({
    task: r.taskId,
    reasons: (r.verdicts || []).filter(v => !v.pass).map(v => `${v.lens}: ${v.reason}`),
    flags: { tsc: r.tscPass, tests: r.testsPass, e2e: r.e2ePass },
    pending: r.pending || [],
  })),
}
