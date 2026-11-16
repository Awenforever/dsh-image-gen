# Changelog

## 0.1.1 - 2026-11-16

- Split the pure helpers out into `lib/core.js` so behaviour is testable without
  any DSH dependency.
- Add 11 unit tests (`node --test`) and a two-OS GitHub Actions workflow.
- No behaviour change: the tool still always requests `b64_json`.

## 0.1.0 - 2026-11-16

- Initial release.
- Adds the `image_generate` tool backed by an OpenAI-compatible
  `POST /v1/images/generations` endpoint.
- Always requests `b64_json` through `extra_body.response_format`; the gateway's
  relative `url` field 404s when fetched, so base64 is the only usable path.
- Resolves the API key through the DSH credential store, falling back to the
  process environment.
- Writes PNG files to disk and returns absolute paths; image bytes never enter
  the conversation.
