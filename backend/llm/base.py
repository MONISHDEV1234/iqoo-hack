"""
llm/base.py — Abstract LLM provider interface.
"""
from abc import ABC, abstractmethod


class LLMProvider(ABC):
    @abstractmethod
    def complete(self, system_prompt: str, user_prompt: str) -> str:
        """Send a prompt and return the completion text."""
        ...

    @property
    @abstractmethod
    def name(self) -> str:
        ...
