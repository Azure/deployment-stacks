// Pure-Node deterministic issue classifier for Azure Deployment Stacks.
//
// Input: issue object (title, body) and array of comments.
// Output: classification object with:
//   - category, severity, summary, suggested_action
//   - recommended_next_step (string enum)
//   - confidence ('low' | 'medium' | 'high')
//   - rules_fired (array of human-readable rule descriptions)
//   - detected_topics (array of topic slugs)
//
// Design principle: every classification is traceable to a specific rule.
// No AI calls. No external dependencies.

const TOPIC_RULES = [
  { topic: 'denySettings',          pattern: /deny[\s-]?settings|denyassignment|deny[\s-]?assignment/i },
  { topic: 'action-on-unmanage',    pattern: /action[\s-]?on[\s-]?unmanage|actiononunmanage|delete[\s-]?all|detach[\s-]?all|deleteresources/i },
  { topic: 'delete-failure',        pattern: /delete[\s-]?fail|cannot[\s-]?delete|won'?t[\s-]?delete|stuck.{0,40}delet|deletion[\s-]?failure|fail.{0,30}delet/i },
  { topic: 'role-assignment',       pattern: /role[\s-]?assignment|microsoft\.authorization\/roleassignments/i },
  { topic: 'managed-identity',      pattern: /managed[\s-]?identity|user[\s-]?assigned[\s-]?identity|userassignedidentity/i },
  { topic: 'bicep-language',        pattern: /\bbicep\b/i },
  { topic: 'az-cli',                pattern: /\baz cli\b|\baz stack\b|\baz deployment\b|--action-on-unmanage|azure[\s-]?cli/i },
  { topic: 'powershell-az',         pattern: /azure[\s-]?powershell|\baz\.resources\b|new-az\w*deploymentstack|powershell\s+cmdlet/i },
  { topic: 'private-dns-zone',      pattern: /private[\s-]?dns[\s-]?zone|privatednszones/i },
  { topic: 'by-design',             pattern: /by[\s-]?design|expected[\s-]?behavior|working[\s-]?as[\s-]?designed/i },
  { topic: 'known-limitation',      pattern: /known[\s-]?issue|known[\s-]?limitation|documented[\s-]?limitation/i },
  { topic: 'pipeline',              pattern: /azure[\s-]?devops|github[\s-]?actions|ado[\s-]?agent|self[\s-]?hosted[\s-]?agent|\bpipeline\b|docker[\s-]?container/i },
  { topic: 'error-message-quality', pattern: /error[\s-]?message|better[\s-]?error|unclear[\s-]?error|cryptic|misleading|add a errormessage/i },
  { topic: 'portal',                pattern: /azure[\s-]?portal|portal\.azure\.com/i },
];

function detectTopics(blob) {
  return TOPIC_RULES.filter(r => r.pattern.test(blob)).map(r => r.topic);
}

function detectCategory(title, body, blob, rulesFired) {
  // Drop any leading `[#NNN]` prefix so title patterns still match cleanly.
  const cleanTitle = (title || '').replace(/^\s*\[#\d+\]\s*/, '');

  // 1. Security (highest priority)
  if (/security[\s-]?(issue|vuln)|\bcve-\d{4}|credential[\s-]?leak|secret[\s-]?exposure|exposed[\s-]?secret/i.test(blob)) {
    rulesFired.push('category=security (security keyword matched)');
    return 'security';
  }

  // 2. Documentation
  if (/(\bdocs?\b|documentation).{0,30}(wrong|missing|outdated|unclear|broken)/i.test(blob)
   || /where (is|are) (the )?docs?|is this documented/i.test(blob)) {
    rulesFired.push('category=documentation (doc-related keywords)');
    return 'documentation';
  }

  // 3. Feature request — three signals:
  //    (a) feature-template heading in body
  //    (b) explicit prefix on title: "feature:", "[FR]", etc.
  //    (c) title verbs that strongly imply asking for new capability:
  //        "Introduce X API", "Add X cmdlet", "Support X", "Expose X",
  //        "Parallelize X", "Granular control for X", "Missing X", "History of X".
  //        These intent verbs override the bug-template check below so titles
  //        like "Introduce Deployment Stack Cancel API" don't get mis-routed.
  const featureHeading = /(?:^|\n)#+\s*Is your feature request related to a problem|\*\*Is your feature request related to a problem\?\*\*|(?:^|\n)#+\s*Describe the solution you'd like|\*\*Describe the solution you'?d like\*\*/i;
  const featureTitlePrefix = /^\s*(\[(feature|fr|feature[\s-]?request)\]|feature\s*request:|feature:|fr:)/i;
  const featureTitleIntent = /^\s*(introduce|add|expose|enable|allow)\s+[\w\s\-]{2,80}\b(api|cmdlet|command|flag|parameter|option|property|capability|sdk|client)\b/i;
  const featureTitleShape = /^\s*(parallelize|granular\s+control|history\s+of|missing\s+(new\s+)?features?|support\s+for)\b/i;
  if (
    featureHeading.test(body)
    || featureTitlePrefix.test(cleanTitle)
    || featureTitleIntent.test(cleanTitle)
    || featureTitleShape.test(cleanTitle)
  ) {
    if (featureHeading.test(body)) {
      rulesFired.push('category=feature-request (feature-request template heading in body)');
    } else if (featureTitlePrefix.test(cleanTitle)) {
      rulesFired.push("category=feature-request (title prefix like 'feature:' / '[FR]')");
    } else if (featureTitleIntent.test(cleanTitle)) {
      rulesFired.push('category=feature-request (title verb implies new capability: introduce/add/expose/enable/allow … api/cmdlet/command/etc.)');
    } else {
      rulesFired.push('category=feature-request (title shape: parallelize / granular control / history of / missing / support for)');
    }
    return 'feature-request';
  }

  // 4. Bug (issue template marker or traceback)
  const bugHeading = /(?:^|\n)#+\s*Describe the bug|\*\*Describe the bug\*\*|(?:^|\n)#+\s*Repro Environment|\*\*Repro Environment\*\*/i;
  if (bugHeading.test(body) || /traceback \(most recent call last\)/i.test(blob)) {
    rulesFired.push('category=bug (template heading or traceback)');
    return 'bug';
  }

  // 5. Performance
  if (/\b(too )?slow\b|\btimeout\b|takes (way )?too long|performance[\s-]?(issue|problem)|reduce the time/i.test(blob)) {
    rulesFired.push('category=performance (slow/timeout keyword)');
    return 'performance';
  }

  // 6. Question (title ends with ?)
  if (/\?$/.test(cleanTitle.trim())) {
    rulesFired.push("category=question (title ends with '?')");
    return 'question';
  }

  // 7. Enhancement (improvement language)
  if (/would be (great|nice|good)|could.{0,20}(improve|enhance|add)|missing[\s-]?feature|please[\s-]?(add|support)/i.test(blob)) {
    rulesFired.push('category=enhancement (improvement language)');
    return 'enhancement';
  }

  // Default
  rulesFired.push('category=question (default fallback)');
  return 'question';
}

function detectSeverity(blob, category, rulesFired) {
  if (/data[\s-]?loss|destroyed|deleted my prod|prod(uction)?[\s-]?(outage|down)/i.test(blob)) {
    rulesFired.push('severity=critical (data-loss/outage signal)');
    return 'critical';
  }
  if (/blocked|cannot deploy|can'?t deploy|regression|stopped working|broken in (production|prod)/i.test(blob)) {
    rulesFired.push('severity=high (blocker/regression signal)');
    return 'high';
  }
  if (category === 'bug' && /workaround|work[\s-]?around|fixed by|fix was/i.test(blob)) {
    rulesFired.push('severity=medium (bug with stated workaround)');
    return 'medium';
  }
  if (category === 'bug') {
    rulesFired.push('severity=medium (default for bug)');
    return 'medium';
  }
  if (category === 'performance') {
    rulesFired.push('severity=medium (default for performance)');
    return 'medium';
  }
  rulesFired.push(`severity=info (default for ${category})`);
  return 'info';
}

function recommendNextStep(category, topics, blob, comments, rulesFired) {
  // Security always escalates first.
  if (category === 'security') {
    rulesFired.push('next-step=escalate-security (category=security)');
    return 'escalate-security';
  }

  // Reporter signaled resolution.
  const resolutionRe = /that fixes (the |my )?(error|issue|problem)|that worked|fixed it|you can.{0,20}close|please close|close (this|it) (ticket|issue)|fix was/i;
  if (resolutionRe.test(blob)) {
    rulesFired.push('next-step=close-as-fixed (reporter signaled resolution)');
    return 'close-as-fixed';
  }

  // Known limitations / by-design — only short-circuit for bug/question.
  // A feature request that happens to *mention* "by design" (e.g., "this is
  // currently by design, but we'd like X") should still be tracked as a
  // feature request, not auto-closed.
  if ((category === 'bug' || category === 'question') &&
      (topics.includes('by-design') || topics.includes('known-limitation'))) {
    rulesFired.push(`next-step=close-as-by-design (by-design/known-limitation topic on ${category})`);
    return 'close-as-by-design';
  }

  if (category === 'documentation') {
    rulesFired.push('next-step=needs-docs-update (category=documentation)');
    return 'needs-docs-update';
  }

  if (category === 'feature-request' || category === 'enhancement') {
    rulesFired.push(`next-step=keep-open-tracking (category=${category})`);
    return 'keep-open-tracking';
  }

  if (category === 'question') {
    const teamReplied = comments.some(c =>
      ['MEMBER', 'OWNER', 'COLLABORATOR'].includes(c.author_association || '')
    );
    if (teamReplied) {
      rulesFired.push('next-step=needs-product-decision (question, team already engaged)');
      return 'needs-product-decision';
    }
    rulesFired.push('next-step=needs-more-info (unanswered question)');
    return 'needs-more-info';
  }

  if (category === 'bug') {
    const hasCorrelationId = /correlation[\s-]?id\s*[":=]+\s*\"?\S{8,}/i.test(blob);
    const hasVersion = /az\s+version|az\s+v\d|az[\s-]?cli\s+v\d|powershell\s+(version|v\d)|host\s+os\s*:?\s*\S+|version[:\s]+\d/i.test(blob);
    if (!hasCorrelationId && !hasVersion) {
      rulesFired.push('next-step=needs-more-info (bug missing correlation ID and version)');
      return 'needs-more-info';
    }
    rulesFired.push('next-step=run-azure-repro (bug has enough info for repro)');
    return 'run-azure-repro';
  }

  if (category === 'performance') {
    rulesFired.push('next-step=keep-open-tracking (performance issue)');
    return 'keep-open-tracking';
  }

  rulesFired.push('next-step=keep-open-tracking (default fallback)');
  return 'keep-open-tracking';
}

function buildSummary(issue, category, topics) {
  const titlePart = (issue.title || '').replace(/^\[#\d+\]\s*/, '').slice(0, 140);
  const topicHint = topics.length ? ` Topics: ${topics.slice(0, 3).join(', ')}.` : '';
  return `${category} — ${titlePart}.${topicHint}`;
}

function buildSuggestedAction(category, nextStep, topics) {
  switch (nextStep) {
    case 'close-as-by-design':
      return 'Verify against current documented behavior, link the docs/known-issues page in a friendly close-out comment, and close.';
    case 'close-as-fixed':
      return 'Reporter signaled resolution. Thank them, optionally note the underlying fix in a follow-up comment, and close.';
    case 'close-as-duplicate':
      return 'Link the duplicate, copy any unique context to the canonical issue, and close.';
    case 'needs-docs-update':
      return 'Confirm the doc gap, file an internal docs work item (or open a learn.microsoft.com PR), and update the issue with a link.';
    case 'needs-more-info':
      return 'Ask the reporter for missing info: correlation ID, az / Az PowerShell version, exact command, and timestamp + timezone.';
    case 'needs-product-decision':
      return `Pull into next product sync. Classifier detected ${topics.length ? `topics ${topics.join(', ')}` : 'no specific topics'} — confirm scope before responding.`;
    case 'run-azure-repro':
      return 'Bug has enough info (correlation ID or version present). Spin up a repro env, validate, and post findings.';
    case 'escalate-security':
      return 'Treat as security-sensitive. Do NOT discuss specifics in public comments. Escalate via internal channel before any public reply.';
    case 'keep-open-tracking':
      return category === 'feature-request' || category === 'enhancement'
        ? 'Add to the feature backlog for product review.'
        : 'Keep open and check back as the thread evolves.';
    default:
      return 'Review and assign manually.';
  }
}

// Short, reporter-facing phrasing of the recommended next step.
// This is what shows in the public "What I noticed" section. No internal jargon.
function publicNextStepBlurb(nextStep, category) {
  switch (nextStep) {
    case 'close-as-by-design':
      return 'A team member will confirm whether this is documented behavior and follow up.';
    case 'close-as-fixed':
      return 'It looks like this may already be resolved — a team member will confirm and close.';
    case 'close-as-duplicate':
      return 'This may be a duplicate of an existing issue — a team member will link the two.';
    case 'needs-docs-update':
      return 'This looks like a docs gap — we\u2019ll review and follow up with a docs link or update.';
    case 'needs-more-info':
      return 'We may need a bit more info to reproduce — a team member will ask if anything is unclear.';
    case 'needs-product-decision':
      return 'This is a product-direction question — we\u2019ll bring it to the team and respond.';
    case 'run-azure-repro':
      return 'A team member will attempt to reproduce in Azure and respond with findings.';
    case 'escalate-security':
      return 'Routing to the security review channel — please don\u2019t share repro details publicly until we follow up.';
    case 'keep-open-tracking':
      return category === 'feature-request' || category === 'enhancement'
        ? 'Tracking on the feature backlog. We\u2019ll consider it during planning.'
        : 'Keeping this open while we follow up.';
    default:
      return 'A team member will review and respond.';
  }
}

function classifyConfidence(topics, rulesFired) {
  const usedTemplateHeading = rulesFired.some(r => /template heading/.test(r));
  if (usedTemplateHeading && topics.length >= 2) return 'high';
  if (usedTemplateHeading || topics.length >= 1) return 'medium';
  return 'low';
}

export function triageIssue(issue, comments = []) {
  const title = issue.title || '';
  const body = issue.body || '';
  const commentsBlob = comments.map(c => c.body || '').join('\n');
  const blob = `${title}\n${body}\n${commentsBlob}`;
  const rulesFired = [];

  const topics = detectTopics(blob);
  if (topics.length) rulesFired.push(`topics matched: ${topics.join(', ')}`);

  const category = detectCategory(title, body, blob, rulesFired);
  const severity = detectSeverity(blob, category, rulesFired);
  const recommended = recommendNextStep(category, topics, blob, comments, rulesFired);
  const confidence = classifyConfidence(topics, rulesFired);
  const suggested = buildSuggestedAction(category, recommended, topics);
  const publicBlurb = publicNextStepBlurb(recommended, category);
  const ageSignals = computeAgeSignals(issue, comments, rulesFired);

  return {
    category,
    severity,
    summary: buildSummary(issue, category, topics),
    root_cause_hypothesis: null,
    suggested_action: suggested,
    public_next_step_blurb: publicBlurb,
    recommended_next_step: recommended,
    detected_topics: topics,
    confidence,
    age_signals: ageSignals,
    rules_fired: rulesFired,
    cli_commands: [],
    needs_azure_test: category === 'bug' && recommended === 'run-azure-repro',
    azure_resource_types: ['Microsoft.Resources/deploymentStacks'],
    test_scenario: null,
    safe_to_autorun: false,
  };
}

// Age awareness — drives tone selection in the formatter. Does NOT change
// classification; FabricBot already handles auto-stale via the
// `Needs: Author Feedback` + `Status: No Recent Activity` labels.
function computeAgeSignals(issue, comments, rulesFired) {
  const now = Date.now();
  const created = issue.created_at ? new Date(issue.created_at).getTime() : now;
  const updated = issue.updated_at ? new Date(issue.updated_at).getTime() : created;
  const ageDays = Math.max(0, Math.floor((now - created) / 86400000));
  const lastActivityDays = Math.max(0, Math.floor((now - updated) / 86400000));

  const reporterLogin = issue.user && issue.user.login;
  let lastReporterAct = created;
  if (reporterLogin) {
    for (const c of comments) {
      if (c.user && c.user.login === reporterLogin && c.created_at) {
        const t = new Date(c.created_at).getTime();
        if (t > lastReporterAct) lastReporterAct = t;
      }
    }
  }
  const lastReporterDays = Math.max(0, Math.floor((now - lastReporterAct) / 86400000));

  const teamReplied = comments.some(c =>
    ['MEMBER', 'OWNER', 'COLLABORATOR'].includes(c.author_association || '')
  );

  const ageBand =
    ageDays >= 730 ? 'very-old' :
    ageDays >= 180 ? 'stale' :
    ageDays >= 30  ? 'aging' :
                     'recent';

  // Stale issue with team already engaged but reporter silent → useful signal
  // for "ping reporter / consider closing."
  const stalledOnReporter =
    ageDays >= 60 && teamReplied && lastReporterDays >= 60;

  rulesFired.push(
    `age_signals: age=${ageDays}d (${ageBand}), last_activity=${lastActivityDays}d, last_reporter=${lastReporterDays}d${stalledOnReporter ? ', stalled-on-reporter' : ''}`
  );

  return {
    age_days: ageDays,
    last_activity_days: lastActivityDays,
    last_reporter_activity_days: lastReporterDays,
    age_band: ageBand,
    team_replied: teamReplied,
    stalled_on_reporter: stalledOnReporter,
  };
}
