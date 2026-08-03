# Post-mortems

Incident and defect analyses for the Embers frontend. A post-mortem is written when
a defect is instructive — when _why it escaped_ generalises beyond the fix itself.
Near-misses qualify: the demo in the first entry below was delivered successfully,
and the analysis is still the most useful artifact to come out of it.

These are blameless in the sense Beyer et al. describe in _Site Reliability
Engineering_ (O'Reilly, 2016): the subject is the system that let a defect through,
not the person who wrote it.

## Index

- **[Silent-failure defects in the agent-team editor](./AGENT_TEAM_EDITOR_GRAPH_CORRUPTION.md)**
  — 2026-07-29/30. Six defects found while building a six-agent team. One made a team
  permanently undeployable by leaving edges behind when a node was deleted; another
  hid every agent past the sixth behind a fixed-height CSS cap. All six failed without
  emitting a signal at the point of failure, which is the thread the analysis follows.

  Covers the well-formedness invariant a stored graph must satisfy, why the corrupt
  state was a fixed point of the edit cycle, why a threshold fault is invisible below
  its threshold, and nine prevention measures — all since closed.

  Its most reusable part is §10. The six defects shared one property, and that
  property was turned into a set of searches and re-run over the rest of the codebase,
  finding seven more. Read that section before writing the next post-mortem: what
  generalises from an incident is the shape of the hole, and a shape can be searched
  for.

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
- **Mathematics** uses GitHub's math delimiters. Inline is dollar, backtick,
  expression, backtick, dollar — ``$`\mathcal{W}(G)`$`` — with the **dollars on the
  outside**. Writing it the other way round produces an ordinary code span that
  displays the dollar signs literally; the first draft of the entry above did exactly
  that in 27 places, and nothing complained, because a code span is valid Markdown.
  Display math is a fenced block with the `math` info-string.

  Bare dollar delimiters are not used at all: GitHub's CommonMark pass strips the
  backslash escapes `\_ \{ \} \; \,` before MathJax parses them, which corrupts an
  expression either loudly or silently. Write a literal dollar sign as inline code,
  and never let an ASCII letter abut an opening delimiter.

## Related documentation

- [Architecture decision records](../architecture/decisions/) — the durable outcome
  of a post-mortem's prevention section usually belongs here.
- [Component patterns](../architecture/patterns/component-patterns.md) — where
  UI-level rules extracted from an incident are recorded.
