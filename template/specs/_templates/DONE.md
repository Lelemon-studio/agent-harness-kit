# Acceptance Checklist - {{FEATURE_NAME}}

> **Purpose:** Verify the feature is complete.
> All items must be checked before archiving.
>
> **Finished:** -

---

## How criteria are verified

Each criterion is either **automated** or **manual**:

- **Automated** - carries a `verify:` line with a deterministic shell command.
  Exit 0 = PASS, anything else = FAIL. `/spec-done` runs these and refuses to
  close the spec if any fail. The command IS the stop condition - the spec is
  done because a sensor says so, not because it feels done.
- **Manual** - no command exists or the check needs human judgment (UX, copy,
  a decision was sound). Tagged `(manual)`. `/spec-done` asks for explicit
  human confirmation on these.

Format:

```
- [ ] Criterion text
      verify: <shell command that exits 0 on pass>
```

```
- [ ] Criterion text (manual: how a human confirms it)
```

Prefer a command. Only fall back to `(manual)` when no deterministic check is
possible - don't write a fake command to look rigorous.

---

## Functional Criteria

- [ ] Criterion 1
      verify: <command>
- [ ] Criterion 2 (manual: how a human confirms it)

## Technical Criteria

- [ ] Build succeeds
      verify: <build command>
- [ ] No type errors
      verify: <typecheck command>
- [ ] Tests passing
      verify: <test command>

## Documentation

- [ ] SPEC.md updated (manual: decisions match what shipped)
- [ ] PHASES.md with all phases complete
- [ ] SESSION.md with notes from every session

---

## Sign-off

| Role | Name | Date | Status |
|------|------|------|--------|
| Developer | - | - | pending |
