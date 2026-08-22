"""
extraction/fallback_extract.py — Deterministic/regex extraction path.
Used when LLM is unavailable. Produces a minimally-structured experience
from raw terminal output / diagnostic events.
"""
import re
import json
from typing import List, Dict, Any


# Known test runner patterns
_TEST_RUNNER_PASS = re.compile(
    r"(\d+)\s+passed", re.IGNORECASE
)
_TEST_RUNNER_FAIL = re.compile(
    r"(\d+)\s+(?:failed|error)", re.IGNORECASE
)
_ERROR_CODE = re.compile(
    r"\b(E\d{3,}|[A-Z]{1,5}\d{3,}|error\s*[A-Z]{0,3}\d{2,})\b", re.IGNORECASE
)
_EXCEPTION_LINE = re.compile(
    r"(Exception|Error|Traceback|FAILED|ERROR).*", re.IGNORECASE
)
_FILE_LINE = re.compile(r'File "([^"]+)", line (\d+)')


def extract_from_events(events: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Build minimal experience dict from raw buffer events."""
    terminal_outputs: List[str] = []
    diagnostic_msgs: List[str] = []
    saved_files: List[str] = []
    languages: List[str] = []
    passed = 0
    failed = 0

    for ev in events:
        t = ev.get("type")
        d = ev.get("data", {})
        if t == "terminal":
            out = d.get("output", "")
            terminal_outputs.append(out)
            if d.get("result") == "passed":
                m = _TEST_RUNNER_PASS.search(out)
                if m:
                    passed += int(m.group(1))
            elif d.get("result") == "failed":
                m = _TEST_RUNNER_FAIL.search(out)
                if m:
                    failed += int(m.group(1))
        elif t == "diagnostic":
            msg = d.get("message", "")
            diagnostic_msgs.append(msg)
        elif t == "file_save":
            fp = d.get("file_path", "")
            lang = d.get("language", "")
            if fp:
                saved_files.append(fp)
            if lang and lang not in languages:
                languages.append(lang)

    full_text = "\n".join(terminal_outputs + diagnostic_msgs)

    # Extract error codes
    error_codes = list({m.group(0) for m in _ERROR_CODE.finditer(full_text)})[:10]

    # Extract symptoms from exception/error lines
    symptoms = list({m.group(0)[:120] for m in _EXCEPTION_LINE.finditer(full_text)})[:5]

    # Best-effort problem summary
    if symptoms:
        problem_summary = symptoms[0]
    elif error_codes:
        problem_summary = f"Error(s): {', '.join(error_codes)}"
    else:
        problem_summary = "Session extracted (details unavailable without LLM)"

    return {
        "scope": "project",
        "title": f"[fallback] {problem_summary[:60]}",
        "problem_summary": problem_summary,
        "symptoms": symptoms,
        "error_codes": error_codes,
        "context": {
            "language": languages[0] if languages else "",
            "framework": [],
            "libraries": [],
            "env": "",
        },
        "category": "other",
        "technologies": languages,
        "patterns": [],
        "hypotheses": [],
        "attempts": [],
        "failed_approaches": [],
        "successful_approach": "",
        "root_cause": "",
        "solution": "",
        "verification": {"passed": passed, "failed": failed},
        "lesson": "",
        "recommended_next_action": "Review the terminal output manually.",
        "confidence": 0.3,
        "source": "autocapture",
    }


def extract_from_raw_text(raw_text: str) -> Dict[str, Any]:
    """Parse a pasted terminal log / session text."""
    fake_event = {
        "ts": 0,
        "type": "terminal",
        "data": {"output": raw_text, "command": "", "exit_code": 0},
    }
    result = extract_from_events([fake_event])
    result["source"] = "import"
    return result
