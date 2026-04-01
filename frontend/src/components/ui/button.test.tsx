import { render, screen, fireEvent } from '@testing-library/react'
import { Button } from './button'

describe('Button Component', () => {
  test('renders button with text', () => {
    render(<Button>Click Me</Button>)
    const button = screen.getByText('Click Me')
    expect(button).toBeInTheDocument()
  })

  test('renders button with variant', () => {
    render(<Button variant="secondary">Secondary Button</Button>)
    const button = screen.getByText('Secondary Button')
    expect(button).toBeInTheDocument()
  })

  test('renders button with size', () => {
    render(<Button size="sm">Small Button</Button>)
    const button = screen.getByText('Small Button')
    expect(button).toBeInTheDocument()
  })

  test('calls onClick handler when clicked', () => {
    const onClick = vi.fn()
    render(<Button onClick={onClick}>Click Me</Button>)
    const button = screen.getByText('Click Me')
    fireEvent.click(button)
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  test('renders disabled button', () => {
    render(<Button disabled>Disabled Button</Button>)
    const button = screen.getByText('Disabled Button')
    expect(button).toBeDisabled()
  })
})
