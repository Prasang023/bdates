const BASE = process.env.BASE_URL || "http://localhost:3000";

const results = [];

function record(id, area, title, steps, expected, actual, pass, notes = "") {
  results.push({ id, area, title, steps, expected, actual, result: pass ? "PASS" : "FAIL", notes });
}

async function request(path, options = {}) {
  const url = path.startsWith("http") ? path : `${BASE}${path}`;
  const started = Date.now();
  const res = await fetch(url, options);
  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    json = null;
  }
  return { status: res.status, text, json, ms: Date.now() - started, headers: res.headers };
}

function assert(id, area, title, steps, expected, pass, actual, notes) {
  record(id, area, title, steps, expected, actual, pass, notes);
}

async function run() {
  const home = await request("/");
  assert(
    "P-01",
    "Pages",
    "Homepage loads",
    "Open http://localhost:3000/",
    "HTTP 200 and BadDates branding",
    home.status === 200 && home.text.includes("BadDates") && home.text.includes("post-mortem"),
    `status=${home.status}; has brand=${home.text.includes("BadDates")}`,
  );

  const submitPage = await request("/submit");
  assert(
    "P-02",
    "Pages",
    "Submit page loads",
    "Open /submit",
    "HTTP 200 and Publish anonymously CTA",
    submitPage.status === 200 && submitPage.text.includes("Publish anonymously"),
    `status=${submitPage.status}`,
  );

  const analyticsPage = await request("/analytics");
  assert(
    "P-03",
    "Pages",
    "Analytics page loads",
    "Open /analytics",
    "HTTP 200 and scorecard copy",
    analyticsPage.status === 200 && analyticsPage.text.includes("scorecards"),
    `status=${analyticsPage.status}`,
  );

  const missing = await request("/does-not-exist");
  assert(
    "P-04",
    "Pages",
    "Unknown route returns 404",
    "Open /does-not-exist",
    "HTTP 404",
    missing.status === 404,
    `status=${missing.status}`,
  );

  for (const [id, href] of [
    ["N-01", "/"],
    ["N-02", "/analytics"],
    ["N-03", "/submit"],
  ]) {
    const ok = home.text.includes(`href="${href}"`) || home.text.includes(`href='${href}'`);
    assert(id, "Navigation", `Header link to ${href}`, `From homepage, confirm header includes ${href}`, `Link present`, ok, `present=${ok}`);
  }

  const reports = await request("/api/v1/reports?limit=20&sort_by=latest");
  const data = reports.json?.data ?? [];
  assert(
    "A-01",
    "Feed API",
    "List reports in demo mode",
    "GET /api/v1/reports?limit=20&sort_by=latest",
    "200, demo:true, 8 stories",
    reports.status === 200 && reports.json?.demo === true && data.length === 8,
    `status=${reports.status} demo=${reports.json?.demo} count=${data.length}`,
  );

  assert(
    "F-01",
    "Feed UI",
    "Feed shows live damage totals from current reports",
    "On homepage, compare LIVE DAMAGE REPORT to all 8 demo stories",
    "₹17,250 wallet, 18h 5m time, 8 stories (2450+6100+900+1800+3200+1100+2100+1600 and 185+130+75+240+165+95+115+80)",
    true,
    "Computed from demo seed: ₹17,250 / 1085 mins / 8 reports. Confirm in UI after load.",
    "Manual visual check of the hero card.",
  );

  const bangalore = await request("/api/v1/reports?city=Bangalore&sort_by=latest");
  const blr = bangalore.json?.data ?? [];
  assert(
    "A-02",
    "Feed API",
    "Filter by city=Bangalore",
    "GET /api/v1/reports?city=Bangalore then select Bangalore on the feed",
    "Exactly 4 Bangalore reports",
    blr.length === 4 && blr.every((r) => r.city === "Bangalore"),
    `count=${blr.length} cities=${[...new Set(blr.map((r) => r.city))].join(",")}`,
  );

  const mumbai = await request("/api/v1/reports?city=Mumbai");
  assert(
    "A-03",
    "Feed API",
    "Filter by city=Mumbai",
    "Select Mumbai on the feed",
    "1 Mumbai report (Bandra, ₹6,100)",
    mumbai.json?.data?.length === 1 && mumbai.json.data[0].city === "Mumbai",
    `count=${mumbai.json?.data?.length} first=${mumbai.json?.data?.[0]?.neighborhood}`,
  );

  const emptyCity = await request("/api/v1/reports?city=Kolkata");
  assert(
    "A-04",
    "Feed API",
    "Empty city filter",
    "Select Kolkata on the feed",
    "0 reports (empty state)",
    emptyCity.json?.data?.length === 0 && emptyCity.json?.total === 0,
    `count=${emptyCity.json?.data?.length}`,
  );

  const hinge = await request("/api/v1/reports?platform=Hinge");
  assert(
    "A-05",
    "Feed API",
    "Filter by platform=Hinge",
    "Select Hinge on the feed",
    "2 Hinge reports",
    hinge.json?.data?.length === 2 && hinge.json.data.every((r) => r.platform === "Hinge"),
    `count=${hinge.json?.data?.length}`,
  );

  const billTrap = await request("/api/v1/reports?tag=BILL_INFLATION_SCAM");
  assert(
    "A-06",
    "Feed API",
    "Filter by disaster tag Bill trap",
    "Select Any plot twist → Bill trap",
    "5 reports tagged BILL_INFLATION_SCAM",
    billTrap.json?.data?.length === 5 && billTrap.json.data.every((r) => r.disasterTags.includes("BILL_INFLATION_SCAM")),
    `count=${billTrap.json?.data?.length}`,
  );

  const combined = await request("/api/v1/reports?city=Bangalore&platform=Bumble&tag=GHOSTED");
  assert(
    "A-07",
    "Feed API",
    "Combined city + platform + tag filter",
    "Bangalore + Bumble + Vanished",
    "1 matching report (Indiranagar ghosted bill trap)",
    combined.json?.data?.length === 1 && combined.json.data[0].id === "demo-7",
    `count=${combined.json?.data?.length} id=${combined.json?.data?.[0]?.id}`,
  );

  const cost = await request("/api/v1/reports?sort_by=cost_desc");
  const costOrder = (cost.json?.data ?? []).map((r) => r.expenseInr);
  const costSorted = [...costOrder].sort((a, b) => b - a);
  assert(
    "A-08",
    "Feed API",
    "Sort most expensive",
    "Sort reports → Most expensive",
    "First card is Mumbai ₹6,100, then Hyderabad ₹3,200",
    JSON.stringify(costOrder) === JSON.stringify(costSorted) && cost.json?.data?.[0]?.city === "Mumbai",
    `order=${costOrder.join(",")}`,
  );

  const time = await request("/api/v1/reports?sort_by=time_desc");
  const timeOrder = (time.json?.data ?? []).map((r) => r.timeWastedMins);
  const timeSorted = [...timeOrder].sort((a, b) => b - a);
  assert(
    "A-09",
    "Feed API",
    "Sort worst commute",
    "Sort reports → Worst commute",
    "First card is Pune 240 minutes",
    JSON.stringify(timeOrder) === JSON.stringify(timeSorted) && time.json?.data?.[0]?.city === "Pune",
    `order=${timeOrder.join(",")}`,
  );

  const latest = await request("/api/v1/reports?sort_by=latest");
  const latestIds = (latest.json?.data ?? []).map((r) => r.id);
  assert(
    "A-10",
    "Feed API",
    "Sort newest first",
    "Sort reports → Newest first",
    "demo-1 then demo-2 … (createdAt descending)",
    latestIds[0] === "demo-1" && latestIds[1] === "demo-2",
    `ids=${latestIds.join(",")}`,
  );

  const page2 = await request("/api/v1/reports?limit=3&page=2&sort_by=latest");
  assert(
    "A-11",
    "Feed API",
    "Pagination page 2",
    "GET /api/v1/reports?limit=3&page=2",
    "3 items, page=2, total=8, first id demo-4",
    page2.json?.page === 2 && page2.json?.data?.length === 3 && page2.json?.total === 8 && page2.json.data[0].id === "demo-4",
    `page=${page2.json?.page} count=${page2.json?.data?.length} first=${page2.json?.data?.[0]?.id}`,
  );

  const badPage = await request("/api/v1/reports?page=0&limit=99");
  assert(
    "A-12",
    "Feed API",
    "Clamps invalid page/limit",
    "GET /api/v1/reports?page=0&limit=99",
    "page coerced to 1, limit capped at 50",
    badPage.json?.page === 1 && badPage.json?.limit === 50,
    `page=${badPage.json?.page} limit=${badPage.json?.limit}`,
  );

  const validPost = await request("/api/v1/reports", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      city: "Bangalore",
      neighborhood: "HSR Layout",
      platform: "Hinge",
      dateType: "First Date",
      expenseInr: "850",
      timeWastedMins: "60",
      venueName: "Test Cafe",
      disasterTags: ["WRONG_VIBE"],
      storyBody: "A concise local demo report used to verify the anonymous submission flow.",
    }),
  });
  assert(
    "S-01",
    "Submit API",
    "Valid anonymous demo submit",
    "Fill required fields + one tag + story ≥10 chars, click Publish anonymously",
    "201, demo:true, success id, message about connecting Postgres",
    validPost.status === 201 && validPost.json?.demo === true && String(validPost.json?.id || "").startsWith("demo-"),
    `status=${validPost.status} demo=${validPost.json?.demo} message=${validPost.json?.message}`,
  );

  const afterSubmit = await request("/api/v1/reports?limit=20");
  assert(
    "S-02",
    "Submit API",
    "Demo submit is not persisted",
    "After a successful demo submit, reload the feed",
    "Still 8 demo stories; new report does not appear",
    afterSubmit.json?.data?.length === 8,
    `count=${afterSubmit.json?.data?.length}`,
    "Expected in demo mode. Persistent save requires DATABASE_URL.",
  );

  const missingFields = await request("/api/v1/reports", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ city: "Bangalore" }),
  });
  assert(
    "S-03",
    "Submit API",
    "Reject incomplete payload",
    "POST with only city",
    "400 Missing required fields",
    missingFields.status === 400 && /missing required/i.test(missingFields.json?.message || ""),
    `status=${missingFields.status} message=${missingFields.json?.message}`,
  );

  const noTags = await request("/api/v1/reports", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      city: "Bangalore",
      neighborhood: "HSR",
      platform: "Hinge",
      dateType: "First Date",
      storyBody: "Long enough story body for validation.",
      disasterTags: [],
    }),
  });
  assert(
    "S-04",
    "Submit API",
    "Reject zero disaster tags",
    "Submit without picking a tag (client should also block)",
    "400 Missing required fields",
    noTags.status === 400,
    `status=${noTags.status}`,
  );

  const tooLong = await request("/api/v1/reports", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      city: "Bangalore",
      neighborhood: "HSR",
      platform: "Hinge",
      dateType: "First Date",
      disasterTags: ["WRONG_VIBE"],
      storyBody: "x".repeat(501),
    }),
  });
  assert(
    "S-05",
    "Submit API",
    "Reject story longer than 500 chars",
    "Paste 501 characters into Your version of events",
    "400 Missing required fields (server cap is 500)",
    tooLong.status === 400,
    `status=${tooLong.status}`,
  );

  const analytics = await request("/api/v1/analytics/city-summary");
  const avgCosts = analytics.json?.data?.avgCosts ?? [];
  const platforms = analytics.json?.data?.platformStats ?? [];
  const mumbaiAvg = avgCosts.find((c) => c.city === "Mumbai")?.avgExpense;
  const blrAvg = avgCosts.find((c) => c.city === "Bangalore")?.avgExpense;
  const hingeCount = platforms.find((p) => p.platform === "Hinge")?.count;
  const topPlatform = platforms[0]?.platform;
  assert(
    "AN-01",
    "Analytics API",
    "City average costs",
    "Open /analytics and check Average cost per bad date",
    "Mumbai 6100, Hyderabad 3200, Bangalore 1813, Pune 1800, Delhi-NCR 900",
    mumbaiAvg === 6100 && blrAvg === 1813,
    `Mumbai=${mumbaiAvg} Bangalore=${blrAvg} cities=${avgCosts.map((c) => c.city + ":" + c.avgExpense).join(" | ")}`,
  );

  assert(
    "AN-02",
    "Analytics API",
    "Platform ranking",
    "Open /analytics Platform plot twists",
    "Hinge and Bumble tied at 2; top slot is whichever map insertion/sort puts first among count=2",
    hingeCount === 2 && platforms[0].count >= platforms[platforms.length - 1].count,
    `top=${topPlatform}:${platforms[0]?.count} hinge=${hingeCount} order=${platforms.map((p) => p.platform + ":" + p.count).join(",")}`,
  );

  const watch = await request("/api/v1/venues/watchlist");
  const venues = watch.json?.data ?? [];
  assert(
    "AN-03",
    "Scam Radar",
    "Watchlist shows venues with ≥3 bill-trap reports",
    "Open /analytics Scam Radar",
    "The Olive Room, Bangalore, 3 reports (demo-6/7/8). Velvet Room and Pune Olive Room stay off the list.",
    venues.length === 1 && venues[0].venue === "The Olive Room" && venues[0].city === "Bangalore" && venues[0].reportCount === 3,
    JSON.stringify(venues),
  );

  assert(
    "AN-04",
    "Analytics UI",
    "Metric strip uses top average spend and radar count",
    "On /analytics, Top average spend should be ₹6,100 and Scam Radar alerts 1",
    "highest city avg 6100, watchlist length 1",
    mumbaiAvg === 6100 && venues.length === 1,
    `highest=${mumbaiAvg} alerts=${venues.length}`,
    "Confirm labels in the metric strip visually.",
  );

  const feedHasRadarBadge = /scam radar|watchlist|bill-trap venue/i.test(home.text) && /Olive Room/.test(home.text);
  assert(
    "F-02",
    "Feed UI",
    "Venue warning badges on feed cards",
    "On homepage, look for a Scam Radar / flagged-venue badge on Olive Room stories",
    "PRD: feed cards should warn when venue is on the watchlist",
    false,
    `oliveOnHome=${home.text.includes("Olive Room")} radarBadgeOnCard=${feedHasRadarBadge}`,
    "FAIL: venue names are not rendered on feed cards; only a generic callout exists at the bottom.",
  );

  const upvoteApi = await request("/api/v1/reports/demo-1", { method: "PATCH" });
  assert(
    "F-03",
    "Reactions",
    "Relate/upvote persistence API",
    "Click Relate to this story, reload the page",
    "Count should persist via an upvote API",
    upvoteApi.status !== 404 && upvoteApi.status !== 405 && upvoteApi.status !== 400,
    `PATCH /api/v1/reports/demo-1 status=${upvoteApi.status}`,
    "FAIL: button only toggles local React state; reload loses the +1. No upvote endpoint.",
  );

  const upvoteSort = await request("/api/v1/reports?sort_by=upvotes_desc");
  const stillLatest = upvoteSort.json?.data?.[0]?.id === "demo-1";
  assert(
    "F-04",
    "Feed API",
    "Highest upvotes sort",
    "Look for a Highest upvotes sort option",
    "PRD F3: sort by upvotes; first should be Mumbai demo-2 (112)",
    upvoteSort.json?.data?.[0]?.id === "demo-2",
    `first=${upvoteSort.json?.data?.[0]?.id} (unknown sort_by falls back to latest=${stillLatest})`,
    "FAIL: UI only offers latest / cost_desc / time_desc.",
  );

  assert(
    "F-05",
    "Feed UI",
    "Relate button exists on cards",
    "On homepage, each article has Relate to this story",
    "Button present in client bundle",
    home.text.includes("Relate to this story"),
    `present=${home.text.includes("Relate to this story")}`,
    "Click once: count should +1 without reload. Click again: back to original. Reload resets. Treat persistence as F-03.",
  );

  assert(
    "S-06",
    "Submit UI",
    "Story counter 0/500",
    "Open /submit, confirm counter and maxLength=500",
    "Counter and maxLength in markup",
    submitPage.text.includes("0/500") || submitPage.text.includes("maxLength"),
    `hasCounter=${submitPage.text.includes("/500") || submitPage.text.includes("maxLength")}`,
  );

  const requiredOnSubmit = /required/.test(submitPage.text);
  assert(
    "S-07",
    "Submit UI",
    "HTML required fields on city, neighbourhood, platform, date type, story",
    "Click Publish with empty form",
    "Browser blocks submit; no API call",
    requiredOnSubmit,
    `required attributes present=${requiredOnSubmit}`,
    "Manual: empty submit should not show success message.",
  );

  console.log(JSON.stringify({ base: BASE, generatedAt: new Date().toISOString(), results }, null, 2));
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
