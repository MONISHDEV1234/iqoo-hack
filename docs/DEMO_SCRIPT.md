# MistakeMemo — Demo Script (3–5 minutes)

Use the **paste/import session** path as the primary live-demo trigger — it's deterministic and doesn't depend on live terminal timing going smoothly on stage. Live autocapture can be shown briefly as a secondary "and this also works live" beat if things are going well, but the scripted path is what you should rehearse and rely on.

## Sequence

1. **Install & launch.** Show the `.vsix` installed on a clean laptop, extension icon in the sidebar.
2. **Enable capture.** Toggle capture on for the workspace — mention it's per-workspace, permission-based.
3. **Show a debugging session happening.** Either:
   - live: run a failing test in the integrated terminal, then a passing one, with a couple of file saves and a visible diagnostic error in between — extension is silently capturing all three signal types, OR
   - scripted (safer): paste a pre-written session transcript into the "Import Session" box.
4. **Trigger extraction** (automatic on fail→pass, or manual "Extract Now").
5. **Show the reduction.** Switch to the web app's Session Extraction view: "187 raw events → 3 meaningful experiences." This is the wow moment — don't rush it.
6. **Open one extracted experience.** Show problem, symptoms, failed approach + evidence, successful approach, root cause, lesson — all structured, not a transcript.
7. **Start a new, similar problem.** Type a new problem description (or trigger via the sidebar search).
8. **Trigger retrieval.** Show the Retrieval Inspector: candidate experiences, the score breakdown (semantic %, error match, framework match, pattern overlap) — explainability matters here, judges should see *why*, not just a number.
9. **Show the `MISTAKEMEMO_REPORT`.** Open the Report Inspector — the exact compact text the AI is about to receive.
10. **Ask AI without memory.** Show the AI's baseline first attempt/reasoning on the new problem.
11. **Ask AI with memory (Reprocess).** Send the same problem + report — show the AI prioritizing the previously successful approach and explicitly avoiding the previously failed one. Put these two responses side by side.
12. **Verify with tests.** Run the corrected approach, tests pass.
13. **Show the new experience being stored** — the loop closes.
14. **Switch to the Coach chatbot.** Ask something like "what do I keep messing up with FastAPI?" — show it answering from stored experience + the recurring-patterns panel ("you've hit type-serialization mismatches 4 times"). This is your closing beat: not just AI memory, but self-awareness for the developer.
15. **One-line close:** "MistakeMemo doesn't just remember what you asked — it remembers what failed, what worked, and why — and it turns that into something both the AI and the developer can learn from."

## What to protect if time is short mid-rehearsal

Cut in this order if you're over time: step 3 live-capture demonstration (go straight to scripted import) → step 14 Coach chatbot (mention it exists, don't demo live) → step 6 experience-detail deep dive (summarize instead of clicking through every field).

**Never cut:** steps 8-11 (retrieval → report → before/after AI comparison). That comparison is the actual product thesis and must be shown, not described.
