import { NextResponse } from "next/server";

import { buildMvpReleaseReceipt } from "@/lib/release/mvp-receipt";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(buildMvpReleaseReceipt());
}
