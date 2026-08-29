"use client";

import { FormEvent, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check, CircleAlert, Clock3, FileWarning, MapPin, ShieldCheck, WalletCards } from "lucide-react";

const cities = ["Bangalore", "Mumbai", "Delhi-NCR", "Pune", "Hyderabad", "Kolkata", "Chennai", "Other"];
const platforms = ["Bumble", "Hinge", "Tinder", "Shaadi.com", "Jeevansathi", "Mutual Friend", "Other"];
const tags = [["BILL_INFLATION_SCAM", "Bill trap"], ["TALKED_EXCLUSIVELY_ABOUT_EX", "Ex monologue"], ["UNSOLICITED_PITCH", "Unsolicited pitch"], ["PARENT_ATTENDED", "Family DLC"], ["COMMUTE_DISASTER", "Commute chaos"], ["CATFISH", "Plot twist"], ["GHOSTED", "Vanished"], ["WRONG_VIBE", "Vibes off"], ["EXPENSIVE", "Wallet hurt"]];

export default function SubmitPage() {
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [story, setStory] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  function toggleTag(tag: string) { setSelectedTags((current) => current.includes(tag) ? current.filter((item) => item !== tag) : [...current, tag]); }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setMessage("");
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    if (selectedTags.length === 0) { setMessage("Choose at least one plot twist so the story gets filed correctly."); return; }
    setSubmitting(true);
    const response = await fetch("/api/v1/reports", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ city: form.get("city"), neighborhood: form.get("neighborhood"), platform: form.get("platform"), dateType: form.get("dateType"), expenseInr: form.get("expenseInr"), timeWastedMins: form.get("timeWastedMins"), venueName: form.get("venueName"), disasterTags: selectedTags, storyBody: story }) });
    const data = await response.json(); setSubmitting(false);
    if (!response.ok) { setMessage(data.message ?? "That didn’t land. Check the details and try again."); return; }
    setMessage(data.demo ? "Demo report sent! Connect Postgres when you’re ready to save stories for real." : "Report published anonymously. Thank you for the public service.");
    formRef.current?.reset(); setSelectedTags([]); setStory("");
  }
  return <div className="submit-page site-shell"><Link href="/" className="back-link"><ArrowLeft size={16} /> Back to the feed</Link><div className="submit-layout">
    <aside className="submit-aside"><p className="eyebrow"><FileWarning size={15} /> Incident report</p><h1>Give the group chat the <span>useful version.</span></h1><p>Short, sharp and anonymous. The details help uncover dating patterns and venue bill traps.</p><div className="rule-list"><span><ShieldCheck size={18} /> No account needed</span><span><MapPin size={18} /> City-level only</span><span><CircleAlert size={18} /> Be factual, not cruel</span></div></aside>
    <form ref={formRef} className="report-form" onSubmit={submit}>
      <div className="form-head"><div><span className="form-step">01 · THE BASICS</span><h2>Set the scene</h2></div><span className="required-note">* Required</span></div>
      <div className="form-grid"><label>City*<select name="city" required defaultValue=""><option value="" disabled>Pick a city</option>{cities.map((city) => <option key={city}>{city}</option>)}</select></label><label>Neighbourhood*<input name="neighborhood" required placeholder="e.g. Indiranagar" /></label><label>Where did you meet?*<select name="platform" required defaultValue=""><option value="" disabled>Choose a platform</option>{platforms.map((platform) => <option key={platform}>{platform}</option>)}</select></label><label>Date type*<select name="dateType" required defaultValue=""><option value="" disabled>Select one</option>{["First Date", "Matrimony Meet", "Casual", "Blind Date"].map((type) => <option key={type}>{type}</option>)}</select></label></div>
      <div className="form-divider" /><div className="form-head"><div><span className="form-step">02 · THE DAMAGE</span><h2>What did it cost you?</h2></div></div>
      <div className="form-grid"><label><span><WalletCards size={15} /> Your spend (₹)</span><input name="expenseInr" type="number" min="0" required placeholder="0" /></label><label><span><Clock3 size={15} /> Time lost (minutes)</span><input name="timeWastedMins" type="number" min="0" required placeholder="0" /></label></div><label className="wide-label">Venue name <em>(optional but useful for the Scam Radar)</em><input name="venueName" placeholder="Cafe, lounge, bar…" /></label>
      <div className="form-divider" /><div className="form-head"><div><span className="form-step">03 · THE PLOT TWIST</span><h2>Pick the damage tags*</h2></div></div><div className="tag-picker">{tags.map(([tag, label]) => <button type="button" key={tag} className={selectedTags.includes(tag) ? "picked" : ""} onClick={() => toggleTag(tag)}>{selectedTags.includes(tag) && <Check size={14} />}{label}</button>)}</div>
      <label className="story-label">Your version of events*<textarea required value={story} onChange={(event) => setStory(event.target.value)} maxLength={500} minLength={10} placeholder="What happened? Keep it short, useful, and anonymous." /><span>{story.length}/500</span></label>{message && <p className="form-message">{message}</p>}<button className="submit-button" disabled={submitting}>{submitting ? "Filing the report…" : "Publish anonymously"} <ArrowLeft size={17} className="flip" /></button>
    </form>
  </div></div>;
}
