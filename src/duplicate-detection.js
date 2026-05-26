// Lightweight, deterministic duplicate / near-duplicate detection.
//
// Approach:
//   1. Tokenize titles after lowercasing + stripping any leading `[#NNN]` prefix.
//   2. Drop English stopwords and short tokens.
//   3. Compute Jaccard similarity between candidate and each other open issue.
//   4. Also count shared detected topics.
//   5. Require BOTH meaningful title overlap AND topic overlap to declare a
//      possible duplicate. The bot only *suggests* — humans confirm/close.
//
// We never claim duplicates with high confidence on title overlap alone — many
// Deployment Stacks issues share words like "deployment", "stack", "delete".

const STOPWORDS = new Set([
  'a','an','and','are','as','at','be','by','for','from','has','have','i','if',
  'in','is','it','its','of','on','or','that','the','their','then','this','to',
  'was','were','will','with','you','your','my','we','our','us','me','can','do',
  'does','did','not','no','yes','but','so','than','via','using','use','used',
  'when','what','why','how','who','where','which','should','would','could','may',
  'might','must','about','any','some','all','more','less','also','out','up',
  // Common deployment-stacks domain words that don't actually disambiguate:
  'deployment','deployments','stack','stacks','azure','arm','resource','resources',
  'issue','issues','bug','feature','request','support','error','please','help',
]);

function tokenize(text) {
  return (text || '')
    .toLowerCase()
    .replace(/^\s*\[#\d+\]\s*/, '')                  // drop any leading `[#NNN]` prefix
    .replace(/[`*_~>#\-—–\(\)\[\]\{\}.,:;!?"/\\]/g, ' ')
    .split(/\s+/)
    .filter(t => t.length >= 3 && !STOPWORDS.has(t));
}

function jaccard(a, b) {
  if (!a.size || !b.size) return 0;
  let inter = 0;
  for (const x of a) if (b.has(x)) inter++;
  const union = a.size + b.size - inter;
  return union === 0 ? 0 : inter / union;
}

// Returns up to 2 suggestions sorted by combined score, each:
//   { number, title, score, sharedTopics, sharedTokens, reason }
export function findPossibleDuplicates(currentIssue, currentTopics, otherIssues) {
  if (!Array.isArray(otherIssues) || otherIssues.length === 0) return [];

  const myTokens = new Set(tokenize(currentIssue.title));
  const myTopics = new Set(currentTopics || []);
  if (myTokens.size === 0) return [];

  const scored = [];
  for (const other of otherIssues) {
    if (!other || other.number === currentIssue.number) continue;
    if (other.state && other.state !== 'open') continue;
    if (other.pull_request) continue;

    const otherTokens = new Set(tokenize(other.title));
    if (otherTokens.size === 0) continue;

    // Topic overlap: how many topic labels does the OTHER issue have in common
    // (we approximate by checking topic-label names against the issue's labels).
    const otherTopicLabels = (other.labels || [])
      .map(l => (typeof l === 'string' ? l : l.name) || '')
      .filter(name => name.startsWith('topic:'))
      .map(name => name.slice('topic:'.length));

    const sharedTopics = otherTopicLabels.filter(t => myTopics.has(t));
    const tokenJaccard = jaccard(myTokens, otherTokens);

    // Heuristic threshold:
    //   - jaccard >= 0.35 alone is suggestive but noisy
    //   - >= 1 shared topic + jaccard >= 0.2 is a much stronger signal
    let score = 0;
    let reason = null;
    if (sharedTopics.length >= 2 && tokenJaccard >= 0.15) {
      score = tokenJaccard + 0.15 * sharedTopics.length;
      reason = `shares ${sharedTopics.length} topic labels (${sharedTopics.join(', ')}) and title overlap ${Math.round(tokenJaccard * 100)}%`;
    } else if (sharedTopics.length >= 1 && tokenJaccard >= 0.25) {
      score = tokenJaccard + 0.10 * sharedTopics.length;
      reason = `shares topic \`${sharedTopics[0]}\` and title overlap ${Math.round(tokenJaccard * 100)}%`;
    } else if (tokenJaccard >= 0.45) {
      score = tokenJaccard;
      reason = `strong title overlap (${Math.round(tokenJaccard * 100)}%)`;
    }

    if (score > 0) {
      const sharedTokensList = [...myTokens].filter(t => otherTokens.has(t)).slice(0, 6);
      scored.push({
        number: other.number,
        title: other.title,
        url: other.html_url,
        score,
        sharedTopics,
        sharedTokens: sharedTokensList,
        reason,
      });
    }
  }

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, 2);
}
