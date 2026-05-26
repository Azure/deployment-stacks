# Agent — automated issue triage assistant

This repo runs an **automated issue triage assistant** for the ARM Deployments
team. When you open a new issue, the bot posts a single comment within ~1
minute that does three things:

1. **Categorizes** the issue (bug / feature-request / question / docs / etc.)
   and applies labels so the team can scan a board view.
2. **Suggests docs** that might help you while you wait, based on phrases and
   topics it detects in the title/body.
3. **Flags possible duplicates** if it sees other open issues that look related.

This is **not AI** — it's a small deterministic rule-based classifier. There
is no LLM, no model, no API key. It uses regex and string matching only. The
source lives in [`src/`](src/) (~30 KB of Node 20 JavaScript, zero runtime
dependencies). A human team member still reviews every issue — the bot is
there to surface signal, not to take autonomous action.

## How the bot decides what to do

| Step                  | File                                | What it does                                                |
| --------------------- | ----------------------------------- | ----------------------------------------------------------- |
| Classification        | [`src/heuristic-triage.js`](src/heuristic-triage.js) | Category, severity, topics, recommended next step, confidence, age signals |
| Doc selection         | [`src/docs-pointers.js`](src/docs-pointers.js)       | Phrase-first, topic-fallback; caps at 3 links              |
| Duplicate detection   | [`src/duplicate-detection.js`](src/duplicate-detection.js) | Jaccard title overlap + shared topic-label count           |
| Comment rendering     | [`src/triage-format.js`](src/triage-format.js)       | Two-audience: reporter-facing on top, team details collapsed |
| GitHub REST helpers   | [`src/github.js`](src/github.js)                     | Native `fetch`, pagination, idempotency marker             |
| Single-issue entry    | [`scripts/triage-single-issue.js`](scripts/triage-single-issue.js) | Used by both workflows                                     |

## Workflows

| Workflow                                                            | Trigger                                                                                   | What it does                       |
| ------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- | ---------------------------------- |
| [`agent-triage.yml`](.github/workflows/agent-triage.yml)             | `issues: opened`, `issues: reopened`, or `workflow_dispatch` with an `issue_number` input | Triages one issue                  |
| [`agent-triage-batch.yml`](.github/workflows/agent-triage-batch.yml) | Cron `17 3 * * *`, `workflow_dispatch`, or `push` to `main` touching `src/**` / the batch workflow | Finds all untriaged open issues and triages each one |

The `push`-to-main trigger means a one-time merge of this PR (or any update
to the bot's source) will automatically backfill across all open issues — no
manual `workflow_dispatch` needed.

## Idempotency

Every comment the bot posts begins with the marker `<!-- agentry:triage -->`.
Before posting, the bot checks the issue's existing comments for this marker
and skips if it's already there. So re-running the workflow on the same issue
is safe and a no-op.

## Labels used (separate namespace from FabricBot)

- `agent:triaged` — bookkeeping; presence means the bot ran
- `category:bug`, `category:feature-request`, `category:question`, `category:documentation`, `category:security`, `category:performance`, `category:enhancement`
- `severity:critical`, `severity:high`, `severity:medium`, `severity:low`, `severity:info`
- `next-step:close-as-by-design`, `next-step:close-as-duplicate`, `next-step:close-as-fixed`, `next-step:run-azure-repro`, `next-step:needs-product-decision`, `next-step:needs-docs-update`, `next-step:needs-more-info`, `next-step:escalate-security`, `next-step:keep-open-tracking`
- `topic:*` — light-grey topic markers (e.g. `topic:denySettings`, `topic:action-on-unmanage`)

These do **not** overlap with the FabricBot policy in
[`.github/policies/resourceManagement.yml`](.github/policies/resourceManagement.yml),
which uses the `Needs: *` / `Status: *` namespace.

## Age awareness

The bot adjusts its tone based on how long an issue has been open:

| Age band  | Definition  | Opener                                                                                     |
| --------- | ----------- | ------------------------------------------------------------------------------------------ |
| `recent`  | < 30 days   | "Hi, and thanks for opening this issue."                                                  |
| `aging`   | 30–179 days | (same as recent)                                                                          |
| `stale`   | 180–729 days | "Thanks for your patience on this one."                                                   |
| `very-old`| ≥ 730 days  | "Apologies for the long wait on this one. … recently picked up as an outstanding open issue" |

Stale and very-old issues also get a "**Still relevant?**" section inviting
the reporter to confirm whether the issue still reproduces.

## Rollback

This bot writes only **labels and one comment per issue**. Nothing destructive,
nothing on closed issues. To disable:

```bash
gh workflow disable "Agent — triage on issue open" --repo Azure/deployment-stacks
gh workflow disable "Agent — nightly batch triage" --repo Azure/deployment-stacks
```

To fully remove, delete [`src/`](src/), [`scripts/triage-single-issue.js`](scripts/triage-single-issue.js),
and the two workflow files.

## Local development

```bash
# Requires Node 20+. No npm install needed (zero deps).
node --check src/*.js
node --check scripts/*.js

# Triage a single issue locally (read-only by default unless you have write perms):
GITHUB_TOKEN=$(gh auth token) \
  GITHUB_REPOSITORY=Azure/deployment-stacks \
  ISSUE_NUMBER=123 \
  node scripts/triage-single-issue.js
```
