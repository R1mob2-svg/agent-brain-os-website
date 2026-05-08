import { NextRequest, NextResponse } from "next/server";

import { stageCandidateMemoryUpdate } from "@/lib/librarian/service";

export async function POST(request: NextRequest) {
  const body = (await request.json()) as {
    agent?: string;
    workspace?: string;
    proposedPath?: string;
    title?: string;
    content?: string;
    rationale?: string;
  };

  const result = stageCandidateMemoryUpdate({
    agent: body.agent ?? "Geminex",
    workspace: body.workspace ?? "Agent Brain OS",
    proposedPath:
      body.proposedPath ?? "Agents/Geminex/Candidates/agent-brain-os-librarian-mvp.md",
    title: body.title ?? "Untitled candidate",
    content: body.content ?? "",
    rationale: body.rationale ?? "No rationale provided."
  });

  return NextResponse.json(result);
}
