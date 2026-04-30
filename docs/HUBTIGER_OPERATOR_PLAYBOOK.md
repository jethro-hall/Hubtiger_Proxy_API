# HubTiger Operator Playbook

## Purpose

This playbook is the operator-facing guide for HubTiger tool usage in GhostDASH and Magic Mike.  
It maps customer requests to canonical tool functions, required fields, expected backend behavior, and safe response patterns.

## Canonical Tool Endpoint

- URL: `POST /api/elevenlabs/hubtiger/tool`
- Auth: `X-Ghost-Voice-Key` or `Authorization: Bearer`
- Body shape (minimal):
  - `function`
  - `store` and/or `date` fields depending on function
  - `customer` and `payload` as needed

Example:

```json
{
  "function": "lookup_job",
  "store": "southport",
  "customer": { "phone": "0435185134" },
  "payload": {}
}
```

## Function Map (Customer Intent -> Function)

- "Find my jobs" -> `job_search`
- "Open this specific job card" -> `job_retrieve`
- "When can I book in?" -> `booking_availability`
- "Can you preview quote for brake pads?" -> `quote_preview`
- "Book it in now" -> `booking_create` (blocked in read-only mode)
- "Add this line item to quote" -> `quote_add_line_item` (blocked in read-only mode)

## ElevenLabs Workflow Tool Usage (Ready Template)

Use this workflow when configuring an ElevenLabs agent that calls GhostDASH HubTiger tools.

### Shared tool endpoint

- URL: `POST /api/elevenlabs/hubtiger/tool`
- Auth: `X-Ghost-Voice-Key` or `Authorization: Bearer`
- Required top-level key: `function`
- Optional helpers: `store`, `date`, `start_date`, `end_date`, `customer`, `payload`

### Workflow state machine

1. Identify intent: job check, booking, quote, or write action.
2. Collect only minimum required fields for that function.
3. Call one tool at a time in deterministic order.
4. Convert result to short customer-safe response.
5. If result is blocked or unavailable, offer one concrete next step.

### Workflow A: Existing job check (two-step, preferred)

Step A1: Search list

```json
{
  "function": "job_search",
  "store": "southport",
  "customer": { "phone": "0435185134" },
  "payload": {}
}
```

Step A2: Retrieve selected case

```json
{
  "function": "job_retrieve",
  "store": "southport",
  "payload": { "job_card_no": "#35872" }
}
```

Voice behavior:
- If multiple cases return, ask which job card to open.
- Ask one question only.

### Workflow B: New booking availability then submit

Step B1: Availability lookup

```json
{
  "function": "booking_availability",
  "store": "brisbane",
  "start_date": "2026-04-30",
  "payload": {}
}
```

Step B2: Booking create (only when write mode is enabled)

```json
{
  "function": "booking_create",
  "store": "brisbane",
  "payload": {
    "first_name": "Sam",
    "last_name": "Rider",
    "mobile": "0435123456",
    "bike_brand": "Fatfish",
    "bike_model": "Fatfish OG",
    "start": "2026-04-30T10:00:00+10:00"
  }
}
```

Voice behavior:
- In `read_only` mode, do not claim the booking is completed.
- Offer to connect booking support or capture details for callback.

### Workflow C: Quote flow (strict order)

Step C1: Preview first

```json
{
  "function": "quote_preview",
  "store": "southport",
  "payload": { "job_id": "4200325", "search": "brake pads" }
}
```

Step C2: Add line item only after preview success

```json
{
  "function": "quote_add_line_item",
  "store": "southport",
  "payload": { "job_id": "4200325", "invoice_item_id": "12345", "qty": 1 }
}
```

Voice behavior:
- If preview is unavailable, keep response short and action-oriented.
- Offer one next step (team follow-up or callback).

### Workflow D: Guardrails and fail-closed behavior

- Never expose traces, backend errors, internal diagnostics, or tool internals.
- Never claim booking, quote, availability, or job outcome without tool success.
- If legal/compliance question is asked and approved source is missing, use legal fallback wording and offer handoff.
- For unknown price/stock/availability/job status, do not guess; offer to check now.

### ElevenLabs agent prompt block (copy/paste)

Use GhostDASH HubTiger tools in deterministic order.
For existing job queries, call job_search first, then job_retrieve with selected job_card_no or job_id.
For new bookings, call booking_availability before booking_create.
For quote flows, call quote_preview before quote_add_line_item.
Call one tool at a time and ask one question at a time.
If a tool is blocked, unavailable, or missing required evidence, do not guess and do not expose internals; offer one clear next action.
Keep spoken responses short, conversational, and action-oriented.

## Per-Function Workflow

### 1) `job_search` (canonical operation: `job_search`)

