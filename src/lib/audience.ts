import crypto from "crypto";
import { eq, sql } from "drizzle-orm";
import { NextRequest } from "next/server";
import { db } from "@/db";
import { siteVisitors } from "@/db/schema";

const BOT_HINT = /bot|crawl|spider|slurp|preview|facebookexternalhit|whatsapp|telegram/i;

function clientIp(req: NextRequest) {
  const forwarded = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || req.headers.get("x-real-ip")?.trim() || "127.0.0.1";
}

function isPrivateIp(ip: string) {
  if (ip === "127.0.0.1" || ip === "::1" || ip === "::ffff:127.0.0.1" || ip.startsWith("10.") || ip.startsWith("192.168.") || ip.startsWith("127.")) return true;
  const match = ip.match(/^172\.(\d+)\./);
  return Boolean(match && Number(match[1]) >= 16 && Number(match[1]) <= 31);
}

function hashIp(ip: string) {
  return crypto.createHash("sha256").update(`audience:${ip}:${process.env.SALT || "default_salt"}`).digest("hex");
}

function headerGeo(req: NextRequest) {
  const country = req.headers.get("x-vercel-ip-country") || req.headers.get("cf-ipcountry");
  const region = req.headers.get("x-vercel-ip-country-region") || req.headers.get("x-vercel-ip-region");
  const city = req.headers.get("x-vercel-ip-city");
  if (!country && !city) return null;
  return {
    country: decodeURIComponent(country || "Unknown"),
    region: region ? decodeURIComponent(region) : null,
    city: city ? decodeURIComponent(city) : null,
  };
}

async function lookupGeo(ip: string) {
  if (isPrivateIp(ip)) return { country: "Local", region: null, city: "Local" };
  try {
    const response = await fetch(`https://ipwho.is/${encodeURIComponent(ip)}?fields=success,country,region,city`, { cache: "no-store" });
    if (!response.ok) return { country: "Unknown", region: null, city: null };
    const data = await response.json() as { success?: boolean; country?: string; region?: string; city?: string };
    if (!data.success) return { country: "Unknown", region: null, city: null };
    return { country: data.country || "Unknown", region: data.region || null, city: data.city || null };
  } catch {
    return { country: "Unknown", region: null, city: null };
  }
}

export async function recordVisit(req: NextRequest) {
  const agent = req.headers.get("user-agent") || "";
  if (BOT_HINT.test(agent)) return { skipped: true as const };

  const ip = clientIp(req);
  const ipHash = hashIp(ip);
  const [existing] = await db.select().from(siteVisitors).where(eq(siteVisitors.ipHash, ipHash)).limit(1);
  const geo = existing ? { country: existing.country, region: existing.region, city: existing.city } : (headerGeo(req) ?? await lookupGeo(ip));

  await db.execute(sql`
    insert into site_visitors (ip_hash, country, region, city, visit_count, first_seen_at, last_seen_at)
    values (${ipHash}, ${geo.country}, ${geo.region}, ${geo.city}, 1, now(), now())
    on conflict (ip_hash) do update set
      visit_count = case
        when site_visitors.last_seen_at < now() - interval '15 seconds' then site_visitors.visit_count + 1
        else site_visitors.visit_count
      end,
      last_seen_at = now()
  `);

  return { skipped: false as const };
}

export async function audienceSummary() {
  const [totals] = await db
    .select({
      uniqueVisitors: sql<number>`count(*)::int`,
      visits: sql<number>`coalesce(sum(${siteVisitors.visitCount}), 0)::int`,
    })
    .from(siteVisitors);

  const byCountry = await db
    .select({
      country: siteVisitors.country,
      visitors: sql<number>`count(*)::int`,
      visits: sql<number>`coalesce(sum(${siteVisitors.visitCount}), 0)::int`,
    })
    .from(siteVisitors)
    .groupBy(siteVisitors.country)
    .orderBy(sql`count(*) desc`)
    .limit(12);

  const byCity = await db
    .select({
      city: sql<string>`coalesce(${siteVisitors.city}, 'Unknown')`,
      country: siteVisitors.country,
      visitors: sql<number>`count(*)::int`,
      visits: sql<number>`coalesce(sum(${siteVisitors.visitCount}), 0)::int`,
    })
    .from(siteVisitors)
    .groupBy(sql`coalesce(${siteVisitors.city}, 'Unknown')`, siteVisitors.country)
    .orderBy(sql`count(*) desc`)
    .limit(12);

  return {
    uniqueVisitors: Number(totals?.uniqueVisitors ?? 0),
    visits: Number(totals?.visits ?? 0),
    byCountry,
    byCity,
  };
}
