import fs from 'fs/promises'
import path from 'path'
import matter from 'gray-matter'

const projectRoot = process.cwd()
const usersRoot = path.join(projectRoot, 'data', 'users')

async function findBookFiles(root) {
  const entries = await fs.readdir(root, { withFileTypes: true })
  const files = []

  for (const entry of entries) {
    const fullPath = path.join(root, entry.name)
    if (entry.isDirectory()) {
      files.push(...(await findBookFiles(fullPath)))
      continue
    }

    if (entry.isFile() && fullPath.endsWith('.md') && fullPath.includes(`${path.sep}books${path.sep}`)) {
      files.push(fullPath)
    }
  }

  return files
}

async function resolveLanguageFromGoogleBooks(isbn) {
  const response = await fetch(`https://www.googleapis.com/books/v1/volumes?q=isbn:${encodeURIComponent(isbn)}`)
  if (!response.ok) return null

  const payload = await response.json()
  return payload?.items?.[0]?.volumeInfo?.language ?? null
}

async function resolveLanguageFromOpenLibrary(isbn) {
  const response = await fetch(
    `https://openlibrary.org/search.json?isbn=${encodeURIComponent(isbn)}&fields=language`,
  )
  if (!response.ok) return null

  const payload = await response.json()
  return payload?.docs?.[0]?.language?.[0] ?? null
}

async function main() {
  const files = await findBookFiles(usersRoot)
  let updated = 0

  for (const file of files) {
    const raw = await fs.readFile(file, 'utf-8')
    const parsed = matter(raw)
    const isbn = String(parsed.data.isbn ?? '').trim()

    if (parsed.data.language || !isbn) {
      continue
    }

    const language =
      (await resolveLanguageFromGoogleBooks(isbn)) ??
      (await resolveLanguageFromOpenLibrary(isbn))

    if (!language) {
      continue
    }

    parsed.data.language = language
    await fs.writeFile(file, matter.stringify(parsed.content, parsed.data), 'utf-8')
    updated += 1
    console.log(`updated ${path.relative(projectRoot, file)} -> ${language}`)
  }

  console.log(`backfill complete: ${updated} book(s) updated`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
