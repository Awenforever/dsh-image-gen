# dsh-image-gen

A model-facing text-to-image tool for [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness).

## What it does

Registers one global tool, `image_generate`, that calls an OpenAI-compatible
`POST /v1/images/generations` endpoint and writes the returned PNG files to disk.
The images never enter the conversation; the tool returns absolute paths so the
model can reference them and the UI can render them.

```
image_generate(prompt, count?, size?, output_dir?, filename?)
  -> { files: [{ path, bytes }], model, size }
```

## Install

```sh
dsh plugin --profile <name> add dsh-image-gen
```

Then add the bundle to the profile and configure it:

```yaml
- id: image-gen
  name: dsh-image-gen
  config:
    baseURL: https://api.llm.ustc.edu.cn/
    model: qwen-image-2.1
    apiKeyEnv: USTC1_API_KEY
    defaultSize: 1024x1024
    maxCount: 4
    timeoutMs: 180000
```

## Configuration

| Field | Meaning |
|---|---|
| `baseURL` | Gateway root; the tool appends `/v1/images/generations` |
| `model` | Image model id, e.g. `qwen-image-2.1` |
| `apiKeyEnv` | Credential name resolved through the DSH credential store (falls back to the environment) |
| `defaultSize` | One of `1024x1024`, `1024x768`, `768x1024`, `512x512` |
| `maxCount` | Upper bound for the per-call `count` argument (1-8) |
| `timeoutMs` | Per-request deadline |
| `outputDir` | Optional fixed output directory; otherwise `<session cwd>/images` |

## Why base64

The gateway returns a relative `url` unless the request carries
`extra_body.response_format = "b64_json"`; fetching that relative URL answers 404.
This plugin always asks for base64, so it works regardless of gateway version.

## Design notes

- The config schema is a schemastery `z.object`; a plain object makes cordis fail
  with `Cannot read properties of undefined (reading 'validate')` and the entry
  never activates.
- The API key is resolved through `ctx.get('credentials')`, so a key stored from
  the Models page works with no extra configuration.
- Nothing is uploaded anywhere; files land on disk and only paths cross the
  model boundary.

## License

MIT
