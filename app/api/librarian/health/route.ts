import { NextResponse } from "next/server";

import { buildHealthPayload } from "@/lib/librarian/service";

export async function GET() {
  return NextResponse.json(buildHealthPayload());
}
