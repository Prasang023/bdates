export type Report = {
  id: string;
  createdAt: string;
  city: string;
  neighborhood: string | null;
  platform: string;
  dateType: string;
  expenseInr: number;
  timeWastedMins: number;
  venueName: string | null;
  disasterTags: string[];
  storyBody: string;
  upvotes: number;
};

export const demoReports: Report[] = [
  { id: "demo-1", createdAt: "2026-08-20T09:30:00Z", city: "Bangalore", neighborhood: "Indiranagar", platform: "Hinge", dateType: "First Date", expenseInr: 2450, timeWastedMins: 185, venueName: "The Olive Room", disasterTags: ["UNSOLICITED_PITCH", "COMMUTE_DISASTER"], storyBody: "The first 20 minutes were charming. The next 90 were a pitch deck for an AI-powered crypto loyalty club. I paid for the shared fries and the auto surge fare.", upvotes: 48 },
  { id: "demo-2", createdAt: "2026-08-20T07:15:00Z", city: "Mumbai", neighborhood: "Bandra", platform: "Bumble", dateType: "Casual", expenseInr: 6100, timeWastedMins: 130, venueName: "Velvet Room", disasterTags: ["BILL_INFLATION_SCAM", "EXPENSIVE"], storyBody: "The menu had no prices, the bill had plenty. Two mocktails somehow became a life lesson in checking Google reviews before saying yes to a rooftop bar.", upvotes: 112 },
  { id: "demo-3", createdAt: "2026-08-19T20:00:00Z", city: "Delhi-NCR", neighborhood: "Cyber Hub", platform: "Tinder", dateType: "First Date", expenseInr: 900, timeWastedMins: 75, venueName: null, disasterTags: ["TALKED_EXCLUSIVELY_ABOUT_EX", "WRONG_VIBE"], storyBody: "He had a spreadsheet of every ex, ranked by how badly they had wronged him. I left before we reached Q4.", upvotes: 67 },
  { id: "demo-4", createdAt: "2026-08-19T16:40:00Z", city: "Pune", neighborhood: "Koregaon Park", platform: "Mutual Friend", dateType: "Blind Date", expenseInr: 1800, timeWastedMins: 240, venueName: "The Olive Room", disasterTags: ["BILL_INFLATION_SCAM", "CATFISH"], storyBody: "The photos were clearly from another decade and the venue pushed a package that was never mentioned. My wallet and my faith needed recovery time.", upvotes: 39 },
  { id: "demo-5", createdAt: "2026-08-18T14:10:00Z", city: "Hyderabad", neighborhood: "Jubilee Hills", platform: "Shaadi.com", dateType: "Matrimony Meet", expenseInr: 3200, timeWastedMins: 165, venueName: null, disasterTags: ["PARENT_ATTENDED", "WRONG_VIBE"], storyBody: "I expected one date. I got an interview panel, a family WhatsApp group invitation, and a conversation about my five-year plan.", upvotes: 83 },
  { id: "demo-6", createdAt: "2026-08-18T10:00:00Z", city: "Bangalore", neighborhood: "Koramangala", platform: "Hinge", dateType: "First Date", expenseInr: 1100, timeWastedMins: 95, venueName: "The Olive Room", disasterTags: ["BILL_INFLATION_SCAM"], storyBody: "A friendly bartender recommended an off-menu tasting. The surprise was that the surprise cost more than the actual dinner.", upvotes: 24 },
  { id: "demo-7", createdAt: "2026-08-17T19:00:00Z", city: "Bangalore", neighborhood: "Indiranagar", platform: "Bumble", dateType: "Casual", expenseInr: 2100, timeWastedMins: 115, venueName: "The Olive Room", disasterTags: ["BILL_INFLATION_SCAM", "GHOSTED"], storyBody: "The date vanished right before the bill arrived. The venue was oddly unsurprised when I asked why every item had a service add-on.", upvotes: 91 },
  { id: "demo-8", createdAt: "2026-08-16T18:25:00Z", city: "Bangalore", neighborhood: "Indiranagar", platform: "Tinder", dateType: "Casual", expenseInr: 1600, timeWastedMins: 80, venueName: "The Olive Room", disasterTags: ["BILL_INFLATION_SCAM"], storyBody: "The date was fine; the invoice had a surprise cover charge, a service charge, and an unexplained late-evening charge.", upvotes: 58 },
];

export function normaliseVenue(value: string | null) {
  return value?.trim().toLocaleLowerCase() ?? "";
}

export function isDemoDatabase() {
  return !process.env.DATABASE_URL || process.env.DATABASE_URL.includes("user:password");
}
