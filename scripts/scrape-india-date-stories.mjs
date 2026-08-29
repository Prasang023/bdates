import { writeFile } from "node:fs/promises";

const citySubs = {
  bangalore: "Bangalore",
  Bengaluru: "Bangalore",
  mumbai: "Mumbai",
  delhi: "Delhi-NCR",
  hyderabad: "Hyderabad",
  pune: "Pune",
  Chennai: "Chennai",
  kolkata: "Kolkata",
  Noida: "Delhi-NCR",
  Gurgaon: "Delhi-NCR",
};

const datingSubs = [
  "indianonlinedating",
  "Indiangirlsontinder",
  "IndianBoysOnTinder",
  "indiaSocial",
  "TwentiesIndia",
  "Arrangedmarriage",
];

const cityQueries = ["first date", "hinge", "bumble", "tinder", "dating scam", "bill"];
const datingQueries = ["first date", "went on a date", "bill", "cafe", "restaurant"];
const records = new Map();
const stats = { requests: 0, succeeded: 0, failed: 0 };

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function search(subreddit, query, inferredCity) {
  const url = new URL("https://arctic-shift.photon-reddit.com/api/posts/search");
  url.searchParams.set("subreddit", subreddit);
  url.searchParams.set("query", query);
  url.searchParams.set("limit", "100");
  url.searchParams.set(
    "fields",
    "id,created_utc,score,title,selftext,subreddit,link_flair_text",
  );

  stats.requests += 1;
  let payload;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const response = await fetch(url, {
      headers: { "User-Agent": "BadDates.fyi public research importer/1.0" },
    });
    payload = await response.json().catch(() => null);
    if (response.ok && Array.isArray(payload?.data)) break;
    if (attempt < 2) await sleep(1800 * (attempt + 1));
  }

  if (!Array.isArray(payload?.data)) {
    stats.failed += 1;
    return;
  }
  stats.succeeded += 1;

  for (const post of payload.data) {
    const body = String(post.selftext ?? "").trim();
    if (
      body.length < 80 ||
      body === "[deleted]" ||
      body === "[removed]" ||
      body === "[removed by reddit]"
    ) {
      continue;
    }

    const existing = records.get(post.id);
    const queries = new Set(existing?.matchedQueries ?? []);
    queries.add(query);
    records.set(post.id, {
      id: post.id,
      subreddit: post.subreddit ?? subreddit,
      inferredCity: existing?.inferredCity ?? inferredCity ?? null,
      createdUtc: Number(post.created_utc),
      score: Math.max(Number(post.score) || 0, 0),
      flair: post.link_flair_text ?? null,
      title: String(post.title ?? "").trim(),
      body,
      matchedQueries: [...queries],
    });
  }
}

for (const [subreddit, city] of Object.entries(citySubs)) {
  for (const query of cityQueries) {
    await search(subreddit, query, city);
    await sleep(500);
  }
}

for (const subreddit of datingSubs) {
  for (const query of datingQueries) {
    await search(subreddit, query, null);
    await sleep(500);
  }
}

const posts = [...records.values()].sort(
  (a, b) => b.score - a.score || b.createdUtc - a.createdUtc,
);

await writeFile(
  ".india-date-source-posts.json",
  `${JSON.stringify(
    {
      fetchedAt: new Date().toISOString(),
      stats,
      count: posts.length,
      posts,
    },
    null,
    2,
  )}\n`,
);

console.log(JSON.stringify({ ...stats, uniquePosts: posts.length }));
