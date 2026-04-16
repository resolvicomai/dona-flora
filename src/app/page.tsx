import { listBooks } from '@/lib/books/library-service'

export default async function HomePage() {
  const books = await listBooks()
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight text-zinc-100">
          Dona Flora
        </h1>
        <p className="mt-2 text-zinc-400">Biblioteca Pessoal com IA</p>
      </div>

      <div className="rounded-xl border border-zinc-800 bg-zinc-900 px-8 py-5">
        <p className="text-sm text-zinc-400">
          Biblioteca conectada —{' '}
          <span className="font-semibold text-zinc-100">
            {books.length} livro{books.length !== 1 ? 's' : ''}
          </span>{' '}
          encontrado{books.length !== 1 ? 's' : ''}
        </p>
      </div>
    </main>
  )
}
