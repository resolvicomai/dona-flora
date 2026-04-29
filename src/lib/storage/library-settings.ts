import { constants } from 'fs'
import fs from 'fs/promises'
import path from 'path'

export interface ValidatedBooksDirectory {
  booksDir: string
  mdFileCount: number
}

export async function validateBooksDirectory(input: string): Promise<ValidatedBooksDirectory> {
  const booksDir = input.trim()

  if (!path.isAbsolute(booksDir)) {
    throw new Error('A pasta precisa ser um caminho absoluto.')
  }

  let stat
  try {
    stat = await fs.stat(booksDir)
  } catch {
    throw new Error('Pasta não encontrada.')
  }

  if (!stat.isDirectory()) {
    throw new Error('O caminho precisa apontar para uma pasta.')
  }

  try {
    await fs.access(booksDir, constants.R_OK | constants.W_OK)
  } catch {
    throw new Error('A pasta precisa permitir leitura e escrita.')
  }

  let entries: string[]
  try {
    entries = await fs.readdir(booksDir)
  } catch {
    throw new Error('Não foi possível listar os arquivos da pasta.')
  }

  const mdFiles = entries.filter((entry) => entry.endsWith('.md'))
  if (mdFiles[0]) {
    try {
      await fs.readFile(path.join(booksDir, mdFiles[0]), 'utf-8')
    } catch {
      throw new Error('Não foi possível ler os arquivos Markdown da pasta.')
    }
  }

  return {
    booksDir,
    mdFileCount: mdFiles.length,
  }
}
