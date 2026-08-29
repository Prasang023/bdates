import { NextResponse } from "next/server";
import { db } from "@/db";
import { dateReports } from "@/db/schema";
import { sql, avg, count } from "drizzle-orm";
import { demoReports, isDemoDatabase } from "@/lib/demo-data";

export async function GET() {
  try {
    if (isDemoDatabase()) {
      const cityMap = new Map<string, number[]>();
      const platformMap = new Map<string, number>();
      for (const report of demoReports) {
        cityMap.set(report.city, [...(cityMap.get(report.city) ?? []), report.expenseInr]);
        platformMap.set(report.platform, (platformMap.get(report.platform) ?? 0) + 1);
      }
      return NextResponse.json({ status: "success", demo: true, data: {
        avgCosts: [...cityMap].map(([city, expenses]) => ({ city, avgExpense: Math.round(expenses.reduce((sum, value) => sum + value, 0) / expenses.length) })),
        platformStats: [...platformMap].map(([platform, reportCount]) => ({ platform, count: reportCount })).sort((a, b) => b.count - a.count),
      }});
    }

    // 1. Average cost per city
    const avgCosts = await db
      .select({
        city: dateReports.city,
        avgExpense: avg(dateReports.expenseInr),
      })
      .from(dateReports)
      .groupBy(dateReports.city);

    // 2. Top platforms per city (simplified: overall top platforms)
    const platformStats = await db
      .select({
        platform: dateReports.platform,
        count: count(),
      })
      .from(dateReports)
      .groupBy(dateReports.platform)
      .orderBy(sql`count DESC`);

    return NextResponse.json({
      status: "success",
      data: {
        avgCosts,
        platformStats,
      },
    });

  } catch (error: unknown) {
    console.error("GET /api/v1/analytics/city-summary error:", error);
    return NextResponse.json(
      { status: "error", message: error instanceof Error ? error.message : "Internal Server Error" },
      { status: 500 }
    );
  }
}
