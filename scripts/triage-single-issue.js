#!/usr/bin/env node
// Triage a single issue and post a comment + labels.
// Idempotent: skips if the triage marker is already present on the issue.
//
// Usage:
//   ISSUE_NUMBER=12 node scripts/triage-single-issue.js
//   node scripts/triage-single-issue.js 12
//
// Required env:
//   GITHUB_TOKEN          - PAT or GITHUB_TOKEN with issues:write
//   GITHUB_REPOSITORY     - owner/repo (e.g. Azure/deployment-stacks)
//   ISSUE_NUMBER          - issue number to triage (or pass as argv[2])

import {
  assertWritableRepo,
  getIssue,
  listComments,
  listOpenIssues,
  hasMarkerComment,
  postComment,
  addLabels,
} from '../src/github.js';
import { triageIssue } from '../src/heuristic-triage.js';
import {
  formatTriageComment,
  triageLabels,
  findExistingLabelConflicts,
} from '../src/triage-format.js';
import { docsForTopics, selectDocsLinks } from '../src/docs-pointers.js';
import { findPossibleDuplicates } from '../src/duplicate-detection.js';

function getEnv(name) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing environment variable: ${name}`);
  return v;
}

async function main() {
  const token = getEnv('GITHUB_TOKEN');
  const repo = getEnv('GITHUB_REPOSITORY').toLowerCase();
  const issueNumberArg = process.env.ISSUE_NUMBER || process.argv[2];
  if (!issueNumberArg) {
    throw new Error('Missing ISSUE_NUMBER env var or first arg.');
  }
  const issueNumber = Number(issueNumberArg);
  if (!Number.isInteger(issueNumber)) {
    throw new Error(`Invalid issue number: ${issueNumberArg}`);
  }

  // Hard refusal to write to upstream.
  assertWritableRepo(repo);

  // Idempotency check.
  if (await hasMarkerComment(token, repo, issueNumber)) {
    console.log(`Issue #${issueNumber} already triaged — skipping.`);
    return;
  }

  const issue = await getIssue(token, repo, issueNumber);
  if (issue.pull_request) {
    console.log(`#${issueNumber} is a pull request, not an issue. Skipping.`);
    return;
  }

  const comments = await listComments(token, repo, issueNumber);

  console.log(`Triaging #${issueNumber}: "${issue.title}" (${comments.length} comments)`);
  const result = triageIssue(issue, comments);

  // Look up topic-based docs links + check for possible duplicates among
  // the other open issues in the repo.
  const blob = [
    issue.title || '',
    issue.body || '',
    ...comments.map(c => c.body || ''),
  ].join('\n');
  const docsLinks = selectDocsLinks(blob, result.detected_topics);
  let possibleDuplicates = [];
  try {
    const otherIssues = await listOpenIssues(token, repo);
    possibleDuplicates = findPossibleDuplicates(issue, result.detected_topics, otherIssues);
  } catch (err) {
    console.warn(`  warning: duplicate detection skipped: ${err.message}`);
  }
  const existingLabelConflicts = findExistingLabelConflicts(issue.labels, result);

  const body = formatTriageComment(result, {
    docsLinks,
    possibleDuplicates,
    existingLabelConflicts,
  });
  const labels = triageLabels(result);

  console.log(`  category=${result.category} severity=${result.severity} next-step=${result.recommended_next_step} confidence=${result.confidence}`);
  console.log(`  rules:  ${result.rules_fired.length}`);
  console.log(`  topics: ${result.detected_topics.join(', ') || '(none)'}`);
  console.log(`  docs:   ${docsLinks.length} link${docsLinks.length === 1 ? '' : 's'}`);
  console.log(`  dupes:  ${possibleDuplicates.length ? possibleDuplicates.map(d => `#${d.number}`).join(', ') : '(none)'}`);
  if (existingLabelConflicts.length) {
    console.log(`  ⚠ label conflicts: ${existingLabelConflicts.join(', ')}`);
  }

  await postComment(token, repo, issueNumber, body);
  await addLabels(token, repo, issueNumber, labels);

  console.log(`Triage posted on #${issueNumber}.`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
