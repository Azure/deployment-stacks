// Topic + phrase → canonical learn.microsoft.com docs mapping.
//
// All URLs in this file were verified to return HTTP 200 on 2026-05-26.
// Only top-level / stable URLs are used (no deep anchors) so they survive
// docs reorgs.
//
// Selection priority:
//   1. Phrase matches against the issue's full text blob (title + body + comments)
//      — most specific, surfaced first.
//   2. Topic-label matches (from the classifier's detected_topics).
//   3. Dedup and cap at MAX_LINKS so we don't spam.

const MAX_LINKS = 3;

// Phrase patterns — these are highly specific signals where we know the exact
// doc page that helps. Tested against the full blob.
const PHRASE_DOCS = [
  {
    pattern: /denysettings|denyassignment/i,
    label: 'Deployment stacks: protect managed resources (deny settings)',
    url: 'https://learn.microsoft.com/azure/azure-resource-manager/bicep/deployment-stacks',
    weight: 100,
  },
  {
    pattern: /actiononunmanage|action[\s-]?on[\s-]?unmanage|--action-on-unmanage|delete[\s-]?all|detach[\s-]?all|deleteresources/i,
    label: 'Deployment stacks: action on unmanage (detach vs delete)',
    url: 'https://learn.microsoft.com/azure/azure-resource-manager/bicep/deployment-stacks',
    weight: 95,
  },
  {
    pattern: /private[\s-]?dns[\s-]?zone|privatednszones/i,
    label: 'Azure Private DNS zones overview',
    url: 'https://learn.microsoft.com/azure/dns/private-dns-overview',
    weight: 90,
  },
  {
    pattern: /az\s+stack\b|--action-on-unmanage|az\s+deployment\s+stack/i,
    label: 'az stack — Azure CLI command reference',
    url: 'https://learn.microsoft.com/cli/azure/stack',
    weight: 85,
  },
  {
    pattern: /new-azsubscriptiondeploymentstack|new-azmanagementgroupdeploymentstack|new-azresourcegroupdeploymentstack|az\.resources|\baz\s+powershell\b/i,
    label: 'Az.Resources reference (deployment stack cmdlets)',
    url: 'https://learn.microsoft.com/powershell/module/az.resources/',
    weight: 80,
  },
  {
    pattern: /managed[\s-]?identity|user[\s-]?assigned[\s-]?identity|userassignedidentity/i,
    label: 'Managed identities for Azure resources — overview',
    url: 'https://learn.microsoft.com/entra/identity/managed-identities-azure-resources/overview',
    weight: 70,
  },
  {
    pattern: /role[\s-]?assignment|microsoft\.authorization\/roleassignments/i,
    label: 'Microsoft.Authorization/roleAssignments — template reference',
    url: 'https://learn.microsoft.com/azure/templates/microsoft.authorization/roleassignments',
    weight: 70,
  },
  {
    pattern: /\.bicep\b|bicep[\s-]?module|bicep[\s-]?file|bicep[\s-]?language/i,
    label: 'Bicep language — overview',
    url: 'https://learn.microsoft.com/azure/azure-resource-manager/bicep/overview',
    weight: 60,
  },
];

// Topic-label fallback — broader, applies when phrase didn't fire.
const TOPIC_DOCS = {
  'denySettings': {
    label: 'Deployment stacks overview',
    url: 'https://learn.microsoft.com/azure/azure-resource-manager/bicep/deployment-stacks',
    weight: 50,
  },
  'action-on-unmanage': {
    label: 'Deployment stacks overview',
    url: 'https://learn.microsoft.com/azure/azure-resource-manager/bicep/deployment-stacks',
    weight: 50,
  },
  'role-assignment': {
    label: 'Microsoft.Authorization/roleAssignments — template reference',
    url: 'https://learn.microsoft.com/azure/templates/microsoft.authorization/roleassignments',
    weight: 50,
  },
  'managed-identity': {
    label: 'Managed identities for Azure resources — overview',
    url: 'https://learn.microsoft.com/entra/identity/managed-identities-azure-resources/overview',
    weight: 50,
  },
  'bicep-language': {
    label: 'Bicep language — overview',
    url: 'https://learn.microsoft.com/azure/azure-resource-manager/bicep/overview',
    weight: 40,
  },
  'az-cli': {
    label: 'az stack — Azure CLI command reference',
    url: 'https://learn.microsoft.com/cli/azure/stack',
    weight: 40,
  },
  'powershell-az': {
    label: 'Az.Resources reference (deployment stack cmdlets)',
    url: 'https://learn.microsoft.com/powershell/module/az.resources/',
    weight: 40,
  },
  'private-dns-zone': {
    label: 'Azure Private DNS zones overview',
    url: 'https://learn.microsoft.com/azure/dns/private-dns-overview',
    weight: 40,
  },
  'portal': {
    label: 'Deployment stacks overview',
    url: 'https://learn.microsoft.com/azure/azure-resource-manager/bicep/deployment-stacks',
    weight: 30,
  },
};

// Selects up to MAX_LINKS docs links for the given issue context, prioritizing
// phrase matches over topic matches, deduped by URL.
//
// Inputs:
//   - blob: title + body + comments concatenated (same blob the classifier uses)
//   - topics: detected_topics array
export function selectDocsLinks(blob, topics) {
  const candidates = [];

  // 1. Phrase matches (most specific first)
  for (const d of PHRASE_DOCS) {
    if (d.pattern.test(blob || '')) {
      candidates.push({ label: d.label, url: d.url, weight: d.weight, source: 'phrase' });
    }
  }

  // 2. Topic-label fallbacks
  for (const topic of topics || []) {
    const d = TOPIC_DOCS[topic];
    if (d) {
      candidates.push({ label: d.label, url: d.url, weight: d.weight, source: `topic:${topic}` });
    }
  }

  // Sort by weight desc, then dedup by URL preserving first occurrence.
  candidates.sort((a, b) => b.weight - a.weight);
  const seen = new Set();
  const out = [];
  for (const c of candidates) {
    if (seen.has(c.url)) continue;
    seen.add(c.url);
    out.push({ label: c.label, url: c.url });
    if (out.length >= MAX_LINKS) break;
  }
  return out;
}

// Back-compat wrapper for callers that only know about topics.
export function docsForTopics(topics) {
  return selectDocsLinks('', topics);
}
