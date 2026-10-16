# Dot Bot Web — Version 2.0 Specification
Status: Draft 1 — 16 October 2026
Owner: Box Signal
Website: https://getdotbot.uk

## 1. Objective
Build a fully usable web version of Dot Bot, the character-led AI companion, accessible in modern desktop and mobile browsers. The existing Windows 10/11 Microsoft Store application remains available independently.

## 2. Product definition
Dot Bot is AI companion software for Windows 10 and 11, with a planned browser-based experience. He is an original Box Signal character: a smooth black sphere with exactly two small glowing white eyes, no limbs or antenna. He is a companion first, not merely a Windows guide or Minecraft assistant.

## 3. Audiences
Curious users, creative people, gamers, people exploring AI, and visitors arriving on mobile.

## 4. Functional requirements
- FR-01: The website must explain what Dot Bot is immediately and accurately.
- FR-02: The website must provide a dedicated Talk to Dot Bot experience, clearly distinguishing scripted preview from live AI.
- FR-03: Live chat must support user prompts, AI responses, conversation context within the current session, visible loading state, retry and error handling.
- FR-04: Preserve the established Dot Bot personality through a versioned system prompt.
- FR-05: Character must remain visible, responsive and animated subtly; respect reduced-motion preferences.
- FR-06: Interface must be usable on desktop, tablet and phone with touch, keyboard and screen reader.
- FR-07: Image creation should be supported when a suitable API route and safe cost model are implemented; do not advertise as live until tested.
- FR-08: Keep the existing Microsoft Store link, Box Signal attribution and Dot Bot Journal (five articles).
- FR-09: Provide clear first-run guidance about API access and any charges.
- FR-10: Offer a clear reset/new conversation control and an understandable session privacy notice.

## 5. Architecture and API access
The public frontend must never contain a Box Signal OpenAI secret. Decide between:
(A) visitor-supplied API key, with explicit consent, no permanent browser storage by default and a carefully reviewed browser-to-API or proxy design; or
(B) hosted service using server-side secrets, rate limits, anti-abuse controls, spend caps and usage monitoring.
No live AI deployment before this decision and testing. A PWA can follow the working web experience.

## 6. Non-functional requirements
- Responsive at 360px mobile widths and larger.
- WCAG 2.2 AA target for contrast, focus, semantics and keyboard support.
- Fast initial loading, minimal assets, graceful fallback if animation or AI is unavailable.
- Protect privacy: no unnecessary collection of personal data, no public logs of conversations or API keys.
- Provide clear, truthful product claims and no implication of Mojang/Minecraft or Microsoft partnership.

## 7. Visual direction
Cinematic midnight background, aqua highlights, restrained violet glow, large clear typography, animated spherical Dot Bot. Calm, warm, understated British English. Dot Bot remains the focal point.

## 8. Release phases
### Phase 1 — Website foundation
Responsive redesigned homepage, scripted preview, journal and download links. Implemented in repository; verify production deployment.

### Phase 2 — Real Dot Bot on the web
Dedicated chat UI, selected API key/payment architecture, context, errors, basic privacy and mobile usability tests. Image generation only after verified support.

### Phase 3 — Mobile refinement
Installable PWA, performance, optional persistent conversation history with user controls, further accessibility improvements.

## 9. Acceptance criteria for Phase 2
- New visitor understands the product within the first screen.
- A user can begin and continue a genuine AI conversation on desktop and phone.
- Dot Bot's replies follow the approved personality.
- No developer API secrets are present in delivered frontend code.
- Failed network/API calls show useful messages and do not break the interface.
- No unexpected AI costs without the selected cost model and limits.
- Existing journal pages and Microsoft Store link remain functional.

## 10. Open decision
Choose visitor-provided API keys versus Box Signal-funded hosted access before implementing live chat.

## 11. Portable Dot Bot — first implementation
- Homepage button opens a Document Picture-in-Picture floating companion on supporting browsers (notably Chromium desktop browsers), subject to browser permissions.
- Unsupported browsers fall back to a separate popup window, which is not guaranteed always-on-top; popup blockers may instead navigate to the companion page.
- Companion page is /companion.html with a responsive Dot Bot character and clearly labelled scripted replies.
- This is not a browser extension and cannot inject Dot Bot into arbitrary sites.
- Future milestone: secure live AI conversations inside the portable window, with chosen API cost/key handling model.
- Verify live deployment and test Chrome/Edge/Firefox, mobile, popup blocking and accessibility.
