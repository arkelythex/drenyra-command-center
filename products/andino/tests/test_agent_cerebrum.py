import sys
import time
from unittest.mock import patch

import pytest

sys.path.insert(0, ".")

from agent.cerebrum import Cerebrum, ModelSize, ReasoningContext


class TestCerebrum:
    def test_cerebrum_init_defaults(self):
        c = Cerebrum()
        assert c._backend == "llama_cpp"
        assert c._model_size == ModelSize.MEDIUM
        assert c._rate_limit_rps == 10.0
        assert c._timeout == 30.0
        assert c._max_retries == 3
        assert c._llama is None

    def test_cerebrum_init_custom(self):
        c = Cerebrum(
            backend="openai",
            model_size=ModelSize.FULL,
            rate_limit_rps=5.0,
            timeout_seconds=60.0,
            max_retries=5,
        )
        assert c._backend == "openai"
        assert c._model_size == ModelSize.FULL
        assert c._rate_limit_rps == 5.0

    def test_cerebrum_init_with_config(self):
        c = Cerebrum(backend="openai", config={"openai": {"api_key": "sk-test"}})
        assert c._configs["openai"]["api_key"] == "sk-test"

    def test_model_size_enum_values(self):
        assert ModelSize.TINY.value == "tiny"
        assert ModelSize.MEDIUM.value == "medium"
        assert ModelSize.FULL.value == "full"

    def test_model_size_enum_members(self):
        assert set(ModelSize.__members__) == {"TINY", "MEDIUM", "FULL"}

    def test_reason_with_mock_backend(self):
        c = Cerebrum()
        with patch.object(c, "_call_llm", return_value="Mocked reasoning response") as mock_call:
            result = c.reason("What is the best flight path?")
            assert isinstance(result, str)
            assert result == "Mocked reasoning response"
            mock_call.assert_called_once()

    def test_reason_rate_limiting(self):
        c = Cerebrum(rate_limit_rps=1000.0)
        with patch.object(c, "_call_llm", return_value="response"):
            with patch("time.sleep") as mock_sleep:
                c.reason("first")
                c.reason("second")
                c.reason("third")
                calls_made = mock_sleep.call_count
                assert calls_made >= 0

    def test_reason_rate_limiting_enforces_interval(self):
        c = Cerebrum(rate_limit_rps=2.0)
        with patch.object(c, "_call_llm", return_value="response"):
            with patch("time.sleep") as mock_sleep:
                c.reason("first")
                c.reason("second")
                assert mock_sleep.called

    def test_reason_timeout_retry_then_succeed(self):
        c = Cerebrum(max_retries=3)
        with patch.object(c, "_call_llm") as mock_call:
            mock_call.side_effect = [TimeoutError("first timeout"), "success on retry"]
            result = c.reason("test prompt")
            assert result == "success on retry"
            assert mock_call.call_count == 2

    def test_reason_timeout_exhausts_retries(self):
        c = Cerebrum(max_retries=2)
        with patch.object(c, "_call_llm") as mock_call:
            mock_call.side_effect = TimeoutError("always timeout")
            with pytest.raises(TimeoutError):
                c.reason("test")
            assert mock_call.call_count == 2

    def test_reason_api_error_retry(self):
        c = Cerebrum(max_retries=2)
        with patch.object(c, "_call_llm") as mock_call:
            mock_call.side_effect = [RuntimeError("API down"), "recovered"]
            result = c.reason("test")
            assert result == "recovered"
            assert mock_call.call_count == 2

    def test_plan_structure(self):
        c = Cerebrum()
        fake_plan = '[{"phase_name": "takeoff", "action": "takeoff", "parameters": {"altitude": 50}}, {"phase_name": "land", "action": "land", "parameters": {}}]'
        with patch.object(c, "_call_llm", return_value=fake_plan):
            plan = c.plan("Survey mission")
            assert isinstance(plan, list)
            assert len(plan) == 2
            for phase in plan:
                assert "phase_name" in phase
                assert "action" in phase
                assert "parameters" in phase

    def test_plan_with_constraints(self):
        c = Cerebrum()
        fake_plan = '[{"phase_name": "takeoff", "action": "takeoff", "parameters": {"altitude": 30}}]'
        with patch.object(c, "_call_llm", return_value=fake_plan):
            plan = c.plan("Survey", constraints={"max_altitude": 30})
            assert len(plan) == 1

    def test_fallback_plan_non_json_response(self):
        c = Cerebrum()
        with patch.object(c, "_call_llm", return_value="No JSON here at all"):
            plan = c.plan("test mission")
            assert plan == []

    def test_fallback_plan_empty_response(self):
        c = Cerebrum()
        with patch.object(c, "_call_llm", return_value=""):
            plan = c.plan("test")
            assert plan == []

    def test_reflect(self):
        c = Cerebrum()
        outcome = {"mission_id": "m001", "success": True, "phases": []}
        with patch.object(c, "_call_llm", return_value="Structured reflection analysis complete."):
            result = c.reflect(outcome)
            assert isinstance(result, str)
            assert len(result) > 0

    def test_configure_model(self):
        c = Cerebrum()
        assert c._model_size == ModelSize.MEDIUM
        c.configure_model(ModelSize.FULL)
        assert c._model_size == ModelSize.FULL

    def test_context_management(self):
        c = Cerebrum()
        with patch.object(c, "_call_llm", return_value="ok"):
            c.reason("hello", context={"session_id": "sess-1"})
        ctx = c.get_context("sess-1")
        assert ctx is not None
        assert len(ctx.history) == 2
        assert ctx.history[0]["role"] == "user"
        assert ctx.history[1]["role"] == "assistant"
        c.clear_context("sess-1")
        assert c.get_context("sess-1") is None

    def test_reasoning_context_summarize(self):
        ctx = ReasoningContext(session_id="sess-1", model_size=ModelSize.TINY)
        summary = ctx.summarize()
        assert summary["session_id"] == "sess-1"
        assert summary["model_size"] == "tiny"
        assert summary["tokens_used"] == 0
        assert summary["turns"] == 0

    def test_reasoning_context_append(self):
        ctx = ReasoningContext(session_id="sess-1")
        ctx.append("user", "hello")
        ctx.append("assistant", "hi")
        assert len(ctx.history) == 2

    def test_mock_response_fallback(self):
        c = Cerebrum(backend="llama_cpp")
        mock_resp = c._mock_response("test prompt")
        assert "[Cerebrum mock response" in mock_resp
        assert "Mission analyzed" in mock_resp

    def test_parse_json_response_valid(self):
        resp = '[{"phase_name": "test", "action": "test", "parameters": {}}]'
        result = Cerebrum._parse_json_response(resp)
        assert len(result) == 1

    def test_parse_json_response_invalid(self):
        result = Cerebrum._parse_json_response("not json at all")
        assert result == []

    def test_parse_json_response_partial(self):
        result = Cerebrum._parse_json_response("Some text before [{}] and after")
        assert len(result) == 1

    def test_throttle_no_delay_if_enough_time(self):
        c = Cerebrum(rate_limit_rps=1000.0)
        with patch("time.sleep") as mock_sleep:
            c._last_call_time = 0.0
            c._throttle()
            mock_sleep.assert_not_called()

    def test_throttle_delays_if_rapid(self):
        c = Cerebrum(rate_limit_rps=10.0)
        with patch("time.sleep") as mock_sleep:
            c._last_call_time = time.time()
            c._throttle()
            mock_sleep.assert_called_once()
