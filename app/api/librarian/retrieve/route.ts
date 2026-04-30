import { NextRequest, NextResponse } from "next/server";

import { retrieveBundle } from "@/lib/librarian/service";

export async function GET(request: NextRequest) {
  const agent = request.nextUrl.searchParams.get("agent") ?? "Geminex";
  const workspace = request.nextUrl.searchParams.get("workspace") ?? "Agent Brain OS";
  const task = request.nextUrl.searchParams.get("task") ?? "Build Librarian MVP";

  const bundle = await retrieveBundle({ agent, workspace, task });
  return NextResponse.json(bundle);
}
