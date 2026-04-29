#!/usr/bin/env node

import fs from 'node:fs/promises'
import path from 'node:path'
import matter from 'gray-matter'

function normalizeISBN(raw) {
  if (!raw) return null
  const value = String(raw).replace(/[-\s]/g, '').toUpperCase()
  if (/^\d{13}$/.test(value)) return { key: 'isbn_13', value }
  if (/^\d{9}[\dX]$/.test(value)) return { key: 'isbn_10', value }
  return null
}

function parseArgs(argv) {
  const args = { dir: null, write: false }
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]
    if (arg === '--write') {
      args.write = true
      continue
    }
    if (arg === '--dry-run') {
      args.write = false
      continue
    }
    if (arg === '--dir') {
      args.dir = argv[index + 1]
      index += 1
      continue
    }
  }
  return args
}

const args = parseArgs(process.argv.slice(2))
const dir = args.dir ? path.resolve(args.dir) : null

if (!dir) {
  console.error('Uso: node scripts/migrate-isbn-frontmatter.mjs --dir "/caminho/livros" [--write]')
  process.exit(1)
}

const entries = await fs.readdir(dir)
const mdFiles = entries.filter((entry) => entry.endsWith('.md'))
const changes = []

for (const file of mdFiles) {
  const filepath = path.join(dir, file)
  const raw = await fs.readFile(filepath, 'utf-8')
  const parsed = matter(raw)
  const legacyISBN = normalizeISBN(parsed.data.isbn)

  if (!legacyISBN || parsed.data[legacyISBN.key]) {
    continue
  }

  changes.push({
    file,
    key: legacyISBN.key,
    value: legacyISBN.value,
  })

  if (args.write) {
    const updated = matter.stringify(parsed.content, {
      ...parsed.data,
      [legacyISBN.key]: legacyISBN.value,
    })
    await fs.writeFile(filepath, updated, 'utf-8')
  }
}

const mode = args.write ? 'write' : 'dry-run'
console.log(`[${mode}] ${changes.length} arquivo(s) com ISBN legado migrável.`)
for (const change of changes) {
  console.log(`${change.file}: ${change.key}=${change.value}`)
}
