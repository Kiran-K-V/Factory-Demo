---
name: qa-web
description: >
  QA tests for the Auralink One landing page (vanilla HTML/CSS/JS). Covers
  navigation, smooth scroll, mobile menu, CTA email form, the broken dark mode
  toggle, sticky header state, reveal animations, and responsive breakpoints.
---

# qa-web -- Auralink One Landing Page

A vanilla HTML/CSS/JS landing page with no build step, no framework, and no
backend. All state is client-side; the CTA form is a mocked submit that does
not POST anywhere.

## Testing Target

This project has **no preview deployment system**. Test against the actual PR
branch code by one of two means:

1. **Preferred:** open `file://$GITHUB_WORKSPACE/index.html` directly in
   agent-browser.
2. **Fallback (for parallax pointer events, fetch-blocked features, or font
   loading issues):** start a local HTTP server from the repo root and use
   `http://localhost:8080/index.html`:

   ```bash
   python3 -m http.server 8080 >/tmp/qa-server.log 2>&1 &
   echo $! > /tmp/qa-server.pid
   # poll until ready
   for i in $(seq 1 20); do
     curl -fsS http://localhost:8080/index.html >/dev/null && break
     sleep 0.5
   done
   ```

   Tear down with `kill $(cat /tmp/qa-server.pid) || true` at the end.

**Never** fall back to a remote/hosted URL -- there is no production deployment
of this site associated with QA, and any remote URL would not reflect the PR
branch's code.

## Authentication

None. No env vars or secrets are needed for this sub-skill.

## Viewports / Personas

| Persona              | Viewport     | Use for                                        |
|----------------------|--------------|------------------------------------------------|
| anonymous-desktop    | 1280 x 800   | Default. Sticky header, tilt, parallax.        |
| anonymous-mobile     | 390 x 844    | Mobile menu, stacked grids, touch targets.     |

Set viewport in agent-browser before navigating to the page so media-query
breakpoints (760px and 980px in `style.css`) evaluate correctly on first paint.

## Available Test Flows (Menu)

The orchestrator picks only the flows relevant to the current diff. Each flow
includes the trigger area in the diff that should route to it.

### Flow A -- Hero render & metadata (any change to index.html `<head>` or `.hero`)

