# Agent Brain OS Landing Page

This project is a static single-page marketing website for Agent Brain OS.

It is intentionally a premium landing page, not a web app.

## What The Site Is

- A one-page launch site for a GitHub-backed operating brain for AI coding agents
- A clear early-access and setup offer for founders, agencies, and advanced AI builders
- A static site with lightweight SVG imagery and no fake SaaS dashboard shell

## Local Run

From this folder, run one of the following:

```powershell
py -m http.server 4173
```

or

```powershell
python -m http.server 4173
```

Then open:

```text
http://127.0.0.1:4173/
```

## Launch Config Values Still Needed

Update these values in [site.js](C:/Users/tauru/OneDrive/Desktop/agent%20brain%20os%20website/site.js):

- `CONTACT_EMAIL`
- `ANALYTICS_PROVIDER`

Current live canonical URL:

- `https://r1mob2-svg.github.io/agent-brain-os-website/`

Default launch-safe state:

- `CONTACT_EMAIL` uses a placeholder until Rob provides the final address
- `ANALYTICS_PROVIDER` is `none`
- CTA mailto links are hydrated by `site.js`, so this file must be served with the page

## Deployment

This site can be deployed as a plain static website.

Suitable options:

- Vercel static deployment
- Netlify static deployment
- GitHub Pages after this folder is placed in a real git repository
- Any other static host that serves `index.html`, `styles.css`, `site.js`, and `assets/`

## Simple Static Deployment Checklist

1. Replace `CONTACT_EMAIL` in `site.js`.
2. Update `CANONICAL_URL` in `site.js` only if the site moves away from the current live Pages URL.
3. Keep `ANALYTICS_PROVIDER` as `none` unless a real provider is approved and configured.
4. Upload the full folder contents to the chosen static host.
5. Verify the live page, CTA mailto path, metadata, and asset URLs.

## Launch Verification Traps

- A local browser pass with JavaScript enabled can hide a broken CTA fallback, so confirm the deployed `site.js` file is serving correctly.
- Do not leave `CONTACT_EMAIL` or `CANONICAL_URL` on placeholder values when claiming launch readiness.
- Social sharing metadata should be re-checked after deployment because production share cards work best with absolute production asset URLs.
- Mailto is a lightweight launch path, not a submission backend. It proves an enquiry route exists, not that a CRM or tracking pipeline is active.
- Analytics remain inactive until a real provider is approved and implemented.

## Truth Boundaries

- The early-access CTA is a mailto launch path, not a form backend.
- Analytics are not active unless `ANALYTICS_PROVIDER` is changed and a real implementation is added.
- `site.js` is part of the launch-critical path because it applies the configured CTA hrefs and canonical metadata state.
- No fake testimonials, logos, dashboards, portals, or live-product claims should be added.
- Do not claim deployment until a real static host is live and verified.
