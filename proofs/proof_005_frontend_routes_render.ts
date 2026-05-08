import assert from "node:assert/strict";
import { renderToStaticMarkup } from "react-dom/server";

import HomePage from "../app/page";
import DashboardPage from "../app/app/page";

const homeHtml = renderToStaticMarkup(HomePage());
assert.match(homeHtml, /Open the Librarian MVP/);

const dashboardHtml = renderToStaticMarkup(DashboardPage());
assert.match(dashboardHtml, /Librarian MVP/);

console.log("PROOF_005_FRONTEND_ROUTES_RENDER PASSED");
