---
name: qa
description: >
  Run QA tests for the Auralink One landing page. Analyzes git diff to determine
  affected areas, runs configured browser test flows with desktop and mobile
  personas, and generates diff-targeted tests. Uses agent-browser for web
  testing. Use when testing PRs, releases, or smoke testing the landing page.
---

# QA Orchestrator -- Auralink One Landing

**SCOPE: This skill performs manual/functional QA only -- verifying that the application actually works by interacting with it as a real user would (browser). Do NOT run or report on CI checks, linting, ESLint, typecheck, unit tests, or any static analysis. Those are handled by separate workflows.**

## Step 1: Load Configuration

Read `.factory/skills/qa/config.yaml` for environment URLs, personas, and app definitions.

## Step 2: Determine Target Environment

Default target is `local-static` (file:// open of the repo's `index.html`). Use it unless the user explicitly specifies a different environment.

Respect environment restrictions in config.yaml. There are no auth, no third-party services, and no persistent data -- all tests are read-only.

**Preview deployments:** The project has no hosting target configured at install time. If a future preview deployment system is added (Vercel, Netlify, GitHub Pages), treat its URL exactly like the `local-static` environment -- same code path, no auth, no backend.

## Step 3: Analyze Git Diff

Run `git diff` against the merge base to determine what changed. Map changed files to apps using the `path_patterns` in config.yaml.

For the Auralink One repo, essentially any change to `index.html`, `style.css`, or `script.js` maps to the single `web` app. Files outside that scope (e.g., `.factory/skills/**`, `.github/**`, `README.md`) are NOT associated with any app.

For each affected app:

- Run ONLY that app's flows from its sub-skill (`.factory/skills/qa-web/SKILL.md`)
- Generate ADDITIONAL targeted tests based on the specific changes in the diff

For apps NOT affected by the diff:

- Do NOT load or run their module. Do NOT run their flows. Do NOT run their pre-flight checks.

If NO app is affected by the diff (e.g., docs-only, CI-only, or skill-only changes), report as INCONCLUSIVE: "No app code changed -- QA not applicable for this diff." Do NOT run any app flows.

## Step 4: Pre-flight Checks (app-specific only)

Run pre-flight checks ONLY for the apps that are affected by the diff. For this repo, the only pre-flight is for the `web` app:

**Web app testing target:** When testing web/frontend changes on a PR branch, the agent MUST test against the actual branch code, not a remote environment. Since this project has no preview deployment system:

1. Use the local checkout of the PR branch directly.
2. Prefer opening `file://$GITHUB_WORKSPACE/index.html` via agent-browser.
3. If a flow requires an http origin (e.g., CSP issues, fonts, parallax pointermove on file://), fall back to starting a local server in the background:
   `python3 -m http.server 8080` from the repo root, then use `http://localhost:8080/index.html`.
4. NEVER fall back to a remote/hosted URL. Remote URLs run different code than the PR branch and testing against them is meaningless.

If pre-flight fails (e.g., index.html missing), report BLOCKED with the exact error and remediation.

## Step 5: Execute Diff-Relevant Flows Only

For each affected app, read its sub-skill from `.factory/skills/qa-<app-name>/SKILL.md`.

The sub-skill contains a MENU of available test flows. You must:

1. Read the diff carefully and identify which flows are relevant to the change.
2. Run those flows PLUS any adjacent flows that verify the change integrates correctly (e.g., if a CSS change touches the header, also verify the sticky-scroll state still applies).
3. Do NOT run completely unrelated flows.
4. If no existing flow covers the change, write a NEW ad-hoc test that directly verifies the changed behavior.
5. Do NOT run unit tests, lint, typecheck, or any automated suite. This is manual/functional QA -- interact with the app as a real user would.

Run each relevant flow for BOTH personas where it matters (`anonymous-desktop` and `anonymous-mobile`). Mobile-only flows (hamburger menu, mobile-stacked layout) only run as `anonymous-mobile`. Desktop-only flows (tilt hover effect, parallax pointer-driven motion) only run as `anonymous-desktop`.

## Step 6: Evidence Capture

After each significant test step, capture evidence. Use **text snapshots as primary evidence** -- they render inline in the PR comment with no image hosting issues.

For web apps (agent-browser):

- Use `agent-browser snapshot` to capture the page's accessibility tree as text evidence.
- Save screenshot files to `./qa-results/$RUN_ID/` for the artifact upload.
- Do NOT embed `![image](url)` markdown in the report -- screenshot images cannot be displayed inline in GitHub PR comments. Instead, mention the filename and note that it's available in the downloadable artifacts.

Evidence quality rules:

- Focus on the RELEVANT content. Trim snapshots to the meaningful part (e.g., just the header region for nav tests).
- Label each snapshot clearly: what it shows and why it matters.
- NEVER embed broken image links.
- The workflow uploads everything in `./qa-results/` as a downloadable artifact.

## Step 7: Test Quality Gate

TEST QUALITY REQUIREMENTS:

1. CHANGE-SPECIFIC FIRST. Prioritize tests that directly verify the behavioral change in the diff. At least half your tests should be testing the new/changed feature itself.
2. INTEGRATION TESTS ARE VALID. Tests verifying the change integrates correctly with neighbors are good (e.g., a new header element doesn't break the sticky-scroll state).
3. NO UNRELATED FLOWS.
4. NO AUTOMATED TEST SUITES. Do NOT run npm test, jest, vitest, etc.
5. NEGATIVE TESTS. Include at least 1 test verifying error handling or boundary conditions related to the change (e.g., empty email submission, viewport just under a breakpoint).
6. INTERACTIVE TESTING. Test by actually interacting with the page (click, scroll, type, resize).
7. INCONCLUSIVE IF UNSURE.

## Step 8: Handle Failures

**Never silently skip a flow.** If a flow cannot complete, report it as BLOCKED with what was tried and how the user can fix it. Then continue to the next flow -- never abort the entire run for a single failure.

## Step 9: Generate Report

Generate the report at `./qa-results/report.md` using `.factory/skills/qa/REPORT-TEMPLATE.md`.

The report MUST follow the template. Key rules:

- Start with `## QA Report` heading followed by the test results table.
- Result column MUST use emojis: :white_check_mark: PASS, :x: FAIL, :no_entry: BLOCKED, :warning: FLAKY, :grey_question: INCONCLUSIVE.
- Keep it CONCISE. Table + a short "Action Required" section (if any) + collapsed evidence = the entire report.
- Do NOT include: "Behavioral Change Summary", "Blocked Flows" prose, "Info" metadata table.
- Do NOT report setup/prerequisite steps (launching the browser, opening the page) as test rows. Only report rows that verify actual user-facing behavior.
- Put ALL evidence in a single collapsed `<details>` block.
- For web evidence: embed accessibility tree snapshots as text. Reference screenshot filenames for visual proof. Do NOT use `![image](url)` markdown.

## Step 10: Suggest Skill Updates (Failure Learning)

`failure_learning` is set to `suggest_in_report` in config.yaml.

After generating the report, check if any BLOCKED or FAIL results revealed a **testing-environment insight** that would help future QA runs succeed. This is about learning how the environment works, NOT about fixing bad selectors.

**Good suggestions** (environment/workflow knowledge):

- "file:// fails to fire pointermove parallax in headless Chromium -- use the http server fallback for parallax tests."
- "Reveal animations only trigger after `prefers-reduced-motion: no-preference` is set explicitly in agent-browser."

**Bad suggestions** (skill bugs -- fix directly):

- "Selector `.theme-toggle-thumb` doesn't exist" -- fix the selector in the sub-skill.
- "Button text changed from Dark to Light" -- expected from the diff.

Append the section to the report as a table:

### Suggested Skill Updates (N issues found)

| # | Severity | File | Issue | Fix Prompt |
|---|----------|------|-------|------------|
| 1 | 🔴 Breaking | `.factory/skills/qa-web/SKILL.md` | <short description> | <details><summary>Copy</summary><br>`<full droid prompt to fix the issue>`</details> |

Severity:

- 🔴 Breaking -- causes failures every run
- 🟡 Degraded -- causes intermittent or suboptimal behavior
- 🔵 Info -- new knowledge that improves future runs

If no genuinely new environment insights were discovered, omit this section entirely. Do NOT write `qa-results/skill-updates.json` (only used for auto_commit / open_pr modes).
