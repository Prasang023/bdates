# BadDates.fyi feature test sheet

**Environment:** demo mode (no real `DATABASE_URL`)  
**App:** http://localhost:3000  
**Ran:** 22 Aug 2026, 19:26 IST  
**How to start:** `npm run dev` then open the URL above  
**How to re-run API checks:** `node scripts/run-feature-tests.mjs`

Summary: **32 PASS · 3 FAIL · 35 cases** (demo-mode product surface).

| Result | Count |
|---|---|
| PASS | 32 |
| FAIL | 3 (known product gaps, not server-down) |

Demo seed used for expected numbers: 8 reports in `src/lib/demo-data.ts`.

---

## Pages and navigation

| ID | Feature | Manual steps | Expected | Result | Notes |
|---|---|---|---|---|---|
| P-01 | Homepage loads | Open `/` | Branding “BadDates.fyi”, hero “post-mortem”, feed | **PASS** | HTTP 200 |
| P-02 | Submit page loads | Open `/submit` or nav “Report a date” | Form with “Publish anonymously” | **PASS** | |
| P-03 | Analytics page loads | Open `/analytics` or “City scorecards” | “City dating scorecards” | **PASS** | |
| P-04 | Unknown route | Open `/does-not-exist` | Next.js 404 | **PASS** | HTTP 404 |
| N-01 | Nav: The feed | Click “The feed” | Lands on `/` | **PASS** | |
| N-02 | Nav: City scorecards | Click “City scorecards” | Lands on `/analytics` | **PASS** | |
| N-03 | Nav: Report a date | Click “Report a date” | Lands on `/submit` | **PASS** | |

---

## Feed

After load, wait until “Loading the tea…” is gone and 8 cards appear. A “Demo stories” pill should show.

| ID | Feature | Manual steps | Expected | Result | Notes |
|---|---|---|---|---|---|
| A-01 | Demo feed list | Load `/` | 8 stories, demo pill | **PASS** | `GET /api/v1/reports` returns `demo: true`, 8 rows |
| F-01 | Live damage totals | Read the hero card “LIVE DAMAGE REPORT” | **₹17,250**, **18h 5m**, **8** stories | **PASS** | Totals follow the *current filter*, so they shrink when you filter |
| A-02 | Filter city Bangalore | Filter by city → Bangalore | 4 cards, all Bangalore | **PASS** | |
| A-03 | Filter city Mumbai | Filter by city → Mumbai | 1 card: Bandra, ₹6,100 | **PASS** | |
| A-04 | Empty city | Filter by city → Kolkata | Empty copy: “No disasters here yet…” | **PASS** | API total 0 |
| A-05 | Filter platform Hinge | Reset city to Every city, platform Hinge | 2 Hinge cards | **PASS** | |
| A-06 | Filter tag Bill trap | Disaster tag → Bill trap | 5 cards | **PASS** | |
| A-07 | Combined filters | City Bangalore + platform Bumble + tag Vanished | 1 card (Indiranagar, ghosted / bill trap) | **PASS** | `demo-7` |
| A-08 | Sort most expensive | Sort → Most expensive | First: Mumbai ₹6,100, then Hyderabad ₹3,200 | **PASS** | 6100, 3200, 2450, 2100, 1800, 1600, 1100, 900 |
| A-09 | Sort worst commute | Sort → Worst commute | First: Pune 4h (240 min) | **PASS** | 240, 185, 165, 130, 115, 95, 80, 75 |
| A-10 | Sort newest first | Sort → Newest first | First: Indiranagar crypto-pitch (demo-1) | **PASS** | |
| A-11 | Pagination (API only) | `GET /api/v1/reports?limit=3&page=2` | 3 items, first `demo-4` | **PASS** | No page-2 control on the UI |
| A-12 | Invalid page/limit clamp | `GET /api/v1/reports?page=0&limit=99` | `page=1`, `limit=50` | **PASS** | API only |
| F-02 | Venue warning on feed cards | Look at Bangalore Olive Room stories for a Scam Radar badge | Card should flag watchlisted venues | **FAIL** | Venue name is not on the card; only a generic callout at the bottom |
| F-03 | Relate persists after reload | Click thumbs-up, note count, reload | Count should stay +1 | **FAIL** | Local React state only; no upvote API (`PATCH` → 404) |
| F-04 | Sort by highest upvotes | Look for a Highest upvotes sort | First should be Mumbai (112) | **FAIL** | UI only has newest / cost / commute |
| F-05 | Relate button on cards | After cards load, each card has a thumbs-up | Button labelled “Relate to this story”; click +1, click again back | **PASS** | Client-hydrated; click does not persist (see F-03) |

