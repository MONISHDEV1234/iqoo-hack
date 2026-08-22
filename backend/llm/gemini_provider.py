"""
llm/gemini_provider.py — Gemini LLM provider.
Falls back gracefully: if GEMINI_API_KEY is missing or call fails,
raises LLMUnavailableError so callers can fall back to deterministic path.
"""
import os
import json
import urllib.request
import urllib.error
from .base import LLMProvider


class LLMUnavailableError(Exception):
    pass


class GeminiProvider(LLMProvider):
    API_URL = (
        "https://generativelanguage.googleapis.com/v1beta/models/"
        "gemini-1.5-flash:generateContent"
    )

    def __init__(self):
        self.api_key = os.environ.get("GEMINI_API_KEY", "")

    @property
    def name(self) -> str:
        return "gemini"

    def complete(self, system_prompt: str, user_prompt: str) -> str:
        if not self.api_key:
            raise LLMUnavailableError("GEMINI_API_KEY not set")

        payload = {
            "system_instruction": {"parts": [{"text": system_prompt}]},
            "contents": [{"parts": [{"text": user_prompt}]}],
            "generationConfig": {"temperature": 0.2, "maxOutputTokens": 2048},
        }
        body = json.dumps(payload).encode()
        url = f"{self.API_URL}?key={self.api_key}"
        req = urllib.request.Request(
            url, data=body, headers={"Content-Type": "application/json"}, method="POST"
        )
        try:
            with urllib.request.urlopen(req, timeout=30) as resp:
                data = json.loads(resp.read())
                return data["candidates"][0]["content"]["parts"][0]["text"]
        except (urllib.error.URLError, KeyError, IndexError, json.JSONDecodeError) as e:
            raise LLMUnavailableError(f"Gemini call failed: {e}") from e
