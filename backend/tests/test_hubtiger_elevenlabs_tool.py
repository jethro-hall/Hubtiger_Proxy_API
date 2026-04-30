from __future__ import annotations

import httpx
from fastapi.testclient import TestClient

from ghostdash_api import control_api, voice_ingress
from ghostdash_api.schemas import PublicToolResult
from ghostdash_api.integrations import hubtiger_elevenlabs_tool as hubtiger_tool_mod


def test_health_requires_voice_key(monkeypatch) -> None:
    app = control_api.create_app()
    client = TestClient(app)
    monkeypatch.setattr(voice_ingress.settings, "app_voice_ingress_secret", "voice-secret")
    monkeypatch.setattr(voice_ingress.settings, "elevenlabs_hubtiger_webhook_secret", "hook-secret")

    response = client.get("/api/elevenlabs/hubtiger/health")
    assert response.status_code == 401


def test_health_mcp_probe_timeout_returns_504_with_error_code(monkeypatch) -> None:
    """Clients must be able to distinguish MCP probe timeout from generic unavailable."""

    class _ProbeSettings:
        hubtiger_mcp_url = "http://hubtiger-mcp:8096"
        hubtiger_mcp_health_timeout_ms = 4000

    class _TimeoutClient:
        def __init__(self, *args, **kwargs):
            pass

        async def __aenter__(self):
            return self

        async def __aexit__(self, *args):
            return False

        async def get(self, url: str):
            raise httpx.ReadTimeout("timeout", request=httpx.Request("GET", url))

    app = control_api.create_app()
    client = TestClient(app)
    monkeypatch.setattr(voice_ingress.settings, "app_voice_ingress_secret", "voice-secret")
    monkeypatch.setattr(voice_ingress.settings, "elevenlabs_hubtiger_webhook_secret", "hook-secret")
    monkeypatch.setattr(hubtiger_tool_mod, "get_settings", lambda: _ProbeSettings())
    monkeypatch.setattr(hubtiger_tool_mod.httpx, "AsyncClient", _TimeoutClient)

    response = client.get("/api/elevenlabs/hubtiger/health", headers={"X-Ghost-Voice-Key": "hook-secret"})
    assert response.status_code == 504
    body = response.json()
    assert body["ready"] is False
    assert body["error_code"] == "hubtiger_mcp_health_timeout"
    assert body["timeout_ms"] == 4000
    assert "timed out" in body["message"].lower()


def test_lookup_tool_supports_phone_and_hides_internal_fields(monkeypatch) -> None:
    app = control_api.create_app()
    client = TestClient(app)
    monkeypatch.setattr(voice_ingress.settings, "app_voice_ingress_secret", "voice-secret")
    monkeypatch.setattr(voice_ingress.settings, "elevenlabs_hubtiger_webhook_secret", "hook-secret")

    async def fake_shared_runner(*, body, request) -> PublicToolResult:
        assert body.function == "lookup_job"
        assert body.payload.get("phone")
        assert body.customer and body.customer.phone
        return PublicToolResult(
            success=True,
            blocked=False,
            message="Lookup completed.",
            operation="job_lookup",
            data={"results": [{"id": 123, "status": "Booked In"}]},
        )

    monkeypatch.setattr(
        "ghostdash_api.integrations.hubtiger_elevenlabs_tool.run_elevenlabs_hubtiger_tool_request",
        fake_shared_runner,
    )

    response = client.post(
        "/api/elevenlabs/hubtiger/tool",
        json={"function": "lookup_job", "phone": "0435185134"},
        headers={"X-Ghost-Voice-Key": "hook-secret"},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["success"] is True
    assert body["operation"] == "job_lookup"
    assert body["message"] == "Lookup completed."


def test_lookup_tool_rejects_non_lookup_functions(monkeypatch) -> None:
    app = control_api.create_app()
    client = TestClient(app)
    monkeypatch.setattr(voice_ingress.settings, "app_voice_ingress_secret", "voice-secret")
    monkeypatch.setattr(voice_ingress.settings, "elevenlabs_hubtiger_webhook_secret", "hook-secret")

    response = client.post(
        "/api/elevenlabs/hubtiger/tool",
        json={"function": "booking_availability", "phone": "0435185134"},
        headers={"X-Ghost-Voice-Key": "hook-secret"},
    )
    assert response.status_code == 422
