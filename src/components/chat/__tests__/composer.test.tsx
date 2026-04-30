/**
 * @jest-environment jsdom
 */
import '@testing-library/jest-dom'
import { useState } from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Composer } from '../composer'

type Status = 'ready' | 'submitted' | 'streaming' | 'error'

interface HarnessProps {
  initialStatus?: Status
  initialInput?: string
  onSubmit: () => void
  onStop: () => void
}

// A tiny parent component that owns the input state for controlled Composer testing.
function Harness({ initialStatus = 'ready', initialInput = '', onSubmit, onStop }: HarnessProps) {
  const [input, setInput] = useState(initialInput)
  return (
    <Composer
      input={input}
      onInputChange={setInput}
      onSubmit={onSubmit}
      onStop={onStop}
      status={initialStatus}
    />
  )
}

describe('Composer', () => {
  test('Enter submits and calls onSubmit when status is ready and input non-empty', async () => {
    const onSubmit = jest.fn()
    const onStop = jest.fn()
    render(<Harness initialInput="oi" onSubmit={onSubmit} onStop={onStop} />)
    const ta = screen.getByRole('textbox')
    // Plain Enter
    fireEvent.keyDown(ta, { key: 'Enter', shiftKey: false })
    expect(onSubmit).toHaveBeenCalledTimes(1)
  })

  test('Shift+Enter does NOT submit', async () => {
    const onSubmit = jest.fn()
    const onStop = jest.fn()
    render(<Harness initialInput="oi" onSubmit={onSubmit} onStop={onStop} />)
    const ta = screen.getByRole('textbox')
    fireEvent.keyDown(ta, { key: 'Enter', shiftKey: true })
    expect(onSubmit).not.toHaveBeenCalled()
  })

  test('Escape during streaming calls onStop', async () => {
    const onSubmit = jest.fn()
    const onStop = jest.fn()
    render(
      <Harness initialInput="" initialStatus="streaming" onSubmit={onSubmit} onStop={onStop} />,
    )
    const ta = screen.getByRole('textbox')
    fireEvent.keyDown(ta, { key: 'Escape' })
    expect(onStop).toHaveBeenCalledTimes(1)
  })

  test('Send button is disabled when input is empty', () => {
    const onSubmit = jest.fn()
    const onStop = jest.fn()
    render(<Harness initialInput="" onSubmit={onSubmit} onStop={onStop} />)
    const sendBtn = screen.getByRole('button', { name: 'Enviar mensagem' })
    // base-ui buttons expose data-disabled or aria-disabled; assert via either form.
    const disabled =
      sendBtn.hasAttribute('disabled') ||
      sendBtn.getAttribute('aria-disabled') === 'true' ||
      sendBtn.hasAttribute('data-disabled')
    expect(disabled).toBe(true)
  })

  test("Send button is disabled when status is 'submitted' (Stop button shown instead)", () => {
    const onSubmit = jest.fn()
    const onStop = jest.fn()
    render(
      <Harness initialInput="oi" initialStatus="submitted" onSubmit={onSubmit} onStop={onStop} />,
    )
    // During 'submitted' the Send button is not in the DOM — Stop takes its place.
    expect(screen.queryByRole('button', { name: 'Enviar mensagem' })).toBeNull()
    expect(screen.getByRole('button', { name: 'Parar de gerar resposta' })).toBeInTheDocument()
  })

  test("Shows Stop button when status is 'streaming'", () => {
    const onSubmit = jest.fn()
    const onStop = jest.fn()
    render(
      <Harness initialInput="" initialStatus="streaming" onSubmit={onSubmit} onStop={onStop} />,
    )
    const stop = screen.getByRole('button', {
      name: 'Parar de gerar resposta',
    })
    expect(stop).toBeInTheDocument()
  })

  test("Has aria-label 'Mensagem para a Dona Flora' on textarea", () => {
    const onSubmit = jest.fn()
    const onStop = jest.fn()
    render(<Harness initialInput="" onSubmit={onSubmit} onStop={onStop} />)
    expect(screen.getByLabelText('Mensagem para a Dona Flora')).toBeInTheDocument()
  })

  test('user types and sends via Enter', async () => {
    const user = userEvent.setup()
    const onSubmit = jest.fn()
    const onStop = jest.fn()
    render(<Harness initialInput="" onSubmit={onSubmit} onStop={onStop} />)
    const ta = screen.getByRole('textbox')
    await user.type(ta, 'olá')
    await user.keyboard('{Enter}')
    expect(onSubmit).toHaveBeenCalledTimes(1)
  })

  test('composer stays sticky at the bottom of the chat panel', () => {
    const onSubmit = jest.fn()
    const onStop = jest.fn()
    const { container } = render(<Harness initialInput="" onSubmit={onSubmit} onStop={onStop} />)

    const form = container.querySelector('form')
    expect(form).not.toBeNull()
    expect(form?.className).toContain('sticky')
    expect(form?.className).toContain('bottom-0')
    expect(form?.className).toContain('pb-[env(safe-area-inset-bottom)]')
  })
})