---

## Submit

Use `/submit`. Required: city, neighbourhood, platform, date type, at least one tag, story 10–500 chars.

Happy-path values used in automation:

- City: Bangalore  
- Neighbourhood: HSR Layout  
- Meet: Hinge  
- Date type: First Date  
- Spend: 850  
- Time: 60  
- Tag: Vibes off  
- Story: any sentence ≥10 characters  

| ID | Feature | Manual steps | Expected | Result | Notes |
|---|---|---|---|---|---|
| S-01 | Valid demo submit | Fill happy path, Publish anonymously | Success: “Demo report sent! Connect Postgres…” | **PASS** | API 201 `demo: true`. UI copy may say “Demo report sent!” vs API “Demo report submitted…” — both mean success |
| S-02 | Demo is not saved | After S-01, open `/` | Still 8 stories; yours is missing | **PASS** | Expected until Postgres is connected |
| S-03 | Incomplete payload | POST with only `{ "city": "Bangalore" }` or skip fields via API | 400 “Missing required fields” | **PASS** | |
| S-04 | No tags | Leave tags empty and publish (UI) or POST `disasterTags: []` | UI: “Choose at least one plot twist…”; API: 400 | **PASS** | |
| S-05 | Story over 500 chars | Textarea is capped at 500; API with 501 chars | Browser prevents extra chars; API 400 | **PASS** | |
| S-06 | 0/500 counter | Type in the story box | Counter updates `n/500` | **PASS** | |
| S-07 | Empty form blocked | Click Publish with nothing filled | Browser required-field tooltip; no success message | **PASS** | `required` on city, neighbourhood, platform, date type, spend, time, story |

UI success message after S-01 should also **clear the form** (neighbourhood empty, tags unselected). Confirm visually.

---

## Analytics and Scam Radar

| ID | Feature | Manual steps | Expected | Result | Notes |
|---|---|---|---|---|---|
| AN-01 | Average cost per city | Open `/analytics`, CITY VS WALLET | Mumbai ₹6,100 · Hyderabad ₹3,200 · Bangalore ₹1,813 · Pune ₹1,800 · Delhi-NCR ₹900 | **PASS** | Bangalore avg is 7250/4 = 1812.5 → 1813 |
| AN-02 | Platform ranking | WHERE IT STARTED | Hinge 2, Bumble 2, Tinder 2, Mutual Friend 1, Shaadi.com 1 | **PASS** | Top slot is Hinge (tied at 2) |
| AN-03 | Scam Radar watchlist | SCAM RADAR section | **The Olive Room · Bangalore · 3 reports** only | **PASS** | Threshold is 3 bill-trap reports. Pune Olive Room (1) and Velvet Room (1) stay off |
| AN-04 | Metric strip | Top of analytics | Top average spend **₹6,100** · Scam Radar alerts **1** · Platform with the most lore **Hinge** | **PASS** | Demo pill: “Demo stories · connect a database to go live” |

---

## Failures to re-check later (product gaps)

1. **F-02** — Feed cards never show venue names or a watchlist badge.  
2. **F-03** — Relate/upvote is local-only; reload resets it.  
3. **F-04** — No “highest upvotes” sort.

These are not environment failures. The app is running in demo mode as designed.

---

## Out of scope this run

- PostgreSQL persistence (`DATABASE_URL` + `npx drizzle-kit push`)  
- Rate limiting / PII scrubber (explicitly skipped in the original PRD)  
- Production DB watchlist (`count(*) > 3` in SQL vs `>= 3` in demo — mismatch if you later go live)
