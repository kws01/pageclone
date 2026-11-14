# Project memory

## Product intent & audience

- Quiz generation tool (likely marketing/lead-gen) that produces an interactive quiz from a product name/theme plus optional angle/context/URL.
- Target users create quizzes in Portuguese (pt-BR) and Spanish (es); UI labels are in Portuguese.
- Generated guides support multiple languages; guide language may differ from UI language.

## Brand personality & voice

- Clean, direct, production-quality interfaces; avoid cookie-cutter designs (per `.bolt/prompt`).
- AI-generated quizzes should adapt tone/voice to the inferred niche (e.g., warm for relationships, didactic for courses, cautious for regulated niches).

## Visual design & UX direction

- Vite + React + Tailwind CSS; JSX with Lucide React icons; `@/` path alias maps to `src/`.
- Form UX should stay lean: minimal required fields, optional context/URL, language selector. Avoid niche/keyword-detection UI chrome.
- Quiz preview renders inside an `iframe`; first render must be immediate (no debounce delay), debouncing only for subsequent edits.
- Final card footer pattern: informational notice + "See guide again" link placed at bottom of card, centered, small/muted text, separator line above, spaced from main CTA. Applied consistently in both preview and exported HTML.

## Decisions, constraints & rationale

- Niche detection moved from client-side keyword debounce to AI inference inside `buildCleanPrompt` (quizAnalyzer.ts); removes UI complexity and stale keyword logic.
- Playbook/style selection is now inferred by the AI based on the product/theme name, not a manual selector.
- Accentuation post-processing (pt-BR/es) must remain active on returned JSON.
- Only surgical changes; keep code lean and functional—do not alter beyond what's necessary.
- `affiliateDisclosure` field removed from editor, type definitions, and prompt; replaced by a fixed, language-aware informational notice ("Information Notice: This guide provides independent product insights and educational content to help you make informed decisions."). Translations stored in `hybridOptions.ts`.
- Previously generated guides with old commission text still open correctly; old text simply no longer renders.

## Open questions & assumptions

- Assumed `detectNiche`, `mergePlaybooks`, `playbookToPrompt`, and `Q1_BY_NICHE` were only used by the removed niche flow; safe to delete once unused.
- Whether AI-inferred niche quality is consistent enough to replace explicit selection long-term is unverified.
- Final-card footer layout was not visually verified in browser after changes; worth a manual check.