Consolidate and clean up the agent's memory: cluster by topic, detect contradictions and duplicates, propose merges / supersessions / deletions, and keep the MEMORY.md index healthy. This is the simple version of a "reflection pass" — run it occasionally, not every session.

$ARGUMENTS may pass a topic to scope the audit (example: `/memory-gc billing`). With no argument, audit all of memory.

Memory lives in Claude Code's auto-memory directory (`~/.claude/projects/<project-id>/memory/`), whose one-line-per-memory index is `MEMORY.md`. The harness injects that path at session start; use it, don't invent one. See docs/MEMORY-SYSTEM.md.

**Team memory (if the repo has it):** besides the personal dir, also audit the shared team-KB if one exists — `<repo>/knowledge/team-memory/` or the one referenced from the root `CLAUDE.md`. It has its own `MEMORY.md` and holds only `feedback`/`reference` memories (`project`/`user` stay personal). Treat it as a second set with the same hygiene rules, PLUS the personal↔team drift check below. If there's no team-KB, skip this part.

## Safety rule (non-negotiable)

Memory is the user's data. NEVER delete, merge, or overwrite a file without first showing the proposal and getting explicit approval. The flow is: audit (read-only) -> propose -> confirm -> apply. The user may approve all, some, or none.

## Steps

1. **Load (read-only)**
   - Read `MEMORY.md` (the index) and list every topic file in the memory directory.
   - If there's an argument, scope to memories whose name, description, or content touch that topic.
   - Do not modify anything in this step.

2. **Audit** — find, without touching:
   - **Duplicates / overlap:** two or more files covering the same fact. Merge candidates.
   - **Contradictions:** facts on the same topic with different values (e.g. data that changed). For each conflicting pair, identify which is more recent and which has more authority (`direct` = conversation with the user > `docs` > `inferred` from copy/web). Don't act on inferred facts without confirming.
   - **Personal↔team drift:** a memory promoted to the team-KB whose personal copy (same slug) has since been updated/corrected, leaving the team one stale (real case: a model lesson revalidated in personal while the team copy still stated the old conclusion). Flag the team one to sync to the corrected version.
   - **Broken pointers:** lines in `MEMORY.md` pointing to nonexistent files, and files with no line in the index.
   - **Index hygiene:** total size of `MEMORY.md` (must stay under the load ceiling, ~24KB), lines over ~200 chars (detail belongs in the topic file, not the index), and one line per memory.
   - **Relative dates** not converted to absolute, and memories flagged for verification that were never checked.

3. **Present the report** with numbered proposals, grouped by type:
   - `MERGE`: A + B -> C, with the reason and how the destination file ends up (with `[[wikilinks]]` to related memories).
   - `SUPERSEDE`: A is obsoleted by B. Prefer marking A as superseded (add a note `Superseded by [[B]] on <date> — <why>` + provenance) over deleting, unless A is clearly false.
   - `DELETE`: only what's clearly false or dead.
   - `FIX INDEX`: broken pointers, long lines, missing entries.
   - If there's nothing to do, say so and stop.

4. **Ask for confirmation.** Wait for the OK. Apply nothing destructive before that.

5. **Apply what's approved**, respecting the harness conventions:
   - One fact = one file, with frontmatter (`name`, `description`, `metadata.type` in user | feedback | project | reference).
   - `feedback` and `project` carry `**Why:**` and `**How to apply:**` lines.
   - Link related memories with `[[name]]`.
   - Relative dates -> absolute.
   - When merging: write the destination file, delete the sources, update the lines in `MEMORY.md` (one line per memory).
   - **Team-KB changes go through a PR, not a direct push to the default branch** (it's the team's curation gate): write the file(s) + their `MEMORY.md`, commit on a branch, open a PR. Personal memory applies directly (it's the operator's local state).

6. **Verify on close:**
   - `MEMORY.md` has no broken pointers and is under the load ceiling.
   - Every topic file has its line in the index and vice versa.
   - Report in one line what was done (how many merges, supersessions, deletions, index fixes).

## Notes

- This is NOT a retrieval system: memory is recalled because `MEMORY.md` is injected at session start. Don't add ranking, embeddings, or scripts — the value is in consolidating and resolving conflicts, not in machinery.
- Run periodically or when memory feels messy, not every session.
- When unsure whether to merge or keep separate, keep separate: two clear memories beat one muddled merge.
