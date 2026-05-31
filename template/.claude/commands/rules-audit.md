Audit whether this project has a usable set of agent rules, and propose a starter set seeded from the actual code where it's thin.

$ARGUMENTS may scope the audit to a path or sub-project (example: `/rules-audit apps/api`). With no argument, audit the repo root.

The goal: a project's rules (CLAUDE.md, anti-patterns, hooks) are what reviews and the agent's behavior get checked against. If they're missing, thin, or stale, the harness has nothing to bite on. This command finds the gap and proposes concrete, code-grounded fixes - it does NOT silently write rules; it suggests and waits for the OK.

## Steps

1. **Inventory what exists**
   - Look for: root `CLAUDE.md` and any per-subrepo `CLAUDE.md`; an anti-patterns
     list; `.claude/rules/`; wired hooks in `.claude/settings.json`; commit/convention
     docs. Note which are present, absent, or empty stubs.

2. **Judge quality, not just presence** (see docs/WRITING-CLAUDE-MD.md)
   - Does each rule state a decision + a reason ("X because Y"), or is it vague prose?
   - Does it match the code, or contradict it (worse than no rule)?
   - Is it bloated with things the agent can already infer? Flag lines that don't
     change behavior.
   - Are deterministic, checkable rules (no secrets, confirm before push, formatting)
     encoded as hooks rather than hope-prose?

3. **Infer the missing rules from the code**
   - Read enough of the codebase to find conventions that ARE followed but NOT written
     down: the stack and commands (dev/build/test/lint), the architecture decisions
     that constrain new code, the recurring patterns, and the mistakes the code guards
     against. These are the candidate rules.

4. **Report a gap analysis**
   ```
   Rules audit - <scope>

   Present:   CLAUDE.md (root, 40 lines, healthy), confirm-push hook
   Thin:      no per-subrepo CLAUDE.md for apps/api (has its own stack)
   Missing:   no anti-patterns list; no test/lint commands documented
   Stale:     CLAUDE.md says "Express" but code uses Fastify

   Suggested additions (grounded in the code):
   - apps/api/CLAUDE.md: stack (Fastify + Drizzle), commands, the tenant-filter rule
   - anti-patterns: console.log -> structured logger; missing orgId filter; hard deletes
   - hook candidate: deny secrets in committed files (deterministic)
   ```

5. **Offer to draft, don't impose**
   - Propose the concrete files/lines. On the user's OK, draft them from the
     `template/examples/` shapes (CLAUDE.md, anti-patterns) filled with the project's
     real stack and conventions. For deterministic rules, suggest a hook, not prose.
   - Keep every proposal lean and true - a rule that never fires is noise.

## Notes

- This is the Hashimoto loop run proactively: instead of waiting for the agent to
  repeat a mistake, surface the rules the code already implies.
- Don't grade the code against rules you invented in this audit - propose the rules,
  let the user adopt them, then reviews can enforce them.
- Pairs with the `code-reviewer` agent, which checks diffs against whatever rules exist.
