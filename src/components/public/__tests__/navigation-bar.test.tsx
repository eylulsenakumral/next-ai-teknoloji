// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { render, screen, fireEvent } from '@testing-library/react'

// Mock next/link
vi.mock('next/link', () => ({
  __esModule: true,
  default: ({
    children,
    href,
    ...props
  }: {
    children: React.ReactNode
    href: string
    [key: string]: unknown
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}))

// Import after mocks
import { NavigationBar } from '../navigation-bar'

describe('NavigationBar', () => {
  describe('Rendering', () => {
    it('renders navigation with correct role', () => {
      render(<NavigationBar />)
      expect(screen.getByRole('navigation', { name: /ana navigasyon/i })).toBeInTheDocument()
    })

    it('renders All Categories button', () => {
      render(<NavigationBar />)
      expect(screen.getByText(/tüm kategoriler/i)).toBeInTheDocument()
    })

    it('renders menu icon', () => {
      render(<NavigationBar />)
      const menuIcon = document.querySelector('svg')
      expect(menuIcon).toBeInTheDocument()
    })

    it('renders desktop navigation links', () => {
      render(<NavigationBar />)
      
      expect(screen.getByText('ANA SAYFA')).toBeInTheDocument()
      expect(screen.getByText('ÜRÜNLER')).toBeInTheDocument()
      expect(screen.getByText('MARKALAR')).toBeInTheDocument()
      expect(screen.getByText('GARANTİ TAKİP')).toBeInTheDocument()
    })
  })

  describe('Navigation Links', () => {
    it('renders Ana Sayfa link with correct href', () => {
      render(<NavigationBar />)
      const link = screen.getByText('ANA SAYFA').closest('a')
      expect(link).toHaveAttribute('href', '/')
    })

    it('renders Urunler link with correct href', () => {
      render(<NavigationBar />)
      const link = screen.getByText('ÜRÜNLER').closest('a')
      expect(link).toHaveAttribute('href', '/katalog')
    })

    it('renders Markalar link with correct href', () => {
      render(<NavigationBar />)
      const markalarLink = screen.getByText('MARKALAR').closest('a')
      expect(markalarLink).toHaveAttribute('href', '/markalar')
    })

    it('renders Garanti Takip link with correct href', () => {
      render(<NavigationBar />)
      const garantiLink = screen.getByText('GARANTİ TAKİP').closest('a')
      expect(garantiLink).toHaveAttribute('href', '/garanti-takip')
    })
  })

  describe('Mega Menu Toggle', () => {
    it('renders All Categories button with aria-expanded', () => {
      render(<NavigationBar />)
      const button = screen.getByRole('button', { name: /tüm kategoriler/i })
      expect(button).toHaveAttribute('aria-expanded', 'false')
    })

    it('toggles mega menu on button click', () => {
      render(<NavigationBar />)
      const button = screen.getByRole('button', { name: /tüm kategoriler/i })
      
      fireEvent.click(button)
      expect(screen.getByRole('menu')).toBeInTheDocument()
      
      fireEvent.click(button)
      expect(screen.queryByRole('menu')).not.toBeInTheDocument()
    })
  })

  describe('Styling', () => {
    it('applies correct container class', () => {
      const { container } = render(<NavigationBar />)
      const nav = container.querySelector('nav')
      expect(nav?.className).toContain('w-full')
      expect(nav?.className).toContain('bg-white')
    })

    it('applies correct height to menu bar', () => {
      const { container } = render(<NavigationBar />)
      const menuBar = container.querySelector('.hidden.md\\:flex')
      expect(menuBar?.className).toContain('h-[50px]')
    })

    it('All Categories button has correct styling', () => {
      render(<NavigationBar />)
      const button = screen.getByRole('button', { name: /tüm kategoriler/i })
      expect(button.className).toContain('bg-[var(--color-primary)]')
      expect(button.className).toContain('hover:bg-[#06B6D4]')
    })

    it('navigation links have hover color', () => {
      const { container } = render(<NavigationBar />)
      const navLinks = container.querySelectorAll('nav ul li a')
      navLinks.forEach(link => {
        expect(link.className).toContain('hover:text-[var(--color-primary)]')
      })
    })
  })

  describe('Accessibility', () => {
    it('has accessible navigation landmark', () => {
      render(<NavigationBar />)
      expect(screen.getByRole('navigation')).toBeInTheDocument()
    })

    it('has aria-label on navigation', () => {
      render(<NavigationBar />)
      const nav = screen.getByRole('navigation')
      expect(nav).toHaveAttribute('aria-label')
    })

    it('All Categories button has aria-expanded', () => {
      render(<NavigationBar />)
      const button = screen.getByRole('button', { name: /tüm kategoriler/i })
      expect(button).toHaveAttribute('aria-expanded')
    })

    it('All Categories button has aria-haspopup', () => {
      render(<NavigationBar />)
      const button = screen.getByRole('button', { name: /tüm kategoriler/i })
      expect(button).toHaveAttribute('aria-haspopup', 'true')
    })

    it('has accessible menu icon with aria-hidden', () => {
      render(<NavigationBar />)
      const menuIcon = document.querySelector('svg[aria-hidden="true"]')
      expect(menuIcon).toBeInTheDocument()
    })
  })

  describe('Responsive Behavior', () => {
    it('hides menu items on small screens', () => {
      const { container } = render(<NavigationBar />)
      const menuBar = container.querySelector('.hidden.md\\:flex')
      expect(menuBar?.className).toContain('hidden')
      expect(menuBar?.className).toContain('md:flex')
    })
  })
})
