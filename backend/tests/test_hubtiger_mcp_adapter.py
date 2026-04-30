from __future__ import annotations

from ghostdash_api.hubtiger_mcp import build_hubtiger_execute_request, normalize_hubtiger_tool_call


def test_build_execute_request_for_availability_lookup() -> None:
    request = build_hubtiger_execute_request(
        "availability_lookup",
        {
            "store": "brisbane",
            "start_date": "2026-04-29",
            "end_date": "2026-05-02",
            "requiredMinutes": 90,
        },
    )
    assert request is not None
    assert request["method"] == "GET"
    assert request["proxy_path"].startswith("/availability/technicians?")
    assert "store=brisbane" in request["proxy_path"]
    assert "fromDate=2026-04-29" in request["proxy_path"]
    assert "toDate=2026-05-02" in request["proxy_path"]
    assert "requiredMinutes=90" in request["proxy_path"]


def test_build_execute_request_for_job_lookup_with_phone() -> None:
    request = build_hubtiger_execute_request(
        "job_lookup",
        {"phone": "+61412345678"},
    )
    assert request is not None
    assert request["method"] == "POST"
    assert request["proxy_path"] == "/jobs/search"
    assert request["proxy_body"]["q"] == "0412345678"
    assert request["proxy_body"]["allStores"] is True


def test_build_execute_request_for_job_lookup_with_job_id() -> None:
    request = build_hubtiger_execute_request(
        "job_lookup",
        {"job_id": "12345"},
    )
    assert request is not None
    assert request["method"] == "POST"
    assert request["proxy_path"] == "/jobs/search"
    assert request["proxy_body"]["q"] == "12345"
    assert request["proxy_body"]["allStores"] is True


def test_build_execute_request_for_job_search_with_phone() -> None:
    request = build_hubtiger_execute_request(
        "job_search",
        {"phone": "+614135185134"},
    )
    assert request is not None
    assert request["method"] == "POST"
    assert request["proxy_path"] == "/jobs/search"
    assert request["proxy_body"]["q"] == "+614135185134"


def test_build_execute_request_for_job_retrieve_uses_job_card_identifier() -> None:
    request = build_hubtiger_execute_request(
        "job_retrieve",
        {"job_card_no": "#35872"},
    )
    assert request is not None
    assert request["method"] == "POST"
    assert request["proxy_path"] == "/jobs/search"
    assert request["proxy_body"]["q"] == "#35872"
    assert request["proxy_body"]["allStores"] is True


def test_build_execute_request_for_quote_preview_missing_data_returns_none() -> None:
    request = build_hubtiger_execute_request(
        "quote_preview",
        {"serviceId": 999},
    )
    assert request is None


def test_build_execute_request_for_booking_create_uses_bookings_route() -> None:
    request = build_hubtiger_execute_request(
        "booking_create",
        {
            "store": "brisbane",
            "firstName": "Alex",
            "lastName": "Rider",
            "mobile": "+61412345678",
            "serviceDate": "2026-04-29T10:00:00",
            "TechnicianID": 22,
            "sendCommunication": False,
        },
    )
    assert request is not None
    assert request["method"] == "POST"
    assert request["proxy_path"] == "/bookings?sendCommunication=false"
    assert request["proxy_body"]["firstName"] == "Alex"
    assert "sendCommunication" not in request["proxy_body"]


def test_build_execute_request_for_quote_add_line_item_uses_commit_path() -> None:
    request = build_hubtiger_execute_request(
        "quote_add_line_item",
        {
            "serviceId": 444,
            "search": "brake pads",
            "quantity": 2,
        },
    )
    assert request is not None
    assert request["method"] == "POST"
    assert request["proxy_path"] == "/quotes/find-add"
    assert request["proxy_body"] == {
        "serviceId": 444,
        "search": "brake pads",
        "quantity": 2,
        "dryRun": False,
    }


def test_normalize_hubtiger_tool_call_accepts_prefixed_aliases() -> None:
    operation, payload = normalize_hubtiger_tool_call(
        function="hubtiger_quote_preview",
        payload={"serviceId": 99, "search": "chain"},
    )
    assert operation == "quote_preview"
    assert payload["serviceId"] == 99
    assert payload["search"] == "chain"


def test_normalize_hubtiger_tool_call_rejects_unsupported_legacy_tools() -> None:
    try:
        normalize_hubtiger_tool_call(function="hubtiger_quote_request_approval_sms", payload={})
    except ValueError as exc:
        assert "unsupported" in str(exc).lower()
    else:
        raise AssertionError("unsupported legacy HubTiger tool should fail closed")
