from __future__ import annotations

import json
import logging
import time
from dataclasses import dataclass, field
from datetime import datetime, timezone
from enum import Enum
from typing import Any, Optional

logger = logging.getLogger(__name__)


class ModelSize(Enum):
    TINY = "tiny"
    MEDIUM = "medium"
    FULL = "full"


@dataclass
class ReasoningContext:
    session_id: str
    history: list[dict[str, str]] = field(default_factory=list)
    model_size: ModelSize = ModelSize.MEDIUM
    tokens_used: int = 0
    start_time: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

    def append(self, role: str, content: str) -> None:
        self.history.append({"role": role, "content": content, "timestamp": datetime.now(timezone.utc).isoformat()})

    def summarize(self) -> dict[str, Any]:
        return {
            "session_id": self.session_id,
            "model_size": self.model_size.value,
            "tokens_used": self.tokens_used,
            "turns": len(self.history),
            "start_time": self.start_time,
        }


class Cerebrum:
    """LLM Reasoning Engine for AndinoDroneLab.

    Wraps llama.cpp for local inference with fallback to OpenAI/Anthropic APIs.
    Supports three model sizes (tiny/medium/full) configurable per mission phase.
    """

    DEFAULT_CONFIGS: dict[str, dict[str, Any]] = {
        "llama_cpp": {
            "model_path": "/models/llama-3.2-3b-instruct.gguf",
            "n_ctx": 4096,
            "n_threads": 4,
            "max_tokens": 1024,
            "temperature": 0.7,
        },
        "openai": {
            "api_key": "",
            "model": "gpt-4o-mini",
            "max_tokens": 2048,
            "temperature": 0.7,
        },
        "anthropic": {
            "api_key": "",
            "model": "claude-sonnet-4-20250514",
            "max_tokens": 2048,
            "temperature": 0.7,
        },
    }

    MODEL_SIZE_MAP: dict[ModelSize, dict[str, Any]] = {
        ModelSize.TINY: {"llama_model": "llama-3.2-1b-instruct.gguf", "api_model": "gpt-4o-mini", "max_tokens": 512},
        ModelSize.MEDIUM: {"llama_model": "llama-3.2-3b-instruct.gguf", "api_model": "claude-sonnet-4-20250514", "max_tokens": 1024},
        ModelSize.FULL: {"llama_model": "llama-3.1-8b-instruct.gguf", "api_model": "claude-opus-4-20250514", "max_tokens": 4096},
    }

    def __init__(
        self,
        backend: str = "llama_cpp",
        model_size: ModelSize = ModelSize.MEDIUM,
        config: Optional[dict[str, Any]] = None,
        rate_limit_rps: float = 10.0,
        timeout_seconds: float = 30.0,
        max_retries: int = 3,
    ):
        self._backend = backend.lower()
        self._model_size = model_size
        self._rate_limit_rps = rate_limit_rps
        self._timeout = timeout_seconds
        self._max_retries = max_retries
        self._last_call_time: float = 0.0
        self._contexts: dict[str, ReasoningContext] = {}
        self._llama = None

        configs = dict(self.DEFAULT_CONFIGS)
        if config:
            for provider, overrides in config.items():
                if provider in configs:
                    configs[provider].update(overrides)

        self._configs = configs
        size_cfg = self.MODEL_SIZE_MAP[model_size]

        if self._backend == "llama_cpp":
            self._configs["llama_cpp"]["model_path"] = self._configs["llama_cpp"]["model_path"].replace(
                self.MODEL_SIZE_MAP[ModelSize.MEDIUM]["llama_model"], size_cfg["llama_model"]
            )
        else:
            self._configs[self._backend]["max_tokens"] = size_cfg["max_tokens"]

        logger.info(
            "Cerebrum initialized: backend=%s model_size=%s",
            self._backend, self._model_size.value,
        )

    # ── Public API ───────────────────────────────────────────────────────

    def reason(self, prompt: str, context: Optional[dict[str, Any]] = None) -> str:
        session_id = (context or {}).get("session_id", "default")
        ctx = self._get_context(session_id)
        ctx.append("user", prompt)
        self._throttle()

        system_prompt = self._build_system_prompt(context or {})

        for attempt in range(1, self._max_retries + 1):
            try:
                response = self._call_llm(system_prompt, prompt)
                ctx.append("assistant", response)
                ctx.tokens_used += len(response.split())
                return response
            except TimeoutError:
                logger.warning("Cerebrum timeout (attempt %d/%d)", attempt, self._max_retries)
                if attempt == self._max_retries:
                    raise
                time.sleep(2 ** attempt)
            except Exception as exc:
                logger.error("Cerebrum API error (attempt %d/%d): %s", attempt, self._max_retries, exc)
                if attempt == self._max_retries:
                    raise
                time.sleep(2 ** attempt)

    def plan(self, mission: str, constraints: Optional[dict[str, Any]] = None) -> list[dict[str, Any]]:
        constraints = constraints or {}
        prompt = (
            f"Mission: {mission}\n"
            f"Constraints: {json.dumps(constraints, indent=2)}\n\n"
            f"Generate a detailed mission plan as a JSON list of phases. "
            f"Each phase must have: phase_name, action, duration_estimate_seconds, "
            f"required_skills, fallback, success_criteria."
        )
        response = self.reason(prompt, {"session_id": f"plan-{int(time.time())}"})
        return self._parse_json_response(response)

    def reflect(self, outcome: dict[str, Any]) -> str:
        prompt = (
            f"Analyze the following mission outcome and provide a structured reflection:\n"
            f"{json.dumps(outcome, indent=2)}\n\n"
            f"Include: what went well, what went wrong, root causes, "
            f"lessons learned, and recommendations for next mission."
        )
        return self.reason(prompt, {"session_id": f"reflect-{outcome.get('mission_id', int(time.time()))}"})

    def configure_model(self, model_size: ModelSize) -> None:
        self._model_size = model_size
        logger.info("Cerebrum model size changed to %s", model_size.value)

    def get_context(self, session_id: str) -> Optional[ReasoningContext]:
        return self._contexts.get(session_id)

    def clear_context(self, session_id: str) -> None:
        self._contexts.pop(session_id, None)

    # ── Internal ─────────────────────────────────────────────────────────

    def _get_context(self, session_id: str) -> ReasoningContext:
        if session_id not in self._contexts:
            self._contexts[session_id] = ReasoningContext(
                session_id=session_id,
                model_size=self._model_size,
            )
        return self._contexts[session_id]

    def _throttle(self) -> None:
        elapsed = time.time() - self._last_call_time
        min_interval = 1.0 / max(self._rate_limit_rps, 0.1)
        if elapsed < min_interval:
            time.sleep(min_interval - elapsed)
        self._last_call_time = time.time()

    def _build_system_prompt(self, context: dict[str, Any]) -> str:
        parts = [
            "You are Cerebrum, the reasoning engine for AndinoDroneLab, an autonomous drone platform operating in the Andes (3000-5000m altitude).",
            "You generate structured, safe, and efficient mission plans for drones.",
            "You prioritize safety, follow aviation rules, and account for high-altitude flight constraints (reduced thrust, thin air, weather).",
        ]
        if context.get("mission_type"):
            parts.append(f"Mission type: {context['mission_type']}")
        if context.get("environment"):
            parts.append(f"Environment: {json.dumps(context['environment'])}")
        return "\n".join(parts)

    def _call_llm(self, system_prompt: str, user_prompt: str) -> str:
        if self._backend == "llama_cpp":
            return self._call_llama_cpp(system_prompt, user_prompt)
        elif self._backend == "openai":
            return self._call_openai(system_prompt, user_prompt)
        elif self._backend == "anthropic":
            return self._call_anthropic(system_prompt, user_prompt)
        raise ValueError(f"Unknown backend: {self._backend}")

    def _call_llama_cpp(self, system_prompt: str, user_prompt: str) -> str:
        try:
            import llama_cpp

            if self._llama is None:
                cfg = self._configs["llama_cpp"]
                self._llama = llama_cpp.Llama(
                    model_path=cfg["model_path"],
                    n_ctx=cfg.get("n_ctx", 4096),
                    n_threads=cfg.get("n_threads", 4),
                    verbose=False,
                )

            response = self._llama.create_chat_completion(
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                max_tokens=self._configs["llama_cpp"].get("max_tokens", 1024),
                temperature=self._configs["llama_cpp"].get("temperature", 0.7),
            )
            return response["choices"][0]["message"]["content"]
        except ImportError:
            logger.warning("llama-cpp-python not installed, falling back to mock response")
            return self._mock_response(user_prompt)

    def _call_openai(self, system_prompt: str, user_prompt: str) -> str:
        try:
            from openai import OpenAI

            cfg = self._configs["openai"]
            client = OpenAI(api_key=cfg.get("api_key") or None)
            response = client.chat.completions.create(
                model=cfg.get("model", "gpt-4o-mini"),
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                max_tokens=cfg.get("max_tokens", 2048),
                temperature=cfg.get("temperature", 0.7),
                timeout=self._timeout,
            )
            return response.choices[0].message.content
        except ImportError:
            logger.warning("openai not installed, falling back to mock response")
            return self._mock_response(user_prompt)

    def _call_anthropic(self, system_prompt: str, user_prompt: str) -> str:
        try:
            import anthropic

            cfg = self._configs["anthropic"]
            client = anthropic.Anthropic(api_key=cfg.get("api_key") or None)
            response = client.messages.create(
                model=cfg.get("model", "claude-sonnet-4-20250514"),
                system=system_prompt,
                messages=[{"role": "user", "content": user_prompt}],
                max_tokens=cfg.get("max_tokens", 2048),
                temperature=cfg.get("temperature", 0.7),
            )
            return response.content[0].text
        except ImportError:
            logger.warning("anthropic not installed, falling back to mock response")
            return self._mock_response(user_prompt)

    def _mock_response(self, prompt: str) -> str:
        return (
            f"[Cerebrum mock response for: {prompt[:80]}...]\n\n"
            f"Mission analyzed. Recommended approach: standard flight profile "
            f"with high-altitude compensation (3000-5000m). "
            f"Estimated thrust reduction: 30%. Suggested safe altitude: AGL + 50m. "
            f"Wind tolerance: up to 15 m/s. Ready for execution."
        )

    @staticmethod
    def _parse_json_response(response: str) -> list[dict[str, Any]]:
        start = response.find("[")
        end = response.rfind("]") + 1
        if start >= 0 and end > start:
            try:
                return json.loads(response[start:end])
            except json.JSONDecodeError:
                logger.warning("Failed to parse JSON from response, returning empty plan")
        return []
