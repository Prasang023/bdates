import Link from "next/link";
import { BarChart3, HeartCrack, Plus } from "lucide-react";

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="site-shell header-inner">
        <Link href="/" className="brand" aria-label="BadDates home">
          <span className="brand-mark"><HeartCrack size={19} strokeWidth={2.5} /></span>
          <span>BadDates<span className="brand-dot">.fyi</span></span>
        </Link>
        <nav className="main-nav" aria-label="Main navigation">
          <Link href="/" className="nav-link">The feed</Link>
          <Link href="/analytics" className="nav-link"><BarChart3 size={16} /> City scorecards</Link>
          <Link href="/submit" className="report-button"><Plus size={17} /> Report a date</Link>
        </nav>
      </div>
    </header>
  );
}
