// Pure-Node ESM GitHub REST helpers + privacy guard.
// Zero third-party dependencies — relies on Node 20+ built-in fetch.

const GITHUB_API = 'https://api.github.com';

// Hard guard: deny-list for any repos the agent must never write to.
// Repo names are compared lowercased.
// Empty by default in production; populate locally to firewall test repos.
const FORBIDDEN_WRITE_REPOS = new Set([]);

export function assertWritableRepo(repo) {
  if (!repo) {
    throw new Error('assertWritableRepo: missing repo (expected "owner/name").');
  }
  if (FORBIDDEN_WRITE_REPOS.has(repo.toLowerCase())) {
    throw new Error(
      `Privacy guard: refusing to write to ${repo}. ` +
      `This repo is in FORBIDDEN_WRITE_REPOS.`
    );
  }
}

// Idempotency marker — every triage comment includes this so repeat runs skip it.
export const TRIAGE_MARKER = '<!-- agentry:triage -->';

export const LABEL_COLORS = {
  // Bookkeeping
  'agent:triaged': '5319e7',

  // Categories
  'category:bug':             'd73a4a',
  'category:feature-request': 'a2eeef',
  'category:question':        'd876e3',
  'category:documentation':   '0075ca',
  'category:security':        'b60205',
  'category:performance':     'fbca04',
  'category:enhancement':     'cfd3d7',

  // Severities
  'severity:critical': 'b60205',
  'severity:high':     'd93f0b',
  'severity:medium':   'fbca04',
  'severity:low':      '0e8a16',
  'severity:info':     'c5def5',

  // Next steps
  'next-step:close-as-by-design':     '0e8a16',
  'next-step:close-as-duplicate':     '0e8a16',
  'next-step:close-as-fixed':         '0e8a16',
  'next-step:run-azure-repro':        'fbca04',
  'next-step:needs-product-decision': '5319e7',
  'next-step:needs-docs-update':      '0075ca',
  'next-step:needs-more-info':        'fbca04',
  'next-step:escalate-security':      'b60205',
  'next-step:keep-open-tracking':     'c5def5',

  // Topics (all light grey)
  'topic:denySettings':          'ededed',
  'topic:action-on-unmanage':    'ededed',
  'topic:delete-failure':        'ededed',
  'topic:role-assignment':       'ededed',
  'topic:managed-identity':      'ededed',
  'topic:bicep-language':        'ededed',
  'topic:az-cli':                'ededed',
  'topic:powershell-az':         'ededed',
  'topic:private-dns-zone':      'ededed',
  'topic:by-design':             'ededed',
  'topic:known-limitation':      'ededed',
  'topic:pipeline':              'ededed',
  'topic:error-message-quality': 'ededed',
  'topic:portal':                'ededed',
};

function ghHeaders(token) {
  return {
    'Accept':              'application/vnd.github+json',
    'Authorization':       `Bearer ${token}`,
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent':          'deployment-stacks-triage-bot',
  };
}

async function ghFetch(token, method, path, body) {
  const url = path.startsWith('http') ? path : `${GITHUB_API}${path}`;
  const res = await fetch(url, {
    method,
    headers: {
      ...ghHeaders(token),
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GitHub ${method} ${path} -> ${res.status}: ${text}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

export async function paginate(token, path) {
  const out = [];
  let next = `${path}${path.includes('?') ? '&' : '?'}per_page=100`;
  while (next) {
    const url = next.startsWith('http') ? next : `${GITHUB_API}${next}`;
    const res = await fetch(url, { headers: ghHeaders(token) });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`GitHub GET ${url} -> ${res.status}: ${text}`);
    }
    const page = await res.json();
    out.push(...page);
    const link = res.headers.get('link');
    const m = link?.match(/<([^>]+)>;\s*rel="next"/);
    next = m ? m[1] : null;
  }
  return out;
}

export async function getIssue(token, repo, number) {
  return ghFetch(token, 'GET', `/repos/${repo}/issues/${number}`);
}

export async function listComments(token, repo, number) {
  return paginate(token, `/repos/${repo}/issues/${number}/comments`);
}

export async function hasMarkerComment(token, repo, number) {
  const comments = await listComments(token, repo, number);
  return comments.some(c => (c.body || '').includes(TRIAGE_MARKER));
}

export async function postComment(token, repo, number, body) {
  assertWritableRepo(repo);
  return ghFetch(token, 'POST', `/repos/${repo}/issues/${number}/comments`, { body });
}

export async function ensureLabel(token, repo, name) {
  assertWritableRepo(repo);
  const color = LABEL_COLORS[name] || 'ededed';
  try {
    await ghFetch(token, 'POST', `/repos/${repo}/labels`, {
      name,
      color,
      description: 'Auto-created by triage agent.',
    });
  } catch (err) {
    // 422 Unprocessable Entity = label already exists. Ignore.
    if (!/422/.test(err.message)) throw err;
  }
}

export async function addLabels(token, repo, number, labels) {
  assertWritableRepo(repo);
  for (const l of labels) await ensureLabel(token, repo, l);
  return ghFetch(token, 'POST', `/repos/${repo}/issues/${number}/labels`, { labels });
}

// Returns all open issues in the repo (NOT PRs). Used for duplicate detection.
export async function listOpenIssues(token, repo) {
  const items = await paginate(token, `/repos/${repo}/issues?state=open`);
  return items.filter(i => !i.pull_request);
}
