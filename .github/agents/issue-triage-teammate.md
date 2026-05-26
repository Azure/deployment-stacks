# Issue triage teammate (heuristic, no-AI)

A deterministic, rule-based triage assistant for the Azure Deployment Stacks repo.

## Purpose

This agent **does not attempt to fix issues**. It surfaces signal to help a human reviewer prioritize and route. Every classification is traceable to a specific rule.

## Inputs

- Issue title + body
- All issue comments (read once at triage time)

## Outputs

A single comment on the issue (idempotent — skipped if `<!-- agentry:triage -->` is already present), plus labels. **No PRs. No external API calls.**

### Comment structure

1. **Recommended next step** — one enum value, prominently displayed.
2. **Category** + severity + confidence.
3. **Summary** — one-line problem statement.
4. **Suggested action for reviewer** — concrete next step in plain English.
5. **Detected topics** — bulleted list (denySettings, action-on-unmanage, etc.).
6. **Rules fired** — collapsible details block showing exactly which classifier rules matched.
7. **Heuristic disclaimer footer** — "deterministic classifier, not AI."

### Labels

- `agent:triaged` (always — used for idempotency).
- `category:<bug|feature-request|question|documentation|security|performance|enhancement>`
- `severity:<critical|high|medium|low|info>`
- `next-step:<close-as-by-design|close-as-duplicate|close-as-fixed|run-azure-repro|needs-product-decision|needs-docs-update|needs-more-info|escalate-security|keep-open-tracking>`
- One `topic:<slug>` label per detected topic.

## Classification rules (first match wins)

### Category

1. **security** — keywords: vulnerability, CVE, credential leak, secret exposure.
2. **documentation** — title/body explicitly asks about docs being wrong/missing/unclear.
3. **feature-request** — body uses `**Is your feature request related to a problem?**` (or H1 variant) or `**Describe the solution you'd like**`, or title starts with `feature:`.
4. **bug** — body uses `**Describe the bug**`, `**Repro Environment**`, or contains a Python traceback.
5. **performance** — keywords: slow, timeout, takes too long, performance issue, reduce the time.
6. **question** — title ends with `?`.
7. **enhancement** — improvement language ("would be great", "could improve", "please add").
8. **question** — default fallback.

### Severity

- **critical** — data loss / production outage / destroyed.
- **high** — blocked / cannot deploy / regression / broken in prod.
- **medium** — bugs / performance issues (default).
- **medium** — bug with stated workaround.
- **info** — questions, feature requests (default).

### Topics (multiple may apply)

`denySettings`, `action-on-unmanage`, `delete-failure`, `role-assignment`, `managed-identity`, `bicep-language`, `az-cli`, `powershell-az`, `private-dns-zone`, `by-design`, `known-limitation`, `pipeline`, `error-message-quality`, `portal`.

### Recommended next step

Priority order:

1. `escalate-security` — if category is `security`.
2. `close-as-fixed` — reporter resolution signals ("that fixes the error", "fix was", "you can close").
3. `close-as-by-design` — `by-design` or `known-limitation` topic detected.
4. `needs-docs-update` — category is `documentation`.
5. `keep-open-tracking` — category is `feature-request` or `enhancement`.
6. For `question`:
   - `needs-product-decision` — if a team member (MEMBER/OWNER/COLLABORATOR) has replied.
   - `needs-more-info` — otherwise.
7. For `bug`:
   - `needs-more-info` — if missing both correlation ID and version.
   - `run-azure-repro` — otherwise.
8. `keep-open-tracking` — final fallback.

## Confidence

- **high** — classifier used an issue-template heading AND detected ≥2 topics.
- **medium** — used a template heading OR detected ≥1 topic.
- **low** — neither.

## Non-goals

- **No code fixes.** This agent will never open a PR.
- **No external API calls** beyond GitHub. No Azure OpenAI, no Azure ARM operations, no third-party services.
- **No autonomous closure.** Closing an issue is a human decision; the agent only recommends.
- **No comment cleanup.** The agent posts at most one comment per issue (idempotent via the `<!-- agentry:triage -->` marker).
