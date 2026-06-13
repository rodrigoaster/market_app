// Gera ícones PNG do PWA sem dependências externas (usa zlib nativo).
// Ícone: fundo verde com uma cesta de feira branca estilizada.
import { deflateSync } from 'node:zlib'
import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname } from 'node:path'

const GREEN = [22, 163, 74] // #16a34a
const WHITE = [255, 255, 255]

function makeIcon(size) {
  const px = (x, y, c) => {
    const i = (y * size + x) * 4
    buf[i] = c[0]; buf[i + 1] = c[1]; buf[i + 2] = c[2]; buf[i + 3] = 255
  }
  const buf = Buffer.alloc(size * size * 4)
  // fundo verde
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) px(x, y, GREEN)

  const rect = (x0, y0, w, h, c) => {
    for (let y = y0; y < y0 + h; y++)
      for (let x = x0; x < x0 + w; x++)
        if (x >= 0 && x < size && y >= 0 && y < size) px(x, y, c)
  }

  // cesta (trapézio aproximado) em branco
  const u = size / 16
  // alça
  const handleW = Math.round(u * 0.7)
  for (let i = 0; i < Math.round(u * 4); i++) {
    const t = i / (u * 4)
    const x = Math.round(size / 2 - u * 2 + t * u * 4)
    const y = Math.round(u * 4 + Math.sin(Math.PI * t) * -u * 2 + u * 2)
    rect(x, y, handleW, handleW, WHITE)
  }
  // corpo da cesta
  const top = Math.round(u * 5.5)
  const bottom = Math.round(u * 12)
  for (let y = top; y < bottom; y++) {
    const t = (y - top) / (bottom - top)
    const inset = Math.round(u * 1.2 * t)
    const x0 = Math.round(u * 3.5) + inset
    const x1 = Math.round(u * 12.5) - inset
    rect(x0, y, x1 - x0, 1, WHITE)
  }
  // recorta linhas verticais (vime) em verde
  for (let k = 0; k < 5; k++) {
    const x = Math.round(u * 4.5 + k * u * 1.6)
    rect(x, top + 1, Math.max(1, Math.round(u * 0.25)), bottom - top - 2, GREEN)
  }

  return encodePng(buf, size)
}

function encodePng(rgba, size) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
  const chunk = (type, data) => {
    const len = Buffer.alloc(4); len.writeUInt32BE(data.length, 0)
    const t = Buffer.from(type, 'ascii')
    const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(Buffer.concat([t, data])), 0)
    return Buffer.concat([len, t, data, crc])
  }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8; ihdr[9] = 6 // 8-bit, RGBA
  // filtro 0 por scanline
  const raw = Buffer.alloc((size * 4 + 1) * size)
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0
    rgba.copy(raw, y * (size * 4 + 1) + 1, y * size * 4, (y + 1) * size * 4)
  }
  const idat = deflateSync(raw)
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('IEND', Buffer.alloc(0))])
}

const CRC_TABLE = (() => {
  const t = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    t[n] = c >>> 0
  }
  return t
})()
function crc32(buf) {
  let c = 0xffffffff
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

for (const size of [192, 512]) {
  const out = `public/icons/icon-${size}.png`
  mkdirSync(dirname(out), { recursive: true })
  writeFileSync(out, makeIcon(size))
  console.log('wrote', out)
}
