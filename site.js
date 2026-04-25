const SITE_CONFIG = Object.freeze({
  CONTACT_EMAIL: "REPLACE_WITH_ROB_EMAIL",
  CANONICAL_URL: "https://r1mob2-svg.github.io/agent-brain-os-website/",
  ANALYTICS_PROVIDER: "none"
});

const ENQUIRY_SUBJECT = "Agent Brain OS Early Access";
const ENQUIRY_BODY = [
  "Hi Rob,",
  "",
  "I'm interested in Agent Brain OS.",
  "",
  "I currently use:",
  "- Codex / Claude / Gemini / Cursor / other:",
  "",
  "Main problem I want to solve:",
  "-",
  "",
  "Best contact details:",
  "-"
].join("\n");

window.AGENT_BRAIN_OS_CONFIG = SITE_CONFIG;

function hasPlaceholder(value) {
  return typeof value === "string" && value.includes("REPLACE_WITH");
}

function buildMailtoHref(email) {
  const params = new URLSearchParams({
    subject: ENQUIRY_SUBJECT,
    body: ENQUIRY_BODY
  });

  return `mailto:${email}?${params.toString()}`;
}

function applyEnquiryLinks() {
  const href = buildMailtoHref(SITE_CONFIG.CONTACT_EMAIL);
  const placeholderMode = hasPlaceholder(SITE_CONFIG.CONTACT_EMAIL);

  document.documentElement.dataset.contactConfig = placeholderMode ? "placeholder" : "configured";

  document.querySelectorAll("[data-enquiry-link]").forEach((link) => {
    link.setAttribute("href", href);
    if (placeholderMode) {
      link.setAttribute("title", "Configure CONTACT_EMAIL in site.js before launch.");
    }
  });
}

function applyCanonicalMetadata() {
  if (hasPlaceholder(SITE_CONFIG.CANONICAL_URL)) {
    document.documentElement.dataset.canonicalStatus = "pending-deployment";
    console.warn("CANONICAL_URL is still pending deployment in site.js.");
    return;
  }

  let canonicalLink = document.querySelector("link[rel='canonical']");
  if (!canonicalLink) {
    canonicalLink = document.createElement("link");
    canonicalLink.setAttribute("rel", "canonical");
    document.head.appendChild(canonicalLink);
  }

  canonicalLink.setAttribute("href", SITE_CONFIG.CANONICAL_URL);

  let ogUrl = document.querySelector("meta[property='og:url']");
  if (!ogUrl) {
    ogUrl = document.createElement("meta");
    ogUrl.setAttribute("property", "og:url");
    document.head.appendChild(ogUrl);
  }

  ogUrl.setAttribute("content", SITE_CONFIG.CANONICAL_URL);

  const absoluteHeroAsset = new URL("assets/agent-brain-os-hero.svg", SITE_CONFIG.CANONICAL_URL).toString();
  document.querySelectorAll("meta[property='og:image'], meta[name='twitter:image']").forEach((meta) => {
    meta.setAttribute("content", absoluteHeroAsset);
  });
}

function applyAnalyticsState() {
  // Analytics placeholder only. Do not load third-party scripts until configured and approved.
  document.documentElement.dataset.analyticsProvider = SITE_CONFIG.ANALYTICS_PROVIDER;
}

document.addEventListener("DOMContentLoaded", () => {
  if (hasPlaceholder(SITE_CONFIG.CONTACT_EMAIL)) {
    console.warn("CONTACT_EMAIL is still using the placeholder value in site.js.");
  }
  applyEnquiryLinks();
  applyCanonicalMetadata();
  applyAnalyticsState();
});