1. Open the page (file:// or http://localhost:8080).
2. Capture a snapshot. Verify the document `<title>` is "Auralink One | Next-Gen Headphone SaaS".
3. Verify the `<h1>` text contains "Hear Every Detail. Lead Every Call."
4. Verify the three hero stats (`42ms`, `60h`, `99.98%`) render and are not zero-width.
5. Verify both `<a class="btn">` actions in `.hero-actions` exist ("Get started" -> `#pricing`, "Watch demo" -> `#product`).
6. Take a desktop screenshot to `./qa-results/$RUN_ID/hero.png`.

### Flow B -- Smooth scroll anchor nav (changes to `script.js` smooth-scroll, anchor hrefs, or `#main-nav`)

1. From the top of the page, click each main-nav link in order: Product, Features, Testimonials, Pricing, "Start free".
2. After each click, capture window.scrollY (via `page.evaluate("window.scrollY")` or equivalent) and verify it is roughly equal to the target section's `offsetTop` (+/- 80px to allow for sticky header offset).
3. Verify clicking the brand "Auralink One" returns the user to `#top` (scrollY back near 0).
4. Negative test: click a link whose href is `#` (if any). Expect no navigation and no console errors.

### Flow C -- Mobile hamburger menu (`anonymous-mobile` only) (changes to `.nav-toggle`, `.main-nav`, mobile breakpoint CSS)

1. Set viewport to 390 x 844.
2. Reload the page. Verify the hamburger `.nav-toggle` is visible and the inline `.main-nav` links are hidden (the `@media (max-width: 760px)` rule).
3. Click `.nav-toggle`. Verify:
   - `.main-nav` gains the `open` class.
   - `aria-expanded="true"` on the toggle.
   - `body.menu-open` class is present.
4. Click any nav link inside the open menu. Verify it closes again (`open` class removed, `aria-expanded="false"`).
5. Take a screenshot in the open state to `./qa-results/$RUN_ID/mobile-menu-open.png`.

### Flow D -- CTA email form (changes to `.cta-form`, the submit handler in `script.js`)

1. Scroll to `#cta`.
2. Locate the input `#email` and the submit button.
3. Negative test: click submit with an empty value. Verify the button text changes to "You're on the list" and reverts to "Start free trial" after ~1.6s, AND that the button is briefly `disabled`. (Note: this site does NOT do email validation client-side; it's a mocked confirmation. That is the documented behavior -- report PASS even with an empty input.)
4. Positive test: type `qa@example.com`, click submit, observe the same disabled/label-flip behavior.
5. Verify no real network request was made (check the network log -- expect zero non-GET requests to anything besides Google Fonts).

### Flow E -- Dark mode toggle (changes to `.theme-toggle`, the `themeToggle` handler in `script.js`, or `data-theme-pending`)

The dark mode toggle is **intentionally broken** -- it animates the thumb and
flips its label, but does not actually change the theme. Tests verify the
toggle's visible state changes while the body theme does NOT change.

1. Open the page on desktop. Locate `.theme-toggle` in the header.
2. Record the initial `computed background-color` (or background-image) of `body` -- this is the dark-theme baseline.
3. Record the initial `aria-checked` of `.theme-toggle` (expect `"false"`).
4. Click `.theme-toggle`. Verify:
   - `aria-checked` becomes `"true"`.
   - The `.theme-toggle-label` text changes from "Dark" to "Light".
   - The `.theme-toggle-thumb`'s computed `left` shifts to the right edge of the track.
   - `<html>` gains attribute `data-theme-pending="true"`.
   - The `<body>` computed background is **unchanged** from baseline. This is the documented "broken" behavior. If the body background *does* change, the toggle has been fixed and the test should FAIL with a note to update this flow.
5. Click again. Verify `aria-checked` returns to `"false"` and the label returns to "Dark".

### Flow F -- Sticky header `.scrolled` state (changes to `.site-header`, `setHeaderState`, or scroll handling)

1. Open the page at the top. Verify `.site-header` does NOT have the `scrolled` class and `backdrop-filter` is `none` or `blur(0px)`.
2. Programmatically scroll to `window.scrollY = 200`.
3. Verify `.site-header` gains the `scrolled` class and that the header's computed `background-color` becomes more opaque (the `rgba(6, 11, 22, 0.78)` rule).
4. Scroll back to top. Verify the `scrolled` class is removed.

### Flow G -- Reveal animations (changes to `.reveal`, `IntersectionObserver`, or any section markup wrapped in `.reveal`)

1. Set `prefers-reduced-motion: no-preference` in agent-browser if available; otherwise note that reduced-motion may auto-PASS reveals.
2. Open the page at the top. Verify hero `.reveal` elements have the `in-view` class (the IntersectionObserver fires on initial load).
3. Scroll to `#features`. Verify all `.feature-card.reveal` elements inside the viewport gain `in-view` within 1s of scroll completion.

### Flow H -- Tilt hover effect (`anonymous-desktop` only) (changes to `[data-tilt]` or the tilt handler)

1. Hover the cursor over the hero device card (`.hero-visual`).
2. Verify its computed `transform` includes a `perspective(...)` plus non-zero rotateX/rotateY values.
3. Move the cursor off the card. Verify the transform resets (empty or `none`).
4. On `(hover: none)` devices the handler is intentionally bypassed -- skip this flow when running as `anonymous-mobile`.

### Flow I -- Parallax pointer-driven glow (`anonymous-desktop` only) (changes to `[data-parallax]`, `pointermove` listener, or `.hero-glow`)

1. Move the pointer to viewport coordinates (200, 200), (1100, 600), and (640, 400) in sequence with ~150ms gaps.
2. After each move, snapshot the `style.transform` of both `.hero-glow-1` and `.hero-glow-2`. Verify the translate values change between samples and follow the `data-speed` attribute (`0.02` and `0.04`).
3. If running over `file://` and pointermove events are not dispatched, fall back to `http://localhost:8080` per the Testing Target section.

### Flow J -- Responsive layout breakpoints (`anonymous-mobile` and an intermediate 900px desktop)

1. Set viewport to 900 x 800. Verify the hero, product, features, testimonials, and pricing grids switch to `1fr 1fr` (the 980px media query).
2. Set viewport to 700 x 800 (below 760px). Verify those grids switch to `1fr` and the CTA form stacks (`grid-template-columns: 1fr`).
3. Verify there are no horizontal overflow scrollbars at any tested viewport (`document.documentElement.scrollWidth <= window.innerWidth`).

## Test Quality Notes

- Use `agent-browser snapshot` after every state change to capture the accessibility tree as text evidence.
- Take a screenshot at each meaningful step and save it to `./qa-results/$RUN_ID/<flow-letter>-<step>.png`.
- For each flow, label snapshots so a reader can tell PASS from FAIL without opening images.
- Include at least one negative test in any run (Flow B step 4, Flow C `aria-expanded="false"` after close, Flow D empty submit, Flow E body-bg unchanged, Flow F class removed after scroll-back).

## Known Failure Modes

1. **`file://` blocks `pointermove` parallax in some headless setups.** If Flow I sees identical transforms across all pointer positions, restart agent-browser against `http://localhost:8080` and re-run that flow. Report PASS if the http variant works; otherwise FAIL with the http evidence attached.
2. **Google Fonts can be slow on first load.** Inter is loaded from `fonts.googleapis.com`. If font swap is in progress, snapshot text comparisons may be visually different but DOM text is still correct. Always assert against DOM text, not pixel layout, for text checks.
3. **Reveal animations bypassed under `prefers-reduced-motion: reduce`.** When the browser advertises reduced motion, `.reveal` elements get `in-view` applied immediately via the `else` branch. That is correct behavior -- mark Flow G as PASS without scrolling in that case.
4. **Tilt and parallax are disabled on `(hover: none) and (pointer: coarse)` devices.** Mobile personas (`anonymous-mobile`) must NOT run Flow H or Flow I. The orchestrator should already filter these by persona.
5. **The dark mode toggle is intentionally non-functional.** Do NOT report Flow E as a regression when the body theme stays dark. That is the documented current behavior. If/when it actually toggles, update this skill to invert the assertion.
