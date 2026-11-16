/**
 * Pure helpers for dsh-image-gen: no DSH imports, no filesystem writes.
 *
 * Keeping them here means the behaviour the tool relies on can be tested with
 * nothing but Node, which is what CI runs.
 * @module dsh-image-gen/core
 */

/** Sizes the gateway accepts today. */
export const SIZES = ['1024x1024', '1024x768', '768x1024', '512x512']

/**
 * Turn a prompt into a safe, short file stem.
 * @param prompt - the request text.
 * @returns a filesystem-safe stem, never empty.
 */
export function stem(prompt) {
  const ascii = String(prompt)
    .normalize('NFKD')
    .replace(/[^\p{Letter}\p{Number}]+/gu, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase()
  const trimmed = ascii.slice(0, 48).replace(/-+$/g, '')
  return trimmed === '' ? 'image' : trimmed
}

/**
 * Build the JSON body for POST /v1/images/generations.
 *
 * extra_body.response_format is not optional: without it the gateway answers with a
 * relative url that returns 404 when fetched.
 * @param options - the request fields.
 * @returns the request body object.
 */
export function buildRequestBody({ model, prompt, count = 1, size }) {
  return {
    model,
    prompt,
    n: count,
    size,
    extra_body: { response_format: 'b64_json' },
  }
}

/**
 * Extract PNG buffers from a response payload.
 * @param payload - the parsed JSON response.
 * @returns one Buffer per image.
 * @throws when the payload carries no usable image data.
 */
export function decodeImages(payload) {
  const entries = Array.isArray(payload?.data) ? payload.data : []
  if (entries.length === 0) throw new Error('image_generate: the endpoint returned no image data')
  return entries.map((entry, index) => {
    const base64 = entry?.b64_json
    if (typeof base64 !== 'string' || base64 === '') {
      throw new Error('image_generate: the endpoint returned no b64_json for image ' + String(index + 1))
    }
    return Buffer.from(base64, 'base64')
  })
}

/**
 * Pick the directory an image is written to.
 * @param options - the candidate sources, in priority order.
 * @returns an absolute directory path.
 */
export function pickOutputDir({ explicit, configured, cwdCandidates = [], fallback }) {
  if (typeof explicit === 'string' && explicit.trim() !== '') return { dir: explicit.trim(), from: 'argument' }
  if (typeof configured === 'string' && configured.trim() !== '') return { dir: configured.trim(), from: 'config' }
  for (const candidate of cwdCandidates) {
    if (typeof candidate === 'string' && candidate !== '') return { dir: candidate, from: 'cwd' }
  }
  return { dir: fallback, from: 'fallback' }
}

/**
 * Compose the file name for one image of a batch.
 * @param options - the naming inputs.
 * @returns a file stem without extension.
 */
export function fileNameFor({ prompt, filename, index, total }) {
  const explicit = typeof filename === 'string' && filename.trim() !== ''
  if (explicit && total === 1) return filename.trim().replace(/\.[A-Za-z0-9]+$/, '')
  return stem(prompt) + '-' + String(index + 1)
}
