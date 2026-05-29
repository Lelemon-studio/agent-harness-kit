# Memory - index

> One line per memory. The detail lives in each topic file. This index is the
> only memory file loaded into context every session, so keep it lean.
>
> Rules:
> - Keep this file UNDER ~24KB or it gets loaded partially. One line per memory
>   (<200 chars). The detail goes in the topic file, never here.
> - One fact = one file, with frontmatter (`name`, `description`, `metadata.type`).
> - Before creating, check if a file already covers it (update, don't duplicate).
>   Delete memories that turn out to be wrong. Run `/memory-gc` periodically.
>
> Types: `user` (who the user is), `feedback` (how you should work - corrections
> and confirmed approaches, with the why), `project` (ongoing work/goals/constraints
> not derivable from code or git), `reference` (pointers to external resources).

## Example section

- [Example fact](EXAMPLE-memory.md) - short hook so the model can judge relevance.
