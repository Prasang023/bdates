"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Clock3, Flame, MapPin, ReceiptText, ShieldAlert, Sparkles, ThumbsUp, WalletCards } from "lucide-react";
import type { Report } from "@/lib/demo-data";

const PAGE_SIZE = 12;
const cities = ["Bangalore", "Mumbai", "Delhi-NCR", "Pune", "Hyderabad", "Kolkata", "Chennai"];
const platforms = ["Bumble", "Hinge", "Tinder", "Shaadi.com", "Jeevansathi", "Mutual Friend"];
const tags = ["BILL_INFLATION_SCAM", "TALKED_EXCLUSIVELY_ABOUT_EX", "UNSOLICITED_PITCH", "PARENT_ATTENDED", "COMMUTE_DISASTER", "CATFISH", "GHOSTED", "WRONG_VIBE", "EXPENSIVE"];
const tagLabels: Record<string, string> = { BILL_INFLATION_SCAM: "Bill trap", TALKED_EXCLUSIVELY_ABOUT_EX: "Ex monologue", UNSOLICITED_PITCH: "Pitch detected", PARENT_ATTENDED: "Family DLC", COMMUTE_DISASTER: "Commute chaos", CATFISH: "Plot twist", GHOSTED: "Vanished", WRONG_VIBE: "Vibes off", EXPENSIVE: "Wallet hurt" };
function formatTime(minutes: number) { return minutes >= 60 ? Math.floor(minutes / 60) + "h " + (minutes % 60 ? minutes % 60 + "m" : "") : minutes + "m"; }

type Totals = { reports: number; expenseInr: number; timeWastedMins: number };

