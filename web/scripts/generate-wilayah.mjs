import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT = join(__dirname, '..', 'public', 'data', 'wilayah.json')
const SOURCE_URL =
  'https://raw.githubusercontent.com/cahyadsn/wilayah/master/db/wilayah.sql'

async function download(url, timeoutMs = 120000) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch(url, { signal: controller.signal })
    if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`)
    return await res.text()
  } finally {
    clearTimeout(timer)
  }
}

function parseTuples(sql) {
  const tuples = []
  const re = /^\s*\('((?:[^']|'')*)','((?:[^']|'')*)'\)/gm
  let m
  while ((m = re.exec(sql)) !== null) {
    tuples.push([m[1].replace(/''/g, "'"), m[2].replace(/''/g, "'")])
  }
  return tuples
}

function byName(a, b) {
  return a[1].localeCompare(b[1], 'id')
}

function build(rows) {
  const provinsi = []
  const kabupaten = {}
  const kecamatan = {}
  const desa = {}

  let count = 0
  for (const [kode, nama] of rows) {
    const depth = kode.split('.').length
    const sanitized = kode.trim()
    if (sanitized.length === 0) continue
    count++
    if (depth === 1) {
      provinsi.push([kode, nama])
    } else if (depth === 2) {
      const p = kode.split('.').slice(0, 1).join('.')
      ;(kabupaten[p] ||= []).push([kode, nama])
    } else if (depth === 3) {
      const p = kode.split('.').slice(0, 2).join('.')
      ;(kecamatan[p] ||= []).push([kode, nama])
    } else {
      const p = kode.split('.').slice(0, 3).join('.')
      ;(desa[p] ||= []).push([kode, nama])
    }
  }

  provinsi.sort(byName)
  for (const key of Object.keys(kabupaten)) kabupaten[key].sort(byName)
  for (const key of Object.keys(kecamatan)) kecamatan[key].sort(byName)
  for (const key of Object.keys(desa)) desa[key].sort(byName)

  const totalKab = Object.values(kabupaten).reduce((n, v) => n + v.length, 0)
  const totalKec = Object.values(kecamatan).reduce((n, v) => n + v.length, 0)
  const totalDesa = Object.values(desa).reduce((n, v) => n + v.length, 0)

  return {
    v: 1,
    generated: new Date().toISOString().slice(0, 10),
    count,
    summary: {
      provinsi: provinsi.length,
      kabupaten: totalKab,
      kecamatan: totalKec,
      desa: totalDesa,
    },
    p: provinsi,
    kab: kabupaten,
    kec: kecamatan,
    desa,
  }
}

async function main() {
  let sql
  const local = process.argv[2]
  if (local) {
    sql = readFileSync(local, 'utf8')
    console.log(`Membaca file lokal: ${local}`)
  } else {
    console.log(`Mengunduh ${SOURCE_URL} ...`)
    sql = await download(SOURCE_URL)
  }

  const rows = parseTuples(sql)
  console.log(`Total baris wilayah: ${rows.length}`)

  const data = build(rows)
  mkdirSync(dirname(OUT), { recursive: true })
  writeFileSync(OUT, JSON.stringify(data))
  console.log(`Ditulis ke ${OUT}`)
}

main().catch((err) => {
  console.error('Gagal membuat data wilayah:', err)
  process.exit(1)
})