import assert from 'node:assert/strict'
import test from 'node:test'

import { SIZES, buildRequestBody, decodeImages, fileNameFor, pickOutputDir, stem } from '../lib/core.js'

test('stem keeps CJK and strips punctuation', () => {
  assert.equal(stem('一只橘猫，坐在窗台上！'), '一只橘猫-坐在窗台上')
})

test('stem lowercases ASCII and collapses separators', () => {
  assert.equal(stem('A Blue   Ceramic  Cup!!'), 'a-blue-ceramic-cup')
})

test('stem never returns an empty name', () => {
  assert.equal(stem('!!!'), 'image')
  assert.equal(stem(''), 'image')
})

test('stem truncates to 48 characters without a trailing dash', () => {
  const long = 'a'.repeat(40) + ' ' + 'b'.repeat(40)
  const out = stem(long)
  assert.ok(out.length <= 48, 'length ' + String(out.length))
  assert.ok(!out.endsWith('-'))
})

test('buildRequestBody always asks for base64', () => {
  const body = buildRequestBody({ model: 'qwen-image-2.1', prompt: 'x', count: 2, size: '1024x1024' })
  assert.equal(body.model, 'qwen-image-2.1')
  assert.equal(body.n, 2)
  assert.equal(body.size, '1024x1024')
  assert.deepEqual(body.extra_body, { response_format: 'b64_json' })
})

test('decodeImages returns one buffer per entry', () => {
  const png = Buffer.from('fake-png-bytes')
  const out = decodeImages({ data: [{ b64_json: png.toString('base64') }, { b64_json: png.toString('base64') }] })
  assert.equal(out.length, 2)
  assert.deepEqual(out[0], png)
})

test('decodeImages rejects an empty payload', () => {
  assert.throws(() => decodeImages({}), /no image data/)
  assert.throws(() => decodeImages({ data: [] }), /no image data/)
})

test('decodeImages rejects an entry without base64', () => {
  assert.throws(() => decodeImages({ data: [{ url: '/v1/images/x/content' }] }), /no b64_json for image 1/)
})

test('pickOutputDir prefers argument over config over cwd', () => {
  assert.deepEqual(pickOutputDir({ explicit: '/tmp/a', configured: '/tmp/b', cwdCandidates: ['/tmp/c'], fallback: '/tmp/d' }), { dir: '/tmp/a', from: 'argument' })
  assert.deepEqual(pickOutputDir({ configured: '/tmp/b', cwdCandidates: ['/tmp/c'], fallback: '/tmp/d' }), { dir: '/tmp/b', from: 'config' })
  assert.deepEqual(pickOutputDir({ cwdCandidates: ['', '/tmp/c'], fallback: '/tmp/d' }), { dir: '/tmp/c', from: 'cwd' })
  assert.deepEqual(pickOutputDir({ fallback: '/tmp/d' }), { dir: '/tmp/d', from: 'fallback' })
})

test('fileNameFor uses the explicit stem only for a single image', () => {
  assert.equal(fileNameFor({ prompt: 'x', filename: 'cover.png', index: 0, total: 1 }), 'cover')
  assert.equal(fileNameFor({ prompt: 'a cat', index: 0, total: 2 }), 'a-cat-1')
  assert.equal(fileNameFor({ prompt: 'a cat', index: 1, total: 2 }), 'a-cat-2')
})

test('SIZES matches what the tool advertises', () => {
  assert.deepEqual([...SIZES], ['1024x1024', '1024x768', '768x1024', '512x512'])
})
