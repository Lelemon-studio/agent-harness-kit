Deploy <this service> safely, running the checks before the irreversible step.

<!--
An example ops command (.claude/commands/deploy.md). Encodes the deploy procedure so
it happens the same way every time. Replace the placeholder steps with your real
build/verify/deploy commands. See docs/RULES-AND-OPS.md.
-->

$ARGUMENTS may specify a target (e.g. `/deploy staging`). Default is staging, never
production unless explicitly named.

## Steps

1. **Preflight**
   - Confirm the working tree is clean and on an up-to-date branch.
   - Confirm which target is being deployed; if production, require explicit
     confirmation from the user first.

2. **Build**
   ```bash
   <build command>          # e.g. pnpm build
   ```
   - Stop if the build fails. Do not deploy a broken build.

3. **Verify**
   ```bash
   <test/lint command>      # e.g. pnpm test && pnpm lint
   ```
   - Stop on failure and report what failed.

4. **Deploy**
   ```bash
   <deploy command>         # e.g. the platform CLI deploy
   ```
   - This is the outward-facing step. A push/deploy hook will ask for confirmation;
     show the user what's about to happen and wait for the OK.

5. **Post-deploy check**
   - Hit the health endpoint / check the dashboard.
   - Report the deployed version and that it's healthy, or roll back and report.

## Notes

- Never skip the build/verify steps to "save time."
- Keep production behind an explicit confirmation, always.