export default function FeedPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [totals, setTotals] = useState<Totals>({ reports: 0, expenseInr: 0, timeWastedMins: 0 });
  const [matching, setMatching] = useState(0);
  const [page, setPage] = useState(1);
  const [isDemo, setIsDemo] = useState(false);
  const [city, setCity] = useState("all");
  const [platform, setPlatform] = useState("all");
  const [tag, setTag] = useState("all");
  const [sortBy, setSortBy] = useState("latest");
  const [loading, setLoading] = useState(true);
  const [reacted, setReacted] = useState<Record<string, boolean>>({});
  const feedTop = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/v1/analytics/totals", { signal: controller.signal })
      .then((response) => response.json())
      .then((data) => { if (data.data) setTotals(data.data); })
      .catch((error) => { if (!(error instanceof DOMException && error.name === "AbortError")) throw error; });
    return () => controller.abort();
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      setLoading(true);
      const params = new URLSearchParams({ limit: String(PAGE_SIZE), page: String(page), sort_by: sortBy });
      if (city !== "all") params.set("city", city);
      if (platform !== "all") params.set("platform", platform);
      if (tag !== "all") params.set("tag", tag);
      try {
        const response = await fetch("/api/v1/reports?" + params, { signal: controller.signal });
        const data = await response.json();
        setReports(data.data ?? []);
        setMatching(Number(data.total ?? 0));
        setIsDemo(Boolean(data.demo));
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
      } finally { setLoading(false); }
    }
    load(); return () => controller.abort();
  }, [city, platform, tag, sortBy, page]);
  const lastPage = Math.max(1, Math.ceil(matching / PAGE_SIZE));
  const isFiltered = city !== "all" || platform !== "all" || tag !== "all";
  function applyFilter(apply: (value: string) => void, value: string) { apply(value); setPage(1); }
  function goToPage(next: number) {
    setPage(Math.min(Math.max(next, 1), lastPage));
    feedTop.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }
  return <div className="page-wrap">
    <section className="hero site-shell"><div className="hero-copy"><p className="eyebrow"><Sparkles size={15} /> India&apos;s anonymous dating debrief</p><h1>Some dates deserve a <span>post-mortem.</span></h1><p className="hero-lede">Tell the story, save someone else the bill, and let the city&apos;s dating lore write itself.</p><div className="hero-actions"><Link href="/submit" className="button-primary">Confess a disaster <ArrowRight size={17} /></Link><Link href="/analytics" className="button-secondary">See the city scorecards</Link></div><div className="hero-note"><ShieldAlert size={15} /> Anonymous by default. No login, no awkward receipts.</div></div><aside className="hero-card" aria-label="Total dating damage reported"><div className="hero-card-top"><span className="live-dot" /> LIVE DAMAGE REPORT</div><p className="damage-number">₹{totals.expenseInr.toLocaleString("en-IN")}</p><p className="damage-label">reported wallet damage across every story</p><div className="damage-grid"><div><Clock3 size={17} /><strong>{formatTime(totals.timeWastedMins)}</strong><span>time lost</span></div><div><Flame size={17} /><strong>{totals.reports.toLocaleString("en-IN")}</strong><span>stories spilling</span></div></div></aside></section>
    <section className="site-shell feed-section"><div className="section-heading" ref={feedTop}><div><p className="eyebrow"><Flame size={15} /> Fresh from the group chat</p><h2>Latest disasters</h2></div>{isDemo ? <span className="demo-pill"><Sparkles size={14} /> Demo stories</span> : matching > 0 && <span className="demo-pill">{isFiltered ? matching.toLocaleString("en-IN") + " matching" : matching.toLocaleString("en-IN") + " stories"}</span>}</div><div className="filters" aria-label="Filter reports"><select value={city} onChange={(event) => applyFilter(setCity, event.target.value)} aria-label="Filter by city"><option value="all">Every city</option>{cities.map((item) => <option key={item}>{item}</option>)}</select><select value={platform} onChange={(event) => applyFilter(setPlatform, event.target.value)} aria-label="Filter by platform"><option value="all">Every platform</option>{platforms.map((item) => <option key={item}>{item}</option>)}</select><select value={tag} onChange={(event) => applyFilter(setTag, event.target.value)} aria-label="Filter by disaster tag"><option value="all">Any plot twist</option>{tags.map((item) => <option key={item} value={item}>{tagLabels[item]}</option>)}</select><select value={sortBy} onChange={(event) => applyFilter(setSortBy, event.target.value)} aria-label="Sort reports"><option value="latest">Newest first</option><option value="cost_desc">Most expensive</option><option value="time_desc">Worst commute</option></select></div>
      {loading ? <div className="empty-state">Loading the tea…</div> : reports.length === 0 ? <div className="empty-state">No disasters here yet. That&apos;s either lucky or suspicious.</div> : <div className="report-grid">{reports.map((report, index) => <article className={"report-card report-card-" + index % 3} key={report.id}><div className="report-meta"><span><MapPin size={14} /> {report.neighborhood || report.city}, {report.city}</span><span>{report.platform}</span></div><p className="report-story">“{report.storyBody}”</p><div className="tag-row">{report.disasterTags.map((item) => <span className="tag" key={item}>{tagLabels[item] ?? item.replaceAll("_", " ")}</span>)}</div><div className="report-footer"><div className="costs"><span><WalletCards size={15} /> ₹{report.expenseInr.toLocaleString("en-IN")}</span><span><Clock3 size={15} /> {formatTime(report.timeWastedMins)}</span></div><button className={"reaction " + (reacted[report.id] ? "reaction-active" : "")} onClick={() => setReacted((value) => ({ ...value, [report.id]: !value[report.id] }))} aria-label="Relate to this story"><ThumbsUp size={15} /> {report.upvotes + (reacted[report.id] ? 1 : 0)}</button></div></article>)}</div>}
      {!loading && lastPage > 1 && <nav className="pagination" aria-label="Feed pages"><button onClick={() => goToPage(page - 1)} disabled={page <= 1}><ArrowLeft size={15} /> Newer</button><span aria-live="polite">Page {page.toLocaleString("en-IN")} of {lastPage.toLocaleString("en-IN")}</span><button onClick={() => goToPage(page + 1)} disabled={page >= lastPage}>Older <ArrowRight size={15} /></button></nav>}</section>
    <section className="callout site-shell"><ReceiptText size={25} /><div><strong>Seen a bill-trap venue?</strong><span>Leave a report with the venue name. Three independent reports put it on the Scam Radar.</span></div><Link href="/submit">File it <ArrowRight size={16} /></Link></section>
  </div>;
}
