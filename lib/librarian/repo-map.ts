import type { BundleDefinition } from "@/lib/librarian/types";

export const AGENT_BRAIN_REPO = "R1mob2-svg/global-agent-brain";
export const AGENT_BRAIN_BRANCH = "main";

export const ALLOWED_ROOTS = [
  "Doctrine/",
  "Agents/",
  "Projects/",
  "Clients/",
  "ClientProjects/",
  "Products/",
  "Website_Build_OS/"
] as const;

export const BLOCKED_ROOTS = [
  ".env",
  ".vercel",
  "Shared/",
  "Shared_Doctrine/",
  "Bootstrap/",
  "Agents/Newton/",
  "Agents/Chantelle/"
] as const;

export const BUNDLE_DEFINITIONS: BundleDefinition[] = [
  {
    id: "geminex-agent-brain-os-librarian-mvp",
    agent: "Geminex",
    workspace: "Agent Brain OS",
    task: "Build Librarian MVP",
    title: "Geminex -> Agent Brain OS Librarian MVP",
    summary: "The bounded bundle Newton dropped for turning the static site into a Librarian MVP app.",
    selected: [
      {
        path: "Doctrine/AGENT_BRAIN_OS_BOOT_PROTOCOL.md",
        reason: "Boot law for the web app control plane."
      },
      {
        path: "Doctrine/GLOBAL_AGENT_DOCTRINE.md",
        reason: "Core operating doctrine for truth, receipts, and bounded behavior."
      },
      {
        path: "Doctrine/RELEASESEAL_AND_PACKAGING_DOCTRINE.md",
        reason: "Customer-safe packaging and proof boundaries."
      },
      {
        path: "Agents/Geminex/Inbox/FromNewton/2026-04-30_AGENT_BRAIN_OS_LIBRARIAN_MVP_POINTER.md",
        reason: "The exact Newton pointer for this MVP upgrade."
      }
    ],
    excluded: [
      {
        path: "Shared_Doctrine/**",
        reason: "Shared doctrine is intentionally blocked in the MVP unless promoted into Doctrine/."
      },
      {
        path: "Agents/Newton/**",
        reason: "Cross-agent write/read sprawl is out of scope for this MVP retrieval surface."
      },
      {
        path: ".env*",
        reason: "Secret-bearing files are never exposed through the Librarian API."
      }
    ]
  },
  {
    id: "neo-founder-runtime-repair",
    agent: "NEO",
    workspace: "My New Agents",
    task: "Founder Runtime Repair",
    title: "NEO -> Founder Runtime Repair",
    summary: "A bounded founder-safe memory pack for runtime status, guardrails, and repair history.",
    selected: [
      {
        path: "Doctrine/GLOBAL_AGENT_DOCTRINE.md",
        reason: "Keep founder replies grounded."
      },
      {
        path: "Projects/My_New_Agents/HANDOFF.md",
        reason: "Carry current repo truth without replaying raw chat."
      }
    ],
    excluded: [
      {
        path: "Agents/Newton/**",
        reason: "Newton lane stays separate from the founder-facing operator lane."
      }
    ]
  },
  {
    id: "codex-cross-project-doctrine-refresh",
    agent: "Codex",
    workspace: "Global",
    task: "Doctrine Refresh",
    title: "Codex -> Cross-project Doctrine Refresh",
    summary: "A light cross-project pack for doctrine refresh and proof discipline.",
    selected: [
      {
        path: "Doctrine/GLOBAL_AGENT_DOCTRINE.md",
        reason: "Core execution law."
      },
      {
        path: "Doctrine/COST_ROUTING_DOCTRINE.md",
        reason: "Bounded routing and model selection."
      }
    ],
    excluded: [
      {
        path: "Bootstrap/**",
        reason: "Bootstrap internals stay out of normal retrieval bundles."
      }
    ]
  }
];

export function resolveBundle(agent: string, workspace: string, task: string): BundleDefinition {
  const normalized = [agent, workspace, task].map((value) => value.trim().toLowerCase());
  return (
    BUNDLE_DEFINITIONS.find((bundle) => {
      const candidate = [bundle.agent, bundle.workspace, bundle.task].map((value) => value.trim().toLowerCase());
      return candidate.every((value, index) => value === normalized[index]);
    }) ?? BUNDLE_DEFINITIONS[0]
  );
}

export function isAllowedBundlePath(targetPath: string): boolean {
  return ALLOWED_ROOTS.some((root) => targetPath.startsWith(root));
}
