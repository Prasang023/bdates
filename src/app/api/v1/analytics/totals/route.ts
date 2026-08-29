import { NextResponse } from "next/server";
import { db } from "@/db";
import { dateReports } from "@/db/schema";
import { count, eq, sql } from "drizzle-orm";
import { demoReports, isDemoDatabase } from "@/lib/demo-data";

export async function GET() {
  try {
    if (isDemoDatabase()) {
      return NextResponse.json({
        status: "success",
        demo: true,
        data: {
          reports: demoReports.length,
          expenseInr: demoReports.reduce((sum, report) => sum + report.expenseInr, 0),
          timeWastedMins: demoReports.reduce((sum, report) => sum + report.timeWastedMins, 0),
        },
      });
    }

    const [totals] = await db
      .select({
        reports: count(),
        expenseInr: sql<string>`coalesce(sum(${dateReports.expenseInr}), 0)`,
        timeWastedMins: sql<string>`coalesce(sum(${dateReports.timeWastedMins}), 0)`,
      })
      .from(dateReports)
      .where(eq(dateReports.isApproved, true));

    return NextResponse.json({
      status: "success",
      data: {
        reports: Number(totals?.reports ?? 0),
        expenseInr: Number(totals?.expenseInr ?? 0),
        timeWastedMins: Number(totals?.timeWastedMins ?? 0),
      },
    });

  } catch (error: unknown) {
    console.error("GET /api/v1/analytics/totals error:", error);
    return NextResponse.json(
      { status: "error", message: error instanceof Error ? error.message : "Internal Server Error" },
      { status: 500 }
    );
  }
}
