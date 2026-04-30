/**
 * @jest-environment jsdom
 */
import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import { ChatHeaderEntryButton } from '../chat-header-entry-button'

describe('ChatHeaderEntryButton', () => {
  test('renders a Link that navigates to /chat', () => {
    render(<ChatHeaderEntryButton />)
    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', '/chat')
  })

  test("has aria-label 'Conversar com a Dona Flora'", () => {
    render(<ChatHeaderEntryButton />)
    // The accessible name lives on the button; base-ui merges render={<Link />}
    // so the anchor inherits the aria-label. getByLabelText covers either host.
    expect(screen.getByLabelText('Conversar com a Dona Flora')).toBeInTheDocument()
  })

  test('renders the Sparkles icon as an SVG (aria-hidden)', () => {
    const { container } = render(<ChatHeaderEntryButton />)
    // lucide-react renders an <svg> with the icon class. Sparkles has a
    // recognisable class fragment.
    const svg = container.querySelector('svg')
    expect(svg).not.toBeNull()
    // Decorative icon — must be aria-hidden so the aria-label on the button
    // remains the single source of truth for the accessible name.
    expect(svg).toHaveAttribute('aria-hidden', 'true')
  })
})
