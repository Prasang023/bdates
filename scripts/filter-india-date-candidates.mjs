import { readFile, writeFile } from "node:fs/promises";

const source = JSON.parse(await readFile(".india-date-source-posts.json", "utf8"));
const cityPatterns = [
  ["Bangalore", /\b(bangalore|bengaluru|blr)\b/i],
  ["Mumbai", /\b(mumbai|bombay)\b/i],
  ["Delhi-NCR", /\b(delhi|new delhi|ncr|noida|gurgaon|gurugram|ghaziabad|faridabad)\b/i],
  ["Pune", /\bpune\b/i],
  ["Hyderabad", /\b(hyderabad|hyd)\b/i],
  ["Kolkata", /\b(kolkata|calcutta)\b/i],
  ["Chennai", /\b(chennai|madras)\b/i],
  ["Jaipur", /\bjaipur\b/i],
  ["Ahmedabad", /\b(ahmedabad|amdavad)\b/i],
  ["Lucknow", /\blucknow\b/i],
  ["Chandigarh", /\b(chandigarh|mohali)\b/i],
  ["Indore", /\bindore\b/i],
  ["Kochi", /\b(kochi|cochin)\b/i],
  ["Goa", /\bgoa\b/i],
];

const datePast = /\b(first date|second date|went on (?:a |the )?date|went out with|met (?:him|her|them|my date) (?:at|in|for)|matched (?:with|on)|date was|during (?:our|the|my) date|after (?:our|the|my) date|took (?:him|her|them) (?:to|out)|asked me out)\b/i;
const inPerson = /\b(cafe|café|coffee shop|restaurant|bar|pub|club|mall|movie|cinema|theatre|dinner|lunch|breakfast|drinks?|park|walk|drive|picked me up|venue|bill|waiter|waitress|menu)\b/i;
const negative = /\b(worst|bad date|awkward|creep|creepy|uncomfortable|weird|rude|ghosted|blocked|catfish|scam|bill|red flag|lied|late|no-show|stood me up|left me|walked out|expensive|overpriced|harass|unsafe|terrible|horrible|disaster|regret|insult|shouted|yelled|drunk|high|ex\b|parents? (?:came|showed|joined)|didn.t pay|refused to pay)\b/i;
const futureAdvice = /\b(going on (?:a |my )?(?:first )?date|date (?:is|will be) tomorrow|any tips|what should i wear|where should (?:we|i) go|planning (?:a |my )?date)\b/i;
const seeking = /\b(looking for (?:a |an )?(?:girl|boy|woman|man|partner|date)|dm me|anyone interested|want to meet someone)\b/i;
const minor = /\b(?:1[0-7]\s*[mf]|(?:age[sd]?|i am|i.m|was)\s+(?:1[0-7])\b|school date|class (?:8|9|10|11|12)\b)\b/i;
const indiaMoney = /(?:₹\s?[\d,]+|\b(?:rs\.?|inr)\s?[\d,]+)/i;

const candidates = [];
for (const post of source.posts) {
  const text = `${post.title}\n${post.body}`;
  if (minor.test(text) || seeking.test(text)) continue;
  if (futureAdvice.test(text) && !/\b(went|met|was|had|happened|arrived|paid|left)\b/i.test(text)) continue;
  if (!datePast.test(text) || !inPerson.test(text) || !negative.test(text)) continue;

  const namedCity = cityPatterns.find(([, pattern]) => pattern.test(text))?.[0];
  const city = namedCity ?? post.inferredCity;
  if (!city && !indiaMoney.test(text)) continue;

  candidates.push({
    ...post,
    candidateCity: city ?? "Other",
    moneyMentions: [...text.matchAll(/(?:₹\s?[\d,]+|\b(?:rs\.?|inr)\s?[\d,]+)/gi)].map((match) => match[0]),
  });
}

await writeFile(
  ".india-date-candidates.json",
  `${JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      sourceCount: source.count,
      candidateCount: candidates.length,
      candidates,
    },
    null,
    2,
  )}\n`,
);

console.log(
  JSON.stringify({
    source: source.count,
    candidates: candidates.length,
    cities: candidates.reduce((counts, item) => {
      counts[item.candidateCity] = (counts[item.candidateCity] ?? 0) + 1;
      return counts;
    }, {}),
    withMoney: candidates.filter((item) => item.moneyMentions.length > 0).length,
  }),
);
