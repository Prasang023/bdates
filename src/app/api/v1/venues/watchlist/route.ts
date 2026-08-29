import { NextResponse } from "next/server";
import { db } from "@/db";
import { dateReports } from "@/db/schema";
import { sql, count } from "drizzle-orm";
import { demoReports, isDemoDatabase, normaliseVenue } from "@/lib/demo-data";

export async function GET() {
  try {
    if (isDemoDatabase()) {
      const grouped = new Map<string, { venue: string; city: string; reportCount: number }>();
      for (const report of demoReports.filter((item) => item.venueName && item.disasterTags.includes("BILL_INFLATION_SCAM"))) {
        const key = `${report.city}-${normaliseVenue(report.venueName)}`;
        const current = grouped.get(key) ?? { venue: report.venueName!, city: report.city, reportCount: 0 };
        current.reportCount += 1;
        grouped.set(key, current);
      }
      return NextResponse.json({ status: "success", demo: true, data: [...grouped.values()].filter((venue) => venue.reportCount >= 3) });
    }

    const results = await db
      .select({
        venue: dateReports.venueName,
        city: dateReports.city,
        reportCount: count(),
      })
      .from(dateReports)
      .where(sql`${dateReports.venueName} IS NOT NULL AND ${dateReports.disasterTags} @> ARRAY['BILL_INFLATION_SCAM']::text[]`)
      .groupBy(dateReports.venueName, dateReports.city)
      .having(sql`count(*) > 3`);

    return NextResponse.json({
      status: "success",
      data: results,
    });

  } catch (error: unknown) {
    console.error("GET /api/v1/venues/watchlist error:", error);
    return NextResponse.json(
      { status: "error", message: error instanceof Error ? error.message : "Internal Server Error" },
      { status: 500 }
    );
  }
}
