"""
extraction/llm_extract.py — LLM-assisted experience extraction.
Builds a structured experience from buffer events using Gemini.
Falls back to fallback_extract if LLM is unavailable.
"""
import json
from typing import List, Dict, Any, Tuple

from llm.gemini_provider import GeminiProvider, LLMUnavailableError
from extraction.fallback_extract import extract_from_events, extract_from_raw_text

_SYSTEM_PROMPT = """
You are an expert debugging analyst. Given a raw coding session (terminal commands,
outputs, error messages, file saves), extract a structured debugging experience.

Respond ONLY with a valid JSON object matching this schema (no markdown, no extra text):
{
  "scope": "project",
  "title": "<short title>",
  "problem_summary": "<1-2 sentence summary>",
  "symptoms": ["<symptom>"],
  "error_codes": ["<error code>"],
  "context": {"language": "", "framework": [], "libraries": [], "env": ""},
  "category": "<one of: api|database|frontend|backend|networking|authentication|dependency|build|testing|deployment|performance|state_management|type_serialization|environment_config|concurrency|other>",
  "technologies": [],
  "patterns": [],
  "hypotheses": [],
  "attempts": [{"hypothesis": "", "action": "", "result": "", "evidence": ""}],
  "failed_approaches": [],
  "successful_approach": "",
  "root_cause": "",
  "solution": "",
  "verification": {"passed": 0, "failed": 0},
  "lesson": "",
  "recommended_next_action": "",
  "confidence": 0.85,
  "source": "autocapture"
}

Ground every claim in evidence from the session. Prefer facts over narrative.
""".strip()


def _events_to_text(events: List[Dict[str, Any]]) -> str:
    lines = []
    for ev in events:
        t = ev.get("type", "unknown")
        d = ev.get("data", {})
        if t == "terminal":
            lines.append(f"[terminal] $ {d.get('command', '')}")
            if d.get("exit_code") is not None:
                lines.append(f"  exit_code={d['exit_code']}")
            if d.get("output"):
                out = d["output"][:3000]
                lines.append(f"  output:\n{out}")
        elif t == "diagnostic":
            lines.append(
                f"[diagnostic] {d.get('severity','?')} {d.get('source','?')}: "
                f"{d.get('message','?')} in {d.get('file','?')}"
            )
        elif t == "file_save":
            lines.append(f"[file_save] {d.get('file_path','?')} ({d.get('language','')})")
    return "\n".join(lines)


_provider = GeminiProvider()


def extract(
    events: List[Dict[str, Any]] | None = None,
    raw_text: str | None = None,
    project: str = "",
) -> Tuple[Dict[str, Any], str]:
    """
    Returns (experience_dict, source_used) where source_used is 'llm' or 'fallback'.
    """
    if raw_text:
        session_text = raw_text
        fallback_fn = lambda: extract_from_raw_text(raw_text)
    else:
        session_text = _events_to_text(events or [])
        fallback_fn = lambda: extract_from_events(events or [])

    try:
        raw = _provider.complete(_SYSTEM_PROMPT, f"SESSION:\n{session_text}")
        # Strip any accidental markdown fences
        raw = raw.strip()
        if raw.startswith("```"):
            raw = "\n".join(raw.split("\n")[1:])
        if raw.endswith("```"):
            raw = "\n".join(raw.split("\n")[:-1])
        exp = json.loads(raw.strip())
        exp["source"] = "import" if raw_text else "autocapture"
        if project:
            exp["project"] = project
        return exp, "llm"
    except (LLMUnavailableError, json.JSONDecodeError, Exception):
        exp = fallback_fn()
        if project:
            exp["project"] = project
        return exp, "fallback"