**Minimum input**
- `function=job_search`
- one customer identifier:
  - `customer.phone`, or
  - customer name fields, or
  - `payload.query`

**Runtime behavior**
1. Backend normalizes fields and trims excess.
2. Deterministic query builder selects best identifier.
3. Routes to MCP:
   - `POST /jobs/search` using customer identifier.
4. Results are size-limited and redacted before returning.
5. LLM crafts short customer response.

**Operator response target**
- Job card number
- Status
- Last update
- ask which job card should be opened when multiple cases are returned

### 2) `job_retrieve` (canonical operation: `job_retrieve`)

**Minimum input**
- `function=job_retrieve`
- selected job identifier:
  - `payload.job_card_no`, or
  - `payload.job_id`

**Runtime behavior**
1. Backend validates selected case identifier.
2. Deterministic mapper routes to `POST /jobs/search` with selected identifier.
3. Response is trimmed and shaped into a single-case result where possible.
4. LLM responds with concise selected-case details and next step.

### 3) `booking_availability` (canonical operation: `availability_lookup`)

**Minimum input**
- `function=booking_availability`
- `store`
- `start_date` or `date`

**Runtime behavior**
1. Backend validates required fields.
2. Deterministic mapper builds availability request.
3. Default availability window is constrained when `end_date` is absent.
4. Proxy fetches technician availability from portal APIs.
5. Rows are capped and an `earliest` slot summary is included.
6. LLM returns concise booking options.

**Operator response target**
- Earliest available slot
- Store confirmation
- One clear prompt to confirm booking preference

### 4) `quote_preview` (canonical operation: `quote_preview`)

**Minimum input**
- `function=quote_preview`
- `payload.job_id` (or service id alias)
- `payload.search` (part/service text)

**Runtime behavior**
1. Backend trims and validates search text.
2. Optional local LLM compacts oversized search phrases to a short lookup phrase.
3. Deterministic route calls quote preview chain through MCP/proxy.
4. Proxy attempts product lookup + invoice context.
5. If upstream product sync is unavailable, returns controlled unavailable response.

**Operator response target**
- If successful: preview line item summary + ask for approval.
- If unavailable: explain delay and offer follow-up/handoff.

### 5) `booking_create` and `quote_add_line_item`

**Current mode**
- Blocked while `HUBTIGER_TOOL_ACCESS=read_only`.

**Expected behavior**
- Backend returns deterministic blocked message.
- LLM should provide safe next step rather than pretending write succeeded.

## Input Rules and Limits

- Payload keys are allowlisted per function.
- Unknown/unneeded fields are ignored before routing.
- Search fields are trimmed to bounded size.
- Response arrays and payload size are bounded before returning to voice/chat.

## Customer-Safe Response Rules

- Do not expose traces, backend internals, or gateway errors.
- If operation is unavailable, offer one concrete next action.
- Keep voice responses short and action-oriented.
- Do not guess status, stock, booking outcomes, or legal/compliance claims.

## Fast Troubleshooting

1. Confirm endpoint health:
   - `GET /health`
2. Confirm tool route:
   - `POST /api/elevenlabs/hubtiger/tool`
3. Validate function fields:
   - job lookup needs one identifier
   - availability needs store + date
   - quote preview needs job/service id + search
4. If quote preview fails with unavailable:
   - likely upstream product sync lane issue (known dependency)

## Smoke Test Commands

```bash
curl -sS -X POST "https://ghoststack.rideai.com.au/api/elevenlabs/hubtiger/tool" \
  -H "Content-Type: application/json" \
  -H "X-Ghost-Voice-Key: <SECRET>" \
  -d '{"function":"job_search","store":"southport","customer":{"phone":"0435185134"},"payload":{}}'
```

```bash
curl -sS -X POST "https://ghoststack.rideai.com.au/api/elevenlabs/hubtiger/tool" \
  -H "Content-Type: application/json" \
  -H "X-Ghost-Voice-Key: <SECRET>" \
  -d '{"function":"job_retrieve","store":"southport","payload":{"job_card_no":"#35872"}}'
```

```bash
curl -sS -X POST "https://ghoststack.rideai.com.au/api/elevenlabs/hubtiger/tool" \
  -H "Content-Type: application/json" \
  -H "X-Ghost-Voice-Key: <SECRET>" \
  -d '{"function":"booking_availability","store":"brisbane","start_date":"2026-04-29","payload":{}}'
```

```bash
curl -sS -X POST "https://ghoststack.rideai.com.au/api/elevenlabs/hubtiger/tool" \
  -H "Content-Type: application/json" \
  -H "X-Ghost-Voice-Key: <SECRET>" \
  -d '{"function":"quote_preview","store":"southport","payload":{"job_id":"4200325","search":"brake pads"}}'
```
