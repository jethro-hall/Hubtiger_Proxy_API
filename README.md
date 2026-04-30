# Hubtiger Proxy API - GhostDASH Package

This repository now tracks the consolidated Hubtiger architecture and implementation package exported from the GhostDASH runtime build.

## What is included

- `services/` - Hubtiger MCP service (`index.js`, tests, Dockerfile, package manifest)
- `scripts/` - Hubtiger proxy service, API scripts, and tooling payload samples
- `backend/src/ghostdash_api/hubtiger_mcp.py` - canonical Hubtiger adapter/normalization path
- `backend/src/integrations/elevenlabs_hubtiger/router.py` - ElevenLabs to Hubtiger bridge route
- `backend/tests/` - Hubtiger adapter and ElevenLabs integration tests
- `docs/` - operator playbook and full architecture documentation
- `artefacts/` - implementation and verification artefacts

## Branch policy applied

- Previous `main` content was preserved under branch `Old`.
- `main` now contains the Hubtiger package in totality.

## Suggested verification commands

```bash
python -m pytest backend/tests/test_hubtiger_mcp_adapter.py backend/tests/test_hubtiger_elevenlabs_tool.py backend/tests/test_elevenlabs_hubtiger_ingress.py
node --test services/index.test.js
```
