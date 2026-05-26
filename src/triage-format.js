import { TRIAGE_MARKER } from './github.js';

const CONFIDENCE_EMOJI = {
  high:   '🟢',
  medium: '🟡',
  low:    '🔴',
};

const NEXT_STEP_LABELS = {
  'close-as-by-design':     'Close — by design',
  'close-as-duplicate':     'Close — duplicate',
  'close-as-fixed':         'Close — reporter signaled fixed',
  'run-azure-repro':        'Run Azure repro',
  'needs-product-decision': 'Needs product decision',
  'needs-docs-update':      'Needs docs update',
  'needs-more-info':        'Needs more info from reporter',
  'escalate-security':      'Escalate — security',
  'keep-open-tracking':     'Keep open / tracking',
};

const CATEGORY_FRIENDLY = {
  'bug':             'a bug report',
  'feature-request': 'a feature request',
  'question':        'a question',
  'documentation':   'a documentation gap',
  'security':        'a security report',
  'performance':     'a performance concern',
  'enhancement':     'an enhancement request',
};

// Build the polite, reporter-facing public reply followed by a collapsed
// "team details" section. `extras` may include:
//   - docsLinks: [{label, url}]
//   - possibleDuplicates: [{number, title, url, reason}]
//   - existingLabelConflicts: ['category:bug'] etc.
export function formatTriageComment(t, extras = {}) {
  const conf = CONFIDENCE_EMOJI[t.confidence] || '⚪';
  const stepLabel = NEXT_STEP_LABELS[t.recommended_next_step] || t.recommended_next_step;
  const friendlyCategory = CATEGORY_FRIENDLY[t.category] || t.category;
  const topics = t.detected_topics || [];
  const docsLinks = extras.docsLinks || [];
  const dupes = extras.possibleDuplicates || [];
  const labelConflicts = extras.existingLabelConflicts || [];

  const parts = [];

  parts.push(TRIAGE_MARKER);
  parts.push('');

  // Opening line is age-aware. Stale and very-old issues lead with an
  // explicit acknowledgement of the wait.
  const ageBand = (t.age_signals && t.age_signals.age_band) || 'recent';
  if (ageBand === 'very-old') {
    parts.push('👋 **Apologies for the long wait on this one.**');
    parts.push('');
    parts.push(
      "This was recently picked up as an outstanding open issue for the " +
      "**ARM Deployments team** to review. I'm the team's automated triage " +
      "assistant \u2014 I've taken a fresh pass at categorizing what you " +
      "shared so a human reviewer can follow up quickly."
    );
  } else if (ageBand === 'stale') {
    parts.push('👋 **Thanks for your patience on this one.**');
    parts.push('');
    parts.push(
      "We're catching up on older open issues, and the **ARM Deployments " +
      "team**'s triage assistant has taken a fresh pass at this one. A team " +
      "member will follow up \u2014 this comment is just to share what I " +
      "noticed so your issue lands in the right place."
    );
  } else {
    parts.push('👋 **Hi, and thanks for opening this issue.**');
    parts.push('');
    parts.push(
      "I'm an automated triage assistant for the **ARM Deployments team**. " +
      "To help route your report to the right folks quickly, I've taken a first " +
      "pass at categorizing what you've shared. A team member will follow up \u2014 " +
      "this comment is just to share what I noticed so your issue lands in the " +
      "right place."
    );
  }
  parts.push('');

  // What I noticed (reporter-facing)
  parts.push('### What I noticed');
  parts.push('');
  parts.push(`- This looks like **${friendlyCategory}**.`);
  if (topics.length) {
    parts.push(`- Topics detected: ${topics.map(x => `\`${x}\``).join(', ')}`);
  }
  parts.push(`- ${t.public_next_step_blurb || 'A team member will review and respond.'}`);
  parts.push('');

  // Stale-aware ask: if this is an old issue, invite the reporter to confirm
  // whether it's still relevant before we dig in.
  if (ageBand === 'stale' || ageBand === 'very-old') {
    const ageYears = Math.floor((t.age_signals?.age_days || 0) / 365);
    const ageDesc = ageYears >= 1
      ? `${ageYears}+ year${ageYears === 1 ? '' : 's'}`
      : `${Math.round((t.age_signals?.age_days || 0) / 30)} month(s)`;
    parts.push('### Still relevant?');
    parts.push('');
    parts.push(
      `This issue has been open for ~${ageDesc}. If your situation has changed since ` +
      `you filed it \u2014 fixed in a newer version of the CLI / Az PowerShell / Bicep, ` +
      `found a workaround, or no longer reproducing \u2014 a quick reply or close ` +
      `would help us focus. Otherwise a team member will dig in fresh.`
    );
    parts.push('');
  }

  // Possible duplicates
  if (dupes.length) {
    parts.push('### Possibly related to an existing issue');
    parts.push('');
    parts.push(
      "This report shares meaningful overlap with the following open issue" +
      (dupes.length > 1 ? 's' : '') +
      ". A team member will confirm whether they should be linked or merged:"
    );
    parts.push('');
    for (const d of dupes) {
      parts.push(`- **#${d.number}** — ${escapeMd(d.title)}  \n  _Why I think so:_ ${d.reason}.`);
    }
    parts.push('');
  }

  // Helpful docs (reporter-facing)
  if (docsLinks.length) {
    parts.push('### Possibly helpful while you wait');
    parts.push('');
    parts.push("Some documentation that may be relevant to what you're hitting:");
    parts.push('');
    for (const d of docsLinks) {
      parts.push(`- 📘 [${d.label}](${d.url})`);
    }
    parts.push('');
    parts.push("_If one of these answers your question, feel free to close the issue — otherwise we'll keep digging._");
    parts.push('');
  }

  // Invite correction
  parts.push('### Did I get something wrong?');
  parts.push('');
  parts.push(
    "No worries — a human will still review either way. If the category or " +
    "topics above are off, just reply with the correct framing (or any extra " +
    "context, repro steps, or workaround you've tried) and we'll re-route it."
  );
  parts.push('');

  // Collapsible team-details block
  parts.push('---');
  parts.push('');
  parts.push('<details><summary>🔎 Triage details (for the team)</summary>');
  parts.push('');
  parts.push(`- **Category:** \`${t.category}\` · **Severity:** \`${t.severity}\` · **Confidence:** ${conf} ${t.confidence}`);
  parts.push(`- **Recommended next step:** \`${stepLabel}\` — ${t.suggested_action}`);
  if (t.age_signals) {
    const a = t.age_signals;
    parts.push(`- **Age:** ${a.age_days}d (${a.age_band}); last activity ${a.last_activity_days}d ago; reporter last spoke ${a.last_reporter_activity_days}d ago${a.stalled_on_reporter ? ' ⚠️ stalled on reporter' : ''}`);
  }
  if (topics.length) {
    parts.push(`- **Detected topics:** ${topics.join(', ')}`);
  } else {
    parts.push('- **Detected topics:** _none detected_');
  }
  if (labelConflicts.length) {
    parts.push(`- **⚠️ Existing labels conflict with classification:** ${labelConflicts.map(l => `\`${l}\``).join(', ')}`);
  }
  if (dupes.length) {
    parts.push(`- **Possible duplicates flagged:** ${dupes.map(d => `#${d.number}`).join(', ')}`);
  }
  parts.push('- **Rules fired:**');
  for (const r of t.rules_fired || []) {
    parts.push(`  - ${r}`);
  }
  parts.push('');
  parts.push('</details>');
  parts.push('');
  parts.push(
    "_Automated triage by the ARM Deployments triage assistant — deterministic " +
    "rule-based classifier, **no AI/LLM used**. Intended to surface signal for " +
    "human review, not to take autonomous action._"
  );

  return parts.join('\n');
}

function escapeMd(s) {
  return (s || '').replace(/([\\`*_{}\[\]()#+\-.!|])/g, '\\$1');
}

export function triageLabels(t) {
  const labels = ['agent:triaged'];
  if (t.category) labels.push(`category:${t.category}`);
  if (t.severity) labels.push(`severity:${t.severity}`);
  if (t.recommended_next_step) labels.push(`next-step:${t.recommended_next_step}`);
  for (const topic of t.detected_topics || []) {
    labels.push(`topic:${topic}`);
  }
  return labels;
}

// Given the triage result + the issue's CURRENT labels, returns category-style
// labels that conflict with the agent's classification (e.g. `category:bug`
// already present when the agent classifies as feature-request). Used as a
// reviewer hint inside the team-details block — the bot does NOT auto-remove.
export function findExistingLabelConflicts(currentLabels, t) {
  const names = (currentLabels || [])
    .map(l => (typeof l === 'string' ? l : l.name))
    .filter(Boolean);
  const out = [];
  for (const name of names) {
    if (name.startsWith('category:') && name !== `category:${t.category}`) {
      out.push(name);
    }
  }
  return out;
}
