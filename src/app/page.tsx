import { listBooks } from '@/lib/books/library-service'

export default async function HomePage() {
  const books = await listBooks()
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <h1 className="text-3xl font-bold">Dona Flora</h1>
      <p className="mt-2 text-gray-500">Biblioteca Pessoal com IA</p>
      <div className="mt-8 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <p className="text-lg">
          Biblioteca conectada.{' '}
          <span className="font-semibold">{books.length}</span>{' '}
          livro{books.length !== 1 ? 's' : ''} encontrado{books.length !== 1 ? 's' : ''}.
        </p>
      </div>
    </main>
  )
}
