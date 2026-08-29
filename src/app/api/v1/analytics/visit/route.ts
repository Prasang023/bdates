import { NextRequest, NextResponse } from "next/server";
import { isDemoDatabase } from "@/lib/demo-data";
import { recordVisit } from "@/lib/audience";

export async function POST(req: NextRequest) {
  try {
    if (isDemoDatabase()) return NextResponse.json({ status: "success", demo: true });
    await recordVisit(req);
    return NextResponse.json({ status: "success" });
  } catch (error: unknown) {
    console.error("POST /api/v1/analytics/visit error:", error);
    return NextResponse.json({ status: "error" }, { status: 500 });
  }
}
