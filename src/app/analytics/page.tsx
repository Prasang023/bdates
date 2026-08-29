"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, ArrowRight, BarChart3, Clock3, MapPin, Radar, ReceiptText, WalletCards } from "lucide-react";

type Analytics = { avgCosts: { city: string; avgExpense: number | string }[]; platformStats: { platform: string; count: number | string }[] };
type WatchVenue = { venue: string; city: string; reportCount: number };

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [watchlist, setWatchlist] = useState<WatchVenue[]>([]);
  const [demo, setDemo] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/v1/analytics/city-summary").then((response) => response.json()),
      fetch("/api/v1/venues/watchlist").then((response) => response.json()),
    ]).then(([cityData, venueData]) => {
      setAnalytics(cityData.data);
      setWatchlist(venueData.data ?? []);
      setDemo(Boolean(cityData.demo));
    });
  }, []);

  const highest = useMemo(() => Math.max(...(analytics?.avgCosts.map((item) => Number(item.avgExpense)) ?? [1])), [analytics]);
  if (!analytics) return <div className="analytics-page site-shell"><div className="empty-state">Crunching the dating numbers…</div></div>;

  return <div className="analytics-page site-shell">
    <div className="analytics-hero"><div><p className="eyebrow"><BarChart3 size={15} /> The public debrief</p><h1>City dating <span>scorecards.</span></h1><p>Where wallet damage rises, commutes spiral, and suspicious venues get the side-eye.</p></div>{demo && <span className="demo-pill">Demo stories · connect a database to go live</span>}</div>
    <div className="metric-strip">
      <div><WalletCards /><span>Top average spend</span><strong>₹{highest.toLocaleString("en-IN")}</strong></div>
      <div><Clock3 /><span>Platform with the most lore</span><strong>{analytics.platformStats[0]?.platform ?? "—"}</strong></div>
      <div><ReceiptText /><span>Scam Radar alerts</span><strong>{watchlist.length}</strong></div>
    </div>
    <div className="analytics-grid"><section className="analytics-card cost-card"><div className="card-title"><div><span className="form-step">CITY VS WALLET</span><h2>Average cost per bad date</h2></div><WalletCards /></div><div className="bar-list">{analytics.avgCosts.sort((a, b) => Number(b.avgExpense) - Number(a.avgExpense)).map((item) => <div className="bar-row" key={item.city}><span>{item.city}</span><div className="bar-track"><i style={{ width: (Number(item.avgExpense) / highest) * 100 + "%" }} /></div><strong>₹{Math.round(Number(item.avgExpense)).toLocaleString("en-IN")}</strong></div>)}</div></section>
      <section className="analytics-card"><div className="card-title"><div><span className="form-step">WHERE IT STARTED</span><h2>Platform plot twists</h2></div><Radar /></div><div className="platform-list">{analytics.platformStats.map((item, index) => <div key={item.platform}><span className="rank">0{index + 1}</span><span>{item.platform}</span><strong>{item.count} <em>reports</em></strong></div>)}</div></section></div>
    <section className="radar-card"><div className="radar-title"><div className="radar-icon"><AlertTriangle size={22} /></div><div><span className="form-step">SCAM RADAR</span><h2>Venue watchlist</h2><p>Three or more independent bill-trap reports trigger a warning.</p></div></div>{watchlist.length === 0 ? <p className="radar-empty">No venues on the radar yet. The city is either safe—or under-reported.</p> : <div className="venue-list">{watchlist.map((venue) => <div className="venue-item" key={venue.city + "-" + venue.venue}><div><strong>{venue.venue}</strong><span><MapPin size={14} /> {venue.city}</span></div><b>{venue.reportCount} reports</b></div>)}</div>}</section>
    <Link href="/submit" className="analytics-cta">Got data for the scorecard? Report it <ArrowRight size={17} /></Link>
  </div>;
}
