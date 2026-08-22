"""
reporting/report_builder.py — Deterministic MISTAKEMEMO_REPORT template.
Never calls LLM. Always available even offline.
"""
from typing import Any, Dict, List


def build_report(ranked_experiences: List[Dict[str, Any]], current_problem: str = "") -> str:
    """Build a MISTAKEMEMO_REPORT from top 1–3 ranked experiences."""
    if not ranked_experiences:
        return (
            "<MISTAKEMEMO_REPORT>\n\n"
            "No sufficiently relevant prior experience found.\n\n"
            "</MISTAKEMEMO_REPORT>"
        )

    top = ranked_experiences[:3]
    blocks = []

    for exp in top:
        verification = exp.get("verification", {})
        passed = verification.get("passed", 0)
        failed = verification.get("failed", 0)
        total = passed + failed

        symptoms = exp.get("symptoms", [])
        ctx = exp.get("context", {})
        failed_approaches = exp.get("failed_approaches", [])
        patterns = exp.get("patterns", [])

        block = f"""Experience #{exp['id']}
Relevance: {exp.get('score_pct', round(exp.get('score', 0) * 100, 1))}%
Feature breakdown: semantic={exp['feature_breakdown']['semantic']:.2f}  error_match={exp['feature_breakdown']['error_match']:.2f}  framework={exp['feature_breakdown']['framework_match']:.2f}

SYMPTOMS
{chr(10).join(f'  • {s}' for s in symptoms) if symptoms else '  (none recorded)'}

CONTEXT
  Language:   {ctx.get('language', '—')}
  Framework:  {', '.join(ctx.get('framework', [])) or '—'}
  Libraries:  {', '.join(ctx.get('libraries', [])) or '—'}

FAILED APPROACH
{chr(10).join(f'  • {a}' for a in failed_approaches) if failed_approaches else '  (none recorded)'}

SUCCESSFUL APPROACH
  {exp.get('successful_approach') or '(not recorded)'}

ROOT CAUSE
  {exp.get('root_cause') or '(not recorded)'}

VERIFICATION
  {passed}/{total if total else '?'} tests passed

REUSABLE PATTERN
{chr(10).join(f'  • {p}' for p in patterns) if patterns else '  ' + (exp.get('lesson') or '(none)')}

LESSON
  {exp.get('lesson') or '(none)'}

RECOMMENDED NEXT ACTION
  {exp.get('recommended_next_action') or '(none)'}"""
        blocks.append(block)

    sep = "\n" + "─" * 60 + "\n"
    report = (
        "<MISTAKEMEMO_REPORT>\n\n"
        f"CURRENT PROBLEM\n{current_problem or '(not specified)'}\n\n"
        + sep.join(blocks)
        + "\n\nIMPORTANT\nPrior experience is evidence, not proof. "
        "Validate against the current environment.\n\n"
        "</MISTAKEMEMO_REPORT>"
    )
    return report
