# Post-mortems

Incident and defect analyses for the Embers frontend. A post-mortem is written when
a defect is instructive — when *why it escaped* generalises beyond the fix itself.
Near-misses qualify: the demo in the first entry below was delivered successfully,
and the analysis is still the most useful artifact to come out of it.

These are blameless in the sense Beyer et al. describe in *Site Reliability
Engineering* (O'Reilly, 2016): the subject is the system that let a defect through,
not the person who wrote it.

## Index

- **[Silent-failure defects in the agent-team editor](./AGENT_TEAM_EDITOR_GRAPH_CORRUPTION.md)**
  — 2026-07-29/30. Six defects found while building a six-agent team. One made a team
  permanently undeployable by leaving edges behind when a node was deleted; another
  hid every agent past the sixth behind a fixed-height CSS cap. All six failed without
  emitting a signal at the point of failure, which is the thread the analysis follows.

  Covers the well-formedness invariant a stored graph must satisfy, why the corrupt
  state was a fixed point of the edit cycle, why a threshold fault is invisible below
  its threshold, and nine prevention measures — three of them still open.

## Writing one

Follow the shape used by the existing entries and by
`MeTTa-Compiler/docs/post-mortems/`:

1. **Summary** — a table of defects with severity, symptom, and fix commit.
2. **Terminology** — every term, symbol, and acronym defined before first use.
3. **The invariant or property that was violated** — stated precisely, with
   mathematics where mathematics is clearer than prose.
4. **Timeline** — from logs and stored state, with timestamps. Evidence, not recall.
5. **Defect analysis** — per defect: mechanism → root cause → why it was invisible →
   evidence → fix.
6. **Why it was not caught** — the systemic section. This is the point of the
   document; the rest is context for it.
7. **Prevention** — prioritised and concrete enough to act on, each item naming the
   defect it closes.
8. **What went well** — the defences that did hold, so they survive future refactors.
9. **Action items** — owner, effort, and what each closes.

Conventions:

- **Filenames** are `SCREAMING_SNAKE_CASE.md`, named for the defect class rather than
  a ticket number, so they remain findable.
- **Diagrams** live in `diagrams/` as PlantUML sources with rendered SVGs committed
  alongside, since GitHub does not render PlantUML inline. Regenerate with
  `plantuml -tsvg docs/post-mortems/diagrams/*.puml`.
- **Claims carry their source** — a commit SHA, a file and line, a log timestamp, or
  a stored version id. An assertion without one is a recollection.
- **Citations** are linked to DOIs, and the DOIs are resolved before publishing.
- **Mathematics** uses GitHub-flavored Markdown math delimiters: a backtick span
  wrapped in dollar signs for inline, a fenced block with the `math` info-string for
  display. Never `$…$` or `$$…$$` — GitHub's CommonMark pass strips backslash escapes
  before MathJax sees them.

## Related documentation

- [Architecture decision records](../architecture/decisions/) — the durable outcome
  of a post-mortem's prevention section usually belongs here.
- [Component patterns](../architecture/patterns/component-patterns.md) — where
  UI-level rules extracted from an incident are recorded.
