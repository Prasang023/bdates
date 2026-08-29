import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { dateReports } from "@/db/schema";
import { and, eq, desc, sql } from "drizzle-orm";
import crypto from "crypto";
import { demoReports, isDemoDatabase } from "@/lib/demo-data";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const city = searchParams.get("city");
    const platform = searchParams.get("platform");
    const tag = searchParams.get("tag");
    const sortBy = searchParams.get("sort_by") || "latest";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    const safePage = Number.isFinite(page) && page > 0 ? page : 1;
    const safeLimit = Number.isFinite(limit) ? Math.min(Math.max(limit, 1), 50) : 20;
    const offset = (safePage - 1) * safeLimit;

    if (isDemoDatabase()) {
      const filtered = demoReports
        .filter((report) => !city || report.city === city)
        .filter((report) => !platform || report.platform === platform)
        .filter((report) => !tag || report.disasterTags.includes(tag))
        .sort((a, b) => sortBy === "cost_desc" ? b.expenseInr - a.expenseInr : sortBy === "time_desc" ? b.timeWastedMins - a.timeWastedMins : +new Date(b.createdAt) - +new Date(a.createdAt));
      return NextResponse.json({ page: safePage, limit: safeLimit, total: filtered.length, demo: true, data: filtered.slice(offset, offset + safeLimit) });
    }

    // Build filters
    const filters = [];
    filters.push(eq(dateReports.isApproved, true));
    if (city) filters.push(eq(dateReports.city, city));
    if (platform) filters.push(eq(dateReports.platform, platform));
    if (tag) {
      filters.push(sql`${dateReports.disasterTags} @> ARRAY[${tag}]::text[]`);
    }

    // Determine sorting
    let orderClause;
    switch (sortBy) {
      case "cost_desc":
        orderClause = desc(dateReports.expenseInr);
        break;
      case "time_desc":
        orderClause = desc(dateReports.timeWastedMins);
        break;
      case "latest":
      default:
        orderClause = desc(dateReports.createdAt);
        break;
    }

    const data = await db.query.dateReports.findMany({
      where: filters.length > 0 ? and(...filters) : undefined,
      orderBy: [orderClause],
      limit: safeLimit,
      offset: offset,
    });

    const total = await db.select({ count: sql`count(*)` }).from(dateReports)
      .where(filters.length > 0 ? and(...filters) : undefined);

    return NextResponse.json({
      page: safePage,
      limit: safeLimit,
      total: parseInt(total[0]?.count as string || "0"),
      data,
    });

  } catch (error: unknown) {
    console.error("GET /api/v1/reports error:", error);
    return NextResponse.json(
      { status: "error", message: error instanceof Error ? error.message : "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      city,
      neighborhood,
      platform,
      dateType,
      expenseInr,
      timeWastedMins,
      venueName,
      disasterTags,
      storyBody,
    } = body;

    // Basic validation
    if (!city || !neighborhood || !platform || !dateType || !storyBody || !Array.isArray(disasterTags) || disasterTags.length === 0 || String(storyBody).length > 500) {
      return NextResponse.json(
        { status: "error", message: "Missing required fields" },
        { status: 400 }
      );
    }

    if (isDemoDatabase()) {
      return NextResponse.json({ status: "success", id: `demo-${crypto.randomUUID()}`, demo: true, message: "Demo report submitted — connect Postgres to save reports permanently." }, { status: 201 });
    }

    // IP Hashing for anonymity. NextRequest has no req.ip in Next.js 16.
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
    const salt = process.env.SALT || "default_salt";
    const hashedIp = crypto.createHash("sha256").update(ip + salt).digest("hex");

    // Insert into database
    const result = await db.insert(dateReports).values({
      city,
      neighborhood,
      platform,
      dateType,
      expenseInr: Number(expenseInr) || 0,
      timeWastedMins: Number(timeWastedMins) || 0,
      venueName,
      disasterTags,
      storyBody,
      ipHash: hashedIp,
    }).returning({ id: dateReports.id });

    if (!result || result.length === 0) {
      throw new Error("Failed to create report");
    }

    return NextResponse.json({
      status: "success",
      id: result[0].id,
      message: "Report published anonymously.",
    }, { status: 201 });

  } catch (error: unknown) {
    console.error("POST /api/v1/reports error:", error);
    return NextResponse.json(
      { status: "error", message: error instanceof Error ? error.message : "Internal Server Error" },
      { status: 500 }
    );
  }
}
